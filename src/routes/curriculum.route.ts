import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { CurriculumController } from "@/controllers/curriculum.controller";
import {
    createCurriculumRequestBodySchema,
    createCurriculumResponseSchema,
    getCurriculumBySubjectResponseSchema,
    getCurriculumsResponseSchema,
    curriculumSchema,
    updateCurriculumRequestBodySchema,
    updateCurriculumResponseSchema,
} from "@/schema/curriculum";

const app = new Hono();

// Create a new curriculum
app.post(
    "/",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "createCurriculum",
        summary: "Create a new curriculum",
        description: "Creates a new curriculum for a subject. Each subject can only have one curriculum.",
        responses: {
            201: {
                description: "Curriculum created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createCurriculumResponseSchema),
                    },
                },
            },
            409: {
                description: "Curriculum already exists for this subject",
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

// Get all curriculums by campus ID
app.get(
    "/",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "getCurriculums",
        summary: "Get all curriculums with optional label filter",
        description: "Retrieves all curriculums for the campus. Optional query parameter 'label_ids' (comma-separated) filters and returns only chapters that match the specified labels.",
        responses: {
            200: {
                description: "Curriculums retrieved successfully",
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

// Get curriculum by ID
app.get(
    "/:id",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "getCurriculumById",
        summary: "Get curriculum by ID",
        description: "Retrieves a specific curriculum by its ID",
        responses: {
            200: {
                description: "Curriculum retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(curriculumSchema),
                    },
                },
            },
            404: {
                description: "Curriculum not found",
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

// Get curriculum by subject ID
app.get(
    "/subject/:subject_id",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "getCurriculumBySubjectId",
        summary: "Get curriculum by subject ID",
        description: "Retrieves the curriculum for a specific subject",
        responses: {
            200: {
                description: "Curriculum retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getCurriculumBySubjectResponseSchema),
                    },
                },
            },
            404: {
                description: "Curriculum not found for this subject",
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
    CurriculumController.getCurriculumBySubjectId
);

// Update curriculum by ID
app.put(
    "/:id",
    describeRoute({
        tags: ["Curriculum"],
        operationId: "updateCurriculum",
        summary: "Update curriculum",
        description: "Updates an existing curriculum. Tracks who updated it via updated_by field.",
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

// Note: No DELETE route - curriculums cannot be deleted, only modified

export default app;
