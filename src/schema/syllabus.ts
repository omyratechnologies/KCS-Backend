import z from "zod";

import "zod-openapi/extend";

// Schema for syllabus data
export const syllabusSchema = z
    .object({
        id: z.string().openapi({ example: "syllabus123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        subject_id: z.string().openapi({ example: "subject123" }),
        name: z.string().openapi({ example: "Mathematics Syllabus 2023" }),
        description: z.string().openapi({
            example: "Complete syllabus for Mathematics covering algebra, geometry, and calculus",
        }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                academic_year: "2023-2024",
                grade_level: "10",
                author: "John Doe",
            },
        }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Syllabus" });

// Create Syllabus Request
export const createSyllabusRequestBodySchema = z
    .object({
        subject_id: z.string().openapi({ example: "subject123" }),
        name: z.string().openapi({ example: "Mathematics Syllabus 2023" }),
        description: z.string().openapi({
            example: "Complete syllabus for Mathematics covering algebra, geometry, and calculus",
        }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                academic_year: "2023-2024",
                grade_level: "10",
                author: "John Doe",
            },
        }),
    })
    .openapi({ ref: "CreateSyllabusRequest" });

export const createSyllabusResponseSchema = syllabusSchema.openapi({
    ref: "CreateSyllabusResponse",
});

// Update Syllabus Request
export const updateSyllabusRequestBodySchema = z
    .object({
        subject_id: z.string().optional().openapi({ example: "subject456" }),
        name: z.string().optional().openapi({ example: "Updated Mathematics Syllabus 2023" }),
        description: z.string().optional().openapi({
            example: "Updated syllabus for Mathematics with additional topics",
        }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: {
                    academic_year: "2023-2024",
                    grade_level: "10",
                    author: "Jane Smith",
                    last_updated_by: "John Doe",
                },
            }),
        is_active: z.boolean().optional().openapi({ example: true }),
    })
    .openapi({ ref: "UpdateSyllabusRequest" });

export const updateSyllabusResponseSchema = syllabusSchema.openapi({
    ref: "UpdateSyllabusResponse",
});

// Get Syllabuses Response
export const getSyllabusesResponseSchema = z.array(syllabusSchema).openapi({ ref: "GetSyllabusesResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
