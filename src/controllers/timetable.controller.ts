import { Context } from "hono";

import { ITimetable } from "@/models/time_table.model";
import { TimetableService } from "@/services/timetable.service";

export class TimetableController {
    // Create
    public static readonly createTimetableBulk = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { class_id, timetableData } = await ctx.req.json();

            const timetable = await TimetableService.createTimetableBulk(
                campus_id,
                class_id,
                timetableData
            );

            return ctx.json(timetable);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Read by Campus ID and Class ID
    public static readonly getTimetableByCampusAndClass = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { class_id } = ctx.req.param();

            const timetable =
                await TimetableService.getTimetableByCampusAndClass(
                    campus_id,
                    class_id
                );

            return ctx.json(timetable);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Read by Campus ID and Teacher ID
    public static readonly getTimetableByCampusAndTeacher = async (
        ctx: Context
    ) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { teacher_id } = ctx.req.param();

            const timetable =
                await TimetableService.getTimetableByCampusAndTeacher(
                    campus_id,
                    teacher_id
                );

            return ctx.json(timetable);
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json({
                    success: false,
                    message: error.message,
                });
            }
        }
    };

    // Update by ID
    public static readonly updateTimetableById = async (ctx: Context) => {
        try {
            const { id } = ctx.req.param();

            const data: Partial<ITimetable> = await ctx.req.json();

            const timetable = await TimetableService.updateTimetableById(
                id,
                data
            );

            return ctx.json(timetable);
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
