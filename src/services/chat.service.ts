import { ChatRoom, IChatRoom } from "../models/chat_room.model";
import { ChatMessage, IChatMessage } from "../models/chat_message.model";
import { UserChatStatus } from "../models/user_chat_status.model";
import { Class } from "../models/class.model";
import { Teacher } from "../models/teacher.model";
import { User } from "../models/user.model";
import { ClassSubject } from "../models/class_subject.model";
import { ChatValidationService } from "./chat_validation.service";

export class ChatService {
    /**
     * Create a personal chat room between two users
     */
    public static async createPersonalChatRoom(
        user1_id: string,
        user2_id: string,
        campus_id: string
    ): Promise<{ success: boolean; data?: IChatRoom; error?: string }> {
        try {
            // Check if personal chat already exists - using fallback approach
            const allPersonalRooms = await ChatRoom.find({
                campus_id,
                room_type: "personal",
                is_deleted: false,
            });

            const existingRoom = allPersonalRooms.rows?.find((room: IChatRoom) => 
                room.members && 
                room.members.includes(user1_id) && 
                room.members.includes(user2_id)
            );

            if (existingRoom) {
                return { success: true, data: existingRoom };
            }

            // Validate if users can chat
            const validation = await ChatValidationService.canSendPersonalMessage(user1_id, user2_id, campus_id);

            if (!validation.canSend) {
                return { success: false, error: validation.reason };
            }
            // Get user names for room name
            const [user1, user2] = await Promise.all([
                User.index.findByUserId(user1_id),
                User.index.findByUserId(user2_id),
            ]);

            const roomName = `${user1.first_name} ${user1.last_name} & ${user2.first_name} ${user2.last_name}`;

            const room = await ChatRoom.create({
                campus_id,
                room_type: "personal",
                name: roomName,
                description: "Personal chat",
                created_by: user1_id,
                admin_user_ids: [user1_id, user2_id],
                members: [user1_id, user2_id],
                meta_data: {
                    is_default: true,
                    personal_chat_users: [user1_id, user2_id],
                },
                is_active: true,
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });

            return { success: true, data: room };
        } catch (e) {
            return { success: false, error: "Failed to create personal chat room: " + e };
        }
    }

