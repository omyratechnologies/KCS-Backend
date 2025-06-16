import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { CampusesController } from "@/controllers/campuses.controller";
// import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    createCampusRequestBodySchema,
    createCampusResponseSchema,
    deleteCampusResponseSchema,
    getCampusesResponseSchema,
    getCampusResponseSchema,
    updateCampusRequestBodySchema,
    updateCampusResponseSchema,
} from "@/schema/campus";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        tags: ["Campuses"],
        operationId: "createCampus",
        summary: "Create a new campus",
        description: "Creates a new campus in the system",
        responses: {
            200: {
                description: "Campus created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createCampusResponseSchema),
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
    // roleMiddleware("create_campus"),
    zValidator("json", createCampusRequestBodySchema),
    CampusesController.createCampus
);

app.get(
    "/",
    describeRoute({
        tags: ["Campuses"],
        operationId: "getCampuses",
        summary: "Get all campuses",
        description: "Retrieves all campuses in the system",
        responses: {
            200: {
                description: "List of campuses",
                content: {
                    "application/json": {
                        schema: resolver(getCampusesResponseSchema),
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
    // roleMiddleware("get_all_campus"),
    CampusesController.getCampuses
);

app.get(
    "/:id",
    describeRoute({
        tags: ["Campuses"],
        operationId: "getCampus",
        summary: "Get a specific campus",
        description: "Retrieves a specific campus by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Campus ID",
            },
        ],
        responses: {
            200: {
                description: "Campus details",
                content: {
                    "application/json": {
                        schema: resolver(getCampusResponseSchema),
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
    // roleMiddleware("get_campus"),
    CampusesController.getCampus
);

app.put(
    "/:id",
    describeRoute({
        tags: ["Campuses"],
        operationId: "updateCampus",
        summary: "Update a campus",
        description: "Updates a specific campus by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Campus ID",
            },
        ],
        responses: {
            200: {
                description: "Campus updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateCampusResponseSchema),
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
    // roleMiddleware("update_campus"),
    zValidator("json", updateCampusRequestBodySchema),
    CampusesController.updateCampus
);

app.delete(
    "/:id",
    describeRoute({
        tags: ["Campuses"],
        operationId: "deleteCampus",
        summary: "Delete a campus",
        description: "Deletes a specific campus by ID",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Campus ID",
            },
        ],
        responses: {
            200: {
                description: "Campus deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteCampusResponseSchema),
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
    // roleMiddleware("delete_campus"),
    CampusesController.deleteCampus
);

export default app;
