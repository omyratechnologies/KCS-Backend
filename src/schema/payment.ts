import z from "zod";

import "zod-openapi/extend";

// ========================= SCHOOL BANK DETAILS =========================

export const schoolBankDetailsSchema = z.object({
    id: z.string().openapi({ example: "bank_details_123" }),
    campus_id: z.string().openapi({ example: "campus_123" }),
    bank_name: z.string().openapi({ example: "State Bank of India" }),
    account_number: z.string().openapi({ example: "1234567890" }),
    account_holder_name: z.string().openapi({ example: "ABC School Trust" }),
    ifsc_code: z.string().openapi({ example: "SBIN0001234" }),
    branch_name: z.string().openapi({ example: "Main Branch" }),
    account_type: z.enum(["savings", "current"]).openapi({ example: "current" }),
    upi_id: z.string().optional().openapi({ example: "school@paytm" }),
    payment_gateway_credentials: z.object({
        razorpay: z.object({
            key_id: z.string(),
            key_secret: z.string(),
            webhook_secret: z.string(),
            enabled: z.boolean()
        }).optional(),
        payu: z.object({
            merchant_key: z.string(),
            merchant_salt: z.string(),
            enabled: z.boolean()
        }).optional(),
        cashfree: z.object({
            app_id: z.string(),
            secret_key: z.string(),
            enabled: z.boolean()
        }).optional()
    }).openapi({
        example: {
            razorpay: {
                key_id: "rzp_test_123",
                key_secret: "secret_123",
                webhook_secret: "webhook_123",
                enabled: true
            }
        }
    }),
    is_active: z.boolean().openapi({ example: true }),
    is_verified: z.boolean().openapi({ example: false }),
    verified_at: z.string().optional().openapi({ example: "2023-01-01T00:00:00Z" }),
    meta_data: z.record(z.string(), z.any()).openapi({ example: {} }),
    created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" })
}).openapi({ ref: "SchoolBankDetails" });

export const createBankDetailsRequestSchema = z.object({
    bank_name: z.string().openapi({ example: "State Bank of India" }),
    account_number: z.string().openapi({ example: "1234567890" }),
    account_holder_name: z.string().openapi({ example: "ABC School Trust" }),
    ifsc_code: z.string().openapi({ example: "SBIN0001234" }),
    branch_name: z.string().openapi({ example: "Main Branch" }),
    account_type: z.enum(["savings", "current"]).openapi({ example: "current" }),
    upi_id: z.string().optional().openapi({ example: "school@paytm" }),
    payment_gateway_credentials: z.object({
        razorpay: z.object({
            key_id: z.string(),
            key_secret: z.string(),
            webhook_secret: z.string(),
            enabled: z.boolean()
        }).optional(),
        payu: z.object({
            merchant_key: z.string(),
            merchant_salt: z.string(),
            enabled: z.boolean()
        }).optional(),
        cashfree: z.object({
            app_id: z.string(),
            secret_key: z.string(),
            enabled: z.boolean()
        }).optional()
    }).optional()
}).openapi({ ref: "CreateBankDetailsRequest" });

// ========================= FEE CATEGORIES =========================

export const feeCategorySchema = z.object({
    id: z.string().openapi({ example: "category_123" }),
    campus_id: z.string().openapi({ example: "campus_123" }),
    category_name: z.string().openapi({ example: "Tuition Fee" }),
    category_code: z.string().openapi({ example: "TUITION_001" }),
    description: z.string().openapi({ example: "Monthly tuition fee for academic year" }),
    is_mandatory: z.boolean().openapi({ example: true }),
    applicable_classes: z.array(z.string()).openapi({ example: ["class_1", "class_2"] }),
    academic_year: z.string().openapi({ example: "2023-24" }),
    frequency: z.enum(["monthly", "quarterly", "annually", "one-time"]).openapi({ example: "monthly" }),
    due_date_config: z.object({
        type: z.string(),
        value: z.union([z.string(), z.number()])
    }).openapi({
        example: { type: "fixed_date", value: "2023-01-05" }
    }),
    late_fee_config: z.object({
        enabled: z.boolean(),
        amount: z.number().optional(),
        percentage: z.number().optional(),
        grace_period_days: z.number().optional()
    }).openapi({
        example: { enabled: true, percentage: 2, grace_period_days: 5 }
    }),
    discount_config: z.object({
        enabled: z.boolean(),
        early_payment_discount: z.object({
            percentage: z.number(),
            days_before_due: z.number()
        }).optional(),
        sibling_discount: z.object({
            percentage: z.number(),
            min_siblings: z.number()
        }).optional()
    }).openapi({
        example: { enabled: true, early_payment_discount: { percentage: 5, days_before_due: 10 } }
    }),
    is_active: z.boolean().openapi({ example: true }),
    meta_data: z.record(z.string(), z.any()).openapi({ example: {} }),
    created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" })
}).openapi({ ref: "FeeCategory" });