    /**
     * Create a group chat room
     * Note: This assumes teacherMiddleware has already validated teacher status
     */
    public static async createGroupChatRoom(
        creator_user_id: string,
        campus_id: string,
        groupData: {
            room_type: "class_group" | "subject_group" | "custom_group";
            name: string;
            members: string[];
            description?: string;
            class_id?: string;
            subject_id?: string;
        }
    ): Promise<{ success: boolean; data?: IChatRoom; error?: string }> {
        try {
            // Teacher validation is handled by teacherMiddleware, so we can skip it here

            // Validate group creation
            const validation = await ChatValidationService.canCreateGroup(
                creator_user_id,
                campus_id,
                groupData.room_type,
                {
                    class_id: groupData.class_id,
                    subject_id: groupData.subject_id,
                },
                groupData.members
            );

            if (!validation.canCreate) {
                return { success: false, error: validation.reason };
            }

            let roomName = groupData.name;

            switch (groupData.room_type) {
                case "class_group": {
                    if (!groupData.class_id) {
                        return { success: false, error: "Class ID is required" };
                    }
                    // const classGroupData = await this.getClassGroupMembers(groupData.class_id, campus_id);
                    // if (!classGroupData.success) {
                    //     return { success: false, error: classGroupData.error };
                    // }
                    // members = classGroupData.members || [];
                    // roomName = classGroupData.name || roomName;
                    break;
                }

                case "subject_group": {
                    if (!groupData.subject_id) {
                        return { success: false, error: "Subject ID is required" };
                    }
                    break;
                }

                case "custom_group":
                    // members = groupData.custom_members || [];
                    break;
            }

            if (!groupData.members.includes(creator_user_id)) {
                groupData.members.push(creator_user_id);
            }

            const room = await ChatRoom.create({
                campus_id,
                room_type: groupData.room_type,
                name: roomName,
                description: groupData.description || "",
                created_by: creator_user_id,
                admin_user_ids: [creator_user_id],
                members: groupData.members,
                class_id: groupData.class_id || null,
                subject_id: groupData.subject_id || null,
                meta_data: {
                    // auto_add_students: groupData.room_type === "class_group",
                    is_default: ["class_group", "subject_group"].includes(groupData.room_type),
                },
                is_active: true,
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });
            return { success: true, data: room };
        } catch (error) {
            console.error("Group chat room creation error:", error);
            return {
                success: false,
                error: `Failed to create group chat room: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Send a message
     */
    public static async sendMessage(
        sender_id: string,
        campus_id: string,
        messageData: {
            room_id: string;
            content: string;
            message_type?: "text" | "video" | "image" | "file" | "audio";
            file_url?: string;
            reply_to?: string;
        }
    ): Promise<{ success: boolean; data?: IChatMessage; error?: string }> {
        try {
            let room_id = messageData.room_id;

            if (!room_id) {
                return { success: false, error: "Either room_id or recipient_id is required" };
            }

            // Validate message sending
            if (room_id) {
                const validation = await ChatValidationService.canSendGroupMessage(sender_id, room_id, campus_id);
                if (!validation.canSend) {
                    return { success: false, error: validation.reason };
                }
            }

            // Create message
            const message = await ChatMessage.create({
                campus_id,
                room_id,
                sender_id,
                message_type: messageData.message_type || "text",
                content: messageData.content,
                file_url: messageData.file_url,
                reply_to: messageData.reply_to,
                is_edited: false,
                is_deleted: false,
                is_seen: false,
                seen_by: [],
                delivered_to: [],
                meta_data: {},
                created_at: new Date(),
                updated_at: new Date(),
            });

            // Update room's last message
            if (room_id) {
                await ChatRoom.updateById(room_id, {
                    meta_data: {
                        last_message: {
                            content: messageData.content,
                            sender_id,
                            timestamp: new Date(),
                        },
                    },
                    updated_at: new Date(),
                });
            }

            return { success: true, data: message };
        } catch {
            return { success: false, error: "Failed to send message" };
        }
    }

    /**
     * Get messages for a room or personal chat
     */
    public static async getMessages(
        user_id: string,
        campus_id: string,
        options: {
            room_id?: string;
            recipient_id?: string;
            page?: number;
            limit?: number;
        }
    ): Promise<{
        success: boolean;
        data?: IChatMessage[];
        pagination?: { page: number; limit: number; total: number };
        error?: string;
    }> {
        try {
            const page = options.page || 1;
            const limit = options.limit || 50;
            const skip = (page - 1) * limit;

            const query: {
                campus_id: string;
                is_deleted: boolean;
                room_id?: string;
                $or?: Array<{ sender_id: string; recipient_id: string }>;
            } = {
                campus_id,
                is_deleted: false,
            };

            if (options.room_id) {
                // Validate user can access this room
                const room = await ChatRoom.findById(options.room_id);
                if (!room || !room.members.includes(user_id)) {
                    return { success: false, error: "Access denied to this room" };
                }
                query.room_id = options.room_id;
            } else if (options.recipient_id) {
                // Personal chat - find messages between these two users
                query.$or = [
                    { sender_id: user_id, recipient_id: options.recipient_id },
                    { sender_id: options.recipient_id, recipient_id: user_id },
                ];
            } else {
                return { success: false, error: "Either room_id or recipient_id is required" };
            }

            const messages = await ChatMessage.find(query, {
                sort: { created_at: "DESC" },
                limit,
                skip,
            });

            return {
                success: true,
                data: messages.rows || [],
                pagination: {
                    page,
                    limit,
                    total: messages.rows?.length || 0,
                },
            };
        } catch {
            return { success: false, error: "Failed to get messages" };
        }
    }

    /**
     * Get user's chat rooms
     */
    public static async getUserChatRooms(
        user_id: string,
        campus_id: string
    ): Promise<{ success: boolean; data?: IChatRoom[]; error?: string }> {
        try {
            // Use the fallback approach as the primary method since it works reliably
            // Ottoman/Couchbase array membership queries can be tricky with different syntax
            const allRooms = await ChatRoom.find(
                {
                    campus_id,
                    is_active: true,
                    is_deleted: false,
                },
                {
                    sort: { updated_at: "DESC" },
                }
            );

            const userRooms =
                allRooms.rows?.filter(
                    (room: { members: string | string[] }) => room.members && room.members.includes(user_id)
                ) || [];

            return { success: true, data: userRooms };
        } catch (error) {
            console.error("Error getting chat rooms:", error);
            return {
                success: false,
                error: `Failed to get chat rooms: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Update user's online status
     */
    public static async updateUserStatus(
        user_id: string,
        campus_id: string,
        status: {
            is_online: boolean;
            connection_id?: string;
            typing_in_room?: string;
            status_message?: string;
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const existing = await UserChatStatus.findOne({ user_id, campus_id });

            if (existing) {
                await UserChatStatus.updateById(existing.id, {
                    is_online: status.is_online,
                    last_seen: new Date(),
                    connection_id: status.connection_id,
                    typing_in_room: status.typing_in_room,
                    status_message: status.status_message,
                    updated_at: new Date(),
                });
            } else {
                await UserChatStatus.create({
                    campus_id,
                    user_id,
                    is_online: status.is_online,
                    last_seen: new Date(),
                    connection_id: status.connection_id,
                    typing_in_room: status.typing_in_room,
                    status_message: status.status_message,
                    meta_data: {},
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }

            return { success: true };
        } catch {
            return { success: false, error: "Failed to update user status" };
        }
    }

    /**
     * Get class group members
     */
    // private static async getClassGroupMembers(
    //     class_id: string,
    //     campus_id: string
    // ): Promise<{ success: boolean; members?: string[]; name?: string; error?: string }> {
    //     try {
    //         const classData = await Class.findById(class_id);
    //         if (!classData || classData.campus_id !== campus_id) {
    //             return { success: false, error: "Class not found" };
    //         }

    //         // Get all students and teachers of the class
    //         const members = [...(classData.student_ids || []), ...(classData.teacher_ids || [])];

    //         if (classData.class_teacher_id && !members.includes(classData.class_teacher_id)) {
    //             members.push(classData.class_teacher_id);
    //         }

    //         return {
    //             success: true,
    //             members,
    //             name: `${classData.name} - Class Group`,
    //         };
    //     } catch {
    //         return { success: false, error: "Failed to get class members" };
    //     }
    // }
}
