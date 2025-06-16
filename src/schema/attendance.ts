import z from "zod";

import "zod-openapi/extend";

// Define the status enum to match the model
const attendanceStatusEnum = z.enum(["present", "absent", "late", "leave"]);

// Schema for attendance data (common fields returned in responses)
export const attendanceSchema = z
    .object({
        id: z.string().openapi({ example: "attendance123" }),
        user_id: z.string().openapi({ example: "user123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        status: attendanceStatusEnum.openapi({ example: "present" }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Attendance" });

// Mark Attendance Request
export const markAttendanceRequestBodySchema = z
    .object({
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        status: attendanceStatusEnum.openapi({ example: "present" }),
        user_id: z.string().openapi({ example: "user123" }),
    })
    .openapi({ ref: "MarkAttendanceRequest" });

export const markAttendanceResponseSchema = attendanceSchema.openapi({
    ref: "MarkAttendanceResponse",
});

// Update Attendance Request
export const updateAttendanceRequestBodySchema = z
    .object({
        date: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        status: attendanceStatusEnum.openapi({ example: "present" }),
        user_id: z.string().openapi({ example: "user123" }),
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
