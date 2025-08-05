import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface ICourseData {
    id: string;
    campus_id: string;
    title: string;
    description: string;
    short_description?: string;
    class_id?: string; // Target grade/class
    created_by: string; // user_id of creator
    instructor_ids: string[]; // Array of instructor user_ids
    thumbnail?: string;
    preview_video?: string;
    status: "draft" | "published" | "archived" | "suspended";
    category: string;
    sub_category?: string;
    difficulty_level: "beginner" | "intermediate" | "advanced";
    language: string;
    estimated_duration_hours?: number;
    price: number; // 0 for free courses
    discount_price?: number;
    currency: string;
    requirements: string[];
    learning_objectives: string[];
    target_audience: string[];
    tags: string[];
    rating: number;
    rating_count: number;
    enrollment_count: number;
    completion_count: number;
    is_featured: boolean;
    is_certificate_enabled: boolean;
    certificate_template_id?: string;
    max_enrollments?: number; // null for unlimited
    enrollment_start_date?: Date;
    enrollment_end_date?: Date;
    course_start_date?: Date;
    course_end_date?: Date;
    last_updated_by: string;
    version: number;
    meta_data: {
        seo_keywords?: string[];
        seo_description?: string;
        promotional_video?: string;
        course_outcomes?: string[];
        course_features?: string[];
        instructor_bio?: string;
        course_announcements?: Array<{
            id: string;
            title: string;
            content: string;
            created_at: Date;
            is_active: boolean;
        }>;
        analytics?: {
            view_count: number;
            engagement_rate: number;
            completion_rate: number;
            average_rating: number;
            last_analytics_update: Date;
        };
        settings?: {
            allow_downloads: boolean;
            allow_discussions: boolean;
            auto_enroll: boolean;
            send_notifications: boolean;
            drip_content: boolean;
            content_protection: boolean;
        };
    };
    created_at: Date;
    updated_at: Date;
}

const CourseSchema = new Schema({
    campus_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    short_description: { type: String },
    class_id: { type: String },
    created_by: { type: String, required: true },
    instructor_ids: { type: [String], default: [] },
    thumbnail: { type: String },
    preview_video: { type: String },
    status: {
        type: String,
        enum: ["draft", "published", "archived", "suspended"],
        default: "draft",
    },
    category: { type: String, required: true },
    sub_category: { type: String },
    difficulty_level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
    },
    language: { type: String, default: "English" },
    estimated_duration_hours: { type: Number },
    price: { type: Number, default: 0 },
    discount_price: { type: Number },
    currency: { type: String, default: "INR" },
    requirements: { type: [String], default: [] },
    learning_objectives: { type: [String], default: [] },
    target_audience: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    enrollment_count: { type: Number, default: 0 },
    completion_count: { type: Number, default: 0 },
    is_featured: { type: Boolean, default: false },
    is_certificate_enabled: { type: Boolean, default: true },
    certificate_template_id: { type: String },
    max_enrollments: { type: Number },
    enrollment_start_date: { type: Date },
    enrollment_end_date: { type: Date },
    course_start_date: { type: Date },
    course_end_date: { type: Date },
    last_updated_by: { type: String, required: true },
    version: { type: Number, default: 1 },
    meta_data: { type: Object, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for efficient queries
CourseSchema.index.findByCampusId = { by: "campus_id" };
CourseSchema.index.findByClassId = { by: "class_id" };
CourseSchema.index.findByCreatedBy = { by: "created_by" };
CourseSchema.index.findByStatus = { by: "status" };
CourseSchema.index.findByCategory = { by: "category" };
CourseSchema.index.findByInstructorIds = { by: "instructor_ids" };
CourseSchema.index.findByFeatured = { by: "is_featured" };
CourseSchema.index.findByPrice = { by: "price" };

const Course = ottoman.model<ICourseData>("courses", CourseSchema);

export { Course };
