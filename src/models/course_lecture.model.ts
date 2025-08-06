import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface ICourseLectureData {
    id: string;
    course_id: string;
    section_id: string;
    campus_id: string;
    title: string;
    description?: string;
    lecture_order: number;
    lecture_type: "video" | "resource" | "quiz" | "assignment" | "text" | "live_session";
    content_data: {
        // For videos
        video_url?: string;
        video_duration_seconds?: number;
        video_thumbnail?: string;
        video_quality?: Array<{
            quality: string; // 720p, 1080p, etc.
            url: string;
            file_size_mb: number;
        }>;
        subtitles?: Array<{
            language: string;
            url: string;
        }>;
        video_metadata?: {
            resolution: string;
            format: string;
            codec: string;
            bitrate: string;
        };

        // For resources
        resource_files?: Array<{
            id: string;
            name: string;
            type: "pdf" | "doc" | "ppt" | "excel" | "image" | "audio" | "other";
            url: string;
            file_size_mb: number;
            is_downloadable: boolean;
            description?: string;
        }>;

        // For quiz
        quiz_id?: string;
        quiz_data?: {
            passing_score: number;
            max_attempts: number;
            time_limit_minutes?: number;
            show_results_immediately: boolean;
        };

        // For assignments
        assignment_id?: string;
        assignment_data?: {
            due_date?: Date;
            max_score: number;
            submission_types: Array<"text" | "file" | "url">;
        };

        // For text content
        text_content?: string;
        rich_text_content?: string; // HTML content

        // For live sessions
        live_session_data?: {
            scheduled_start: Date;
            scheduled_end: Date;
            meeting_url?: string;
            meeting_id?: string;
            is_recurring: boolean;
            recording_url?: string;
        };
    };
    is_preview: boolean; // Can be viewed without enrollment
    is_mandatory: boolean; // Required for course completion
    estimated_duration_minutes: number;
    is_published: boolean;
    completion_criteria: {
        auto_complete_video: boolean; // Auto-complete when video ends
        manual_mark_complete: boolean;
        quiz_required: boolean;
        assignment_required: boolean;
        minimum_watch_percentage?: number; // For videos
    };
    meta_data: {
        learning_notes?: string;
        instructor_notes?: string;
        external_links?: Array<{
            title: string;
            url: string;
            description?: string;
        }>;
        downloadable_resources?: string[];
        discussion_enabled?: boolean;
        comments_enabled?: boolean;
    };
    created_at: Date;
    updated_at: Date;
}

const CourseLectureSchema = new Schema({
    course_id: { type: String, required: true },
    section_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    lecture_order: { type: Number, required: true },
    lecture_type: {
        type: String,
        enum: ["video", "resource", "quiz", "assignment", "text", "live_session"],
        required: true,
    },
    content_data: { type: Object, required: true },
    is_preview: { type: Boolean, default: false },
    is_mandatory: { type: Boolean, default: true },
    estimated_duration_minutes: { type: Number, default: 0 },
    is_published: { type: Boolean, default: true },
    completion_criteria: {
        type: Object,
        default: {
            auto_complete_video: true,
            manual_mark_complete: false,
            quiz_required: false,
            assignment_required: false,
            minimum_watch_percentage: 80,
        },
    },
    meta_data: { type: Object, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseLectureSchema.index.findByCourseId = { by: "course_id" };
CourseLectureSchema.index.findBySectionId = { by: "section_id" };
CourseLectureSchema.index.findByCampusId = { by: "campus_id" };
CourseLectureSchema.index.findByOrder = { by: "lecture_order" };
CourseLectureSchema.index.findByType = { by: "lecture_type" };

const CourseLecture = ottoman.model<ICourseLectureData>("course_lectures", CourseLectureSchema);

export { CourseLecture };