export const createFeeCategoryRequestSchema = z.object({
    category_name: z.string().openapi({ example: "Tuition Fee" }),
    category_code: z.string().openapi({ example: "TUITION_001" }),
    description: z.string().openapi({ example: "Monthly tuition fee for academic year" }),
    is_mandatory: z.boolean().default(true).openapi({ example: true }),
    applicable_classes: z.array(z.string()).openapi({ example: ["class_1", "class_2"] }),
    academic_year: z.string().openapi({ example: "2023-24" }),
    frequency: z.enum(["monthly", "quarterly", "annually", "one-time"]).openapi({ example: "monthly" }),
    due_date_config: z.object({
        type: z.string(),
        value: z.union([z.string(), z.number()])
    }),
    late_fee_config: z.object({
        enabled: z.boolean(),
        amount: z.number().optional(),
        percentage: z.number().optional(),
        grace_period_days: z.number().optional()
    }).optional(),
    discount_config: z.object({
        enabled: z.boolean(),
        early_payment_discount: z.object({
            percentage: z.number(),
            days_before_due: z.number()
        }).optional(),
        sibling_discount: z.object({
            percentage: z.number(),
            min_siblings: z.number()
        }).optional()
    }).optional()
}).openapi({ ref: "CreateFeeCategoryRequest" });

// ========================= FEE TEMPLATES =========================

export const feeTemplateSchema = z.object({
    id: z.string().openapi({ example: "template_123" }),
    campus_id: z.string().openapi({ example: "campus_123" }),
    template_name: z.string().openapi({ example: "Class 10 Monthly Fee" }),
    class_id: z.string().openapi({ example: "class_123" }),
    academic_year: z.string().openapi({ example: "2023-24" }),
    fee_structure: z.array(z.object({
        category_id: z.string(),
        category_name: z.string(),
        amount: z.number(),
        is_mandatory: z.boolean(),
        due_date: z.string(),
        late_fee_applicable: z.boolean()
    })).openapi({
        example: [
            {
                category_id: "cat_1",
                category_name: "Tuition Fee",
                amount: 5000,
                is_mandatory: true,
                due_date: "2023-01-05T00:00:00Z",
                late_fee_applicable: true
            }
        ]
    }),
    total_amount: z.number().openapi({ example: 6500 }),
    applicable_students: z.array(z.string()).openapi({ example: [] }),
    validity_period: z.object({
        start_date: z.string(),
        end_date: z.string()
    }).openapi({
        example: {
            start_date: "2023-01-01T00:00:00Z",
            end_date: "2023-12-31T00:00:00Z"
        }
    }),
    auto_generate: z.boolean().openapi({ example: false }),
    is_active: z.boolean().openapi({ example: true }),
    meta_data: z.record(z.string(), z.any()).openapi({ example: {} }),
    created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" })
}).openapi({ ref: "FeeTemplate" });

export const createFeeTemplateRequestSchema = z.object({
    template_name: z.string().openapi({ example: "Class 10 Monthly Fee" }),
    class_id: z.string().openapi({ example: "class_123" }),
    academic_year: z.string().openapi({ example: "2023-24" }),
    fee_structure: z.array(z.object({
        category_id: z.string(),
        category_name: z.string(),
        amount: z.number(),
        is_mandatory: z.boolean(),
        due_date: z.string(),
        late_fee_applicable: z.boolean()
    })),
    total_amount: z.number().openapi({ example: 6500 }),
    applicable_students: z.array(z.string()).default([]),
    validity_period: z.object({
        start_date: z.string(),
        end_date: z.string()
    }),
    auto_generate: z.boolean().default(false)
}).openapi({ ref: "CreateFeeTemplateRequest" });

// ========================= PAYMENT TRANSACTIONS =========================

