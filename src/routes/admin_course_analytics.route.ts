import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import { AdminCourseAnalyticsController } from "@/controllers/admin_course_analytics.controller";

const app = new Hono();

/**
 * GET /admin-course-analytics/campus
 * Get comprehensive campus-wide course analytics
 * Admin only
 */
app.get(
    "/campus",
    describeRoute({
        operationId: "getCampusCourseAnalytics",
        summary: "Get campus-wide course analytics",
        description:
            "Retrieve comprehensive analytics for all courses across the campus including enrollments, revenue, performance metrics, and trends (Admin only)",
        tags: ["Admin Course Analytics"],
        responses: {
            200: {
                description: "Campus course analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: {
                                    type: "object",
                                    properties: {
                                        overview: {
                                            type: "object",
                                            description: "High-level overview metrics",
                                        },
                                        courses_breakdown: {
                                            type: "object",
                                            description: "Courses categorized by status, category, difficulty, price",
                                        },
                                        enrollment_analytics: {
                                            type: "object",
                                            description: "Enrollment statistics and trends",
                                        },
                                        performance_metrics: {
                                            type: "object",
                                            description: "Overall performance indicators",
                                        },
                                        revenue_metrics: {
                                            type: "object",
                                            description: "Revenue and monetization data",
                                        },
                                        engagement_metrics: {
                                            type: "object",
                                            description: "Student engagement statistics",
                                        },
                                        top_performing_courses: {
                                            type: "array",
                                            description: "List of best performing courses",
                                            items: { type: "object" },
                                        },
                                        underperforming_courses: {
                                            type: "array",
                                            description: "List of courses needing improvement",
                                            items: { type: "object" },
                                        },
                                        generated_at: {
                                            type: "string",
                                            format: "date-time",
                                        },
                                    },
                                },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
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
    AdminCourseAnalyticsController.getCampusCourseAnalytics
);

/**
 * GET /admin-course-analytics/course/:course_id
 * Get detailed analytics for a specific course
 * Admin/Teacher/Instructor only
 */
app.get(
    "/course/:course_id",
    describeRoute({
        operationId: "getCourseDetailedAnalytics",
        summary: "Get detailed course analytics",
        description:
            "Retrieve comprehensive analytics for a specific course including student metrics, content performance, engagement, and dropout analysis",
        tags: ["Admin Course Analytics"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                description: "The unique identifier of the course",
                required: true,
                schema: {
                    type: "string",
                },
            },
        ],
        responses: {
            200: {
                description: "Course detailed analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: {
                                    type: "object",
                                    description: "Detailed course analytics",
                                },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Bad request - Invalid course ID",
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
            403: {
                description: "Insufficient permissions",
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
    AdminCourseAnalyticsController.getCourseDetailedAnalytics
);

/**
 * GET /admin-course-analytics/instructor/:instructor_id
 * Get instructor performance analytics
 * Admin or self-access only
 */
app.get(
    "/instructor/:instructor_id",
    describeRoute({
        operationId: "getInstructorAnalytics",
        summary: "Get instructor performance analytics",
        description:
            "Retrieve performance analytics for a specific instructor across all their courses (Admin or instructor self-access)",
        tags: ["Admin Course Analytics"],
        parameters: [
            {
                name: "instructor_id",
                in: "path",
                description: "The unique identifier of the instructor",
                required: true,
                schema: {
                    type: "string",
                },
            },
        ],
        responses: {
            200: {
                description: "Instructor analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: {
                                    type: "object",
                                    description: "Instructor performance analytics",
                                },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Bad request - Invalid instructor ID",
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
            403: {
                description: "Insufficient permissions",
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
    AdminCourseAnalyticsController.getInstructorAnalytics
);

/**
 * GET /admin-course-analytics/my-instructor-stats
 * Get my instructor analytics (for logged-in teacher)
 * Teacher only - self access
 */
app.get(
    "/my-instructor-stats",
    describeRoute({
        operationId: "getMyInstructorAnalytics",
        summary: "Get my instructor analytics",
        description: "Retrieve your own instructor performance analytics across all your courses (Teacher only)",
        tags: ["Admin Course Analytics"],
        responses: {
            200: {
                description: "Your instructor analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: {
                                    type: "object",
                                    description: "Your instructor performance analytics",
                                },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            403: {
                description: "Insufficient permissions - Teacher role required",
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
    AdminCourseAnalyticsController.getMyInstructorAnalytics
);

/**
 * GET /admin-course-analytics/enrollment-trends
 * Get enrollment trends and forecasting
 * Admin only
 */
app.get(
    "/enrollment-trends",
    describeRoute({
        operationId: "getEnrollmentTrends",
        summary: "Get enrollment trends and forecasting",
        description:
            "Retrieve enrollment trend analysis with forecasting capabilities (Admin only). Supports week, month, quarter, and year timeframes.",
        tags: ["Admin Course Analytics"],
        parameters: [
            {
                name: "timeframe",
                in: "query",
                description: "Timeframe for trend analysis",
                required: false,
                schema: {
                    type: "string",
                    enum: ["week", "month", "quarter", "year"],
                    default: "month",
                },
            },
        ],
        responses: {
            200: {
                description: "Enrollment trends retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: {
                                    type: "object",
                                    properties: {
                                        timeframe: { type: "string" },
                                        total_enrollments: { type: "number" },
                                        trend_data: { type: "array", items: { type: "object" } },
                                        metrics: { type: "object" },
                                        forecast: { type: "object" },
                                        comparison: { type: "object" },
                                    },
                                },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
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
    AdminCourseAnalyticsController.getEnrollmentTrends
);

/**
 * GET /admin-course-analytics/revenue
 * Get revenue analytics
 * Admin only
 */
app.get(
    "/revenue",
    describeRoute({
        operationId: "getRevenueAnalytics",
        summary: "Get revenue analytics",
        description:
            "Retrieve comprehensive revenue analytics including course-wise revenue, category breakdown, and payment statistics (Admin only)",
        tags: ["Admin Course Analytics"],
        parameters: [
            {
                name: "timeframe",
                in: "query",
                description: "Timeframe for revenue analysis",
                required: false,
                schema: {
                    type: "string",
                    enum: ["month", "quarter", "year"],
                    default: "month",
                },
            },
        ],
        responses: {
            200: {
                description: "Revenue analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: true },
                                data: {
                                    type: "object",
                                    properties: {
                                        timeframe: { type: "string" },
                                        overview: { type: "object" },
                                        revenue_by_course: { type: "array", items: { type: "object" } },
                                        revenue_by_category: { type: "array", items: { type: "object" } },
                                        monthly_trend: { type: "array", items: { type: "object" } },
                                        top_revenue_courses: { type: "array", items: { type: "object" } },
                                        payment_status_breakdown: { type: "object" },
                                    },
                                },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
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
    AdminCourseAnalyticsController.getRevenueAnalytics
);

export default app;
