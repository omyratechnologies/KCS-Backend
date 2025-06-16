import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { CourseQuizController } from "@/controllers/course_quiz.controller";
import {
    courseQuizQuestionSchema,
    courseQuizSchema,
    courseQuizSubmissionSchema,
    createCourseQuizAttemptRequestBodySchema,
    createCourseQuizAttemptResponseSchema,
    createCourseQuizQuestionsRequestBodySchema,
    createCourseQuizQuestionsResponseSchema,
    createCourseQuizRequestBodySchema,
    createCourseQuizResponseSchema,
    errorResponseSchema,
    getCourseQuizAttemptsResponseSchema,
    getCourseQuizQuestionsResponseSchema,
    getCourseQuizSubmissionsResponseSchema,
    getCourseQuizzesResponseSchema,
    updateCourseQuizQuestionRequestBodySchema,
    updateCourseQuizQuestionResponseSchema,
    updateCourseQuizSubmissionRequestBodySchema,
    updateCourseQuizSubmissionResponseSchema,
} from "@/schema/course-quiz";

const app = new Hono();

app.post(
    "/:class_id",
    describeRoute({
        operationId: "createCourseQuiz",
        summary: "Create a course quiz",
        description: "Creates a new quiz for a specific course",
        tags: ["Course Quiz"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Quiz created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createCourseQuizResponseSchema),
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
    zValidator("json", createCourseQuizRequestBodySchema),
    CourseQuizController.createCourseQuiz
);

app.get(
    "/:quiz_id",
    describeRoute({
        operationId: "getCourseQuizById",
        summary: "Get quiz by ID",
        description: "Retrieves a specific quiz by ID",
        tags: ["Course Quiz"],
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
                        schema: resolver(courseQuizSchema),
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
    CourseQuizController.getCourseQuizById
);

app.get(
    "/course/:course_id",
    describeRoute({
        operationId: "getCourseQuizByCourseID",
        summary: "Get quizzes by course ID",
        description: "Retrieves all quizzes for a specific course",
        tags: ["Course Quiz"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "List of quizzes",
                content: {
                    "application/json": {
                        schema: resolver(getCourseQuizzesResponseSchema),
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
    CourseQuizController.getCourseQuizByCourseID
);

app.put(
    "/:quiz_id",
    describeRoute({
        operationId: "updateCourseQuizById",
        summary: "Update quiz",
        description: "Updates a specific quiz by ID",
        tags: ["Course Quiz"],
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
                        schema: resolver(courseQuizSchema),
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
    CourseQuizController.updateCourseQuizById
);

app.delete(
    "/:quiz_id",
    describeRoute({
        operationId: "deleteCourseQuizById",
        summary: "Delete quiz",
        description: "Deletes a specific quiz by ID (soft delete)",
        tags: ["Course Quiz"],
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
                        schema: resolver(courseQuizSchema),
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
    CourseQuizController.deleteCourseQuizById
);

app.post(
    "/:course_id/:quiz_id/questions",
    describeRoute({
        operationId: "createCourseQuizQuestions",
        summary: "Create quiz questions",
        description: "Creates multiple questions for a specific quiz",
        tags: ["Course Quiz"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
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
                        schema: resolver(
                            createCourseQuizQuestionsResponseSchema
                        ),
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
    zValidator("json", createCourseQuizQuestionsRequestBodySchema),
    CourseQuizController.createCourseQuizQuestions
);

app.get(
    "/questions/:question_id",
    describeRoute({
        operationId: "getCourseQuizQuestionById",
        summary: "Get quiz question by ID",
        description: "Retrieves a specific quiz question by ID",
        tags: ["Course Quiz"],
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
                        schema: resolver(courseQuizQuestionSchema),
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
    CourseQuizController.getCourseQuizQuestionById
);

app.get(
    "/course/:course_id/:quiz_id/questions",
    describeRoute({
        operationId: "getCourseQuizQuestionByCourseIDAndByQuizID",
        summary: "Get quiz questions by course and quiz ID",
        description: "Retrieves all questions for a specific quiz in a course",
        tags: ["Course Quiz"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
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
                        schema: resolver(getCourseQuizQuestionsResponseSchema),
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
    CourseQuizController.getCourseQuizQuestionByCourseIDAndByQuizID
);

app.put(
    "/questions/:question_id",
    describeRoute({
        operationId: "updateCourseQuizQuestionById",
        summary: "Update quiz question",
        description: "Updates a specific quiz question by ID",
        tags: ["Course Quiz"],
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
                        schema: resolver(
                            updateCourseQuizQuestionResponseSchema
                        ),
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
    zValidator("json", updateCourseQuizQuestionRequestBodySchema),
    CourseQuizController.updateCourseQuizQuestionById
);

app.delete(
    "/questions/:question_id",
    describeRoute({
        operationId: "deleteCourseQuizQuestionById",
        summary: "Delete quiz question",
        description: "Deletes a specific quiz question by ID (soft delete)",
        tags: ["Course Quiz"],
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
                        schema: resolver(courseQuizQuestionSchema),
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
    CourseQuizController.deleteCourseQuizQuestionById
);

app.post(
    "/:course_id/:quiz_id/attempt",
    describeRoute({
        operationId: "createCourseQuizAttempt",
        summary: "Create quiz attempt",
        description: "Records a student's attempt at answering a quiz question",
        tags: ["Course Quiz"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
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
                        schema: resolver(createCourseQuizAttemptResponseSchema),
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
    zValidator("json", createCourseQuizAttemptRequestBodySchema),
    CourseQuizController.createCourseQuizAttempt
);

app.get(
    "/attempt/:quiz_id/:student_id",
    describeRoute({
        operationId: "getCourseQuizAttemptByQuizIdAndStudentId",
        summary: "Get quiz attempts by quiz and student ID",
        description: "Retrieves all attempts for a specific quiz by a student",
        tags: ["Course Quiz"],
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
                        schema: resolver(getCourseQuizAttemptsResponseSchema),
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
    CourseQuizController.getCourseQuizAttemptByQuizIdAndStudentId
);

app.get(
    "/course/:course_id/:quiz_id/attempt",
    describeRoute({
        operationId: "getCourseQuizAttemptByCampusIdAndCourseIdAndQuizId",
        summary: "Get quiz attempts by course and quiz ID",
        description: "Retrieves all attempts for a specific quiz in a course",
        tags: ["Course Quiz"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
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
                        schema: resolver(getCourseQuizAttemptsResponseSchema),
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
    CourseQuizController.getCourseQuizAttemptByCampusIdAndCourseIdAndQuizId
);

app.post(
    "/:course_id/:quiz_id/submission",
    describeRoute({
        operationId: "createCourseQuizSubmission",
        summary: "Create quiz submission",
        description:
            "Creates a final submission for a quiz, calculating the score",
        tags: ["Course Quiz"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
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
                        schema: resolver(courseQuizSubmissionSchema),
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
    CourseQuizController.createCourseQuizSubmission
);

app.get(
    "/submission/:submission_id",
    describeRoute({
        operationId: "getCourseQuizSubmissionById",
        summary: "Get quiz submission by ID",
        description: "Retrieves a specific quiz submission by ID",
        tags: ["Course Quiz"],
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
                        schema: resolver(courseQuizSubmissionSchema),
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
    CourseQuizController.getCourseQuizSubmissionById
);

app.get(
    "/submission/:quiz_id/student",
    describeRoute({
        operationId: "getCourseQuizSubmissionByQuizIdAndStudentId",
        summary: "Get quiz submission by quiz ID and current student",
        description:
            "Retrieves the submission for a specific quiz by the current logged-in student",
        tags: ["Course Quiz"],
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
                description: "Submission details",
                content: {
                    "application/json": {
                        schema: resolver(courseQuizSubmissionSchema),
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
    CourseQuizController.getCourseQuizSubmissionByQuizIdAndStudentId
);

app.get(
    "/submission/:quiz_id/:student_id",
    describeRoute({
        operationId: "getCourseQuizSubmissionByQuizIdAndStudentId",
        summary: "Get quiz submission by quiz ID and student ID",
        description:
            "Retrieves the submission for a specific quiz by a specific student",
        tags: ["Course Quiz"],
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
                description: "Submission details",
                content: {
                    "application/json": {
                        schema: resolver(courseQuizSubmissionSchema),
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
    CourseQuizController.getCourseQuizSubmissionByQuizIdAndStudentId
);

app.get(
    "/course/:course_id/submissions",
    describeRoute({
        operationId: "getCourseQuizSubmissionByCampusIdAndCourseId",
        summary: "Get all quiz submissions for a course",
        description: "Retrieves all quiz submissions for a specific course",
        tags: ["Course Quiz"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "List of submissions",
                content: {
                    "application/json": {
                        schema: resolver(
                            getCourseQuizSubmissionsResponseSchema
                        ),
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
    CourseQuizController.getCourseQuizSubmissionByCampusIdAndCourseId
);

app.put(
    "/submission/:submission_id",
    describeRoute({
        operationId: "updateCourseQuizSubmissionById",
        summary: "Update quiz submission",
        description: "Updates a specific quiz submission by ID",
        tags: ["Course Quiz"],
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
                        schema: resolver(
                            updateCourseQuizSubmissionResponseSchema
                        ),
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
    zValidator("json", updateCourseQuizSubmissionRequestBodySchema),
    CourseQuizController.updateCourseQuizSubmissionById
);

export default app;
