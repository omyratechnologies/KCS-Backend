import { Context } from "hono";

import { AttendanceService } from "@/services/attendance.service";

type AttendanceStatus = "present" | "absent" | "late" | "leave";
type UserType = "Student" | "Teacher";

export class AttendanceController {
    public static readonly markAttendance = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const body = await ctx.req.json();

            // Support both single and bulk attendance marking
            if (body.user_ids && Array.isArray(body.user_ids)) {
                // Bulk attendance marking
                const {
                    date,
                    status,
                    user_ids,
                    class_id,
                    user_type = "Student",
                }: {
                    date: string;
                    status: string;
                    user_ids: string[];
                    class_id?: string;
                    user_type?: string;
                } = body;

                const attendance = await AttendanceService.markAttendance({
                    date: new Date(date),
                    status: status as AttendanceStatus,
                    user_ids,
                    class_id,
                    user_type: user_type as UserType,
                    campus_id,
                });

                return ctx.json(attendance);
            } else {
                // Single attendance marking (backwards compatibility)
                const {
                    date,
                    status,
                    user_id,
                    class_id,
                    user_type = "Student",
                }: {
                    date: string;
                    status: string;
                    user_id: string;
                    class_id?: string;
                    user_type?: string;
                } = body;

                const attendance = await AttendanceService.markAttendance({
                    date: new Date(date),
                    status: status as AttendanceStatus,
                    user_id,
                    class_id,
                    user_type: user_type as UserType,
                    campus_id,
                });

                return ctx.json(attendance);
            }
        } catch (error) {
            return ctx.json(
                {
                    message: "Error in marking attendance",
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                500
            );
        }
    };

    // New dedicated bulk attendance endpoint
    public static readonly markBulkAttendance = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                date,
                attendances,
            }: {
                date: string;
                attendances: Array<{
                    user_id: string;
                    status: string;
                    user_type?: string;
                }>;
            } = await ctx.req.json();

            const result = await AttendanceService.markBulkAttendance({
                date: new Date(date),
                attendances: attendances.map(att => ({
                    user_id: att.user_id,
                    status: att.status as AttendanceStatus,
                    user_type: (att.user_type as UserType) || "Student",
                })),
                campus_id,
            });

            return ctx.json(result);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error in marking bulk attendance",
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                500
            );
        }
    };

    // New dedicated class attendance endpoint
    public static readonly markClassAttendance = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                class_id,
                date,
                attendances,
            }: {
                class_id: string;
                date: string;
                attendances: Array<{
                    user_id: string;
                    status: string;
                    user_type?: string;
                }>;
            } = await ctx.req.json();

            const result = await AttendanceService.markClassAttendance({
                campus_id,
                class_id,
                date: new Date(date),
                attendances: attendances.map(att => ({
                    user_id: att.user_id,
                    status: att.status as AttendanceStatus,
                    user_type: (att.user_type as UserType) || "Student",
                })),
            });

            return ctx.json(result);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error in marking class attendance",
                    error: error instanceof Error ? error.message : 'Unknown error',
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
                user_type,
            }: {
                date: string;
                user_id: string;
                status: string;
                user_type?: string;
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
                        user_type: user_type as UserType,
                    },
                }
            );

            return ctx.json(attendance);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error in updating attendance",
                    error: error instanceof Error ? error.message : 'Unknown error',
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
