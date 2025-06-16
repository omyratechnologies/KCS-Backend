import z from "zod";

import "zod-openapi/extend";

// Schema for mark data
export const markSchema = z
    .object({
        subject_id: z.string().openapi({ example: "subject123" }),
        mark_gained: z.number().openapi({ example: 85 }),
        total_marks: z.number().openapi({ example: 100 }),
        grade: z.string().openapi({ example: "A" }),
        examination_id: z.string().openapi({ example: "exam123" }),
    })
    .openapi({ ref: "Mark" });

// Schema for record data
export const recordDataSchema = z
    .object({
        exam_term_id: z.string().openapi({ example: "term123" }),
        marks: z.array(markSchema).openapi({
            example: [
                {
                    subject_id: "subject123",
                    mark_gained: 85,
                    total_marks: 100,
                    grade: "A",
                    examination_id: "exam123",
                },
                {
                    subject_id: "subject456",
                    mark_gained: 78,
                    total_marks: 100,
                    grade: "B+",
                    examination_id: "exam123",
                },
            ],
        }),
    })
    .openapi({ ref: "RecordData" });

// Schema for student record
export const studentRecordSchema = z
    .object({
        id: z.string().openapi({ example: "record123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        student_id: z.string().openapi({ example: "student123" }),
        record_data: z.array(recordDataSchema).openapi({
            example: [
                {
                    exam_term_id: "term123",
                    marks: [
                        {
                            subject_id: "subject123",
                            mark_gained: 85,
                            total_marks: 100,
                            grade: "A",
                            examination_id: "exam123",
                        },
                        {
                            subject_id: "subject456",
                            mark_gained: 78,
                            total_marks: 100,
                            grade: "B+",
                            examination_id: "exam123",
                        },
                    ],
                },
            ],
        }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "StudentRecord" });

// Create Student Record Request
export const createStudentRecordRequestBodySchema = z
    .object({
        student_id: z.string().openapi({ example: "student123" }),
        record_data: z.array(recordDataSchema).openapi({
            example: [
                {
                    exam_term_id: "term123",
                    marks: [
                        {
                            subject_id: "subject123",
                            mark_gained: 85,
                            total_marks: 100,
                            grade: "A",
                            examination_id: "exam123",
                        },
                    ],
                },
            ],
        }),
    })
    .openapi({ ref: "CreateStudentRecordRequest" });

export const createStudentRecordResponseSchema = studentRecordSchema.openapi({
    ref: "CreateStudentRecordResponse",
});

// Update Student Record Request
export const updateStudentRecordRequestBodySchema = z
    .object({
        record_data: z.array(recordDataSchema).openapi({
            example: [
                {
                    exam_term_id: "term123",
                    marks: [
                        {
                            subject_id: "subject123",
                            mark_gained: 90,
                            total_marks: 100,
                            grade: "A+",
                            examination_id: "exam123",
                        },
                    ],
                },
            ],
        }),
    })
    .openapi({ ref: "UpdateStudentRecordRequest" });

export const updateStudentRecordResponseSchema = studentRecordSchema.openapi({
    ref: "UpdateStudentRecordResponse",
});

// Get Student Records Response
export const getStudentRecordsResponseSchema = z
    .array(studentRecordSchema)
    .openapi({ ref: "GetStudentRecordsResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
