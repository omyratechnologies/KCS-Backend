/**
 * 🎯 UNIFIED ASSIGNMENT API
 *
 * This file contains the complete, unified assignment API that replaces all legacy
 * assignment endpoints from class.route.ts and course.route.ts.
 *
 * ✅ FEATURES:
 * - Role-based access control (Admin, Teacher, Student, Parent)
 * - Unified view across classes and courses
 * - Comprehensive assignment management
 * - Analytics and reporting
 * - Mobile-optimized responses
 *
 * ✅ MIGRATION STATUS: COMPLETE
 * - Legacy class assignment endpoints: REMOVED
 * - Legacy course assignment endpoints: REMOVED
 * - All functionality consolidated here
 *
 * 🔗 API Documentation: /docs
 * 🧪 Test Collection: docs/Assignment_API.postman_collection.json
 */

import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { roleMiddleware } from "@/middlewares/role.middleware";

import { AssignmentController } from "../controllers/assignments.controller";
import {
    assignmentAnalyticsResponseSchema,
    // Shared schemas
    assignmentSchema,
    assignmentSubmissionDetailsSchema,
    assignmentSubmissionSchema,
    bulkAssignmentOperationRequestBodySchema,
    bulkAssignmentOperationResponseSchema,
    // Admin schemas
    createAssignmentRequestBodySchema,
    createAssignmentResponseSchema,
    deleteAssignmentResponseSchema,
    errorResponseSchema,
    // Teacher schemas
    gradeSubmissionRequestBodySchema,
    gradeSubmissionResponseSchema,
    // Parent schemas
    parentStudentAssignmentViewResponseSchema,
    studentAssignmentViewResponseSchema,
    // Student schemas
    submitAssignmentRequestBodySchema,
    submitAssignmentResponseSchema,
    teacherAssignmentStatsResponseSchema,
    updateAssignmentRequestBodySchema,
    updateAssignmentResponseSchema,
} from "../schema/assignments";

const app = new Hono();

// ======================= ADMIN ROUTES =======================
// Admin can monitor everything, perform bulk operations, view analytics

