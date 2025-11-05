import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import { StudentAcademicViewController } from "@/controllers/student_academic_view.controller";

const app = new Hono();

/**
 * GET /student-academic-view/my-view
 * Get comprehensive academic view and analytics for the authenticated student
 */
app.get(
    "/my-view",
    describeRoute({
        operationId: "getMyAcademicView",
        summary: "Get my detailed academic view and analytics",
        description:
            "Retrieve comprehensive academic information including performance, attendance, courses, assignments, quizzes, exams, fees, and leave requests for the authenticated student",
        tags: ["Student Academic View"],
        responses: {
            200: {
                description: "Academic view retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: {
                                    type: "object",
                                    properties: {
                                        student_info: {
                                            type: "object",
                                            description: "Basic student information",
                                        },
                                        academic_performance: {
                                            type: "object",
                                            description: "Performance records across semesters",
                                        },
                                        attendance: {
                                            type: "object",
                                            description: "Attendance statistics and trends",
                                        },
                                        courses: {
                                            type: "object",
                                            description: "Course enrollment and progress",
                                        },
                                        assignments: {
                                            type: "object",
                                            description: "Assignment submission analytics",
                                        },
                                        quizzes: {
                                            type: "object",
                                            description: "Quiz performance metrics",
                                        },
                                        examinations: {
                                            type: "object",
                                            description: "Examination results",
                                        },
                                        fees: {
                                            type: "object",
                                            description: "Fee payment status",
                                        },
                                        leave_requests: {
                                            type: "object",
                                            description: "Leave request history",
                                        },
                                        overall_analytics: {
                                            type: "object",
                                            description:
                                                "Overall analytics including health score, strengths, and recommendations",
                                        },
                                        generated_at: {
                                            type: "string",
                                            format: "date-time",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Bad request - Invalid parameters",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: false },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: false },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    StudentAcademicViewController.getMyAcademicView
);

/**
 * GET /student-academic-view/:student_id
 * Get comprehensive academic view for a specific student (admin/teacher route)
 */
app.get(
    "/:student_id",
    describeRoute({
        operationId: "getStudentAcademicView",
        summary: "Get detailed academic view for a specific student",
        description:
            "Retrieve comprehensive academic information for a specific student (admin/teacher only)",
        tags: ["Student Academic View"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                description: "The unique identifier of the student",
                required: true,
                schema: {
                    type: "string",
                },
            },
        ],
        responses: {
            200: {
                description: "Academic view retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: {
                                    type: "object",
                                    description: "Comprehensive academic data",
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Bad request - Invalid parameters",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: false },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            404: {
                description: "Student not found",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: false },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: false },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    StudentAcademicViewController.getStudentAcademicView
);

export default app;
