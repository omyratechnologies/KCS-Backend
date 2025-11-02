import { Context } from "hono";

import { AttendanceService } from "@/services/attendance.service";

type AttendanceStatus = "present" | "absent" | "late" | "leave";
type UserType = "Student" | "Teacher";

export class AttendanceController {
    // Universal attendance marking endpoint
    public static readonly markClassAttendance = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                class_id,
                date,
                attendances,
            }: {
                class_id?: string; // Now optional
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
                attendances: attendances.map((att) => ({
                    user_id: att.user_id,
                    status: att.status as AttendanceStatus,
                    user_type: (att.user_type as UserType) || "Student",
                })),
            });

            return ctx.json(result);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error in marking attendance",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    public static readonly updateAttendance = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const {
                user_id,
                date,
                status,
            }: {
                user_id: string;
                date: string;
                status: AttendanceStatus;
            } = await ctx.req.json();

            const parsedDate = new Date(date);
            
            // Normalize to UTC start of day
            parsedDate.setUTCHours(0, 0, 0, 0);

            await AttendanceService.updateAttendance(
                {
                    user_id,
                    campus_id,
                    date: parsedDate,
                },
                {
                    data: {
                        status: status,
                    },
                }
            );

            return ctx.json({
                success: true,
                message: "Attendance updated successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    message: "Error in updating attendance",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    public static readonly getAttendanceByCampusId = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");

            const { from_date, to_date, class_ids, user_ids, status, page, limit } = ctx.req.query();

            if (!from_date || !to_date) {
                return ctx.json({ error: "from_date and to_date are required" }, 400);
            }

            const parsedFromDate = new Date(from_date);
            const parsedToDate = new Date(to_date);

            if (Number.isNaN(parsedFromDate.getTime())) {
                return ctx.json({ error: "Invalid from_date format. Use YYYY-MM-DD" }, 400);
            }

            if (Number.isNaN(parsedToDate.getTime())) {
                return ctx.json({ error: "Invalid to_date format. Use YYYY-MM-DD" }, 400);
            }

            if (parsedFromDate > parsedToDate) {
                return ctx.json({ error: "Invalid dates check from and to" }, 400);
            }

            const pageNum = page ? parseInt(page) : 1;
            const limitNum = limit ? parseInt(limit) : undefined;

            const result = await AttendanceService.getAttendanceByCampusId(
                campus_id,
                parsedFromDate,
                parsedToDate,
                {
                    class_ids: class_ids ? class_ids.split(',') : undefined,
                    user_ids: user_ids ? user_ids.split(',') : undefined,
                    status: status ? status.split(',') as ("present" | "absent" | "late" | "leave")[] : undefined,
                    page: pageNum,
                    limit: limitNum,
                }
            );

            // Always return structured response for consistency
            return ctx.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            return ctx.json(
                {
                    message: "Error fetching campus attendance",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    // Get comprehensive attendance report for a class
    public static readonly getClassAttendanceReport = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const class_id = ctx.req.param("class_id");

            if (!class_id) {
                return ctx.json({ error: "class_id parameter is required" }, 400);
            }

            // Get required date range from query parameters
            const from_date = ctx.req.query("from_date");
            const to_date = ctx.req.query("to_date");

            if (!from_date || !to_date) {
                return ctx.json({ error: "from_date and to_date are required" }, 400);
            }

            const parsedFromDate = new Date(from_date);
            const parsedToDate = new Date(to_date);

            if (Number.isNaN(parsedFromDate.getTime())) {
                return ctx.json({ error: "Invalid from_date format. Use YYYY-MM-DD" }, 400);
            }

            if (Number.isNaN(parsedToDate.getTime())) {
                return ctx.json({ error: "Invalid to_date format. Use YYYY-MM-DD" }, 400);
            }

            if (parsedFromDate > parsedToDate) {
                return ctx.json({ error: "Invalid dates check from and to" }, 400);
            }

            // Get optional filters
            const user_ids = ctx.req.query("user_ids");
            const status = ctx.req.query("status");
            const page = ctx.req.query("page");
            const limit = ctx.req.query("limit");

            const report = await AttendanceService.getClassAttendanceReport(
                campus_id,
                class_id,
                parsedFromDate,
                parsedToDate,
                {
                    user_ids: user_ids ? user_ids.split(',') : undefined,
                    status: status ? status.split(',') as ("present" | "absent" | "late" | "leave")[] : undefined,
                    page: page ? parseInt(page) : undefined,
                    limit: limit ? parseInt(limit) : undefined,
                }
            );

            return ctx.json(report);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error generating attendance report",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    // Get comprehensive attendance view for a specific student
    public static readonly getStudentAttendanceView = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const student_id = ctx.req.param("student_id");

            if (!student_id) {
                return ctx.json({ error: "student_id parameter is required" }, 400);
            }

            // Get required date range from query parameters
            const from_date = ctx.req.query("from_date");
            const to_date = ctx.req.query("to_date");
            const status = ctx.req.query("status");

            if (!from_date || !to_date) {
                return ctx.json({ error: "from_date and to_date are required" }, 400);
            }

            const parsedFromDate = new Date(from_date);
            const parsedToDate = new Date(to_date);

            if (Number.isNaN(parsedFromDate.getTime())) {
                return ctx.json({ error: "Invalid from_date format. Use YYYY-MM-DD" }, 400);
            }

            if (Number.isNaN(parsedToDate.getTime())) {
                return ctx.json({ error: "Invalid to_date format. Use YYYY-MM-DD" }, 400);
            }

            if (parsedFromDate > parsedToDate) {
                return ctx.json({ error: "Invalid dates check from and to" }, 400);
            }

            const studentView = await AttendanceService.getStudentAttendanceView(
                campus_id,
                student_id,
                parsedFromDate,
                parsedToDate,
                {
                    status: status ? status.split(',') as ("present" | "absent" | "late" | "leave")[] : undefined,
                }
            );

            return ctx.json(studentView);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error generating student attendance view",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };
}