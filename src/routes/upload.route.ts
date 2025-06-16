import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

import { UploadController } from "@/controllers/upload.controller";
import {
    createUploadResponseSchema,
    errorResponseSchema,
    getUploadsResponseSchema,
    uploadSchema,
} from "@/schema/upload";

const app = new Hono();

app.get(
    "/user",
    describeRoute({
        operationId: "getUploads",
        summary: "Get uploads by user",
        description: "Retrieves all uploads for the current user",
        tags: ["Upload"],
        responses: {
            200: {
                description: "List of uploads",
                content: {
                    "application/json": {
                        schema: resolver(getUploadsResponseSchema),
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
    UploadController.getUploads
);

app.put(
    "/",
    describeRoute({
        operationId: "createUpload",
        summary: "Upload a file",
        description: "Uploads a new file to the system",
        tags: ["Upload"],
        requestBody: {
            content: {
                "multipart/form-data": {
                    schema: {
                        type: "object",
                        properties: {
                            file: {
                                type: "string",
                                format: "binary",
                                description: "File to upload",
                            },
                        },
                        required: ["file"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "File uploaded successfully",
                content: {
                    "application/json": {
                        schema: resolver(createUploadResponseSchema),
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
    UploadController.createUpload
);

app.get(
    "/i/:upload_id",
    describeRoute({
        operationId: "getUpload",
        summary: "Get upload by ID",
        description: "Retrieves a specific upload by ID",
        tags: ["Upload"],
        parameters: [
            {
                name: "upload_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Upload ID",
            },
        ],
        responses: {
            200: {
                description: "Upload details",
                content: {
                    "application/json": {
                        schema: resolver(uploadSchema),
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
    UploadController.getUpload
);

app.get(
    "/campus",
    describeRoute({
        operationId: "getUploadByCampus",
        summary: "Get uploads by campus",
        description: "Retrieves all uploads for the current campus",
        tags: ["Upload"],
        responses: {
            200: {
                description: "List of uploads",
                content: {
                    "application/json": {
                        schema: resolver(getUploadsResponseSchema),
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
    UploadController.getUploadByCampus
);

export default app;
