import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { FeeController } from "@/controllers/fee.controller";
import {
    errorResponseSchema,
    getFeesResponseSchema,
    updateFeeRequestBodySchema,
    updateFeeResponseSchema,
} from "@/schema/fee";

const app = new Hono();

app.get(
    "/:user_id",
    describeRoute({
        operationId: "getFeeByUserId",
        summary: "Get fees by user ID",
        description: "Retrieves all unpaid fees for a specific user",
        tags: ["Fee"],
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
                description: "List of user fees",
                content: {
                    "application/json": {
                        schema: resolver(getFeesResponseSchema),
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
    FeeController.getFeeByUserId
);

app.patch(
    "/:id",
    describeRoute({
        operationId: "updateFee",
        summary: "Update a fee",
        description: "Updates a specific fee record by ID (e.g., mark as paid)",
        tags: ["Fee"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Fee ID",
            },
        ],
        responses: {
            200: {
                description: "Fee updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateFeeResponseSchema),
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
    zValidator("json", updateFeeRequestBodySchema),
    FeeController.updateFee
);

export default app;
