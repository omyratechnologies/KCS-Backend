import { z } from "zod";

/**
 * Validation schemas for user operations
 */

// Base schemas for reusable components
const userIdSchema = z
    .string()
    .min(1, "User ID is required")
    .max(50, "User ID must be less than 50 characters")
    .regex(/^[\w-]+$/, "User ID can only contain alphanumeric characters, underscores, and hyphens");

const emailSchema = z.string().email("Invalid email format").max(255, "Email must be less than 255 characters");

const passwordSchema = z.string();

const nameSchema = z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[\s'a-z-]+$/i, "Name can only contain letters, spaces, hyphens, and apostrophes");

const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format");

const addressSchema = z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters");

const userTypeSchema = z.enum(["Student", "Teacher", "Parent", "Admin", "Super Admin"], {
    errorMap: () => ({
        message: "Invalid user type. Must be one of: Student, Teacher, Parent, Admin, Super Admin",
    }),
});

const campusIdSchema = z.string().min(1, "Campus ID is required").max(50, "Campus ID must be less than 50 characters");

// Create user validation schema
export const createUserSchema = z.object({
    user_id: userIdSchema,
    email: emailSchema,
    password: passwordSchema,
    first_name: nameSchema,
    last_name: nameSchema,
    phone: phoneSchema,
    address: addressSchema,
    meta_data: z
        .union([z.string(), z.record(z.any())])
        .optional()
        .transform((val) => (val && typeof val !== "string" ? JSON.stringify(val) : val)),
    user_type: userTypeSchema,
    campus_id: campusIdSchema.optional(),
});

// Update user validation schema
export const updateUserSchema = z
    .object({
        user_id: userIdSchema.optional(),
        email: emailSchema.optional(),
        first_name: nameSchema.optional(),
        last_name: nameSchema.optional(),
        phone: phoneSchema.optional(),
        address: addressSchema.optional(),
        meta_data: z
            .union([z.string(), z.record(z.any())])
            .optional()
            .transform((val) => (val && typeof val !== "string" ? JSON.stringify(val) : val)),
        is_active: z.boolean().optional(),
        is_deleted: z.boolean().optional(),
        user_type: userTypeSchema.optional(),
        campus_id: campusIdSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update",
    });

// Update password validation schema
export const updatePasswordSchema = z.object({
    password: passwordSchema,
});

// Query parameters validation schema
export const getUsersQuerySchema = z.object({
    campus_id: campusIdSchema.optional(),
    user_type: userTypeSchema.optional(),
    is_active: z.boolean().optional(),
    limit: z.number().min(1).max(1000).default(100),
    skip: z.number().min(0).default(0),
});

// ID parameter validation
export const userIdParamSchema = z.object({
    id: z.string().min(1, "User ID is required"),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type UpdatePasswordData = z.infer<typeof updatePasswordSchema>;
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
