import z from "zod";
import "zod-openapi/extend";

// Base schemas
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "Error message" }),
    })
    .openapi({ ref: "ErrorResponse" });

// Device token schemas
export const deviceTokenSchema = z
    .object({
        id: z.string().openapi({ example: "token_123" }),
        user_id: z.string().openapi({ example: "user_123" }),
        campus_id: z.string().openapi({ example: "campus_123" }),
        device_token: z.string().openapi({ 
            example: "fGHy7H8j9K0:APA91bF..." 
        }),
        device_type: z.enum(["android", "ios", "web"]).openapi({ 
            example: "android" 
        }),
        device_info: z.record(z.string(), z.any()).optional().openapi({
            example: { model: "Pixel 6", os_version: "13" }
        }),
        is_active: z.boolean().openapi({ example: true }),
        last_used_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "DeviceToken" });

// Register device token
export const registerDeviceTokenRequestBodySchema = z
    .object({
        device_token: z.string().openapi({ 
            example: "fGHy7H8j9K0:APA91bF...",
            description: "FCM device token"
        }),
        device_type: z.enum(["android", "ios", "web"]).openapi({ 
            example: "android",
            description: "Type of device"
        }),
        device_info: z.record(z.string(), z.any()).optional().openapi({
            example: { 
                model: "Pixel 6", 
                os_version: "13",
                app_version: "1.0.0"
            },
            description: "Optional device information"
        }),
    })
    .openapi({ ref: "RegisterDeviceTokenRequest" });

export const registerDeviceTokenResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: "Device token registered successfully" }),
    })
    .openapi({ ref: "RegisterDeviceTokenResponse" });

// Unregister device token
export const unregisterDeviceTokenRequestBodySchema = z
    .object({
        device_token: z.string().openapi({ 
            example: "fGHy7H8j9K0:APA91bF...",
            description: "FCM device token to unregister"
        }),
    })
    .openapi({ ref: "UnregisterDeviceTokenRequest" });

// Get user device tokens
export const getUserDeviceTokensResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.array(deviceTokenSchema).openapi({
            description: "List of user's device tokens"
        }),
    })
    .openapi({ ref: "GetUserDeviceTokensResponse" });

// Test notification
export const sendTestNotificationRequestBodySchema = z
    .object({
        title: z.string().openapi({ 
            example: "Test Notification",
            description: "Notification title"
        }),
        message: z.string().openapi({ 
            example: "This is a test notification",
            description: "Notification message"
        }),
        target_user_types: z.array(z.enum(["Student", "Teacher", "Parent", "Admin"]))
            .optional()
            .openapi({
                example: ["Student", "Teacher"],
                description: "User types to send notification to (default: all except Admin)"
            }),
    })
    .openapi({ ref: "SendTestNotificationRequest" });

export const sendTestNotificationResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.object({
            success: z.boolean().openapi({ example: true }),
            total_recipients: z.number().openapi({ example: 150 }),
            successful_sends: z.number().openapi({ example: 148 }),
            failed_sends: z.number().openapi({ example: 2 }),
            details: z.object({
                tokens_sent: z.number().openapi({ example: 150 }),
                topic_sent: z.boolean().openapi({ example: true }),
                invalid_tokens: z.array(z.string()).openapi({ example: [] }),
                errors: z.array(z.string()).openapi({ example: [] }),
            }),
        }),
    })
    .openapi({ ref: "SendTestNotificationResponse" });

// Cleanup old tokens
export const cleanupOldTokensResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.object({
            cleaned: z.number().openapi({ example: 15 }),
        }),
        message: z.string().openapi({ example: "Cleaned up 15 old device tokens" }),
    })
    .openapi({ ref: "CleanupOldTokensResponse" });