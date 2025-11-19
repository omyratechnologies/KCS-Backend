import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { TimetableController } from "@/controllers/timetable.controller";
import {
    createTimetableBulkRequestBodySchema,
    createTimetableBulkResponseSchema,
    errorResponseSchema,
    getTimetablesResponseSchema,
    updateTimetableRequestBodySchema,
    updateTimetableResponseSchema,
} from "@/schema/timetable";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        operationId: "createTimetableBulk",
        summary: "Create timetable entries in bulk",
        description: "Creates multiple timetable entries for a class",
        tags: ["Timetable"],
        responses: {
            200: {
                description: "Timetable entries created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createTimetableBulkResponseSchema),
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
        },
    }),
    zValidator("json", createTimetableBulkRequestBodySchema),
    TimetableController.createTimetableBulk
);

app.get(
    "/:class_id",
    describeRoute({
        operationId: "getTimetableByCampusAndClass",
        summary: "Get timetable by class ID",
        description: "Retrieves all timetable entries for a specific class in a campus",
        tags: ["Timetable"],
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
                description: "List of timetable entries",
                content: {
                    "application/json": {
                        schema: resolver(getTimetablesResponseSchema),
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
        },
    }),
    TimetableController.getTimetableByCampusAndClass
);

app.get(
    "/teacher/:teacher_id",
    describeRoute({
        operationId: "getTimetableByCampusAndTeacher",
        summary: "Get timetable by teacher ID",
        description: "Retrieves all timetable entries for a specific teacher in a campus",
        tags: ["Timetable"],
        parameters: [
            {
                name: "teacher_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Teacher ID",
            },
        ],
        responses: {
            200: {
                description: "List of timetable entries for the teacher",
                content: {
                    "application/json": {
                        schema: resolver(getTimetablesResponseSchema),
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
        },
    }),
    TimetableController.getTimetableByCampusAndTeacher
);

app.put(
    "/:id",
    describeRoute({
        operationId: "updateTimetableById",
        summary: "Update a timetable entry",
        description: "Updates a specific timetable entry by ID",
        tags: ["Timetable"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Timetable entry ID",
            },
        ],
        responses: {
            200: {
                description: "Timetable entry updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateTimetableResponseSchema),
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
        },
    }),
    zValidator("json", updateTimetableRequestBodySchema),
    TimetableController.updateTimetableById
);

app.delete(
    "/:id",
    describeRoute({
        operationId: "deleteTimetableById",
        summary: "Delete a timetable entry",
        description: "Soft deletes a specific timetable entry by ID",
        tags: ["Timetable"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Timetable entry ID",
            },
        ],
        responses: {
            200: {
                description: "Timetable entry deleted successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                data: { type: "object" },
                            },
                        },
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
        },
    }),
    TimetableController.deleteTimetableById
);

export default app;
