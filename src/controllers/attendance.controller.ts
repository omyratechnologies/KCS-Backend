import { Context } from "hono";

import { Class } from "@/models/class.model";
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
                    error: error instanceof Error ? error.message : "Unknown error",
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
                attendances: attendances.map((att) => ({
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
                    error: error instanceof Error ? error.message : "Unknown error",
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
                    message: "Error in marking class attendance",
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
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    public static readonly getAttendancesByDate = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");

        const { date } = ctx.req.param();

        const attendance = await AttendanceService.getAttendancesByDate(campus_id, new Date(date));

        return ctx.json(attendance);
    };

    public static readonly getAttendanceByUserId = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");

        const { user_id } = ctx.req.param();

        const attendance = await AttendanceService.getAttendanceByUserId(campus_id, user_id);

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

    public static readonly getAttendanceByClassId = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");

        // Get class_id from path parameter
        const class_id = ctx.req.param("class_id");
        
        // Get optional query parameters
        const date = ctx.req.query("date");
        const user_id = ctx.req.query("user_id");
        const from = ctx.req.query("from");
        const to = ctx.req.query("to");
        const page = ctx.req.query("page");
        const limit = ctx.req.query("limit");

        if (!class_id) {
            return ctx.json({ error: "class_id path parameter is required" }, 400);
        }

        try {
            let attendance;

            if (date) {
                // If date is provided, filter by date
                const parsedDate = new Date(date);
                attendance = await AttendanceService.getAttendanceByClassIdAndDate(campus_id, class_id, parsedDate);
            } else {
                // If no date provided, get all attendance for the class
                attendance = await AttendanceService.getAttendanceByClassId(campus_id, class_id);
            }

            // Apply additional filters
            let filteredAttendance = attendance;

            // Filter by user_id
            if (user_id) {
                filteredAttendance = filteredAttendance.filter((record) => record.user_id === user_id);
            }

            // Filter by date range (from and to)
            if (from) {
                const fromDate = new Date(from);
                if (!Number.isNaN(fromDate.getTime())) {
                    filteredAttendance = filteredAttendance.filter((record) => {
                        const recordDate = new Date(record.date);
                        return recordDate >= fromDate;
                    });
                }
            }

            if (to) {
                const toDate = new Date(to);
                if (!Number.isNaN(toDate.getTime())) {
                    filteredAttendance = filteredAttendance.filter((record) => {
                        const recordDate = new Date(record.date);
                        return recordDate <= toDate;
                    });
                }
            }

            // Apply pagination
            const pageNum = page ? parseInt(page, 10) : 1;
            const limitNum = limit ? parseInt(limit, 10) : filteredAttendance.length;

            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;

            const paginatedAttendance = filteredAttendance.slice(startIndex, endIndex);

            return ctx.json({
                data: paginatedAttendance,
                pagination: {
                    total: filteredAttendance.length,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(filteredAttendance.length / limitNum),
                },
            });
        } catch (error) {
            return ctx.json(
                {
                    message: "Error retrieving class attendance",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    public static readonly getAttendanceByClassIdAndDate = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");

        // Get parameters from query string instead of request body
        const class_id = ctx.req.query("class_id");
        const date = ctx.req.query("date");

        if (!class_id) {
            return ctx.json({ error: "class_id query parameter is required" }, 400);
        }

        if (!date) {
            return ctx.json({ error: "date query parameter is required" }, 400);
        }

        try {
            const parsedDate = new Date(date);

            const attendance = await AttendanceService.getAttendanceByClassIdAndDate(campus_id, class_id, parsedDate);

            return ctx.json(attendance);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error retrieving class attendance",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    // Get attendance statistics by teacher ID
    public static readonly getAttendanceStatsByTeacherId = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");
        const teacher_id = ctx.req.param("teacher_id");
        const date = ctx.req.query("date");

        if (!teacher_id) {
            return ctx.json({ error: "teacher_id parameter is required" }, 400);
        }

        try {
            let parsedDate: Date | undefined;
            if (date) {
                parsedDate = new Date(date);
                if (Number.isNaN(parsedDate.getTime())) {
                    return ctx.json({ error: "Invalid date format" }, 400);
                }
            }

            const stats = await AttendanceService.getAttendanceStatsByTeacherId(campus_id, teacher_id, parsedDate);

            return ctx.json(stats);
        } catch (error) {
            return ctx.json(
                {
                    message: "Error retrieving attendance statistics",
                    error: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    // Debug helper: Get all classes for a teacher
    public static readonly getClassesByTeacherId = async (ctx: Context) => {
        const campus_id = ctx.get("campus_id");
        const teacher_id = ctx.req.param("teacher_id");

        if (!teacher_id) {
            return ctx.json({ error: "teacher_id parameter is required" }, 400);
        }

        try {
            // Get all classes for debugging
            const allClasses = await Class.find({
                campus_id,
                is_active: true,
                is_deleted: false,
            });

            const teacherClasses =
                allClasses.rows?.filter((classData) => {
                    return (
                        classData.class_teacher_id === teacher_id ||
                        (classData.teacher_ids && classData.teacher_ids.includes(teacher_id))
                    );
                }) || [];

            return ctx.json({
                total_classes_in_campus: allClasses.rows?.length || 0,
                teacher_classes_count: teacherClasses.length,
                teacher_classes: teacherClasses.map((c) => ({
                    id: c.id,
                    name: c.name,
                    class_teacher_id: c.class_teacher_id,
                    teacher_ids: c.teacher_ids,
                    student_count: c.student_count,
                    student_ids_count: c.student_ids?.length || 0,
                })),
                searched_teacher_id: teacher_id,
                campus_id: campus_id,
            });
        } catch (error) {
            return ctx.json(
                {
                    message: "Error retrieving classes",
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

            // Get optional date range from query parameters
            const from_date = ctx.req.query("from_date");
            const to_date = ctx.req.query("to_date");

            let parsedFromDate: Date | undefined;
            let parsedToDate: Date | undefined;

            if (from_date) {
                parsedFromDate = new Date(from_date);
                if (Number.isNaN(parsedFromDate.getTime())) {
                    return ctx.json({ error: "Invalid from_date format. Use YYYY-MM-DD" }, 400);
                }
            }

            if (to_date) {
                parsedToDate = new Date(to_date);
                if (Number.isNaN(parsedToDate.getTime())) {
                    return ctx.json({ error: "Invalid to_date format. Use YYYY-MM-DD" }, 400);
                }
            }

            const report = await AttendanceService.getClassAttendanceReport(
                campus_id,
                class_id,
                parsedFromDate,
                parsedToDate
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

            // Get optional date range from query parameters
            const from_date = ctx.req.query("from_date");
            const to_date = ctx.req.query("to_date");

            let parsedFromDate: Date | undefined;
            let parsedToDate: Date | undefined;

            if (from_date) {
                parsedFromDate = new Date(from_date);
                if (Number.isNaN(parsedFromDate.getTime())) {
                    return ctx.json({ error: "Invalid from_date format. Use YYYY-MM-DD" }, 400);
                }
            }

            if (to_date) {
                parsedToDate = new Date(to_date);
                if (Number.isNaN(parsedToDate.getTime())) {
                    return ctx.json({ error: "Invalid to_date format. Use YYYY-MM-DD" }, 400);
                }
            }

            const studentView = await AttendanceService.getStudentAttendanceView(
                campus_id,
                student_id,
                parsedFromDate,
                parsedToDate
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
