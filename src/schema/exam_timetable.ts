import z from "zod";

import "zod-openapi/extend";

// Schema for exam timetable subject
export const examTimetableSubjectSchema = z
    .object({
        subject_id: z.string().openapi({ example: "subject123" }),
        exam_date: z.string().openapi({ example: "2023-05-15T00:00:00Z" }),
        start_time: z.string().openapi({ example: "09:00" }),
        end_time: z.string().openapi({ example: "11:00" }),
        room: z.string().optional().openapi({ example: "Room A101" }),
        invigilator_ids: z.array(z.string()).optional().openapi({ example: ["teacher123", "teacher456"] }),
    })
    .openapi({ ref: "ExamTimetableSubject" });

// Schema for exam timetable data
export const examTimetableSchema = z
    .object({
        id: z.string().openapi({ example: "exam_timetable123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        exam_term_id: z.string().openapi({ example: "exam_term123" }),
        exam_name: z.string().openapi({ example: "Mid-Term Examination" }),
        class_ids: z.array(z.string()).openapi({ example: ["class123", "class456"] }),
        start_date: z.string().openapi({ example: "2023-05-15T00:00:00Z" }),
        end_date: z.string().openapi({ example: "2023-05-25T00:00:00Z" }),
        subjects: z.array(examTimetableSubjectSchema),
        is_published: z.boolean().openapi({ example: false }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { additional_info: "Sample data" } }),
        created_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-05-01T00:00:00Z" }),
    })
    .openapi({ ref: "ExamTimetable" });

// Create Exam Timetable Request
export const createExamTimetableRequestBodySchema = z
    .object({
        exam_term_id: z.string().openapi({ example: "exam_term123" }),
        exam_name: z.string().openapi({ example: "Mid-Term Examination" }),
        class_ids: z.array(z.string()).openapi({ example: ["class123", "class456"] }),
        start_date: z.string().openapi({ example: "2023-05-15T00:00:00Z" }),
        end_date: z.string().openapi({ example: "2023-05-25T00:00:00Z" }),
        subjects: z.array(
            z.object({
                subject_id: z.string().openapi({ example: "subject123" }),
                exam_date: z.string().openapi({ example: "2023-05-15T00:00:00Z" }),
                start_time: z.string().openapi({ example: "09:00" }),
                end_time: z.string().openapi({ example: "11:00" }),
                room: z.string().optional().openapi({ example: "Room A101" }),
                invigilator_ids: z.array(z.string()).optional().openapi({ example: ["teacher123", "teacher456"] }),
            })
        ),
        meta_data: z.record(z.string(), z.any()).optional().openapi({ example: { additional_info: "Sample data" } }),
    })
    .openapi({ ref: "CreateExamTimetableRequest" });

export const createExamTimetableResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: examTimetableSchema,
        message: z.string().openapi({ example: "Exam timetable created successfully" }),
    })
    .openapi({ ref: "CreateExamTimetableResponse" });

// Update Exam Timetable Request
export const updateExamTimetableRequestBodySchema = z
    .object({
        exam_name: z.string().optional().openapi({ example: "Updated Mid-Term Examination" }),
        class_ids: z.array(z.string()).optional().openapi({ example: ["class123", "class456", "class789"] }),
        start_date: z.string().optional().openapi({ example: "2023-05-16T00:00:00Z" }),
        end_date: z.string().optional().openapi({ example: "2023-05-26T00:00:00Z" }),
        subjects: z
            .array(
                z.object({
                    subject_id: z.string().openapi({ example: "subject123" }),
                    exam_date: z.string().openapi({ example: "2023-05-15T00:00:00Z" }),
                    start_time: z.string().openapi({ example: "09:00" }),
                    end_time: z.string().openapi({ example: "11:00" }),
                    room: z.string().optional().openapi({ example: "Room A101" }),
                    invigilator_ids: z.array(z.string()).optional().openapi({ example: ["teacher123", "teacher456"] }),
                })
            )
            .optional(),
        is_published: z.boolean().optional().openapi({ example: true }),
        meta_data: z.record(z.string(), z.any()).optional().openapi({ example: { updated_info: "Updated data" } }),
    })
    .openapi({ ref: "UpdateExamTimetableRequest" });

export const updateExamTimetableResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: examTimetableSchema,
        message: z.string().openapi({ example: "Exam timetable updated successfully" }),
    })
    .openapi({ ref: "UpdateExamTimetableResponse" });

// Get Exam Timetables Response
export const getExamTimetablesResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.array(examTimetableSchema),
        message: z.string().openapi({ example: "Exam timetables retrieved successfully" }),
    })
    .openapi({ ref: "GetExamTimetablesResponse" });

// Get Single Exam Timetable Response
export const getExamTimetableResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: examTimetableSchema,
        message: z.string().openapi({ example: "Exam timetable retrieved successfully" }),
    })
    .openapi({ ref: "GetExamTimetableResponse" });

// Publish/Unpublish Response
export const publishExamTimetableResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: examTimetableSchema,
        message: z.string().openapi({ example: "Exam timetable published successfully" }),
    })
    .openapi({ ref: "PublishExamTimetableResponse" });

// Check Schedule Conflicts Request
export const checkScheduleConflictsRequestBodySchema = z
    .object({
        exam_date: z.string().openapi({ example: "2023-05-15T00:00:00Z" }),
        start_time: z.string().openapi({ example: "09:00" }),
        end_time: z.string().openapi({ example: "11:00" }),
        exclude_id: z.string().optional().openapi({ example: "exam_timetable123" }),
    })
    .openapi({ ref: "CheckScheduleConflictsRequest" });

export const checkScheduleConflictsResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.object({
            has_conflicts: z.boolean().openapi({ example: false }),
            conflicts: z.array(
                z.object({
                    timetable_id: z.string().openapi({ example: "exam_timetable456" }),
                    exam_name: z.string().openapi({ example: "Final Examination" }),
                    subject_name: z.string().openapi({ example: "Physics" }),
                    conflicting_time: z.string().openapi({ example: "10:00 - 12:00" }),
                })
            ),
        }),
        message: z.string().openapi({ example: "No schedule conflicts" }),
    })
    .openapi({ ref: "CheckScheduleConflictsResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        data: z.null().openapi({ example: null }),
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
