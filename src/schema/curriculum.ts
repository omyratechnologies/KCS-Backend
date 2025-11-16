import z from "zod";

import "zod-openapi/extend";

// Schema for chapter input (id is optional, will be generated)
export const chapterInputSchema = z
    .object({
        id: z.string().optional().openapi({ example: "chapter_123" }),
        name: z.string().min(1).openapi({ example: "Introduction to Algebra" }),
        chapter_number: z.number().int().positive().openapi({ example: 1 }),
        brief_description: z.string().optional().openapi({ example: "Basic algebraic concepts and operations" }),
        link: z.string().url().optional().openapi({ example: "https://example.com/chapter1" }),
        label_ids: z.array(z.string()).optional().openapi({ example: ["label_123", "label_456"] }),
    })
    .openapi({ ref: "ChapterInput" });

// Schema for chapter response (id is required)
export const chapterSchema = z
    .object({
        id: z.string().openapi({ example: "chapter_123" }),
        name: z.string().min(1).openapi({ example: "Introduction to Algebra" }),
        chapter_number: z.number().int().positive().openapi({ example: 1 }),
        brief_description: z.string().optional().openapi({ example: "Basic algebraic concepts and operations" }),
        link: z.string().url().optional().openapi({ example: "https://example.com/chapter1" }),
        label_ids: z.array(z.string()).optional().openapi({ example: ["label_123", "label_456"] }),
    })
    .openapi({ ref: "Chapter" });

// Schema for unit input (id is optional, will be generated)
export const unitInputSchema = z
    .object({
        id: z.string().optional().openapi({ example: "unit_123" }),
        name: z.string().min(1).openapi({ example: "Algebra Basics" }),
        unit_number: z.number().int().positive().openapi({ example: 1 }),
        brief_description: z.string().optional().openapi({ example: "Introduction to algebraic concepts" }),
        chapters: z.array(chapterInputSchema).openapi({
            example: [
                {
                    name: "Introduction to Algebra",
                    chapter_number: 1,
                    brief_description: "Basic algebraic concepts",
                    link: "https://example.com/chapter1",
                    label_ids: ["label_123"],
                },
            ],
        }),
    })
    .openapi({ ref: "UnitInput" });

// Schema for unit response (id is required)
export const unitSchema = z
    .object({
        id: z.string().openapi({ example: "unit_123" }),
        name: z.string().min(1).openapi({ example: "Algebra Basics" }),
        unit_number: z.number().int().positive().openapi({ example: 1 }),
        brief_description: z.string().optional().openapi({ example: "Introduction to algebraic concepts" }),
        chapters: z.array(chapterSchema).openapi({
            example: [
                {
                    id: "chapter_123",
                    name: "Introduction to Algebra",
                    chapter_number: 1,
                    brief_description: "Basic algebraic concepts",
                    link: "https://example.com/chapter1",
                    label_ids: ["label_123"],
                },
            ],
        }),
    })
    .openapi({ ref: "Unit" });

// Schema for curriculum data
export const curriculumSchema = z
    .object({
        id: z.string().openapi({ example: "curriculum_123" }),
        campus_id: z.string().openapi({ example: "campus_123" }),
        subject_id: z.string().openapi({ example: "subject_123" }),
        units: z.array(unitSchema).openapi({
            example: [
                {
                    id: "unit_123",
                    name: "Algebra Basics",
                    unit_number: 1,
                    brief_description: "Introduction to algebraic concepts",
                    chapters: [
                        {
                            id: "chapter_123",
                            name: "Introduction to Algebra",
                            chapter_number: 1,
                            brief_description: "Basic algebraic concepts",
                            link: "https://example.com/chapter1",
                            label_ids: ["label_123"],
                        },
                    ],
                },
            ],
        }),
        created_by: z.string().openapi({ example: "user_123" }),
        updated_by: z.string().openapi({ example: "user_456" }),
        created_at: z.string().openapi({ example: "2024-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2024-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Curriculum" });

// Create Curriculum Request
export const createCurriculumRequestBodySchema = z
    .object({
        subject_id: z.string().openapi({ example: "subject_123" }),
        units: z.array(unitInputSchema).optional().default([]).openapi({
            example: [
                {
                    name: "Algebra Basics",
                    unit_number: 1,
                    brief_description: "Introduction to algebraic concepts",
                    chapters: [
                        {
                            name: "Introduction to Algebra",
                            chapter_number: 1,
                            brief_description: "Basic algebraic concepts",
                        },
                    ],
                },
            ],
        }),
    })
    .openapi({ ref: "CreateCurriculumRequest" });

export const createCurriculumResponseSchema = curriculumSchema.openapi({
    ref: "CreateCurriculumResponse",
});

// Update Curriculum Request
export const updateCurriculumRequestBodySchema = z
    .object({
        units: z.array(unitInputSchema).optional().openapi({
            example: [
                {
                    name: "Advanced Algebra",
                    unit_number: 1,
                    brief_description: "Advanced algebraic concepts",
                    chapters: [
                        {
                            name: "Advanced Algebra",
                            chapter_number: 1,
                            brief_description: "Advanced algebraic concepts",
                            label_ids: ["label_123"],
                        },
                    ],
                },
            ],
        }),
    })
    .openapi({ ref: "UpdateCurriculumRequest" });

export const updateCurriculumResponseSchema = curriculumSchema.openapi({
    ref: "UpdateCurriculumResponse",
});

// Get Curriculums Response
export const getCurriculumsResponseSchema = z.array(curriculumSchema).openapi({ ref: "GetCurriculumsResponse" });

// Get Curriculum by Subject Response
export const getCurriculumBySubjectResponseSchema = curriculumSchema.openapi({
    ref: "GetCurriculumBySubjectResponse",
});
