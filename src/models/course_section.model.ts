import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export interface ICourseSectionData {
    id: string;
    campus_id: string;
    course_id: string;
    section_title: string;
    section_description: string;
    section_number: number;
    estimated_duration: number; // in minutes - total duration of all content in this section
    is_published: boolean;
    is_free: boolean; // Allow free preview of this section
    sort_order: number;
    
    // Section metadata
    section_meta_data: {
        difficulty_level?: "beginner" | "intermediate" | "advanced";
        prerequisites?: string[];
        learning_objectives?: string[];
        resources?: string[];
        tags?: string[];
        content_count?: number; // Auto-calculated
        video_count?: number; // Auto-calculated
        quiz_count?: number; // Auto-calculated
        total_watch_time?: number; // Auto-calculated
    };
    
    // Access control
    access_settings: {
        access_level: "free" | "premium" | "restricted";
        is_preview: boolean;
        available_from?: Date;
        available_until?: Date;
        prerequisite_section_ids?: string[];
        drip_schedule?: {
            release_after_days: number;
            release_after_section_id?: string;
        };
    };
    
    // Analytics
    analytics: {
        enrollment_count: number;
        completion_count: number;
        average_completion_time: number;
        engagement_score: number;
        content_views: number;
        discussions_count: number;
    };
    
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseSectionSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    section_title: { type: String, required: true },
    section_description: { type: String, required: true },
    section_number: { type: Number, required: true },
    estimated_duration: { type: Number, required: true },
    is_published: { type: Boolean, required: true, default: false },
    is_free: { type: Boolean, required: true, default: false },
    sort_order: { type: Number, required: true },
    section_meta_data: { type: Object, required: true, default: {} },
    access_settings: { type: Object, required: true },
    analytics: { type: Object, required: true, default: {
        enrollment_count: 0,
        completion_count: 0,
        average_completion_time: 0,
        engagement_score: 0,
        content_views: 0,
        discussions_count: 0
    }},
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes
CourseSectionSchema.index.findByCampusId = { by: "campus_id" };
CourseSectionSchema.index.findByCourseId = { by: "course_id" };
CourseSectionSchema.index.findBySectionNumber = { by: "section_number" };

const CourseSection = ottoman.model<ICourseSectionData>(
    "course_sections",
    CourseSectionSchema
);

export { CourseSection };
