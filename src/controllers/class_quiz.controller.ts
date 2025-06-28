import { Context } from "hono";

import { ClassQuizService } from "@/services/class_quiz.service";

export class ClassQuizController {
    public static readonly createClassQuiz = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { class_id } = ctx.req.param();

            const { quiz_name, quiz_description, quiz_meta_data } =
                await ctx.req.json();

            const result = await ClassQuizService.createClassQuiz(
                campus_id,
                class_id,
                {
                    quiz_name,
                    quiz_description,
                    quiz_meta_data,
                }
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizById = async (ctx: Context) => {
        try {
            const { quiz_id } = ctx.req.param();
            const result = await ClassQuizService.getClassQuizById(quiz_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizByClassID = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { class_id } = ctx.req.param();

            const result = await ClassQuizService.getClassQuizByClassID(
                campus_id,
                class_id
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly updateClassQuizById = async (ctx: Context) => {
        try {
            const { quiz_id } = ctx.req.param();

            const { quiz_name, quiz_description, quiz_meta_data } =
                await ctx.req.json();

            const result = await ClassQuizService.updateClassQuizById(quiz_id, {
                quiz_name,
                quiz_description,
                quiz_meta_data,
            });

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly deleteClassQuizById = async (ctx: Context) => {
        try {
            const { quiz_id } = ctx.req.param();

            const result = await ClassQuizService.deleteClassQuizById(quiz_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly createClassQuizQuestions = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { quiz_id, class_id } = ctx.req.param();

            const {
                questionBank,
            }: {
                questionBank: {
                    question_text: string;
                    question_type: string;
                    options: string[];
                    correct_answer: string;
                    meta_data: object;
                }[];
            } = await ctx.req.json();

            const result = await ClassQuizService.createClassQuizQuestions(
                campus_id,
                class_id,
                quiz_id,
                questionBank
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizQuestionById = async (ctx: Context) => {
        try {
            const { question_id } = ctx.req.param();

            const result =
                await ClassQuizService.getClassQuizQuestionById(question_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizQuestionByClassIDAndByQuizID = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { class_id, quiz_id } = ctx.req.param();

            const result =
                await ClassQuizService.getClassQuizQuestionByClassIDAndByQuizID(
                    campus_id,
                    class_id,
                    quiz_id
                );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly updateClassQuizQuestionById = async (
        ctx: Context
    ) => {
        try {
            const { question_id } = ctx.req.param();

            const {
                question_text,
                question_type,
                options,
                correct_answer,
                meta_data,
            }: {
                question_text: string;
                question_type: string;
                options: string[];
                correct_answer: string;
                meta_data: object;
            } = await ctx.req.json();

            const result = await ClassQuizService.updateClassQuizQuestionById(
                question_id,
                {
                    question_text,
                    question_type,
                    options,
                    correct_answer,
                    meta_data,
                }
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly deleteClassQuizQuestionById = async (
        ctx: Context
    ) => {
        try {
            const { question_id } = ctx.req.param();

            const result =
                await ClassQuizService.deleteClassQuizQuestionById(question_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly createClassQuizAttempt = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const student_id = ctx.get("user_id");
            const { class_id, quiz_id } = ctx.req.param();

            const {
                question_id,
                opted_answer,
            }: {
                question_id: string;
                opted_answer: {
                    option_id: string;
                    answer: string;
                };
            } = await ctx.req.json();

            const result = await ClassQuizService.createClassQuizAttempt(
                campus_id,
                class_id,
                {
                    quiz_id,
                    student_id,
                    question_id,
                    opted_answer,
                }
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizAttemptByQuizIdAndStudentId = async (
        ctx: Context
    ) => {
        try {
            const { quiz_id, student_id } = ctx.req.param();

            const result =
                await ClassQuizService.getClassQuizAttemptByQuizIdAndStudentId(
                    quiz_id,
                    student_id
                );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizAttemptByCampusIdAndClassIdAndQuizId =
        async (ctx: Context) => {
            try {
                const campus_id = ctx.get("campus_id");

                const { class_id, quiz_id } = ctx.req.param();

                const result =
                    await ClassQuizService.getClassQuizAttemptByCampusIdAndClassIdAndQuizId(
                        campus_id,
                        class_id,
                        quiz_id
                    );

                return ctx.json(result);
            } catch (error) {
                if (error instanceof Error) {
                    return ctx.json(
                        {
                            message: error.message,
                        },
                        500
                    );
                }
            }
        };

    public static readonly createClassQuizSubmission = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const { quiz_id, class_id } = ctx.req.param();

            const result = await ClassQuizService.createClassQuizSubmission(
                campus_id,
                class_id,
                quiz_id,
                user_id
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizSubmissionById = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const result =
                await ClassQuizService.getClassQuizSubmissionById(
                    submission_id
                );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizSubmissionByQuizIdAndStudentId = async (
        ctx: Context
    ) => {
        try {
            const user_id = ctx.get("user_id");

            const { quiz_id } = ctx.req.param();

            const result =
                await ClassQuizService.getClassQuizSubmissionByQuizIdAndStudentId(
                    quiz_id,
                    user_id
                );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getClassQuizSubmissionByCampusIdAndClassId = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { class_id } = ctx.req.param();

            const result =
                await ClassQuizService.getClassQuizSubmissionByCampusIdAndClassId(
                    campus_id,
                    class_id
                );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly updateClassQuizSubmissionById = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const data: {
                campus_id: string;
                class_id: string;
                quiz_id: string;
                user_id: string;
                submission_date: Date;
                score: number;
                feedback: string;
                meta_data: object;
            } = await ctx.req.json();

            const result = await ClassQuizService.updateClassQuizSubmissionById(
                submission_id,
                data
            );

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getAllClassQuizzes = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const result = await ClassQuizService.getAllClassQuizzes(campus_id);

            return ctx.json(result);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // ======================= NEW SESSION-BASED QUIZ METHODS =======================

    public static readonly startQuizSession = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { class_id, quiz_id } = ctx.req.param();

            const result = await ClassQuizService.startQuizSession(
                campus_id,
                class_id,
                quiz_id,
                user_id
            );

            return ctx.json({
                success: true,
                message: "Quiz session started successfully",
                data: result,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    public static readonly getQuizSession = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { session_token } = ctx.req.param();

            const result = await ClassQuizService.getQuizSession(
                session_token,
                user_id
            );

            return ctx.json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    public static readonly submitQuizAnswer = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { session_token } = ctx.req.param();
            const { question_id, answer } = await ctx.req.json();

            if (!question_id || !answer) {
                return ctx.json(
                    {
                        success: false,
                        message: "Question ID and answer are required",
                    },
                    400
                );
            }

            const result = await ClassQuizService.submitAnswer(
                session_token,
                user_id,
                question_id,
                answer
            );

            return ctx.json({
                success: true,
                message: "Answer submitted successfully",
                data: result,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    public static readonly completeQuizSession = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { session_token } = ctx.req.param();

            const result = await ClassQuizService.completeQuiz(
                session_token,
                user_id
            );

            return ctx.json({
                success: true,
                message: "Quiz completed successfully",
                data: result,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    // ======================= UPDATED LEGACY METHODS =======================

    // ======================= TIMEOUT HANDLING CONTROLLERS =======================

    public static readonly checkExpiredSessions = async (ctx: Context) => {
        try {
            const result = await ClassQuizService.checkAndHandleExpiredSessions();

            return ctx.json({
                success: true,
                message: `Processed ${result.length} expired sessions`,
                data: result,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    public static readonly getQuizSessionHistory = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { quiz_id } = ctx.req.query();

            const result = await ClassQuizService.getQuizSessionHistory(
                user_id,
                quiz_id
            );

            return ctx.json({
                success: true,
                data: result,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    400
                );
            }
        }
    };

    public static readonly abandonQuizSession = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { session_token } = ctx.req.param();

            const result = await ClassQuizService.abandonQuizSession(
                session_token,
                user_id
            );

            return ctx.json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    400
                );
            }
        }
    };
}
