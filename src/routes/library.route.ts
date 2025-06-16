import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { LibraryController } from "@/controllers/library.controller";
import {
    createLibraryIssueRequestBodySchema,
    createLibraryIssueResponseSchema,
    createLibraryRequestBodySchema,
    createLibraryResponseSchema,
    deleteLibraryIssueResponseSchema,
    deleteLibraryResponseSchema,
    getLibrariesResponseSchema,
    getLibraryIssuesResponseSchema,
    libraryIssueSchema,
    librarySchema,
    updateLibraryIssueRequestBodySchema,
    updateLibraryIssueResponseSchema,
    updateLibraryRequestBodySchema,
    updateLibraryResponseSchema,
} from "@/schema/library";

const app = new Hono();

// Library (Book) routes
app.post(
    "/",
    describeRoute({
        operationId: "createLibrary",
        summary: "Create a new book",
        description: "Adds a new book to the library",
        tags: ["Library"],
        responses: {
            200: {
                description: "Book created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createLibraryResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createLibraryRequestBodySchema),
    LibraryController.createLibrary
);

app.get(
    "/",
    describeRoute({
        operationId: "getAllLibraries",
        summary: "Get all books",
        description: "Retrieves all books in the library",
        tags: ["Library"],
        responses: {
            200: {
                description: "List of books",
                content: {
                    "application/json": {
                        schema: resolver(getLibrariesResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    LibraryController.getAllLibraries
);

app.get(
    "/i/:id",
    describeRoute({
        operationId: "getLibraryById",
        summary: "Get book by ID",
        description: "Retrieves a specific book by ID",
        tags: ["Library"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Book ID",
            },
        ],
        responses: {
            200: {
                description: "Book details",
                content: {
                    "application/json": {
                        schema: resolver(librarySchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    LibraryController.getLibraryById
);

app.patch(
    "/:id",
    describeRoute({
        operationId: "updateLibrary",
        summary: "Update a book",
        description: "Updates a specific book by ID",
        tags: ["Library"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Book ID",
            },
        ],
        responses: {
            200: {
                description: "Book updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateLibraryResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateLibraryRequestBodySchema),
    LibraryController.updateLibrary
);

app.delete(
    "/:id",
    describeRoute({
        operationId: "deleteLibrary",
        summary: "Delete a book",
        description: "Deletes a specific book by ID",
        tags: ["Library"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Book ID",
            },
        ],
        responses: {
            200: {
                description: "Book deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteLibraryResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    LibraryController.deleteLibrary
);

// Library Issue routes
app.post(
    "/issue",
    describeRoute({
        operationId: "createLibraryIssue",
        summary: "Issue a book",
        description:
            "Creates a new book issue record when a user borrows a book",
        tags: ["Library"],
        responses: {
            200: {
                description: "Book issued successfully",
                content: {
                    "application/json": {
                        schema: resolver(createLibraryIssueResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createLibraryIssueRequestBodySchema),
    LibraryController.createLibraryIssue
);

app.get(
    "/issue",
    describeRoute({
        operationId: "getAllLibraryIssues",
        summary: "Get all book issues",
        description: "Retrieves all book issue records",
        tags: ["Library"],
        responses: {
            200: {
                description: "List of book issues",
                content: {
                    "application/json": {
                        schema: resolver(getLibraryIssuesResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    LibraryController.getAllLibraryIssues
);

app.get(
    "/issue/:id",
    describeRoute({
        operationId: "getLibraryIssueById",
        summary: "Get book issue by ID",
        description: "Retrieves a specific book issue record by ID",
        tags: ["Library"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Issue ID",
            },
        ],
        responses: {
            200: {
                description: "Book issue details",
                content: {
                    "application/json": {
                        schema: resolver(libraryIssueSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    LibraryController.getLibraryIssueById
);

app.patch(
    "/issue/:id",
    describeRoute({
        operationId: "updateLibraryIssue",
        summary: "Update a book issue",
        description:
            "Updates a specific book issue record by ID (e.g., when returning a book)",
        tags: ["Library"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Issue ID",
            },
        ],
        responses: {
            200: {
                description: "Book issue updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateLibraryIssueResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateLibraryIssueRequestBodySchema),
    LibraryController.updateLibraryIssue
);

app.delete(
    "/issue/:id",
    describeRoute({
        operationId: "deleteLibraryIssue",
        summary: "Delete a book issue",
        description: "Deletes a specific book issue record by ID",
        tags: ["Library"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Issue ID",
            },
        ],
        responses: {
            200: {
                description: "Book issue deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteLibraryIssueResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    LibraryController.deleteLibraryIssue
);

app.get(
    "/issue/user/:user_id",
    describeRoute({
        operationId: "getLibraryIssueByUserId",
        summary: "Get book issues by user ID",
        description: "Retrieves all book issue records for a specific user",
        tags: ["Library"],
        parameters: [
            {
                name: "user_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
            },
        ],
        responses: {
            200: {
                description: "List of user's book issues",
                content: {
                    "application/json": {
                        schema: resolver(getLibraryIssuesResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    LibraryController.getLibraryIssueByUserId
);

app.get(
    "/issue/book/:book_id",
    describeRoute({
        operationId: "getLibraryIssueByBookId",
        summary: "Get book issues by book ID",
        description: "Retrieves all issue records for a specific book",
        tags: ["Library"],
        parameters: [
            {
                name: "book_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Book ID",
            },
        ],
        responses: {
            200: {
                description: "List of book's issue records",
                content: {
                    "application/json": {
                        schema: resolver(getLibraryIssuesResponseSchema),
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
                                data: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    LibraryController.getLibraryIssueByBookId
);

export default app;
