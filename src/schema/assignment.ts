import { z } from "zod";

// Base assignment schema
export const assignmentSchema = z.object({
    id: z.string().openapi({ example: "assignment_123" }),
    campus_id: z.string().openapi({ example: "campus_123" }),
    subject_id: z.string().openapi({ example: "subject_123" }),
    user_id: z.string().openapi({ example: "teacher_123" }),
    class_id: z.string().openapi({ example: "class_123" }),
    title: z.string().openapi({ example: "Math Assignment 1" }),
    description: z.string().openapi({ example: "Complete exercises 1-10 from chapter 5" }),
    due_date: z.string().datetime().openapi({ example: "2024-01-15T23:59:59Z" }),
    is_graded: z.boolean().openapi({ example: true }),
    meta_data: z.object({
        status: z.enum(['draft', 'published', 'archived']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        max_grade: z.number().optional(),
        attachments: z.array(z.object({
            file_name: z.string(),
            file_url: z.string(),
            file_type: z.string(),
        })).optional(),
    }).openapi({ example: { status: "published", priority: "medium", max_grade: 100 } }),
    created_at: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
    updated_at: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
});

// Enhanced assignment with relations
export const assignmentWithRelationsSchema = assignmentSchema.extend({
    class_info: z.object({
        id: z.string(),
        name: z.string(),
        academic_year: z.string(),
    }).optional(),
    subject_info: z.object({
        id: z.string(),
        name: z.string(),
        code: z.string(),
    }).optional(),
    creator_info: z.object({
        id: z.string(),
        first_name: z.string(),
        last_name: z.string(),
        email: z.string(),
    }).optional(),
    stats: z.object({
        total_submissions: z.number(),
        pending_submissions: z.number(),
        graded_submissions: z.number(),
        average_grade: z.number(),
        students_count: z.number(),
        submission_rate: z.number(),
    }).optional(),
});

// Create assignment request
export const createAssignmentRequestSchema = z.object({
    title: z.string().min(1).max(200).openapi({ example: "Math Assignment 1" }),
    description: z.string().min(1).openapi({ example: "Complete exercises 1-10 from chapter 5" }),
    due_date: z.string().datetime().openapi({ example: "2024-01-15T23:59:59Z" }),
    subject_id: z.string().min(1).openapi({ example: "subject_123" }),
    class_id: z.string().min(1).openapi({ example: "class_123" }),
    is_graded: z.boolean().optional().default(true),
    status: z.enum(['draft', 'published']).optional().default('published'),
    meta_data: z.object({
        priority: z.enum(['low', 'medium', 'high']).optional(),
        max_grade: z.number().positive().optional(),
        submission_instructions: z.string().optional(),
        attachments: z.array(z.object({
            file_name: z.string(),
            file_url: z.string(),
            file_type: z.string(),
        })).optional(),
    }).optional(),
    additional_class_ids: z.array(z.string()).optional().openapi({ 
        example: ["class_456", "class_789"],
        description: "Create the same assignment for multiple classes" 
    }),
    template_id: z.string().optional().openapi({ 
        example: "template_123",
        description: "Assignment template to use" 
    }),
});

// Update assignment request
export const updateAssignmentRequestSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).optional(),
    due_date: z.string().datetime().optional(),
    is_graded: z.boolean().optional(),
    meta_data: z.object({
        status: z.enum(['draft', 'published', 'archived']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        max_grade: z.number().positive().optional(),
        submission_instructions: z.string().optional(),
    }).optional(),
});

// Assignment query parameters
export const assignmentQuerySchema = z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    campus_id: z.string().optional(),
    class_id: z.string().optional(),
    subject_id: z.string().optional(),
    teacher_id: z.string().optional(),
    is_graded: z.string().transform(val => val === 'true').optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    search: z.string().optional(),
    sort_by: z.enum(['title', 'due_date', 'created_at', 'updated_at']).optional(),
    sort_order: z.enum(['ASC', 'DESC']).optional(),
    due_date_from: z.string().datetime().optional(),
    due_date_to: z.string().datetime().optional(),
    include_submissions: z.string().transform(val => val === 'true').optional(),
    include_class_info: z.string().transform(val => val === 'true').optional(),
    include_subject_info: z.string().transform(val => val === 'true').optional(),
    include_creator_info: z.string().transform(val => val === 'true').optional(),
    include_stats: z.string().transform(val => val === 'true').optional(),
});

