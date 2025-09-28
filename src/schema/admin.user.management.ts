import { z } from "zod";

// User data schema optimized for CSV conversion
export const userDataSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    phone: z.string(),
    address: z.string(),
    user_type: z.string(),
    campus_id: z.string(),
    is_active: z.string(),
    last_login: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});

// Student data schema for CSV export
export const studentDataSchema = z.object({
    student_id: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    phone: z.string(),
    address: z.string(),
    campus_id: z.string(),
    status: z.string(),
    registration_date: z.string(),
    registration_time: z.string(),
    last_login_date: z.string(),
    last_login_time: z.string(),
});

// Teacher data schema for CSV export
export const teacherDataSchema = z.object({
    teacher_id: z.string(),
    email: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string(),
    phone: z.string(),
    address: z.string(),
    campus_id: z.string(),
    status: z.string(),
    joining_date: z.string(),
    joining_time: z.string(),
    last_login_date: z.string(),
    last_login_time: z.string(),
});

// Attendance data schema for CSV export
export const attendanceDataSchema = z.object({
    date: z.string(),
    user_id: z.string(),
    user_name: z.string(),
    user_type: z.string(),
    class_id: z.string(),
    status: z.string(),
    remarks: z.string(),
    campus_id: z.string(),
    marked_at: z.string(),
    marked_time: z.string(),
    last_updated: z.string(),
    last_updated_time: z.string(),
});

// Pagination schema
export const paginationSchema = z.object({
    current_page: z.number(),
    per_page: z.number(),
    total_count: z.number(),
    total_pages: z.number(),
    has_next: z.boolean(),
    has_prev: z.boolean(),
});

// Export info schema
export const exportInfoSchema = z.object({
    type: z.string(),
    campus_id: z.string(),
    date_range: z.object({
        start_date: z.string().nullable(),
        end_date: z.string().nullable(),
    }).optional(),
    filters: z.object({
        start_date: z.string().nullable(),
        end_date: z.string().nullable(),
        user_type: z.string(),
        class_id: z.string().nullable(),
    }).optional(),
    exported_at: z.string(),
    total_records: z.number(),
});

// Filter schema
export const filterSchema = z.object({
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    user_type: z.string(),
    class_id: z.string().nullable(),
});

// Response schemas
export const adminUserManagementResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(userDataSchema),
    pagination: paginationSchema,
    filters: filterSchema,
});

export const downloadStudentsResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(studentDataSchema),
    count: z.number(),
    export_info: exportInfoSchema,
});

export const downloadTeachersResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(teacherDataSchema),
    count: z.number(),
    export_info: exportInfoSchema,
});

export const downloadAttendanceResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(attendanceDataSchema),
    count: z.number(),
    export_info: exportInfoSchema,
});

export const errorResponseSchema = z.object({
    success: z.boolean(),
    error: z.string(),
});

// Type exports
export type UserData = z.infer<typeof userDataSchema>;
export type StudentData = z.infer<typeof studentDataSchema>;
export type TeacherData = z.infer<typeof teacherDataSchema>;
export type AttendanceData = z.infer<typeof attendanceDataSchema>;
export type AdminUserManagementResponse = z.infer<typeof adminUserManagementResponseSchema>;
export type DownloadStudentsResponse = z.infer<typeof downloadStudentsResponseSchema>;
export type DownloadTeachersResponse = z.infer<typeof downloadTeachersResponseSchema>;
export type DownloadAttendanceResponse = z.infer<typeof downloadAttendanceResponseSchema>;