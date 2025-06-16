import { Context } from "hono";

import { CourseQuizService } from "@/services/course_quiz.service";

export class CourseQuizController {
    public static readonly createCourseQuiz = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { course_id } = ctx.req.param();

            const { quiz_name, quiz_description, quiz_meta_data } =
                await ctx.req.json();

            const result = await CourseQuizService.createCourseQuiz(
                campus_id,
                course_id,
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

    public static readonly getCourseQuizById = async (ctx: Context) => {
        try {
            const { quiz_id } = ctx.req.param();
            const result = await CourseQuizService.getCourseQuizById(quiz_id);

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

    public static readonly getCourseQuizByCourseID = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { course_id } = ctx.req.param();

            const result = await CourseQuizService.getCourseQuizByCourseID(
                campus_id,
                course_id
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

    public static readonly updateCourseQuizById = async (ctx: Context) => {
        try {
            const { quiz_id } = ctx.req.param();

            const { quiz_name, quiz_description, quiz_meta_data } =
                await ctx.req.json();

            const result = await CourseQuizService.updateCourseQuizById(
                quiz_id,
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

    public static readonly deleteCourseQuizById = async (ctx: Context) => {
        try {
            const { quiz_id } = ctx.req.param();

            const result =
                await CourseQuizService.deleteCourseQuizById(quiz_id);

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

    public static readonly createCourseQuizQuestions = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { quiz_id, course_id } = ctx.req.param();

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

            const result = await CourseQuizService.createCourseQuizQuestions(
                campus_id,
                course_id,
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

    public static readonly getCourseQuizQuestionById = async (ctx: Context) => {
        try {
            const { question_id } = ctx.req.param();

            const result =
                await CourseQuizService.getCourseQuizQuestionById(question_id);

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

    public static readonly getCourseQuizQuestionByCourseIDAndByQuizID = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { course_id, quiz_id } = ctx.req.param();

            const result =
                await CourseQuizService.getCourseQuizQuestionByCourseIDAndByQuizID(
                    campus_id,
                    course_id,
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

    public static readonly updateCourseQuizQuestionById = async (
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

            const result = await CourseQuizService.updateCourseQuizQuestionById(
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

    public static readonly deleteCourseQuizQuestionById = async (
        ctx: Context
    ) => {
        try {
            const { question_id } = ctx.req.param();

            const result =
                await CourseQuizService.deleteCourseQuizQuestionById(
                    question_id
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

    public static readonly createCourseQuizAttempt = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const student_id = ctx.get("user_id");
            const { course_id, quiz_id } = ctx.req.param();

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

            const result = await CourseQuizService.createCourseQuizAttempt(
                campus_id,
                course_id,
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

    public static readonly getCourseQuizAttemptByQuizIdAndStudentId = async (
        ctx: Context
    ) => {
        try {
            const { quiz_id, student_id } = ctx.req.param();

            const result =
                await CourseQuizService.getCourseQuizAttemptByQuizIdAndStudentId(
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

    public static readonly getCourseQuizAttemptByCampusIdAndCourseIdAndQuizId =
        async (ctx: Context) => {
            try {
                const campus_id = ctx.get("campus_id");

                const { course_id, quiz_id } = ctx.req.param();

                const result =
                    await CourseQuizService.getCourseQuizAttemptByCampusIdAndCourseIdAndQuizId(
                        campus_id,
                        course_id,
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

    public static readonly createCourseQuizSubmission = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            const { quiz_id, course_id } = ctx.req.param();

            const result = await CourseQuizService.createCourseQuizSubmission(
                campus_id,
                course_id,
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

    public static readonly getCourseQuizSubmissionById = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const result =
                await CourseQuizService.getCourseQuizSubmissionById(
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

    public static readonly getCourseQuizSubmissionByQuizIdAndStudentId = async (
        ctx: Context
    ) => {
        try {
            const user_id = ctx.get("user_id");

            const { quiz_id } = ctx.req.param();

            const result =
                await CourseQuizService.getCourseQuizSubmissionByQuizIdAndStudentId(
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

    public static readonly getCourseQuizSubmissionByCampusIdAndCourseId =
        async (ctx: Context) => {
            try {
                const campus_id = ctx.get("campus_id");

                const { course_id } = ctx.req.param();

                const result =
                    await CourseQuizService.getCourseQuizSubmissionByCampusIdAndCourseId(
                        campus_id,
                        course_id
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

    public static readonly updateCourseQuizSubmissionById = async (
        ctx: Context
    ) => {
        try {
            const { submission_id } = ctx.req.param();

            const data: {
                campus_id: string;
                course_id: string;
                quiz_id: string;
                user_id: string;
                submission_date: Date;
                score: number;
                feedback: string;
                meta_data: object;
            } = await ctx.req.json();

            const result =
                await CourseQuizService.updateCourseQuizSubmissionById(
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
}
