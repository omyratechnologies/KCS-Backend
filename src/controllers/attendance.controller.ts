import { Context } from "hono";

import { AttendanceService } from "@/services/attendance.service";

type AttendanceStatus = "present" | "absent" | "late" | "leave";

export class AttendanceController {
    public static readonly markAttendance = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                date,
                status,
                user_id,
            }: {
                date: string;
                status: string;
                user_id: string;
            } = await ctx.req.json();

            const attendance = await AttendanceService.markAttendance({
                date: new Date(date),
                status: status as AttendanceStatus,
                user_id,
                campus_id,
            });

            return ctx.json(attendance);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error in marking attendance",
                    error,
                },
                500
            );
        }
    };

    public static readonly updateAttendance = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                date,
                status,
                user_id,
            }: {
                date: string;
                user_id: string;
                status: string;
            } = await ctx.req.json();

            const attendance = await AttendanceService.updateAttendance(
                {
                    user_id,
                    campus_id,
                    date: new Date(date),
                },
                {
                    data: {
                        status: status as AttendanceStatus,
                    },
                }
            );

            return ctx.json(attendance);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error in updating attendance",
                    error,
                },
                500
            );
        }
    };

    public static readonly getAttendancesByDate = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");

        const { date } = ctx.req.param();

        const attendance = await AttendanceService.getAttendancesByDate(
            campus_id,
            new Date(date)
        );

        return ctx.json(attendance);
    };

    public static readonly getAttendanceByUserId = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");

        const { user_id } = ctx.req.param();

        const attendance = await AttendanceService.getAttendanceByUserId(
            campus_id,
            user_id
        );

        return ctx.json(attendance);
    };

    public static readonly getAttendanceByCampusId = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");

        const { from_date, to_date } = ctx.req.query();

        const attendance = await AttendanceService.getAttendanceByCampusId(
            campus_id,
            new Date(from_date),
            new Date(to_date)
        );

        return ctx.json(attendance);
    };

    public static readonly getAttendanceByClassIdAndDate = async (
        ctx: Context
    ) => {
        const campus_id = ctx.get("campus_id");

        const {
            class_id,
            date,
        }: {
            class_id: string;
            date: string;
        } = await ctx.req.json();

        const attendance =
            await AttendanceService.getAttendanceByClassIdAndDate(
                campus_id,
                class_id,
                new Date(date)
            );

        return ctx.json(attendance);
    };
}
