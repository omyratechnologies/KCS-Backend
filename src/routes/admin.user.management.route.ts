import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

import { AdminUserManagementController } from "@/controllers/admin.user.management.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
// Import admin user management schemas
import {
    adminUserManagementResponseSchema,
    downloadStudentsResponseSchema,
    downloadTeachersResponseSchema,
    downloadAttendanceResponseSchema,
    errorResponseSchema,
} from "../schema/admin.user.management";

const app = new Hono();

// Apply authentication middleware to all routes
app.use("*", authMiddleware());

// ======================= ADMIN USER MANAGEMENT ROUTES =======================

app.get(
    "/users",
    describeRoute({
        operationId: "getAdminUserManagement",
        summary: "Get users for admin management",
        description: "Get paginated users list with filtering by date range and user type. Admin only.",
        tags: ["Admin - User Management"],
        parameters: [
            {
                name: "start_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter users from date (YYYY-MM-DD)",
            },
            {
                name: "end_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter users to date (YYYY-MM-DD)",
            },
            {
                name: "user_type",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["all", "Student", "Teacher", "Admin", "Staff", "Principal", "Parent"],
                },
                description: "Filter by user type",
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
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
        ],
        responses: {
            200: {
                description: "Users retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(adminUserManagementResponseSchema),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
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
    roleMiddleware("admin_user_management"),
    AdminUserManagementController.getUsersForAdmin
);

// ======================= DOWNLOAD ROUTES =======================

app.get(
    "/download/students",
    describeRoute({
        operationId: "downloadStudentsData",
        summary: "Download students data",
        description: "Download students data in CSV-ready format with optional date filtering. Admin only.",
        tags: ["Admin - Downloads"],
        parameters: [
            {
                name: "start_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter students from registration date (YYYY-MM-DD)",
            },
            {
                name: "end_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter students to registration date (YYYY-MM-DD)",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
        ],
        responses: {
            200: {
                description: "Students data retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(downloadStudentsResponseSchema),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
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
    roleMiddleware("admin_download_students"),
    AdminUserManagementController.downloadStudents
);

app.get(
    "/download/teachers",
    describeRoute({
        operationId: "downloadTeachersData",
        summary: "Download teachers data",
        description: "Download teachers data in CSV-ready format with optional date filtering. Admin only.",
        tags: ["Admin - Downloads"],
        parameters: [
            {
                name: "start_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter teachers from joining date (YYYY-MM-DD)",
            },
            {
                name: "end_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter teachers to joining date (YYYY-MM-DD)",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
        ],
        responses: {
            200: {
                description: "Teachers data retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(downloadTeachersResponseSchema),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
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
    roleMiddleware("admin_download_teachers"),
    AdminUserManagementController.downloadTeachers
);

app.get(
    "/download/attendance",
    describeRoute({
        operationId: "downloadAttendanceData",
        summary: "Download attendance data",
        description: "Download attendance data in CSV-ready format with filtering options. Admin only.",
        tags: ["Admin - Downloads"],
        parameters: [
            {
                name: "start_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter attendance from date (YYYY-MM-DD)",
            },
            {
                name: "end_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter attendance to date (YYYY-MM-DD)",
            },
            {
                name: "user_type",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["all", "Student", "Teacher"],
                },
                description: "Filter by user type",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
        ],
        responses: {
            200: {
                description: "Attendance data retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(downloadAttendanceResponseSchema),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
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
    roleMiddleware("admin_download_attendance"),
    AdminUserManagementController.downloadAttendance
);

export default app;