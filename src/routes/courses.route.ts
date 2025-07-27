import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { z } from "zod";

import { StudentCoursesController } from "@/controllers/student-courses.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";

const app = new Hono();

// Apply authentication to all routes
app.use("*", authMiddleware());

// ==================== STUDENT COURSES LISTING ENDPOINTS ====================

// Get courses with various filters
app.get(
    "/",
    describeRoute({
        tags: ["Student Courses"],
        operationId: "getStudentCourses",
        summary: "Get courses for student",
        description: "Get courses with various filters (all, available, enrolled, in_progress, completed)",
        parameters: [
            {
                name: "available",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Show only courses available for enrollment",
            },
            {
                name: "enrolled",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Show only enrolled courses",
            },
            {
                name: "in_progress",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Show only courses currently in progress",
            },
            {
                name: "completed",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Show only completed courses",
            },
            {
                name: "category",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by course category",
            },
            {
                name: "search",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Search courses by name, description, or code",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "string", default: "1" },
                description: "Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "string", default: "10" },
                description: "Number of items per page",
            },
        ],
        responses: {
            200: {
                description: "Courses retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "object",
                                    properties: {
                                        courses: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    course_name: { type: "string" },
                                                    course_code: { type: "string" },
                                                    course_description: { type: "string" },
                                                    enrollment_status: {
                                                        type: "string",
                                                        enum: ["not_enrolled", "enrolled", "in_progress", "completed"]
                                                    },
                                                    enrollment_data: { type: "object" },
                                                },
                                            },
                                        },
                                        pagination: {
                                            type: "object",
                                            properties: {
                                                current_page: { type: "number" },
                                                per_page: { type: "number" },
                                                total_items: { type: "number" },
                                                total_pages: { type: "number" },
                                            },
                                        },
                                        filter_applied: { type: "string" },
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
    StudentCoursesController.getStudentCourses
);

// Quick enroll in a course
app.post(
    "/:course_id/enroll",
    describeRoute({
        tags: ["Student Courses"],
        operationId: "quickEnrollInCourse",
        summary: "Quick enroll in a course",
        description: "Quickly enroll the authenticated student in a course with default settings",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID to enroll in",
            },
        ],
        responses: {
            200: {
                description: "Successfully enrolled in course",
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
    roleMiddleware("view_course_content"),
    StudentCoursesController.quickEnrollInCourse
);

export default app;
