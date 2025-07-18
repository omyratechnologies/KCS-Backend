import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseProgressData {
    id: string;
    campus_id: string;
    course_id: string;
    user_id: string;
    enrollment_id: string;
    overall_progress: number; // 0-100
    chapters_completed: number;
    total_chapters: number;
    assignments_completed: number;
    total_assignments: number;
    quizzes_completed: number;
    total_quizzes: number;
    total_watch_time: number; // in seconds
    completion_percentage: number;
    is_completed: boolean;
    completion_date?: Date;
    certificates_earned: string[];
    current_chapter_id?: string;
    last_accessed_at: Date;
    streak_days: number;
    performance_metrics: {
        average_quiz_score: number;
        average_assignment_score: number;
        engagement_score: number;
        learning_velocity: number; // chapters per week
    };
    badges_earned: string[];
    study_patterns: {
        preferred_study_time: string;
        average_session_duration: number;
        study_frequency: number;
    };
    created_at: Date;
    updated_at: Date;
}

const CourseProgressSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    user_id: { type: String, required: true },
    enrollment_id: { type: String, required: true },
    overall_progress: { type: Number, required: true },
    chapters_completed: { type: Number, required: true },
    total_chapters: { type: Number, required: true },
    assignments_completed: { type: Number, required: true },
    total_assignments: { type: Number, required: true },
    quizzes_completed: { type: Number, required: true },
    total_quizzes: { type: Number, required: true },
    total_watch_time: { type: Number, required: true },
    completion_percentage: { type: Number, required: true },
    is_completed: { type: Boolean, required: true },
    completion_date: { type: Date, required: false },
    certificates_earned: { type: [String], required: true },
    current_chapter_id: { type: String, required: false },
    last_accessed_at: { type: Date, required: true },
    streak_days: { type: Number, required: true },
    performance_metrics: {
        average_score: { type: Number, default: 0 },
        time_spent_learning: { type: Number, default: 0 },
        completion_rate: { type: Number, default: 0 },
        engagement_score: { type: Number, default: 0 },
        difficulty_progression: { type: Number, default: 0 },
    },
    badges_earned: { type: [String], default: [] },
    study_patterns: {
        preferred_time_slots: { type: [String], default: [] },
        average_session_duration: { type: Number, default: 0 },
        study_frequency: { type: Number, default: 0 },
    },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseProgressSchema.index.findByCampusId = { by: "campus_id" };
CourseProgressSchema.index.findByCourseId = { by: "course_id" };
CourseProgressSchema.index.findByUserId = { by: "user_id" };
CourseProgressSchema.index.findByEnrollmentId = { by: "enrollment_id" };

const CourseProgress = ottoman.model<ICourseProgressData>(
    "course_progress",
    CourseProgressSchema
);

export { CourseProgress, type ICourseProgressData };
