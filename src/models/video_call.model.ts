import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export interface IVideoCall {
    id: string;
    call_id: string; // GetStream call ID
    campus_id: string;
    room_id?: string; // Associated chat room for personal calls
    call_type: "audio" | "video"; // Simplified to audio or video only
    caller_id: string; // User who initiated the call
    participants: string[]; // Array of user IDs
    call_status: "created" | "ongoing" | "ended" | "missed" | "rejected";
    started_at?: Date;
    ended_at?: Date;
    duration?: number; // Duration in seconds
    call_settings: {
        audio_enabled: boolean;
        video_enabled: boolean;
        screen_sharing_enabled?: boolean;
        recording_enabled?: boolean;
    };
    metadata: {
        getstream_call_id?: string;
        getstream_session_id?: string;
        end_reason?: "normal" | "timeout" | "error" | "rejected";
        quality_score?: number;
        max_participants?: number;
        [key: string]: unknown;
    };
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const VideoCallSchema = new Schema({
    call_id: { type: String, required: true, unique: true },
    campus_id: { type: String, required: true },
    room_id: { type: String, required: false },
    call_type: { 
        type: String, 
        required: true, 
        enum: ["audio", "video"],
        default: "video"
    },
    caller_id: { type: String, required: true },
    participants: { type: [String], required: true },
    call_status: { 
        type: String, 
        required: true, 
        enum: ["created", "ongoing", "ended", "missed", "rejected"],
        default: "created"
    },
    started_at: { type: Date, required: false },
    ended_at: { type: Date, required: false },
    duration: { type: Number, required: false },
    call_settings: {
        type: Object,
        required: true,
        default: {
            audio_enabled: true,
            video_enabled: true,
            screen_sharing_enabled: false,
            recording_enabled: false,
        }
    },
    metadata: { type: Object, required: true, default: {} },
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

VideoCallSchema.index.findByCampusId = { by: "campus_id" };
VideoCallSchema.index.findByCallerId = { by: "caller_id" };
VideoCallSchema.index.findByCallId = { by: "call_id" };
VideoCallSchema.index.findByRoomId = { by: "room_id" };
VideoCallSchema.index.findByStatus = { by: "call_status" };
VideoCallSchema.index.findByParticipants = { by: "participants" };
VideoCallSchema.index.findByCampusAndCaller = { by: ["campus_id", "caller_id"] };
VideoCallSchema.index.findByCreatedAt = { by: "created_at" };

const VideoCall = ottoman.model<IVideoCall>("video_calls", VideoCallSchema);

export { VideoCall };
