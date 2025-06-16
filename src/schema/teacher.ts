import z from "zod";

import "zod-openapi/extend";

// Schema for teacher data
export const teacherSchema = z
    .object({
        id: z.string().openapi({ example: "teacher123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        user_id: z.string().openapi({ example: "user456" }),
        subjects: z
            .array(z.string())
            .openapi({ example: ["subject1", "subject2"] }),
        classes: z.array(z.string()).openapi({ example: ["class1", "class2"] }),
        meta_data: z.record(z.string(), z.any()).openapi({
            example: {
                specialization: "Mathematics",
                experience_years: 5,
                qualifications: ["B.Ed", "M.Sc"],
            },
        }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Teacher" });

// Schema for teacher with profile data
export const teacherWithProfileSchema = teacherSchema
    .extend({
        teacher_profile: z
            .object({
                id: z.string(),
                user_id: z.string(),
                email: z.string(),
                first_name: z.string(),
                last_name: z.string(),
                phone: z.string(),
                address: z.string(),
                last_login: z.string().optional(),
                meta_data: z.record(z.string(), z.any()),
                is_active: z.boolean(),
                is_deleted: z.boolean(),
                user_type: z.string(),
                campus_id: z.string(),
                created_at: z.string(),
                updated_at: z.string(),
            })
            .openapi({
                example: {
                    id: "user456",
                    user_id: "T12345",
                    email: "teacher@example.com",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                    address: "123 Main St, City, Country",
                    meta_data: { specialization: "Mathematics" },
                    is_active: true,
                    is_deleted: false,
                    user_type: "Teacher",
                    campus_id: "campus123",
                    created_at: "2023-01-01T00:00:00Z",
                    updated_at: "2023-01-01T00:00:00Z",
                },
            }),
        teacher_subjects: z
            .array(
                z.object({
                    id: z.string(),
                    campus_id: z.string(),
                    name: z.string(),
                    code: z.string(),
                    description: z.string(),
                    meta_data: z.record(z.string(), z.any()),
                    is_active: z.boolean(),
                    is_deleted: z.boolean(),
                    created_at: z.string(),
                    updated_at: z.string(),
                })
            )
            .openapi({
                example: [
                    {
                        id: "subject1",
                        campus_id: "campus123",
                        name: "Mathematics",
                        code: "MATH101",
                        description: "Basic mathematics course",
                        meta_data: { level: "Intermediate" },
                        is_active: true,
                        is_deleted: false,
                        created_at: "2023-01-01T00:00:00Z",
                        updated_at: "2023-01-01T00:00:00Z",
                    },
                ],
            }),
        teacher_classes: z
            .array(
                z.object({
                    id: z.string(),
                    campus_id: z.string(),
                    name: z.string(),
                    class_teacher_id: z.string(),
                    student_ids: z.array(z.string()),
                    student_count: z.number(),
                    academic_year: z.string(),
                    class_in_charge: z.array(z.string()),
                    meta_data: z.record(z.string(), z.any()),
                    is_active: z.boolean(),
                    is_deleted: z.boolean(),
                    created_at: z.string(),
                    updated_at: z.string(),
                })
            )
            .openapi({
                example: [
                    {
                        id: "class1",
                        campus_id: "campus123",
                        name: "Class 10A",
                        class_teacher_id: "teacher123",
                        student_ids: ["student1", "student2"],
                        student_count: 30,
                        academic_year: "2023-2024",
                        class_in_charge: ["teacher123"],
                        meta_data: { section: "A" },
                        is_active: true,
                        is_deleted: false,
                        created_at: "2023-01-01T00:00:00Z",
                        updated_at: "2023-01-01T00:00:00Z",
                    },
                ],
            }),
    })
    .openapi({ ref: "TeacherWithProfile" });

// Create Teacher Request
export const createTeacherRequestBodySchema = z
    .object({
        user_id: z.string().openapi({ example: "user456" }),
        subjects: z
            .array(z.string())
            .optional()
            .openapi({ example: ["subject1", "subject2"] }),
        classes: z
            .array(z.string())
            .optional()
            .openapi({ example: ["class1", "class2"] }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: {
                    specialization: "Mathematics",
                    experience_years: 5,
                    qualifications: ["B.Ed", "M.Sc"],
                },
            }),
    })
    .openapi({ ref: "CreateTeacherRequest" });

export const createTeacherResponseSchema = teacherSchema.openapi({
    ref: "CreateTeacherResponse",
});

// Update Teacher Request
export const updateTeacherRequestBodySchema = z
    .object({
        subjects: z
            .array(z.string())
            .optional()
            .openapi({ example: ["subject3", "subject4"] }),
        classes: z
            .array(z.string())
            .optional()
            .openapi({ example: ["class3", "class4"] }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({
                example: {
                    specialization: "Physics",
                    experience_years: 6,
                    qualifications: ["B.Ed", "M.Sc", "Ph.D"],
                },
            }),
    })
    .openapi({ ref: "UpdateTeacherRequest" });

export const updateTeacherResponseSchema = teacherSchema.openapi({
    ref: "UpdateTeacherResponse",
});

// Get Teachers Response
export const getTeachersResponseSchema = z
    .array(teacherWithProfileSchema)
    .openapi({ ref: "GetTeachersResponse" });

// Get Teacher Classes Response
export const getTeacherClassesResponseSchema = z
    .array(
        z.object({
            id: z.string(),
            campus_id: z.string(),
            name: z.string(),
            class_teacher_id: z.string(),
            student_ids: z.array(z.string()),
            student_count: z.number(),
            academic_year: z.string(),
            class_in_charge: z.array(z.string()),
            meta_data: z.record(z.string(), z.any()),
            is_active: z.boolean(),
            is_deleted: z.boolean(),
            created_at: z.string(),
            updated_at: z.string(),
        })
    )
    .openapi({ ref: "GetTeacherClassesResponse" });

// Get Teacher Subjects Response
export const getTeacherSubjectsResponseSchema = z
    .array(
        z.object({
            id: z.string(),
            campus_id: z.string(),
            name: z.string(),
            code: z.string(),
            description: z.string(),
            meta_data: z.record(z.string(), z.any()),
            is_active: z.boolean(),
            is_deleted: z.boolean(),
            created_at: z.string(),
            updated_at: z.string(),
        })
    )
    .openapi({ ref: "GetTeacherSubjectsResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
