import z from "zod";

import "zod-openapi/extend";

// Schema for timetable data
export const timetableSchema = z
    .object({
        id: z.string().openapi({ example: "timetable123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        class_id: z.string().openapi({ example: "class123" }),
        subject_id: z.string().openapi({ example: "subject123" }),
        teacher_id: z.string().openapi({ example: "teacher123" }),
        day: z.string().openapi({ example: "Monday" }),
        start_time: z.string().openapi({ example: "09:00" }),
        end_time: z.string().openapi({ example: "10:30" }),
        message: z.string().openapi({ example: "Regular class" }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { room: "A101", floor: 1 } }),
        is_suspended: z.boolean().openapi({ example: false }),
        is_adjourned: z.boolean().openapi({ example: false }),
        is_cancelled: z.boolean().openapi({ example: false }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Timetable" });

// Schema for timetable item in bulk creation
export const timetableItemSchema = z
    .object({
        subject_id: z.string().openapi({ example: "subject123" }),
        teacher_id: z.string().openapi({ example: "teacher123" }),
        day: z.string().openapi({ example: "Monday" }),
        start_time: z.string().openapi({ example: "09:00" }),
        end_time: z.string().openapi({ example: "10:30" }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { room: "A101", floor: 1 } }),
    })
    .openapi({ ref: "TimetableItem" });

// Create Timetable Bulk Request
export const createTimetableBulkRequestBodySchema = z
    .object({
        class_id: z.string().openapi({ example: "class123" }),
        timetableData: z.array(timetableItemSchema).openapi({
            example: [
                {
                    subject_id: "subject123",
                    teacher_id: "teacher123",
                    day: "Monday",
                    start_time: "09:00",
                    end_time: "10:30",
                    meta_data: { room: "A101", floor: 1 },
                },
                {
                    subject_id: "subject456",
                    teacher_id: "teacher456",
                    day: "Monday",
                    start_time: "11:00",
                    end_time: "12:30",
                    meta_data: { room: "B202", floor: 2 },
                },
            ],
        }),
    })
    .openapi({ ref: "CreateTimetableBulkRequest" });

export const createTimetableBulkResponseSchema = z.string().openapi({
    example: "Timetable created successfully",
    ref: "CreateTimetableBulkResponse",
});

// Update Timetable Request
export const updateTimetableRequestBodySchema = z
    .object({
        campus_id: z.string().optional().openapi({ example: "campus123" }),
        class_id: z.string().optional().openapi({ example: "class123" }),
        subject_id: z.string().optional().openapi({ example: "subject789" }),
        teacher_id: z.string().optional().openapi({ example: "teacher789" }),
        day: z.string().optional().openapi({ example: "Tuesday" }),
        start_time: z.string().optional().openapi({ example: "09:30" }),
        end_time: z.string().optional().openapi({ example: "11:00" }),
        message: z.string().optional().openapi({ example: "Updated class" }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({ example: { room: "C303", floor: 3 } }),
        is_suspended: z.boolean().optional().openapi({ example: false }),
        is_adjourned: z.boolean().optional().openapi({ example: false }),
        is_cancelled: z.boolean().optional().openapi({ example: false }),
        is_active: z.boolean().optional().openapi({ example: true }),
        is_deleted: z.boolean().optional().openapi({ example: false }),
    })
    .openapi({ ref: "UpdateTimetableRequest" });

export const updateTimetableResponseSchema = timetableSchema.openapi({
    ref: "UpdateTimetableResponse",
});

// Get Timetables Response
export const getTimetablesResponseSchema = z.array(timetableSchema).openapi({ ref: "GetTimetablesResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
