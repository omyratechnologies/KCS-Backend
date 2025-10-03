import { Context } from "hono";

import { ITeacherData } from "@/models/teacher.model";
import { TeacherService } from "@/services/teacher.service";

export class TeacherController {
    // Create a new teacher
    public static readonly createTeacher = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const teacherData: Partial<ITeacherData> = await ctx.req.json();

            const teacher = await TeacherService.createTeacher(campus_id, teacherData);
            return ctx.json(teacher);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Get all teachers for a campus
    public static readonly getAllTeachers = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const query = ctx.req.query();

            const filters = {
                page: query.page ? Number.parseInt(query.page) : 1,
                limit: query.limit ? Number.parseInt(query.limit) : 20,
                search: query.search as string,
                user_id: query.user_id as string,
                email: query.email as string,
                name: query.name as string,
                is_active: query.is_active ? query.is_active === "true" : undefined,
                class_id: query.class_id as string,
                from: query.from ? new Date(query.from) : undefined,
                to: query.to ? new Date(query.to) : undefined,
                sort_by: query.sort_by as string,
                sort_order: (query.sort_order as "asc" | "desc") || "desc",
            };

            const result = await TeacherService.getAllTeachers(campus_id, filters);
            return ctx.json({
                success: true,
                data: result.teachers,
                pagination: result.pagination,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Get a teacher by ID
    public static readonly getTeacherById = async (ctx: Context) => {
        try {
            const teacherId = ctx.req.param("teacher_id");
            const teacher = await TeacherService.getTeacherById(teacherId);
            return ctx.json(teacher);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Update a teacher by ID
    public static readonly updateTeacher = async (ctx: Context) => {
        try {
            const teacherId = ctx.req.param("teacher_id");
            const teacherData: Partial<ITeacherData> = await ctx.req.json();
            const teacher = await TeacherService.updateTeacher(teacherId, teacherData);
            return ctx.json(teacher);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Delete a teacher by ID
    public static readonly deleteTeacher = async (ctx: Context) => {
        try {
            const teacherId = ctx.req.param("teacher_id");
            const teacher = await TeacherService.deleteTeacher(teacherId);
            return ctx.json(teacher);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Get all classes by teacher ID
    public static readonly getAllClassesByTeacherId = async (ctx: Context) => {
        try {
            const teacherId = ctx.req.param("teacher_id");
            const classes = await TeacherService.getAllClassesByTeacherId(teacherId);
            return ctx.json(classes);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Get all subjects by teacher ID
    public static readonly getAllSubjectsByTeacherId = async (ctx: Context) => {
        try {
            const teacherId = ctx.req.param("teacher_id");
            const subjects = await TeacherService.getAllSubjectsByTeacherId(teacherId);
            return ctx.json(subjects);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };
}
