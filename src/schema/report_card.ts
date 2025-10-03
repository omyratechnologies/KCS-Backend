import { z } from "zod";

// Subject-wise performance schema
export const subjectReportSchema = z.object({
    subject_id: z.string(),
    subject_name: z.string(),
    exam_marks: z.object({
        marks_obtained: z.number(),
        total_marks: z.number(),
        percentage: z.number(),
        grade: z.string(),
    }).optional(),
    assignment_stats: z.object({
        total_assignments: z.number(),
        submitted: z.number(),
        average_grade: z.number().optional(),
        completion_rate: z.number(),
    }),
    quiz_stats: z.object({
        total_quizzes: z.number(),
        attempted: z.number(),
        average_score: z.number().optional(),
        completion_rate: z.number(),
    }),
    overall_performance: z.object({
        percentage: z.number(),
        grade: z.string(),
        remarks: z.string(),
    }),
});

// Attendance summary schema
export const attendanceSummarySchema = z.object({
    total_days: z.number(),
    present: z.number(),
    absent: z.number(),
    late: z.number(),
    leave: z.number(),
    attendance_percentage: z.number(),
    remarks: z.string(),
});

// Overall performance summary schema
export const overallPerformanceSummarySchema = z.object({
    total_marks_obtained: z.number(),
    total_marks_possible: z.number(),
    overall_percentage: z.number(),
    overall_grade: z.string(),
    overall_gpa: z.number().optional(),
    class_rank: z.number().optional(),
    total_students: z.number().optional(),
});

// Behavioral metrics schema
export const behavioralMetricsSchema = z.object({
    discipline_score: z.number().min(0).max(100),
    participation_score: z.number().min(0).max(100),
    punctuality_score: z.number().min(0).max(100),
    remarks: z.array(z.string()),
});

// Activity summary schema
export const activitySummarySchema = z.object({
    assignments: z.object({
        total: z.number(),
        submitted: z.number(),
        pending: z.number(),
        overdue: z.number(),
        average_grade: z.number().optional(),
        completion_rate: z.number(),
    }),
    quizzes: z.object({
        total: z.number(),
        attempted: z.number(),
        average_score: z.number().optional(),
        completion_rate: z.number(),
    }),
    courses: z.object({
        enrolled: z.number(),
        in_progress: z.number(),
        completed: z.number(),
        average_progress: z.number(),
    }),
});

// Teacher remarks schema
export const teacherRemarksSchema = z.object({
    subject_id: z.string(),
    subject_name: z.string(),
    teacher_name: z.string(),
    remarks: z.string(),
    strengths: z.array(z.string()),
    areas_for_improvement: z.array(z.string()),
});

// Monthly report card schema
export const monthlyReportCardSchema = z.object({
    report_id: z.string(),
    student_info: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        class_id: z.string(),
        class_name: z.string(),
        roll_number: z.string().optional(),
    }),
    academic_info: z.object({
        academic_year: z.string(),
        month: z.string(),
        month_name: z.string(),
        semester: z.string().optional(),
    }),
    attendance: attendanceSummarySchema,
    subjects_performance: z.array(subjectReportSchema),
    activity_summary: activitySummarySchema,
    overall_performance: overallPerformanceSummarySchema,
    behavioral_metrics: behavioralMetricsSchema,
    teacher_remarks: z.array(teacherRemarksSchema).optional(),
    achievements: z.array(z.string()).optional(),
    co_curricular_activities: z.array(z.object({
        activity_name: z.string(),
        participation_level: z.string(),
        remarks: z.string().optional(),
    })).optional(),
    generated_at: z.string().datetime(),
    generated_by: z.string(),
});

// Request schemas
export const getReportCardQuerySchema = z.object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in format YYYY-MM"),
    include_remarks: z.enum(["true", "false"]).optional(),
});

export const getStudentReportCardParamsSchema = z.object({
    student_id: z.string(),
});

// Response schemas
export const reportCardResponseSchema = z.object({
    success: z.boolean(),
    data: monthlyReportCardSchema,
    message: z.string(),
});

export const reportCardListResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(monthlyReportCardSchema),
    count: z.number(),
    message: z.string(),
});

export const availableMonthSchema = z.object({
    month: z.string(),
    month_name: z.string(),
    academic_year: z.string(),
    is_published: z.boolean(),
    is_final: z.boolean(),
    generated_at: z.string().datetime(),
});

export const availableMonthsResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(availableMonthSchema),
    count: z.number(),
    message: z.string(),
});

// Error response schema
export const reportCardErrorResponseSchema = z.object({
    success: z.boolean(),
    error: z.string(),
    details: z.any().optional(),
});

// Admin update remarks schema
export const updateTeacherRemarksSchema = z.object({
    report_id: z.string(),
    teacher_remarks: z.array(teacherRemarksSchema),
    achievements: z.array(z.string()).optional(),
    co_curricular_activities: z.array(z.object({
        activity_name: z.string(),
        participation_level: z.string(),
        remarks: z.string().optional(),
    })).optional(),
});

export const updateTeacherRemarksBodySchema = z.object({
    teacher_remarks: z.array(teacherRemarksSchema),
    achievements: z.array(z.string()).optional(),
    co_curricular_activities: z.array(z.object({
        activity_name: z.string(),
        participation_level: z.string(),
        remarks: z.string().optional(),
    })).optional(),
});
