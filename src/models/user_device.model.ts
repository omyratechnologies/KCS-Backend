import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

/**
 * UserDevice Model - Tracks user devices for multi-device sync
 */
export interface IUserDevice {
    id: string;
    user_id: string;
    campus_id: string;
    device_id: string; // Unique identifier for the device
    device_name: string; // e.g., "iPhone 14", "Chrome - MacBook Pro"
    device_type: "mobile" | "web" | "desktop" | "tablet";
    platform: string; // iOS, Android, Web, Windows, macOS
    app_version: string;
    push_token?: string; // FCM/APNS token for push notifications
    is_active: boolean;
    last_active_at: Date;
    last_sync_at?: Date;
    last_message_seq?: number; // Last message sequence number seen by this device
    ip_address?: string;
    user_agent?: string;
    created_at: Date;
    updated_at: Date;
}

const UserDeviceSchema = new Schema({
    user_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    device_id: { type: String, required: true },
    device_name: { type: String, required: true },
    device_type: { type: String, required: true, enum: ["mobile", "web", "desktop", "tablet"] },
    platform: { type: String, required: true },
    app_version: { type: String, required: true },
    push_token: { type: String, required: false },
    is_active: { type: Boolean, required: true, default: true },
    last_active_at: { type: Date, default: () => new Date() },
    last_sync_at: { type: Date, required: false },
    last_message_seq: { type: Number, required: false },
    ip_address: { type: String, required: false },
    user_agent: { type: String, required: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

UserDeviceSchema.index.findByUserId = { by: "user_id" };
UserDeviceSchema.index.findByDeviceId = { by: "device_id" };
UserDeviceSchema.index.findByCampusId = { by: "campus_id" };
UserDeviceSchema.index.findByUserAndDevice = { by: ["user_id", "device_id"] };

const UserDevice = ottoman.model<IUserDevice>("user_devices", UserDeviceSchema);

export { UserDevice };
