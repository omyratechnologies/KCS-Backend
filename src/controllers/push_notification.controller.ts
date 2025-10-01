import { Context } from "hono";
import { PushNotificationService } from "@/services/push_notification.service";

export class PushNotificationController {
    /**
     * Register a device token for push notifications
     */
    public static readonly registerDeviceToken = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            const {
                device_token,
                device_type,
                device_info,
            }: {
                device_token: string;
                device_type: "android" | "ios" | "web";
                device_info?: Record<string, unknown>;
            } = await ctx.req.json();

            if (!device_token) {
                return ctx.json(
                    {
                        success: false,
                        message: "Device token is required",
                    },
                    400
                );
            }

            if (!device_type || !["android", "ios", "web"].includes(device_type)) {
                return ctx.json(
                    {
                        success: false,
                        message: "Valid device type is required (android, ios, web)",
                    },
                    400
                );
            }

            const result = await PushNotificationService.registerDeviceToken(
                user_id,
                campus_id,
                device_token,
                device_type,
                device_info
            );

            return ctx.json(result);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Unregister a device token
     */
    public static readonly unregisterDeviceToken = async (ctx: Context) => {
        try {
            const { device_token }: { device_token: string } = await ctx.req.json();

            if (!device_token) {
                return ctx.json(
                    {
                        success: false,
                        message: "Device token is required",
                    },
                    400
                );
            }

            const result = await PushNotificationService.unregisterDeviceToken(device_token);

            return ctx.json(result);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get user's device tokens
     */
    public static readonly getUserDeviceTokens = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");

            const tokens = await PushNotificationService.getUserDeviceTokens(user_id);

            return ctx.json({
                success: true,
                data: tokens,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Send a test push notification (admin only)
     */
    public static readonly sendTestNotification = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");
            const campus_id = ctx.get("campus_id");

            // Only allow admins to send test notifications
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const {
                title,
                message,
                target_user_types,
            }: {
                title: string;
                message: string;
                target_user_types?: Array<"Student" | "Teacher" | "Parent" | "Admin">;
            } = await ctx.req.json();

            if (!title || !message) {
                return ctx.json(
                    {
                        success: false,
                        message: "Title and message are required",
                    },
                    400
                );
            }

            const result = await PushNotificationService.sendCampusWideNotification({
                title,
                message,
                notification_type: "campus_wide",
                campus_id,
                target_user_types: target_user_types || ["Student", "Teacher", "Parent"],
                data: {
                    type: "test",
                    priority: "normal",
                },
            });

            return ctx.json({
                success: result.success,
                data: result,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Clean up old device tokens (admin only)
     */
    public static readonly cleanupOldTokens = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only allow admins to cleanup tokens
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({ error: "Unauthorized" }, 403);
            }

            const { older_than_days } = ctx.req.query();
            const days = older_than_days ? Number.parseInt(older_than_days as string) : 30;

            const result = await PushNotificationService.cleanupOldTokens(days);

            return ctx.json({
                success: true,
                data: result,
                message: `Cleaned up ${result.cleaned} old device tokens`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };
}