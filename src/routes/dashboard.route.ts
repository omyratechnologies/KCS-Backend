import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

import { DashboardController } from "@/controllers/dashboard.controller";
import { 
    studentDashboardResponseSchema,
    teacherDashboardResponseSchema,
    parentDashboardResponseSchema,
    adminDashboardResponseSchema,
    quickStatsResponseSchema,
    recentActivitiesResponseSchema,
    notificationsSummaryResponseSchema,
    upcomingEventsResponseSchema,
    errorResponseSchema
} from "@/schema/dashboard";

const app = new Hono();

// Student Dashboard
app.get(
    "/student",
    describeRoute({
        operationId: "getStudentDashboard",
        summary: "Get student dashboard",
        description: "Retrieves comprehensive dashboard data for a student including profile, classes, assignments, attendance, and notifications",
        tags: ["Dashboard"],
        responses: {
            200: {
                description: "Student dashboard data",
                content: {
                    "application/json": {
                        schema: resolver(studentDashboardResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    DashboardController.getStudentDashboard
);

// Teacher Dashboard
app.get(
    "/teacher",
    describeRoute({
        operationId: "getTeacherDashboard",
        summary: "Get teacher dashboard",
        description: "Retrieves comprehensive dashboard data for a teacher including profile, classes, subjects, assignments, and notifications",
        tags: ["Dashboard"],
        responses: {
            200: {
                description: "Teacher dashboard data",
                content: {
                    "application/json": {
                        schema: resolver(teacherDashboardResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    DashboardController.getTeacherDashboard
);

// Parent Dashboard
app.get(
    "/parent",
    describeRoute({
        operationId: "getParentDashboard",
        summary: "Get parent dashboard",
        description: "Retrieves comprehensive dashboard data for a parent including children's information and notifications",
        tags: ["Dashboard"],
        responses: {
            200: {
                description: "Parent dashboard data",
                content: {
                    "application/json": {
                        schema: resolver(parentDashboardResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    DashboardController.getParentDashboard
);

// Admin Dashboard
app.get(
    "/admin",
    describeRoute({
        operationId: "getAdminDashboard",
        summary: "Get admin dashboard",
        description: "Retrieves comprehensive dashboard data for administrators including campus statistics and notifications",
        tags: ["Dashboard"],
        responses: {
            200: {
                description: "Admin dashboard data",
                content: {
                    "application/json": {
                        schema: resolver(adminDashboardResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    DashboardController.getAdminDashboard
);

// Quick Stats
app.get(
    "/stats",
    describeRoute({
        operationId: "getQuickStats",
        summary: "Get quick statistics",
        description: "Retrieves essential statistics and counts for the current user",
        tags: ["Dashboard"],
        responses: {
            200: {
                description: "Quick statistics",
                content: {
                    "application/json": {
                        schema: resolver(quickStatsResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    DashboardController.getQuickStats
);

// Recent Activities
app.get(
    "/activities",
    describeRoute({
        operationId: "getRecentActivities",
        summary: "Get recent activities",
        description: "Retrieves recent activities relevant to the current user",
        tags: ["Dashboard"],
        parameters: [
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", default: 10 },
                description: "Maximum number of activities to return",
            },
        ],
        responses: {
            200: {
                description: "Recent activities",
                content: {
                    "application/json": {
                        schema: resolver(recentActivitiesResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    DashboardController.getRecentActivities
);

// Notifications Summary
app.get(
    "/notifications",
    describeRoute({
        operationId: "getNotificationsSummary",
        summary: "Get notifications summary",
        description: "Retrieves notifications summary including unread count and recent notifications",
        tags: ["Dashboard"],
        responses: {
            200: {
                description: "Notifications summary",
                content: {
                    "application/json": {
                        schema: resolver(notificationsSummaryResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    DashboardController.getNotificationsSummary
);

// Upcoming Events
app.get(
    "/events",
    describeRoute({
        operationId: "getUpcomingEvents",
        summary: "Get upcoming events",
        description: "Retrieves upcoming events and deadlines for the specified number of days",
        tags: ["Dashboard"],
        parameters: [
            {
                name: "days",
                in: "query",
                required: false,
                schema: { type: "number", default: 7 },
                description: "Number of days to look ahead for events",
            },
        ],
        responses: {
            200: {
                description: "Upcoming events",
                content: {
                    "application/json": {
                        schema: resolver(upcomingEventsResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    DashboardController.getUpcomingEvents
);

export default app;
