import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { LeaveController } from "@/controllers/leave.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    createLeaveRequestSchema,
    createLeaveTypeSchema,
    getLeaveRequestsResponseSchema,
    getLeaveTypesResponseSchema,
    getLeaveBalancesResponseSchema,
    leaveAnalyticsResponseSchema,
    rejectLeaveRequestSchema,
    bulkApproveRequestSchema,
    successResponseSchema,
    errorResponseSchema,
} from "@/schema/leave";

const app = new Hono();

// Apply authentication middleware to all routes
app.use("*", authMiddleware());

// ======================= INITIALIZATION ROUTES =======================

app.post(
    "/admin/initialize",
    describeRoute({
        operationId: "initializeLeaveSystem",
        summary: "Initialize leave system",
        description: "Initialize default leave types for a campus. Admin only.",
        tags: ["Leave - Admin"],
        responses: {
            200: {
                description: "Leave system initialized successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("create_users"), // Using existing admin permission
    LeaveController.initializeLeaveSystem
);

app.post(
    "/admin/initialize-user-balances",
    describeRoute({
        operationId: "initializeUserBalances",
        summary: "Initialize user leave balances",
        description: "Initialize leave balances for a specific user. Admin only.",
        tags: ["Leave - Admin"],
        parameters: [
            {
                name: "user_id",
                in: "query",
                required: true,
                schema: { type: "string" },
                description: "User ID to initialize balances for",
            },
            {
                name: "user_type",
                in: "query",
                required: true,
                schema: { type: "string", enum: ["Student", "Teacher"] },
                description: "User type",
            },
        ],
        responses: {
            200: {
                description: "User leave balances initialized successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("create_users"), // Using existing admin permission
    LeaveController.initializeUserBalances
);

app.get(
    "/test",
    describeRoute({
        operationId: "testLeaveSystem",
        summary: "Test leave system",
        description: "Test endpoint to verify leave system functionality.",
        tags: ["Leave - Test"],
        responses: {
            200: {
                description: "Leave system test results",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    LeaveController.testLeaveSystem
);

// ======================= ADMIN ROUTES =======================

app.get(
    "/admin/requests",
    describeRoute({
        operationId: "getLeaveRequests",
        summary: "Get all leave requests",
        description: "Get all leave requests with filtering options. Admin only.",
        tags: ["Leave - Admin"],
        parameters: [
            {
                name: "user_type",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["Student", "Teacher"],
                },
                description: "Filter by user type",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["Pending", "Approved", "Rejected", "Cancelled", "All Status"],
                },
                description: "Filter by status",
            },
            {
                name: "leave_type",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by leave type ID",
            },
            {
                name: "from_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter from date",
            },
            {
                name: "to_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter to date",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1 },
                description: "Page number",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1, maximum: 100 },
                description: "Items per page",
            },
            {
                name: "search",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Search by name or ID",
            },
        ],
        responses: {
            200: {
                description: "Leave requests retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getLeaveRequestsResponseSchema),
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
    roleMiddleware("get_users"), // Using existing admin permission
    LeaveController.getLeaveRequests
);

app.get(
    "/admin/analytics",
    describeRoute({
        operationId: "getLeaveAnalytics",
        summary: "Get leave analytics",
        description: "Get leave analytics for admin dashboard.",
        tags: ["Leave - Admin"],
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
        ],
        responses: {
            200: {
                description: "Leave analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(leaveAnalyticsResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("get_users"), // Using existing admin permission
    LeaveController.getLeaveAnalytics
);

app.post(
    "/admin/requests/:request_id/approve",
    describeRoute({
        operationId: "approveLeaveRequest",
        summary: "Approve leave request",
        description: "Approve a pending leave request. Admin only.",
        tags: ["Leave - Admin"],
        parameters: [
            {
                name: "request_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Leave request ID",
            },
        ],
        responses: {
            200: {
                description: "Leave request approved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
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
    roleMiddleware("update_users"), // Using existing admin permission
    LeaveController.approveLeaveRequest
);

app.post(
    "/admin/requests/:request_id/reject",
    describeRoute({
        operationId: "rejectLeaveRequest",
        summary: "Reject leave request",
        description: "Reject a pending leave request. Admin only.",
        tags: ["Leave - Admin"],
        parameters: [
            {
                name: "request_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Leave request ID",
            },
        ],
        responses: {
            200: {
                description: "Leave request rejected successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("update_users"), // Using existing admin permission
    zValidator("json", rejectLeaveRequestSchema),
    LeaveController.rejectLeaveRequest
);

app.post(
    "/admin/requests/bulk-approve",
    describeRoute({
        operationId: "bulkApproveLeaveRequests",
        summary: "Bulk approve leave requests",
        description: "Approve multiple leave requests at once. Admin only.",
        tags: ["Leave - Admin"],
        responses: {
            200: {
                description: "Bulk approval completed",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("update_users"), // Using existing admin permission
    zValidator("json", bulkApproveRequestSchema),
    LeaveController.bulkApproveLeaveRequests
);

// ======================= LEAVE TYPE MANAGEMENT =======================

app.post(
    "/admin/types",
    describeRoute({
        operationId: "createLeaveType",
        summary: "Create leave type",
        description: "Create a new leave type. Admin only.",
        tags: ["Leave - Admin"],
        responses: {
            201: {
                description: "Leave type created successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("create_subject"), // Using existing admin permission
    zValidator("json", createLeaveTypeSchema),
    LeaveController.createLeaveType
);

app.get(
    "/types",
    describeRoute({
        operationId: "getLeaveTypes",
        summary: "Get leave types",
        description: "Get all active leave types.",
        tags: ["Leave - General"],
        responses: {
            200: {
                description: "Leave types retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getLeaveTypesResponseSchema),
                    },
                },
            },
        },
    }),
    LeaveController.getLeaveTypes
);

app.put(
    "/admin/types/:leave_type_id",
    describeRoute({
        operationId: "updateLeaveType",
        summary: "Update leave type",
        description: "Update an existing leave type. Admin only.",
        tags: ["Leave - Admin"],
        parameters: [
            {
                name: "leave_type_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Leave type ID",
            },
        ],
        responses: {
            200: {
                description: "Leave type updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("update_subject"), // Using existing admin permission
    LeaveController.updateLeaveType
);

// ======================= STUDENT/TEACHER ROUTES =======================

app.post(
    "/apply",
    describeRoute({
        operationId: "applyForLeave",
        summary: "Apply for leave",
        description: "Submit a new leave request. Students and Teachers only.",
        tags: ["Leave - User"],
        responses: {
            201: {
                description: "Leave request submitted successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("get_user"), // Using existing permission for students/teachers
    zValidator("json", createLeaveRequestSchema),
    LeaveController.applyForLeave
);

app.get(
    "/my-requests",
    describeRoute({
        operationId: "getMyLeaveRequests",
        summary: "Get my leave requests",
        description: "Get current user's leave requests.",
        tags: ["Leave - User"],
        parameters: [
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["Pending", "Approved", "Rejected", "Cancelled"],
                },
                description: "Filter by status",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1 },
                description: "Page number",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", minimum: 1, maximum: 100 },
                description: "Items per page",
            },
        ],
        responses: {
            200: {
                description: "User leave requests retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getLeaveRequestsResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("get_user"), // Using existing permission
    LeaveController.getMyLeaveRequests
);

app.get(
    "/my-balances",
    describeRoute({
        operationId: "getMyLeaveBalances",
        summary: "Get my leave balances",
        description: "Get current user's leave balances for all leave types.",
        tags: ["Leave - User"],
        parameters: [
            {
                name: "year",
                in: "query",
                required: false,
                schema: { type: "number" },
                description: "Year for leave balances (defaults to current year)",
            },
        ],
        responses: {
            200: {
                description: "User leave balances retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getLeaveBalancesResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("get_user"), // Using existing permission
    LeaveController.getMyLeaveBalances
);

app.post(
    "/requests/:request_id/cancel",
    describeRoute({
        operationId: "cancelLeaveRequest",
        summary: "Cancel leave request",
        description: "Cancel a pending leave request.",
        tags: ["Leave - User"],
        parameters: [
            {
                name: "request_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Leave request ID",
            },
        ],
        responses: {
            200: {
                description: "Leave request cancelled successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("get_user"), // Using existing permission
    LeaveController.cancelLeaveRequest
);

// ======================= TEACHER SPECIFIC ROUTES =======================

app.get(
    "/teacher/student-requests",
    describeRoute({
        operationId: "getStudentLeaveRequests",
        summary: "Get student leave requests",
        description: "Get leave requests from students. Teachers only.",
        tags: ["Leave - Teacher"],
        parameters: [
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["Pending", "Approved", "Rejected", "Cancelled"],
                },
                description: "Filter by status",
            },
            {
                name: "search",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Search by student name or ID",
            },
        ],
        responses: {
            200: {
                description: "Student leave requests retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getLeaveRequestsResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("get_users"), // Using existing teacher permission
    LeaveController.getStudentLeaveRequests
);

export default app;
