import z from "zod";

import "zod-openapi/extend";

// Schema for exam term data
export const examTermSchema = z
    .object({
        id: z.string().openapi({ example: "examterm123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        name: z.string().openapi({ example: "Midterm Examination" }),
        class_ids: z.array(z.string()).openapi({ example: ["class123", "class456", "class789"] }),
        start_date: z.string().openapi({ example: "2023-03-15T00:00:00Z" }),
        end_date: z.string().openapi({ example: "2023-03-25T00:00:00Z" }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: { type: "midterm", academic_year: "2022-2023" },
        }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "ExamTerm" });

// Create Exam Term Request
export const createExamTermRequestBodySchema = z
    .object({
        name: z.string().openapi({ example: "Midterm Examination" }),
        class_ids: z.array(z.string()).openapi({ example: ["class123", "class456", "class789"] }),
        start_date: z.string().openapi({ example: "2023-03-15T00:00:00Z" }),
        end_date: z.string().openapi({ example: "2023-03-25T00:00:00Z" }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: { type: "midterm", academic_year: "2022-2023" },
        }),
    })
    .openapi({ ref: "CreateExamTermRequest" });

export const createExamTermResponseSchema = examTermSchema.openapi({
    ref: "CreateExamTermResponse",
});

// Update Exam Term Request
export const updateExamTermRequestBodySchema = z
    .object({
        name: z.string().optional().openapi({ example: "Updated Midterm Examination" }),
        class_ids: z.array(z.string()).optional().openapi({ example: ["class123", "class456", "class789"] }),
        start_date: z.string().optional().openapi({ example: "2023-03-16T00:00:00Z" }),
        end_date: z.string().optional().openapi({ example: "2023-03-26T00:00:00Z" }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: {
                    type: "midterm",
                    academic_year: "2022-2023",
                    updated: true,
                },
            }),
    })
    .openapi({ ref: "UpdateExamTermRequest" });

export const updateExamTermResponseSchema = examTermSchema.openapi({
    ref: "UpdateExamTermResponse",
});

// Get Exam Terms Response
export const getExamTermsResponseSchema = z.array(examTermSchema).openapi({ ref: "GetExamTermsResponse" });

// Schema for examination data
export const examinationSchema = z
    .object({
        id: z.string().openapi({ example: "exam123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        subject_id: z.string().openapi({ example: "subject123" }),
        date: z.string().openapi({ example: "2023-03-17T00:00:00Z" }),
        start_date: z.string().openapi({ example: "2023-03-17T09:00:00Z" }),
        end_date: z.string().openapi({ example: "2023-03-17T11:00:00Z" }),
        exam_term_id: z.string().openapi({ example: "examterm123" }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { room: "A101", supervisor: "teacher123" } }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Examination" });

// Create Examination Request
export const createExaminationRequestBodySchema = z
    .object({
        subject_id: z.string().openapi({ example: "subject123" }),
        date: z.string().openapi({ example: "2023-03-17T00:00:00Z" }),
        start_time: z.string().openapi({ example: "2023-03-17T09:00:00Z" }),
        end_time: z.string().openapi({ example: "2023-03-17T11:00:00Z" }),
        meta_data: z.record(z.string(), z.any()).openapi({ example: { room: "A101", supervisor: "teacher123" } }),
    })
    .openapi({ ref: "CreateExaminationRequest" });

export const createExaminationResponseSchema = examinationSchema.openapi({
    ref: "CreateExaminationResponse",
});

// Update Examination Request
export const updateExaminationRequestBodySchema = z
    .object({
        subject_id: z.string().optional().openapi({ example: "subject456" }),
        date: z.string().optional().openapi({ example: "2023-03-18T00:00:00Z" }),
        start_time: z.string().optional().openapi({ example: "2023-03-18T09:00:00Z" }),
        end_time: z.string().optional().openapi({ example: "2023-03-18T11:00:00Z" }),
        exam_term_id: z.string().optional().openapi({ example: "examterm123" }),
    })
    .openapi({ ref: "UpdateExaminationRequest" });

export const updateExaminationResponseSchema = examinationSchema.openapi({
    ref: "UpdateExaminationResponse",
});

// Get Examinations Response
export const getExaminationsResponseSchema = z.array(examinationSchema).openapi({ ref: "GetExaminationsResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        data: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
