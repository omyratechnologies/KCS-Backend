import z from "zod";

import "zod-openapi/extend";

// Schema for user data (common fields returned in responses)
export const userSchema = z
    .object({
        id: z.string().openapi({ example: "user123" }),
        user_id: z.string().openapi({ example: "user123" }),
        email: z.string().email().openapi({ example: "user1234@example.com" }),
        first_name: z.string().openapi({ example: "John" }),
        last_name: z.string().openapi({ example: "Doe" }),
        phone: z.string().openapi({ example: "+1234567890" }),
        address: z.string().openapi({ example: "123 Main St, City" }),
        last_login: z.string().optional().openapi({ example: "2023-01-01T00:00:00Z" }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { role: "teacher" } }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        user_type: z.string().openapi({ example: "Teacher" }),
        campus_id: z.string().optional().openapi({ example: "campus123" }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "User" });

// Create User Request
export const createUserRequestBodySchema = z
    .object({
        user_id: z.string().openapi({ example: "user123" }),
        email: z.string().email().openapi({ example: "user@example.com" }),
        password: z.string().openapi({ example: "securepassword" }),
        first_name: z.string().openapi({ example: "John" }),
        last_name: z.string().openapi({ example: "Doe" }),
        phone: z.string().openapi({ example: "+1234567890" }),
        address: z.string().openapi({ example: "123 Main St, City" }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { role: "teacher" } }),
        user_type: z.string().openapi({ example: "Teacher" }),
        campus_id: z.string().optional().openapi({ example: "campus123" }),
    })
    .openapi({ ref: "CreateUserRequest" });

export const createUserResponseSchema = userSchema.openapi({
    ref: "CreateUserResponse",
});

// Get Users Response
export const getUsersResponseSchema = z.array(userSchema).openapi({ ref: "GetUsersResponse" });

// Get User Response
export const getUserResponseSchema = userSchema.openapi({
    ref: "GetUserResponse",
});

// Update User Request
export const updateUserRequestBodySchema = z
    .object({
        user_id: z.string().optional().openapi({ example: "user123" }),
        email: z.string().email().optional().openapi({ example: "user@example.com" }),
        first_name: z.string().optional().openapi({ example: "John" }),
        last_name: z.string().optional().openapi({ example: "Doe" }),
        phone: z.string().optional().openapi({ example: "+1234567890" }),
        address: z.string().optional().openapi({ example: "123 Main St, City" }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({ example: { role: "teacher" } }),
        is_active: z.boolean().optional().openapi({ example: true }),
        is_deleted: z.boolean().optional().openapi({ example: false }),
        user_type: z.string().optional().openapi({ example: "Teacher" }),
        campus_id: z.string().optional().openapi({ example: "campus123" }),
    })
    .openapi({ ref: "UpdateUserRequest" });

export const updateUserResponseSchema = z
    .object({
        message: z.string().openapi({ example: "Users updated successfully" }),
    })
    .openapi({ ref: "UpdateUserResponse" });

// Delete User Response
export const deleteUserResponseSchema = z
    .object({
        message: z.string().openapi({ example: "Users deleted successfully" }),
    })
    .openapi({ ref: "DeleteUserResponse" });

// Bulk Create Users Request
export const bulkCreateUsersRequestBodySchema = z
    .object({
        users: z
            .array(
                z.object({
                    user_id: z.string().openapi({ example: "user123" }),
                    email: z.string().email().openapi({ example: "user@example.com" }),
                    password: z.string().openapi({ example: "securepassword" }),
                    first_name: z.string().openapi({ example: "John" }),
                    last_name: z.string().openapi({ example: "Doe" }),
                    phone: z.string().openapi({ example: "+1234567890" }),
                    address: z.string().openapi({ example: "123 Main St, City" }),
                    meta_data: z.record(z.string(), z.any()).optional().openapi({ example: { role: "student" } }),
                    user_type: z.enum(["Student", "Parent", "Teacher"]).openapi({ example: "Student" }),
                    campus_id: z.string().optional().openapi({ example: "campus123" }),
                    academic_year: z.string().optional().openapi({ example: "2024-2025" }),
                    class_id: z.string().optional().openapi({ example: "class123" }),
                })
            )
            .min(1)
            .max(100)
            .openapi({
                example: [
                    {
                        user_id: "student001",
                        email: "student1@example.com",
                        password: "password123",
                        first_name: "Alice",
                        last_name: "Smith",
                        phone: "+1234567890",
                        address: "123 Main St",
                        user_type: "Student",
                        academic_year: "2024-2025",
                        class_id: "class123",
                    },
                    {
                        user_id: "student002",
                        email: "student2@example.com",
                        password: "password123",
                        first_name: "Bob",
                        last_name: "Johnson",
                        phone: "+1234567891",
                        address: "456 Oak Ave",
                        user_type: "Student",
                        academic_year: "2024-2025",
                        class_id: "class123",
                    },
                ],
            }),
    })
    .openapi({ ref: "BulkCreateUsersRequest" });

export const bulkCreateUsersResponseSchema = z
    .object({
        message: z.string().openapi({ example: "Bulk user creation completed" }),
        results: z
            .object({
                total: z.number().openapi({ example: 10 }),
                success_count: z.number().openapi({ example: 8 }),
                failed_count: z.number().openapi({ example: 2 }),
                successful: z
                    .array(
                        z.object({
                            index: z.number(),
                            user_id: z.string(),
                            email: z.string(),
                            id: z.string(),
                            message: z.string(),
                        })
                    )
                    .openapi({
                        example: [
                            {
                                index: 0,
                                user_id: "student001",
                                email: "student1@example.com",
                                id: "uuid-123",
                                message: "User created successfully",
                            },
                        ],
                    }),
                failed: z
                    .array(
                        z.object({
                            index: z.number(),
                            user_id: z.string(),
                            email: z.string(),
                            error: z.string(),
                        })
                    )
                    .openapi({
                        example: [
                            {
                                index: 5,
                                user_id: "student006",
                                email: "duplicate@example.com",
                                error: "Email already exists",
                            },
                        ],
                    }),
            })
            .openapi({
                example: {
                    total: 10,
                    success_count: 8,
                    failed_count: 2,
                    successful: [],
                    failed: [],
                },
            }),
    })
    .openapi({ ref: "BulkCreateUsersResponse" });
