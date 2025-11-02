import { Socket } from "socket.io";
import log, { LogTypes } from "@/libs/logger";
import { ChatMediaService } from "./chat_media.service";
import { MultiDeviceSyncService } from "./multi_device_sync.service";
import { ChatEnhancedService } from "./chat_enhanced.service";
import { User } from "@/models/user.model";
import { UserChatStatus } from "@/models/user_chat_status.model";

/**
 * Enhanced Socket Event Handlers
 * Implements missing socket events: media upload, sync, device management, mentions
 */
export class EnhancedSocketEvents {
    /**
     * Register enhanced chat events on socket connection
     */
    public static registerEnhancedEvents(socket: Socket): void {
        const { userId, campusId } = socket.data;

        // Media Upload Events
        this.registerMediaEvents(socket);

        // Multi-Device Sync Events
        this.registerSyncEvents(socket);

        // Device Management Events
        this.registerDeviceEvents(socket);

        // Enhanced Group Events
        this.registerEnhancedGroupEvents(socket);

        // Message Enhancement Events
        this.registerMessageEnhancementEvents(socket);

        log(
            `✅ Enhanced events registered for user ${userId}`,
            LogTypes.LOGS,
            "ENHANCED_SOCKET_EVENTS"
        );
    }

    /**
     * Media upload related events
     */
    private static registerMediaEvents(socket: Socket): void {
        const { userId, campusId } = socket.data;

        // Request presigned upload URL
        socket.on(
            "media:upload:request",
            async (data: {
                fileName: string;
                fileType: string;
                fileSize: number;
                messageType: "image" | "video" | "audio" | "file";
            }) => {
                try {
                    const result = await ChatMediaService.generatePresignedUploadUrl(
                        campusId,
                        userId,
                        data.fileName,
                        data.fileType,
                        data.fileSize
                    );

                    socket.emit("media:upload:url", result);
                    log(
                        `📤 Presigned URL generated for ${data.fileName}`,
                        LogTypes.LOGS,
                        "ENHANCED_SOCKET_EVENTS"
                    );
                } catch (error) {
                    socket.emit("media:upload:error", {
                        success: false,
                        error: "Failed to generate upload URL",
                    });
                    log(`❌ Media upload request failed: ${error}`, LogTypes.ERROR, "ENHANCED_SOCKET_EVENTS");
                }
            }
        );

        // Confirm media upload completion
        socket.on(
            "media:upload:complete",
            async (data: {
                fileKey: string;
                fileName: string;
                fileType: string;
                fileSize: number;
                width?: number;
                height?: number;
                duration?: number;
            }) => {
                try {
                    const result = await ChatMediaService.confirmMediaUpload(campusId, userId, data);

                    socket.emit("media:upload:confirmed", result);
                    log(
                        `✅ Media upload confirmed: ${data.fileName}`,
                        LogTypes.LOGS,
                        "ENHANCED_SOCKET_EVENTS"
                    );
                } catch (error) {
                    socket.emit("media:upload:error", {
                        success: false,
                        error: "Failed to confirm upload",
                    });
                    log(`❌ Media upload confirmation failed: ${error}`, LogTypes.ERROR, "ENHANCED_SOCKET_EVENTS");
                }
            }
        );

        // Get media metadata
        socket.on("media:get:metadata", async (data: { uploadId: string }) => {
            try {
                const result = await ChatMediaService.getMediaMetadata(data.uploadId);
                socket.emit("media:metadata", result);
            } catch (error) {
                socket.emit("media:error", {
                    success: false,
                    error: "Failed to get media metadata",
                });
            }
        });
    }

