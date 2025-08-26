import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface IUserChatStatus {
    id: string;
    campus_id: string;
    user_id: string;
    is_online: boolean;
    last_seen: Date;
    typing_in_room?: string; // Room ID where user is currently typing
    typing_started_at?: Date;
    status_message?: string; // Custom status message
    connection_id?: string; // WebSocket connection ID
    meta_data: {
        device_info?: {
            type: "web" | "mobile" | "desktop";
            browser?: string;
            os?: string;
        };
        [key: string]: unknown;
    };
    created_at: Date;
    updated_at: Date;
}

const UserChatStatusSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    is_online: { type: Boolean, required: true, default: false },
    last_seen: { type: Date, required: true, default: () => new Date() },
    typing_in_room: { type: String, required: false },
    typing_started_at: { type: Date, required: false },
    status_message: { type: String, required: false },
    connection_id: { type: String, required: false },
    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

UserChatStatusSchema.index.findByCampusId = { by: "campus_id" };
UserChatStatusSchema.index.findByUserId = { by: "user_id" };
UserChatStatusSchema.index.findByIsOnline = { by: "is_online" };
UserChatStatusSchema.index.findByConnectionId = { by: "connection_id" };
UserChatStatusSchema.index.findByCampusAndUser = { by: ["campus_id", "user_id"] };

const UserChatStatus = ottoman.model<IUserChatStatus>("user_chat_status", UserChatStatusSchema);

export { UserChatStatus };
