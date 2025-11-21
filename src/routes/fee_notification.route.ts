/**
 * Fee Notification Routes
 * Routes for manual fee notification sending with dynamic filtering
 */

import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { FeeNotificationController } from "@/controllers/fee_notification.controller";
import {
    sendManualFeeNotificationRequestSchema,
    sendManualFeeNotificationResponseSchema,
    getParentsForStudentsRequestSchema,
    getParentsForStudentsResponseSchema,
    getStudentsWithUnpaidFeesResponseSchema,
    errorResponseSchema,
} from "@/schema/fee_notification.schema";
import { checkUserType } from "@/middlewares/role.middleware";

const app = new Hono();

// Apply authentication middleware to all routes
app.use("*", checkUserType(["Admin", "Accountant"]));

// ==================== MANUAL FEE NOTIFICATION ====================

// Send manual fee notification to selected students/parents
app.post(
    "/send",
    describeRoute({
        operationId: "sendManualFeeNotification",
        summary: "Send manual fee notification",
        description:
            "Send fee payment notification to selected students and/or parents. Admin/Accountant only. Can select multiple students and parents at once.",
        tags: ["Fee Notifications"],
        responses: {
            200: {
                description: "Fee notifications sent successfully",
                content: {
                    "application/json": {
                        schema: resolver(sendManualFeeNotificationResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Forbidden - Admin/Accountant access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", sendManualFeeNotificationRequestSchema),
    FeeNotificationController.sendManualFeeNotification
);

// ==================== HELPER ENDPOINTS FOR MANUAL NOTIFICATION ====================

// Get students with unpaid fees (with dynamic filtering)
app.get(
    "/unpaid-fees",
    describeRoute({
        operationId: "getStudentsWithUnpaidFees",
        summary: "Get students with unpaid fees",
        description:
            "Get list of students with unpaid fee installments with dynamic filtering. Admin/Accountant only. Filters: class_id, days_until_due (exact with ±1 day tolerance), or days_until_due_range (min-max).",
        tags: ["Fee Notifications"],
        parameters: [
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
            {
                name: "days_until_due",
                in: "query",
                required: false,
                schema: { type: "number" },
                description: "Filter by exact days until due (±1 day tolerance). E.g., 30 will match 29-31 days.",
            },
            {
                name: "days_until_due_min",
                in: "query",
                required: false,
                schema: { type: "number" },
                description: "Minimum days until due for range filter",
            },
            {
                name: "days_until_due_max",
                in: "query",
                required: false,
                schema: { type: "number" },
                description: "Maximum days until due for range filter",
            },
        ],
        responses: {
            200: {
                description: "Students with unpaid fees retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getStudentsWithUnpaidFeesResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - Invalid filter parameters",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    FeeNotificationController.getStudentsWithUnpaidFees
);



// Get parents for selected students
app.post(
    "/parents",
    describeRoute({
        operationId: "getParentsForStudents",
        summary: "Get parents for students",
        description:
            "Get list of parents for selected students for manual notification. Admin/Accountant only. Useful to automatically include parents when sending notifications.",
        tags: ["Fee Notifications"],
        responses: {
            200: {
                description: "Parents retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getParentsForStudentsResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", getParentsForStudentsRequestSchema),
    FeeNotificationController.getParentsForStudents
);

export default app;
