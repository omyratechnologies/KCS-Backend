import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { UsersController } from "@/controllers/users.controller";
// import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    createUserRequestBodySchema,
    createUserResponseSchema,
    deleteUserResponseSchema,
    getUserResponseSchema,
    getUsersResponseSchema,
    updateUserRequestBodySchema,
    updateUserResponseSchema,
} from "@/schema/user";

const app = new Hono();

app.post(
    "/",
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
        description: "Retrieves all users for the current campus",
        responses: {
            200: {
                description: "List of users",
                content: {
                    "application/json": {
                        schema: resolver(getUsersResponseSchema),
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
    // roleMiddleware("get_users"),
    UsersController.getUsers
);

app.get(
    "/i/:id",
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
