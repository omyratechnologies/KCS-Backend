import { IDiscountRule, IDiscountApplication, IDiscountSummary } from "@/models/discount_rule.model";
import { IFeeData } from "@/models/fee.model";

export interface DiscountEligibilityResult {
    eligible: boolean;
    applicable_discounts: Array<{
        rule: IDiscountRule;
        discount_amount: number;
        discount_percentage: number;
        reason: string;
    }>;
    total_discount: number;
    total_discount_percentage: number;
    original_amount: number;
    final_amount: number;
}

export interface BulkDiscountRequest {
    student_ids: string[];
    discount_rule_id: string;
    reason?: string;
}

export class DiscountService {
    
    // ========================= DISCOUNT RULE MANAGEMENT =========================
    
    /**
     * Create a new discount rule
     */
    static async createDiscountRule(
        campus_id: string,
        ruleData: Omit<IDiscountRule, 'id' | 'campus_id' | 'used_count' | 'created_at' | 'updated_at'>,
        created_by: string
    ): Promise<IDiscountRule> {
        try {
            const { DiscountRule } = await import("@/models/discount_rule.model");
            
            const discountRule: IDiscountRule = {
                ...ruleData,
                id: `discount_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                campus_id,
                used_count: 0,
                created_by,
                created_at: new Date(),
                updated_at: new Date()
            };

            // Validate rule conditions
            await this.validateDiscountRule(discountRule);

            const result = await DiscountRule.create(discountRule);
            
            return result;
        } catch (error) {
            throw new Error(`Failed to create discount rule: ${error}`);
        }
    }

    /**
     * Get all discount rules for a campus
     */
    static async getDiscountRules(
        campus_id: string,
        filters?: {
            is_active?: boolean;
            discount_type?: string;
            academic_year?: string;
        }
    ): Promise<IDiscountRule[]> {
        try {
            const { DiscountRule } = await import("@/models/discount_rule.model");
            
            const query: any = { campus_id };
            
            if (filters?.is_active !== undefined) {
                query.is_active = filters.is_active;
            }
            
            if (filters?.discount_type) {
                query.discount_type = filters.discount_type;
            }
            
            if (filters?.academic_year) {
                query["conditions.academic_year"] = filters.academic_year;
            }

            const result = await DiscountRule.find(query, { sort: { priority: "DESC" } });
            return result.rows || [];
        } catch (error) {
            throw new Error(`Failed to get discount rules: ${error}`);
        }
    }

    /**
     * Update discount rule
     */
    static async updateDiscountRule(
        rule_id: string,
        campus_id: string,
        updates: Partial<IDiscountRule>
    ): Promise<IDiscountRule> {
        try {
            const { DiscountRule } = await import("@/models/discount_rule.model");
            
            const rule = await DiscountRule.findOne({ id: rule_id, campus_id });
            if (!rule) {
                throw new Error("Discount rule not found");
            }

            const updatedRule = {
                ...rule,
                ...updates,
                updated_at: new Date()
            };

            await this.validateDiscountRule(updatedRule);
            await DiscountRule.updateById(rule_id, updatedRule);
            
            return updatedRule;
        } catch (error) {
            throw new Error(`Failed to update discount rule: ${error}`);
        }
    }

    /**
     * Delete discount rule
     */
    static async deleteDiscountRule(rule_id: string, campus_id: string): Promise<void> {
        try {
            const { DiscountRule } = await import("@/models/discount_rule.model");
            
            const rule = await DiscountRule.findOne({ id: rule_id, campus_id });
            if (!rule) {
                throw new Error("Discount rule not found");
            }

            // Check if rule is being used
            const { DiscountApplication } = await import("@/models/discount_rule.model");
            const applications = await DiscountApplication.find({ 
                discount_rule_id: rule_id,
                status: { $in: ["approved", "applied"] }
            });

            if (applications.rows && applications.rows.length > 0) {
                throw new Error("Cannot delete discount rule that has active applications");
            }

            await DiscountRule.deleteById(rule_id);
        } catch (error) {
            throw new Error(`Failed to delete discount rule: ${error}`);
        }
    }

    // ========================= DISCOUNT ELIGIBILITY & APPLICATION =========================

    /**
     * Check discount eligibility for a fee
     */
    static async checkDiscountEligibility(
        campus_id: string,
        fee: IFeeData,
        student_id: string
    ): Promise<DiscountEligibilityResult> {
        try {
            const { UserService } = await import("@/services/users.service");
            const { Class } = await import("@/models/class.model");
            
            const student = await UserService.getUser(student_id);
            const studentClass = await Class.findOne({ 
                campus_id, 
                student_ids: { $in: [student_id] }
            });

            const rules = await this.getDiscountRules(campus_id, { is_active: true });
            const applicableDiscounts: Array<{
                rule: IDiscountRule;
                discount_amount: number;
                discount_percentage: number;
                reason: string;
            }> = [];
            let totalDiscount = 0;

            for (const rule of rules) {
                const eligibility = await this.evaluateRuleConditions(rule, fee, student, studentClass);
                
                if (eligibility.eligible) {
                    const discountAmount = this.calculateDiscountAmount(rule, fee.total_amount);
                    const discountPercentage = (discountAmount / fee.total_amount) * 100;
                    
                    applicableDiscounts.push({
                        rule,
                        discount_amount: discountAmount,
                        discount_percentage: discountPercentage,
                        reason: eligibility.reason
                    });

                    if (rule.is_stackable) {
                        totalDiscount += discountAmount;
                    } else {
                        // If not stackable, use the highest discount
                        totalDiscount = Math.max(totalDiscount, discountAmount);
                    }
                }
            }

            // Apply priority and max limits
            const finalDiscount = Math.min(totalDiscount, fee.total_amount);
            const finalAmount = fee.total_amount - finalDiscount;

            return {
                eligible: applicableDiscounts.length > 0,
                applicable_discounts: applicableDiscounts,
                total_discount: finalDiscount,
                total_discount_percentage: (finalDiscount / fee.total_amount) * 100,
                original_amount: fee.total_amount,
                final_amount: finalAmount
            };
        } catch (error) {
            throw new Error(`Failed to check discount eligibility: ${error}`);
        }
    }

    /**
     * Apply discount to a fee
     */
    static async applyDiscount(
        campus_id: string,
        fee_id: string,
        student_id: string,
        discount_rule_id: string,
        applied_by: string,
        application_reason?: string
    ): Promise<IDiscountApplication> {
        try {
            const { Fee } = await import("@/models/fee.model");
            const { DiscountApplication } = await import("@/models/discount_rule.model");
            
            const fee = await Fee.findById(fee_id);
            if (!fee || fee.campus_id !== campus_id) {
                throw new Error("Fee not found");
            }

            const eligibility = await this.checkDiscountEligibility(campus_id, fee, student_id);
            const applicableDiscount = eligibility.applicable_discounts.find(
                d => d.rule.id === discount_rule_id
            );

            if (!applicableDiscount) {
                throw new Error("Student is not eligible for this discount");
            }

            const rule = applicableDiscount.rule;
            const discountApplication: IDiscountApplication = {
                id: `discount_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                campus_id,
                discount_rule_id,
                fee_id,
                student_id,
                parent_id: fee.parent_id,
                discount_amount: applicableDiscount.discount_amount,
                applied_percentage: applicableDiscount.discount_percentage,
                original_amount: fee.total_amount,
                discounted_amount: fee.total_amount - applicableDiscount.discount_amount,
                status: rule.requires_approval ? "pending" : "approved",
                application_reason,
                applied_by,
                created_at: new Date(),
                updated_at: new Date()
            };

            if (!rule.requires_approval) {
                discountApplication.approved_by = applied_by;
                discountApplication.approved_at = new Date();
                discountApplication.status = "applied";
                
                // Update fee with discount
                await this.applyDiscountToFee(fee, applicableDiscount.discount_amount);
            }

            await DiscountApplication.create(discountApplication);
            
            // Update rule usage count
            await this.updateRuleUsageCount(discount_rule_id);

            return discountApplication;
        } catch (error) {
            throw new Error(`Failed to apply discount: ${error}`);
        }
    }

