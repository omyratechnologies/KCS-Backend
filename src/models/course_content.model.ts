import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseContentData {
    id: string;
    campus_id: string;
    course_id: string;
    chapter_id?: string;
    content_title: string;
    content_description: string;
    content_type: "lesson" | "quiz" | "assignment" | "resource" | "assessment" | "interactive";
    content_format: "text" | "video" | "audio" | "document" | "presentation" | "interactive";
    content_data: {
        text_content?: string;
        html_content?: string;
        video_url?: string;
        audio_url?: string;
        document_url?: string;
        interactive_data?: object;
        duration?: number; // in seconds
        file_size?: number;
        thumbnail_url?: string;
    };
    step_data?: {
        step_number: number;
        step_type: "intro" | "content" | "activity" | "assessment" | "summary";
        step_title: string;
        step_instructions: string;
        estimated_time: number; // in minutes
        prerequisites?: string[];
        learning_objectives?: string[];
    };
    access_settings: {
        access_level: "free" | "premium" | "restricted";
        available_from?: Date;
        available_until?: Date;
        prerequisite_content_ids?: string[];
    };
    interaction_settings: {
        allow_comments: boolean;
        allow_notes: boolean;
        allow_bookmarks: boolean;
        require_completion: boolean;
        completion_criteria?: object;
    };
    sort_order: number;
    meta_data: {
        created_by: string;
        tags?: string[];
        difficulty_level?: "beginner" | "intermediate" | "advanced";
        estimated_completion_time?: number; // in minutes
        language?: string;
        version?: string;
    };
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseContentSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    chapter_id: { type: String, required: false },
    content_title: { type: String, required: true },
    content_description: { type: String, required: true },
    content_type: { type: String, required: true },
    content_format: { type: String, required: true },
    content_data: { type: Object, required: true },
    step_data: { type: Object, required: false },
    access_settings: { type: Object, required: true },
    interaction_settings: { type: Object, required: true },
    sort_order: { type: Number, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseContentSchema.index.findByCampusId = { by: "campus_id" };
CourseContentSchema.index.findByCourseId = { by: "course_id" };
CourseContentSchema.index.findByChapterId = { by: "chapter_id" };

const CourseContent = ottoman.model<ICourseContentData>(
    "course_content",
    CourseContentSchema
);

export { CourseContent, type ICourseContentData };
