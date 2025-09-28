import { Context } from "hono";

import { UserService } from "@/services/users.service";
import { AttendanceService } from "@/services/attendance.service";

// Type definitions for filters
interface UserFilter extends Record<string, unknown> {
    campus_id: string;
    is_deleted: boolean;
    user_type?: string;
    class_id?: string;
    created_at?: {
        $gte?: Date;
        $lte?: Date;
    };
}

interface AttendanceFilter extends Record<string, unknown> {
    campus_id: string;
    user_type?: string;
    class_id?: string;
    date?: {
        $gte?: Date;
        $lte?: Date;
    };
}

export class AdminUserManagementController {
    /**
     * Get users for admin panel with filtering by date range and user type
     */
    public static readonly getUsersForAdmin = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { start_date, end_date, user_type, class_id, page = "1", limit = "10" } = ctx.req.query();

            const pageNum = parseInt(page as string, 10);
            const limitNum = parseInt(limit as string, 10);
            const skip = (pageNum - 1) * limitNum;

            // Build filter based on query parameters
            const filter: UserFilter = { campus_id, is_deleted: false };
            
            if (user_type && user_type !== "all") {
                filter.user_type = user_type;
            }

            // Add class filter if provided
            if (class_id) {
                filter.class_id = class_id;
            }

            // Add date range filter if provided
            if (start_date || end_date) {
                filter.created_at = {};
                if (start_date) {
                    filter.created_at.$gte = new Date(start_date as string);
                }
                if (end_date) {
                    filter.created_at.$lte = new Date(end_date as string);
                }
            }

            const users = await UserService.getUsersWithFilter(filter, {
                limit: limitNum,
                skip,
                sort: { created_at: "DESC" }
            });

            const totalCount = await UserService.getUsersCount(filter);

            // Format data for easy CSV conversion
            const formattedUsers = users.map(user => ({
                id: user.id,
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                full_name: `${user.first_name} ${user.last_name}`,
                phone: user.phone,
                address: user.address,
                user_type: user.user_type,
                campus_id: user.campus_id,
                is_active: user.is_active ? "Active" : "Inactive",
                last_login: user.last_login ? new Date(user.last_login).toISOString() : null,
                created_at: new Date(user.created_at).toISOString(),
                updated_at: new Date(user.updated_at).toISOString(),
                // Parse meta_data for additional fields if needed
                ...(user.meta_data && typeof user.meta_data === 'string' 
                    ? JSON.parse(user.meta_data) 
                    : user.meta_data || {})
            }));

