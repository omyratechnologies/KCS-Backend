import z from "zod";

import "zod-openapi/extend";

// Schema for class quiz data
export const classQuizSchema = z
    .object({
        id: z.string().openapi({ example: "quiz123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        class_id: z.string().openapi({ example: "class123" }),
        quiz_name: z.string().openapi({ example: "Midterm Math Quiz" }),
        quiz_description: z.string().openapi({
            example: "A comprehensive quiz covering algebra and geometry",
        }),
        quiz_meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                duration_minutes: 60,
                passing_score: 70,
                total_points: 100,
            },
        }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
    })
    .openapi({ ref: "ClassQuiz" });

// Schema for quiz question
export const quizQuestionSchema = z
    .object({
        id: z.string().openapi({ example: "question123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        class_id: z.string().openapi({ example: "class123" }),
        quiz_id: z.string().openapi({ example: "quiz123" }),
        question_text: z.string().openapi({
            example: "What is the formula for the area of a circle?",
        }),
        question_type: z.string().openapi({ example: "multiple_choice" }),
        options: z.array(z.string()).openapi({
            example: ["πr", "2πr", "πr²", "2πr²"],
        }),
        correct_answer: z.string().openapi({ example: "πr²" }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                points: 5,
                difficulty: "medium",
            },
        }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
    })
    .openapi({ ref: "QuizQuestion" });

// Schema for quiz attempt
export const quizAttemptSchema = z
    .object({
        id: z.string().openapi({ example: "attempt123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        class_id: z.string().openapi({ example: "class123" }),
        quiz_id: z.string().openapi({ example: "quiz123" }),
        question_id: z.string().openapi({ example: "question123" }),
        user_id: z.string().openapi({ example: "student123" }),
        attempt_data: z.record(z.string(), z.any()).openapi({
            example: {
                option_id: "option2",
                answer: "πr²",
            },
        }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {},
        }),
        created_at: z.string().openapi({ example: "2023-05-15T10:30:00Z" }),
        updated_at: z.string().openapi({ example: "2023-05-15T10:30:00Z" }),
    })
    .openapi({ ref: "QuizAttempt" });

// Schema for quiz submission
export const quizSubmissionSchema = z
    .object({
        id: z.string().openapi({ example: "submission123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        class_id: z.string().openapi({ example: "class123" }),
        quiz_id: z.string().openapi({ example: "quiz123" }),
        user_id: z.string().openapi({ example: "student123" }),
        submission_date: z.string().openapi({ example: "2023-05-15T11:00:00Z" }),
        score: z.number().openapi({ example: 85 }),
        feedback: z.string().openapi({
            example: "Good work! Review chapter 5 for questions you missed.",
        }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                time_taken_minutes: 45,
                attempts_per_question: { question123: 1, question124: 2 },
            },
        }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-05-15T11:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-05-15T11:00:00Z" }),
    })
    .openapi({ ref: "QuizSubmission" });

// Create Class Quiz Request
export const createClassQuizRequestBodySchema = z
    .object({
        quiz_name: z.string().openapi({ example: "Midterm Math Quiz" }),
        quiz_description: z.string().openapi({
            example: "A comprehensive quiz covering algebra and geometry",
        }),
        quiz_meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                duration_minutes: 60,
                passing_score: 70,
                total_points: 100,
            },
        }),
    })
    .openapi({ ref: "CreateClassQuizRequest" });

export const createClassQuizResponseSchema = classQuizSchema.openapi({
    ref: "CreateClassQuizResponse",
});

// Create Quiz Questions Request
export const createQuizQuestionsRequestBodySchema = z
    .object({
        questionBank: z
            .array(
                z.object({
                    question_text: z.string().openapi({
                        example: "What is the formula for the area of a circle?",
                    }),
                    question_type: z.string().openapi({ example: "multiple_choice" }),
                    options: z.array(z.string()).openapi({
                        example: ["πr", "2πr", "πr²", "2πr²"],
                    }),
                    correct_answer: z.string().openapi({ example: "πr²" }),
                    meta_data: z.record(z.string(), z.any()).openapi({
                        example: {
                            points: 5,
                            difficulty: "medium",
                        },
                    }),
                })
            )
            .openapi({
                example: [
                    {
                        question_text: "What is the formula for the area of a circle?",
                        question_type: "multiple_choice",
                        options: ["πr", "2πr", "πr²", "2πr²"],
                        correct_answer: "πr²",
                        meta_data: { points: 5, difficulty: "medium" },
                    },
                    {
                        question_text: "Solve for x: 2x + 5 = 15",
                        question_type: "multiple_choice",
                        options: ["5", "10", "7.5", "5.5"],
                        correct_answer: "5",
                        meta_data: { points: 5, difficulty: "easy" },
                    },
                ],
            }),
    })
    .openapi({ ref: "CreateQuizQuestionsRequest" });

