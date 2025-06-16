import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

import { ParentController } from "@/controllers/parent.controller";
import {
    errorResponseSchema,
    getParentForStudentResponseSchema,
    getStudentForParentResponseSchema,
} from "@/schema/parent";

const app = new Hono();

app.get(
    "/by-student/:student_id",
    describeRoute({
        operationId: "getParentForStudent",
        summary: "Get parents for a student",
        description: "Retrieves all parents associated with a specific student",
        tags: ["Parent"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
        ],
        responses: {
            200: {
                description: "List of parents",
                content: {
                    "application/json": {
                        schema: resolver(getParentForStudentResponseSchema),
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
    ParentController.getParentForStudent
);

app.get(
    "/by-parent/:parent_id",
    describeRoute({
        operationId: "getStudentForParent",
        summary: "Get students for a parent",
        description: "Retrieves all students associated with a specific parent",
        tags: ["Parent"],
        parameters: [
            {
                name: "parent_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Parent ID",
            },
        ],
        responses: {
            200: {
                description: "List of students",
                content: {
                    "application/json": {
                        schema: resolver(getStudentForParentResponseSchema),
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
    ParentController.getStudentForParent
);

export default app;
