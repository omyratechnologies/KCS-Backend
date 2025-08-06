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
