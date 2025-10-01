import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { PushNotificationController } from "@/controllers/push_notification.controller";
import {
    registerDeviceTokenRequestBodySchema,
    registerDeviceTokenResponseSchema,
    unregisterDeviceTokenRequestBodySchema,
    getUserDeviceTokensResponseSchema,
    sendClassNotificationRequestBodySchema,
    sendClassNotificationResponseSchema,
    sendTestNotificationRequestBodySchema,
    sendTestNotificationResponseSchema,
    cleanupOldTokensResponseSchema,
    errorResponseSchema,
} from "@/schema/push_notification";
import { roleMiddleware } from "@/middlewares/role.middleware";

const app = new Hono();

// Register device token for push notifications
app.post(
    "/register-token",
    describeRoute({
        operationId: "registerDeviceToken",
        summary: "Register device token for push notifications",
        description: "Register a device token to receive push notifications for announcements",
        tags: ["Push Notifications"],
        responses: {
            200: {
                description: "Device token registered successfully",
                content: {
                    "application/json": {
                        schema: resolver(registerDeviceTokenResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", registerDeviceTokenRequestBodySchema),
    PushNotificationController.registerDeviceToken
);

// Unregister device token
app.post(
    "/unregister-token",
    describeRoute({
        operationId: "unregisterDeviceToken",
        summary: "Unregister device token",
        description: "Unregister a device token to stop receiving push notifications",
        tags: ["Push Notifications"],
        responses: {
            200: {
                description: "Device token unregistered successfully",
                content: {
                    "application/json": {
                        schema: resolver(registerDeviceTokenResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", unregisterDeviceTokenRequestBodySchema),
    PushNotificationController.unregisterDeviceToken
);

// Get user's device tokens
app.get(
    "/device-tokens",
    describeRoute({
        operationId: "getUserDeviceTokens",
        summary: "Get user's device tokens",
        description: "Retrieve all active device tokens for the current user",
        tags: ["Push Notifications"],
        responses: {
            200: {
                description: "Device tokens retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getUserDeviceTokensResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    PushNotificationController.getUserDeviceTokens
);

// Send notification to specific class (Teacher/Admin only)
app.post(
    "/send-to-class",
    describeRoute({
        operationId: "sendClassNotification",
        summary: "Send notification to a specific class",
        description: "Send push notification to all students in a specific class (Teacher or Admin only)",
        tags: ["Push Notifications - Teacher/Admin"],
        responses: {
            200: {
                description: "Class notification sent successfully",
                content: {
                    "application/json": {
                        schema: resolver(sendClassNotificationResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Teacher or Admin access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("send_class_notification"),
    zValidator("json", sendClassNotificationRequestBodySchema),
    PushNotificationController.sendClassNotification
);

// Send test notification (admin only)
app.post(
    "/test",
    describeRoute({
        operationId: "sendTestNotification",
        summary: "Send test push notification",
        description: "Send a test push notification to specified user types (Admin only)",
        tags: ["Push Notifications - Admin"],
        responses: {
            200: {
                description: "Test notification sent successfully",
                content: {
                    "application/json": {
                        schema: resolver(sendTestNotificationResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Admin access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", sendTestNotificationRequestBodySchema),
    PushNotificationController.sendTestNotification
);

// Cleanup old tokens (admin only)
app.post(
    "/cleanup-tokens",
    describeRoute({
        operationId: "cleanupOldTokens",
        summary: "Clean up old device tokens",
        description: "Remove inactive device tokens older than specified days (Admin only)",
        tags: ["Push Notifications - Admin"],
        parameters: [
            {
                name: "older_than_days",
                in: "query",
                required: false,
                schema: { type: "number", default: 30 },
                description: "Remove tokens older than this many days",
            },
        ],
        responses: {
            200: {
                description: "Old tokens cleaned up successfully",
                content: {
                    "application/json": {
                        schema: resolver(cleanupOldTokensResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Admin access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    PushNotificationController.cleanupOldTokens
);

export default app;