export const paymentTransactionSchema = z.object({
    id: z.string().openapi({ example: "txn_123" }),
    campus_id: z.string().openapi({ example: "campus_123" }),
    fee_id: z.string().openapi({ example: "fee_123" }),
    student_id: z.string().openapi({ example: "student_123" }),
    parent_id: z.string().optional().openapi({ example: "parent_123" }),
    payment_gateway: z.enum(["razorpay", "payu", "cashfree"]).openapi({ example: "razorpay" }),
    gateway_transaction_id: z.string().optional().openapi({ example: "pay_123" }),
    gateway_order_id: z.string().optional().openapi({ example: "order_123" }),
    gateway_payment_id: z.string().optional().openapi({ example: "payment_123" }),
    amount: z.number().openapi({ example: 5000 }),
    currency: z.string().openapi({ example: "INR" }),
    status: z.enum(["pending", "success", "failed", "cancelled", "refunded"]).openapi({ example: "success" }),
    payment_method: z.enum(["card", "netbanking", "upi", "wallet", "emi"]).optional().openapi({ example: "upi" }),
    payment_details: z.record(z.string(), z.any()).openapi({ example: {} }),
    initiated_at: z.string().openapi({ example: "2023-01-01T10:00:00Z" }),
    completed_at: z.string().optional().openapi({ example: "2023-01-01T10:05:00Z" }),
    webhook_verified: z.boolean().openapi({ example: true }),
    invoice_generated: z.boolean().openapi({ example: true }),
    invoice_url: z.string().optional().openapi({ example: "https://example.com/invoice.pdf" }),
    receipt_number: z.string().optional().openapi({ example: "INV-123-456" }),
    meta_data: z.record(z.string(), z.any()).openapi({ example: {} }),
    created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" })
}).openapi({ ref: "PaymentTransaction" });

export const initiatePaymentRequestSchema = z.object({
    fee_id: z.string().openapi({ example: "fee_123" }),
    student_id: z.string().optional().openapi({ example: "student_123" }),
    gateway: z.enum(["razorpay", "payu", "cashfree"]).openapi({ example: "razorpay" }),
    amount: z.number().openapi({ example: 5000 }),
    callback_url: z.string().openapi({ example: "https://yourapp.com/payment/callback" }),
    cancel_url: z.string().openapi({ example: "https://yourapp.com/payment/cancel" })
}).openapi({ ref: "InitiatePaymentRequest" });

export const verifyPaymentRequestSchema = z.object({
    payment_id: z.string().openapi({ example: "pay_123" }),
    signature: z.string().openapi({ example: "signature_hash" }),
    status: z.string().optional().openapi({ example: "success" }),
    txnid: z.string().optional().openapi({ example: "txn_123" }),
    amount: z.string().optional().openapi({ example: "5000.00" }),
    productinfo: z.string().optional().openapi({ example: "Fee Payment" }),
    firstname: z.string().optional().openapi({ example: "Student Name" }),
    email: z.string().optional().openapi({ example: "student@example.com" })
}).openapi({ ref: "VerifyPaymentRequest" });

// ========================= PAYMENT INVOICES =========================

export const paymentInvoiceSchema = z.object({
    id: z.string().openapi({ example: "invoice_123" }),
    campus_id: z.string().openapi({ example: "campus_123" }),
    transaction_id: z.string().openapi({ example: "txn_123" }),
    fee_id: z.string().openapi({ example: "fee_123" }),
    student_id: z.string().openapi({ example: "student_123" }),
    parent_id: z.string().optional().openapi({ example: "parent_123" }),
    invoice_number: z.string().openapi({ example: "INV-2023-001" }),
    invoice_date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    due_date: z.string().openapi({ example: "2023-01-15T00:00:00Z" }),
    amount_details: z.object({
        subtotal: z.number(),
        discount_amount: z.number(),
        late_fee_amount: z.number(),
        tax_amount: z.number(),
        total_amount: z.number()
    }).openapi({
        example: {
            subtotal: 5000,
            discount_amount: 0,
            late_fee_amount: 0,
            tax_amount: 0,
            total_amount: 5000
        }
    }),
    payment_details: z.object({
        amount_paid: z.number(),
        payment_date: z.string().optional(),
        payment_method: z.string().optional(),
        transaction_reference: z.string().optional()
    }).openapi({
        example: {
            amount_paid: 5000,
            payment_date: "2023-01-01T10:05:00Z",
            payment_method: "upi",
            transaction_reference: "pay_123"
        }
    }),
    student_details: z.object({
        name: z.string(),
        class: z.string(),
        roll_number: z.string(),
        parent_name: z.string(),
        contact_number: z.string(),
        email: z.string()
    }),
    school_details: z.object({
        name: z.string(),
        address: z.string(),
        contact: z.string(),
        email: z.string(),
        logo_url: z.string().optional()
    }),
    fee_breakdown: z.array(z.object({
        category_name: z.string(),
        amount: z.number(),
        description: z.string().optional()
    })),
    status: z.enum(["generated", "sent", "paid", "overdue"]).openapi({ example: "paid" }),
    invoice_url: z.string().optional().openapi({ example: "https://example.com/invoice.pdf" }),
    sent_notifications: z.object({
        email_sent: z.boolean(),
        sms_sent: z.boolean(),
        whatsapp_sent: z.boolean(),
        sent_at: z.string().optional()
    }),
    meta_data: z.record(z.string(), z.any()).openapi({ example: {} }),
    created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" })
}).openapi({ ref: "PaymentInvoice" });

