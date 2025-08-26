import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface IChatRoom {
    id: string;
    campus_id: string;
    room_type: "personal" | "class_group" | "subject_group" | "custom_group";
    name: string;
    description?: string;
    created_by: string; // user_id of creator
    admin_user_ids: string[]; // Array of admin user_ids
    members: string[]; // Array of user_ids
    class_id?: string; // For class groups
    subject_id?: string; // For subject groups
    meta_data: {
        auto_add_students?: boolean; // For class groups
        is_default?: boolean; // For system-created groups
        last_message?: {
            content: string;
            sender_id: string;
            timestamp: Date;
        };
        [key: string]: unknown;
    };
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const ChatRoomSchema = new Schema({
    campus_id: { type: String, required: true },
    room_type: { 
        type: String, 
        required: true, 
        enum: ["personal", "class_group", "subject_group", "custom_group"] 
    },
    name: { type: String, required: true },
    description: { type: String, required: false },
    created_by: { type: String, required: true },
    admin_user_ids: { type: [String], required: true, default: [] },
    members: { type: [String], required: true },
    class_id: { type: String, required: false },
    subject_id: { type: String, required: false },
    meta_data: { type: Object, required: true, default: {} },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ChatRoomSchema.index.findByCampusId = { by: "campus_id" };
ChatRoomSchema.index.findByRoomType = { by: "room_type" };
ChatRoomSchema.index.findByCreatedBy = { by: "created_by" };
ChatRoomSchema.index.findByClassId = { by: "class_id" };
ChatRoomSchema.index.findBySubjectId = { by: "subject_id" };
ChatRoomSchema.index.findByMembers = { by: "members" };
ChatRoomSchema.index.findByCampusAndType = { by: ["campus_id", "room_type"] };

const ChatRoom = ottoman.model<IChatRoom>("chat_rooms", ChatRoomSchema);

export { ChatRoom };
