import { z } from "zod";

// Student progress schemas
export const studentInfoSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    campus_id: z.string(),
});

export const overallProgressSchema = z.object({
    total_progress_percentage: z.number().min(0).max(100),
    completion_status: z.enum(["not_started", "in_progress", "completed"]),
    last_updated: z.string().datetime(),
});

export const courseProgressSchema = z.object({
    total_enrolled: z.number(),
    completed: z.number(),
    in_progress: z.number(),
    not_started: z.number(),
    average_progress: z.number().min(0).max(100),
});

export const assignmentProgressSchema = z.object({
    total_assignments: z.number(),
    submitted: z.number(),
    completion_rate: z.number().min(0).max(100),
    average_grade: z.number(),
});

export const performanceMetricsSchema = z.object({
    total_study_hours: z.number(),
    engagement_score: z.number().min(0).max(100),
    current_streak: z.number(),
});

export const studentProgressSummarySchema = z.object({
    student_info: studentInfoSchema,
    overall_progress: overallProgressSchema,
    courses: courseProgressSchema,
    assignments: assignmentProgressSchema,
    performance_metrics: performanceMetricsSchema,
});

export const studentProgressResponseSchema = z.object({
    success: z.boolean(),
    data: studentProgressSummarySchema,
    message: z.string(),
});

export const courseProgressDetailSchema = z.object({
    course_info: z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        thumbnail: z.string().optional(),
        category: z.string().optional(),
        difficulty_level: z.string().optional(),
        rating: z.number().optional(),
    }),
    enrollment_info: z.object({
        enrollment_date: z.string().datetime(),
        enrollment_status: z.string(),
        progress_percentage: z.number().min(0).max(100),
        certificate_issued: z.boolean(),
        certificate_id: z.string().optional(),
    }),
    progress_summary: z.object({
        total_lectures: z.number(),
        completed_lectures: z.number(),
        completion_percentage: z.number().min(0).max(100),
        time_spent_hours: z.number(),
        estimated_remaining_hours: z.number(),
    }),
});

export const courseProgressResponseSchema = z.object({
    success: z.boolean(),
    data: courseProgressDetailSchema,
    message: z.string(),
});

export const academicSummarySchema = z.object({
    overall_progress: overallProgressSchema,
    course_summary: z.object({
        total_enrolled: z.number(),
        average_progress: z.number(),
        completed: z.number(),
    }),
    assignment_summary: z.object({
        total_assignments: z.number(),
        completion_rate: z.number(),
        average_grade: z.number(),
    }),
    performance_summary: z.object({
        total_study_hours: z.number(),
        engagement_score: z.number(),
        current_streak: z.number(),
    }),
});

export const academicSummaryResponseSchema = z.object({
    success: z.boolean(),
    data: academicSummarySchema,
    message: z.string(),
});

// Error response schema
export const progressErrorResponseSchema = z.object({
    success: z.boolean().default(false),
    error: z.string(),
    code: z.string().optional(),
});

// Export types for TypeScript usage
export type StudentProgressSummary = z.infer<typeof studentProgressSummarySchema>;
export type CourseProgressDetail = z.infer<typeof courseProgressDetailSchema>;
export type AcademicSummary = z.infer<typeof academicSummarySchema>;