import { Context } from "hono";

import { ExamTimetableService } from "@/services/exam_timetable.service";

export class ExamTimetableController {
    // Create exam timetable
    public static readonly createExamTimetable = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                exam_term_id,
                exam_name,
                class_ids,
                start_date,
                end_date,
                subjects,
                meta_data,
            }: {
                exam_term_id: string;
                exam_name: string;
                class_ids: string[];
                start_date: string;
                end_date: string;
                subjects: Array<{
                    subject_id: string;
                    exam_date: string;
                    start_time: string;
                    end_time: string;
                    room?: string;
                    invigilator_ids?: string[];
                }>;
                meta_data?: object;
            } = await ctx.req.json();

            const examTimetable = await ExamTimetableService.createExamTimetable(campus_id, {
                exam_term_id,
                exam_name,
                class_ids,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                subjects: subjects.map((subject) => ({
                    ...subject,
                    exam_date: new Date(subject.exam_date),
                })),
                meta_data,
            });

            return ctx.json({
                success: true,
                data: examTimetable,
                message: "Exam timetable created successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // Get all exam timetables for campus
    public static readonly getExamTimetables = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            if (!campus_id) {
                return ctx.json({
                    success: false,
                    data: null,
                    message: "Campus ID is required. For Super Admin, provide campus_id query parameter",
                }, 400);
            }

            const examTimetables = await ExamTimetableService.getExamTimetablesByCampus(campus_id);

            return ctx.json({
                success: true,
                data: examTimetables,
                message: "Exam timetables retrieved successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    data: null,
                    message: error instanceof Error ? error.message : "An unknown error occurred",
                },
                500
            );
        }
    };

    // Get exam timetable by ID
    public static readonly getExamTimetableById = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const examTimetable = await ExamTimetableService.getExamTimetableById(id);

            return ctx.json({
                success: true,
                data: examTimetable,
                message: "Exam timetable retrieved successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // Update exam timetable
    public static readonly updateExamTimetable = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const {
                exam_name,
                class_ids,
                start_date,
                end_date,
                subjects,
                is_published,
                meta_data,
            }: {
                exam_name?: string;
                class_ids?: string[];
                start_date?: string;
                end_date?: string;
                subjects?: Array<{
                    subject_id: string;
                    exam_date: string;
                    start_time: string;
                    end_time: string;
                    room?: string;
                    invigilator_ids?: string[];
                }>;
                is_published?: boolean;
                meta_data?: object;
            } = await ctx.req.json();

            const updateData: {
                exam_name?: string;
                class_ids?: string[];
                start_date?: Date;
                end_date?: Date;
                subjects?: Array<{
                    subject_id: string;
                    exam_date: Date;
                    start_time: string;
                    end_time: string;
                    room?: string;
                    invigilator_ids?: string[];
                }>;
                is_published?: boolean;
                meta_data?: object;
            } = {};

            if (exam_name !== undefined) {
                updateData.exam_name = exam_name;
            }
            if (class_ids !== undefined) {
                updateData.class_ids = class_ids;
            }
            if (start_date !== undefined) {
                updateData.start_date = new Date(start_date);
            }
            if (end_date !== undefined) {
                updateData.end_date = new Date(end_date);
            }
            if (is_published !== undefined) {
                updateData.is_published = is_published;
            }
            if (meta_data !== undefined) {
                updateData.meta_data = meta_data;
            }
            if (subjects !== undefined) {
                updateData.subjects = subjects.map((subject) => ({
                    ...subject,
                    exam_date: new Date(subject.exam_date),
                }));
            }

            const examTimetable = await ExamTimetableService.updateExamTimetable(id, updateData);

            return ctx.json({
                success: true,
                data: examTimetable,
                message: "Exam timetable updated successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // Publish exam timetable
    public static readonly publishExamTimetable = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const examTimetable = await ExamTimetableService.publishExamTimetable(id);

            return ctx.json({
                success: true,
                data: examTimetable,
                message: "Exam timetable published successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // Unpublish exam timetable
    public static readonly unpublishExamTimetable = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const examTimetable = await ExamTimetableService.unpublishExamTimetable(id);

            return ctx.json({
                success: true,
                data: examTimetable,
                message: "Exam timetable unpublished successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // Delete exam timetable
    public static readonly deleteExamTimetable = async (ctx: Context) => {
        try {
            const id = ctx.req.param("id");

            const examTimetable = await ExamTimetableService.deleteExamTimetable(id);

            return ctx.json({
                success: true,
                data: examTimetable,
                message: "Exam timetable deleted successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    data: null,
                    message: error instanceof Error ? error.message : "An unknown error occurred",
                },
                500
            );
        }
    };

    // Get published exam timetables (for students/parents)
    public static readonly getPublishedExamTimetables = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const examTimetables = await ExamTimetableService.getPublishedExamTimetables(campus_id);

            return ctx.json({
                success: true,
                data: examTimetables,
                message: "Published exam timetables retrieved successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // Get exam timetables by exam term
    public static readonly getExamTimetablesByExamTerm = async (ctx: Context) => {
        try {
            const exam_term_id = ctx.req.param("exam_term_id");

            const examTimetables = await ExamTimetableService.getExamTimetablesByExamTerm(exam_term_id);

            return ctx.json({
                success: true,
                data: examTimetables,
                message: "Exam timetables for exam term retrieved successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // Get exam timetable by class
    public static readonly getExamTimetableByClass = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const class_id = ctx.req.param("class_id");
            const user_type = ctx.get("user_type");

            // Check if user is admin (Admin or Super Admin can see all timetables)
            const isAdmin = user_type === "Admin" || user_type === "Super Admin";
            const isSuperAdmin = user_type === "Super Admin";

            const examTimetables = await ExamTimetableService.getExamTimetableByClass(campus_id, class_id, isAdmin, isSuperAdmin);

            return ctx.json({
                success: true,
                data: examTimetables,
                message: "Exam timetables for class retrieved successfully",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    // Check schedule conflicts
    public static readonly checkScheduleConflicts = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                exam_date,
                start_time,
                end_time,
                exclude_id,
            }: {
                exam_date: string;
                start_time: string;
                end_time: string;
                exclude_id?: string;
            } = await ctx.req.json();

            const conflictResult = await ExamTimetableService.checkScheduleConflicts(
                campus_id,
                new Date(exam_date),
                start_time,
                end_time,
                exclude_id
            );

            return ctx.json({
                success: true,
                data: conflictResult,
                message: conflictResult.has_conflicts ? "Schedule conflicts found" : "No schedule conflicts",
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        data: null,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
}
