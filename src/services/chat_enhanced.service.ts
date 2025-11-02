import { ChatMessage, IChatMessage } from "@/models/chat_message.model";
import { ChatRoom } from "@/models/chat_room.model";
import { User } from "@/models/user.model";
import log, { LogTypes } from "@/libs/logger";
import { SocketServiceOptimized as SocketService } from "./socket.service.optimized";

/**
 * Enhanced Chat Features Service
 * Implements: Message forwarding, starring, @mentions, advanced group features
 */
export class ChatEnhancedService {
    /**
     * Forward message to one or more rooms
     */
    public static async forwardMessage(
        user_id: string,
        campus_id: string,
        message_id: string,
        target_room_ids: string[]
    ): Promise<{
        success: boolean;
        data?: { forwarded_count: number; message_ids: string[] };
        error?: string;
    }> {
        try {
            // Get original message
            const originalMessage = await ChatMessage.findById(message_id);

            if (!originalMessage) {
                return { success: false, error: "Message not found" };
            }

            // Verify user has access to original message's room
            if (originalMessage.room_id) {
                const room = await ChatRoom.findById(originalMessage.room_id);
                if (!room || !room.members.includes(user_id)) {
                    return { success: false, error: "Access denied to original message" };
                }
            }

            // Get user info for forward attribution
            const user = await User.findById(user_id);
            const userName = user ? `${user.first_name} ${user.last_name}` : "Unknown User";

            const forwardedMessageIds: string[] = [];

            // Forward to each target room
            for (const target_room_id of target_room_ids) {
                // Verify user has access to target room
                const targetRoom = await ChatRoom.findById(target_room_id);
                if (!targetRoom || !targetRoom.members.includes(user_id)) {
                    log(`⚠️ User ${user_id} doesn't have access to room ${target_room_id}`, LogTypes.LOGS, "CHAT_ENHANCED");
                    continue;
                }

                // Get original sender info
                const originalSender = await User.findById(originalMessage.sender_id);
                const originalSenderName = originalSender
                    ? `${originalSender.first_name} ${originalSender.last_name}`
                    : "Unknown User";

                // Calculate forward chain length
                const forwardChainLength = (originalMessage.meta_data?.forward_info?.forward_chain_length || 0) + 1;

                // Create forwarded message
                const forwardedMessage = await ChatMessage.create({
                    campus_id,
                    room_id: target_room_id,
                    sender_id: user_id,
                    message_type: originalMessage.message_type,
                    content: originalMessage.content,
                    file_url: originalMessage.file_url,
                    file_name: originalMessage.file_name,
                    file_size: originalMessage.file_size,
                    forwarded_from: originalMessage.forwarded_from || originalMessage.id,
                    forwarded_count: (originalMessage.forwarded_count || 0) + 1,
                    is_edited: false,
                    is_deleted: false,
                    is_seen: false,
                    seen_by: [],
                    delivered_to: [],
                    meta_data: {
                        ...originalMessage.meta_data,
                        forward_info: {
                            original_sender_id: originalMessage.sender_id,
                            original_sender_name: originalSenderName,
                            forward_chain_length: forwardChainLength,
                        },
                        forwarded_by: user_id,
                        forwarded_by_name: userName,
                    },
                    created_at: new Date(),
                    updated_at: new Date(),
                });

                forwardedMessageIds.push(forwardedMessage.id);

                // Broadcast to target room
                SocketService.broadcastChatMessage(target_room_id, {
                    id: forwardedMessage.id,
                    room_id: forwardedMessage.room_id,
                    sender_id: forwardedMessage.sender_id,
                    content: forwardedMessage.content,
                    message_type: forwardedMessage.message_type,
                    file_url: forwardedMessage.file_url,
                    created_at: forwardedMessage.created_at,
                    forwarded_from: forwardedMessage.forwarded_from,
                    meta_data: forwardedMessage.meta_data,
                }, user_id);

                // Update room's last message
                await ChatRoom.updateById(target_room_id, {
                    meta_data: {
                        last_message: {
                            content: `Forwarded: ${originalMessage.content}`,
                            sender_id: user_id,
                            timestamp: new Date(),
                        },
                    },
                    updated_at: new Date(),
                });
            }

            // Update original message's forward count
            if (originalMessage.forwarded_from) {
                const rootMessage = await ChatMessage.findById(originalMessage.forwarded_from);
                if (rootMessage) {
                    await ChatMessage.replaceById(rootMessage.id, {
                        ...rootMessage,
                        forwarded_count: (rootMessage.forwarded_count || 0) + forwardedMessageIds.length,
                        updated_at: new Date(),
                    });
                }
            } else {
                await ChatMessage.replaceById(originalMessage.id, {
                    ...originalMessage,
                    forwarded_count: (originalMessage.forwarded_count || 0) + forwardedMessageIds.length,
                    updated_at: new Date(),
                });
            }

            log(
                `✅ Message ${message_id} forwarded to ${forwardedMessageIds.length} rooms by user ${user_id}`,
                LogTypes.LOGS,
                "CHAT_ENHANCED"
            );

            return {
                success: true,
                data: {
                    forwarded_count: forwardedMessageIds.length,
                    message_ids: forwardedMessageIds,
                },
            };
        } catch (error) {
            log(`❌ Forward message failed: ${error}`, LogTypes.ERROR, "CHAT_ENHANCED");
            return {
                success: false,
                error: `Failed to forward message: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Star/unstar a message
     */
    public static async toggleStarMessage(
        user_id: string,
        message_id: string,
        campus_id: string
    ): Promise<{
        success: boolean;
        data?: { is_starred: boolean };
        error?: string;
    }> {
        try {
            const message = await ChatMessage.findById(message_id);

            if (!message) {
                return { success: false, error: "Message not found" };
            }

            if (message.campus_id !== campus_id) {
                return { success: false, error: "Message not found in your campus" };
            }

            // Verify user has access to this message's room
            if (message.room_id) {
                const room = await ChatRoom.findById(message.room_id);
                if (!room || !room.members.includes(user_id)) {
                    return { success: false, error: "Access denied to this message" };
                }
            }

            const starredBy = message.starred_by || [];
            const isCurrentlyStarred = starredBy.includes(user_id);

            let updatedStarredBy: string[];
            if (isCurrentlyStarred) {
                // Unstar
                updatedStarredBy = starredBy.filter(id => id !== user_id);
            } else {
                // Star
                updatedStarredBy = [...starredBy, user_id];
            }

            await ChatMessage.replaceById(message_id, {
                ...message,
                starred_by: updatedStarredBy,
                updated_at: new Date(),
            });

            log(
                `${isCurrentlyStarred ? '⭐' : '✨'} Message ${message_id} ${isCurrentlyStarred ? 'unstarred' : 'starred'} by user ${user_id}`,
                LogTypes.LOGS,
                "CHAT_ENHANCED"
            );

            return {
                success: true,
                data: { is_starred: !isCurrentlyStarred },
            };
        } catch (error) {
            log(`❌ Toggle star failed: ${error}`, LogTypes.ERROR, "CHAT_ENHANCED");
            return {
                success: false,
                error: `Failed to toggle star: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Get all starred messages for a user
     */
    public static async getStarredMessages(
        user_id: string,
        campus_id: string,
        options?: {
            room_id?: string;
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
            const page = options?.page || 1;
            const limit = options?.limit || 50;

            const query: any = {
                campus_id,
                is_deleted: false,
            };

            if (options?.room_id) {
                query.room_id = options.room_id;
            }

            // Get all messages and filter by starred_by
            const allMessages = await ChatMessage.find(query, {
                sort: { created_at: "DESC" },
            });

            const starredMessages = (allMessages.rows || []).filter((msg: IChatMessage) =>
                msg.starred_by && msg.starred_by.includes(user_id)
            );

            // Apply pagination
            const total = starredMessages.length;
            const skip = (page - 1) * limit;
            const paginatedMessages = starredMessages.slice(skip, skip + limit);

            return {
                success: true,
                data: paginatedMessages,
                pagination: { page, limit, total },
            };
        } catch (error) {
            log(`❌ Get starred messages failed: ${error}`, LogTypes.ERROR, "CHAT_ENHANCED");
            return {
                success: false,
                error: `Failed to get starred messages: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Get message delivery and read status details
     * Shows which users have received and seen the message
     */
    public static async getMessageInfo(
        user_id: string,
        message_id: string,
        campus_id: string
    ): Promise<{
        success: boolean;
        data?: {
            message_id: string;
            sender_id: string;
            created_at: Date;
            delivered_to: Array<{ user_id: string; timestamp: Date }>;
            seen_by: Array<{ user_id: string; timestamp: Date }>;
            total_recipients: number;
        };
        error?: string;
    }> {
        try {
            const message = await ChatMessage.findById(message_id);

            if (!message) {
                return { success: false, error: "Message not found" };
            }

            if (message.campus_id !== campus_id) {
                return { success: false, error: "Message not found in your campus" };
            }

            // Verify user has access to this message
            if (message.room_id) {
                const room = await ChatRoom.findById(message.room_id);
                if (!room || !room.members.includes(user_id)) {
                    return { success: false, error: "Access denied to this message" };
                }

                // Get user info for delivered_to and seen_by
                const deliveredToDetails = await Promise.all(
                    (message.delivered_to || []).map(async (uid) => ({
                        user_id: uid,
                        timestamp: message.created_at, // Approximate - we don't track individual delivery times
                    }))
                );

                const seenByDetails = await Promise.all(
                    (message.seen_by || []).map(async (uid) => ({
                        user_id: uid,
                        timestamp: message.seen_at || message.created_at,
                    }))
                );

                return {
                    success: true,
                    data: {
                        message_id: message.id,
                        sender_id: message.sender_id,
                        created_at: message.created_at,
                        delivered_to: deliveredToDetails,
                        seen_by: seenByDetails,
                        total_recipients: room.members.length - 1, // Exclude sender
                    },
                };
            }

            return {
                success: false,
                error: "Personal message info not implemented yet",
            };
        } catch (error) {
            log(`❌ Get message info failed: ${error}`, LogTypes.ERROR, "CHAT_ENHANCED");
            return {
                success: false,
                error: `Failed to get message info: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    /**
     * Extract mentions from message content
     * Looks for @username or @user_id patterns
     */
    private static extractMentions(content: string, roomMembers: string[]): string[] {
        const mentionPattern = /@(\w+)/g;
        const matches = content.match(mentionPattern);

        if (!matches) {
            return [];
        }

        // For now, return user IDs that match the pattern and are in the room
        // In production, you'd want to validate these against actual usernames
        const mentions = matches
            .map(match => match.substring(1)) // Remove @ symbol
            .filter(mention => roomMembers.includes(mention));

        return mentions;
    }

    /**
     * Send message with @mention support
     * Notifies mentioned users
     */
    public static async sendMessageWithMentions(
        sender_id: string,
        campus_id: string,
        room_id: string,
        content: string,
        message_type: "text" | "image" | "video" | "audio" | "file" = "text",
        file_url?: string
    ): Promise<{
        success: boolean;
        data?: IChatMessage;
        error?: string;
    }> {
        try {
            // Get room to extract members
            const room = await ChatRoom.findById(room_id);
            if (!room) {
                return { success: false, error: "Room not found" };
            }

            if (!room.members.includes(sender_id)) {
                return { success: false, error: "You are not a member of this room" };
            }

            // Extract mentions from content
            const mentions = this.extractMentions(content, room.members);

            // Create message with mentions
            const message = await ChatMessage.create({
                campus_id,
                room_id,
                sender_id,
                message_type,
                content,
                file_url,
                is_edited: false,
                is_deleted: false,
                is_seen: false,
                seen_by: [],
                delivered_to: [],
                meta_data: {
                    mentions: mentions.length > 0 ? mentions : undefined,
                },
                created_at: new Date(),
                updated_at: new Date(),
            });

            // Broadcast message
            SocketService.broadcastChatMessage(room_id, {
                id: message.id,
                room_id: message.room_id,
                sender_id: message.sender_id,
                content: message.content,
                message_type: message.message_type,
                file_url: message.file_url,
                created_at: message.created_at,
                meta_data: message.meta_data,
            }, sender_id);

            // Send mention notifications to mentioned users
            if (mentions.length > 0) {
                const sender = await User.findById(sender_id);
                const senderName = sender ? `${sender.first_name} ${sender.last_name}` : "Someone";

                for (const mentionedUserId of mentions) {
                    if (mentionedUserId !== sender_id) {
                        SocketService.notifyChatUser(mentionedUserId, {
                            type: "mention",
                            data: {
                                roomId: room_id,
                                messageId: message.id,
                                mentionedBy: sender_id,
                                mentionedByName: senderName,
                                content: content.substring(0, 100),
                            },
                        });
                    }
                }

                log(
                    `📢 Message with ${mentions.length} mentions sent in room ${room_id}`,
                    LogTypes.LOGS,
                    "CHAT_ENHANCED"
                );
            }

            return { success: true, data: message };
        } catch (error) {
            log(`❌ Send message with mentions failed: ${error}`, LogTypes.ERROR, "CHAT_ENHANCED");
            return {
                success: false,
                error: `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }
}
