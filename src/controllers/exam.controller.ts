import { Context } from "hono";

import { ExamService } from "@/services/exam.service";

export class ExamController {
    // create examination
    public static readonly createExamTerm = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { name, start_date, end_date, meta_data } =
                await ctx.req.json();

            const exam_term = await ExamService.createExamTerm(campus_id, {
                name,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                meta_data,
            });

            return ctx.json(exam_term);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // get all exam terms
    public static readonly getExamTerms = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const exam_terms = await ExamService.getExamTerms(campus_id);

            return ctx.json(exam_terms);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // get exam term by id
    public static readonly getExamTermById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const exam_term = await ExamService.getExamTermById(id);

            return ctx.json(exam_term);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // update exam term
    public static readonly updateExamTerm = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");
            const { name, start_date, end_date, meta_data } =
                await ctx.req.json();

            const exam_term = await ExamService.updateExamTerm(id, {
                name,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                meta_data,
            });

            return ctx.json(exam_term);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // delete exam term
    public static readonly deleteExamTerm = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const exam_term = await ExamService.deleteExamTerm(id);

            return ctx.json(exam_term);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // get all examinations
    public static readonly getExaminations = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const examinations = await ExamService.getExaminations(campus_id);

            return ctx.json(examinations);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // get examination by id
    public static readonly getExaminationById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const examination = await ExamService.getExaminationById(id);

            return ctx.json(examination);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // update examination
    public static readonly updateExamination = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");
            const { subject_id, date, start_time, end_time, exam_term_id } =
                await ctx.req.json();

            const examination = await ExamService.updateExamination(id, {
                subject_id,
                date: new Date(date),
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                exam_term_id,
            });

            return ctx.json(examination);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // delete examination
    public static readonly deleteExamination = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const examination = await ExamService.deleteExamination(id);

            return ctx.json(examination);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // create examination
    public static readonly createExamination = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const exam_term_id = ctx.req.param("exam_term_id");
            const { subject_id, date, start_time, end_time, meta_data } =
                await ctx.req.json();

            const examination = await ExamService.createExamination(campus_id, {
                subject_id,
                date: new Date(date),
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                exam_term_id,
                meta_data,
            });

            return ctx.json(examination);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // getExaminationsByExamTermId
    public static readonly getExaminationsByExamTermId = async (
        ctx: Context
    ) => {
        try {
            const exam_term_id = ctx.req.param("exam_term_id");

            const examinations =
                await ExamService.getExaminationsByExamTermId(exam_term_id);

            return ctx.json(examinations);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // getExaminationsBySubjectId
    public static readonly getExaminationsBySubjectId = async (
        ctx: Context
    ) => {
        try {
            const subject_id = ctx.req.param("subject_id");

            const examinations =
                await ExamService.getExaminationsBySubjectId(subject_id);

            return ctx.json(examinations);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };

    // getExaminationsByDate
    public static readonly getExaminationsByDate = async (ctx: Context) => {
        try {
            const date = ctx.req.param("date");

            const examinations = await ExamService.getExaminationsByDate(
                new Date(date)
            );

            return ctx.json(examinations);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        data: error.message,
                    },
                    500
                );
            }
        }
    };
}
