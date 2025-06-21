import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { AttendanceController } from "@/controllers/attendance.controller";
import {
    getAttendanceByCampusIdResponseSchema,
    getAttendanceByClassIdAndDateRequestBodySchema,
    getAttendanceByClassIdAndDateResponseSchema,
    getAttendanceByUserIdResponseSchema,
    getAttendancesByDateResponseSchema,
    markAttendanceRequestBodySchema,
    markAttendanceResponseSchema,
    markBulkAttendanceRequestBodySchema,
    markClassAttendanceRequestBodySchema,
    markClassAttendanceResponseSchema,
    bulkAttendanceResponseSchema,
    updateAttendanceRequestBodySchema,
    updateAttendanceResponseSchema,
} from "@/schema/attendance";

const app = new Hono();

app.post(
    "/mark-attendance",
    describeRoute({
        tags: ["Attendance"],
        operationId: "markAttendance",
        summary: "Mark attendance (single or bulk)",
        description:
            "Records attendance for one or multiple users. Supports both single user (user_id) and bulk operations (user_ids array).",
        responses: {
            200: {
                description: "Attendance marked successfully",
                content: {
                    "application/json": {
                        schema: resolver(markAttendanceResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                                error: { type: "object" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", markAttendanceRequestBodySchema),
    AttendanceController.markAttendance
);

app.post(
    "/mark-bulk-attendance",
    describeRoute({
        tags: ["Attendance"],
        operationId: "markBulkAttendance",
        summary: "Mark bulk attendance",
        description:
            "Records attendance for multiple users with individual status and user type per user",
        responses: {
            200: {
                description: "Bulk attendance marked successfully",
                content: {
                    "application/json": {
                        schema: resolver(bulkAttendanceResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                                error: { type: "object" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", markBulkAttendanceRequestBodySchema),
    AttendanceController.markBulkAttendance
);

app.post(
    "/mark-class-attendance",
    describeRoute({
        tags: ["Attendance"],
        operationId: "markClassAttendance",
        summary: "Mark class attendance",
        description: "Records attendance for multiple students in a specific class",
        responses: {
            200: {
                description: "Class attendance marked successfully",
                content: {
                    "application/json": {
                        schema: resolver(markClassAttendanceResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", markClassAttendanceRequestBodySchema),
    AttendanceController.markClassAttendance
);

app.get(
    "/campus",
    describeRoute({
        tags: ["Attendance"],
        operationId: "getAttendanceByCampusId",
        summary: "Get attendance by campus ID",
        description:
            "Retrieves attendance records for a campus within a date range",
        parameters: [
            {
                name: "from_date",
                in: "query",
                required: true,
                schema: { type: "string", format: "date" },
                description: "Start date for attendance records",
            },
            {
                name: "to_date",
                in: "query",
                required: true,
                schema: { type: "string", format: "date" },
                description: "End date for attendance records",
            },
        ],
        responses: {
            200: {
                description: "List of attendance records",
                content: {
                    "application/json": {
                        schema: resolver(getAttendanceByCampusIdResponseSchema),
                    },
                },
            },
        },
    }),
    AttendanceController.getAttendanceByCampusId
);

app.get(
    "/class-attendance/:class_id",
    describeRoute({
        tags: ["Attendance"],
        operationId: "getAttendanceByClassId",
        summary: "Get all attendance records for a class",
        description:
            "Retrieves all attendance records for a specific class",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: {
                    type: "string",
                },
                description: "The class ID to get attendance records for",
            },
            {
                name: "date",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    format: "date-time",
                },
                description: "Optional: Filter by specific date (ISO 8601 format)",
            },
        ],
        responses: {
            200: {
                description: "List of attendance records for the class",
                content: {
                    "application/json": {
                        schema: resolver(
                            getAttendanceByClassIdAndDateResponseSchema
                        ),
                    },
                },
            },
            400: {
                description: "Bad request - invalid class ID",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                error: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    AttendanceController.getAttendanceByClassId
);

app.get(
    "/user/:user_id",
    describeRoute({
        tags: ["Attendance"],
        operationId: "getAttendanceByUserId",
        summary: "Get attendance by user ID",
        description: "Retrieves attendance records for a specific user",
        parameters: [
            {
                name: "user_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
            },
        ],
        responses: {
            200: {
                description: "List of attendance records",
                content: {
                    "application/json": {
                        schema: resolver(getAttendanceByUserIdResponseSchema),
                    },
                },
            },
        },
    }),
    AttendanceController.getAttendanceByUserId
);

app.get(
    "/campus/:date",
    describeRoute({
        tags: ["Attendance"],
        operationId: "getAttendancesByDate",
        summary: "Get attendances by date",
        description: "Retrieves attendance records for a specific date",
        parameters: [
            {
                name: "date",
                in: "path",
                required: true,
                schema: { type: "string", format: "date" },
                description: "Date for attendance records",
            },
        ],
        responses: {
            200: {
                description: "List of attendance records",
                content: {
                    "application/json": {
                        schema: resolver(getAttendancesByDateResponseSchema),
                    },
                },
            },
        },
    }),
    AttendanceController.getAttendancesByDate
);

app.patch(
    "/patch-attendance",
    describeRoute({
        tags: ["Attendance"],
        operationId: "updateAttendance",
        summary: "Update attendance",
        description: "Updates an existing attendance record",
        responses: {
            200: {
                description: "Attendance updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateAttendanceResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                                error: { type: "object" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateAttendanceRequestBodySchema),
    AttendanceController.updateAttendance
);

export default app;
