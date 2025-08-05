import z from "zod";

import "zod-openapi/extend";

// Define the status enum to match the model
const attendanceStatusEnum = z.enum(["present", "absent", "late", "leave"]);
const userTypeEnum = z.enum(["Student", "Teacher"]);

// Schema for attendance data (common fields returned in responses)
export const attendanceSchema = z
    .object({
        id: z.string().openapi({ example: "attendance123" }),
        user_id: z.string().openapi({ example: "user123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        status: attendanceStatusEnum.openapi({ example: "present" }),
        user_type: userTypeEnum.optional().openapi({ example: "Student" }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Attendance" });

// Mark Attendance Request (Enhanced to support both single and bulk)
export const markAttendanceRequestBodySchema = z
    .object({
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        status: attendanceStatusEnum.openapi({ example: "present" }),
        user_id: z.string().optional().openapi({ example: "user123" }),
        user_ids: z
            .array(z.string())
            .optional()
            .openapi({
                example: ["user123", "user456", "user789"],
            }),
        user_type: userTypeEnum.optional().default("Student").openapi({ example: "Student" }),
    })
    .refine((data) => data.user_id || (data.user_ids && data.user_ids.length > 0), {
        message: "Either user_id or user_ids must be provided",
    })
    .openapi({ ref: "MarkAttendanceRequest" });

// Bulk attendance response schema
export const bulkAttendanceResponseSchema = z
    .object({
        success: z.array(attendanceSchema),
        errors: z.array(
            z.object({
                user_id: z.string(),
                error: z.string(),
            })
        ),
        total_processed: z.number(),
        successful_count: z.number(),
        error_count: z.number(),
    })
    .openapi({ ref: "BulkAttendanceResponse" });

export const markAttendanceResponseSchema = z
    .union([attendanceSchema, bulkAttendanceResponseSchema])
    .openapi({ ref: "MarkAttendanceResponse" });

// Dedicated Bulk Mark Attendance Request
export const markBulkAttendanceRequestBodySchema = z
    .object({
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        attendances: z
            .array(
                z.object({
                    user_id: z.string().openapi({ example: "user123" }),
                    status: attendanceStatusEnum.openapi({
                        example: "present",
                    }),
                    user_type: userTypeEnum.optional().default("Student").openapi({ example: "Student" }),
                })
            )
            .min(1)
            .openapi({
                example: [
                    {
                        user_id: "user123",
                        status: "present",
                        user_type: "Student",
                    },
                    {
                        user_id: "user456",
                        status: "absent",
                        user_type: "Student",
                    },
                    {
                        user_id: "teacher789",
                        status: "present",
                        user_type: "Teacher",
                    },
                ],
            }),
    })
    .openapi({ ref: "MarkBulkAttendanceRequest" });

// Update Attendance Request
export const updateAttendanceRequestBodySchema = z
    .object({
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        status: attendanceStatusEnum.openapi({ example: "present" }),
        user_id: z.string().openapi({ example: "user123" }),
        user_type: userTypeEnum.optional().openapi({ example: "Student" }),
    })
    .openapi({ ref: "UpdateAttendanceRequest" });

export const updateAttendanceResponseSchema = attendanceSchema.openapi({
    ref: "UpdateAttendanceResponse",
});

// Get Attendances By Date Response
export const getAttendancesByDateResponseSchema = z
    .array(attendanceSchema)
    .openapi({ ref: "GetAttendancesByDateResponse" });

// Get Attendance By User ID Response
export const getAttendanceByUserIdResponseSchema = z
    .array(attendanceSchema)
    .openapi({ ref: "GetAttendanceByUserIdResponse" });

// Get Attendance By Campus ID Response
export const getAttendanceByCampusIdResponseSchema = z
    .array(attendanceSchema)
    .openapi({ ref: "GetAttendanceByCampusIdResponse" });

// Get Attendance By Class ID And Date Request
export const getAttendanceByClassIdAndDateRequestBodySchema = z
    .object({
        class_id: z.string().openapi({ example: "class123" }),
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "GetAttendanceByClassIdAndDateRequest" });

export const getAttendanceByClassIdAndDateResponseSchema = z
    .array(attendanceSchema)
    .openapi({ ref: "GetAttendanceByClassIdAndDateResponse" });

// Dedicated Class Attendance Request
export const markClassAttendanceRequestBodySchema = z
    .object({
        class_id: z.string().openapi({ example: "class123" }),
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        attendances: z
            .array(
                z.object({
                    user_id: z.string().openapi({ example: "user123" }),
                    status: attendanceStatusEnum.openapi({
                        example: "present",
                    }),
                    user_type: userTypeEnum.optional().default("Student").openapi({ example: "Student" }),
                })
            )
            .min(1)
            .openapi({
                example: [
                    {
                        user_id: "student123",
                        status: "present",
                        user_type: "Student",
                    },
                    {
                        user_id: "student456",
                        status: "absent",
                        user_type: "Student",
                    },
                ],
            }),
    })
    .openapi({ ref: "MarkClassAttendanceRequest" });

export const markClassAttendanceResponseSchema = z
    .object({
        success: z.array(attendanceSchema),
        errors: z.array(
            z.object({
                user_id: z.string(),
                error: z.string(),
            })
        ),
        total_processed: z.number(),
        successful_count: z.number(),
        error_count: z.number(),
        class_id: z.string(),
    })
    .openapi({ ref: "MarkClassAttendanceResponse" });

// Teacher Attendance Stats Response
export const getAttendanceStatsByTeacherIdResponseSchema = z
    .object({
        total_classes: z.number().openapi({ example: 8 }),
        completed_today: z.number().openapi({ example: 4 }),
        pending_today: z.number().openapi({ example: 2 }),
        average_attendance: z.number().openapi({ example: 68 }),
        date: z.string().openapi({ example: "2023-06-23" }),
        debug: z.string().optional().openapi({ example: "Debug information" }),
        classes: z
            .array(
                z.object({
                    class_id: z.string().openapi({ example: "class123" }),
                    class_name: z.string().openapi({ example: "Class X - Section A" }),
                    status: z.enum(["completed", "pending", "incomplete"]).openapi({ example: "completed" }),
                    present_count: z.number().openapi({ example: 32 }),
                    total_students: z.number().openapi({ example: 35 }),
                    attendance_rate: z.number().openapi({ example: 91 }),
                    last_updated: z.string().nullable().openapi({ example: "2023-06-23T10:30:00Z" }),
                    error: z.string().optional().openapi({
                        example: "Unable to fetch attendance data",
                    }),
                })
            )
            .openapi({
                example: [
                    {
                        class_id: "class123",
                        class_name: "Class X - Section A",
                        status: "completed",
                        present_count: 32,
                        total_students: 35,
                        attendance_rate: 91,
                        last_updated: "2023-06-23T10:30:00Z",
                    },
                ],
            }),
    })
    .openapi({ ref: "GetAttendanceStatsByTeacherIdResponse" });

// Class Attendance Report Response Schema
export const getClassAttendanceReportResponseSchema = z
    .object({
        class_info: z.object({
            class_id: z.string().openapi({ example: "class123" }),
            class_name: z.string().openapi({ example: "Class X - Section A" }),
            total_students: z.number().openapi({ example: 35 }),
        }),
        date_range: z.object({
            from_date: z.string().openapi({ example: "2024-06-01" }),
            to_date: z.string().openapi({ example: "2024-06-30" }),
            total_days: z.number().openapi({ example: 30 }),
        }),
        summary: z.object({
            total_students: z.number().openapi({ example: 35 }),
            average_attendance: z.number().openapi({ example: 79 }),
            excellent_90_plus: z.number().openapi({ example: 8 }),
            good_75_89: z.number().openapi({ example: 15 }),
            average_60_74: z.number().openapi({ example: 6 }),
            needs_attention_below_60: z.number().openapi({ example: 6 }),
        }),
        students: z
            .array(
                z.object({
                    student_id: z.string().openapi({ example: "student123" }),
                    student_name: z.string().openapi({ example: "John Doe" }),
                    roll_number: z.string().openapi({ example: "2024001" }),
                    total_classes: z.number().openapi({ example: 30 }),
                    attended: z.number().openapi({ example: 25 }),
                    absent: z.number().openapi({ example: 4 }),
                    late: z.number().openapi({ example: 1 }),
                    leave: z.number().openapi({ example: 0 }),
                    percentage: z.number().openapi({ example: 83 }),
                    status: z.enum(["excellent", "good", "average", "poor"]).openapi({ example: "good" }),
                    last_attended: z.string().nullable().openapi({ example: "2024-06-30T00:00:00Z" }),
                    email: z.string().openapi({ example: "john.doe@example.com" }),
                    phone: z.string().openapi({ example: "+1234567890" }),
                    error: z.string().optional().openapi({ example: "Error fetching data" }),
                })
            )
            .openapi({
                example: [
                    {
                        student_id: "student123",
                        student_name: "Student 1",
                        roll_number: "2024001",
                        total_classes: 50,
                        attended: 41,
                        absent: 9,
                        late: 0,
                        leave: 0,
                        percentage: 82,
                        status: "good",
                        last_attended: "2024-06-25T00:00:00Z",
                        email: "student1@example.com",
                        phone: "+1234567890",
                    },
                ],
            }),
    })
    .openapi({ ref: "GetClassAttendanceReportResponse" });

// Student Attendance View Response Schema (Monthly Performance)
export const getStudentAttendanceViewResponseSchema = z
    .object({
        student_profile: z.object({
            student_id: z.string().openapi({ example: "student123" }),
            name: z.string().openapi({ example: "Arjun Reddy" }),
            roll_number: z.string().openapi({ example: "ST001" }),
            class: z.string().openapi({ example: "X - A" }),
            contact: z.string().openapi({ example: "+91 9876543210" }),
            email: z.string().openapi({ example: "arjun.reddy@student.school.com" }),
            avatar_url: z.string().nullable().openapi({ example: null }),
        }),
        date_range: z.object({
            from_date: z.string().openapi({ example: "2024-01-01" }),
            to_date: z.string().openapi({ example: "2024-12-31" }),
            showing_records: z.string().openapi({ example: "8 months with 120 attendance records" }),
        }),
        summary_cards: z.object({
            total_days: z.object({
                count: z.number().openapi({ example: 120 }),
                label: z.string().openapi({ example: "TOTAL DAYS" }),
            }),
            present_days: z.object({
                count: z.number().openapi({ example: 90 }),
                label: z.string().openapi({ example: "PRESENT DAYS" }),
            }),
            absent_days: z.object({
                count: z.number().openapi({ example: 15 }),
                label: z.string().openapi({ example: "ABSENT DAYS" }),
            }),
            attendance_rate: z.object({
                percentage: z.number().openapi({ example: 75 }),
                label: z.string().openapi({ example: "ATTENDANCE RATE" }),
                status: z.enum(["excellent", "good", "average", "poor"]).openapi({ example: "good" }),
            }),
        }),
        additional_stats: z.object({
            late_days: z.number().openapi({ example: 10 }),
            leave_days: z.number().openapi({ example: 5 }),
            total_present_including_late: z.number().openapi({ example: 100 }),
            total_months: z.number().openapi({ example: 8 }),
        }),
        monthly_performance: z.object({
            records: z
                .array(
                    z.object({
                        month: z.string().openapi({ example: "June" }),
                        year: z.number().openapi({ example: 2024 }),
                        month_year: z.string().openapi({ example: "June 2024" }),
                        present_days: z.number().openapi({ example: 12 }),
                        absent_days: z.number().openapi({ example: 2 }),
                        late_days: z.number().openapi({ example: 1 }),
                        leave_days: z.number().openapi({ example: 0 }),
                        total_days: z.number().openapi({ example: 15 }),
                        percentage: z.number().openapi({ example: 87 }),
                        status: z.enum(["excellent", "good", "average", "poor"]).openapi({ example: "good" }),
                        performance_badge: z
                            .enum(["excellent", "good", "average", "poor"])
                            .openapi({ example: "good" }),
                    })
                )
                .openapi({
                    example: [
                        {
                            month: "June",
                            year: 2024,
                            month_year: "June 2024",
                            present_days: 12,
                            absent_days: 2,
                            late_days: 1,
                            leave_days: 0,
                            total_days: 15,
                            percentage: 87,
                            status: "good",
                            performance_badge: "good",
                        },
                        {
                            month: "May",
                            year: 2024,
                            month_year: "May 2024",
                            present_days: 18,
                            absent_days: 1,
                            late_days: 0,
                            leave_days: 1,
                            total_days: 20,
                            percentage: 90,
                            status: "excellent",
                            performance_badge: "excellent",
                        },
                        {
                            month: "April",
                            year: 2024,
                            month_year: "April 2024",
                            present_days: 10,
                            absent_days: 5,
                            late_days: 2,
                            leave_days: 1,
                            total_days: 18,
                            percentage: 67,
                            status: "average",
                            performance_badge: "average",
                        },
                    ],
                }),
            total_months: z.number().openapi({ example: 8 }),
            filters: z.object({
                date_range: z.string().openapi({ example: "Last 12 Months" }),
                view_type: z.string().openapi({ example: "Monthly" }),
            }),
        }),
    })
    .openapi({ ref: "GetStudentAttendanceViewResponse" });
