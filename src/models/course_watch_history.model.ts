import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseWatchHistoryData {
    id: string;
    campus_id: string;
    course_id: string;
    chapter_id: string;
    content_id: string;
    user_id: string;
    session_id: string;
    watch_duration: number; // in seconds
    total_duration: number; // in seconds
    watch_percentage: number;
    is_completed: boolean;
    last_watched_position: number; // in seconds
    watch_quality: string; // "360p", "720p", "1080p"
    device_info: {
        device_type: string;
        browser: string;
        os: string;
        ip_address: string;
    };
    engagement_metrics: {
        pause_count: number;
        seek_count: number;
        replay_count: number;
        speed_changes: number;
        interaction_events: string[];
    };
    created_at: Date;
    updated_at: Date;
}

const CourseWatchHistorySchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    chapter_id: { type: String, required: true },
    content_id: { type: String, required: true },
    user_id: { type: String, required: true },
    session_id: { type: String, required: true },
    watch_duration: { type: Number, required: true },
    total_duration: { type: Number, required: true },
    watch_percentage: { type: Number, required: true },
    is_completed: { type: Boolean, required: true },
    last_watched_position: { type: Number, required: true },
    watch_quality: { type: String, required: true },
    device_info: { type: Object, required: true },
    engagement_metrics: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseWatchHistorySchema.index.findByCampusId = { by: "campus_id" };
CourseWatchHistorySchema.index.findByCourseId = { by: "course_id" };
CourseWatchHistorySchema.index.findByUserId = { by: "user_id" };
CourseWatchHistorySchema.index.findBySessionId = { by: "session_id" };

const CourseWatchHistory = ottoman.model<ICourseWatchHistoryData>(
    "course_watch_history",
    CourseWatchHistorySchema
);

export { CourseWatchHistory, type ICourseWatchHistoryData };
