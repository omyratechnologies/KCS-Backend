import { FirebaseService } from "./firebase.service";
import { UserDeviceToken, IUserDeviceToken } from "@/models/user_device_token.model";
import { User } from "@/models/user.model";

export interface PushNotificationPayload {
    title: string;
    message: string;
    data?: Record<string, string | number | boolean>;
    notification_type: "campus_wide" | "class" | "student" | "teacher" | "parent";
    campus_id: string;
    target_users?: string[]; // Specific user IDs to send to
    target_user_types?: Array<"Student" | "Teacher" | "Parent" | "Admin">; // User types to send to
    class_id?: string; // For class-specific notifications
}

export interface PushNotificationResult {
    success: boolean;
    total_recipients: number;
    successful_sends: number;
    failed_sends: number;
    details: {
        tokens_sent: number;
        topic_sent: boolean;
        invalid_tokens: string[];
        errors: string[];
    };
}

export class PushNotificationService {
    /**
     * Send push notification for campus-wide announcements
     */
    public static async sendCampusWideNotification(payload: PushNotificationPayload): Promise<PushNotificationResult> {
        try {
            // Send to campus topic for immediate delivery
            const topicName = `campus_${payload.campus_id}`;
            const topicResult = await FirebaseService.sendToTopic({
                title: payload.title,
                message: payload.message,
                data: {
                    notification_type: payload.notification_type,
                    campus_id: payload.campus_id,
                    ...payload.data,
                },
                topic: topicName,
            });

            // Also send to individual tokens for better reliability
            const tokenResult = await this.sendToDeviceTokens(payload);

            return {
                success: topicResult.success || tokenResult.success,
                total_recipients: tokenResult.total_recipients,
                successful_sends: tokenResult.successful_sends,
                failed_sends: tokenResult.failed_sends,
                details: {
                    tokens_sent: tokenResult.details.tokens_sent,
                    topic_sent: topicResult.success,
                    invalid_tokens: tokenResult.details.invalid_tokens,
                    errors: [
                        ...(topicResult.error ? [topicResult.error] : []),
                        ...tokenResult.details.errors
                    ],
                },
            };
        } catch {
            return {
                success: false,
                total_recipients: 0,
                successful_sends: 0,
                failed_sends: 0,
                details: {
                    tokens_sent: 0,
                    topic_sent: false,
                    invalid_tokens: [],
                    errors: ["Error sending notification"],
                },
            };
        }
    }

    /**
     * Send push notification to specific users
     */
    public static async sendToSpecificUsers(payload: PushNotificationPayload): Promise<PushNotificationResult> {
        return await this.sendToDeviceTokens(payload);
    }

    /**
     * Send push notification based on user types
     */
    public static async sendToUserTypes(payload: PushNotificationPayload): Promise<PushNotificationResult> {
        return await this.sendToDeviceTokens(payload);
    }

    /**
     * Core method to send notifications to device tokens
     */
    private static async sendToDeviceTokens(payload: PushNotificationPayload): Promise<PushNotificationResult> {
        try {
            // Get target device tokens
            const tokens = await this.getTargetDeviceTokens(payload);

            if (tokens.length === 0) {
                return {
                    success: false,
                    total_recipients: 0,
                    successful_sends: 0,
                    failed_sends: 0,
                    details: {
                        tokens_sent: 0,
                        topic_sent: false,
                        invalid_tokens: [],
                        errors: ["No device tokens found for target users"],
                    },
                };
            }

            // Send notification to tokens
            const result = await FirebaseService.sendToTokens({
                title: payload.title,
                message: payload.message,
                data: {
                    notification_type: payload.notification_type,
                    campus_id: payload.campus_id,
                    ...(payload.class_id && { class_id: payload.class_id }),
                    ...payload.data,
                },
                tokens: tokens,
            });

            // Clean up invalid tokens
            if (result.results) {
                await this.handleInvalidTokens(result.results, tokens);
            }

            return {
                success: result.success,
                total_recipients: tokens.length,
                successful_sends: result.successCount,
                failed_sends: result.failureCount,
                details: {
                    tokens_sent: tokens.length,
                    topic_sent: false,
                    invalid_tokens: [],
                    errors: result.error ? [result.error] : [],
                },
            };
        } catch {
            return {
                success: false,
                total_recipients: 0,
                successful_sends: 0,
                failed_sends: 0,
                details: {
                    tokens_sent: 0,
                    topic_sent: false,
                    invalid_tokens: [],
                    errors: ["Error sending notification"],
                },
            };
        }
    }

