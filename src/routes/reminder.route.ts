import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { ReminderController } from "@/controllers/reminder.controller";
import {
    createReminderRequestSchema,
    createReminderResponseSchema,
    getReminderResponseSchema,
    getRemindersResponseSchema,
    updateReminderRequestSchema,
    updateReminderResponseSchema,
    deleteReminderResponseSchema,
    getReminderStatsResponseSchema,
    processRemindersResponseSchema,
    cleanupRemindersResponseSchema,
    errorResponseSchema,
} from "@/schema/reminder";
import { authMiddleware } from "@/middlewares/auth.middleware";

const app = new Hono();

// Apply authentication middleware to all routes
app.use("*", authMiddleware());

// Create a new reminder
app.post(
    "/",
    describeRoute({
        operationId: "createReminder",
        summary: "Create a new reminder",
        description: "Create a personal reminder with push notifications",
        tags: ["Reminders"],
        responses: {
            201: {
                description: "Reminder created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createReminderResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - Invalid input",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createReminderRequestSchema),
    ReminderController.createReminder
);

// Get all user's reminders
app.get(
    "/",
    describeRoute({
        operationId: "getUserReminders",
        summary: "Get all user's reminders",
        description: "Retrieve all reminders for the authenticated user with optional filters",
        tags: ["Reminders"],
        parameters: [
            {
                name: "is_active",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Filter by active status (true/false)",
            },
            {
                name: "frequency",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["one_time", "daily", "weekly"] },
                description: "Filter by reminder frequency",
            },
            {
                name: "from_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter reminders from this date (YYYY-MM-DD)",
            },
            {
                name: "to_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter reminders up to this date (YYYY-MM-DD)",
            },
        ],
        responses: {
            200: {
                description: "Reminders retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getRemindersResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ReminderController.getUserReminders
);

// Get reminder statistics
app.get(
    "/stats",
    describeRoute({
        operationId: "getReminderStats",
        summary: "Get reminder statistics",
        description: "Get statistics about user's reminders (total, active, pending, by frequency)",
        tags: ["Reminders"],
        responses: {
            200: {
                description: "Statistics retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getReminderStatsResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ReminderController.getReminderStats
);

// Get a specific reminder
app.get(
    "/:id",
    describeRoute({
        operationId: "getReminder",
        summary: "Get a specific reminder",
        description: "Retrieve a reminder by ID",
        tags: ["Reminders"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Reminder ID",
            },
        ],
        responses: {
            200: {
                description: "Reminder retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getReminderResponseSchema),
                    },
                },
            },
            404: {
                description: "Reminder not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ReminderController.getReminder
);

// Update a reminder
app.put(
    "/:id",
    describeRoute({
        operationId: "updateReminder",
        summary: "Update a reminder",
        description: "Update an existing reminder",
        tags: ["Reminders"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Reminder ID",
            },
        ],
        responses: {
            200: {
                description: "Reminder updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateReminderResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request - Invalid input",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            404: {
                description: "Reminder not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", updateReminderRequestSchema),
    ReminderController.updateReminder
);

// Delete a reminder
app.delete(
    "/:id",
    describeRoute({
        operationId: "deleteReminder",
        summary: "Delete a reminder",
        description: "Delete (deactivate) a reminder",
        tags: ["Reminders"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Reminder ID",
            },
        ],
        responses: {
            200: {
                description: "Reminder deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteReminderResponseSchema),
                    },
                },
            },
            404: {
                description: "Reminder not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ReminderController.deleteReminder
);

// Process pending reminders (Admin only)
app.post(
    "/admin/process",
    describeRoute({
        operationId: "processPendingReminders",
        summary: "Process pending reminders",
        description: "Manually trigger processing of pending reminders (Admin only)",
        tags: ["Reminders - Admin"],
        responses: {
            200: {
                description: "Reminders processed successfully",
                content: {
                    "application/json": {
                        schema: resolver(processRemindersResponseSchema),
                    },
                },
            },
            403: {
                description: "Forbidden - Admin access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ReminderController.processPendingReminders
);

// Cleanup old reminders (Admin only)
app.post(
    "/admin/cleanup",
    describeRoute({
        operationId: "cleanupOldReminders",
        summary: "Cleanup old reminders",
        description: "Clean up old completed reminders (Admin only)",
        tags: ["Reminders - Admin"],
        parameters: [
            {
                name: "older_than_days",
                in: "query",
                required: false,
                schema: { type: "number", default: 30 },
                description: "Remove reminders older than this many days (default: 30)",
            },
        ],
        responses: {
            200: {
                description: "Old reminders cleaned up successfully",
                content: {
                    "application/json": {
                        schema: resolver(cleanupRemindersResponseSchema),
                    },
                },
            },
            403: {
                description: "Forbidden - Admin access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ReminderController.cleanupOldReminders
);

export default app;
