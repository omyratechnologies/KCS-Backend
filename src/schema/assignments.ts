import { z } from "zod";

// Base assignment schema
export const assignmentSchema = z.object({
    id: z.string(),
    campus_id: z.string(),
    class_id: z.string().optional(),
    course_id: z.string().optional(),
    subject_id: z.string(),
    user_id: z.string(), // Teacher who created it
    title: z.string(),
    description: z.string(),
    instructions: z.string().optional(),
    due_date: z.string().datetime(),
    max_score: z.number().optional(),
    is_graded: z.boolean().default(true),
    allow_late_submission: z.boolean().default(false),
    attachment_urls: z.array(z.string()).optional(),
    meta_data: z.object({}).passthrough().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    assignment_type: z
        .enum(["homework", "project", "quiz", "exam", "presentation"])
        .default("homework"),
    estimated_duration_minutes: z.number().optional(),
    is_active: z.boolean().default(true),
    is_deleted: z.boolean().default(false),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

// Assignment submission schema
export const assignmentSubmissionSchema = z.object({
    id: z.string(),
    assignment_id: z.string(),
    campus_id: z.string(),
    user_id: z.string(), // Student who submitted
    submission_date: z.string().datetime(),
    submission_content: z.string().optional(),
    attachment_urls: z.array(z.string()).optional(),
    grade: z.number().optional(),
    feedback: z.string().optional(),
    is_late: z.boolean().default(false),
    attempt_number: z.number().default(1),
    time_spent_minutes: z.number().optional(),
    meta_data: z.object({}).passthrough().optional(),
    graded_by: z.string().optional(), // Teacher who graded
    graded_date: z.string().datetime().optional(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

// Detailed submission schema with student info
export const assignmentSubmissionDetailsSchema = z.object({
    submission: assignmentSubmissionSchema,
    student_info: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        class_name: z.string().optional(),
    }),
    status: z.enum(["submitted", "graded", "overdue", "pending"]),
    days_since_submission: z.number().optional(),
});

// ============================ ADMIN SCHEMAS ============================

export const createAssignmentRequestBodySchema = z
    .object({
        class_id: z.string().optional(),
        course_id: z.string().optional(),
        subject_id: z.string(),
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        instructions: z.string().optional(),
        due_date: z.string().datetime(),
        max_score: z.number().positive().optional(),
        is_graded: z.boolean().default(true),
        allow_late_submission: z.boolean().default(false),
        attachment_urls: z.array(z.string()).optional(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        assignment_type: z
            .enum(["homework", "project", "quiz", "exam", "presentation"])
            .default("homework"),
        estimated_duration_minutes: z.number().positive().optional(),
        meta_data: z.object({}).passthrough().optional(),
    })
    .refine((data) => data.class_id || data.course_id, {
        message: "Either class_id or course_id must be provided",
    });

export const createAssignmentResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: assignmentSchema,
});

export const updateAssignmentRequestBodySchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    instructions: z.string().optional(),
    due_date: z.string().datetime().optional(),
    max_score: z.number().positive().optional(),
    is_graded: z.boolean().optional(),
    allow_late_submission: z.boolean().optional(),
    attachment_urls: z.array(z.string()).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    assignment_type: z
        .enum(["homework", "project", "quiz", "exam", "presentation"])
        .optional(),
    estimated_duration_minutes: z.number().positive().optional(),
    meta_data: z.object({}).passthrough().optional(),
});

export const updateAssignmentResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: assignmentSchema,
});

export const deleteAssignmentResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export const bulkAssignmentOperationRequestBodySchema = z.object({
    assignment_ids: z
        .array(z.string())
        .min(1, "At least one assignment ID is required"),
    operation: z.enum([
        "archive",
        "delete",
        "extend_due_date",
        "change_priority",
    ]),
    parameters: z
        .object({
            new_due_date: z.string().datetime().optional(),
            days_to_extend: z.number().positive().optional(),
            new_priority: z.enum(["low", "medium", "high"]).optional(),
        })
        .optional(),
});

export const bulkAssignmentOperationResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    processed_count: z.number(),
    failed_count: z.number(),
    errors: z
        .array(
            z.object({
                assignment_id: z.string(),
                error: z.string(),
            })
        )
        .optional(),
});

export const assignmentAnalyticsResponseSchema = z.object({
    assignments: z.array(
        assignmentSchema.extend({
            submission_stats: z.object({
                total_students: z.number(),
                submitted: z.number(),
                pending: z.number(),
                graded: z.number(),
                average_grade: z.number().optional(),
                late_submissions: z.number(),
            }),
            class_info: z
                .object({
                    id: z.string(),
                    name: z.string(),
                    teacher_name: z.string(),
                })
                .optional(),
        })
    ),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        total_pages: z.number(),
    }),
    summary_stats: z.object({
        total_assignments: z.number(),
        active_assignments: z.number(),
        overdue_assignments: z.number(),
        total_submissions: z.number(),
        pending_grading: z.number(),
        average_completion_rate: z.number(),
    }),
});

