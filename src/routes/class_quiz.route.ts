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
    quizStatisticsResponseSchema,
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

app.get(
    "/i/created-by",
    describeRoute({
        operationId: "getClassQuizByCreatedBy",
        summary: "Get quizzes created by user",
        description: "Retrieves all quizzes created by the logged-in user",
        tags: ["Class Quiz"],
        responses: {
            200: {
                description: "List of quizzes created by user",
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
    ClassQuizController.getClassQuizByCreatedBy
);

// Get quizzes by class ID with student status (for students)
app.get(
    "/class/:class_id/student-status",
    describeRoute({
        operationId: "getClassQuizByClassIDWithStudentStatus",
        summary: "Get quizzes with student attempt status",
        description:
            "Retrieves all quizzes for a specific class with student's attempt status (completed, in progress, not attempted)",
        tags: ["Student Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
            {
                name: "user_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description:
                    "Student ID (optional, uses logged-in user if not provided)",
            },
        ],
        responses: {
            200: {
                description: "List of quizzes with student status",
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
                                        properties: {
                                            id: { type: "string" },
                                            quiz_name: { type: "string" },
                                            quiz_description: {
                                                type: "string",
                                            },
                                            quiz_meta_data: { type: "object" },
                                            student_status: {
                                                type: "object",
                                                properties: {
                                                    status: {
                                                        type: "string",
                                                        enum: [
                                                            "not_attempted",
                                                            "in_progress",
                                                            "completed",
                                                            "expired",
                                                        ],
                                                    },
                                                    availability_status: {
                                                        type: "string",
                                                        enum: [
                                                            "available",
                                                            "not_yet_available",
                                                            "expired",
                                                        ],
                                                    },
                                                    can_attempt: {
                                                        type: "boolean",
                                                    },
                                                    max_attempts: {
                                                        type: "number",
                                                    },
                                                    attempts_made: {
                                                        type: "number",
                                                    },
                                                    attempt_data: {
                                                        type: "object",
                                                        nullable: true,
                                                    },
                                                    session_data: {
                                                        type: "object",
                                                        nullable: true,
                                                    },
                                                },
                                            },
                                        },
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
    ClassQuizController.getClassQuizByClassIDWithStudentStatus
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
    ClassQuizController.getAllQuizzesFromAllClasses
);

// Get quiz statistics
app.get(
    "/:class_id/:quiz_id/statistics",
    describeRoute({
        operationId: "getQuizStatistics",
        summary: "Get quiz statistics",
        description:
            "Retrieves detailed statistics for a specific quiz including attempts, scores, and completion rates",
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
                description: "Quiz statistics retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(quizStatisticsResponseSchema),
                    },
                },
            },
            404: {
                description: "Quiz not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
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
    ClassQuizController.getQuizStatistics
);

// Get detailed quiz statistics by quiz ID
app.get(
    "/detailed-statistics/:quiz_id",
    describeRoute({
        operationId: "getDetailedQuizStatistics",
        summary: "Get detailed quiz statistics by quiz ID",
        description:
            "Retrieves comprehensive statistics for a specific quiz including attempted students count, total students average, each student's quiz marks, and top three students based on marks and completion time",
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
                description: "Detailed quiz statistics retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "object",
                                    properties: {
                                        quiz_info: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                quiz_name: { type: "string" },
                                                quiz_description: {
                                                    type: "string",
                                                },
                                                class_id: { type: "string" },
                                                class_name: { type: "string" },
                                                created_at: {
                                                    type: "string",
                                                    format: "date-time",
                                                },
                                            },
                                        },
                                        statistics: {
                                            type: "object",
                                            properties: {
                                                total_students: {
                                                    type: "number",
                                                },
                                                attempted_students: {
                                                    type: "number",
                                                },
                                                completion_percentage: {
                                                    type: "number",
                                                },
                                                average_score: {
                                                    type: "number",
                                                },
                                                highest_score: {
                                                    type: "number",
                                                },
                                                lowest_score: {
                                                    type: "number",
                                                },
                                                average_completion_time_seconds:
                                                    { type: "number" },
                                            },
                                        },
                                        top_three_students: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    student_id: {
                                                        type: "string",
                                                    },
                                                    student_name: {
                                                        type: "string",
                                                    },
                                                    student_email: {
                                                        type: "string",
                                                    },
                                                    score: { type: "number" },
                                                    submission_date: {
                                                        type: "string",
                                                        format: "date-time",
                                                    },
                                                    completion_time_seconds: {
                                                        type: "number",
                                                    },
                                                    completion_time_formatted: {
                                                        type: "string",
                                                    },
                                                    feedback: {
                                                        type: "string",
                                                    },
                                                    meta_data: {
                                                        type: "object",
                                                    },
                                                },
                                            },
                                        },
                                        all_student_results: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    student_id: {
                                                        type: "string",
                                                    },
                                                    student_name: {
                                                        type: "string",
                                                    },
                                                    student_email: {
                                                        type: "string",
                                                    },
                                                    score: { type: "number" },
                                                    submission_date: {
                                                        type: "string",
                                                        format: "date-time",
                                                    },
                                                    completion_time_seconds: {
                                                        type: "number",
                                                    },
                                                    completion_time_formatted: {
                                                        type: "string",
                                                    },
                                                    feedback: {
                                                        type: "string",
                                                    },
                                                    meta_data: {
                                                        type: "object",
                                                    },
                                                },
                                            },
                                        },
                                        summary: {
                                            type: "object",
                                            properties: {
                                                total_attempts: {
                                                    type: "number",
                                                },
                                                success_rate: {
                                                    type: "number",
                                                },
                                                average_time_formatted: {
                                                    type: "string",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            404: {
                description: "Quiz not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
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
    ClassQuizController.getDetailedQuizStatistics
);

// ======================= NEW SESSION-BASED QUIZ ROUTES =======================

// Start a quiz session
app.post(
    "/session/:class_id/:quiz_id/start",
    describeRoute({
        operationId: "startQuizSession",
        summary: "Start a quiz session",
        description: "Starts a new quiz session for a student",
        tags: ["Quiz Sessions"],
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
                description: "Quiz session started successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                data: {
                                    type: "object",
                                    properties: {
                                        session: { type: "object" },
                                        quiz: { type: "object" },
                                        current_question: { type: "object" },
                                        questions_count: { type: "number" },
                                        time_remaining_seconds: {
                                            type: "number",
                                        },
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
    ClassQuizController.startQuizSession
);

// Get quiz session
app.get(
    "/session/:session_token",
    describeRoute({
        operationId: "getQuizSession",
        summary: "Get quiz session",
        description: "Retrieves current quiz session state",
        tags: ["Quiz Sessions"],
        parameters: [
            {
                name: "session_token",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Session token",
            },
        ],
        responses: {
            200: {
                description: "Quiz session details",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "object",
                                    properties: {
                                        session: { type: "object" },
                                        quiz: { type: "object" },
                                        current_question: { type: "object" },
                                        questions_count: { type: "number" },
                                        time_remaining_seconds: {
                                            type: "number",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Invalid session",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.getQuizSession
);

// Submit answer
app.post(
    "/session/:session_token/answer",
    describeRoute({
        operationId: "submitQuizAnswer",
        summary: "Submit quiz answer",
        description: "Submits an answer for a quiz question",
        tags: ["Quiz Sessions"],
        parameters: [
            {
                name: "session_token",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Session token",
            },
        ],
        requestBody: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            question_id: { type: "string" },
                            answer: { type: "string" },
                        },
                        required: ["question_id", "answer"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Answer submitted successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                data: {
                                    type: "object",
                                    properties: {
                                        session: { type: "object" },
                                        quiz: { type: "object" },
                                        current_question: { type: "object" },
                                        questions_count: { type: "number" },
                                        time_remaining_seconds: {
                                            type: "number",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Invalid request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.submitQuizAnswer
);

// Navigate to next question
app.post(
    "/session/:session_token/next",
    describeRoute({
        operationId: "navigateToNextQuestion",
        summary: "Navigate to next question",
        description: "Moves to the next question in the quiz session",
        tags: ["Quiz Sessions"],
        parameters: [
            {
                name: "session_token",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Session token",
            },
        ],
        responses: {
            200: {
                description: "Successfully moved to next question",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                data: {
                                    type: "object",
                                    properties: {
                                        session: { type: "object" },
                                        quiz: { type: "object" },
                                        current_question: { type: "object" },
                                        questions_count: { type: "number" },
                                        time_remaining_seconds: {
                                            type: "number",
                                        },
                                        can_go_previous: { type: "boolean" },
                                        can_go_next: { type: "boolean" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Invalid request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.navigateToNextQuestion
);

// Navigate to previous question
app.post(
    "/session/:session_token/previous",
    describeRoute({
        operationId: "navigateToPreviousQuestion",
        summary: "Navigate to previous question",
        description: "Moves to the previous question in the quiz session",
        tags: ["Quiz Sessions"],
        parameters: [
            {
                name: "session_token",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Session token",
            },
        ],
        responses: {
            200: {
                description: "Successfully moved to previous question",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                data: {
                                    type: "object",
                                    properties: {
                                        session: { type: "object" },
                                        quiz: { type: "object" },
                                        current_question: { type: "object" },
                                        questions_count: { type: "number" },
                                        time_remaining_seconds: {
                                            type: "number",
                                        },
                                        can_go_previous: { type: "boolean" },
                                        can_go_next: { type: "boolean" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Invalid request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.navigateToPreviousQuestion
);

// Complete quiz
app.post(
    "/session/:session_token/complete",
    describeRoute({
        operationId: "completeQuizSession",
        summary: "Complete quiz session",
        description: "Completes and submits the quiz",
        tags: ["Quiz Sessions"],
        parameters: [
            {
                name: "session_token",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Session token",
            },
        ],
        responses: {
            200: {
                description: "Quiz completed successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                data: {
                                    type: "object",
                                    properties: {
                                        score: { type: "number" },
                                        total_questions: { type: "number" },
                                        percentage: { type: "number" },
                                        correct_answers: { type: "number" },
                                        incorrect_answers: { type: "number" },
                                        time_taken_seconds: { type: "number" },
                                        submission: { type: "object" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Invalid request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.completeQuizSession
);

// Check and process expired sessions (admin endpoint)
app.post(
    "/admin/check-expired-sessions",
    describeRoute({
        operationId: "checkExpiredSessions",
        summary: "Check and process expired quiz sessions",
        description:
            "Checks for expired quiz sessions and auto-submits them (admin only)",
        tags: ["Quiz Administration"],
        responses: {
            200: {
                description: "Expired sessions processed successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                message: { type: "string" },
                                data: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            session_id: { type: "string" },
                                            user_id: { type: "string" },
                                            quiz_id: { type: "string" },
                                            result: { type: "object" },
                                        },
                                    },
                                },
                            },
                        },
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
    ClassQuizController.checkExpiredSessions
);

// Get user's quiz session history
app.get(
    "/session/history",
    describeRoute({
        operationId: "getQuizSessionHistory",
        summary: "Get user's quiz session history",
        description:
            "Retrieves the history of quiz sessions for the current user",
        tags: ["Quiz Sessions"],
        parameters: [
            {
                name: "quiz_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by specific quiz ID",
            },
        ],
        responses: {
            200: {
                description: "Session history retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "array",
                                    items: { type: "object" },
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
    ClassQuizController.getQuizSessionHistory
);

// Abandon quiz session
app.post(
    "/session/:session_token/abandon",
    describeRoute({
        operationId: "abandonQuizSession",
        summary: "Abandon quiz session",
        description: "Manually abandon a quiz session without submitting",
        tags: ["Quiz Sessions"],
        parameters: [
            {
                name: "session_token",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Session token",
            },
        ],
        responses: {
            200: {
                description: "Session abandoned successfully",
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
            400: {
                description: "Invalid request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.abandonQuizSession
);

// Get quiz results by session
app.get(
    "/session/:session_token/results",
    describeRoute({
        operationId: "getQuizResultsBySession",
        summary: "Get quiz results by session",
        description: "Retrieves detailed quiz results for a completed session",
        tags: ["Quiz Sessions"],
        parameters: [
            {
                name: "session_token",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Session token",
            },
        ],
        responses: {
            200: {
                description: "Quiz results retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "object",
                                    properties: {
                                        session: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                session_token: {
                                                    type: "string",
                                                },
                                                status: { type: "string" },
                                                started_at: { type: "string" },
                                                completed_at: {
                                                    type: "string",
                                                },
                                                time_taken_seconds: {
                                                    type: "number",
                                                },
                                            },
                                        },
                                        quiz: {
                                            type: "object",
                                            properties: {
                                                id: { type: "string" },
                                                quiz_name: { type: "string" },
                                                quiz_description: {
                                                    type: "string",
                                                },
                                                quiz_meta_data: {
                                                    type: "object",
                                                },
                                            },
                                        },
                                        results: {
                                            type: "object",
                                            properties: {
                                                submission_id: {
                                                    type: "string",
                                                },
                                                score: { type: "number" },
                                                total_questions: {
                                                    type: "number",
                                                },
                                                correct_answers: {
                                                    type: "number",
                                                },
                                                incorrect_answers: {
                                                    type: "number",
                                                },
                                                percentage: { type: "number" },
                                                submission_date: {
                                                    type: "string",
                                                },
                                                feedback: {
                                                    type: "string",
                                                    nullable: true,
                                                },
                                                time_taken_seconds: {
                                                    type: "number",
                                                },
                                                auto_submitted: {
                                                    type: "boolean",
                                                },
                                            },
                                        },
                                        question_details: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    question_id: {
                                                        type: "string",
                                                    },
                                                    question_text: {
                                                        type: "string",
                                                    },
                                                    question_type: {
                                                        type: "string",
                                                    },
                                                    options: { type: "object" },
                                                    correct_answer: {
                                                        type: "string",
                                                    },
                                                    user_answer: {
                                                        type: "string",
                                                        nullable: true,
                                                    },
                                                    is_correct: {
                                                        type: "boolean",
                                                    },
                                                    points_earned: {
                                                        type: "number",
                                                    },
                                                    meta_data: {
                                                        type: "object",
                                                        nullable: true,
                                                    },
                                                },
                                            },
                                        },
                                        meta_data: {
                                            type: "object",
                                            nullable: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            400: {
                description: "Invalid request or session not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.getQuizResultsBySession
);

// ======================= ADMINISTRATION ROUTES =======================

app.get(
    "/student/:student_id/results",
    describeRoute({
        operationId: "getAllQuizResultsByStudentId",
        summary: "Get all quiz results by student ID",
        description:
            "Retrieves all quiz results for a specific student with detailed information",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Optional class ID to filter results",
            },
        ],
        responses: {
            200: {
                description: "Quiz results retrieved successfully",
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
                                        properties: {
                                            submission: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    submission_date: {
                                                        type: "string",
                                                        format: "date-time",
                                                    },
                                                    score: { type: "number" },
                                                    feedback: {
                                                        type: "string",
                                                    },
                                                    meta_data: {
                                                        type: "object",
                                                    },
                                                },
                                            },
                                            quiz: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    quiz_name: {
                                                        type: "string",
                                                    },
                                                    quiz_description: {
                                                        type: "string",
                                                    },
                                                    class_id: {
                                                        type: "string",
                                                    },
                                                    quiz_meta_data: {
                                                        type: "object",
                                                    },
                                                },
                                            },
                                            results: {
                                                type: "object",
                                                properties: {
                                                    total_questions: {
                                                        type: "number",
                                                    },
                                                    correct_answers: {
                                                        type: "number",
                                                    },
                                                    incorrect_answers: {
                                                        type: "number",
                                                    },
                                                    percentage: {
                                                        type: "number",
                                                    },
                                                    time_taken_seconds: {
                                                        type: "number",
                                                    },
                                                    auto_submitted: {
                                                        type: "boolean",
                                                    },
                                                },
                                            },
                                            question_details: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        question_id: {
                                                            type: "string",
                                                        },
                                                        question_text: {
                                                            type: "string",
                                                        },
                                                        question_type: {
                                                            type: "string",
                                                        },
                                                        options: {
                                                            type: "array",
                                                            items: {
                                                                type: "string",
                                                            },
                                                        },
                                                        correct_answer: {
                                                            type: "string",
                                                        },
                                                        user_answer: {
                                                            type: "string",
                                                            nullable: true,
                                                        },
                                                        is_correct: {
                                                            type: "boolean",
                                                        },
                                                        points_earned: {
                                                            type: "number",
                                                        },
                                                    },
                                                },
                                            },
                                            session_info: {
                                                type: "object",
                                                nullable: true,
                                                properties: {
                                                    session_id: {
                                                        type: "string",
                                                    },
                                                    status: { type: "string" },
                                                    started_at: {
                                                        type: "string",
                                                        format: "date-time",
                                                    },
                                                    completed_at: {
                                                        type: "string",
                                                        format: "date-time",
                                                        nullable: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                count: { type: "number" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.getAllQuizResultsByStudentId
);

app.get(
    "/student/:student_id/results/summary",
    describeRoute({
        operationId: "getQuizResultsSummaryByStudentId",
        summary: "Get quiz results summary by student ID",
        description:
            "Retrieves a summary of all quiz results for a specific student",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Optional class ID to filter results",
            },
        ],
        responses: {
            200: {
                description: "Quiz results summary retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: {
                                    type: "object",
                                    properties: {
                                        student_id: { type: "string" },
                                        campus_id: { type: "string" },
                                        class_id: {
                                            type: "string",
                                            nullable: true,
                                        },
                                        total_quizzes_attempted: {
                                            type: "number",
                                        },
                                        average_score: { type: "number" },
                                        average_percentage: { type: "number" },
                                        total_correct_answers: {
                                            type: "number",
                                        },
                                        total_questions_attempted: {
                                            type: "number",
                                        },
                                        highest_score: { type: "number" },
                                        lowest_score: { type: "number" },
                                        total_time_spent_seconds: {
                                            type: "number",
                                        },
                                        quiz_results: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    quiz_id: { type: "string" },
                                                    quiz_name: {
                                                        type: "string",
                                                    },
                                                    submission_date: {
                                                        type: "string",
                                                        format: "date-time",
                                                    },
                                                    score: { type: "number" },
                                                    percentage: {
                                                        type: "number",
                                                    },
                                                    total_questions: {
                                                        type: "number",
                                                    },
                                                    correct_answers: {
                                                        type: "number",
                                                    },
                                                    time_taken_seconds: {
                                                        type: "number",
                                                    },
                                                    auto_submitted: {
                                                        type: "boolean",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    ClassQuizController.getQuizResultsSummaryByStudentId
);

app.get(
    "/student/:student_id/results/:quiz_id",
    describeRoute({
        operationId: "getQuizResultsByStudentIdAndQuizId",
        summary: "Get quiz results by student ID and quiz ID",
        description:
            "Retrieves detailed quiz results for a specific student and quiz",
        tags: ["Class Quiz"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
            {
                name: "quiz_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Quiz ID",
            },
        ],
    }),
    ClassQuizController.getQuizResultsByStudentIdAndQuizId
);

export default app;