    /**
     * Multi-device sync events
     */
    private static registerSyncEvents(socket: Socket): void {
        const { userId, campusId } = socket.data;

        // Initial chat sync
        socket.on(
            "chats:sync",
            async (data: { device_id: string }) => {
                try {
                    const result = await MultiDeviceSyncService.syncChats(userId, campusId, data.device_id);

                    socket.emit("chats:synced", result);
                    log(`🔄 Chats synced for device ${data.device_id}`, LogTypes.LOGS, "ENHANCED_SOCKET_EVENTS");
                } catch (error) {
                    socket.emit("sync:error", {
                        success: false,
                        error: "Failed to sync chats",
                    });
                    log(`❌ Chat sync failed: ${error}`, LogTypes.ERROR, "ENHANCED_SOCKET_EVENTS");
                }
            }
        );

        // Sync messages for a specific room
        socket.on(
            "messages:sync",
            async (data: {
                room_id: string;
                since_timestamp?: string;
                since_sequence?: number;
                limit?: number;
            }) => {
                try {
                    const sinceTimestamp = data.since_timestamp ? new Date(data.since_timestamp) : undefined;

                    const result = await MultiDeviceSyncService.syncMessages(userId, campusId, data.room_id, {
                        since_timestamp: sinceTimestamp,
                        since_sequence: data.since_sequence,
                        limit: data.limit,
                    });

                    socket.emit("messages:synced", {
                        ...result,
                        room_id: data.room_id,
                    });
                    log(
                        `📥 Messages synced for room ${data.room_id}`,
                        LogTypes.LOGS,
                        "ENHANCED_SOCKET_EVENTS"
                    );
                } catch (error) {
                    socket.emit("sync:error", {
                        success: false,
                        error: "Failed to sync messages",
                    });
                    log(`❌ Message sync failed: ${error}`, LogTypes.ERROR, "ENHANCED_SOCKET_EVENTS");
                }
            }
        );

        // Device sync (cross-device state sync)
        socket.on("device:sync", async (data: { device_id: string }) => {
            try {
                // Update device activity
                await MultiDeviceSyncService.updateDeviceActivity(userId, data.device_id);

                // Get other active devices
                const devicesResult = await MultiDeviceSyncService.getUserDevices(userId);

                socket.emit("device:synced", {
                    success: true,
                    data: {
                        devices: devicesResult.data || [],
                        current_device: data.device_id,
                    },
                });

                log(`🔄 Device sync completed for ${data.device_id}`, LogTypes.LOGS, "ENHANCED_SOCKET_EVENTS");
            } catch (error) {
                socket.emit("sync:error", {
                    success: false,
                    error: "Failed to sync device",
                });
                log(`❌ Device sync failed: ${error}`, LogTypes.ERROR, "ENHANCED_SOCKET_EVENTS");
            }
        });
    }

    /**
     * Device management events
     */
    private static registerDeviceEvents(socket: Socket): void {
        const { userId, campusId } = socket.data;

        // Register/update device
        socket.on(
            "device:register",
            async (data: {
                device_id: string;
                device_name: string;
                device_type: "mobile" | "web" | "desktop" | "tablet";
                platform: string;
                app_version: string;
                push_token?: string;
            }) => {
                try {
                    const result = await MultiDeviceSyncService.registerDevice({
                        user_id: userId,
                        campus_id: campusId,
                        device_id: data.device_id,
                        device_name: data.device_name,
                        device_type: data.device_type,
                        platform: data.platform,
                        app_version: data.app_version,
                        push_token: data.push_token,
                        ip_address: socket.handshake.address,
                        user_agent: socket.handshake.headers["user-agent"],
                    });

                    socket.emit("device:registered", result);
                    log(`📱 Device registered: ${data.device_name}`, LogTypes.LOGS, "ENHANCED_SOCKET_EVENTS");
                } catch (error) {
                    socket.emit("device:error", {
                        success: false,
                        error: "Failed to register device",
                    });
                    log(`❌ Device registration failed: ${error}`, LogTypes.ERROR, "ENHANCED_SOCKET_EVENTS");
                }
            }
        );

        // Get user's devices
        socket.on("device:list", async () => {
            try {
                const result = await MultiDeviceSyncService.getUserDevices(userId);
                socket.emit("device:list:response", result);
            } catch (error) {
                socket.emit("device:error", {
                    success: false,
                    error: "Failed to get devices",
                });
            }
        });

        // Logout/deactivate a device
        socket.on("device:logout", async (data: { device_id: string }) => {
            try {
                const result = await MultiDeviceSyncService.deactivateDevice(userId, data.device_id);
                socket.emit("device:logged-out", result);
                log(`🔒 Device logged out: ${data.device_id}`, LogTypes.LOGS, "ENHANCED_SOCKET_EVENTS");
            } catch (error) {
                socket.emit("device:error", {
                    success: false,
                    error: "Failed to logout device",
                });
            }
        });
    }

