import { Context } from "hono";

import { ITeacherData } from "@/models/teacher.model";
import { TeacherService } from "@/services/teacher.service";

export class TeacherController {
    // Create a new teacher
    public static readonly createTeacher = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const teacherData: Partial<ITeacherData> = await ctx.req.json();

            const teacher = await TeacherService.createTeacher(
                campus_id,
                teacherData
            );
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
            const teachers = await TeacherService.getAllTeachers(campus_id);
            return ctx.json(teachers);
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
            const teacher = await TeacherService.updateTeacher(
                teacherId,
                teacherData
            );
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
            const classes =
                await TeacherService.getAllClassesByTeacherId(teacherId);
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
            const subjects =
                await TeacherService.getAllSubjectsByTeacherId(teacherId);
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
