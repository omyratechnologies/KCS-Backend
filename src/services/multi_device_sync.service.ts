import { UserDevice, IUserDevice } from "@/models/user_device.model";
import { ChatRoom } from "@/models/chat_room.model";
import { ChatMessage } from "@/models/chat_message.model";
import log, { LogTypes } from "@/libs/logger";

/**
 * Multi-Device Sync Service
 * Handles device registration, message synchronization across devices
 */
export class MultiDeviceSyncService {
    /**
     * Register or update a user device
     */
    public static async registerDevice(data: {
        user_id: string;
        campus_id: string;
        device_id: string;
        device_name: string;
        device_type: "mobile" | "web" | "desktop" | "tablet";
        platform: string;
        app_version: string;
        push_token?: string;
        ip_address?: string;
        user_agent?: string;
    }): Promise<{
        success: boolean;
        data?: IUserDevice;
        error?: string;
    }> {
        try {
            // Check if device already exists
            const existingDevices = await UserDevice.find({
                user_id: data.user_id,
                device_id: data.device_id,
            });

            const existingDevice = existingDevices.rows?.[0];

            if (existingDevice) {
                // Update existing device
                const updated = await UserDevice.replaceById(existingDevice.id, {
                    ...existingDevice,
                    device_name: data.device_name,
                    device_type: data.device_type,
                    platform: data.platform,
                    app_version: data.app_version,
                    push_token: data.push_token || existingDevice.push_token,
                    is_active: true,
                    last_active_at: new Date(),
                    ip_address: data.ip_address,
                    user_agent: data.user_agent,
                    updated_at: new Date(),
                });

                log(
                    `🔄 Device updated: ${data.device_name} for user ${data.user_id}`,
                    LogTypes.LOGS,
                    "MULTI_DEVICE_SYNC"
                );

                return { success: true, data: updated };
            } else {
                // Register new device
                const newDevice = await UserDevice.create({
                    user_id: data.user_id,
                    campus_id: data.campus_id,
                    device_id: data.device_id,
                    device_name: data.device_name,
                    device_type: data.device_type,
                    platform: data.platform,
                    app_version: data.app_version,
                    push_token: data.push_token,
                    is_active: true,
                    last_active_at: new Date(),
                    ip_address: data.ip_address,
                    user_agent: data.user_agent,
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                log(
                    `✅ New device registered: ${data.device_name} for user ${data.user_id}`,
                    LogTypes.LOGS,
                    "MULTI_DEVICE_SYNC"
                );

                return { success: true, data: newDevice };
            }
        } catch (error) {
            log(`❌ Device registration failed: ${error}`, LogTypes.ERROR, "MULTI_DEVICE_SYNC");
            return {
                success: false,
                error: `Failed to register device: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Get all devices for a user
     */
    public static async getUserDevices(
        user_id: string
    ): Promise<{
        success: boolean;
        data?: IUserDevice[];
        error?: string;
    }> {
        try {
            const devices = await UserDevice.find(
                { user_id },
                { sort: { last_active_at: "DESC" } }
            );

            return {
                success: true,
                data: devices.rows || [],
            };
        } catch (error) {
            log(`❌ Failed to get user devices: ${error}`, LogTypes.ERROR, "MULTI_DEVICE_SYNC");
            return {
                success: false,
                error: `Failed to get devices: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Deactivate/logout a specific device
     */
    public static async deactivateDevice(
        user_id: string,
        device_id: string
    ): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const devices = await UserDevice.find({
                user_id,
                device_id,
            });

            const device = devices.rows?.[0];

            if (!device) {
                return {
                    success: false,
                    error: "Device not found",
                };
            }

            await UserDevice.replaceById(device.id, {
                ...device,
                is_active: false,
                updated_at: new Date(),
            });

            log(
                `🔒 Device deactivated: ${device.device_name} for user ${user_id}`,
                LogTypes.LOGS,
                "MULTI_DEVICE_SYNC"
            );

            return { success: true };
        } catch (error) {
            log(`❌ Failed to deactivate device: ${error}`, LogTypes.ERROR, "MULTI_DEVICE_SYNC");
            return {
                success: false,
                error: `Failed to deactivate device: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Sync chats - get all chat rooms and basic metadata for a user
     * Used when device first connects or reconnects
     */
    public static async syncChats(
        user_id: string,
        campus_id: string,
        device_id: string
    ): Promise<{
        success: boolean;
        data?: {
            rooms: any[];
            last_sync_timestamp: Date;
        };
        error?: string;
    }> {
        try {
            // Get all rooms user is a member of
            const allRooms = await ChatRoom.find({
                campus_id,
                is_active: true,
                is_deleted: false,
            });

            const userRooms = allRooms.rows?.filter((room: any) =>
                room.members && room.members.includes(user_id)
            ) || [];

            // Get unread count for each room
            const roomsWithMetadata = await Promise.all(
                userRooms.map(async (room: any) => {
                    const messages = await ChatMessage.find({
                        room_id: room.id,
                        campus_id,
                        is_deleted: false,
                        sender_id: { $ne: user_id },
                    });

                    const unreadCount = (messages.rows || []).filter(
                        (msg: any) => !msg.seen_by || !msg.seen_by.includes(user_id)
                    ).length;

                    return {
                        ...room,
                        unread_count: unreadCount,
                    };
                })
            );

            // Update device's last sync time
            const devices = await UserDevice.find({ user_id, device_id });
            const device = devices.rows?.[0];
            if (device) {
                await UserDevice.replaceById(device.id, {
                    ...device,
                    last_sync_at: new Date(),
                    updated_at: new Date(),
                });
            }

            log(
                `🔄 Synced ${userRooms.length} chats for user ${user_id} on device ${device_id}`,
                LogTypes.LOGS,
                "MULTI_DEVICE_SYNC"
            );

            return {
                success: true,
                data: {
                    rooms: roomsWithMetadata,
                    last_sync_timestamp: new Date(),
                },
            };
        } catch (error) {
            log(`❌ Failed to sync chats: ${error}`, LogTypes.ERROR, "MULTI_DEVICE_SYNC");
            return {
                success: false,
                error: `Failed to sync chats: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Sync messages - get messages since last sync for a specific room
     * Supports delta sync with timestamp or sequence number
     */
    public static async syncMessages(
        user_id: string,
        campus_id: string,
        room_id: string,
        options: {
            since_timestamp?: Date;
            since_sequence?: number;
            limit?: number;
        }
    ): Promise<{
        success: boolean;
        data?: {
            messages: any[];
            has_more: boolean;
            last_sequence?: number;
        };
        error?: string;
    }> {
        try {
            // Verify user has access to room
            const room = await ChatRoom.findById(room_id);
            if (!room || !room.members.includes(user_id) || room.campus_id !== campus_id) {
                return {
                    success: false,
                    error: "Access denied to this room",
                };
            }

            const limit = options.limit || 100;
            const query: any = {
                room_id,
                campus_id,
                is_deleted: false,
            };

            // Add timestamp filter if provided
            if (options.since_timestamp) {
                query.created_at = { $gt: options.since_timestamp };
            }

            // Add sequence number filter if provided
            if (options.since_sequence !== undefined) {
                query.sequence_number = { $gt: options.since_sequence };
            }

            const messages = await ChatMessage.find(query, {
                sort: { created_at: "ASC" },
                limit: limit + 1, // Fetch one extra to check if there are more
            });

            const hasMore = (messages.rows?.length || 0) > limit;
            const resultMessages = hasMore
                ? messages.rows?.slice(0, limit)
                : messages.rows || [];

            // Get the last sequence number
            const lastMessage = resultMessages[resultMessages.length - 1];
            const lastSequence = lastMessage?.sequence_number;

            log(
                `📥 Synced ${resultMessages.length} messages for room ${room_id}`,
                LogTypes.LOGS,
                "MULTI_DEVICE_SYNC"
            );

            return {
                success: true,
                data: {
                    messages: resultMessages,
                    has_more: hasMore,
                    last_sequence: lastSequence,
                },
            };
        } catch (error) {
            log(`❌ Failed to sync messages: ${error}`, LogTypes.ERROR, "MULTI_DEVICE_SYNC");
            return {
                success: false,
                error: `Failed to sync messages: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Update device's last active timestamp
     */
    public static async updateDeviceActivity(
        user_id: string,
        device_id: string
    ): Promise<void> {
        try {
            const devices = await UserDevice.find({ user_id, device_id });
            const device = devices.rows?.[0];

            if (device) {
                await UserDevice.replaceById(device.id, {
                    ...device,
                    last_active_at: new Date(),
                    updated_at: new Date(),
                });
            }
        } catch (error) {
            log(`⚠️ Failed to update device activity: ${error}`, LogTypes.ERROR, "MULTI_DEVICE_SYNC");
        }
    }

    /**
     * Get active devices count for a user
     */
    public static async getActiveDeviceCount(user_id: string): Promise<number> {
        try {
            const devices = await UserDevice.find({
                user_id,
                is_active: true,
            });

            return devices.rows?.length || 0;
        } catch (error) {
            log(`⚠️ Failed to get active device count: ${error}`, LogTypes.ERROR, "MULTI_DEVICE_SYNC");
            return 0;
        }
    }
}
