import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

/**
 * User Chat Preferences Model
 * Stores per-user settings for each chat room including:
 * - Archive status
 * - Clear messages timestamp
 * - Delete status (soft delete)
 * - Unread management
 * - Mute notifications
 */
export interface IUserChatPreferences {
    id: string;
    user_id: string;
    room_id: string;
    
    // Archive functionality
    is_archived: boolean;
    archived_at?: Date;
    
    // Clear chat functionality
    messages_cleared_at?: Date;
    
    // Delete chat functionality (soft delete)
    is_deleted: boolean;
    deleted_at?: Date;
    
    // Unread management
    last_read_message_id?: string;
    last_read_at?: Date;
    manually_marked_unread: boolean;
    
    // Mute notifications
    is_muted: boolean;
    muted_until?: Date;
    
    // Timestamps
    created_at: Date;
    updated_at: Date;
}

const UserChatPreferencesSchema = new Schema({
    user_id: { type: String, required: true },
    room_id: { type: String, required: true },
    
    // Archive functionality
    is_archived: { type: Boolean, required: true, default: false },
    archived_at: { type: Date, required: false },
    
    // Clear chat functionality
    messages_cleared_at: { type: Date, required: false },
    
    // Delete chat functionality
    is_deleted: { type: Boolean, required: true, default: false },
    deleted_at: { type: Date, required: false },
    
    // Unread management
    last_read_message_id: { type: String, required: false },
    last_read_at: { type: Date, required: false },
    manually_marked_unread: { type: Boolean, required: true, default: false },
    
    // Mute notifications
    is_muted: { type: Boolean, required: true, default: false },
    muted_until: { type: Date, required: false },
    
    // Timestamps
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for efficient querying
UserChatPreferencesSchema.index.findByUserId = { by: "user_id" };
UserChatPreferencesSchema.index.findByRoomId = { by: "room_id" };
UserChatPreferencesSchema.index.findByUserAndRoom = { by: ["user_id", "room_id"] };

const UserChatPreferences = ottoman.model<IUserChatPreferences>("user_chat_preferences", UserChatPreferencesSchema);

export { UserChatPreferences };
