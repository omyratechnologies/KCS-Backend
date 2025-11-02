import { Context } from "hono";
import { ChatServiceOptimized as ChatService } from "../services/chat.service.optimized";
import { ChatValidationService } from "../services/chat_validation.service";
import { SocketServiceOptimized as SocketService } from "../services/socket.service.optimized";
import { ChatMediaService } from "../services/chat_media.service";
import { MultiDeviceSyncService } from "../services/multi_device_sync.service";
import { ChatEnhancedService } from "../services/chat_enhanced.service";
import log, { LogTypes } from "../libs/logger";

export class ChatController {
    /**
     * Get user's chat rooms
     */
    public static readonly getChatRooms = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const result = await ChatService.getUserChatRooms(user_id, campus_id);

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: result.data,
                    message: "Chat rooms retrieved successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to get chat rooms"
            }, 500);
        }
    };

    /**
     * Create a new group chat
     * Note: Teacher/Admin validation is handled by teacherOrAdminMiddleware
     */
    public static readonly createGroupChat = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const groupData = await ctx.req.json();

            

            // Validate required fields
            if (!groupData.room_type || !groupData.name) {
                return ctx.json({
                    success: false,
                    error: "Room type and name are required"
                }, 400);
            }

            // Validate room type
            if (!["class_group", "subject_group", "custom_group"].includes(groupData.room_type)) {
                return ctx.json({
                    success: false,
                    error: "Invalid room type"
                }, 400);
            }

            const result = await ChatService.createGroupChatRoom(user_id, campus_id, groupData);

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: result.data,
                    message: "Group chat created successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Create group chat controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: `Failed to create group chat: ${error instanceof Error ? error.message : 'Unknown error'}`
            }, 500);
        }
    };

    /**
     * Send a message
     */
    public static readonly sendMessage = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const room_id = ctx.req.param('room_id'); // Get room_id from URL params

            const messageData = await ctx.req.json();

            // Validate required fields
            if (!messageData.content) {
                return ctx.json({
                    success: false,
                    error: "Message content is required"
                }, 400);
            }

            // If room_id is in URL params, use it; otherwise check for room_id or recipient_id in body
            if (room_id) {
                messageData.room_id = room_id;
            } else if (!messageData.room_id && !messageData.recipient_id) {
                return ctx.json({
                    success: false,
                    error: "Either room_id or recipient_id is required"
                }, 400);
            }

            const result = await ChatService.sendMessage(user_id, campus_id, messageData);

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: result.data,
                    message: "Message sent successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to send message"
            }, 500);
        }
    };

    /**
     * Get messages for a chat (room or personal)
     */
    public static readonly getMessages = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const query = ctx.req.query();
            let room_id = ctx.req.param('room_id'); // Get room_id from URL params
            const recipient_id = query.recipient_id as string;
            const page = query.page ? Number.parseInt(query.page as string, 10) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string, 10) : 50;

            // If not in URL params, check query params
            if (!room_id) {
                room_id = query.room_id as string;
            }

            // Must have either room_id or recipient_id
            if (!room_id && !recipient_id) {
                return ctx.json({
                    success: false,
                    error: "Either room_id or recipient_id is required"
                }, 400);
            }

            const result = await ChatService.getMessages(user_id, campus_id, {
                room_id,
                recipient_id,
                page,
                limit
            });

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination,
                    message: "Messages retrieved successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to get messages"
            }, 500);
        }
    };

    /**
     * Get available contacts for messaging
     */
    public static readonly getAvailableContacts = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            const result = await ChatValidationService.getAvailableContacts(user_id, campus_id);

            if (result.error) {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }

            // Group contacts by type for better organization
            const contacts = {
                teachers: result.users.filter(user => user.user_type === "Teacher"),
                students: result.users.filter(user => user.user_type === "Student"),
                admins: result.users.filter(user => ["Admin", "Super Admin"].includes(user.user_type)),
                parents: result.users.filter(user => user.user_type === "Parent"),
            };

            // Customize response based on user type
            let responseData: Record<string, unknown>;

            if (user_type === "Student") {
                // Students see teachers and classmates
                responseData = {
                    teachers: contacts.teachers,
                    classmates: contacts.students,
                    total_teachers: contacts.teachers.length,
                    total_classmates: contacts.students.length
                };
            } else if (user_type === "Parent") {
                // Parents see teachers and students
                responseData = {
                    teachers: contacts.teachers,
                    students: contacts.students,
                    total_teachers: contacts.teachers.length,
                    total_students: contacts.students.length
                };
            } else if (["Admin", "Super Admin"].includes(user_type)) {
                // Admins see everyone
                responseData = {
                    teachers: contacts.teachers,
                    students: contacts.students,
                    admins: contacts.admins,
                    parents: contacts.parents,
                    total_teachers: contacts.teachers.length,
                    total_students: contacts.students.length,
                    total_admins: contacts.admins.length,
                    total_parents: contacts.parents.length
                };
            } else if (user_type === "Teacher") {
                // Teachers see everyone
                responseData = {
                    teachers: contacts.teachers,
                    students: contacts.students,
                    admins: contacts.admins,
                    parents: contacts.parents,
                    total_teachers: contacts.teachers.length,
                    total_students: contacts.students.length,
                    total_admins: contacts.admins.length,
                    total_parents: contacts.parents.length
                };
            } else {
                // Default response for other user types
                responseData = {
                    teachers: contacts.teachers,
                    students: contacts.students,
                    admins: contacts.admins,
                    parents: contacts.parents,
                    total_teachers: contacts.teachers.length,
                    total_students: contacts.students.length,
                    total_admins: contacts.admins.length,
                    total_parents: contacts.parents.length
                };
            }

            return ctx.json({
                success: true,
                data: responseData,
                message: "Available contacts retrieved successfully"
            });
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to get available contacts"
            }, 500);
        }
    };

    /**
     * Create or get personal chat room
     */
    public static readonly createPersonalChat = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const { recipient_id } = await ctx.req.json();

            if (!recipient_id) {
                return ctx.json({
                    success: false,
                    error: "Recipient ID is required"
                }, 400);
            }

            const result = await ChatService.createPersonalChatRoom(user_id, recipient_id, campus_id);

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: result.data,
                    message: "Personal chat room created/retrieved successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to create personal chat"
            }, 500);
        }
    };

    /**
     * Get WebSocket connection statistics (Admin only)
     */
    public static readonly getWebSocketStats = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json({
                    success: false,
                    error: "Access denied"
                }, 403);
            }

            const stats = SocketService.getChatStats();

            return ctx.json({
                success: true,
                data: {
                    ...stats,
                    message: "Real-time chat statistics",
                    timestamp: new Date().toISOString()
                },
                message: "WebSocket statistics retrieved successfully"
            });
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to get WebSocket statistics"
            }, 500);
        }
    };

    /**
     * Validate if user can message another user
     */
    public static readonly validateMessaging = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const { recipient_id } = await ctx.req.json();

            if (!recipient_id) {
                return ctx.json({
                    success: false,
                    error: "Recipient ID is required"
                }, 400);
            }

            const validation = await ChatValidationService.canSendPersonalMessage(
                user_id,
                recipient_id,
                campus_id
            );

            return ctx.json({
                success: true,
                data: {
                    can_message: validation.canSend,
                    reason: validation.reason
                },
                message: "Messaging validation completed"
            });
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to validate messaging"
            }, 500);
        }
    };

    /**
     * Validate if user can send personal message to another user
     */
    public static readonly validatePersonalMessage = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            
            const { recipient_id } = await ctx.req.json();

            if (!recipient_id) {
                return ctx.json({
                    success: false,
                    error: "Recipient ID is required"
                }, 400);
            }

            const result = await ChatValidationService.canSendPersonalMessage(user_id, recipient_id, campus_id);

            return ctx.json({
                success: true,
                data: {
                    can_message: result,
                    message: result ? "User can send message" : "User cannot send message to this recipient"
                }
            });
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to validate personal message"
            }, 500);
        }
    };

    /**
     * Check if user can create a specific type of group
     */
    public static readonly validateGroupCreation = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const { room_type, class_id, subject_id, members } = await ctx.req.json();

            if (!room_type) {
                return ctx.json({
                    success: false,
                    error: "Room type is required"
                }, 400);
            }

            if (!["class_group", "subject_group", "custom_group"].includes(room_type)) {
                return ctx.json({
                    success: false,
                    error: "Invalid room type"
                }, 400);
            }

            const validation = await ChatValidationService.canCreateGroup(
                user_id,
                campus_id,
                room_type,
                { class_id, subject_id },
                members
            );

            return ctx.json({
                success: true,
                data: {
                    can_create: validation.canCreate,
                    reason: validation.reason
                },
                message: "Group creation validation completed"
            });
        } catch {
            return ctx.json({
                success: false,
                error: "Failed to validate group creation"
            }, 500);
        }
    };

    /**
     * Delete a message
     * Students can delete their own messages
     * Teachers can delete their own and student messages
     */
    public static readonly deleteMessage = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const message_id = ctx.req.param('message_id');

            if (!message_id) {
                return ctx.json({
                    success: false,
                    error: "Message ID is required"
                }, 400);
            }

            const result = await ChatService.deleteMessage(user_id, message_id, campus_id, user_type);

            if (result.success) {
                return ctx.json({
                    success: true,
                    message: "Message deleted successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Delete message controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to delete message"
            }, 500);
        }
    };

    /**
     * Get deleted messages for a room (Teachers, Admins, Super Admins only)
     */
    public static readonly getDeletedMessages = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const room_id = ctx.req.param('room_id');

            if (!room_id) {
                return ctx.json({
                    success: false,
                    error: "Room ID is required"
                }, 400);
            }

            const query = ctx.req.query();
            const page = query.page ? Number.parseInt(query.page as string, 10) : 1;
            const limit = query.limit ? Number.parseInt(query.limit as string, 10) : 50;

            const result = await ChatService.getDeletedMessages(user_id, campus_id, user_type, {
                room_id,
                page,
                limit
            });

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination,
                    message: "Deleted messages retrieved successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 403);
            }
        } catch (error) {
            log(`Get deleted messages controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to get deleted messages"
            }, 500);
        }
    };

    /**
     * Mark a message as seen by the authenticated user
     */
    public static readonly markMessageAsSeen = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const message_id = ctx.req.param('message_id');

            if (!message_id) {
                return ctx.json({
                    success: false,
                    error: "Message ID is required"
                }, 400);
            }

            const result = await ChatService.markMessageAsSeen(user_id, message_id, campus_id);

            if (result.success) {
                return ctx.json({
                    success: true,
                    message: "Message marked as seen"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Mark message as seen controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to mark message as seen"
            }, 500);
        }
    };

    /**
     * Edit a message
     */
    public static readonly editMessage = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const message_id = ctx.req.param('message_id');

            if (!message_id) {
                return ctx.json({
                    success: false,
                    error: "Message ID is required"
                }, 400);
            }

            const { content } = await ctx.req.json();

            if (!content) {
                return ctx.json({
                    success: false,
                    error: "Message content is required"
                }, 400);
            }

            const result = await ChatService.editMessage(user_id, message_id, campus_id, content);

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: result.data,
                    message: "Message edited successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Edit message controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to edit message"
            }, 500);
        }
    };

    /**
     * Add reaction to a message
     */
    public static readonly addReaction = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const message_id = ctx.req.param('message_id');
            const emoji = ctx.req.param('emoji');

            if (!message_id || !emoji) {
                return ctx.json({
                    success: false,
                    error: "Message ID and emoji are required"
                }, 400);
            }

            const result = await ChatService.addReaction(user_id, message_id, campus_id, emoji);

            if (result.success) {
                return ctx.json({
                    success: true,
                    message: "Reaction added successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Add reaction controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to add reaction"
            }, 500);
        }
    };

    /**
     * Remove reaction from a message
     */
    public static readonly removeReaction = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const message_id = ctx.req.param('message_id');
            const emoji = ctx.req.param('emoji');

            if (!message_id || !emoji) {
                return ctx.json({
                    success: false,
                    error: "Message ID and emoji are required"
                }, 400);
            }

            const result = await ChatService.removeReaction(user_id, message_id, campus_id, emoji);

            if (result.success) {
                return ctx.json({
                    success: true,
                    message: "Reaction removed successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Remove reaction controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to remove reaction"
            }, 500);
        }
    };

    /**
     * Mark message as delivered
     */
    public static readonly markMessageAsDelivered = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const message_id = ctx.req.param('message_id');

            if (!message_id) {
                return ctx.json({
                    success: false,
                    error: "Message ID is required"
                }, 400);
            }

            const result = await ChatService.markMessageAsDelivered(user_id, message_id, campus_id);

            if (result.success) {
                return ctx.json({
                    success: true,
                    message: "Message marked as delivered"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Mark message as delivered controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to mark message as delivered"
            }, 500);
        }
    };

    /**
     * Get unread message count
     */
    public static readonly getUnreadCount = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const room_id = ctx.req.query('room_id') as string;

            const result = await ChatService.getUnreadCount(user_id, campus_id, room_id);

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: room_id ? { unread_count: result.count } : { rooms: result.rooms },
                    message: "Unread count retrieved successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Get unread count controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to get unread count"
            }, 500);
        }
    };

    /**
     * Search messages
     */
    public static readonly searchMessages = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const query = ctx.req.query();
            const options = {
                query: query.q as string,
                room_id: query.room_id as string,
                sender_id: query.sender_id as string,
                from_date: query.from_date ? new Date(query.from_date as string) : undefined,
                to_date: query.to_date ? new Date(query.to_date as string) : undefined,
                message_type: query.message_type as string,
                page: query.page ? Number.parseInt(query.page as string, 10) : 1,
                limit: query.limit ? Number.parseInt(query.limit as string, 10) : 50,
            };

            const result = await ChatService.searchMessages(user_id, campus_id, options);

            if (result.success) {
                return ctx.json({
                    success: true,
                    data: result.data,
                    pagination: result.pagination,
                    message: "Messages retrieved successfully"
                });
            } else {
                return ctx.json({
                    success: false,
                    error: result.error
                }, 400);
            }
        } catch (error) {
            log(`Search messages controller error: ${error}`, LogTypes.ERROR, "CHAT_CONTROLLER");
            return ctx.json({
                success: false,
                error: "Failed to search messages"
            }, 500);
        }
    };

    // ============================================================
    // ENHANCED FEATURES - Media Upload, Multi-Device, Forwarding
    // ============================================================

    /**
     * Request presigned upload URL for chat media
     * POST /api/v1/chat/media/upload-url
     */
    public static readonly requestUploadUrl = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const body = await ctx.req.json();

            const { fileName, fileType, fileSize } = body;

            if (!fileName || !fileType || !fileSize) {
                return ctx.json(
                    {
                        success: false,
                        error: "fileName, fileType, and fileSize are required",
                    },
                    400
                );
            }

            const result = await ChatMediaService.generatePresignedUploadUrl(
                campus_id,
                user_id,
                fileName,
                fileType,
                fileSize
            );

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to generate upload URL: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Confirm media upload completion
     * POST /api/v1/chat/media/confirm
     */
    public static readonly confirmUpload = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const body = await ctx.req.json();

            const { fileKey, fileName, fileType, fileSize, width, height, duration } = body;

            if (!fileKey || !fileName || !fileType || !fileSize) {
                return ctx.json(
                    {
                        success: false,
                        error: "fileKey, fileName, fileType, and fileSize are required",
                    },
                    400
                );
            }

            const result = await ChatMediaService.confirmMediaUpload(campus_id, user_id, {
                fileKey,
                fileName,
                fileType,
                fileSize,
                width,
                height,
                duration,
            });

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to confirm upload: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Get media metadata
     * GET /api/v1/chat/media/:upload_id
     */
    public static readonly getMediaMetadata = async (ctx: Context) => {
        try {
            const upload_id = ctx.req.param("upload_id");

            const result = await ChatMediaService.getMediaMetadata(upload_id);

            return ctx.json(result, result.success ? 200 : 404);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to get media metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Delete media
     * DELETE /api/v1/chat/media/:upload_id
     */
    public static readonly deleteMedia = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const upload_id = ctx.req.param("upload_id");

            const result = await ChatMediaService.deleteMedia(upload_id, user_id);

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to delete media: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Register user device
     * POST /api/v1/chat/devices/register
     */
    public static readonly registerDevice = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const body = await ctx.req.json();

            const { device_id, device_name, device_type, platform, app_version, push_token } = body;

            if (!device_id || !device_name || !device_type || !platform || !app_version) {
                return ctx.json(
                    {
                        success: false,
                        error: "device_id, device_name, device_type, platform, and app_version are required",
                    },
                    400
                );
            }

            const result = await MultiDeviceSyncService.registerDevice({
                user_id,
                campus_id,
                device_id,
                device_name,
                device_type,
                platform,
                app_version,
                push_token,
                ip_address: ctx.req.header("x-forwarded-for") || ctx.req.header("x-real-ip"),
                user_agent: ctx.req.header("user-agent"),
            });

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to register device: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Get user devices
     * GET /api/v1/chat/devices
     */
    public static readonly getUserDevices = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");

            const result = await MultiDeviceSyncService.getUserDevices(user_id);

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to get devices: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Deactivate device
     * POST /api/v1/chat/devices/:device_id/logout
     */
    public static readonly deactivateDevice = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const device_id = ctx.req.param("device_id");

            const result = await MultiDeviceSyncService.deactivateDevice(user_id, device_id);

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to deactivate device: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Sync chats
     * POST /api/v1/chat/sync/chats
     */
    public static readonly syncChats = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const body = await ctx.req.json();

            const { device_id } = body;

            if (!device_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "device_id is required",
                    },
                    400
                );
            }

            const result = await MultiDeviceSyncService.syncChats(user_id, campus_id, device_id);

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to sync chats: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Sync messages for a room
     * POST /api/v1/chat/sync/messages
     */
    public static readonly syncMessages = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const body = await ctx.req.json();

            const { room_id, since_timestamp, since_sequence, limit } = body;

            if (!room_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "room_id is required",
                    },
                    400
                );
            }

            const sinceTimestamp = since_timestamp ? new Date(since_timestamp) : undefined;

            const result = await MultiDeviceSyncService.syncMessages(user_id, campus_id, room_id, {
                since_timestamp: sinceTimestamp,
                since_sequence,
                limit,
            });

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to sync messages: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Forward message to multiple rooms
     * POST /api/v1/chat/messages/:message_id/forward
     */
    public static readonly forwardMessage = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const message_id = ctx.req.param("message_id");
            const body = await ctx.req.json();

            const { target_room_ids } = body;

            if (!target_room_ids || !Array.isArray(target_room_ids) || target_room_ids.length === 0) {
                return ctx.json(
                    {
                        success: false,
                        error: "target_room_ids array is required and must not be empty",
                    },
                    400
                );
            }

            const result = await ChatEnhancedService.forwardMessage(user_id, campus_id, message_id, target_room_ids);

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to forward message: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Toggle star message
     * POST /api/v1/chat/messages/:message_id/star
     */
    public static readonly toggleStarMessage = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const message_id = ctx.req.param("message_id");

            const result = await ChatEnhancedService.toggleStarMessage(user_id, message_id, campus_id);

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to toggle star: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Get starred messages
     * GET /api/v1/chat/messages/starred
     */
    public static readonly getStarredMessages = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            const room_id = ctx.req.query("room_id");
            const page = ctx.req.query("page") ? parseInt(ctx.req.query("page")!) : 1;
            const limit = ctx.req.query("limit") ? parseInt(ctx.req.query("limit")!) : 50;

            const result = await ChatEnhancedService.getStarredMessages(user_id, campus_id, {
                room_id,
                page,
                limit,
            });

            return ctx.json(result, result.success ? 200 : 400);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to get starred messages: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };

    /**
     * Get message info (delivery and read status)
     * GET /api/v1/chat/messages/:message_id/info
     */
    public static readonly getMessageInfo = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const message_id = ctx.req.param("message_id");

            const result = await ChatEnhancedService.getMessageInfo(user_id, message_id, campus_id);

            return ctx.json(result, result.success ? 200 : 404);
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: `Failed to get message info: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
                500
            );
        }
    };
}