// Assignment response with pagination
export const assignmentListResponseSchema = z.object({
    assignments: z.array(assignmentWithRelationsSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    total_pages: z.number(),
});

// Assignment submission schema
export const assignmentSubmissionSchema = z.object({
    id: z.string().openapi({ example: "submission_123" }),
    campus_id: z.string().openapi({ example: "campus_123" }),
    assignment_id: z.string().openapi({ example: "assignment_123" }),
    user_id: z.string().openapi({ example: "student_123" }),
    submission_date: z.string().datetime().openapi({ example: "2024-01-10T14:30:00Z" }),
    grade: z.number().min(0).openapi({ example: 85 }),
    feedback: z.string().openapi({ example: "Good work! Check question 3." }),
    meta_data: z.object({
        status: z.enum(['submitted', 'graded', 'late', 'returned']).optional(),
        submission_type: z.enum(['text', 'file', 'link', 'mixed']).optional(),
        attachments: z.array(z.object({
            file_name: z.string(),
            file_url: z.string(),
            file_type: z.string(),
        })).optional(),
        submission_text: z.string().optional(),
    }).openapi({ example: { status: "graded", submission_type: "file" } }),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

// Create submission request
export const createSubmissionRequestSchema = z.object({
    meta_data: z.object({
        submission_type: z.enum(['text', 'file', 'link', 'mixed']).optional(),
        submission_text: z.string().optional(),
        submission_links: z.array(z.string().url()).optional(),
        attachments: z.array(z.object({
            file_name: z.string(),
            file_url: z.string(),
            file_type: z.string(),
        })).optional(),
    }).optional(),
    grade: z.number().min(0).optional(),
    feedback: z.string().optional(),
});

// Bulk operation schema
export const bulkAssignmentOperationSchema = z.object({
    assignment_ids: z.array(z.string()).min(1).openapi({ 
        example: ["assignment_123", "assignment_456"],
        description: "Array of assignment IDs to operate on" 
    }),
    action: z.enum(['archive', 'publish', 'delete', 'update_due_date']).openapi({
        example: "publish",
        description: "Action to perform on the assignments"
    }),
    data: z.object({
        due_date: z.string().datetime().optional(),
        status: z.string().optional(),
    }).optional().openapi({
        example: { due_date: "2024-01-20T23:59:59Z" },
        description: "Additional data for the operation"
    }),
});

// Bulk operation response
export const bulkOperationResponseSchema = z.object({
    success: z.number().openapi({ example: 5 }),
    failed: z.number().openapi({ example: 1 }),
    errors: z.array(z.string()).openapi({ 
        example: ["Assignment assignment_456: Assignment not found"]
    }),
});

// Assignment statistics schema
export const assignmentStatsSchema = z.object({
    total_assignments: z.number(),
    active_assignments: z.number(),
    overdue_assignments: z.number(),
    total_submissions: z.number(),
    pending_grading: z.number(),
    average_submission_rate: z.number(),
    upcoming_deadlines: z.array(assignmentWithRelationsSchema),
    recent_assignments: z.array(assignmentWithRelationsSchema),
});

// Export refs for OpenAPI
export const assignmentSchemaRefs = {
    Assignment: assignmentSchema,
    AssignmentWithRelations: assignmentWithRelationsSchema,
    CreateAssignmentRequest: createAssignmentRequestSchema,
    UpdateAssignmentRequest: updateAssignmentRequestSchema,
    AssignmentListResponse: assignmentListResponseSchema,
    AssignmentSubmission: assignmentSubmissionSchema,
    CreateSubmissionRequest: createSubmissionRequestSchema,
    BulkAssignmentOperation: bulkAssignmentOperationSchema,
    BulkOperationResponse: bulkOperationResponseSchema,
    AssignmentStats: assignmentStatsSchema,
};
