import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { AttendanceController } from "@/controllers/attendance.controller";
import {
    getAttendanceByCampusIdResponseSchema,
    getClassAttendanceReportResponseSchema,
    getStudentAttendanceViewResponseSchema,
    markClassAttendanceRequestBodySchema,
    markClassAttendanceResponseSchema,
    updateAttendanceRequestBodySchema,
    updateAttendanceResponseSchema,
} from "@/schema/attendance";

const app = new Hono();


app.post(
    "/mark-attendance",
    describeRoute({
        tags: ["Attendance"],
        operationId: "markAttendance",
        summary: "Create new attendance records",
        description: "Creates new attendance records for one or multiple users. Supports individual status per user and optional class validation. If class_id is provided, validates student enrollment. Returns error if attendance already exists - use PATCH /patch-attendance to update existing records.",
        responses: {
            200: {
                description: "Attendance marked/updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(markClassAttendanceResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - invalid input data",
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
            400: {
                description: "Bad request - invalid input data",
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


app.get(
    "/campus",
    describeRoute({
        tags: ["Attendance"],
        operationId: "getAttendanceByCampusId",
        summary: "Get attendance by campus ID",
        description: "Retrieves attendance records for a campus within a date range with optional filtering by student IDs and pagination",
        parameters: [
            {
                name: "from_date",
                in: "query",
                required: true,
                schema: { type: "string", format: "date" },
                description: "Start date for attendance records (YYYY-MM-DD)",
            },
            {
                name: "to_date",
                in: "query",
                required: true,
                schema: { type: "string", format: "date" },
                description: "End date for attendance records (YYYY-MM-DD)",
            },
            {
                name: "class_ids",
                in: "query",
                required: false,
                schema: { 
                    type: "array",
                    items: { type: "string" }
                },
                description: "Optional: Filter by specific class IDs (comma-separated)",
            },
            {
                name: "user_ids",
                in: "query",
                required: false,
                schema: { 
                    type: "array",
                    items: { type: "string" }
                },
                description: "Optional: Filter by specific student IDs (comma-separated)",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: { 
                    type: "array",
                    items: { 
                        type: "string",
                        enum: ["present", "absent", "late", "leave"]
                    }
                },
                description: "Optional: Filter by attendance status (comma-separated)",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: {
                    type: "integer",
                    minimum: 1,
                    default: 1,
                },
                description: "Optional: Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: {
                    type: "integer",
                    minimum: 1,
                },
                description: "Optional: Number of records per page",
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
            400: {
                description: "Bad request - invalid parameters",
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
    AttendanceController.getAttendanceByCampusId
);

app.get(
    "/class-attendance/:class_id",
    describeRoute({
        tags: ["Attendance"],
        operationId: "getClassAttendanceReport",
        summary: "Get comprehensive attendance report for a class",
        description:
            "Generate detailed attendance analytics for a specific class including student-wise breakdown, summary statistics, and attendance trends with required date range filtering and optional student filtering with pagination.",
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: {
                    type: "string",
                },
                description: "The class ID to get attendance report for",
            },
            {
                name: "from_date",
                in: "query",
                required: true,
                schema: {
                    type: "string",
                    format: "date",
                },
                description: "Start date for attendance records (YYYY-MM-DD)",
            },
            {
                name: "to_date",
                in: "query",
                required: true,
                schema: {
                    type: "string",
                    format: "date",
                },
                description: "End date for attendance records (YYYY-MM-DD)",
            },
            {
                name: "user_ids",
                in: "query",
                required: false,
                schema: { 
                    type: "array",
                    items: { type: "string" }
                },
                description: "Optional: Filter by specific student IDs (comma-separated)",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: { 
                    type: "array",
                    items: { 
                        type: "string",
                        enum: ["present", "absent", "late", "leave"]
                    }
                },
                description: "Optional: Filter by attendance status (comma-separated)",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: {
                    type: "integer",
                    minimum: 1,
                    default: 1,
                },
                description: "Optional: Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: {
                    type: "integer",
                    minimum: 1,
                },
                description: "Optional: Number of records per page",
            },
        ],
        responses: {
            200: {
                description: "Attendance report generated successfully",
                content: {
                    "application/json": {
                        schema: resolver(getClassAttendanceReportResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - invalid parameters",
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
    AttendanceController.getClassAttendanceReport
);

app.get(
    "/student/:student_id",
    describeRoute({
        tags: ["Attendance"],
        operationId: "getStudentAttendanceView",
        summary: "Get comprehensive attendance view for a student",
        description:
            "Generate detailed attendance view for a specific student including profile information, summary statistics, and detailed attendance history with required date range filtering.",
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID to get attendance view for",
            },
            {
                name: "from_date",
                in: "query",
                required: true,
                schema: { type: "string", format: "date" },
                description: "Start date for attendance records (YYYY-MM-DD)",
            },
            {
                name: "to_date",
                in: "query",
                required: true,
                schema: { type: "string", format: "date" },
                description: "End date for attendance records (YYYY-MM-DD)",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: { 
                    type: "array",
                    items: { 
                        type: "string",
                        enum: ["present", "absent", "late", "leave"]
                    }
                },
                description: "Optional: Filter by attendance status (comma-separated)",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: {
                    type: "integer",
                    minimum: 1,
                    default: 1,
                },
                description: "Optional: Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: {
                    type: "integer",
                    minimum: 1,
                },
                description: "Optional: Number of records per page",
            },
        ],
        responses: {
            200: {
                description: "Student attendance view generated successfully",
                content: {
                    "application/json": {
                        schema: resolver(getStudentAttendanceViewResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - invalid parameters",
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
    AttendanceController.getStudentAttendanceView
);

export default app;