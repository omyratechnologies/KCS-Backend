import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { ClassQuizController } from "@/controllers/class_quiz.controller";
import {
    classQuizSchema,
    createClassQuizRequestBodySchema,
    createClassQuizResponseSchema,
    createQuizAttemptRequestBodySchema,
    createQuizQuestionsRequestBodySchema,
    createQuizQuestionsResponseSchema,
    errorResponseSchema,
    getClassQuizzesResponseSchema,
    getQuizAttemptsResponseSchema,
    getQuizQuestionsResponseSchema,
    quizAttemptSchema,
    quizQuestionSchema,
    quizSubmissionSchema,
    updateQuizQuestionRequestBodySchema,
    updateQuizQuestionResponseSchema,
    updateQuizSubmissionRequestBodySchema,
    updateQuizSubmissionResponseSchema,
} from "@/schema/class-quiz";

const app = new Hono();

app.post(
    "/:class_id",
    describeRoute({
        operationId: "createClassQuiz",
        summary: "Create a class quiz",
        description: "Creates a new quiz for a specific class",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "Quiz created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createClassQuizResponseSchema),
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
    zValidator("json", createClassQuizRequestBodySchema),
    ClassQuizController.createClassQuiz
);

app.get(
    "/:quiz_id",
    describeRoute({
        operationId: "getClassQuizById",
        summary: "Get quiz by ID",
        description: "Retrieves a specific quiz by ID",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
        responses: {
            200: {
                description: "Quiz details",
                content: {
                    "application/json": {
                        schema: resolver(classQuizSchema),
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
    ClassQuizController.getClassQuizById
);

app.get(
    "/class/:class_id",
    describeRoute({
        operationId: "getClassQuizByClassID",
        summary: "Get quizzes by class ID",
        description: "Retrieves all quizzes for a specific class",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "List of quizzes",
                content: {
                    "application/json": {
                        schema: resolver(getClassQuizzesResponseSchema),
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
    ClassQuizController.getClassQuizByClassID
);

app.put(
    "/:quiz_id",
    describeRoute({
        operationId: "updateClassQuizById",
        summary: "Update quiz",
        description: "Updates a specific quiz by ID",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
        requestBody: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            quiz_name: { type: "string" },
                            quiz_description: { type: "string" },
                            quiz_meta_data: { type: "object" },
                        },
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Quiz updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(classQuizSchema),
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
    ClassQuizController.updateClassQuizById
);

app.delete(
    "/:quiz_id",
    describeRoute({
        operationId: "deleteClassQuizById",
        summary: "Delete quiz",
        description: "Deletes a specific quiz by ID (soft delete)",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
        responses: {
            200: {
                description: "Quiz deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(classQuizSchema),
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
    ClassQuizController.deleteClassQuizById
);

app.post(
    "/:class_id/:quiz_id/questions",
    describeRoute({
        operationId: "createClassQuizQuestions",
        summary: "Create quiz questions",
        description: "Creates multiple questions for a specific quiz",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
        responses: {
            200: {
                description: "Questions created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createQuizQuestionsResponseSchema),
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
    zValidator("json", createQuizQuestionsRequestBodySchema),
    ClassQuizController.createClassQuizQuestions
);

app.get(
    "/questions/:question_id",
    describeRoute({
        operationId: "getClassQuizQuestionById",
        summary: "Get quiz question by ID",
        description: "Retrieves a specific quiz question by ID",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "question_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Question ID",
            },
        ],
        responses: {
            200: {
                description: "Question details",
                content: {
                    "application/json": {
                        schema: resolver(quizQuestionSchema),
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
    ClassQuizController.getClassQuizQuestionById
);

app.get(
    "/class/:class_id/:quiz_id/questions",
    describeRoute({
        operationId: "getClassQuizQuestionByClassIDAndByQuizID",
        summary: "Get quiz questions by class and quiz ID",
        description: "Retrieves all questions for a specific quiz in a class",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
        responses: {
            200: {
                description: "List of questions",
                content: {
                    "application/json": {
                        schema: resolver(getQuizQuestionsResponseSchema),
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
    ClassQuizController.getClassQuizQuestionByClassIDAndByQuizID
);

app.put(
    "/questions/:question_id",
    describeRoute({
        operationId: "updateClassQuizQuestionById",
        summary: "Update quiz question",
        description: "Updates a specific quiz question by ID",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "question_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Question ID",
            },
        ],
        responses: {
            200: {
                description: "Question updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateQuizQuestionResponseSchema),
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
    zValidator("json", updateQuizQuestionRequestBodySchema),
    ClassQuizController.updateClassQuizQuestionById
);

app.delete(
    "/questions/:question_id",
    describeRoute({
        operationId: "deleteClassQuizQuestionById",
        summary: "Delete quiz question",
        description: "Deletes a specific quiz question by ID (soft delete)",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "question_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Question ID",
            },
        ],
        responses: {
            200: {
                description: "Question deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(quizQuestionSchema),
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
    ClassQuizController.deleteClassQuizQuestionById
);

app.post(
    "/:class_id/:quiz_id/attempt",
    describeRoute({
        operationId: "createClassQuizAttempt",
        summary: "Create quiz attempt",
        description: "Records a student's attempt at answering a quiz question",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
        responses: {
            200: {
                description: "Attempt recorded successfully",
                content: {
                    "application/json": {
                        schema: resolver(quizAttemptSchema),
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
    zValidator("json", createQuizAttemptRequestBodySchema),
    ClassQuizController.createClassQuizAttempt
);

app.get(
    "/attempt/:quiz_id/:student_id",
    describeRoute({
        operationId: "getClassQuizAttemptByQuizIdAndStudentId",
        summary: "Get quiz attempts by quiz and student ID",
        description: "Retrieves all attempts for a specific quiz by a student",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
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
                description: "List of attempts",
                content: {
                    "application/json": {
                        schema: resolver(getQuizAttemptsResponseSchema),
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
    ClassQuizController.getClassQuizAttemptByQuizIdAndStudentId
);

app.get(
    "/class/:class_id/:quiz_id/attempt",
    describeRoute({
        operationId: "getClassQuizAttemptByCampusIdAndClassIdAndQuizId",
        summary: "Get quiz attempts by class and quiz ID",
        description: "Retrieves all attempts for a specific quiz in a class",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
        responses: {
            200: {
                description: "List of attempts",
                content: {
                    "application/json": {
                        schema: resolver(getQuizAttemptsResponseSchema),
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
    ClassQuizController.getClassQuizAttemptByCampusIdAndClassIdAndQuizId
);

app.post(
    "/:class_id/:quiz_id/submission",
    describeRoute({
        operationId: "createClassQuizSubmission",
        summary: "Create quiz submission",
        description:
            "Creates a final submission for a quiz, calculating the score",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
        responses: {
            200: {
                description: "Submission created successfully",
                content: {
                    "application/json": {
                        schema: resolver(quizSubmissionSchema),
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
    ClassQuizController.createClassQuizSubmission
);

app.get(
    "/submission/:submission_id",
    describeRoute({
        operationId: "getClassQuizSubmissionById",
        summary: "Get quiz submission by ID",
        description: "Retrieves a specific quiz submission by ID",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "submission_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Submission ID",
            },
        ],
        responses: {
            200: {
                description: "Submission details",
                content: {
                    "application/json": {
                        schema: resolver(quizSubmissionSchema),
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
    ClassQuizController.getClassQuizSubmissionById
);

app.put(
    "/submission/:submission_id",
    describeRoute({
        operationId: "updateClassQuizSubmissionById",
        summary: "Update quiz submission",
        description: "Updates a specific quiz submission by ID",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "submission_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Submission ID",
            },
        ],
        responses: {
            200: {
                description: "Submission updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateQuizSubmissionResponseSchema),
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
    zValidator("json", updateQuizSubmissionRequestBodySchema),
    ClassQuizController.updateClassQuizSubmissionById
);

app.get(
    "/all",
    describeRoute({
        operationId: "getAllClassQuizzes",
        summary: "Get all quizzes from all classes",
        description: "Retrieves all quizzes from all classes for the campus",
        tags: ["Class Quiz"],
        responses: {
            200: {
                description: "List of all quizzes from all classes",
                content: {
                    "application/json": {
                        schema: resolver(getClassQuizzesResponseSchema),
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
    ClassQuizController.getAllClassQuizzes
);

export default app;
