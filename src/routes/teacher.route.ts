import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { TeacherController } from "@/controllers/teacher.controller";
import {
    createTeacherRequestBodySchema,
    createTeacherResponseSchema,
    errorResponseSchema,
    getTeacherClassesResponseSchema,
    getTeachersResponseSchema,
    getTeacherSubjectsResponseSchema,
    teacherSchema,
    teacherWithProfileSchema,
    updateTeacherRequestBodySchema,
    updateTeacherResponseSchema,
} from "@/schema/teacher";

const app = new Hono();

app.post(
    "/",
    describeRoute({
        operationId: "createTeacher",
        summary: "Create a teacher",
        description: "Creates a new teacher profile",
        tags: ["Teacher"],
        responses: {
            200: {
                description: "Teacher created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createTeacherResponseSchema),
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
    zValidator("json", createTeacherRequestBodySchema),
    TeacherController.createTeacher
);

app.get(
    "/",
    describeRoute({
        operationId: "getAllTeachers",
        summary: "Get all teachers",
        description: "Retrieves all teachers for the current campus",
        tags: ["Teacher"],
        responses: {
            200: {
                description: "List of teachers",
                content: {
                    "application/json": {
                        schema: resolver(getTeachersResponseSchema),
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
    TeacherController.getAllTeachers
);

app.get(
    "/:teacher_id",
    describeRoute({
        operationId: "getTeacherById",
        summary: "Get teacher by ID",
        description: "Retrieves a specific teacher by ID",
        tags: ["Teacher"],
        parameters: [
            {
                name: "teacher_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Teacher ID",
            },
        ],
        responses: {
            200: {
                description: "Teacher details",
                content: {
                    "application/json": {
                        schema: resolver(teacherWithProfileSchema),
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
    TeacherController.getTeacherById
);

app.put(
    "/:teacher_id",
    describeRoute({
        operationId: "updateTeacher",
        summary: "Update teacher",
        description: "Updates a specific teacher by ID",
        tags: ["Teacher"],
        parameters: [
            {
                name: "teacher_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Teacher ID",
            },
        ],
        responses: {
            200: {
                description: "Teacher updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateTeacherResponseSchema),
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
    zValidator("json", updateTeacherRequestBodySchema),
    TeacherController.updateTeacher
);

app.delete(
    "/:teacher_id",
    describeRoute({
        operationId: "deleteTeacher",
        summary: "Delete teacher",
        description: "Deletes a specific teacher by ID",
        tags: ["Teacher"],
        parameters: [
            {
                name: "teacher_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Teacher ID",
            },
        ],
        responses: {
            200: {
                description: "Teacher deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(teacherSchema),
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
    TeacherController.deleteTeacher
);

app.get(
    "/:teacher_id/classes",
    describeRoute({
        operationId: "getAllClassesByTeacherId",
        summary: "Get all classes by teacher ID",
        description: "Retrieves all classes assigned to a specific teacher",
        tags: ["Teacher"],
        parameters: [
            {
                name: "teacher_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Teacher ID",
            },
        ],
        responses: {
            200: {
                description: "List of classes",
                content: {
                    "application/json": {
                        schema: resolver(getTeacherClassesResponseSchema),
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
    TeacherController.getAllClassesByTeacherId
);

app.get(
    "/:teacher_id/subjects",
    describeRoute({
        operationId: "getAllSubjectsByTeacherId",
        summary: "Get all subjects by teacher ID",
        description: "Retrieves all subjects assigned to a specific teacher",
        tags: ["Teacher"],
        parameters: [
            {
                name: "teacher_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Teacher ID",
            },
        ],
        responses: {
            200: {
                description: "List of subjects",
                content: {
                    "application/json": {
                        schema: resolver(getTeacherSubjectsResponseSchema),
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
    TeacherController.getAllSubjectsByTeacherId
);

export default app;
