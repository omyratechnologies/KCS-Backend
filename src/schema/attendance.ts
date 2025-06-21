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
        user_ids: z.array(z.string()).optional().openapi({ 
            example: ["user123", "user456", "user789"] 
        }),
        user_type: userTypeEnum.optional().default("Student").openapi({ example: "Student" }),
    })
    .refine(data => data.user_id || (data.user_ids && data.user_ids.length > 0), {
        message: "Either user_id or user_ids must be provided",
    })
    .openapi({ ref: "MarkAttendanceRequest" });

// Bulk attendance response schema
export const bulkAttendanceResponseSchema = z
    .object({
        success: z.array(attendanceSchema),
        errors: z.array(z.object({
            user_id: z.string(),
            error: z.string(),
        })),
        total_processed: z.number(),
        successful_count: z.number(),
        error_count: z.number(),
    })
    .openapi({ ref: "BulkAttendanceResponse" });

export const markAttendanceResponseSchema = z.union([
    attendanceSchema,
    bulkAttendanceResponseSchema,
]).openapi({ ref: "MarkAttendanceResponse" });

// Dedicated Bulk Mark Attendance Request
export const markBulkAttendanceRequestBodySchema = z
    .object({
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        attendances: z.array(z.object({
            user_id: z.string().openapi({ example: "user123" }),
            status: attendanceStatusEnum.openapi({ example: "present" }),
            user_type: userTypeEnum.optional().default("Student").openapi({ example: "Student" }),
        })).min(1).openapi({
            example: [
                { user_id: "user123", status: "present", user_type: "Student" },
                { user_id: "user456", status: "absent", user_type: "Student" },
                { user_id: "teacher789", status: "present", user_type: "Teacher" }
            ]
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
        attendances: z.array(z.object({
            user_id: z.string().openapi({ example: "user123" }),
            status: attendanceStatusEnum.openapi({ example: "present" }),
            user_type: userTypeEnum.optional().default("Student").openapi({ example: "Student" }),
        })).min(1).openapi({
            example: [
                { user_id: "student123", status: "present", user_type: "Student" },
                { user_id: "student456", status: "absent", user_type: "Student" }
            ]
        }),
    })
    .openapi({ ref: "MarkClassAttendanceRequest" });

export const markClassAttendanceResponseSchema = z
    .object({
        success: z.array(attendanceSchema),
        errors: z.array(z.object({
            user_id: z.string(),
            error: z.string(),
        })),
        total_processed: z.number(),
        successful_count: z.number(),
        error_count: z.number(),
        class_id: z.string(),
    })
    .openapi({ ref: "MarkClassAttendanceResponse" });
