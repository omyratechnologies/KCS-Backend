import z from "zod";

import "zod-openapi/extend";

// Schema for fee item
export const feeItemSchema = z
    .object({
        fee_type: z.string().openapi({ example: "tuition" }),
        amount: z.number().openapi({ example: 5000 }),
        name: z.string().openapi({ example: "Tuition Fee" }),
    })
    .openapi({ ref: "FeeItem" });

// Schema for fee data
export const feeSchema = z
    .object({
        id: z.string().openapi({ example: "fee123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        user_id: z.string().openapi({ example: "student123" }),
        items: z.array(feeItemSchema).openapi({
            example: [
                { fee_type: "tuition", amount: 5000, name: "Tuition Fee" },
                { fee_type: "library", amount: 500, name: "Library Fee" },
            ],
        }),
        paid_amount: z.number().openapi({ example: 2500 }),
        due_amount: z.number().openapi({ example: 3000 }),
        payment_status: z.string().openapi({ example: "partial" }),
        is_paid: z.boolean().openapi({ example: false }),
        payment_date: z
            .string()
            .nullable()
            .openapi({ example: "2023-01-15T00:00:00Z" }),
        payment_mode: z.string().nullable().openapi({ example: "online" }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: { semester: "Fall 2023", receipt_number: "R12345" },
        }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Fee" });

// Create Fee Request
export const createFeeRequestBodySchema = z
    .object({
        user_id: z.string().openapi({ example: "student123" }),
        items: z.array(feeItemSchema).openapi({
            example: [
                { fee_type: "tuition", amount: 5000, name: "Tuition Fee" },
                { fee_type: "library", amount: 500, name: "Library Fee" },
            ],
        }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { semester: "Fall 2023" } }),
    })
    .openapi({ ref: "CreateFeeRequest" });

export const createFeeResponseSchema = feeSchema.openapi({
    ref: "CreateFeeResponse",
});

// Update Fee Request
export const updateFeeRequestBodySchema = z
    .object({
        paid_amount: z.number().optional().openapi({ example: 5500 }),
        due_amount: z.number().optional().openapi({ example: 0 }),
        payment_status: z.string().optional().openapi({ example: "paid" }),
        is_paid: z.boolean().optional().openapi({ example: true }),
        payment_date: z
            .string()
            .optional()
            .openapi({ example: "2023-01-20T00:00:00Z" }),
        payment_mode: z.string().optional().openapi({ example: "credit_card" }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: {
                    semester: "Fall 2023",
                    receipt_number: "R12345",
                    transaction_id: "TXN987654",
                },
            }),
    })
    .openapi({ ref: "UpdateFeeRequest" });

export const updateFeeResponseSchema = feeSchema.openapi({
    ref: "UpdateFeeResponse",
});

// Get Fees Response
export const getFeesResponseSchema = z
    .array(feeSchema)
    .openapi({ ref: "GetFeesResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        data: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