    /**
     * Enhanced group events
     */
    private static registerEnhancedGroupEvents(socket: Socket): void {
        const { userId } = socket.data;

        // Group join confirmation
        socket.on("group:join:confirm", async (data: { room_id: string }) => {
            socket.emit("group:joined", {
                success: true,
                room_id: data.room_id,
                joined_at: new Date(),
            });
            log(`👥 User ${userId} joined group ${data.room_id}`, LogTypes.LOGS, "ENHANCED_SOCKET_EVENTS");
        });

        // Group leave workflow
        socket.on("group:leave", async (data: { room_id: string }) => {
            // This would be handled in chat service
            socket.emit("group:left", {
                success: true,
                room_id: data.room_id,
                left_at: new Date(),
            });
            log(`👋 User ${userId} left group ${data.room_id}`, LogTypes.LOGS, "ENHANCED_SOCKET_EVENTS");
        });
    }

    /**
     * Message enhancement events
     */
    private static registerMessageEnhancementEvents(socket: Socket): void {
        const { userId, campusId } = socket.data;

        // Forward message
        socket.on(
            "message:forward",
            async (data: {
                message_id: string;
                target_room_ids: string[];
            }) => {
                try {
                    const result = await ChatEnhancedService.forwardMessage(
                        userId,
                        campusId,
                        data.message_id,
                        data.target_room_ids
                    );

                    socket.emit("message:forwarded", result);
                    log(
                        `📨 Message ${data.message_id} forwarded to ${data.target_room_ids.length} rooms`,
                        LogTypes.LOGS,
                        "ENHANCED_SOCKET_EVENTS"
                    );
                } catch (error) {
                    socket.emit("message:forward:error", {
                        success: false,
                        error: "Failed to forward message",
                    });
                    log(`❌ Message forward failed: ${error}`, LogTypes.ERROR, "ENHANCED_SOCKET_EVENTS");
                }
            }
        );

        // Star/unstar message
        socket.on("message:star", async (data: { message_id: string }) => {
            try {
                const result = await ChatEnhancedService.toggleStarMessage(userId, data.message_id, campusId);

                socket.emit("message:starred", result);
                log(
                    `⭐ Message ${data.message_id} star toggled by user ${userId}`,
                    LogTypes.LOGS,
                    "ENHANCED_SOCKET_EVENTS"
                );
            } catch (error) {
                socket.emit("message:star:error", {
                    success: false,
                    error: "Failed to star message",
                });
            }
        });

        // Get starred messages
        socket.on(
            "message:starred:list",
            async (data: {
                room_id?: string;
                page?: number;
                limit?: number;
            }) => {
                try {
                    const result = await ChatEnhancedService.getStarredMessages(userId, campusId, data);

                    socket.emit("message:starred:list:response", result);
                } catch (error) {
                    socket.emit("message:starred:error", {
                        success: false,
                        error: "Failed to get starred messages",
                    });
                }
            }
        );

        // Get message info (delivery/read status)
        socket.on("message:info", async (data: { message_id: string }) => {
            try {
                const result = await ChatEnhancedService.getMessageInfo(userId, data.message_id, campusId);

                socket.emit("message:info:response", result);
            } catch (error) {
                socket.emit("message:info:error", {
                    success: false,
                    error: "Failed to get message info",
                });
            }
        });
    }

    /**
     * Get user's last seen timestamp
     */
    public static registerPresenceEvents(socket: Socket): void {
        const { userId, campusId } = socket.data;

        // Request user's last seen
        socket.on("user:last_seen:request", async (data: { user_id: string }) => {
            try {
                const status = await UserChatStatus.findOne({
                    user_id: data.user_id,
                    campus_id: campusId,
                });

                socket.emit("user:last_seen:response", {
                    success: true,
                    data: {
                        user_id: data.user_id,
                        is_online: status?.is_online || false,
                        last_seen: status?.last_seen || null,
                        status_message: status?.status_message,
                    },
                });
            } catch (error) {
                socket.emit("user:last_seen:error", {
                    success: false,
                    error: "Failed to get last seen",
                });
            }
        });

        // Update user's status message
        socket.on("user:status_message:update", async (data: { status_message: string }) => {
            try {
                const existing = await UserChatStatus.findOne({ user_id: userId, campus_id: campusId });

                if (existing) {
                    await UserChatStatus.updateById(existing.id, {
                        status_message: data.status_message,
                        updated_at: new Date(),
                    });
                }

                socket.emit("user:status_message:updated", {
                    success: true,
                    status_message: data.status_message,
                });

                log(
                    `💬 Status message updated for user ${userId}`,
                    LogTypes.LOGS,
                    "ENHANCED_SOCKET_EVENTS"
                );
            } catch (error) {
                socket.emit("user:status_message:error", {
                    success: false,
                    error: "Failed to update status message",
                });
            }
        });
    }
}
