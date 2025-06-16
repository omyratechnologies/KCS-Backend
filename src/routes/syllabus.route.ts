import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { SyllabusController } from "@/controllers/syllabus.controller";
import {
    createSyllabusRequestBodySchema,
    createSyllabusResponseSchema,
    errorResponseSchema,
    getSyllabusesResponseSchema,
    syllabusSchema,
    updateSyllabusRequestBodySchema,
    updateSyllabusResponseSchema,
} from "@/schema/syllabus";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        operationId: "createSyllabus",
        summary: "Create a syllabus",
        description: "Creates a new syllabus for a subject",
        tags: ["Syllabus"],
        responses: {
            200: {
                description: "Syllabus created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createSyllabusResponseSchema),
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
    zValidator("json", createSyllabusRequestBodySchema),
    SyllabusController.createSyllabus
);

app.get(
    "/",
    describeRoute({
        operationId: "getAllSyllabuses",
        summary: "Get all syllabuses",
        description: "Retrieves all syllabuses for the current campus",
        tags: ["Syllabus"],
        responses: {
            200: {
                description: "List of syllabuses",
                content: {
                    "application/json": {
                        schema: resolver(getSyllabusesResponseSchema),
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
    SyllabusController.getAllSyllabuses
);

app.get(
    "/:id",
    describeRoute({
        operationId: "getSyllabusById",
        summary: "Get syllabus by ID",
        description: "Retrieves a specific syllabus by ID",
        tags: ["Syllabus"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Syllabus ID",
            },
        ],
        responses: {
            200: {
                description: "Syllabus details",
                content: {
                    "application/json": {
                        schema: resolver(syllabusSchema),
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
    SyllabusController.getSyllabusById
);

app.put(
    "/:id",
    describeRoute({
        operationId: "updateSyllabusById",
        summary: "Update syllabus",
        description: "Updates a specific syllabus by ID",
        tags: ["Syllabus"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Syllabus ID",
            },
        ],
        responses: {
            200: {
                description: "Syllabus updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateSyllabusResponseSchema),
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
    zValidator("json", updateSyllabusRequestBodySchema),
    SyllabusController.updateSyllabusById
);

app.delete(
    "/:id",
    describeRoute({
        operationId: "deleteSyllabusById",
        summary: "Delete syllabus",
        description: "Deletes a specific syllabus by ID (soft delete)",
        tags: ["Syllabus"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Syllabus ID",
            },
        ],
        responses: {
            200: {
                description: "Syllabus deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(syllabusSchema),
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
    SyllabusController.deleteSyllabusById
);

export default app;
