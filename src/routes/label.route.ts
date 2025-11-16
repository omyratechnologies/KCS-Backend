import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { LabelController } from "@/controllers/label.controller";
import {
    createLabelRequestBodySchema,
    createLabelResponseSchema,
    deleteLabelResponseSchema,
    getLabelsResponseSchema,
    labelSchema,
    updateLabelRequestBodySchema,
    updateLabelResponseSchema,
} from "@/schema/label";

const app = new Hono();

// Create a new label
app.post(
    "/",
    describeRoute({
        tags: ["Label"],
        operationId: "createLabel",
        summary: "Create a new label",
        description: "Creates a new label for the campus",
        responses: {
            201: {
                description: "Label created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createLabelResponseSchema),
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
    zValidator("json", createLabelRequestBodySchema),
    LabelController.createLabel
);

// Get all labels by campus ID
app.get(
    "/",
    describeRoute({
        tags: ["Label"],
        operationId: "getLabels",
        summary: "Get all labels",
        description: "Retrieves all labels for the campus",
        responses: {
            200: {
                description: "Labels retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(getLabelsResponseSchema),
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
    LabelController.getLabelsByCampusId
);

// Get label by ID
app.get(
    "/:id",
    describeRoute({
        tags: ["Label"],
        operationId: "getLabelById",
        summary: "Get label by ID",
        description: "Retrieves a specific label by its ID",
        responses: {
            200: {
                description: "Label retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(labelSchema),
                    },
                },
            },
            404: {
                description: "Label not found",
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
    LabelController.getLabelById
);

// Update label by ID
app.put(
    "/:id",
    describeRoute({
        tags: ["Label"],
        operationId: "updateLabel",
        summary: "Update label",
        description: "Updates an existing label",
        responses: {
            200: {
                description: "Label updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateLabelResponseSchema),
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
    zValidator("json", updateLabelRequestBodySchema),
    LabelController.updateLabelById
);

// Delete label by ID
app.delete(
    "/:id",
    describeRoute({
        tags: ["Label"],
        operationId: "deleteLabel",
        summary: "Delete label",
        description: "Deletes a label permanently",
        responses: {
            200: {
                description: "Label deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteLabelResponseSchema),
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
    LabelController.deleteLabelById
);

export default app;