// ============================ TEACHER SCHEMAS ============================

export const gradeSubmissionRequestBodySchema = z.object({
    grade: z.number().min(0, "Grade cannot be negative"),
    feedback: z.string().optional(),
    private_notes: z.string().optional(),
});

export const gradeSubmissionResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: assignmentSubmissionSchema,
});

export const teacherAssignmentStatsResponseSchema = z.object({
    assignments: z.array(
        assignmentSchema.extend({
            submission_stats: z.object({
                total_students: z.number(),
                submitted: z.number(),
                pending: z.number(),
                graded: z.number(),
                average_grade: z.number().optional(),
            }),
        })
    ),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        total_pages: z.number(),
    }),
    dashboard_stats: z.object({
        total_assignments: z.number(),
        pending_grading: z.number(),
        recent_submissions: z.number(),
        average_grade: z.number().optional(),
    }),
});

// ============================ STUDENT SCHEMAS ============================

export const submitAssignmentRequestBodySchema = z
    .object({
        submission_content: z.string().optional(),
        attachment_urls: z.array(z.string()).optional(),
        time_spent_minutes: z.number().positive().optional(),
        meta_data: z.object({}).passthrough().optional(),
    })
    .refine(
        (data) =>
            data.submission_content ||
            (data.attachment_urls && data.attachment_urls.length > 0),
        {
            message:
                "Either submission content or attachments must be provided",
        }
    );

export const submitAssignmentResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: assignmentSubmissionSchema,
    is_late: z.boolean(),
});

export const studentAssignmentViewResponseSchema = z.object({
    assignments: z.array(
        z.object({
            assignment: assignmentSchema,
            submission: assignmentSubmissionSchema.optional(),
            status: z.enum(["pending", "submitted", "graded", "overdue"]),
            days_until_due: z.number().optional(),
            priority_score: z.number(), // Calculated based on due date, priority, etc.
            class_info: z.object({
                id: z.string(),
                name: z.string(),
                subject_name: z.string(),
                teacher_name: z.string(),
            }),
        })
    ),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        total_pages: z.number(),
    }),
    summary: z.object({
        total_assignments: z.number(),
        pending: z.number(),
        submitted: z.number(),
        graded: z.number(),
        overdue: z.number(),
        due_today: z.number(),
        due_this_week: z.number(),
    }),
});

// ============================ PARENT SCHEMAS ============================

export const parentStudentAssignmentViewResponseSchema = z.object({
    student_info: z.object({
        id: z.string(),
        name: z.string(),
        class: z.string(),
        current_academic_year: z.string(),
    }),
    assignments: z.array(
        z.object({
            assignment: assignmentSchema.pick({
                id: true,
                title: true,
                description: true,
                due_date: true,
                assignment_type: true,
                priority: true,
            }),
            submission: assignmentSubmissionSchema
                .pick({
                    id: true,
                    submission_date: true,
                    grade: true,
                    is_late: true,
                })
                .optional(),
            status: z.enum(["pending", "submitted", "graded", "overdue"]),
            subject_name: z.string(),
            teacher_name: z.string(),
            class_name: z.string(),
        })
    ),
    summary: z.object({
        total_assignments: z.number(),
        submitted_on_time: z.number(),
        late_submissions: z.number(),
        pending: z.number(),
        average_grade: z.number().optional(),
        completion_rate: z.number(),
    }),
    alerts: z.array(
        z.object({
            type: z.enum([
                "overdue",
                "due_soon",
                "low_grade",
                "missing_submission",
            ]),
            message: z.string(),
            assignment_id: z.string(),
            severity: z.enum(["low", "medium", "high"]),
        })
    ),
});

// ============================ SHARED SCHEMAS ============================

export const errorResponseSchema = z.object({
    success: z.boolean().default(false),
    error: z.string(),
    code: z.string().optional(),
    details: z.object({}).passthrough().optional(),
});

// Status enums for better type safety
export const AssignmentStatus = z.enum([
    "active",
    "archived",
    "overdue",
    "draft",
]);
export const SubmissionStatus = z.enum([
    "pending",
    "submitted",
    "graded",
    "overdue",
    "late",
]);
export const UserRole = z.enum([
    "Student",
    "Teacher",
    "Admin",
    "Parent",
    "Principal",
    "Staff",
]);

// Export types for TypeScript usage
export type Assignment = z.infer<typeof assignmentSchema>;
export type AssignmentSubmission = z.infer<typeof assignmentSubmissionSchema>;
export type CreateAssignmentRequest = z.infer<
    typeof createAssignmentRequestBodySchema
>;
export type UpdateAssignmentRequest = z.infer<
    typeof updateAssignmentRequestBodySchema
>;
export type SubmitAssignmentRequest = z.infer<
    typeof submitAssignmentRequestBodySchema
>;
export type GradeSubmissionRequest = z.infer<
    typeof gradeSubmissionRequestBodySchema
>;
export type BulkAssignmentOperationRequest = z.infer<
    typeof bulkAssignmentOperationRequestBodySchema
>;
