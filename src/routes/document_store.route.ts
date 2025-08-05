import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { DocumentStoreController } from "@/controllers/document_store.controller";
import {
    createDocumentStoreRequestBodySchema,
    createDocumentStoreResponseSchema,
    deleteDocumentStoreResponseSchema,
    documentStoreSchema,
    errorResponseSchema,
    getDocumentStoresResponseSchema,
    updateDocumentStoreRequestBodySchema,
    updateDocumentStoreResponseSchema,
} from "@/schema/document-store";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        operationId: "createDocumentStore",
        summary: "Create a new document",
        description: "Creates a new document in the document store",
        tags: ["DocumentStore"],
        responses: {
            200: {
                description: "Document created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createDocumentStoreResponseSchema),
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
    zValidator("json", createDocumentStoreRequestBodySchema),
    DocumentStoreController.createDocumentStore
);

app.get(
    "/",
    describeRoute({
        operationId: "getAllDocumentStore",
        summary: "Get all documents",
        description: "Retrieves all documents in the document store for a campus",
        tags: ["DocumentStore"],
        responses: {
            200: {
                description: "List of documents",
                content: {
                    "application/json": {
                        schema: resolver(getDocumentStoresResponseSchema),
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
    DocumentStoreController.getAllDocumentStore
);

app.get(
    "/u/issued_to",
    describeRoute({
        operationId: "getDocumentStoreByIssuedTo",
        summary: "Get documents by issued to",
        description: "Retrieves all documents issued to the current user",
        tags: ["DocumentStore"],
        responses: {
            200: {
                description: "List of documents issued to user",
                content: {
                    "application/json": {
                        schema: resolver(getDocumentStoresResponseSchema),
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
    DocumentStoreController.getDocumentStoreByIssuedTo
);

app.get(
    "/u/issuer_id",
    describeRoute({
        operationId: "getDocumentStoreByIssuerId",
        summary: "Get documents by issuer",
        description: "Retrieves all documents issued by the current user",
        tags: ["DocumentStore"],
        responses: {
            200: {
                description: "List of documents issued by user",
                content: {
                    "application/json": {
                        schema: resolver(getDocumentStoresResponseSchema),
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
    DocumentStoreController.getDocumentStoreByIssuerId
);

app.get(
    "/:id",
    describeRoute({
        operationId: "getDocumentStoreById",
        summary: "Get document by ID",
        description: "Retrieves a specific document by ID",
        tags: ["DocumentStore"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Document ID",
            },
        ],
        responses: {
            200: {
                description: "Document details",
                content: {
                    "application/json": {
                        schema: resolver(documentStoreSchema),
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
    DocumentStoreController.getDocumentStoreById
);

app.patch(
    "/:id",
    describeRoute({
        operationId: "updateDocumentStore",
        summary: "Update a document",
        description: "Updates a specific document by ID",
        tags: ["DocumentStore"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Document ID",
            },
        ],
        responses: {
            200: {
                description: "Document updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateDocumentStoreResponseSchema),
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
    zValidator("json", updateDocumentStoreRequestBodySchema),
    DocumentStoreController.updateDocumentStore
);

app.delete(
    "/:id",
    describeRoute({
        operationId: "deleteDocumentStore",
        summary: "Delete a document",
        description: "Deletes a specific document by ID",
        tags: ["DocumentStore"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Document ID",
            },
        ],
        responses: {
            200: {
                description: "Document deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteDocumentStoreResponseSchema),
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
    DocumentStoreController.deleteDocumentStore
);

export default app;
