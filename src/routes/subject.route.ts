import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { SubjectController } from "@/controllers/subject.controller";
import {
    createSubjectRequestBodySchema,
    createSubjectResponseSchema,
    deleteSubjectResponseSchema,
    getClassesForSubjectResponseSchema,
    getSubjectsResponseSchema,
    getTeachersForSubjectResponseSchema,
    subjectSchema,
    updateSubjectRequestBodySchema,
    updateSubjectResponseSchema,
} from "@/schema/subject";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        tags: ["Subject"],
        operationId: "createSubject",
        summary: "Create a new subject",
        description: "Creates a new subject in the system",
        responses: {
            200: {
                description: "Subject created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createSubjectResponseSchema),
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
    zValidator("json", createSubjectRequestBodySchema),
    SubjectController.createSubject
);

app.get(
    "/",
    describeRoute({
        tags: ["Subject"],
        operationId: "getAllSubjects",
        summary: "Get all subjects",
        description: "Retrieves all subjects for a campus",
        responses: {
            200: {
                description: "List of subjects",
                content: {
                    "application/json": {
                        schema: resolver(getSubjectsResponseSchema),
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
    SubjectController.getAllSubjects
);

app.get(
    "/:subject_id",
    describeRoute({
        tags: ["Subject"],
        operationId: "getSubjectById",
        summary: "Get subject by ID",
        description: "Retrieves a specific subject by ID",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID",
            },
        ],
        responses: {
            200: {
                description: "Subject details",
                content: {
                    "application/json": {
                        schema: resolver(subjectSchema),
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
    SubjectController.getSubjectById
);

app.put(
    "/:subject_id",
    describeRoute({
        tags: ["Subject"],
        operationId: "updateSubject",
        summary: "Update a subject",
        description: "Updates a specific subject by ID",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID",
            },
        ],
        responses: {
            200: {
                description: "Subject updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateSubjectResponseSchema),
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
    zValidator("json", updateSubjectRequestBodySchema),
    SubjectController.updateSubject
);

app.delete(
    "/:subject_id",
    describeRoute({
        tags: ["Subject"],
        operationId: "deleteSubject",
        summary: "Delete a subject",
        description: "Deletes a specific subject by ID",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID",
            },
        ],
        responses: {
            200: {
                description: "Subject deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteSubjectResponseSchema),
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
    SubjectController.deleteSubject
);

app.get(
    "/:subject_id/teachers",
    describeRoute({
        tags: ["Subject"],
        operationId: "getAllTeacherForASubjectById",
        summary: "Get all teachers for a subject",
        description: "Retrieves all teachers assigned to a specific subject",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID",
            },
        ],
        responses: {
            200: {
                description: "List of teachers",
                content: {
                    "application/json": {
                        schema: resolver(getTeachersForSubjectResponseSchema),
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
    SubjectController.getAllTeacherForASubjectById
);

app.get(
    "/:subject_id/classes",
    describeRoute({
        tags: ["Subject"],
        operationId: "getAllClassesForASubjectById",
        summary: "Get all classes for a subject",
        description: "Retrieves all classes that include a specific subject",
        parameters: [
            {
                name: "subject_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Subject ID",
            },
        ],
        responses: {
            200: {
                description: "List of classes",
                content: {
                    "application/json": {
                        schema: resolver(getClassesForSubjectResponseSchema),
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
    SubjectController.getAllClassesForASubjectById
);

export default app;
