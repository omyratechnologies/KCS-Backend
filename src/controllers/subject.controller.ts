import { Context } from "hono";

import { ISubject } from "@/models/subject.model";
import { SubjectService } from "@/services/subject.service";

export class SubjectController {
    public static readonly createSubject = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const {
                subjectData,
            }: {
                subjectData: Partial<ISubject>;
            } = await ctx.req.json();

            const subject = await SubjectService.createSubject(campus_id, subjectData);

            return ctx.json(subject);
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
    public static readonly getAllSubjects = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const subjects = await SubjectService.getAllSubjects(campus_id);

            return ctx.json(subjects);
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
    public static readonly getSubjectById = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");

            const subject = await SubjectService.getSubjectById(subject_id);

            return ctx.json(subject);
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

    public static readonly updateSubject = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");

            const data: Partial<ISubject> = await ctx.req.json();

            const subject = await SubjectService.updateSubject(subject_id, data);

            return ctx.json(subject);
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

    public static readonly deleteSubject = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");

            const subject = await SubjectService.deleteSubject(subject_id);

            return ctx.json(subject);
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

    // getAllTeacherForASubjectById
    public static readonly getAllTeacherForASubjectById = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");

            const teachers = await SubjectService.getAllTeacherForASubjectById(subject_id);

            return ctx.json(teachers);
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

    // getAllClassesForASubjectById
    public static readonly getAllClassesForASubjectById = async (ctx: Context) => {
        try {
            const subject_id = ctx.req.param("subject_id");

            const classes = await SubjectService.getAllClassesForASubjectById(subject_id);

            return ctx.json(classes);
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

    // getAllSubjectAssignments
    public static readonly getAllSubjectAssignments = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const query = ctx.req.query();

            const filters = {
                search: query.search as string,
                academic_year: query.academic_year as string,
                class_id: query.class_id as string,
                subject_id: query.subject_id as string,
                teacher_id: query.teacher_id as string,
            };

            const assignments = await SubjectService.getAllSubjectAssignments(campus_id, filters);

            return ctx.json({
                success: true,
                data: assignments,
                total: assignments.length,
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
}
