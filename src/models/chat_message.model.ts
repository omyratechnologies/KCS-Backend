import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface IChatMessage {
    id: string;
    campus_id: string;
    room_id?: string; // For group messages
    sender_id: string;
    recipient_id?: string; // For personal messages
    message_type: "text" | "image" | "file" | "audio" | "system";
    content: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    reply_to?: string; // Message ID being replied to
    edited_at?: Date;
    is_edited: boolean;
    is_deleted: boolean;
    is_seen: boolean;
    seen_by: string[]; // Array of user_ids who have seen the message (for group chats)
    seen_at?: Date;
    delivered_to: string[]; // Array of user_ids to whom message was delivered
    meta_data: {
        reactions?: {
            [emoji: string]: string[]; // emoji -> array of user_ids
        };
        mentions?: string[]; // Array of user_ids mentioned in the message
        [key: string]: unknown;
    };
    created_at: Date;
    updated_at: Date;
}

const ChatMessageSchema = new Schema({
    campus_id: { type: String, required: true },
    room_id: { type: String, required: false }, // For group messages
    sender_id: { type: String, required: true },
    recipient_id: { type: String, required: false }, // For personal messages
    message_type: { 
        type: String, 
        required: true, 
        enum: ["text", "image", "file", "audio", "system"],
        default: "text"
    },
    content: { type: String, required: true },
    file_url: { type: String, required: false },
    file_name: { type: String, required: false },
    file_size: { type: Number, required: false },
    reply_to: { type: String, required: false },
    edited_at: { type: Date, required: false },
    is_edited: { type: Boolean, required: true, default: false },
    is_deleted: { type: Boolean, required: true, default: false },
    is_seen: { type: Boolean, required: true, default: false },
    seen_by: { type: [String], required: true, default: [] },
    seen_at: { type: Date, required: false },
    delivered_to: { type: [String], required: true, default: [] },
    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ChatMessageSchema.index.findByCampusId = { by: "campus_id" };
ChatMessageSchema.index.findByRoomId = { by: "room_id" };
ChatMessageSchema.index.findBySenderId = { by: "sender_id" };
ChatMessageSchema.index.findByRecipientId = { by: "recipient_id" };
ChatMessageSchema.index.findByMessageType = { by: "message_type" };
ChatMessageSchema.index.findByCreatedAt = { by: "created_at" };
ChatMessageSchema.index.findBySenderAndRecipient = { by: ["sender_id", "recipient_id"] };
ChatMessageSchema.index.findByRoomAndTime = { by: ["room_id", "created_at"] };

const ChatMessage = ottoman.model<IChatMessage>("chat_messages", ChatMessageSchema);

export { ChatMessage };
