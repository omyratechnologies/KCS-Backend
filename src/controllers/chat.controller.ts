import { Context } from "hono";
import { ChatService } from "../services/chat.service";
import { ChatValidationService } from "../services/chat_validation.service";
import { WebSocketChatService } from "../services/websocket_chat.service";

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
     * Note: Teacher validation is handled by teacherMiddleware
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
            console.error('Create group chat controller error:', error);
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
                admins: result.users.filter(user => user.user_type === "Admin"),
            };

            // For students, rename the students array to "classmates" since they can only see same-class students
            const responseData = user_type === "Student" ? {
                teachers: contacts.teachers,
                classmates: contacts.students,
                total_teachers: contacts.teachers.length,
                total_classmates: contacts.students.length
            } : {
                teachers: contacts.teachers,
                students: contacts.students,
                admins: contacts.admins,
                total_teachers: contacts.teachers.length,
                total_students: contacts.students.length,
                total_admins: contacts.admins.length
            };

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

            const stats = WebSocketChatService.getStats();

            return ctx.json({
                success: true,
                data: stats,
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
}
