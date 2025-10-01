import { model, Schema } from "ottoman";

export interface IUserDeviceToken {
    id: string;
    user_id: string;
    campus_id: string;
    device_token: string;
    device_type: "android" | "ios" | "web";
    device_info?: {
        model?: string;
        os_version?: string;
        app_version?: string;
        user_agent?: string;
    };
    is_active: boolean;
    last_used_at: Date;
    created_at: Date;
    updated_at: Date;
}

const userDeviceTokenSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    user_id: {
        type: String,
        required: true,
        index: true,
    },
    campus_id: {
        type: String,
        required: true,
        index: true,
    },
    device_token: {
        type: String,
        required: true,
        unique: true,
    },
    device_type: {
        type: String,
        required: true,
        enum: ["android", "ios", "web"],
    },
    device_info: {
        type: Object,
        required: false,
        default: {},
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true,
    },
    last_used_at: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
    created_at: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
    updated_at: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
});

export const UserDeviceToken = model("UserDeviceToken", userDeviceTokenSchema);
export default UserDeviceToken;