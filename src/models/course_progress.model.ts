import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface ICourseProgressData {
    id: string;
    course_id: string;
    user_id: string;
    lecture_id: string;
    campus_id: string;
    progress_status: "not_started" | "in_progress" | "completed" | "skipped";
    watch_time_seconds: number; // For video lectures
    total_duration_seconds: number; // Total lecture duration
    completion_percentage: number; // 0-100
    first_accessed_at: Date;
    last_accessed_at: Date;
    completed_at?: Date;
    resume_position_seconds?: number; // For videos - where user left off
    interaction_data: {
        play_count: number;
        pause_count: number;
        seek_count: number;
        speed_changes: number;
        quality_changes: number;
        fullscreen_toggles: number;
        notes_taken: number;
        bookmarked: boolean;
        liked: boolean;
        difficulty_rating?: number; // 1-5
    };
    quiz_data?: {
        attempts: number;
        best_score: number;
        latest_score: number;
        time_spent_minutes: number;
        completed_at?: Date;
    };
    assignment_data?: {
        submitted: boolean;
        submission_date?: Date;
        grade?: number;
        feedback?: string;
        resubmissions: number;
    };
    notes: Array<{
        id: string;
        timestamp_seconds: number; // For videos
        note_text: string;
        is_public: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    device_info: {
        device_type: "web" | "mobile" | "tablet";
        browser?: string;
        os?: string;
        app_version?: string;
    };
    meta_data: {
        learning_streaks?: number;
        difficulty_feedback?: string;
        help_requests?: number;
        custom_markers?: Array<{
            timestamp: number;
            label: string;
            type: string;
        }>;
    };
    created_at: Date;
    updated_at: Date;
}

const CourseProgressSchema = new Schema({
    course_id: { type: String, required: true },
    user_id: { type: String, required: true },
    lecture_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    progress_status: { 
        type: String, 
        enum: ["not_started", "in_progress", "completed", "skipped"],
        default: "not_started"
    },
    watch_time_seconds: { type: Number, default: 0 },
    total_duration_seconds: { type: Number, default: 0 },
    completion_percentage: { type: Number, default: 0 },
    first_accessed_at: { type: Date, default: () => new Date() },
    last_accessed_at: { type: Date, default: () => new Date() },
    completed_at: { type: Date },
    resume_position_seconds: { type: Number, default: 0 },
    interaction_data: { 
        type: Object, 
        default: {
            play_count: 0,
            pause_count: 0,
            seek_count: 0,
            speed_changes: 0,
            quality_changes: 0,
            fullscreen_toggles: 0,
            notes_taken: 0,
            bookmarked: false,
            liked: false
        }
    },
    quiz_data: { type: Object },
    assignment_data: { type: Object },
    notes: { type: [Object], default: [] },
    device_info: { 
        type: Object, 
        default: {
            device_type: "web"
        }
    },
    meta_data: { type: Object, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Compound indexes for efficient queries
CourseProgressSchema.index.findByCourseId = { by: "course_id" };
CourseProgressSchema.index.findByUserId = { by: "user_id" };
CourseProgressSchema.index.findByLectureId = { by: "lecture_id" };
CourseProgressSchema.index.findByCampusId = { by: "campus_id" };
CourseProgressSchema.index.findByUserAndCourse = { by: ["user_id", "course_id"] };
CourseProgressSchema.index.findByUserAndLecture = { by: ["user_id", "lecture_id"] };
CourseProgressSchema.index.findByStatus = { by: "progress_status" };

const CourseProgress = ottoman.model<ICourseProgressData>("course_progress", CourseProgressSchema);

export { CourseProgress };
