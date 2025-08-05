import z from "zod";

import "zod-openapi/extend";

// Schema for parent-student relationship data
export const parentStudentRelationshipSchema = z
    .object({
        parent_id: z.string().openapi({ example: "parent123" }),
        student_id: z.string().openapi({ example: "student456" }),
    })
    .openapi({ ref: "ParentStudentRelationship" });

// Schema for user data (simplified from user.model.ts)
export const userSchema = z
    .object({
        id: z.string().openapi({ example: "user123" }),
        user_type: z.string().openapi({ example: "Parent" }),
        user_id: z.string().openapi({ example: "P12345" }),
        email: z.string().email().openapi({ example: "parent@example.com" }),
        first_name: z.string().openapi({ example: "John" }),
        last_name: z.string().openapi({ example: "Doe" }),
        phone: z.string().openapi({ example: "+1234567890" }),
        address: z.string().openapi({ example: "123 Main St, City, Country" }),
        last_login: z.string().optional().openapi({ example: "2023-05-01T00:00:00Z" }),
        last_login_ip: z.string().optional().openapi({ example: "192.168.1.1" }),
        campus_id: z.string().optional().openapi({ example: "campus123" }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                student_id: ["student456", "student789"],
                occupation: "Engineer",
                emergency_contact: true,
            },
        }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "User" });

// Response schema for getting parent for student
export const getParentForStudentResponseSchema = z.array(userSchema).openapi({
    ref: "GetParentForStudentResponse",
});

// Response schema for getting student for parent
export const getStudentForParentResponseSchema = z.array(userSchema).openapi({
    ref: "GetStudentForParentResponse",
});

// Error response schema
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