    /**
     * Approve discount application
     */
    static async approveDiscountApplication(
        application_id: string,
        campus_id: string,
        approved_by: string
    ): Promise<void> {
        try {
            const { DiscountApplication } = await import("@/models/discount_rule.model");
            const { Fee } = await import("@/models/fee.model");
            
            const application = await DiscountApplication.findOne({
                id: application_id,
                campus_id,
                status: "pending"
            });

            if (!application) {
                throw new Error("Discount application not found or already processed");
            }

            const fee = await Fee.findById(application.fee_id);
            if (!fee) {
                throw new Error("Associated fee not found");
            }

            // Apply discount to fee
            await this.applyDiscountToFee(fee, application.discount_amount);

            // Update application status
            await DiscountApplication.updateById(application_id, {
                status: "applied",
                approved_by,
                approved_at: new Date(),
                updated_at: new Date()
            });
        } catch (error) {
            throw new Error(`Failed to approve discount application: ${error}`);
        }
    }

    /**
     * Reject discount application
     */
    static async rejectDiscountApplication(
        application_id: string,
        campus_id: string,
        rejected_by: string,
        rejection_reason: string
    ): Promise<void> {
        try {
            const { DiscountApplication } = await import("@/models/discount_rule.model");
            
            await DiscountApplication.updateOne(
                { id: application_id, campus_id, status: "pending" },
                {
                    status: "rejected",
                    approved_by: rejected_by,
                    approved_at: new Date(),
                    rejection_reason,
                    updated_at: new Date()
                }
            );
        } catch (error) {
            throw new Error(`Failed to reject discount application: ${error}`);
        }
    }

