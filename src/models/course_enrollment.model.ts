import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface ICourseEnrollmentData {
    id: string;
    course_id: string;
    user_id: string;
    campus_id: string;
    enrollment_type: "free" | "paid" | "admin_assigned" | "bulk_enrollment";
    enrollment_status: "active" | "completed" | "dropped" | "suspended" | "expired";
    progress_percentage: number; // 0-100
    enrollment_date: Date;
    completion_date?: Date;
    expiry_date?: Date;
    last_accessed_at?: Date;
    payment_status?: "pending" | "completed" | "failed" | "refunded";
    payment_reference?: string;
    certificate_issued: boolean;
    certificate_id?: string;
    certificate_issued_at?: Date;
    grade?: number; // Final grade (0-100)
    completion_time_hours?: number; // Total time spent
    access_details: {
        total_lectures: number;
        completed_lectures: number;
        completed_lecture_ids: string[];
        current_lecture_id?: string;
        current_section_id?: string;
        bookmarked_lectures: string[];
        notes_count: number;
        quiz_attempts: number;
        assignment_submissions: number;
    };
    enrollment_source: "web" | "mobile" | "admin" | "api" | "bulk_import";
    referral_code?: string;
    discount_applied?: {
        discount_code: string;
        discount_amount: number;
        discount_type: "percentage" | "fixed";
    };
    meta_data: {
        enrollment_reason?: string;
        instructor_notes?: string;
        student_feedback?: {
            rating: number;
            review: string;
            feedback_date: Date;
        };
        learning_path_id?: string;
        cohort_id?: string;
        custom_fields?: Record<string, any>;
    };
    created_at: Date;
    updated_at: Date;
}

const CourseEnrollmentSchema = new Schema({
    course_id: { type: String, required: true },
    user_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    enrollment_type: { 
        type: String, 
        enum: ["free", "paid", "admin_assigned", "bulk_enrollment"],
        default: "free"
    },
    enrollment_status: { 
        type: String, 
        enum: ["active", "completed", "dropped", "suspended", "expired"],
        default: "active"
    },
    progress_percentage: { type: Number, default: 0 },
    enrollment_date: { type: Date, default: () => new Date() },
    completion_date: { type: Date },
    expiry_date: { type: Date },
    last_accessed_at: { type: Date },
    payment_status: { 
        type: String, 
        enum: ["pending", "completed", "failed", "refunded"]
    },
    payment_reference: { type: String },
    certificate_issued: { type: Boolean, default: false },
    certificate_id: { type: String },
    certificate_issued_at: { type: Date },
    grade: { type: Number },
    completion_time_hours: { type: Number },
    access_details: { 
        type: Object, 
        default: {
            total_lectures: 0,
            completed_lectures: 0,
            completed_lecture_ids: [],
            bookmarked_lectures: [],
            notes_count: 0,
            quiz_attempts: 0,
            assignment_submissions: 0
        }
    },
    enrollment_source: { 
        type: String, 
        enum: ["web", "mobile", "admin", "api", "bulk_import"],
        default: "web"
    },
    referral_code: { type: String },
    discount_applied: { type: Object },
    meta_data: { type: Object, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Compound indexes for efficient queries
CourseEnrollmentSchema.index.findByCourseId = { by: "course_id" };
CourseEnrollmentSchema.index.findByUserId = { by: "user_id" };
CourseEnrollmentSchema.index.findByCampusId = { by: "campus_id" };
CourseEnrollmentSchema.index.findByUserAndCourse = { by: ["user_id", "course_id"] };
CourseEnrollmentSchema.index.findByStatus = { by: "enrollment_status" };
CourseEnrollmentSchema.index.findByPaymentStatus = { by: "payment_status" };

const CourseEnrollment = ottoman.model<ICourseEnrollmentData>("course_enrollments", CourseEnrollmentSchema);

export { CourseEnrollment };