            return ctx.json({
                success: true,
                data: formattedUsers,
                pagination: {
                    current_page: pageNum,
                    per_page: limitNum,
                    total_count: totalCount,
                    total_pages: Math.ceil(totalCount / limitNum),
                    has_next: pageNum < Math.ceil(totalCount / limitNum),
                    has_prev: pageNum > 1
                },
                filters: {
                    start_date: start_date || null,
                    end_date: end_date || null,
                    user_type: user_type || "all",
                    class_id: class_id || null
                }
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get users"
                },
                500
            );
        }
    };

    /**
     * Download Students Data for CSV Export
     */
    public static readonly downloadStudents = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { start_date, end_date, class_id } = ctx.req.query();

            // Build filter for students
            const filter: UserFilter = {
                campus_id, 
                user_type: "Student", 
                is_deleted: false 
            };

            // Add class filter if provided
            if (class_id) {
                filter.class_id = class_id;
            }

            // Add date range filter if provided
            if (start_date || end_date) {
                filter.created_at = {};
                if (start_date) {
                    filter.created_at.$gte = new Date(start_date as string);
                }
                if (end_date) {
                    filter.created_at.$lte = new Date(end_date as string);
                }
            }

            const students = await UserService.getUsersWithFilter(filter, {
                limit: 10000, // Large limit for download
                sort: { created_at: "DESC" }
            });

            // Format data optimized for CSV conversion
            const csvData = students.map(student => ({
                student_id: student.user_id,
                email: student.email,
                first_name: student.first_name,
                last_name: student.last_name,
                full_name: `${student.first_name} ${student.last_name}`,
                phone: student.phone,
                address: student.address,
                campus_id: student.campus_id,
                status: student.is_active ? "Active" : "Inactive",
                registration_date: new Date(student.created_at).toLocaleDateString(),
                registration_time: new Date(student.created_at).toLocaleTimeString(),
                last_login_date: student.last_login ? new Date(student.last_login).toLocaleDateString() : "Never",
                last_login_time: student.last_login ? new Date(student.last_login).toLocaleTimeString() : "Never",
                // Additional fields from meta_data
                ...(student.meta_data && typeof student.meta_data === 'string' 
                    ? JSON.parse(student.meta_data) 
                    : student.meta_data || {})
            }));

            return ctx.json({
                success: true,
                data: csvData,
                count: csvData.length,
                export_info: {
                    type: "students",
                    campus_id,
                    filters: {
                        start_date: start_date || null,
                        end_date: end_date || null,
                        user_type: "Student",
                        class_id: class_id || null
                    },
                    exported_at: new Date().toISOString(),
                    total_records: csvData.length
                }
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to download students data"
                },
                500
            );
        }
    };

    /**
     * Download Teachers Data for CSV Export
     */
    public static readonly downloadTeachers = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { start_date, end_date, class_id } = ctx.req.query();

            // Build filter for teachers
            const filter: UserFilter = {
                campus_id, 
                user_type: "Teacher", 
                is_deleted: false 
            };

            // Add class filter if provided
            if (class_id) {
                filter.class_id = class_id;
            }

            // Add date range filter if provided
            if (start_date || end_date) {
                filter.created_at = {};
                if (start_date) {
                    filter.created_at.$gte = new Date(start_date as string);
                }
                if (end_date) {
                    filter.created_at.$lte = new Date(end_date as string);
                }
            }

            const teachers = await UserService.getUsersWithFilter(filter, {
                limit: 10000, // Large limit for download
                sort: { created_at: "DESC" }
            });

            // Format data optimized for CSV conversion
            const csvData = teachers.map(teacher => ({
                teacher_id: teacher.user_id,
                email: teacher.email,
                first_name: teacher.first_name,
                last_name: teacher.last_name,
                full_name: `${teacher.first_name} ${teacher.last_name}`,
                phone: teacher.phone,
                address: teacher.address,
                campus_id: teacher.campus_id,
                status: teacher.is_active ? "Active" : "Inactive",
                joining_date: new Date(teacher.created_at).toLocaleDateString(),
                joining_time: new Date(teacher.created_at).toLocaleTimeString(),
                last_login_date: teacher.last_login ? new Date(teacher.last_login).toLocaleDateString() : "Never",
                last_login_time: teacher.last_login ? new Date(teacher.last_login).toLocaleTimeString() : "Never",
                // Additional fields from meta_data
                ...(teacher.meta_data && typeof teacher.meta_data === 'string' 
                    ? JSON.parse(teacher.meta_data) 
                    : teacher.meta_data || {})
            }));

            return ctx.json({
                success: true,
                data: csvData,
                count: csvData.length,
                export_info: {
                    type: "teachers",
                    campus_id,
                    filters: {
                        start_date: start_date || null,
                        end_date: end_date || null,
                        user_type: "Teacher",
                        class_id: class_id || null
                    },
                    exported_at: new Date().toISOString(),
                    total_records: csvData.length
                }
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to download teachers data"
                },
                500
            );
        }
    };

    /**
     * Download Attendance Data for CSV Export
     */
    public static readonly downloadAttendance = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { start_date, end_date, user_type, class_id } = ctx.req.query();

            // Build filter for attendance
            const filter: AttendanceFilter = { campus_id };

            if (user_type && user_type !== "all") {
                filter.user_type = user_type;
            }

            if (class_id) {
                filter.class_id = class_id;
            }

            // Add date range filter - required for attendance
            if (start_date || end_date) {
                filter.date = {};
                if (start_date) {
                    filter.date.$gte = new Date(start_date as string);
                }
                if (end_date) {
                    filter.date.$lte = new Date(end_date as string);
                }
            }

            const attendanceRecords = await AttendanceService.getAttendanceWithUserDetails(filter, {
                limit: 50000, // Large limit for download
                sort: { date: "DESC", created_at: "DESC" }
            });

            // Format data optimized for CSV conversion
            const csvData = attendanceRecords.map(record => ({
                date: new Date(record.date).toLocaleDateString(),
                user_id: record.user_id,
                user_name: record.user_name || "N/A",
                user_type: record.user_type,
                class_id: record.class_id || "N/A",
                status: record.status,
                remarks: record.remarks || "",
                campus_id: record.campus_id,
                marked_at: new Date(record.created_at).toLocaleDateString(),
                marked_time: new Date(record.created_at).toLocaleTimeString(),
                last_updated: new Date(record.updated_at).toLocaleDateString(),
                last_updated_time: new Date(record.updated_at).toLocaleTimeString()
            }));

            return ctx.json({
                success: true,
                data: csvData,
                count: csvData.length,
                export_info: {
                    type: "attendance",
                    campus_id,
                    filters: {
                        start_date: start_date || null,
                        end_date: end_date || null,
                        user_type: user_type || "all",
                        class_id: class_id || null
                    },
                    exported_at: new Date().toISOString(),
                    total_records: csvData.length
                }
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to download attendance data"
                },
                500
            );
        }
    };
}