app.post(
    "/",
    describeRoute({
        operationId: "createAssignment",
        summary: "Create a new assignment",
        description:
            "Create a new assignment for a class or course. Admin/Teacher only.",
        tags: ["Assignments - Admin/Teacher"],
        responses: {
            201: {
                description: "Assignment created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createAssignmentResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - validation error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Forbidden - insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("create_assignment"),
    zValidator("json", createAssignmentRequestBodySchema),
    AssignmentController.createAssignment
);

app.get(
    "/admin/overview",
    describeRoute({
        operationId: "getAdminAssignmentOverview",
        summary: "Get admin assignment overview",
        description:
            "Get comprehensive overview of all assignments across campus. Admin only.",
        tags: ["Assignments - Admin"],
        parameters: [
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["active", "archived", "overdue", "all"],
                },
                description: "Filter by assignment status",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
            {
                name: "subject_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by subject ID",
            },
            {
                name: "teacher_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by teacher ID",
            },
            {
                name: "from_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter assignments from date",
            },
            {
                name: "to_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter assignments to date",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1 },
                description: "Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1, maximum: 100 },
                description: "Number of items per page",
            },
        ],
        responses: {
            200: {
                description: "Admin assignment overview",
                content: {
                    "application/json": {
                        schema: resolver(assignmentAnalyticsResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("admin_assignment_overview"),
    AssignmentController.getAdminAssignmentOverview
);

app.post(
    "/admin/bulk-operations",
    describeRoute({
        operationId: "performBulkAssignmentOperations",
        summary: "Perform bulk operations on assignments",
        description:
            "Perform bulk operations like archive, delete, extend due dates. Admin only.",
        tags: ["Assignments - Admin"],
        responses: {
            200: {
                description: "Bulk operation completed",
                content: {
                    "application/json": {
                        schema: resolver(bulkAssignmentOperationResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("admin_bulk_assignment_operations"),
    zValidator("json", bulkAssignmentOperationRequestBodySchema),
    AssignmentController.performBulkAssignmentOperations
);

app.get(
    "/admin/analytics",
    describeRoute({
        operationId: "getAssignmentAnalytics",
        summary: "Get assignment analytics",
        description:
            "Get detailed analytics about assignments, submissions, grades. Admin only.",
        tags: ["Assignments - Admin"],
        parameters: [
            {
                name: "period",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["week", "month", "quarter", "year"],
                },
                description: "Analytics period",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
            {
                name: "subject_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by subject ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment analytics data",
                content: {
                    "application/json": {
                        schema: resolver(assignmentAnalyticsResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("admin_assignment_analytics"),
    AssignmentController.getAssignmentAnalytics
);

// ======================= TEACHER ROUTES =======================
// Teachers can create, manage their assignments, grade submissions

app.get(
    "/teacher/my-assignments",
    describeRoute({
        operationId: "getTeacherAssignments",
        summary: "Get teacher's assignments",
        description: "Get all assignments created by the current teacher.",
        tags: ["Assignments - Teacher"],
        parameters: [
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["active", "archived", "overdue", "all"],
                },
                description: "Filter by assignment status",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1 },
                description: "Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1, maximum: 50 },
                description: "Number of items per page",
            },
        ],
        responses: {
            200: {
                description: "Teacher's assignments",
                content: {
                    "application/json": {
                        schema: resolver(teacherAssignmentStatsResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("teacher_get_assignments"),
    AssignmentController.getTeacherAssignments
);

app.get(
    "/teacher/:assignment_id/submissions",
    describeRoute({
        operationId: "getAssignmentSubmissions",
        summary: "Get assignment submissions",
        description:
            "Get all submissions for a specific assignment. Teacher only for their assignments.",
        tags: ["Assignments - Teacher"],
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["submitted", "graded", "overdue", "pending", "all"],
                },
                description: "Filter by submission status",
            },
            {
                name: "student_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by specific student",
            },
        ],
        responses: {
            200: {
                description: "Assignment submissions",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                assignment: {
                                    $ref: "#/components/schemas/Assignment",
                                },
                                submissions: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/AssignmentSubmissionDetails",
                                    },
                                },
                                stats: {
                                    type: "object",
                                    properties: {
                                        total_students: { type: "number" },
                                        submitted: { type: "number" },
                                        pending: { type: "number" },
                                        graded: { type: "number" },
                                        average_grade: { type: "number" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("teacher_get_submissions"),
    AssignmentController.getAssignmentSubmissions
);

app.post(
    "/teacher/submissions/:submission_id/grade",
    describeRoute({
        operationId: "gradeSubmission",
        summary: "Grade a submission",
        description: "Grade a student's assignment submission. Teacher only.",
        tags: ["Assignments - Teacher"],
        parameters: [
            {
                name: "submission_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Submission ID",
            },
        ],
        responses: {
            200: {
                description: "Submission graded successfully",
                content: {
                    "application/json": {
                        schema: resolver(gradeSubmissionResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("teacher_grade_submission"),
    zValidator("json", gradeSubmissionRequestBodySchema),
    AssignmentController.gradeSubmission
);

app.get(
    "/teacher/dashboard",
    describeRoute({
        operationId: "getTeacherAssignmentDashboard",
        summary: "Get teacher assignment dashboard",
        description:
            "Get teacher's assignment dashboard with stats and recent activity.",
        tags: ["Assignments - Teacher"],
        responses: {
            200: {
                description: "Teacher assignment dashboard",
                content: {
                    "application/json": {
                        schema: resolver(teacherAssignmentStatsResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("teacher_assignment_dashboard"),
    AssignmentController.getTeacherAssignmentDashboard
);

// ======================= STUDENT ROUTES =======================
// Students can view assignments, submit, check grades and performance

app.get(
    "/student/my-assignments",
    describeRoute({
        operationId: "getStudentAssignments",
        summary: "Get student's assignments",
        description:
            "Get all assignments for the current student across all classes.",
        tags: ["Assignments - Student"],
        parameters: [
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: [
                        "pending",
                        "submitted",
                        "graded",
                        "overdue",
                        "due_soon",
                        "all",
                    ],
                },
                description: "Filter by assignment status",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
            {
                name: "subject_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by subject ID",
            },
            {
                name: "due_in_days",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1 },
                description: "Filter assignments due within specified days",
            },
            {
                name: "sort_by",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["due_date", "created_date", "subject", "priority"],
                },
                description: "Sort assignments by",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1 },
                description: "Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1, maximum: 50 },
                description: "Number of items per page",
            },
        ],
        responses: {
            200: {
                description: "Student's assignments",
                content: {
                    "application/json": {
                        schema: resolver(studentAssignmentViewResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("student_get_assignments"),
    AssignmentController.getStudentAssignments
);

app.get(
    "/student/dashboard",
    describeRoute({
        operationId: "getStudentAssignmentDashboard",
        summary: "Get student assignment dashboard",
        description:
            "Get student's assignment dashboard with upcoming deadlines and performance.",
        tags: ["Assignments - Student"],
        responses: {
            200: {
                description: "Student assignment dashboard",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                upcoming_assignments: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            assignment: {
                                                $ref: "#/components/schemas/Assignment",
                                            },
                                            days_until_due: { type: "number" },
                                            priority: {
                                                type: "string",
                                                enum: ["high", "medium", "low"],
                                            },
                                        },
                                    },
                                },
                                overdue_assignments: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Assignment",
                                    },
                                },
                                recent_grades: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            assignment: {
                                                $ref: "#/components/schemas/Assignment",
                                            },
                                            grade: { type: "number" },
                                            feedback: { type: "string" },
                                            graded_date: {
                                                type: "string",
                                                format: "date-time",
                                            },
                                        },
                                    },
                                },
                                stats: {
                                    type: "object",
                                    properties: {
                                        total_assignments: { type: "number" },
                                        submitted: { type: "number" },
                                        pending: { type: "number" },
                                        overdue: { type: "number" },
                                        average_grade: { type: "number" },
                                        completion_rate: { type: "number" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("student_assignment_dashboard"),
    AssignmentController.getStudentAssignmentDashboard
);

app.get(
    "/student/performance",
    describeRoute({
        operationId: "getStudentAssignmentPerformance",
        summary: "Get student assignment performance",
        description:
            "Get detailed performance analytics for the student's assignments.",
        tags: ["Assignments - Student"],
        parameters: [
            {
                name: "period",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["week", "month", "quarter", "year", "all"],
                },
                description: "Performance analysis period",
            },
            {
                name: "subject_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by subject ID",
            },
        ],
        responses: {
            200: {
                description: "Student assignment performance",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                performance_trends: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            period: { type: "string" },
                                            average_grade: { type: "number" },
                                            completion_rate: { type: "number" },
                                            submitted_count: { type: "number" },
                                        },
                                    },
                                },
                                subject_performance: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            subject_name: { type: "string" },
                                            average_grade: { type: "number" },
                                            completion_rate: { type: "number" },
                                            total_assignments: {
                                                type: "number",
                                            },
                                        },
                                    },
                                },
                                improvement_suggestions: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("student_assignment_performance"),
    AssignmentController.getStudentAssignmentPerformance
);

app.get(
    "/student/:assignment_id",
    describeRoute({
        operationId: "getStudentAssignmentDetails",
        summary: "Get assignment details for student",
        description:
            "Get detailed view of a specific assignment for the student.",
        tags: ["Assignments - Student"],
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment details",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                assignment: {
                                    $ref: "#/components/schemas/Assignment",
                                },
                                submission: {
                                    $ref: "#/components/schemas/AssignmentSubmission",
                                },
                                class_info: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        name: { type: "string" },
                                        subject_name: { type: "string" },
                                        teacher_name: { type: "string" },
                                    },
                                },
                                status: {
                                    type: "string",
                                    enum: [
                                        "pending",
                                        "submitted",
                                        "graded",
                                        "overdue",
                                    ],
                                },
                                days_until_due: { type: "number" },
                                can_resubmit: { type: "boolean" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("student_get_assignment"),
    AssignmentController.getStudentAssignmentDetails
);

app.post(
    "/student/:assignment_id/submit",
    describeRoute({
        operationId: "submitAssignment",
        summary: "Submit an assignment",
        description: "Submit an assignment solution. Student only.",
        tags: ["Assignments - Student"],
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            201: {
                description: "Assignment submitted successfully",
                content: {
                    "application/json": {
                        schema: resolver(submitAssignmentResponseSchema),
                    },
                },
            },
            400: {
                description:
                    "Bad request - assignment already submitted or overdue",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("student_submit_assignment"),
    zValidator("json", submitAssignmentRequestBodySchema),
    AssignmentController.submitAssignment
);

// ======================= PARENT ROUTES =======================
// Parents can view their child's assignment overview and performance

app.get(
    "/parent/student/:student_id/assignments",
    describeRoute({
        operationId: "getParentStudentAssignments",
        summary: "Get student assignments for parent",
        description:
            "Get assignment overview for a specific student. Parent only for their children.",
        tags: ["Assignments - Parent"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["pending", "submitted", "graded", "overdue", "all"],
                },
                description: "Filter by assignment status",
            },
            {
                name: "period",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["week", "month", "quarter", "all"],
                },
                description: "Time period for assignments",
            },
        ],
        responses: {
            200: {
                description: "Student assignments for parent view",
                content: {
                    "application/json": {
                        schema: resolver(
                            parentStudentAssignmentViewResponseSchema
                        ),
                    },
                },
            },
        },
    }),
    roleMiddleware("parent_get_student_assignments"),
    AssignmentController.getParentStudentAssignments
);

app.get(
    "/parent/student/:student_id/performance",
    describeRoute({
        operationId: "getParentStudentPerformance",
        summary: "Get student assignment performance for parent",
        description:
            "Get assignment performance overview for a specific student. Parent only.",
        tags: ["Assignments - Parent"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "period",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["month", "quarter", "year"],
                },
                description: "Performance analysis period",
            },
        ],
        responses: {
            200: {
                description: "Student assignment performance for parent",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                student_info: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        name: { type: "string" },
                                        class: { type: "string" },
                                    },
                                },
                                performance_summary: {
                                    type: "object",
                                    properties: {
                                        total_assignments: { type: "number" },
                                        submitted_on_time: { type: "number" },
                                        late_submissions: { type: "number" },
                                        pending: { type: "number" },
                                        average_grade: { type: "number" },
                                        grade_trend: { type: "string" },
                                    },
                                },
                                recent_assignments: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            assignment: {
                                                $ref: "#/components/schemas/Assignment",
                                            },
                                            status: { type: "string" },
                                            grade: { type: "number" },
                                            submitted_date: {
                                                type: "string",
                                                format: "date-time",
                                            },
                                        },
                                    },
                                },
                                alerts: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            type: {
                                                type: "string",
                                                enum: [
                                                    "overdue",
                                                    "due_soon",
                                                    "low_grade",
                                                    "improvement",
                                                ],
                                            },
                                            message: { type: "string" },
                                            assignment_id: { type: "string" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("parent_get_student_performance"),
    AssignmentController.getParentStudentPerformance
);

// ======================= SHARED ROUTES =======================
// Routes that can be accessed by multiple roles with appropriate permissions

app.get(
    "/:assignment_id",
    describeRoute({
        operationId: "getAssignmentById",
        summary: "Get assignment by ID",
        description:
            "Get assignment details by ID. Access level depends on user role.",
        tags: ["Assignments - Shared"],
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment details",
                content: {
                    "application/json": {
                        schema: resolver(assignmentSchema),
                    },
                },
            },
            404: {
                description: "Assignment not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("get_assignment"),
    AssignmentController.getAssignmentById
);

app.put(
    "/:assignment_id",
    describeRoute({
        operationId: "updateAssignment",
        summary: "Update assignment",
        description:
            "Update assignment details. Teacher/Admin only for their assignments.",
        tags: ["Assignments - Shared"],
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateAssignmentResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("update_assignment"),
    zValidator("json", updateAssignmentRequestBodySchema),
    AssignmentController.updateAssignment
);

app.delete(
    "/:assignment_id",
    describeRoute({
        operationId: "deleteAssignment",
        summary: "Delete assignment",
        description:
            "Delete an assignment. Teacher/Admin only for their assignments.",
        tags: ["Assignments - Shared"],
        parameters: [
            {
                name: "assignment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Assignment ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteAssignmentResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("delete_assignment"),
    AssignmentController.deleteAssignment
);

export default app;
