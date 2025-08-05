import { IFeeData } from "@/models/fee.model";
import { IPaymentTransaction } from "@/models/payment_transaction.model";

export interface BulkFeeGenerationRequest {
    template_id: string;
    academic_year: string;
    class_ids?: string[]; // If not provided, apply to all classes
    student_ids?: string[]; // If not provided, apply to all students in selected classes
    fee_categories?: string[]; // If not provided, include all categories from template
    custom_amounts?: { [student_id: string]: number }; // Custom amounts for specific students
    apply_discounts?: boolean;
    due_date_override?: Date;
    installments_allowed?: boolean;
    send_notifications?: boolean;
}

export interface BulkPaymentProcessingRequest {
    student_ids: string[];
    fee_ids?: string[]; // If not provided, process all pending fees for students
    payment_gateway: "razorpay" | "payu" | "cashfree";
    payment_method?: string;
    auto_approve?: boolean; // For admin-initiated bulk payments
    send_notifications?: boolean;
}

export interface BulkOperationResult<T> {
    total_requested: number;
    successful: number;
    failed: number;
    skipped: number;
    results: T[];
    errors: Array<{
        entity_id: string;
        error: string;
        details?: any;
    }>;
    summary: {
        total_amount?: number;
        success_rate: number;
        processing_time_ms: number;
    };
}

export interface BulkFeeResult {
    student_id: string;
    student_name: string;
    class_name: string;
    fee_id: string;
    amount: number;
    status: "created" | "failed" | "skipped";
    reason?: string;
}

export interface BulkPaymentResult {
    student_id: string;
    student_name: string;
    fee_id: string;
    transaction_id?: string;
    amount: number;
    status: "initiated" | "completed" | "failed" | "skipped";
    payment_url?: string;
    reason?: string;
}

export class BulkOperationsService {
    // ========================= BULK FEE GENERATION =========================

    /**
     * Generate fees for multiple students from a template
     */
    static async generateBulkFees(
        campus_id: string,
        request: BulkFeeGenerationRequest,
        created_by: string
    ): Promise<BulkOperationResult<BulkFeeResult>> {
        const startTime = Date.now();
        const result: BulkOperationResult<BulkFeeResult> = {
            total_requested: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            results: [],
            errors: [],
            summary: {
                total_amount: 0,
                success_rate: 0,
                processing_time_ms: 0,
            },
        };

        try {
            const { FeeTemplate } = await import("@/models/fee_template.model");
            const { Class } = await import("@/models/class.model");
            const { UserService } = await import("@/services/users.service");
            const { Fee } = await import("@/models/fee.model");

            // Get the fee template
            const template = await FeeTemplate.findOne({
                id: request.template_id,
                campus_id,
            });

            if (!template) {
                throw new Error("Fee template not found");
            }

            // Get target students
            const targetStudents = await this.getTargetStudents(campus_id, request.class_ids, request.student_ids);

            result.total_requested = targetStudents.length;

            // Process each student
            for (const student of targetStudents) {
                try {
                    // Check if fee already exists
                    const existingFee = await Fee.findOne({
                        campus_id,
                        user_id: student.id,
                        academic_year: request.academic_year,
                        fee_template_id: request.template_id,
                    });

                    if (existingFee) {
                        result.skipped++;
                        result.results.push({
                            student_id: student.id,
                            student_name: `${student.first_name} ${student.last_name}`,
                            class_name: student.class_name,
                            fee_id: existingFee.id,
                            amount: existingFee.total_amount,
                            status: "skipped",
                            reason: "Fee already exists",
                        });
                        continue;
                    }

                    // Calculate fee amount
                    const customAmount = request.custom_amounts?.[student.id];
                    const feeAmount = customAmount || template.total_amount;

                    // Create fee items from template
                    const feeItems = template.fee_structure.map((item) => ({
                        category_id: item.category_id,
                        fee_type: "template",
                        amount: customAmount ? (item.amount / template.total_amount) * customAmount : item.amount,
                        name: item.category_name,
                        due_date: request.due_date_override || item.due_date,
                        is_mandatory: item.is_mandatory,
                        late_fee_applicable: item.late_fee_applicable,
                    }));

                    // Create the fee
                    const newFee: Partial<IFeeData> = {
                        campus_id,
                        user_id: student.id,
                        parent_id: student.parent_id,
                        class_id: student.class_id,
                        academic_year: request.academic_year,
                        fee_template_id: request.template_id,
                        items: feeItems,
                        total_amount: feeAmount,
                        paid_amount: 0,
                        due_amount: feeAmount,
                        discount_amount: 0,
                        late_fee_amount: 0,
                        payment_status: "unpaid",
                        is_paid: false,
                        installments_allowed: request.installments_allowed ?? false,
                        auto_late_fee: true,
                        reminder_sent: {
                            email_count: 0,
                            sms_count: 0,
                        },
                        meta_data: {
                            created_by,
                            bulk_generation: true,
                            template_used: request.template_id,
                        },
                        created_at: new Date(),
                        updated_at: new Date(),
                    };

                    const createdFee = await Fee.create(newFee);

                    // Apply discounts if requested
                    if (request.apply_discounts) {
                        await this.applyAutoDiscounts(campus_id, createdFee.id, student.id);
                    }

                    result.successful++;
                    result.summary.total_amount = (result.summary.total_amount || 0) + feeAmount;

                    result.results.push({
                        student_id: student.id,
                        student_name: `${student.first_name} ${student.last_name}`,
                        class_name: student.class_name,
                        fee_id: createdFee.id,
                        amount: feeAmount,
                        status: "created",
                    });

                    // Send notification if requested
                    if (request.send_notifications) {
                        await this.sendFeeGenerationNotification(campus_id, createdFee, student);
                    }
                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        entity_id: student.id,
                        error: error instanceof Error ? error.message : "Unknown error",
                        details: {
                            student_name: `${student.first_name} ${student.last_name}`,
                        },
                    });
                }
            }

