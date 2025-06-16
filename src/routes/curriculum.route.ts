import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { CurriculumController } from "@/controllers/curriculum.controller";
import {
    createCurriculumRequestBodySchema,
    createCurriculumResponseSchema,
    curriculumSchema,
    deleteCurriculumResponseSchema,
    getCurriculumsResponseSchema,
    updateCurriculumRequestBodySchema,
    updateCurriculumResponseSchema,
} from "@/schema/curriculum";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "createCurriculum",
        summary: "Create a new curriculum",
        description: "Creates a new curriculum in the system",
        responses: {
            200: {
                description: "Curriculum created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createCurriculumResponseSchema),
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
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createCurriculumRequestBodySchema),
    CurriculumController.createCurriculum
);

app.get(
    "/",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "getCurriculumsByCampusId",
        summary: "Get all curriculums by campus ID",
        description: "Retrieves all curriculums for a specific campus",
        responses: {
            200: {
                description: "List of curriculums",
                content: {
                    "application/json": {
                        schema: resolver(getCurriculumsResponseSchema),
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
                            },
                        },
                    },
                },
            },
        },
    }),
    CurriculumController.getCurriculumsByCampusId
);

app.get(
    "/:id",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "getCurriculumById",
        summary: "Get curriculum by ID",
        description: "Retrieves a specific curriculum by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Curriculum ID",
            },
        ],
        responses: {
            200: {
                description: "Curriculum details",
                content: {
                    "application/json": {
                        schema: resolver(curriculumSchema),
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
                            },
                        },
                    },
                },
            },
        },
    }),
    CurriculumController.getCurriculumById
);

app.put(
    "/:id",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "updateCurriculumById",
        summary: "Update a curriculum",
        description: "Updates a specific curriculum by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Curriculum ID",
            },
        ],
        responses: {
            200: {
                description: "Curriculum updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateCurriculumResponseSchema),
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
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateCurriculumRequestBodySchema),
    CurriculumController.updateCurriculumById
);

app.delete(
    "/:id",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "deleteCurriculumById",
        summary: "Delete a curriculum",
        description: "Deletes a specific curriculum by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Curriculum ID",
            },
        ],
        responses: {
            200: {
                description: "Curriculum deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteCurriculumResponseSchema),
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
                            },
                        },
                    },
                },
            },
        },
    }),
    CurriculumController.deleteCurriculumById
);

export default app;
