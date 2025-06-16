import z from "zod";

import "zod-openapi/extend";

// Schema for curriculum data
export const curriculumSchema = z
    .object({
        id: z.string().openapi({ example: "curriculum123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        name: z.string().openapi({ example: "Mathematics Curriculum" }),
        description: z
            .string()
            .openapi({
                example: "Comprehensive mathematics curriculum for grades 1-12",
            }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { grade: "10", subject: "Mathematics" } }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Curriculum" });

// Create Curriculum Request
export const createCurriculumRequestBodySchema = z
    .object({
        name: z.string().openapi({ example: "Mathematics Curriculum" }),
        description: z
            .string()
            .openapi({
                example: "Comprehensive mathematics curriculum for grades 1-12",
            }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { grade: "10", subject: "Mathematics" } }),
    })
    .openapi({ ref: "CreateCurriculumRequest" });

export const createCurriculumResponseSchema = curriculumSchema.openapi({
    ref: "CreateCurriculumResponse",
});

// Update Curriculum Request
export const updateCurriculumRequestBodySchema = z
    .object({
        name: z
            .string()
            .optional()
            .openapi({ example: "Updated Mathematics Curriculum" }),
        description: z
            .string()
            .optional()
            .openapi({
                example: "Updated comprehensive mathematics curriculum",
            }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: { grade: "11", subject: "Advanced Mathematics" },
            }),
    })
    .openapi({ ref: "UpdateCurriculumRequest" });

export const updateCurriculumResponseSchema = curriculumSchema.openapi({
    ref: "UpdateCurriculumResponse",
});

// Get Curriculums Response
export const getCurriculumsResponseSchema = z
    .array(curriculumSchema)
    .openapi({ ref: "GetCurriculumsResponse" });

// Delete Curriculum Response
export const deleteCurriculumResponseSchema = curriculumSchema.openapi({
    ref: "DeleteCurriculumResponse",
});
