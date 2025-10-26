import { Context } from "hono";
import { ChatService } from "../services/chat.service";
import { ChatValidationService } from "../services/chat_validation.service";
import { SocketService } from "../services/socket.service";
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
}
