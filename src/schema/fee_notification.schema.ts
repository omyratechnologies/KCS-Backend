import z from "zod";
import "zod-openapi/extend";

// ==================== MANUAL FEE NOTIFICATION ====================

export const sendManualFeeNotificationRequestSchema = z
    .object({
        student_ids: z.array(z.string()).optional().openapi({
            example: ["student_123", "student_456"],
            description: "Array of student IDs to send notification to",
        }),
        parent_ids: z.array(z.string()).optional().openapi({
            example: ["parent_789", "parent_012"],
            description: "Array of parent IDs to send notification to",
        }),
        title: z.string().optional().openapi({
            example: "Fee Payment Reminder",
            description: "Custom notification title (optional, defaults to 'Fee Payment Notification')",
        }),
        message: z.string().min(1).openapi({
            example: "Dear Parent/Student, kindly pay the pending fee before the due date to avoid late charges.",
            description: "Notification message to send",
        }),
    })
    .refine((data) => (data.student_ids && data.student_ids.length > 0) || (data.parent_ids && data.parent_ids.length > 0), {
        message: "At least one of student_ids or parent_ids must be provided",
    })
    .openapi({ ref: "SendManualFeeNotificationRequest" });

export const sendManualFeeNotificationResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: "Fee notifications sent successfully" }),
        data: z.object({
            students_notified: z.number().openapi({ example: 5 }),
            parents_notified: z.number().openapi({ example: 8 }),
            total_notified: z.number().openapi({ example: 13 }),
            errors: z.array(z.string()).openapi({ example: [] }),
        }),
    })
    .openapi({ ref: "SendManualFeeNotificationResponse" });


// ==================== GET PARENTS FOR STUDENTS ====================

export const getParentsForStudentsRequestSchema = z
    .object({
        student_ids: z.array(z.string()).min(1).openapi({
            example: ["student_123", "student_456"],
            description: "Array of student IDs to get parents for",
        }),
    })
    .openapi({ ref: "GetParentsForStudentsRequest" });

export const getParentsForStudentsResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.array(
            z.object({
                id: z.string().openapi({ example: "parent_789" }),
                first_name: z.string().openapi({ example: "Jane" }),
                last_name: z.string().openapi({ example: "Doe" }),
                email: z.string().openapi({ example: "jane.doe@example.com" }),
                phone: z.string().openapi({ example: "+919876543210" }),
            })
        ),
        total: z.number().openapi({ example: 15 }),
    })
    .openapi({ ref: "GetParentsForStudentsResponse" });

// ==================== GET STUDENTS WITH UNPAID FEES ====================

export const getStudentsWithUnpaidFeesResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.array(
            z.object({
                student_id: z.string().openapi({ example: "student_123" }),
                first_name: z.string().openapi({ example: "John" }),
                last_name: z.string().openapi({ example: "Doe" }),
                email: z.string().openapi({ example: "john.doe@example.com" }),
                phone: z.string().openapi({ example: "+919876543210" }),
                class_id: z.string().openapi({ example: "class_456" }),
                unpaid_installments: z.array(
                    z.object({
                        fee_structure_id: z.string().openapi({ example: "fee_789" }),
                        installment_number: z.number().openapi({ example: 1 }),
                        amount: z.number().openapi({ example: 5000 }),
                        due_date: z.string().openapi({ example: "2024-02-15" }),
                        days_until_due: z.number().openapi({ example: 30 }),
                    })
                ),
            })
        ),
        total: z.number().openapi({ example: 15 }),
        filters: z
            .object({
                class_id: z.string().optional(),
                days_until_due: z.number().optional(),
                days_until_due_range: z
                    .object({
                        min: z.number(),
                        max: z.number(),
                    })
                    .optional(),
            })
            .openapi({
                example: { class_id: "class_456", days_until_due: 30 },
            }),
    })
    .openapi({ ref: "GetStudentsWithUnpaidFeesResponse" });

// ==================== ERROR RESPONSE ====================

export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "Error message" }),
    })
    .openapi({ ref: "FeeNotificationErrorResponse" });
