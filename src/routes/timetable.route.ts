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
        description:
            "Retrieves all timetable entries for a specific class in a campus",
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

export default app;
