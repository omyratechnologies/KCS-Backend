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
        description: "Retrieves all teachers for the current campus with pagination and filtering support",
        tags: ["Teacher"],
        parameters: [
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
                description: "Search term to filter teachers by name, email, user_id, or phone",
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
                name: "is_active",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Filter by active status",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID - returns teachers assigned to this class",
            },
            {
                name: "from",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter teachers created from this date (ISO 8601 format: YYYY-MM-DD)",
                example: "2024-01-01",
            },
            {
                name: "to",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Filter teachers created up to this date (ISO 8601 format: YYYY-MM-DD)",
                example: "2024-12-31",
            },
            {
                name: "sort_by",
                in: "query",
                required: false,
                schema: { type: "string", default: "updated_at" },
                description: "Field to sort by (e.g., updated_at, created_at)",
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
                description: "List of teachers with pagination",
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
