import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { ExamTimetableController } from "@/controllers/exam_timetable.controller";
import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    checkScheduleConflictsRequestBodySchema,
    checkScheduleConflictsResponseSchema,
    createExamTimetableRequestBodySchema,
    createExamTimetableResponseSchema,
    errorResponseSchema,
    getExamTimetableResponseSchema,
    getExamTimetablesResponseSchema,
    publishExamTimetableResponseSchema,
    updateExamTimetableRequestBodySchema,
    updateExamTimetableResponseSchema,
} from "@/schema/exam_timetable";

const app = new Hono();

// Create exam timetable (Admin only)
app.post(
    "/",
    describeRoute({
        operationId: "createExamTimetable",
        summary: "Create a new exam timetable",
        description: "Creates a new exam timetable for specified classes and exam term (Admin only)",
        tags: ["Exam Timetable"],
        responses: {
            200: {
                description: "Exam timetable created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createExamTimetableResponseSchema),
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
    roleMiddleware("create_assignment"),
    zValidator("json", createExamTimetableRequestBodySchema),
    ExamTimetableController.createExamTimetable
);

// Get all exam timetables (Admin only)
app.get(
    "/",
    describeRoute({
        operationId: "getExamTimetables",
        summary: "Get all exam timetables",
        description: "Retrieves all exam timetables for the campus (Admin only)",
        tags: ["Exam Timetable"],
        responses: {
            200: {
                description: "List of exam timetables",
                content: {
                    "application/json": {
                        schema: resolver(getExamTimetablesResponseSchema),
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
    roleMiddleware("get_assignment"),
    ExamTimetableController.getExamTimetables
);

// Get published exam timetables (Public access for students/parents)
app.get(
    "/published",
    describeRoute({
        operationId: "getPublishedExamTimetables",
        summary: "Get published exam timetables",
        description: "Retrieves all published exam timetables for students and parents",
        tags: ["Exam Timetable"],
        responses: {
            200: {
                description: "List of published exam timetables",
                content: {
                    "application/json": {
                        schema: resolver(getExamTimetablesResponseSchema),
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
    ExamTimetableController.getPublishedExamTimetables
);

// Get exam timetable by ID (Admin only)
app.get(
    "/:id",
    describeRoute({
        operationId: "getExamTimetableById",
        summary: "Get exam timetable by ID",
        description: "Retrieves a specific exam timetable by ID (Admin only)",
        tags: ["Exam Timetable"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Timetable ID",
            },
        ],
        responses: {
            200: {
                description: "Exam timetable details",
                content: {
                    "application/json": {
                        schema: resolver(getExamTimetableResponseSchema),
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
    roleMiddleware("get_assignment"),
    ExamTimetableController.getExamTimetableById
);

// Update exam timetable (Admin only)
app.patch(
    "/:id",
    describeRoute({
        operationId: "updateExamTimetable",
        summary: "Update an exam timetable",
        description: "Updates a specific exam timetable by ID (Admin only)",
        tags: ["Exam Timetable"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Timetable ID",
            },
        ],
        responses: {
            200: {
                description: "Exam timetable updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateExamTimetableResponseSchema),
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
    roleMiddleware("update_assignment"),
    zValidator("json", updateExamTimetableRequestBodySchema),
    ExamTimetableController.updateExamTimetable
);

// Delete exam timetable (Admin only)
app.delete(
    "/:id",
    describeRoute({
        operationId: "deleteExamTimetable",
        summary: "Delete an exam timetable",
        description: "Deletes a specific exam timetable by ID (Admin only)",
        tags: ["Exam Timetable"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Timetable ID",
            },
        ],
        responses: {
            200: {
                description: "Exam timetable deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(getExamTimetableResponseSchema),
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
    roleMiddleware("delete_assignment"),
    ExamTimetableController.deleteExamTimetable
);

// Publish exam timetable (Admin only)
app.post(
    "/:id/publish",
    describeRoute({
        operationId: "publishExamTimetable",
        summary: "Publish an exam timetable",
        description: "Publishes a specific exam timetable to make it visible to students and parents (Admin only)",
        tags: ["Exam Timetable"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Timetable ID",
            },
        ],
        responses: {
            200: {
                description: "Exam timetable published successfully",
                content: {
                    "application/json": {
                        schema: resolver(publishExamTimetableResponseSchema),
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
    roleMiddleware("update_assignment"),
    ExamTimetableController.publishExamTimetable
);

// Unpublish exam timetable (Admin only)
app.post(
    "/:id/unpublish",
    describeRoute({
        operationId: "unpublishExamTimetable",
        summary: "Unpublish an exam timetable",
        description: "Unpublishes a specific exam timetable to hide it from students and parents (Admin only)",
        tags: ["Exam Timetable"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Timetable ID",
            },
        ],
        responses: {
            200: {
                description: "Exam timetable unpublished successfully",
                content: {
                    "application/json": {
                        schema: resolver(publishExamTimetableResponseSchema),
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
    roleMiddleware("update_assignment"),
    ExamTimetableController.unpublishExamTimetable
);

// Get exam timetables by exam term (Admin only)
app.get(
    "/exam-term/:exam_term_id",
    describeRoute({
        operationId: "getExamTimetablesByExamTerm",
        summary: "Get exam timetables by exam term ID",
        description: "Retrieves all exam timetables for a specific exam term (Admin only)",
        tags: ["Exam Timetable"],
        parameters: [
            {
                name: "exam_term_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Term ID",
            },
        ],
        responses: {
            200: {
                description: "List of exam timetables for the exam term",
                content: {
                    "application/json": {
                        schema: resolver(getExamTimetablesResponseSchema),
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
    roleMiddleware("get_assignment"),
    ExamTimetableController.getExamTimetablesByExamTerm
);

// Get exam timetables by class (Public access for students/parents)
app.get(
    "/class/:class_id",
    describeRoute({
        operationId: "getExamTimetableByClass",
        summary: "Get exam timetables by class ID",
        description: "Retrieves all published exam timetables for a specific class",
        tags: ["Exam Timetable"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "List of exam timetables for the class",
                content: {
                    "application/json": {
                        schema: resolver(getExamTimetablesResponseSchema),
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
    ExamTimetableController.getExamTimetableByClass
);

// Check schedule conflicts (Admin only)
app.post(
    "/check-conflicts",
    describeRoute({
        operationId: "checkScheduleConflicts",
        summary: "Check for schedule conflicts",
        description: "Checks if a proposed exam schedule conflicts with existing schedules (Admin only)",
        tags: ["Exam Timetable"],
        responses: {
            200: {
                description: "Schedule conflict check results",
                content: {
                    "application/json": {
                        schema: resolver(checkScheduleConflictsResponseSchema),
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
    roleMiddleware("get_assignment"),
    zValidator("json", checkScheduleConflictsRequestBodySchema),
    ExamTimetableController.checkScheduleConflicts
);

export default app;