// ========================= ENHANCED FEE SCHEMA =========================

export const enhancedFeeSchema = z.object({
    id: z.string().openapi({ example: "fee_123" }),
    campus_id: z.string().openapi({ example: "campus_123" }),
    user_id: z.string().openapi({ example: "student_123" }),
    parent_id: z.string().optional().openapi({ example: "parent_123" }),
    class_id: z.string().openapi({ example: "class_123" }),
    academic_year: z.string().openapi({ example: "2023-24" }),
    fee_template_id: z.string().optional().openapi({ example: "template_123" }),
    items: z.array(z.object({
        category_id: z.string(),
        fee_type: z.string(),
        amount: z.number(),
        name: z.string(),
        due_date: z.string(),
        is_mandatory: z.boolean(),
        late_fee_applicable: z.boolean()
    })).openapi({
        example: [
            {
                category_id: "cat_1",
                fee_type: "tuition",
                amount: 5000,
                name: "Tuition Fee",
                due_date: "2023-01-05T00:00:00Z",
                is_mandatory: true,
                late_fee_applicable: true
            }
        ]
    }),
    total_amount: z.number().openapi({ example: 5000 }),
    paid_amount: z.number().openapi({ example: 0 }),
    due_amount: z.number().openapi({ example: 5000 }),
    discount_amount: z.number().openapi({ example: 0 }),
    late_fee_amount: z.number().openapi({ example: 0 }),
    payment_status: z.enum(["unpaid", "partial", "paid", "overdue"]).openapi({ example: "unpaid" }),
    is_paid: z.boolean().openapi({ example: false }),
    payment_date: z.string().optional().openapi({ example: "2023-01-15T00:00:00Z" }),
    payment_mode: z.string().optional().openapi({ example: "razorpay" }),
    installments_allowed: z.boolean().openapi({ example: false }),
    installment_plan: z.object({
        total_installments: z.number(),
        completed_installments: z.number(),
        next_due_date: z.string(),
        installment_amount: z.number()
    }).optional(),
    auto_late_fee: z.boolean().openapi({ example: true }),
    reminder_sent: z.object({
        email_count: z.number(),
        sms_count: z.number(),
        last_sent_at: z.string().optional()
    }),
    meta_data: z.record(z.string(), z.any()).openapi({ example: {} }),
    created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" })
}).openapi({ ref: "EnhancedFee" });

// ========================= RESPONSE SCHEMAS =========================

export const successResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: "Operation completed successfully" }),
    data: z.any().optional()
}).openapi({ ref: "SuccessResponse" });

export const errorResponseSchema = z.object({
    success: z.boolean().openapi({ example: false }),
    message: z.string().openapi({ example: "An error occurred" }),
    error: z.string().optional()
}).openapi({ ref: "ErrorResponse" });

export const paymentHistoryResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
        fees: z.array(enhancedFeeSchema),
        transactions: z.array(paymentTransactionSchema),
        invoices: z.array(paymentInvoiceSchema)
    })
}).openapi({ ref: "PaymentHistoryResponse" });

export const studentFeesResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
        pending_fees: z.array(enhancedFeeSchema),
        paid_fees: z.array(enhancedFeeSchema),
        overdue_fees: z.array(enhancedFeeSchema),
        recent_transactions: z.array(paymentTransactionSchema),
        summary: z.object({
            total_pending: z.number(),
            total_paid: z.number(),
            total_overdue: z.number()
        })
    })
}).openapi({ ref: "StudentFeesResponse" });

export const availableGatewaysResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    data: z.object({
        gateways: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            logo: z.string()
        })),
        count: z.number()
    })
}).openapi({ ref: "AvailableGatewaysResponse" });

// ========================= FEE GENERATION REQUEST SCHEMA =========================

export const generateFeesRequestSchema = z.object({
    template_id: z.string().openapi({ example: "template_123" }),
    class_id: z.string().optional().openapi({ example: "class_123" }),
    academic_year: z.string().openapi({ example: "2023-24" }),
    student_ids: z.array(z.string()).optional().openapi({ 
        example: ["student_1", "student_2"],
        description: "Optional: specific students to generate fees for" 
    }),
    apply_discounts: z.boolean().default(true).openapi({ example: true }),
    installments_allowed: z.boolean().default(false).openapi({ example: false }),
    due_date_override: z.string().optional().openapi({ 
        example: "2023-12-31T00:00:00Z",
        description: "Override template due dates" 
    })
}).openapi({ ref: "GenerateFeesRequest" });
