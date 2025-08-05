import { Context } from "hono";

import { handlePaymentError } from "@/middlewares/payment_monitoring.middleware";
import { PaymentService } from "@/services/payment.service";
import { PaymentAnalyticsService } from "@/services/payment_analytics.service";
import PaymentErrorHandler from "@/services/payment_error_handler.service";
import { PaymentNotificationService } from "@/services/payment_notification.service";
import PaymentSecurityMonitor from "@/services/payment_security_monitor.service";
import { SecurePaymentCredentialService } from "@/services/secure_payment_credential.service";

export class PaymentController {
    // ========================= SCHOOL BANK DETAILS =========================

    /**
     * Create or update school bank details
     */
    public static readonly createOrUpdateBankDetails = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can manage bank details
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const bankData = await ctx.req.json();

            const result = await PaymentService.createOrUpdateSchoolBankDetails(
                campus_id,
                bankData
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Bank details saved successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get school bank details
     */
    public static readonly getBankDetails = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can view bank details
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const bankDetails =
                await PaymentService.getSchoolBankDetails(campus_id);

            return ctx.json({
                success: true,
                data: bankDetails,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= FEE CATEGORIES =========================

    /**
     * Create fee category
     */
    public static readonly createFeeCategory = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const categoryData = await ctx.req.json();

            const result = await PaymentService.createFeeCategory(
                campus_id,
                categoryData
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Fee category created successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get fee categories
     */
    public static readonly getFeeCategories = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { academic_year } = ctx.req.query();

            const categories = await PaymentService.getFeeCategoriesByCampus(
                campus_id,
                academic_year
            );

            return ctx.json({
                success: true,
                data: categories,
                count: categories.length,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Update fee category
     */
    public static readonly updateFeeCategory = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const { id } = ctx.req.param();
            const data = await ctx.req.json();

            // Only admin can update fee categories
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const result = await PaymentService.updateFeeCategory(id, data);

            return ctx.json({
                success: true,
                data: result,
                message: "Fee category updated successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= FEE TEMPLATES =========================

    /**
     * Create fee template
     */
    public static readonly createFeeTemplate = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const templateData = await ctx.req.json();

            const result = await PaymentService.createFeeTemplate(
                campus_id,
                templateData
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Fee template created successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get fee templates
     */
    public static readonly getFeeTemplates = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { class_id, academic_year } = ctx.req.query();

            const templates = await PaymentService.getFeeTemplatesByCampus(
                campus_id,
                class_id,
                academic_year
            );

            return ctx.json({
                success: true,
                data: templates,
                count: templates.length,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Generate fees from template
     */
    public static readonly generateFeesFromTemplate = async (ctx: Context) => {
        try {
            const { template_id } = ctx.req.param();
            const user_type = ctx.get("user_type");

            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const fees =
                await PaymentService.generateFeesFromTemplate(template_id);

            return ctx.json({
                success: true,
                data: fees,
                count: fees.length,
                message: `Generated ${fees.length} fee records`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= PAYMENT PROCESSING =========================

    /**
     * Initiate payment
     */
    public static readonly initiatePayment = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const {
                fee_id,
                student_id,
                gateway,
                amount,
                callback_url,
                cancel_url,
            } = await ctx.req.json();

            // Determine parent_id based on user type
            let parent_id: string | undefined;
            let actual_student_id = student_id;

            if (user_type === "Parent") {
                parent_id = user_id;
                actual_student_id = student_id; // Parent can pay for their children
            } else if (user_type === "Student") {
                actual_student_id = user_id;
            } else {
                const authError = PaymentErrorHandler.createError(
                    "AUTH_002",
                    { userType: user_type, operation: "payment_initiation" },
                    "Unauthorized user type for payment initiation"
                );
                const errorResponse =
                    PaymentErrorHandler.formatErrorResponse(authError);
                return ctx.json(errorResponse, 403 as any);
            }

            const result = await PaymentService.initiatePayment(
                campus_id,
                fee_id,
                actual_student_id,
                parent_id,
                gateway,
                amount,
                callback_url,
                cancel_url
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Payment initiated successfully",
            });
        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                operation: "initiate_payment",
                campus_id: ctx.get("campus_id"),
                user_id: ctx.get("user_id"),
            });
            const errorResponse = PaymentErrorHandler.formatErrorResponse(
                errorHandling.error
            );
            return ctx.json(errorResponse, errorHandling.httpStatus as any);
        }
    };

    /**
     * Verify payment (webhook or callback)
     */
    public static readonly verifyPayment = async (ctx: Context) => {
        try {
            const { transaction_id } = ctx.req.param();
            const { payment_id, signature, ...additionalData } =
                await ctx.req.json();

            // Validate required parameters
            if (!transaction_id) {
                const validationError = PaymentErrorHandler.createError(
                    "VAL_001",
                    {
                        field: "transaction_id",
                        operation: "payment_verification",
                    },
                    "Transaction ID is required for payment verification"
                );
                const errorResponse =
                    PaymentErrorHandler.formatErrorResponse(validationError);
                return ctx.json(errorResponse, 400 as any);
            }

            const result = await PaymentService.verifyAndUpdatePayment(
                transaction_id,
                payment_id,
                signature,
                additionalData
            );

            return ctx.json({
                success: result.success,
                data: {
                    transaction: result.transaction,
                    invoice: result.invoice,
                },
                message: result.success
                    ? "Payment verified successfully"
                    : "Payment verification failed",
            });
        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                operation: "verify_payment",
                transaction_id: ctx.req.param("transaction_id"),
            });
            const errorResponse = PaymentErrorHandler.formatErrorResponse(
                errorHandling.error
            );
            return ctx.json(errorResponse, errorHandling.httpStatus as any);
        }
    };

    /**
     * Get payment history
     */
    public static readonly getPaymentHistory = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const { student_id, status } = ctx.req.query();

            let actual_student_id: string | undefined;
            let parent_id: string | undefined;

            if (user_type === "Parent") {
                parent_id = user_id;
                actual_student_id = student_id; // Parent can view specific child's history
            } else if (user_type === "Student") {
                actual_student_id = user_id;
            } else if (["Admin", "Super Admin"].includes(user_type)) {
                actual_student_id = student_id; // Admin can view any student's history
            } else {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const history = await PaymentService.getPaymentHistory(
                campus_id,
                actual_student_id,
                parent_id,
                status
            );

            return ctx.json({
                success: true,
                data: history,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get student fees (for parents/students to view pending fees)
     */
    public static readonly getStudentFees = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const { student_id, status } = ctx.req.query();

            let actual_student_id: string | undefined;

            if (user_type === "Parent") {
                actual_student_id = student_id; // Parent viewing child's fees
            } else if (user_type === "Student") {
                actual_student_id = user_id; // Student viewing own fees
            } else if (["Admin", "Super Admin"].includes(user_type)) {
                actual_student_id = student_id; // Admin viewing any student's fees
            } else {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            if (!actual_student_id) {
                return ctx.json({ error: "Student ID is required" }, 400);
            }

            // Get fees for the student
            const history = await PaymentService.getPaymentHistory(
                campus_id,
                actual_student_id,
                undefined,
                status
            );

            // Separate fees by status for easier frontend handling
            const pendingFees = history.fees.filter(
                (fee) =>
                    fee.payment_status === "unpaid" ||
                    fee.payment_status === "partial"
            );
            const paidFees = history.fees.filter(
                (fee) => fee.payment_status === "paid"
            );
            const overdueFees = history.fees.filter(
                (fee) => fee.payment_status === "overdue"
            );

            return ctx.json({
                success: true,
                data: {
                    pending_fees: pendingFees,
                    paid_fees: paidFees,
                    overdue_fees: overdueFees,
                    recent_transactions: history.transactions.slice(0, 10), // Last 10 transactions
                    summary: {
                        total_pending: pendingFees.reduce(
                            (sum, fee) => sum + fee.due_amount,
                            0
                        ),
                        total_paid: paidFees.reduce(
                            (sum, fee) => sum + fee.paid_amount,
                            0
                        ),
                        total_overdue: overdueFees.reduce(
                            (sum, fee) => sum + fee.due_amount,
                            0
                        ),
                    },
                },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Download invoice
     */
    public static readonly downloadInvoice = async (ctx: Context) => {
        try {
            const { invoice_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Check if user has permission to download this invoice
            // Implementation would depend on your access control requirements

            return ctx.json({
                success: true,
                message: "Invoice download feature to be implemented",
                invoice_url: `https://yourapp.com/invoices/${invoice_id}.pdf`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get available payment gateways for campus (SECURE VERSION)
     */
    public static readonly getAvailableGateways = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            // Use the new secure service to get available gateways
            const gatewayInfo =
                await PaymentService.getAvailableGateways(campus_id);

            if (gatewayInfo.enabled.length === 0) {
                return ctx.json(
                    {
                        success: false,
                        message:
                            "No payment gateways are enabled for this school",
                    },
                    400
                );
            }

            const availableGateways: any[] = [];

            // Build gateway list based on enabled gateways
            for (const gatewayId of gatewayInfo.enabled) {
                const config = gatewayInfo.configurations[gatewayId];

                switch (gatewayId) {
                    case "razorpay": {
                        if (config.enabled && config.configured) {
                            availableGateways.push({
                                id: "razorpay",
                                name: "Razorpay",
                                description:
                                    "Pay using Credit/Debit Card, Net Banking, UPI, Wallets",
                                logo: "https://razorpay.com/assets/logo.png",
                                test_status: config.test_status,
                                last_tested: config.last_tested,
                            });
                        }
                        break;
                    }
                    case "payu": {
                        if (config.enabled && config.configured) {
                            availableGateways.push({
                                id: "payu",
                                name: "PayU",
                                description:
                                    "Secure payment gateway with multiple payment options",
                                logo: "https://payu.in/assets/logo.png",
                                test_status: config.test_status,
                                last_tested: config.last_tested,
                            });
                        }
                        break;
                    }
                    case "cashfree": {
                        if (config.enabled && config.configured) {
                            availableGateways.push({
                                id: "cashfree",
                                name: "Cashfree",
                                description: "Fast and secure payments",
                                logo: "https://cashfree.com/assets/logo.png",
                                test_status: config.test_status,
                                last_tested: config.last_tested,
                            });
                        }
                        break;
                    }
                }
            }

            return ctx.json({
                success: true,
                data: {
                    gateways: availableGateways,
                    count: availableGateways.length,
                    all_configured: gatewayInfo.available,
                    gateway_status: gatewayInfo.configurations,
                },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= PAYMENT NOTIFICATIONS =========================

    /**
     * Send payment due reminders (bulk)
     */
    public static readonly sendBulkPaymentReminders = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can send bulk reminders
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const result =
                await PaymentNotificationService.sendBulkPaymentReminders(
                    campus_id
                );

            return ctx.json({
                success: true,
                data: result,
                message: `Sent ${result.sent} reminders, ${result.failed} failed`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Send individual payment reminder
     */
    public static readonly sendPaymentReminder = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const { fee_id } = ctx.req.param();

            // Only admin can send reminders
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { Fee } = await import("@/models/fee.model");
            const { UserService } = await import("@/services/users.service");

            const fee = await Fee.findById(fee_id);
            if (!fee) {
                return ctx.json({ error: "Fee not found" }, 404);
            }

            const studentData = await UserService.getUser(fee.user_id);
            const schoolData =
                await PaymentNotificationService.getSchoolDetails(campus_id);

            const isOverdue = fee.payment_status === "overdue";

            await (isOverdue
                ? PaymentNotificationService.sendPaymentOverdueNotification(
                      campus_id,
                      fee,
                      studentData,
                      schoolData
                  )
                : PaymentNotificationService.sendPaymentDueReminder(
                      campus_id,
                      fee,
                      studentData,
                      schoolData
                  ));

            return ctx.json({
                success: true,
                message: `${isOverdue ? "Overdue" : "Due"} reminder sent successfully`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Schedule automatic payment reminders
     */
    public static readonly schedulePaymentReminders = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can schedule reminders
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            await PaymentNotificationService.schedulePaymentReminders(
                campus_id
            );

            return ctx.json({
                success: true,
                message: "Automatic payment reminders scheduled successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= PAYMENT ANALYTICS =========================

    /**
     * Get payment analytics dashboard
     */
    public static readonly getPaymentAnalytics = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can view analytics
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { start_date, end_date } = ctx.req.query();

            let dateRange;
            if (start_date && end_date) {
                dateRange = {
                    start_date: new Date(start_date as string),
                    end_date: new Date(end_date as string),
                };
            }

            const analytics = await PaymentAnalyticsService.getPaymentAnalytics(
                campus_id,
                dateRange
            );

            return ctx.json({
                success: true,
                data: analytics,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Generate payment report
     */
    public static readonly generatePaymentReport = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can generate reports
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { report_type, start_date, end_date } = ctx.req.query();

            if (!report_type) {
                return ctx.json({ error: "Report type is required" }, 400);
            }

            let dateRange;
            if (start_date && end_date) {
                dateRange = {
                    start_date: new Date(start_date as string),
                    end_date: new Date(end_date as string),
                };
            }

            const report = await PaymentAnalyticsService.generatePaymentReport(
                campus_id,
                report_type as "daily" | "weekly" | "monthly" | "custom",
                dateRange
            );

            return ctx.json({
                success: true,
                data: report,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get payment trends
     */
    public static readonly getPaymentTrends = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can view trends
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { period } = ctx.req.query();

            if (!period) {
                return ctx.json(
                    { error: "Period is required (7d, 30d, 90d, 1y)" },
                    400
                );
            }

            const trends = await PaymentAnalyticsService.getPaymentTrends(
                campus_id,
                period as "7d" | "30d" | "90d" | "1y"
            );

            return ctx.json({
                success: true,
                data: trends,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get top paying students
     */
    public static readonly getTopPayingStudents = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can view this data
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { limit } = ctx.req.query();
            const limitNum = limit ? Number.parseInt(limit as string) : 10;

            const topStudents =
                await PaymentAnalyticsService.getTopPayingStudents(
                    campus_id,
                    limitNum
                );

            return ctx.json({
                success: true,
                data: topStudents,
                count: topStudents.length,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= DISCOUNT MANAGEMENT =========================

    /**
     * Create discount rule
     */
    public static readonly createDiscountRule = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Only admin can create discount rules
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const ruleData = await ctx.req.json();

            const { DiscountService } = await import(
                "@/services/discount.service"
            );
            const result = await DiscountService.createDiscountRule(
                campus_id,
                ruleData,
                user_id
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Discount rule created successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get discount rules
     */
    public static readonly getDiscountRules = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can view discount rules
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { is_active, discount_type, academic_year } = ctx.req.query();

            const filters: any = {};
            if (is_active !== undefined)
                {filters.is_active = is_active === "true";}
            if (discount_type) {filters.discount_type = discount_type;}
            if (academic_year) {filters.academic_year = academic_year;}

            const { DiscountService } = await import(
                "@/services/discount.service"
            );
            const rules = await DiscountService.getDiscountRules(
                campus_id,
                filters
            );

            return ctx.json({
                success: true,
                data: rules,
                count: rules.length,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Check discount eligibility for a fee
     */
    public static readonly checkDiscountEligibility = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { fee_id, student_id } = ctx.req.param();

            const { Fee } = await import("@/models/fee.model");
            const { DiscountService } = await import(
                "@/services/discount.service"
            );

            const fee = await Fee.findById(fee_id);
            if (!fee || fee.campus_id !== campus_id) {
                return ctx.json({ error: "Fee not found" }, 404);
            }

            const eligibility = await DiscountService.checkDiscountEligibility(
                campus_id,
                fee,
                student_id
            );

            return ctx.json({
                success: true,
                data: eligibility,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Apply discount to fee
     */
    public static readonly applyDiscount = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Only admin can apply discounts
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { fee_id, student_id, discount_rule_id, reason } =
                await ctx.req.json();

            const { DiscountService } = await import(
                "@/services/discount.service"
            );
            const application = await DiscountService.applyDiscount(
                campus_id,
                fee_id,
                student_id,
                discount_rule_id,
                user_id,
                reason
            );

            return ctx.json({
                success: true,
                data: application,
                message: "Discount applied successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get discount summary and analytics
     */
    public static readonly getDiscountSummary = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can view discount analytics
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { start_date, end_date } = ctx.req.query();

            let dateRange;
            if (start_date && end_date) {
                dateRange = {
                    start_date: new Date(start_date as string),
                    end_date: new Date(end_date as string),
                };
            }

            const { DiscountService } = await import(
                "@/services/discount.service"
            );
            const summary = await DiscountService.getDiscountSummary(
                campus_id,
                dateRange
            );

            return ctx.json({
                success: true,
                data: summary,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= BULK OPERATIONS =========================

    /**
     * Generate bulk fees from template
     */
    public static readonly generateBulkFees = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Only admin can generate bulk fees
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const requestData = await ctx.req.json();

            const { BulkOperationsService } = await import(
                "@/services/bulk_operations.service"
            );
            const result = await BulkOperationsService.generateBulkFees(
                campus_id,
                requestData,
                user_id
            );

            return ctx.json({
                success: true,
                data: result,
                message: `Generated ${result.successful} fees successfully, ${result.failed} failed`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Process bulk payments
     */
    public static readonly processBulkPayments = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Only admin can process bulk payments
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const requestData = await ctx.req.json();

            const { BulkOperationsService } = await import(
                "@/services/bulk_operations.service"
            );
            const result = await BulkOperationsService.processBulkPayments(
                campus_id,
                requestData,
                user_id
            );

            return ctx.json({
                success: true,
                data: result,
                message: `Processed ${result.successful} payments successfully, ${result.failed} failed`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Update bulk fees
     */
    public static readonly updateBulkFees = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Only admin can update bulk fees
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { fee_ids, updates } = await ctx.req.json();

            const { BulkOperationsService } = await import(
                "@/services/bulk_operations.service"
            );
            const result = await BulkOperationsService.updateBulkFees(
                campus_id,
                fee_ids,
                updates,
                user_id
            );

            return ctx.json({
                success: true,
                data: result,
                message: `Updated ${result.successful} fees successfully, ${result.failed} failed`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= SECURE CREDENTIAL MANAGEMENT =========================

    /**
     * Configure secure payment gateway credentials
     */
    public static readonly configureSecureCredentials = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can configure credentials
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const {
                gateway,
                credentials,
                enabled = true,
            } = await ctx.req.json();

            if (!gateway || !credentials) {
                return ctx.json(
                    {
                        error: "Gateway and credentials are required",
                    },
                    400
                );
            }

            const result = await PaymentService.configurePaymentGateway(
                campus_id,
                gateway,
                credentials,
                enabled
            );

            return ctx.json({
                success: true,
                data: result,
                message: `${gateway} gateway configured successfully`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Test payment gateway configuration
     */
    public static readonly testGatewayConfiguration = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const { gateway } = ctx.req.param();

            // Only admin can test configurations
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            if (!["razorpay", "payu", "cashfree"].includes(gateway)) {
                return ctx.json(
                    {
                        error: "Invalid gateway. Supported: razorpay, payu, cashfree",
                    },
                    400
                );
            }

            const result = await PaymentService.testGatewayConfiguration(
                campus_id,
                gateway as "razorpay" | "payu" | "cashfree"
            );

            return ctx.json({
                success: result.success,
                data: result,
                message: result.message,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Toggle payment gateway on/off
     */
    public static readonly toggleGateway = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const { gateway } = ctx.req.param();

            // Only admin can toggle gateways
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { enabled } = await ctx.req.json();

            if (typeof enabled !== "boolean") {
                return ctx.json(
                    {
                        error: "enabled field must be a boolean",
                    },
                    400
                );
            }

            if (!["razorpay", "payu", "cashfree"].includes(gateway)) {
                return ctx.json(
                    {
                        error: "Invalid gateway. Supported: razorpay, payu, cashfree",
                    },
                    400
                );
            }

            const result = await PaymentService.toggleGateway(
                campus_id,
                gateway as "razorpay" | "payu" | "cashfree",
                enabled
            );

            return ctx.json({
                success: true,
                data: result,
                message: `${gateway} gateway ${enabled ? "enabled" : "disabled"} successfully`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get masked credentials for display
     */
    public static readonly getMaskedCredentials = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can view credentials
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const maskedCredentials =
                await SecurePaymentCredentialService.getMaskedCredentials(
                    campus_id
                );

            if (!maskedCredentials) {
                return ctx.json(
                    {
                        success: false,
                        message: "No payment gateway credentials configured",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                data: maskedCredentials,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Migrate legacy credentials to secure storage
     */
    public static readonly migrateLegacyCredentials = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can migrate credentials
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const result =
                await SecurePaymentCredentialService.migrateLegacyCredentials(
                    campus_id
                );

            return ctx.json({
                success: result.success,
                data: result,
                message: result.message,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Check security status of credentials
     */
    public static readonly getSecurityStatus = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can check security status
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const securityStatus =
                await SecurePaymentCredentialService.validateCredentialSecurity(
                    campus_id
                );

            return ctx.json({
                success: securityStatus.valid,
                data: securityStatus,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Rotate encryption keys
     */
    public static readonly rotateEncryption = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only super admin can rotate encryption
            if (user_type !== "Super Admin") {
                return ctx.json(
                    { error: "Unauthorized - Super Admin access required" },
                    403
                );
            }

            const { old_encryption_key } = await ctx.req.json();

            if (!old_encryption_key) {
                return ctx.json(
                    {
                        error: "old_encryption_key is required",
                    },
                    400
                );
            }

            const result =
                await SecurePaymentCredentialService.rotateEncryption(
                    campus_id,
                    old_encryption_key
                );

            return ctx.json({
                success: result.success,
                data: result,
                message: result.message,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Validate encryption setup
     */
    public static readonly validateEncryption = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only admin can validate encryption
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { CredentialEncryptionService } = await import(
                "@/services/credential_encryption.service"
            );
            const validation =
                CredentialEncryptionService.validateEncryptionKey();

            return ctx.json({
                success: validation.valid,
                data: validation,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= SECURITY DASHBOARD =========================

    /**
     * Get comprehensive security dashboard
     */
    public static readonly getSecurityDashboard = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only admin can view security dashboard
            if (!["Admin", "Super Admin"].includes(user_type)) {
                const error = PaymentErrorHandler.handleError("AUTH_002");
                return ctx.json(error, 403 as any);
            }

            // Get security metrics from the last 24 hours
            const securityMetrics =
                PaymentSecurityMonitor.getSecurityMetrics(campus_id);

            // Get recent security events (last 100)
            const recentEvents = PaymentSecurityMonitor.getRecentSecurityEvents(
                campus_id,
                100
            );

            // Get audit logs (last 50)
            const auditLogs = PaymentSecurityMonitor.getAuditLogs(
                campus_id,
                50
            );

            // Get gateway status
            const gatewayStatus =
                await PaymentService.getAvailableGateways(campus_id);

            // Get encryption validation
            const { CredentialEncryptionService } = await import(
                "@/services/credential_encryption.service"
            );
            const encryptionStatus =
                CredentialEncryptionService.validateEncryptionKey();

            return ctx.json({
                success: true,
                data: {
                    security_metrics: securityMetrics,
                    recent_events: recentEvents,
                    audit_logs: auditLogs,
                    gateway_status: gatewayStatus,
                    encryption_status: encryptionStatus,
                    dashboard_generated_at: new Date(),
                    campus_id,
                },
            });
        } catch (error) {
            const errorResponse = PaymentErrorHandler.handleError("SYS_001", {
                operation: "security_dashboard",
                original_error:
                    error instanceof Error ? error.message : String(error),
            });
            return ctx.json(errorResponse, 500 as any);
        }
    };

    /**
     * Get detailed security event by ID
     */
    public static readonly getSecurityEventDetails = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const { event_id } = ctx.req.param();

            // Only admin can view security events
            if (!["Admin", "Super Admin"].includes(user_type)) {
                const error = PaymentErrorHandler.handleError("AUTH_002");
                return ctx.json(error, 403 as any);
            }

            if (!event_id) {
                const error = PaymentErrorHandler.handleError("VAL_001", {
                    missing_fields: { event_id: true },
                });
                return ctx.json(error, 400 as any);
            }

            const eventDetails =
                PaymentSecurityMonitor.getSecurityEventById(event_id);

            if (!eventDetails) {
                const error = PaymentErrorHandler.handleError("NOT_001", {
                    resource: "security_event",
                    identifier: event_id,
                });
                return ctx.json(error, 404 as any);
            }

            // Check if user has access to this campus's events
            if (
                eventDetails.campus_id &&
                eventDetails.campus_id !== campus_id
            ) {
                const error = PaymentErrorHandler.handleError("AUTH_002");
                return ctx.json(error, 403 as any);
            }

            return ctx.json({
                success: true,
                data: eventDetails,
            });
        } catch (error) {
            const errorResponse = PaymentErrorHandler.handleError("SYS_001", {
                operation: "get_security_event_details",
                event_id: ctx.req.param().event_id,
                original_error:
                    error instanceof Error ? error.message : String(error),
            });
            return ctx.json(errorResponse, 500 as any);
        }
    };

    // ========================= EXISTING METHODS =========================
}
