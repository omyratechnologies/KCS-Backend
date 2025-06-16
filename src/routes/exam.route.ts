import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { ExamController } from "@/controllers/exam.controller";
import {
    createExaminationRequestBodySchema,
    createExaminationResponseSchema,
    createExamTermRequestBodySchema,
    createExamTermResponseSchema,
    errorResponseSchema,
    examinationSchema,
    examTermSchema,
    getExaminationsResponseSchema,
    getExamTermsResponseSchema,
    updateExaminationRequestBodySchema,
    updateExaminationResponseSchema,
    updateExamTermRequestBodySchema,
    updateExamTermResponseSchema,
} from "@/schema/exam";

const app = new Hono();

// Exam Term routes
app.post(
    "/",
    describeRoute({
        operationId: "createExamTerm",
        summary: "Create a new exam term",
        description:
            "Creates a new exam term (e.g., Midterm, Final) in the system",
        tags: ["Exam"],
        responses: {
            200: {
                description: "Exam term created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createExamTermResponseSchema),
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
    zValidator("json", createExamTermRequestBodySchema),
    ExamController.createExamTerm
);

app.get(
    "/",
    describeRoute({
        operationId: "getExamTerms",
        summary: "Get all exam terms",
        description: "Retrieves all exam terms for a campus",
        tags: ["Exam"],
        responses: {
            200: {
                description: "List of exam terms",
                content: {
                    "application/json": {
                        schema: resolver(getExamTermsResponseSchema),
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
    ExamController.getExamTerms
);

app.get(
    "/:id",
    describeRoute({
        operationId: "getExamTermById",
        summary: "Get exam term by ID",
        description: "Retrieves a specific exam term by ID",
        tags: ["Exam"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Term ID",
            },
        ],
        responses: {
            200: {
                description: "Exam term details",
                content: {
                    "application/json": {
                        schema: resolver(examTermSchema),
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
    ExamController.getExamTermById
);

app.patch(
    "/:id",
    describeRoute({
        operationId: "updateExamTerm",
        summary: "Update an exam term",
        description: "Updates a specific exam term by ID",
        tags: ["Exam"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Term ID",
            },
        ],
        responses: {
            200: {
                description: "Exam term updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateExamTermResponseSchema),
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
    zValidator("json", updateExamTermRequestBodySchema),
    ExamController.updateExamTerm
);

app.delete(
    "/:id",
    describeRoute({
        operationId: "deleteExamTerm",
        summary: "Delete an exam term",
        description: "Deletes a specific exam term by ID",
        tags: ["Exam"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Term ID",
            },
        ],
        responses: {
            200: {
                description: "Exam term deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(examTermSchema),
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
    ExamController.deleteExamTerm
);

// Examination routes
app.get(
    "/e/examinations",
    describeRoute({
        operationId: "getExaminations",
        summary: "Get all examinations",
        description: "Retrieves all examinations for a campus",
        tags: ["Exam"],
        responses: {
            200: {
                description: "List of examinations",
                content: {
                    "application/json": {
                        schema: resolver(getExaminationsResponseSchema),
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
    ExamController.getExaminations
);

app.post(
    "/examinations/:exam_term_id",
    describeRoute({
        operationId: "createExamination",
        summary: "Create a new examination",
        description: "Creates a new examination for a specific exam term",
        tags: ["Exam"],
        parameters: [
            {
                name: "exam_term_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Term ID",
            },
        ],
        responses: {
            200: {
                description: "Examination created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createExaminationResponseSchema),
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
    zValidator("json", createExaminationRequestBodySchema),
    ExamController.createExamination
);

app.get(
    "/examinations/:id",
    describeRoute({
        operationId: "getExaminationById",
        summary: "Get examination by ID",
        description: "Retrieves a specific examination by ID",
        tags: ["Exam"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Examination ID",
            },
        ],
        responses: {
            200: {
                description: "Examination details",
                content: {
                    "application/json": {
                        schema: resolver(examinationSchema),
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
    ExamController.getExaminationById
);

app.patch(
    "/examinations/:id",
    describeRoute({
        operationId: "updateExamination",
        summary: "Update an examination",
        description: "Updates a specific examination by ID",
        tags: ["Exam"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Examination ID",
            },
        ],
        responses: {
            200: {
                description: "Examination updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateExaminationResponseSchema),
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
    zValidator("json", updateExaminationRequestBodySchema),
    ExamController.updateExamination
);

app.delete(
    "/examinations/:id",
    describeRoute({
        operationId: "deleteExamination",
        summary: "Delete an examination",
        description: "Deletes a specific examination by ID",
        tags: ["Exam"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Examination ID",
            },
        ],
        responses: {
            200: {
                description: "Examination deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(examinationSchema),
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
    ExamController.deleteExamination
);

app.get(
    "/examinations/exam_term/:exam_term_id",
    describeRoute({
        operationId: "getExaminationsByExamTermId",
        summary: "Get examinations by exam term ID",
        description: "Retrieves all examinations for a specific exam term",
        tags: ["Exam"],
        parameters: [
            {
                name: "exam_term_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Exam Term ID",
            },
        ],
        responses: {
            200: {
                description: "List of examinations for the exam term",
                content: {
                    "application/json": {
                        schema: resolver(getExaminationsResponseSchema),
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
    ExamController.getExaminationsByExamTermId
);

app.get(
    "/examinations/subject/:subject_id",
    describeRoute({
        operationId: "getExaminationsBySubjectId",
        summary: "Get examinations by subject ID",
        description: "Retrieves all examinations for a specific subject",
        tags: ["Exam"],
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
                description: "List of examinations for the subject",
                content: {
                    "application/json": {
                        schema: resolver(getExaminationsResponseSchema),
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
    ExamController.getExaminationsBySubjectId
);

app.get(
    "/examinations/date/:date",
    describeRoute({
        operationId: "getExaminationsByDate",
        summary: "Get examinations by date",
        description: "Retrieves all examinations scheduled for a specific date",
        tags: ["Exam"],
        parameters: [
            {
                name: "date",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Examination date (YYYY-MM-DD)",
            },
        ],
        responses: {
            200: {
                description: "List of examinations for the date",
                content: {
                    "application/json": {
                        schema: resolver(getExaminationsResponseSchema),
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
    ExamController.getExaminationsByDate
);

export default app;