    // ========================= BULK OPERATIONS =========================

    /**
     * Apply discount to multiple students
     */
    static async applyBulkDiscount(
        campus_id: string,
        request: BulkDiscountRequest,
        applied_by: string
    ): Promise<{
        successful: number;
        failed: number;
        applications: IDiscountApplication[];
        errors: Array<{ student_id: string; error: string }>;
    }> {
        const results = {
            successful: 0,
            failed: 0,
            applications: [] as IDiscountApplication[],
            errors: [] as Array<{ student_id: string; error: string }>
        };

        for (const student_id of request.student_ids) {
            try {
                // Get student's fees
                const { Fee } = await import("@/models/fee.model");
                const studentFees = await Fee.find({
                    campus_id,
                    user_id: student_id,
                    payment_status: { $ne: "paid" }
                });

                for (const fee of studentFees.rows || []) {
                    const application = await this.applyDiscount(
                        campus_id,
                        fee.id,
                        student_id,
                        request.discount_rule_id,
                        applied_by,
                        request.reason
                    );
                    
                    results.applications.push(application);
                }
                
                results.successful++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    student_id,
                    error: error instanceof Error ? error.message : "Unknown error"
                });
            }
        }

        return results;
    }

    // ========================= ANALYTICS & REPORTING =========================

    /**
     * Get discount summary and analytics
     */
    static async getDiscountSummary(
        campus_id: string,
        date_range?: { start_date: Date; end_date: Date }
    ): Promise<IDiscountSummary> {
        try {
            const { DiscountApplication } = await import("@/models/discount_rule.model");
            const { Class } = await import("@/models/class.model");
            
            const query: any = {
                campus_id,
                status: "applied"
            };

            if (date_range) {
                query.applied_at = {
                    $gte: date_range.start_date,
                    $lte: date_range.end_date
                };
            }

            const applications = await DiscountApplication.find(query);
            const applicationData = applications.rows || [];

            const totalDiscountsGiven = applicationData.length;
            const totalDiscountAmount = applicationData.reduce((sum, app) => sum + app.discount_amount, 0);
            const uniqueStudents = new Set(applicationData.map(app => app.student_id));
            const totalStudentsBenefited = uniqueStudents.size;

            // Group by discount type
            const discountByType = new Map<string, { count: number; amount: number }>();
            for (const app of applicationData) {
                const rule = await this.getDiscountRuleById(app.discount_rule_id);
                if (rule) {
                    const existing = discountByType.get(rule.discount_type) || { count: 0, amount: 0 };
                    discountByType.set(rule.discount_type, {
                        count: existing.count + 1,
                        amount: existing.amount + app.discount_amount
                    });
                }
            }

            // Group by class
            const discountByClass = new Map<string, { count: number; amount: number }>();
            const classes = await Class.find({ campus_id });
            
            for (const app of applicationData) {
                const studentClass = (classes.rows || []).find(cls => 
                    cls.student_ids && cls.student_ids.includes(app.student_id)
                );
                
                const className = studentClass?.name || "Unknown";
                const existing = discountByClass.get(className) || { count: 0, amount: 0 };
                discountByClass.set(className, {
                    count: existing.count + 1,
                    amount: existing.amount + app.discount_amount
                });
            }

            // Top discount rules
            const ruleUsage = new Map<string, { count: number; amount: number; name: string }>();
            for (const app of applicationData) {
                const rule = await this.getDiscountRuleById(app.discount_rule_id);
                if (rule) {
                    const existing = ruleUsage.get(rule.id) || { count: 0, amount: 0, name: rule.name };
                    ruleUsage.set(rule.id, {
                        count: existing.count + 1,
                        amount: existing.amount + app.discount_amount,
                        name: rule.name
                    });
                }
            }

            return {
                total_discounts_given: totalDiscountsGiven,
                total_discount_amount: totalDiscountAmount,
                total_students_benefited: totalStudentsBenefited,
                discount_by_type: Array.from(discountByType.entries()).map(([type, data]) => ({
                    type,
                    count: data.count,
                    amount: data.amount
                })),
                discount_by_class: Array.from(discountByClass.entries()).map(([className, data]) => ({
                    class_name: className,
                    count: data.count,
                    amount: data.amount
                })),
                top_discount_rules: Array.from(ruleUsage.values())
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 10)
                    .map(rule => ({
                        rule_name: rule.name,
                        usage_count: rule.count,
                        total_amount: rule.amount
                    }))
            };
        } catch (error) {
            throw new Error(`Failed to get discount summary: ${error}`);
        }
    }

    // ========================= HELPER METHODS =========================

    private static async validateDiscountRule(rule: IDiscountRule): Promise<void> {
        // Validate discount value
        if (rule.discount_type === "percentage" && (rule.discount_value < 0 || rule.discount_value > 100)) {
            throw new Error("Percentage discount must be between 0 and 100");
        }

        if (rule.discount_type === "fixed_amount" && rule.discount_value < 0) {
            throw new Error("Fixed amount discount must be positive");
        }

        // Validate conditions
        if (rule.conditions.valid_from && rule.conditions.valid_until) {
            if (rule.conditions.valid_from >= rule.conditions.valid_until) {
                throw new Error("Valid from date must be before valid until date");
            }
        }

        // Additional validations...
    }

    private static async evaluateRuleConditions(
        rule: IDiscountRule,
        fee: IFeeData,
        student: any,
        studentClass: any
    ): Promise<{ eligible: boolean; reason: string }> {
        const conditions = rule.conditions;

        // Check academic year
        if (conditions.academic_year && fee.academic_year !== conditions.academic_year) {
            return { eligible: false, reason: "Academic year mismatch" };
        }

        // Check fee categories
        if (conditions.applicable_fee_categories && conditions.applicable_fee_categories.length > 0) {
            const feeCategories = fee.items.map(item => item.category_id);
            const hasApplicableCategory = conditions.applicable_fee_categories.some(cat => 
                feeCategories.includes(cat)
            );
            if (!hasApplicableCategory) {
                return { eligible: false, reason: "Fee category not applicable" };
            }
        }

        // Check classes
        if (conditions.applicable_classes && conditions.applicable_classes.length > 0) {
            if (!studentClass || !conditions.applicable_classes.includes(studentClass.id)) {
                return { eligible: false, reason: "Class not applicable" };
            }
        }

        // Check amount limits
        if (conditions.min_amount && fee.total_amount < conditions.min_amount) {
            return { eligible: false, reason: "Amount below minimum" };
        }

        if (conditions.max_amount && fee.total_amount > conditions.max_amount) {
            return { eligible: false, reason: "Amount above maximum" };
        }

        // Check date validity
        const now = new Date();
        if (conditions.valid_from && now < conditions.valid_from) {
            return { eligible: false, reason: "Discount not yet valid" };
        }

        if (conditions.valid_until && now > conditions.valid_until) {
            return { eligible: false, reason: "Discount expired" };
        }

        // Check early payment (simplified)
        if (conditions.early_payment_days && fee.items.length > 0) {
            const dueDate = new Date(fee.items[0].due_date);
            const earlyPaymentDeadline = new Date(dueDate.getTime() - (conditions.early_payment_days * 24 * 60 * 60 * 1000));
            if (now > earlyPaymentDeadline) {
                return { eligible: false, reason: "Early payment deadline passed" };
            }
        }

        // Additional condition checks can be added here...

        return { eligible: true, reason: "All conditions met" };
    }

    private static calculateDiscountAmount(rule: IDiscountRule, originalAmount: number): number {
        let discountAmount = 0;

        switch (rule.discount_type) {
            case "percentage":
                discountAmount = (originalAmount * rule.discount_value) / 100;
                break;
            case "fixed_amount":
                discountAmount = rule.discount_value;
                break;
            default:
                discountAmount = 0;
        }

        // Apply maximum discount limit
        if (rule.max_discount_amount) {
            discountAmount = Math.min(discountAmount, rule.max_discount_amount);
        }

        return Math.min(discountAmount, originalAmount);
    }

    private static async applyDiscountToFee(fee: IFeeData, discountAmount: number): Promise<void> {
        const { Fee } = await import("@/models/fee.model");
        
        const updatedFee = {
            ...fee,
            discount_amount: (fee.discount_amount || 0) + discountAmount,
            due_amount: fee.due_amount - discountAmount,
            updated_at: new Date()
        };

        await Fee.updateById(fee.id, updatedFee);
    }

    private static async updateRuleUsageCount(rule_id: string): Promise<void> {
        const { DiscountRule } = await import("@/models/discount_rule.model");
        
        const rule = await DiscountRule.findById(rule_id);
        if (rule) {
            await DiscountRule.updateById(rule_id, {
                used_count: rule.used_count + 1,
                updated_at: new Date()
            });
        }
    }

    private static async getDiscountRuleById(rule_id: string): Promise<IDiscountRule | null> {
        try {
            const { DiscountRule } = await import("@/models/discount_rule.model");
            return await DiscountRule.findById(rule_id);
        } catch (error) {
            return null;
        }
    }
}
