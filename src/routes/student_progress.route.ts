import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";

import { StudentProgressController } from "@/controllers/student_progress.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    studentProgressResponseSchema,
    courseProgressResponseSchema,
    assignmentProgressSchema,
    academicSummaryResponseSchema,
    progressErrorResponseSchema,
} from "@/schema/student_progress";

const app = new Hono();

// Apply authentication middleware to all routes
app.use("*", authMiddleware());

// ======================= STUDENT PROGRESS ROUTES =======================

// Get comprehensive student progress (own progress or by student_id for authorized users)
app.get(
    "/",
    describeRoute({
        operationId: "getStudentProgress",
        summary: "Get comprehensive student progress",
        description: "Get comprehensive progress information for the authenticated student including courses, assignments, and performance metrics.",
        tags: ["Student Progress"],
        responses: {
            200: {
                description: "Student progress retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentProgressResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_student_progress"),
    StudentProgressController.getStudentProgress
);

// Get progress for a specific student (for admins, teachers, parents)
app.get(
    "/:student_id",
    describeRoute({
        operationId: "getSpecificStudentProgress",
        summary: "Get specific student's progress",
        description: "Get comprehensive progress information for a specific student. Available to admins, teachers, and authorized users.",
        tags: ["Student Progress"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
        ],
        responses: {
            200: {
                description: "Student progress retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentProgressResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            404: {
                description: "Student not found",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_student_progress"),
    StudentProgressController.getStudentProgress
);

// Get detailed course progress for the authenticated student
app.get(
    "/courses/:course_id",
    describeRoute({
        operationId: "getStudentCourseProgress",
        summary: "Get detailed course progress",
        description: "Get detailed progress information for a specific course for the authenticated student.",
        tags: ["Student Progress"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Course progress retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseProgressResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            404: {
                description: "Course not found or not enrolled",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_course_progress"),
    StudentProgressController.getCourseProgress
);

// Get detailed course progress for a specific student (for authorized users)
app.get(
    "/:student_id/courses/:course_id",
    describeRoute({
        operationId: "getSpecificStudentCourseProgress",
        summary: "Get specific student's course progress",
        description: "Get detailed course progress information for a specific student. Available to admins, teachers, and authorized users.",
        tags: ["Student Progress"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Course progress retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseProgressResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            404: {
                description: "Student or course not found",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_student_progress"),
    StudentProgressController.getCourseProgress
);

// Get assignment progress for the authenticated student
app.get(
    "/assignments",
    describeRoute({
        operationId: "getStudentAssignmentProgress",
        summary: "Get assignment progress",
        description: "Get assignment progress summary for the authenticated student.",
        tags: ["Student Progress"],
        responses: {
            200: {
                description: "Assignment progress retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(z.object({
                            success: z.boolean(),
                            data: assignmentProgressSchema,
                            message: z.string(),
                        })),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_assignment_progress"),
    StudentProgressController.getAssignmentProgress
);

// Get assignment progress for a specific student (for authorized users)
app.get(
    "/:student_id/assignments",
    describeRoute({
        operationId: "getSpecificStudentAssignmentProgress",
        summary: "Get specific student's assignment progress",
        description: "Get assignment progress summary for a specific student. Available to admins, teachers, and authorized users.",
        tags: ["Student Progress"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
        ],
        responses: {
            200: {
                description: "Assignment progress retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(z.object({
                            success: z.boolean(),
                            data: assignmentProgressSchema,
                            message: z.string(),
                        })),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            404: {
                description: "Student not found",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_student_progress"),
    StudentProgressController.getAssignmentProgress
);

// Get academic summary for the authenticated student
app.get(
    "/summary",
    describeRoute({
        operationId: "getStudentAcademicSummary",
        summary: "Get academic summary",
        description: "Get overall academic performance summary for the authenticated student.",
        tags: ["Student Progress"],
        responses: {
            200: {
                description: "Academic summary retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(academicSummaryResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_academic_summary"),
    StudentProgressController.getAcademicSummary
);

// Get academic summary for a specific student (for authorized users)
app.get(
    "/:student_id/summary",
    describeRoute({
        operationId: "getSpecificStudentAcademicSummary",
        summary: "Get specific student's academic summary",
        description: "Get overall academic performance summary for a specific student. Available to admins, teachers, and authorized users.",
        tags: ["Student Progress"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
        ],
        responses: {
            200: {
                description: "Academic summary retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(academicSummaryResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            404: {
                description: "Student not found",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(progressErrorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_student_progress"),
    StudentProgressController.getAcademicSummary
);

export default app;