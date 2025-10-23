import { z } from "zod";

// Base material schema
export const materialSchema = z.object({
    id: z.string(),
    concept_title: z.string(),
    status: z.string(),
    description: z.string(),
    title: z.string(),
    size: z.string(),
    upload_by: z.string(),
    download_count: z.number().int().min(0),
    date: z.string(),
    chapter: z.string(),
    link: z.string().url(),
    file_type: z.enum(['pdf', 'video', 'worksheet', 'presentation']),
    created_at: z.date(),
    updated_at: z.date()
});

// Material creation schema (without auto-generated fields)
export const createMaterialSchema = z.object({
    concept_title: z.string().min(1, "Concept title is required"),
    status: z.string().min(1, "Status is required"),
    description: z.string().min(1, "Description is required"),
    title: z.string().min(1, "Title is required"),
    size: z.string().min(1, "Size is required"),
    chapter: z.string().min(1, "Chapter is required"),
    link: z.string().url("Must be a valid URL")
});

// Material update schema
export const updateMaterialSchema = createMaterialSchema.partial();

// Teacher assignment schema
export const assignTeacherSchema = z.object({
    teacher_id: z.string().min(1, "Teacher ID is required"),
    role: z.string().min(1, "Role is required"),
    hours: z.number().int().min(0, "Hours must be a positive number"),
    days: z.array(z.string()).min(1, "At least one day must be specified")
});

// Subject teacher schema
export const subjectTeacherSchema = z.object({
    teacher_id: z.string(),
    role: z.string(),
    hours: z.number().int().min(0),
    days: z.array(z.string()),
    assigned_at: z.date()
});

// Enhanced subject schema with materials and teachers
export const enhancedSubjectSchema = z.object({
    id: z.string(),
    campus_id: z.string(),
    name: z.string(),
    code: z.string(),
    description: z.string(),
    materials: z.object({
        pdfs: z.array(materialSchema),
        videos: z.array(materialSchema),
        worksheets: z.array(materialSchema),
        presentations: z.array(materialSchema)
    }),
    teachers: z.record(z.string(), subjectTeacherSchema),
    meta_data: z.object({}),
    is_active: z.boolean(),
    is_deleted: z.boolean(),
    created_at: z.date(),
    updated_at: z.date()
});

// Response schemas
export const materialResponseSchema = z.object({
    success: z.boolean(),
    data: materialSchema,
    message: z.string().optional()
});

export const materialsListResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(materialSchema),
    count: z.number()
});

export const subjectDetailsResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        id: z.string(),
        campus_id: z.string(),
        name: z.string(),
        code: z.string(),
        description: z.string(),
        materials: z.object({
            pdfs: z.array(materialSchema),
            videos: z.array(materialSchema),
            worksheets: z.array(materialSchema),
            presentations: z.array(materialSchema)
        }),
        teachers: z.record(z.string(), subjectTeacherSchema),
        material_summary: z.object({
            pdfs: z.object({
                count: z.number(),
                items: z.array(materialSchema)
            }),
            videos: z.object({
                count: z.number(),
                items: z.array(materialSchema)
            }),
            worksheets: z.object({
                count: z.number(),
                items: z.array(materialSchema)
            }),
            presentations: z.object({
                count: z.number(),
                items: z.array(materialSchema)
            })
        }),
        teacher_count: z.number(),
        meta_data: z.object({}),
        is_active: z.boolean(),
        is_deleted: z.boolean(),
        created_at: z.date(),
        updated_at: z.date()
    })
});

export const downloadResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        download_url: z.string(),
        title: z.string(),
        size: z.string()
    }),
    message: z.string()
});

export const teacherAssignmentResponseSchema = z.object({
    success: z.boolean(),
    data: enhancedSubjectSchema,
    message: z.string()
});

export const errorResponseSchema = z.object({
    success: z.boolean(),
    error: z.string()
});

// Material type enum for validation
export const materialTypes = ['pdfs', 'videos', 'worksheets', 'presentations'] as const;
export type MaterialType = typeof materialTypes[number];
