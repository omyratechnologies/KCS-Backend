import z from "zod";

import "zod-openapi/extend";

// Head Route /auth
// Sub Route /login
export const loginRequestBodySchema = z
    .object({
        login_id: z.string().openapi({ examples: ["hi@mail.com", "1123123"] }),
        password: z.string().openapi({ example: "password" }),
    })
    .openapi({ ref: "loginRequestBody" });

export const loginResponseSchema = z
    .object({
        access_token: z
            .string()
            .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }),
        refresh_token: z
            .string()
            .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }),
        expires_in: z.number().openapi({ example: 3600 }),
        type: z.string().openapi({ example: "Bearer" }),
    })
    .openapi({ ref: "loginResponse" });

// Sub Route /forgot
export const forgotPasswordRequestBodySchema = z.object({
    email: z.string().email().openapi({ example: "hi@mail.com" }),
});

export const forgotPasswordResponseSchema = z
    .object({
        message: z.string().openapi({ example: "Password reset email sent" }),
    })
    .openapi({ ref: "forgotPasswordResponse" });

// Sub Route /reset
export const resetPasswordRequestBodySchema = z
    .object({
        email: z.string().email().openapi({ example: "hi@mail.com" }),
        otp: z.string().openapi({ example: "123456" }),
        password: z.string().openapi({ example: "password" }),
    })
    .openapi({ ref: "resetPasswordRequestBody" });

export const resetPasswordResponseSchema = z
    .object({
        message: z.string().openapi({ example: "Password reset successfully" }),
    })
    .openapi({ ref: "resetPasswordResponse" });

// Sub Route /refresh
export const refreshTokenRequestBodySchema = z
    .object({
        refresh_token: z
            .string()
            .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }),
    })
    .openapi({ ref: "refreshTokenRequestBody" });
export const refreshTokenResponseSchema = z
    .object({
        access_token: z
            .string()
            .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }),
        refresh_token: z
            .string()
            .openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }),
        expires_in: z.number().openapi({ example: 3600 }),
        type: z.string().openapi({ example: "Bearer" }),
    })
    .openapi({ ref: "refreshTokenResponse" });

// Sub Route /me
export const meResponseSchema = z
    .object({
        id: z.string(),
        user_id: z.string(),
        email: z.string(),
        first_name: z.string(),
        last_name: z.string(),
        phone: z.string(),
        address: z.string(),
        last_login: z.string(),
        meta_data: z.record(z.string(), z.any()),
        is_active: z.boolean(),
        is_deleted: z.boolean(),
        user_type: z.string(),
        campus_id: z.string(),
        created_at: z.string(),
        updated_at: z.string(),
    })
    .openapi({ ref: "meResponse" });
