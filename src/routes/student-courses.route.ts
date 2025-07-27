import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { StudentCoursesController } from "@/controllers/student-courses.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";

const app = new Hono();

// Apply authentication to all routes
app.use("*", authMiddleware());

// ==================== STUDENT COURSE REPORT ENDPOINTS ====================

// Student's own course report
app.get(
    "/student/me",
    describeRoute({
        tags: ["Student Courses"],
        operationId: "getMyStudentCourseReport",
        summary: "Get authenticated student's course report",
        description: "Get comprehensive course report for the authenticated student",
        parameters: [
            {
                name: "course_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by specific course ID",
            },
            {
                name: "include_analytics",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Include watch time analytics",
            },
            {
                name: "include_progress",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Include progress tracking data",
            },
            {
                name: "include_grades",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Include detailed grade information",
            },
        ],
        responses: {
            200: {
                description: "Student course report retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "object",
                                    properties: {
                                        student_id: { type: "string" },
                                        campus_id: { type: "string" },
                                        summary: {
                                            type: "object",
                                            properties: {
                                                total_enrolled: { type: "number" },
                                                in_progress: { type: "number" },
                                                completed: { type: "number" },
                                                average_grade: { type: "number" },
                                                completion_rate: { type: "number" },
                                            },
                                        },
                                        courses: { type: "array", items: { type: "object" } },
                                        analytics: { type: "object" },
                                        overall_progress: { type: "object" },
                                    },
                                },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("view_course_content"),
    StudentCoursesController.getStudentCourseReport
);

// Admin access to any student's course report
app.get(
    "/student/:student_id",
    describeRoute({
        tags: ["Student Courses"],
        operationId: "getStudentCourseReportById",
        summary: "Get specific student's course report (Admin only)",
        description: "Get comprehensive course report for any student (admin access)",
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
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by specific course ID",
            },
            {
                name: "include_analytics",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Include watch time analytics",
            },
            {
                name: "include_progress",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Include progress tracking data",
            },
            {
                name: "include_grades",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Include detailed grade information",
            },
        ],
        responses: {
            200: {
                description: "Student course report retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("get_users"),
    StudentCoursesController.getStudentCourseReport
);

// Student dashboard
app.get(
    "/student/dashboard",
    describeRoute({
        tags: ["Student Courses"],
        operationId: "getStudentDashboard",
        summary: "Get student dashboard summary",
        description: "Get dashboard with overview, recent activity, and progress summary",
        responses: {
            200: {
                description: "Student dashboard retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "object",
                                    properties: {
                                        overview: { type: "object" },
                                        recent_activity: { 
                                            type: "array", 
                                            items: { type: "object" } 
                                        },
                                        upcoming_deadlines: { 
                                            type: "array", 
                                            items: { type: "object" } 
                                        },
                                        progress_summary: { 
                                            type: "array", 
                                            items: { type: "object" } 
                                        },
                                    },
                                },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("student_assignment_dashboard"),
    StudentCoursesController.getStudentDashboard
);

export default app;