            result.summary.success_rate = (result.successful / result.total_requested) * 100;
            result.summary.processing_time_ms = Date.now() - startTime;

            return result;
        } catch (error) {
            throw new Error(`Bulk fee generation failed: ${error}`);
        }
    }

    // ========================= BULK PAYMENT PROCESSING =========================

    /**
     * Process payments for multiple students/fees
     */
    static async processBulkPayments(
        campus_id: string,
        request: BulkPaymentProcessingRequest,
        processed_by: string
    ): Promise<BulkOperationResult<BulkPaymentResult>> {
        const startTime = Date.now();
        const result: BulkOperationResult<BulkPaymentResult> = {
            total_requested: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            results: [],
            errors: [],
            summary: {
                total_amount: 0,
                success_rate: 0,
                processing_time_ms: 0,
            },
        };

        try {
            const { Fee } = await import("@/models/fee.model");
            const { PaymentService } = await import("@/services/payment.service");
            const { UserService } = await import("@/services/users.service");

            // Get target fees
            const targetFees = await this.getTargetFees(campus_id, request.student_ids, request.fee_ids);

            result.total_requested = targetFees.length;

            // Process each fee
            for (const fee of targetFees) {
                try {
                    // Skip if already paid
                    if (fee.payment_status === "paid") {
                        result.skipped++;
                        const student = await UserService.getUser(fee.user_id);
                        result.results.push({
                            student_id: fee.user_id,
                            student_name: `${student.first_name} ${student.last_name}`,
                            fee_id: fee.id,
                            amount: fee.total_amount,
                            status: "skipped",
                            reason: "Already paid",
                        });
                        continue;
                    }

                    const student = await UserService.getUser(fee.user_id);

                    if (request.auto_approve) {
                        // For admin-initiated payments, mark as completed
                        await this.processAdminPayment(campus_id, fee, processed_by);

                        result.successful++;
                        result.summary.total_amount = (result.summary.total_amount || 0) + fee.due_amount;

                        result.results.push({
                            student_id: fee.user_id,
                            student_name: `${student.first_name} ${student.last_name}`,
                            fee_id: fee.id,
                            amount: fee.due_amount,
                            status: "completed",
                            reason: "Admin processed",
                        });
                    } else {
                        // Initiate normal payment process
                        const paymentResult = await PaymentService.initiatePayment(
                            campus_id,
                            fee.id,
                            fee.user_id,
                            fee.parent_id,
                            request.payment_gateway,
                            fee.due_amount,
                            `${process.env.FRONTEND_URL}/payment/callback`,
                            `${process.env.FRONTEND_URL}/payment/cancel`
                        );

                        result.successful++;
                        result.summary.total_amount = (result.summary.total_amount || 0) + fee.due_amount;

                        result.results.push({
                            student_id: fee.user_id,
                            student_name: `${student.first_name} ${student.last_name}`,
                            fee_id: fee.id,
                            transaction_id: paymentResult.transaction.id,
                            amount: fee.due_amount,
                            status: "initiated",
                            payment_url: paymentResult.payment_details?.payment_url,
                        });
                    }

                    // Send notification if requested
                    if (request.send_notifications) {
                        await this.sendPaymentNotification(campus_id, fee, student, request.auto_approve || false);
                    }
                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        entity_id: fee.id,
                        error: error instanceof Error ? error.message : "Unknown error",
                        details: {
                            student_id: fee.user_id,
                            amount: fee.due_amount,
                        },
                    });
                }
            }

            result.summary.success_rate = (result.successful / result.total_requested) * 100;
            result.summary.processing_time_ms = Date.now() - startTime;

            return result;
        } catch (error) {
            throw new Error(`Bulk payment processing failed: ${error}`);
        }
    }

    // ========================= BULK DATA OPERATIONS =========================

    /**
     * Update multiple fees with new amounts or due dates
     */
    static async updateBulkFees(
        campus_id: string,
        fee_ids: string[],
        updates: {
            amount_adjustment?: number; // Add/subtract amount
            due_date?: Date;
            late_fee_amount?: number;
            installments_allowed?: boolean;
        },
        updated_by: string
    ): Promise<BulkOperationResult<{ fee_id: string; updated_fields: string[] }>> {
        const startTime = Date.now();
        const result: BulkOperationResult<{
            fee_id: string;
            updated_fields: string[];
        }> = {
            total_requested: fee_ids.length,
            successful: 0,
            failed: 0,
            skipped: 0,
            results: [],
            errors: [],
            summary: {
                success_rate: 0,
                processing_time_ms: 0,
            },
        };

        try {
            const { Fee } = await import("@/models/fee.model");

            for (const fee_id of fee_ids) {
                try {
                    const fee = await Fee.findOne({ id: fee_id, campus_id });

                    if (!fee) {
                        result.skipped++;
                        continue;
                    }

                    const updatedFields: string[] = [];
                    const feeUpdates: any = {
                        updated_at: new Date(),
                        meta_data: {
                            ...fee.meta_data,
                            bulk_updated: true,
                            updated_by,
                            update_timestamp: new Date(),
                        },
                    };

                    if (updates.amount_adjustment) {
                        feeUpdates.total_amount = fee.total_amount + updates.amount_adjustment;
                        feeUpdates.due_amount = fee.due_amount + updates.amount_adjustment;
                        updatedFields.push("amount");
                    }

                    if (updates.due_date) {
                        feeUpdates.items = fee.items.map((item) => ({
                            ...item,
                            due_date: updates.due_date,
                        }));
                        updatedFields.push("due_date");
                    }

                    if (updates.late_fee_amount !== undefined) {
                        feeUpdates.late_fee_amount = updates.late_fee_amount;
                        updatedFields.push("late_fee");
                    }

                    if (updates.installments_allowed !== undefined) {
                        feeUpdates.installments_allowed = updates.installments_allowed;
                        updatedFields.push("installments");
                    }

                    await Fee.updateById(fee_id, feeUpdates);

                    result.successful++;
                    result.results.push({
                        fee_id,
                        updated_fields: updatedFields,
                    });
                } catch (error) {
                    result.failed++;
                    result.errors.push({
                        entity_id: fee_id,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }

            result.summary.success_rate = (result.successful / result.total_requested) * 100;
            result.summary.processing_time_ms = Date.now() - startTime;

            return result;
        } catch (error) {
            throw new Error(`Bulk fee update failed: ${error}`);
        }
    }

    // ========================= HELPER METHODS =========================

    private static async getTargetStudents(
        campus_id: string,
        class_ids?: string[],
        student_ids?: string[]
    ): Promise<any[]> {
        const { Class } = await import("@/models/class.model");
        const { UserService } = await import("@/services/users.service");

        if (student_ids && student_ids.length > 0) {
            // Get specific students
            const students: Array<any> = [];
            for (const student_id of student_ids) {
                const student = await UserService.getUser(student_id);
                const studentClass = await Class.findOne({
                    campus_id,
                    student_ids: { $in: [student_id] },
                });
                students.push({
                    ...student,
                    class_id: studentClass?.id,
                    class_name: studentClass?.name || "Unknown",
                });
            }
            return students;
        }

        // Get students from classes
        const query: any = { campus_id };
        if (class_ids && class_ids.length > 0) {
            query.id = { $in: class_ids };
        }

        const classes = await Class.find(query);
        const allStudents: Array<any> = [];

        for (const classData of classes.rows || []) {
            for (const student_id of classData.student_ids || []) {
                const student = await UserService.getUser(student_id);
                allStudents.push({
                    ...student,
                    class_id: classData.id,
                    class_name: classData.name,
                });
            }
        }

        return allStudents;
    }

    private static async getTargetFees(
        campus_id: string,
        student_ids: string[],
        fee_ids?: string[]
    ): Promise<IFeeData[]> {
        const { Fee } = await import("@/models/fee.model");

        if (fee_ids && fee_ids.length > 0) {
            const fees = await Fee.find({
                campus_id,
                id: { $in: fee_ids },
            });
            return fees.rows || [];
        }

        // Get all pending fees for students
        const fees = await Fee.find({
            campus_id,
            user_id: { $in: student_ids },
            payment_status: { $in: ["unpaid", "partial", "overdue"] },
        });

        return fees.rows || [];
    }

    private static async applyAutoDiscounts(campus_id: string, fee_id: string, student_id: string): Promise<void> {
        try {
            const { DiscountService } = await import("@/services/discount.service");
            const { Fee } = await import("@/models/fee.model");

            const fee = await Fee.findById(fee_id);
            if (!fee) {
                return;
            }

            const eligibility = await DiscountService.checkDiscountEligibility(campus_id, fee, student_id);

            for (const discount of eligibility.applicable_discounts) {
                if (discount.rule.auto_apply) {
                    await DiscountService.applyDiscount(
                        campus_id,
                        fee_id,
                        student_id,
                        discount.rule.id,
                        "system",
                        "Auto-applied during bulk generation"
                    );
                }
            }
        } catch (error) {
            console.error("Failed to apply auto discounts:", error);
        }
    }

    private static async processAdminPayment(campus_id: string, fee: IFeeData, processed_by: string): Promise<void> {
        const { Fee } = await import("@/models/fee.model");
        const { PaymentTransaction } = await import("@/models/payment_transaction.model");
        const { PaymentInvoice } = await import("@/models/payment_invoice.model");

        // Create transaction record
        const transaction: Partial<IPaymentTransaction> = {
            campus_id,
            fee_id: fee.id,
            student_id: fee.user_id,
            parent_id: fee.parent_id,
            payment_gateway: "admin",
            amount: fee.due_amount,
            currency: "INR",
            status: "success",
            payment_method: "admin_processed",
            payment_details: {
                gateway_response: {
                    processed_by,
                    processing_type: "bulk_admin",
                    timestamp: new Date(),
                },
            },
            initiated_at: new Date(),
            completed_at: new Date(),
            webhook_verified: true,
            invoice_generated: false,
            meta_data: {
                bulk_processed: true,
                processed_by,
            },
            created_at: new Date(),
            updated_at: new Date(),
        };

        const createdTransaction = await PaymentTransaction.create(transaction);

        // Update fee
        await Fee.updateById(fee.id, {
            paid_amount: fee.total_amount,
            due_amount: 0,
            payment_status: "paid",
            is_paid: true,
            payment_date: new Date(),
            payment_mode: "admin_processed",
            updated_at: new Date(),
        });

        // Generate invoice
        await this.generateInvoice(campus_id, createdTransaction, fee);
    }

    private static async generateInvoice(campus_id: string, transaction: any, fee: IFeeData): Promise<void> {
        try {
            const { PaymentInvoice } = await import("@/models/payment_invoice.model");
            const { UserService } = await import("@/services/users.service");

            const student = await UserService.getUser(fee.user_id);
            const schoolData = await this.getSchoolData(campus_id);

            const invoice = {
                campus_id,
                invoice_number: `INV-${Date.now()}`,
                transaction_id: transaction.id,
                fee_id: fee.id,
                student_id: fee.user_id,
                amount: transaction.amount,
                tax_amount: 0,
                total_amount: transaction.amount,
                invoice_data: {
                    school_details: schoolData,
                    student_details: student,
                    fee_breakdown: fee.items,
                    payment_details: transaction,
                },
                status: "paid",
                generated_at: new Date(),
            };

            await PaymentInvoice.create(invoice);
        } catch (error) {
            console.error("Failed to generate invoice:", error);
        }
    }

    private static async sendFeeGenerationNotification(campus_id: string, fee: any, student: any): Promise<void> {
        try {
            const { PaymentNotificationService } = await import("@/services/payment_notification.service");
            const schoolData = await PaymentNotificationService.getSchoolDetails(campus_id);

            await PaymentNotificationService.sendPaymentDueReminder(campus_id, fee, student, schoolData);
        } catch (error) {
            console.error("Failed to send fee generation notification:", error);
        }
    }

    private static async sendPaymentNotification(
        campus_id: string,
        fee: IFeeData,
        student: any,
        isCompleted: boolean
    ): Promise<void> {
        try {
            const { PaymentNotificationService } = await import("@/services/payment_notification.service");
            const schoolData = await PaymentNotificationService.getSchoolDetails(campus_id);

            if (isCompleted) {
                // Send payment success notification
                const mockTransaction = {
                    id: `bulk_${Date.now()}`,
                    amount: fee.due_amount,
                };
                const mockInvoice = {
                    id: `inv_bulk_${Date.now()}`,
                };

                await PaymentNotificationService.sendPaymentSuccessConfirmation(
                    campus_id,
                    mockTransaction as any,
                    mockInvoice as any,
                    student,
                    schoolData
                );
            } else {
                // Send payment due notification
                await PaymentNotificationService.sendPaymentDueReminder(campus_id, fee, student, schoolData);
            }
        } catch (error) {
            console.error("Failed to send payment notification:", error);
        }
    }

    private static async getSchoolData(campus_id: string): Promise<any> {
        try {
            const { Campus } = await import("@/models/campus.model");
            return await Campus.findById(campus_id);
        } catch {
            return { name: "School", id: campus_id };
        }
    }
}
