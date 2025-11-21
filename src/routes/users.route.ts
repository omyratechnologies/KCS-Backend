import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { UsersController } from "@/controllers/users.controller";
// import { roleMiddleware } from "@/middlewares/role.middleware";
import { studentParentCreationMiddleware } from "@/middlewares/feature.middleware";
import {
    createUserRequestBodySchema,
    createUserResponseSchema,
    deleteUserResponseSchema,
    getUserResponseSchema,
    updateUserRequestBodySchema,
    updateUserResponseSchema,
    bulkCreateUsersRequestBodySchema,
    bulkCreateUsersResponseSchema,
} from "@/schema/user";

const app = new Hono();

app.post(
    "/bulk",
    studentParentCreationMiddleware(), // Apply middleware only to bulk creation
    describeRoute({
        tags: ["Users"],
        operationId: "bulkCreateUsers",
        summary: "Bulk create users",
        description: "Creates multiple users at once. ONLY supports creating Students, Teachers, and Parents in bulk. Maximum 100 users per request. Other user types (Admin, Principal, Staff) cannot be created in bulk.",
        responses: {
            200: {
                description: "Bulk user creation completed",
                content: {
                    "application/json": {
                        schema: resolver(bulkCreateUsersResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
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
            403: {
                description: "Forbidden",
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
    zValidator("json", bulkCreateUsersRequestBodySchema),
    UsersController.bulkCreateUsers
);

app.post(
    "/",
    studentParentCreationMiddleware(), // Apply middleware only to user creation
    describeRoute({
        tags: ["Users"],
        operationId: "createUser",
        summary: "Create a new user",
        description: "Creates a new user in the system",
        responses: {
            200: {
                description: "User created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createUserResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
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
            401: {
                description: "Unauthorized",
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
    // roleMiddleware("create_users"),
    zValidator("json", createUserRequestBodySchema),
    UsersController.createUsers
);

app.get(
    "/",
    describeRoute({
        tags: ["Users"],
        operationId: "getUsers",
        summary: "Get all users",
        description: "Retrieves all users for the current campus with advanced filtering, pagination, and search capabilities. Supports filtering by user type and type-specific parameters.",
        parameters: [
            {
                name: "user_type",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["Student", "Teacher", "Parent", "Admin", "Principal", "Staff"] },
                description: "Filter by user type",
                example: "Student",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "number", default: 1 },
                description: "Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", default: 20 },
                description: "Number of items per page",
            },
            {
                name: "search",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Search term to filter users by name, email, user_id, phone, or address",
            },
            {
                name: "user_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by user ID",
            },
            {
                name: "email",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by email",
            },
            {
                name: "name",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by name (first or last name)",
            },
            {
                name: "phone",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by phone number",
            },
            {
                name: "is_active",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Filter by active status",
            },
            {
                name: "academic_year",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by academic year (primarily for Students)",
                example: "2024-2025",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID (for Students or Teachers assigned to a class)",
                example: "29562c3d-9ea8-420f-b3dc-b9dc8cab623d",
            },
            {
                name: "from",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter users created from this date (ISO 8601 format: YYYY-MM-DD)",
                example: "2024-01-01",
            },
            {
                name: "to",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter users created up to this date (ISO 8601 format: YYYY-MM-DD)",
                example: "2024-12-31",
            },
            {
                name: "sort_by",
                in: "query",
                required: false,
                schema: { type: "string", default: "created_at" },
                description: "Field to sort by (e.g., created_at, updated_at, first_name, email)",
            },
            {
                name: "sort_order",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
                description: "Sort order (ascending or descending)",
            },
        ],
        responses: {
            200: {
                description: "List of users with pagination",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                    },
                                },
                                pagination: {
                                    type: "object",
                                    properties: {
                                        current_page: { type: "number" },
                                        per_page: { type: "number" },
                                        total_items: { type: "number" },
                                        total_pages: { type: "number" },
                                        has_next: { type: "boolean" },
                                        has_previous: { type: "boolean" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    // roleMiddleware("get_users"),
    UsersController.getUsers
);

app.get(
    "/:id",
    describeRoute({
        tags: ["Users"],
        operationId: "getUser",
        summary: "Get a specific user",
        description: "Retrieves a specific user by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
            },
        ],
        responses: {
            200: {
                description: "User details",
                content: {
                    "application/json": {
                        schema: resolver(getUserResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
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
    // roleMiddleware("get_user"),
    UsersController.getUser
);

app.put(
    "/:id",
    describeRoute({
        tags: ["Users"],
        operationId: "updateUser",
        summary: "Update a user",
        description: "Updates a specific user by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
            },
        ],
        responses: {
            200: {
                description: "User updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateUserResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
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
    // roleMiddleware("update_users"),
    zValidator("json", updateUserRequestBodySchema),
    UsersController.updateUsers
);

app.delete(
    "/:id",
    describeRoute({
        tags: ["Users"],
        operationId: "deleteUser",
        summary: "Delete a user",
        description: "Deletes a specific user by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
            },
        ],
        responses: {
            200: {
                description: "User deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteUserResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
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
    // roleMiddleware("delete_users"),
    UsersController.deleteUsers
);

export default app;
