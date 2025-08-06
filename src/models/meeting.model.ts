import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

// Enhanced interface for real-time video conferencing
interface IMeetingData {
    id: string;
    campus_id: string;
    creator_id: string;
    participants: string[];
    meeting_name: string;
    meeting_description: string;
    meeting_start_time: Date;
    meeting_end_time: Date;
    meeting_location: string;
    meeting_meta_data: object;

    // Real-time meeting features
    meeting_room_id: string;
    meeting_type: "scheduled" | "instant" | "recurring";
    meeting_status: "scheduled" | "live" | "ended" | "cancelled";
    max_participants: number;
    current_participants: string[];

    // Security & Access Control
    meeting_password?: string;
    waiting_room_enabled: boolean;
    require_host_approval: boolean;
    allow_guests: boolean;

    // Meeting Features
    features: {
        video_enabled: boolean;
        audio_enabled: boolean;
        screen_sharing_enabled: boolean;
        chat_enabled: boolean;
        recording_enabled: boolean;
        breakout_rooms_enabled: boolean;
        whiteboard_enabled: boolean;
        hand_raise_enabled: boolean;
    };

    // Recording & Storage
    recording_config?: {
        auto_record: boolean;
        record_video: boolean;
        record_audio: boolean;
        record_chat: boolean;
        storage_location: "local" | "cloud";
        retention_days: number;
    };

    // WebRTC Configuration
    webrtc_config: {
        ice_servers: Array<{
            urls: string[];
            username?: string;
            credential?: string;
        }>;
        media_constraints: {
            video: {
                enabled: boolean;
                quality: "low" | "medium" | "high" | "hd";
                frameRate: number;
            };
            audio: {
                enabled: boolean;
                noise_suppression: boolean;
                echo_cancellation: boolean;
            };
        };
    };

    // Analytics & Monitoring
    analytics: {
        total_duration_minutes: number;
        peak_participants: number;
        total_participants_joined: number;
        connection_quality_avg: number;
        chat_messages_count: number;
        screen_shares_count: number;
    };

    // Compliance & Audit
    audit_trail: Array<{
        timestamp: Date;
        action: string;
        user_id: string;
        details: object;
    }>;

    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

// Real-time participant tracking
interface IMeetingParticipant {
    id: string;
    meeting_id: string;
    user_id: string;
    participant_name: string;
    participant_email?: string;

    // Connection Status
    connection_status: "connecting" | "connected" | "reconnecting" | "disconnected";
    connection_quality: "poor" | "fair" | "good" | "excellent";
    joined_at: Date;
    left_at?: Date;

    // Media Status
    media_status: {
        video_enabled: boolean;
        audio_enabled: boolean;
        screen_sharing: boolean;
        is_speaking: boolean;
        is_muted_by_host: boolean;
    };

    // Permissions
    permissions: {
        can_share_screen: boolean;
        can_use_chat: boolean;
        can_use_whiteboard: boolean;
        is_moderator: boolean;
        is_host: boolean;
    };

    // Technical Details
    peer_connection_id: string;
    socket_id: string;
    ip_address: string;
    user_agent: string;

