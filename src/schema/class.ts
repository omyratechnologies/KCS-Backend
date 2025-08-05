import z from "zod";

import "zod-openapi/extend";

// Schema for class data
export const classSchema = z
    .object({
        id: z.string().openapi({ example: "class123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        name: z.string().openapi({ example: "Class 10A" }),
        class_teacher_id: z.string().openapi({ example: "teacher123" }),
        student_ids: z
            .array(z.string())
            .openapi({ example: ["student1", "student2"] }),
        student_count: z.number().openapi({ example: 30 }),
        academic_year: z.string().openapi({ example: "2023-2024" }),
        teacher_ids: z
            .array(z.string())
            .openapi({ example: ["teacher1", "teacher2"] }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { section: "A", floor: 2 } }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Class" });

// Create Class Request
export const createClassRequestBodySchema = z
    .object({
        classData: z
            .object({
                name: z.string().openapi({ example: "Class 10A" }),
                class_teacher_id: z
                    .string()
                    .optional()
                    .openapi({ example: "teacher123" }),
                student_ids: z
                    .array(z.string())
                    .openapi({ example: ["student1", "student2"] }),
                student_count: z.number().openapi({ example: 30 }),
                academic_year: z.string().openapi({ example: "2023-2024" }),
                teacher_ids: z
                    .array(z.string())
                    .openapi({ example: ["teacher1", "teacher2"] }),
            })
            .openapi({
                example: {
                    name: "Class 10A",
                    class_teacher_id: "teacher123",
                    student_ids: ["student1", "student2"],
                    student_count: 30,
                    academic_year: "2023-2024",
                    teacher_ids: ["teacher1", "teacher2"],
                },
            }),
    })
    .openapi({ ref: "CreateClassRequest" });

export const createClassResponseSchema = classSchema.openapi({
    ref: "CreateClassResponse",
});

// Update Class Request
export const updateClassRequestBodySchema = z
    .object({
        classData: z
            .object({
                name: z.string().optional().openapi({ example: "Class 10B" }),
                class_teacher_id: z
                    .string()
                    .optional()
                    .openapi({ example: "teacher456" }),
                student_ids: z
                    .array(z.string())
                    .optional()
                    .openapi({ example: ["student3", "student4"] }),
                student_count: z.number().optional().openapi({ example: 25 }),
                academic_year: z
                    .string()
                    .optional()
                    .openapi({ example: "2023-2024" }),
                teacher_ids: z
                    .array(z.string())
                    .optional()
                    .openapi({ example: ["teacher3", "teacher4"] }),
                meta_data: z
                    .record(z.string(), z.any())
                    .optional()
                    .openapi({ example: { section: "B", floor: 3 } }),
                is_active: z.boolean().optional().openapi({ example: true }),
                is_deleted: z.boolean().optional().openapi({ example: false }),
            })
            .openapi({
                example: {
                    name: "Class 10B",
                    class_teacher_id: "teacher456",
                    student_count: 25,
                },
            }),
    })
    .openapi({ ref: "UpdateClassRequest" });

export const updateClassResponseSchema = classSchema.openapi({
    ref: "UpdateClassResponse",
});

// Class Subject Schema
export const classSubjectSchema = z
    .object({
        id: z.string().openapi({ example: "classSubject123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        class_id: z.string().openapi({ example: "class123" }),
        subject_id: z.string().openapi({ example: "subject123" }),
        teacher_id: z.string().openapi({ example: "teacher123" }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "ClassSubject" });

// Create Class Subject Request
export const createClassSubjectRequestBodySchema = z
    .object({
        classSubjectData: z
            .object({
                subject_id: z.string().openapi({ example: "subject123" }),
                teacher_id: z.string().openapi({ example: "teacher123" }),
            })
            .openapi({
                example: {
                    subject_id: "subject123",
                    teacher_id: "teacher123",
                },
            }),
    })
    .openapi({ ref: "CreateClassSubjectRequest" });

export const createClassSubjectResponseSchema = classSubjectSchema.openapi({
    ref: "CreateClassSubjectResponse",
});

// Update Class Subject Request
export const updateClassSubjectRequestBodySchema = z
    .object({
        classSubjectData: z
            .object({
                subject_id: z
                    .string()
                    .optional()
                    .openapi({ example: "subject456" }),
                teacher_id: z
                    .string()
                    .optional()
                    .openapi({ example: "teacher456" }),
            })
            .openapi({
                example: {
                    teacher_id: "teacher456",
                },
            }),
    })
    .openapi({ ref: "UpdateClassSubjectRequest" });

export const updateClassSubjectResponseSchema = classSubjectSchema.openapi({
    ref: "UpdateClassSubjectResponse",
});

// Assignment Schema
export const assignmentSchema = z
    .object({
        id: z.string().openapi({ example: "assignment123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        class_id: z.string().openapi({ example: "class123" }),
        subject_id: z.string().openapi({ example: "subject123" }),
        user_id: z.string().openapi({ example: "user123" }),
        title: z.string().openapi({ example: "Math Assignment 1" }),
        description: z.string().openapi({ example: "Complete problems 1-10" }),
        due_date: z.string().openapi({ example: "2023-01-15T00:00:00Z" }),
        is_graded: z.boolean().openapi({ example: false }),
        meta_data: z.object({}).openapi({ example: {} }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Assignment" });

// Create Assignment Request
export const createAssignmentRequestBodySchema = z
    .object({
        title: z.string().openapi({ example: "Math Assignment 1" }),
        description: z.string().openapi({ example: "Complete problems 1-10" }),
        due_date: z.string().openapi({ example: "2023-01-15T00:00:00Z" }),
        subject_id: z.string().openapi({ example: "subject123" }),
        is_graded: z.boolean().optional().openapi({ example: false }),
        meta_data: z.object({}).optional().openapi({ example: {} }),
    })
    .openapi({ ref: "CreateAssignmentRequest" });

export const createAssignmentResponseSchema = assignmentSchema.openapi({
    ref: "CreateAssignmentResponse",
});

// Update Assignment Request
export const updateAssignmentRequestBodySchema = z
    .object({
        title: z
            .string()
            .optional()
            .openapi({ example: "Updated Math Assignment" }),
        description: z
            .string()
            .optional()
            .openapi({ example: "Updated description" }),
        due_date: z
            .string()
            .optional()
            .openapi({ example: "2023-01-20T00:00:00Z" }),
        subject_id: z.string().optional().openapi({ example: "subject456" }),
    })
    .openapi({ ref: "UpdateAssignmentRequest" });

export const updateAssignmentResponseSchema = assignmentSchema.openapi({
    ref: "UpdateAssignmentResponse",
});

// Assignment Submission Schema
export const assignmentSubmissionSchema = z
    .object({
        id: z.string().openapi({ example: "submission123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        assignment_id: z.string().openapi({ example: "assignment123" }),
        user_id: z.string().openapi({ example: "student123" }),
        submission_date: z
            .string()
            .openapi({ example: "2023-01-10T00:00:00Z" }),
        grade: z.number().optional().openapi({ example: 95 }),
        feedback: z.string().optional().openapi({ example: "Great work!" }),
        meta_data: z
            .object({})
            .optional()
            .openapi({
                example: { content: "My assignment submission", files: [] },
            }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "AssignmentSubmission" });

// Create Assignment Submission Request
export const createAssignmentSubmissionRequestBodySchema = z
    .object({
        user_id: z.string().openapi({ example: "student123" }),
        submission_date: z
            .string()
            .optional()
            .openapi({ example: "2023-01-10T00:00:00Z" }),
        meta_data: z
            .object({})
            .optional()
            .openapi({
                example: {
                    content: "My assignment submission",
                    files: ["file1.pdf", "file2.docx"],
                    notes: "Additional notes about the submission",
                },
            }),
        grade: z.number().optional().openapi({ example: 95 }),
        feedback: z.string().optional().openapi({ example: "Great work!" }),
    })
    .openapi({ ref: "CreateAssignmentSubmissionRequest" });

export const createAssignmentSubmissionResponseSchema =
    assignmentSubmissionSchema.openapi({
        ref: "CreateAssignmentSubmissionResponse",
    });

// Get Classes Response
export const getClassesResponseSchema = z
    .array(classSchema)
    .openapi({ ref: "GetClassesResponse" });

// Get Class Subjects Response
export const getClassSubjectsResponseSchema = z
    .array(classSubjectSchema)
    .openapi({ ref: "GetClassSubjectsResponse" });

// Get Assignments Response
export const getAssignmentsResponseSchema = z
    .array(assignmentSchema)
    .openapi({ ref: "GetAssignmentsResponse" });

// Get Assignment Submissions Response
export const getAssignmentSubmissionsResponseSchema = z
    .array(assignmentSubmissionSchema)
    .openapi({ ref: "GetAssignmentSubmissionsResponse" });

// Student info schema for class students response
export const studentInfoSchema = z
    .object({
        id: z.string().openapi({ example: "student123" }),
        user_id: z.string().openapi({ example: "student123" }),
        name: z.string().openapi({ example: "John Doe" }),
    })
    .openapi({ ref: "StudentInfo" });

// Get Students by Class ID Response
export const getStudentsByClassIdResponseSchema = z
    .object({
        class_id: z.string().openapi({ example: "class123" }),
        students: z.array(studentInfoSchema).openapi({
            example: [
                { id: "student1", user_id: "student1", name: "John Doe" },
                { id: "student2", user_id: "student2", name: "Jane Smith" },
            ],
        }),
        total_students: z.number().openapi({ example: 2 }),
    })
    .openapi({ ref: "GetStudentsByClassIdResponse" });

// Delete Response
export const deleteResponseSchema = z
    .object({
        message: z
            .string()
            .openapi({ example: "Resource deleted successfully" }),
    })
    .openapi({ ref: "DeleteResponse" });

// Assign Students to Class Request
export const assignStudentsRequestBodySchema = z
    .object({
        student_ids: z
            .array(z.string().min(1))
            .min(1)
            .openapi({
                example: ["student1", "student2", "student3"],
                description: "Array of student IDs to assign to the class",
            }),
    })
    .openapi({ ref: "AssignStudentsRequest" });

// Assign Teachers to Class Request
export const assignTeachersRequestBodySchema = z
    .object({
        teacher_ids: z
            .array(z.string().min(1))
            .min(1)
            .openapi({
                example: ["teacher1", "teacher2"],
                description: "Array of teacher IDs to assign to the class",
            }),
    })
    .openapi({ ref: "AssignTeachersRequest" });

// Assignment Response Schema
export const assignmentResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        message: z
            .string()
            .openapi({ example: "Students assigned to class successfully" }),
        data: classSchema,
    })
    .openapi({ ref: "AssignmentResponse" });