    /**
     * Get device tokens for target users
     */
    private static async getTargetDeviceTokens(payload: PushNotificationPayload): Promise<string[]> {
        try {
            const userFilters: Record<string, unknown> = {
                campus_id: payload.campus_id,
                is_active: true,
                is_deleted: false,
            };

            // Filter by specific users if provided
            if (payload.target_users && payload.target_users.length > 0) {
                userFilters.id = { $in: payload.target_users };
            }

            // Filter by user types if provided
            if (payload.target_user_types && payload.target_user_types.length > 0) {
                userFilters.user_type = { $in: payload.target_user_types };
            }

            // Get users based on filters
            const usersResult = await User.find(userFilters);
            const users = usersResult.rows || [];

            if (users.length === 0) {
                return [];
            }

            // Get device tokens for these users
            const userIds = users.map(user => user.id);
            const tokensResult = await UserDeviceToken.find({
                user_id: { $in: userIds },
                is_active: true,
            });

            const deviceTokens = tokensResult.rows || [];
            return deviceTokens.map(token => token.device_token);
        } catch {
            return [];
        }
    }

    /**
     * Handle invalid tokens by deactivating them
     */
    private static async handleInvalidTokens(
        results: Array<{ success: boolean; error?: { code: string } }>,
        tokens: string[]
    ): Promise<void> {
        try {
            const invalidTokens: string[] = [];

            results.forEach((result, index) => {
                if (!result.success && result.error) {
                    const errorCode = result.error.code;
                    // FCM error codes that indicate invalid tokens
                    if (
                        errorCode === "messaging/invalid-registration-token" ||
                        errorCode === "messaging/registration-token-not-registered"
                    ) {
                        invalidTokens.push(tokens[index]);
                    }
                }
            });

            // Deactivate invalid tokens
            if (invalidTokens.length > 0) {
                await UserDeviceToken.updateMany(
                    { device_token: { $in: invalidTokens } },
                    { is_active: false, updated_at: new Date() }
                );
            }
        } catch {
            // Error handling invalid tokens
        }
    }

    /**
     * Register a new device token for a user
     */
    public static async registerDeviceToken(
        user_id: string,
        campus_id: string,
        device_token: string,
        device_type: "android" | "ios" | "web",
        device_info?: Record<string, unknown>
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Check if token already exists
            let existingToken;
            try {
                existingToken = await UserDeviceToken.findOne({ device_token });
            } catch (findError) {
                // If collection doesn't exist or document not found, treat as new token
                if (findError instanceof Error && 
                    (findError.message.includes("document not found") || 
                     findError.message.includes("collection_not_found"))) {
                    existingToken = null;
                } else {
                    throw findError;
                }
            }

            if (existingToken) {
                // Update existing token
                await UserDeviceToken.updateById(existingToken.id, {
                    user_id,
                    campus_id,
                    device_type,
                    device_info,
                    is_active: true,
                    last_used_at: new Date(),
                    updated_at: new Date(),
                });
            } else {
                // Create new token
                await UserDeviceToken.create({
                    id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id,
                    campus_id,
                    device_token,
                    device_type,
                    device_info: device_info || {},
                    is_active: true,
                    last_used_at: new Date(),
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }

            // Subscribe to campus topic
            const topicName = `campus_${campus_id}`;
            await FirebaseService.subscribeToTopic([device_token], topicName);

            return {
                success: true,
                message: "Device token registered successfully",
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Unregister a device token
     */
    public static async unregisterDeviceToken(device_token: string): Promise<{ success: boolean; message: string }> {
        try {
            // Find and deactivate the token
            const tokenRecord = await UserDeviceToken.findOne({ device_token });
            
            if (tokenRecord) {
                await UserDeviceToken.updateById(tokenRecord.id, {
                    is_active: false,
                    updated_at: new Date(),
                });

                // Unsubscribe from campus topic
                const topicName = `campus_${tokenRecord.campus_id}`;
                await FirebaseService.unsubscribeFromTopic([device_token], topicName);
            }

            return {
                success: true,
                message: "Device token unregistered successfully",
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Get device tokens for a user
     */
    public static async getUserDeviceTokens(user_id: string): Promise<IUserDeviceToken[]> {
        try {
            const result = await UserDeviceToken.find({
                user_id,
                is_active: true,
            });

            return result.rows || [];
        } catch {
            return [];
        }
    }

    /**
     * Clean up old or inactive tokens
     */
    public static async cleanupOldTokens(olderThanDays: number = 30): Promise<{ cleaned: number }> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

            const result = await UserDeviceToken.updateMany(
                {
                    last_used_at: { $lt: cutoffDate },
                    is_active: true,
                },
                {
                    is_active: false,
                    updated_at: new Date(),
                }
            );

            return { cleaned: (result as { modifiedCount?: number }).modifiedCount || 0 };
        } catch {
            return { cleaned: 0 };
        }
    }
}