    created_at: Date;
    updated_at: Date;
}

// Chat messages during meetings
interface IMeetingChat {
    id: string;
    meeting_id: string;
    sender_id: string;
    sender_name: string;
    message: string;
    message_type: "text" | "file" | "poll" | "announcement";
    recipient_type: "all" | "private" | "host";
    recipient_id?: string;
    timestamp: Date;
    edited_at?: Date;
    is_deleted: boolean;
}

// Meeting recordings
interface IMeetingRecording {
    id: string;
    meeting_id: string;
    recording_type: "video" | "audio" | "screen" | "chat";
    file_path: string;
    file_size_bytes: number;
    duration_seconds: number;
    format: string;
    quality: string;
    started_at: Date;
    ended_at: Date;
    processed_at?: Date;
    is_available: boolean;
    download_count: number;
    created_at: Date;
}

// Enhanced Schemas for Real-time Video Conferencing
const MeetingSchema = new Schema({
    campus_id: { type: String, required: true },
    creator_id: { type: String, required: true },
    participants: { type: [String], required: true },
    meeting_name: { type: String, required: true },
    meeting_description: { type: String, required: true },
    meeting_start_time: { type: Date, required: true },
    meeting_end_time: { type: Date, required: true },
    meeting_location: { type: String, required: true },
    meeting_meta_data: { type: Object, required: true },

    // Real-time meeting features
    meeting_room_id: { type: String, required: true },
    meeting_type: {
        type: String,
        enum: ["scheduled", "instant", "recurring"],
        default: "scheduled",
    },
    meeting_status: {
        type: String,
        enum: ["scheduled", "live", "ended", "cancelled"],
        default: "scheduled",
    },
    max_participants: { type: Number, default: 100 },
    current_participants: { type: [String], default: [] },

    // Security & Access Control
    meeting_password: { type: String },
    waiting_room_enabled: { type: Boolean, default: false },
    require_host_approval: { type: Boolean, default: false },
    allow_guests: { type: Boolean, default: true },

    // Meeting Features
    features: {
        type: Object,
        default: {
            video_enabled: true,
            audio_enabled: true,
            screen_sharing_enabled: true,
            chat_enabled: true,
            recording_enabled: false,
            breakout_rooms_enabled: false,
            whiteboard_enabled: false,
            hand_raise_enabled: true,
        },
    },

    // Recording & Storage
    recording_config: {
        type: Object,
        default: {
            auto_record: false,
            record_video: true,
            record_audio: true,
            record_chat: false,
            storage_location: "cloud",
            retention_days: 30,
        },
    },

    // WebRTC Configuration
    webrtc_config: {
        type: Object,
        default: {
            ice_servers: [{ urls: ["stun:stun.l.google.com:19302"] }, { urls: ["stun:stun1.l.google.com:19302"] }],
            media_constraints: {
                video: {
                    enabled: true,
                    quality: "medium",
                    frameRate: 30,
                },
                audio: {
                    enabled: true,
                    noise_suppression: true,
                    echo_cancellation: true,
                },
            },
        },
    },

    // Analytics & Monitoring
    analytics: {
        type: Object,
        default: {
            total_duration_minutes: 0,
            peak_participants: 0,
            total_participants_joined: 0,
            connection_quality_avg: 0,
            chat_messages_count: 0,
            screen_shares_count: 0,
        },
    },

    // Compliance & Audit
    audit_trail: { type: [Object], default: [] },

    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

const MeetingParticipantSchema = new Schema({
    meeting_id: { type: String, required: true },
    user_id: { type: String, required: true },
    participant_name: { type: String, required: true },
    participant_email: { type: String },

    // Connection Status
    connection_status: {
        type: String,
        enum: ["connecting", "connected", "reconnecting", "disconnected"],
        default: "connecting",
    },
    connection_quality: {
        type: String,
        enum: ["poor", "fair", "good", "excellent"],
        default: "good",
    },
    joined_at: { type: Date, default: () => new Date() },
    left_at: { type: Date },

    // Media Status
    media_status: {
        type: Object,
        default: {
            video_enabled: true,
            audio_enabled: true,
            screen_sharing: false,
            is_speaking: false,
            is_muted_by_host: false,
        },
    },

    // Permissions
    permissions: {
        type: Object,
        default: {
            can_share_screen: true,
            can_use_chat: true,
            can_use_whiteboard: true,
            is_moderator: false,
            is_host: false,
        },
    },

    // Technical Details
    peer_connection_id: { type: String, required: true },
    socket_id: { type: String, required: true },
    ip_address: { type: String },
    user_agent: { type: String },

    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

const MeetingChatSchema = new Schema({
    meeting_id: { type: String, required: true },
    sender_id: { type: String, required: true },
    sender_name: { type: String, required: true },
    message: { type: String, required: true },
    message_type: {
        type: String,
        enum: ["text", "file", "poll", "announcement"],
        default: "text",
    },
    recipient_type: {
        type: String,
        enum: ["all", "private", "host"],
        default: "all",
    },
    recipient_id: { type: String },
    timestamp: { type: Date, default: () => new Date() },
    edited_at: { type: Date },
    is_deleted: { type: Boolean, default: false },
});

const MeetingRecordingSchema = new Schema({
    meeting_id: { type: String, required: true },
    recording_type: {
        type: String,
        enum: ["video", "audio", "screen", "chat"],
        required: true,
    },
    file_path: { type: String, required: true },
    file_size_bytes: { type: Number, default: 0 },
    duration_seconds: { type: Number, default: 0 },
    format: { type: String },
    quality: { type: String },
    started_at: { type: Date, required: true },
    ended_at: { type: Date },
    processed_at: { type: Date },
    is_available: { type: Boolean, default: false },
    download_count: { type: Number, default: 0 },
    created_at: { type: Date, default: () => new Date() },
});

// Indexes for performance
MeetingSchema.index.findByCampusId = { by: "campus_id" };
MeetingSchema.index.findByCreatorId = { by: "creator_id" };
MeetingSchema.index.findByStatus = { by: "meeting_status" };
MeetingSchema.index.findByRoomId = { by: "meeting_room_id" };

MeetingParticipantSchema.index.findByMeetingId = { by: "meeting_id" };
MeetingParticipantSchema.index.findByUserId = { by: "user_id" };
MeetingParticipantSchema.index.findByConnectionStatus = {
    by: "connection_status",
};

MeetingChatSchema.index.findByMeetingId = { by: "meeting_id" };
MeetingChatSchema.index.findByTimestamp = { by: "timestamp" };

MeetingRecordingSchema.index.findByMeetingId = { by: "meeting_id" };
MeetingRecordingSchema.index.findByType = { by: "recording_type" };

const Meeting = ottoman.model<IMeetingData>("meeting", MeetingSchema);
const MeetingParticipant = ottoman.model<IMeetingParticipant>("meeting_participant", MeetingParticipantSchema);
const MeetingChat = ottoman.model<IMeetingChat>("meeting_chat", MeetingChatSchema);
const MeetingRecording = ottoman.model<IMeetingRecording>("meeting_recording", MeetingRecordingSchema);

export {
    type IMeetingChat,
    type IMeetingData,
    type IMeetingParticipant,
    type IMeetingRecording,
    Meeting,
    MeetingChat,
    MeetingParticipant,
    MeetingRecording,
};
