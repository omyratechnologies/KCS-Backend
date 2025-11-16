import { z } from "zod";

// Payment Installment Schema
export const PaymentInstallmentSchema = z.object({
    installment_number: z.number().int().positive(),
    installment_name: z.string().min(1).max(100),
    amount: z.number().positive(),
    due_date: z.string().datetime().or(z.date()),
    description: z.string().optional(),
});

// Create Payment Template Schema
export const CreatePaymentTemplateSchema = z.object({
    campus_id: z.string().min(1),
    class_id: z.string().min(1),
    academic_year: z.string().min(1),
    template_name: z.string().min(1).max(200),
    description: z.string().optional(),
    total_amount: z.number().positive(),
    currency: z.string().default("INR"),
    
    is_installment_enabled: z.boolean().default(false),
    installments: z.array(PaymentInstallmentSchema).optional().default([]),
    
    payment_deadline: z.string().datetime().or(z.date()).optional(),
    
    is_late_fee_enabled: z.boolean().default(false),
    late_fee_amount: z.number().nonnegative().optional(),
    late_fee_percentage: z.number().min(0).max(100).optional(),
    late_fee_grace_period_days: z.number().int().nonnegative().default(0),
    
    is_discount_enabled: z.boolean().default(false),
    early_payment_discount_amount: z.number().nonnegative().optional(),
    early_payment_discount_percentage: z.number().min(0).max(100).optional(),
    early_payment_deadline: z.string().datetime().or(z.date()).optional(),
    
    payment_category: z.enum([
        "tuition",
        "transport",
        "library",
        "hostel",
        "exam",
        "sports",
        "uniform",
        "books",
        "laboratory",
        "computer",
        "miscellaneous"
    ]),
    is_mandatory: z.boolean().default(true),
    applicable_to_all_students: z.boolean().default(true),
    excluded_student_ids: z.array(z.string()).optional().default([]),
});

// Update Payment Template Schema
export const UpdatePaymentTemplateSchema = CreatePaymentTemplateSchema.partial().extend({
    is_active: z.boolean().optional(),
});

// Create Payment Order Schema
export const CreatePaymentOrderSchema = z.object({
    payment_template_id: z.string().min(1),
    installment_number: z.number().int().positive().optional(),
    student_email: z.string().email().optional(),
    student_phone: z.string().optional(),
});

// Verify Payment Schema
export const VerifyPaymentSchema = z.object({
    razorpay_order_id: z.string().min(1),
    razorpay_payment_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
});

// Webhook Schema
export const WebhookSchema = z.object({
    event: z.string(),
    payload: z.object({
        payment: z.object({
            entity: z.object({
                id: z.string(),
                order_id: z.string(),
                amount: z.number(),
                currency: z.string(),
                status: z.string(),
                method: z.string().optional(),
                email: z.string().optional(),
                contact: z.string().optional(),
            }),
        }).optional(),
        order: z.object({
            entity: z.object({
                id: z.string(),
                amount: z.number(),
                currency: z.string(),
                status: z.string(),
                receipt: z.string(),
            }),
        }).optional(),
        transfer: z.object({
            entity: z.object({
                id: z.string(),
                source: z.string(),
                recipient: z.string(),
                amount: z.number(),
                currency: z.string(),
                status: z.string(),
            }),
        }).optional(),
    }),
});

// Refund Schema
export const CreateRefundSchema = z.object({
    payment_transaction_id: z.string().min(1),
    amount: z.number().positive().optional(),
    reason: z.string().min(1).max(500),
});

// Query Schemas
export const GetPaymentTemplatesQuerySchema = z.object({
    campus_id: z.string().optional(),
    class_id: z.string().optional(),
    academic_year: z.string().optional(),
    payment_category: z.string().optional(),
    is_active: z.string().optional().transform(val => val === "true"),
});

export const GetPaymentTransactionsQuerySchema = z.object({
    student_id: z.string().optional(),
    campus_id: z.string().optional(),
    class_id: z.string().optional(),
    payment_template_id: z.string().optional(),
    payment_status: z.enum([
        "created",
        "pending",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "partially_refunded"
    ]).optional(),
    from_date: z.string().datetime().or(z.date()).optional(),
    to_date: z.string().datetime().or(z.date()).optional(),
    page: z.string().optional().transform(val => parseInt(val || "1")),
    limit: z.string().optional().transform(val => parseInt(val || "20")),
});

export const GetInvoicesQuerySchema = z.object({
    student_id: z.string().optional(),
    campus_id: z.string().optional(),
    payment_status: z.enum(["unpaid", "partially_paid", "paid", "overdue", "cancelled"]).optional(),
    from_date: z.string().datetime().or(z.date()).optional(),
    to_date: z.string().datetime().or(z.date()).optional(),
    page: z.string().optional().transform(val => parseInt(val || "1")),
    limit: z.string().optional().transform(val => parseInt(val || "20")),
});

// School Razorpay Account Schema
export const UpdateSchoolRazorpayAccountSchema = z.object({
    campus_id: z.string().min(1),
    razorpay_account_id: z.string().min(1),
    account_name: z.string().min(1),
    account_email: z.string().email(),
});

// Payment Analytics Schema
export const GetPaymentAnalyticsQuerySchema = z.object({
    campus_id: z.string().optional(),
    class_id: z.string().optional(),
    academic_year: z.string().optional(),
    from_date: z.string().datetime().or(z.date()).optional(),
    to_date: z.string().datetime().or(z.date()).optional(),
});

// Type exports
export type CreatePaymentTemplateInput = z.infer<typeof CreatePaymentTemplateSchema>;
export type UpdatePaymentTemplateInput = z.infer<typeof UpdatePaymentTemplateSchema>;
export type CreatePaymentOrderInput = z.infer<typeof CreatePaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
export type WebhookInput = z.infer<typeof WebhookSchema>;
export type CreateRefundInput = z.infer<typeof CreateRefundSchema>;
export type GetPaymentTemplatesQuery = z.infer<typeof GetPaymentTemplatesQuerySchema>;
export type GetPaymentTransactionsQuery = z.infer<typeof GetPaymentTransactionsQuerySchema>;
export type GetInvoicesQuery = z.infer<typeof GetInvoicesQuerySchema>;
export type UpdateSchoolRazorpayAccountInput = z.infer<typeof UpdateSchoolRazorpayAccountSchema>;
export type GetPaymentAnalyticsQuery = z.infer<typeof GetPaymentAnalyticsQuerySchema>;
