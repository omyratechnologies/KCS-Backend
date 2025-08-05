import z from "zod";

import "zod-openapi/extend";

// Schema for subject data
export const subjectSchema = z
    .object({
        id: z.string().openapi({ example: "subject123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        name: z.string().openapi({ example: "Mathematics" }),
        code: z.string().openapi({ example: "MATH101" }),
        description: z.string().openapi({
            example: "Introduction to basic mathematical concepts",
        }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { level: "Beginner", credits: 3 } }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Subject" });

// Create Subject Request
export const createSubjectRequestBodySchema = z
    .object({
        subjectData: z
            .object({
                name: z.string().openapi({ example: "Mathematics" }),
                code: z.string().openapi({ example: "MATH101" }),
                description: z.string().openapi({
                    example: "Introduction to basic mathematical concepts",
                }),
                meta_data: z
                    .record(z.string(), z.any())
                    .openapi({ example: { level: "Beginner", credits: 3 } }),
            })
            .openapi({
                example: {
                    name: "Mathematics",
                    code: "MATH101",
                    description: "Introduction to basic mathematical concepts",
                    meta_data: { level: "Beginner", credits: 3 },
                },
            }),
    })
    .openapi({ ref: "CreateSubjectRequest" });

export const createSubjectResponseSchema = subjectSchema.openapi({
    ref: "CreateSubjectResponse",
});

// Update Subject Request
export const updateSubjectRequestBodySchema = z
    .object({
        name: z
            .string()
            .optional()
            .openapi({ example: "Advanced Mathematics" }),
        code: z.string().optional().openapi({ example: "MATH201" }),
        description: z.string().optional().openapi({
            example: "Advanced mathematical concepts and applications",
        }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({ example: { level: "Intermediate", credits: 4 } }),
        is_active: z.boolean().optional().openapi({ example: true }),
    })
    .openapi({ ref: "UpdateSubjectRequest" });

export const updateSubjectResponseSchema = subjectSchema.openapi({
    ref: "UpdateSubjectResponse",
});

// Get Subjects Response
export const getSubjectsResponseSchema = z
    .array(subjectSchema)
    .openapi({ ref: "GetSubjectsResponse" });

// Delete Subject Response
export const deleteSubjectResponseSchema = subjectSchema.openapi({
    ref: "DeleteSubjectResponse",
});

// Teacher Schema (simplified for subject-teacher relationship)
export const teacherSchema = z
    .object({
        id: z.string().openapi({ example: "teacher123" }),
        user_id: z.string().openapi({ example: "user123" }),
        name: z.string().openapi({ example: "John Doe" }),
        email: z.string().email().openapi({ example: "john.doe@example.com" }),
        subjects: z
            .array(z.string())
            .optional()
            .openapi({ example: ["subject123", "subject456"] }),
    })
    .openapi({ ref: "Teacher" });

// Get Teachers for Subject Response
export const getTeachersForSubjectResponseSchema = z
    .array(teacherSchema)
    .openapi({ ref: "GetTeachersForSubjectResponse" });

// Class Subject Schema (simplified for subject-class relationship)
export const classSubjectSchema = z
    .object({
        id: z.string().openapi({ example: "classSubject123" }),
        class_id: z.string().openapi({ example: "class123" }),
        subject_id: z.string().openapi({ example: "subject123" }),
        teacher_id: z.string().openapi({ example: "teacher123" }),
    })
    .openapi({ ref: "ClassSubject" });

// Get Classes for Subject Response
export const getClassesForSubjectResponseSchema = z
    .array(classSubjectSchema)
    .openapi({ ref: "GetClassesForSubjectResponse" });