export const createQuizQuestionsResponseSchema = z.string().openapi({
    example: "Class Quiz Questions created successfully",
    ref: "CreateQuizQuestionsResponse",
});

// Update Quiz Question Request
export const updateQuizQuestionRequestBodySchema = z
    .object({
        question_text: z.string().openapi({
            example: "What is the formula for the area of a circle?",
        }),
        question_type: z.string().openapi({ example: "multiple_choice" }),
        options: z.array(z.string()).openapi({
            example: ["πr", "2πr", "πr²", "2πr²"],
        }),
        correct_answer: z.string().openapi({ example: "πr²" }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                points: 10,
                difficulty: "hard",
            },
        }),
    })
    .openapi({ ref: "UpdateQuizQuestionRequest" });

export const updateQuizQuestionResponseSchema = quizQuestionSchema.openapi({
    ref: "UpdateQuizQuestionResponse",
});

// Create Quiz Attempt Request
export const createQuizAttemptRequestBodySchema = z
    .object({
        question_id: z.string().openapi({ example: "question123" }),
        opted_answer: z
            .object({
                option_id: z.string().openapi({ example: "option2" }),
                answer: z.string().openapi({ example: "πr²" }),
            })
            .openapi({
                example: {
                    option_id: "option2",
                    answer: "πr²",
                },
            }),
    })
    .openapi({ ref: "CreateQuizAttemptRequest" });

export const createQuizAttemptResponseSchema = quizAttemptSchema.openapi({
    ref: "CreateQuizAttemptResponse",
});

// Update Quiz Submission Request
export const updateQuizSubmissionRequestBodySchema = z
    .object({
        campus_id: z.string().optional().openapi({ example: "campus123" }),
        class_id: z.string().optional().openapi({ example: "class123" }),
        quiz_id: z.string().optional().openapi({ example: "quiz123" }),
        user_id: z.string().optional().openapi({ example: "student123" }),
        submission_date: z.string().optional().openapi({ example: "2023-05-15T11:00:00Z" }),
        score: z.number().optional().openapi({ example: 90 }),
        feedback: z.string().optional().openapi({ example: "Excellent work!" }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: {
                    time_taken_minutes: 40,
                    attempts_per_question: { question123: 1, question124: 1 },
                },
            }),
    })
    .openapi({ ref: "UpdateQuizSubmissionRequest" });

export const updateQuizSubmissionResponseSchema = quizSubmissionSchema.openapi({
    ref: "UpdateQuizSubmissionResponse",
});

// Get Class Quizzes Response
export const getClassQuizzesResponseSchema = z.array(classQuizSchema).openapi({ ref: "GetClassQuizzesResponse" });

// Get Quiz Questions Response
export const getQuizQuestionsResponseSchema = z.array(quizQuestionSchema).openapi({ ref: "GetQuizQuestionsResponse" });

// Get Quiz Attempts Response
export const getQuizAttemptsResponseSchema = z.array(quizAttemptSchema).openapi({ ref: "GetQuizAttemptsResponse" });

// Get Quiz Submissions Response
export const getQuizSubmissionsResponseSchema = z
    .array(quizSubmissionSchema)
    .openapi({ ref: "GetQuizSubmissionsResponse" });

// Quiz Statistics Response
export const quizStatisticsResponseSchema = z
    .object({
        total_attempts: z.number().openapi({ example: 25 }),
        average_score: z.number().openapi({ example: 85.4 }),
        highest_score: z.number().openapi({ example: 100 }),
        lowest_score: z.number().openapi({ example: 65 }),
        completion_rate: z.number().openapi({ example: 25 }),
        submissions: z.array(quizSubmissionSchema).openapi({
            description: "Array of all quiz submissions for this quiz",
        }),
    })
    .openapi({ ref: "QuizStatisticsResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
