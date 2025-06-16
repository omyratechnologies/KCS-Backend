import z from "zod";

import "zod-openapi/extend";

// Schema for course data
export const courseSchema = z
    .object({
        id: z.string().openapi({ example: "course123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        course_name: z
            .string()
            .openapi({ example: "Introduction to Computer Science" }),
        course_code: z.string().openapi({ example: "CS101" }),
        course_description: z
            .string()
            .openapi({
                example:
                    "A comprehensive introduction to computer science principles",
            }),
        course_meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { credits: 3, level: "Beginner" } }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "Course" });

// Create Course Request
export const createCourseRequestBodySchema = z
    .object({
        course_name: z
            .string()
            .openapi({ example: "Introduction to Computer Science" }),
        course_code: z.string().openapi({ example: "CS101" }),
        course_description: z
            .string()
            .openapi({
                example:
                    "A comprehensive introduction to computer science principles",
            }),
        course_meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { credits: 3, level: "Beginner" } }),
    })
    .openapi({ ref: "CreateCourseRequest" });

export const createCourseResponseSchema = courseSchema.openapi({
    ref: "CreateCourseResponse",
});

// Update Course Request
export const updateCourseRequestBodySchema = z
    .object({
        course_name: z
            .string()
            .optional()
            .openapi({ example: "Advanced Computer Science" }),
        course_code: z.string().optional().openapi({ example: "CS201" }),
        course_description: z
            .string()
            .optional()
            .openapi({
                example: "An advanced course in computer science principles",
            }),
        course_meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({ example: { credits: 4, level: "Intermediate" } }),
        is_active: z.boolean().optional().openapi({ example: true }),
    })
    .openapi({ ref: "UpdateCourseRequest" });

export const updateCourseResponseSchema = courseSchema.openapi({
    ref: "UpdateCourseResponse",
});

// Get Courses Response
export const getCoursesResponseSchema = z
    .array(courseSchema)
    .openapi({ ref: "GetCoursesResponse" });

// Delete Course Response
export const deleteCourseResponseSchema = courseSchema.openapi({
    ref: "DeleteCourseResponse",
});

// Course Assignment Schema
export const courseAssignmentSchema = z
    .object({
        id: z.string().openapi({ example: "assignment123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        course_id: z.string().openapi({ example: "course123" }),
        title: z.string().openapi({ example: "Midterm Project" }),
        description: z
            .string()
            .openapi({ example: "Create a simple web application" }),
        due_date: z.string().openapi({ example: "2023-03-15T23:59:59Z" }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "CourseAssignment" });

// Create Course Assignment Request
export const createCourseAssignmentRequestBodySchema = z
    .object({
        title: z.string().openapi({ example: "Midterm Project" }),
        description: z
            .string()
            .openapi({ example: "Create a simple web application" }),
        due_date: z.string().openapi({ example: "2023-03-15T23:59:59Z" }),
    })
    .openapi({ ref: "CreateCourseAssignmentRequest" });

export const createCourseAssignmentResponseSchema =
    courseAssignmentSchema.openapi({ ref: "CreateCourseAssignmentResponse" });

// Update Course Assignment Request
export const updateCourseAssignmentRequestBodySchema = z
    .object({
        title: z
            .string()
            .optional()
            .openapi({ example: "Updated Midterm Project" }),
        description: z
            .string()
            .optional()
            .openapi({ example: "Create a full-stack web application" }),
        due_date: z
            .string()
            .optional()
            .openapi({ example: "2023-03-20T23:59:59Z" }),
        is_active: z.boolean().optional().openapi({ example: true }),
    })
    .openapi({ ref: "UpdateCourseAssignmentRequest" });

export const updateCourseAssignmentResponseSchema =
    courseAssignmentSchema.openapi({ ref: "UpdateCourseAssignmentResponse" });

// Get Course Assignments Response
export const getCourseAssignmentsResponseSchema = z
    .array(courseAssignmentSchema)
    .openapi({ ref: "GetCourseAssignmentsResponse" });

// Course Content Schema
export const courseContentSchema = z
    .object({
        id: z.string().openapi({ example: "content123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        course_id: z.string().openapi({ example: "course123" }),
        title: z.string().openapi({ example: "Week 1: Introduction" }),
        content: z
            .string()
            .openapi({
                example: "This week we will cover the basics of programming",
            }),
        content_type: z.string().openapi({ example: "text" }),
        order: z.number().openapi({ example: 1 }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "CourseContent" });

// Create Course Content Request
export const createCourseContentRequestBodySchema = z
    .object({
        title: z.string().openapi({ example: "Week 1: Introduction" }),
        content: z
            .string()
            .openapi({
                example: "This week we will cover the basics of programming",
            }),
        content_type: z.string().openapi({ example: "text" }),
        order: z.number().openapi({ example: 1 }),
    })
    .openapi({ ref: "CreateCourseContentRequest" });

export const createCourseContentResponseSchema = courseContentSchema.openapi({
    ref: "CreateCourseContentResponse",
});

// Update Course Content Request
export const updateCourseContentRequestBodySchema = z
    .object({
        title: z
            .string()
            .optional()
            .openapi({ example: "Week 1: Revised Introduction" }),
        content: z
            .string()
            .optional()
            .openapi({ example: "Updated content for week 1" }),
        content_type: z.string().optional().openapi({ example: "text" }),
        order: z.number().optional().openapi({ example: 2 }),
    })
    .openapi({ ref: "UpdateCourseContentRequest" });

export const updateCourseContentResponseSchema = courseContentSchema.openapi({
    ref: "UpdateCourseContentResponse",
});

// Get Course Contents Response
export const getCourseContentsResponseSchema = z
    .array(courseContentSchema)
    .openapi({ ref: "GetCourseContentsResponse" });

// Course Assignment Submission Schema
export const courseAssignmentSubmissionSchema = z
    .object({
        id: z.string().openapi({ example: "submission123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        course_id: z.string().openapi({ example: "course123" }),
        assignment_id: z.string().openapi({ example: "assignment123" }),
        user_id: z.string().openapi({ example: "user123" }),
        content: z
            .string()
            .openapi({ example: "My submission for the midterm project" }),
        submission_date: z
            .string()
            .openapi({ example: "2023-03-14T15:30:00Z" }),
        grade: z.number().optional().openapi({ example: 85 }),
        feedback: z
            .string()
            .optional()
            .openapi({
                example: "Good work, but could improve code organization",
            }),
        is_active: z.boolean().openapi({ example: true }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "CourseAssignmentSubmission" });

// Create Course Assignment Submission Request
export const createCourseAssignmentSubmissionRequestBodySchema = z
    .object({
        user_id: z.string().openapi({ example: "user123" }),
        content: z
            .string()
            .openapi({ example: "My submission for the midterm project" }),
        submission_date: z
            .string()
            .openapi({ example: "2023-03-14T15:30:00Z" }),
    })
    .openapi({ ref: "CreateCourseAssignmentSubmissionRequest" });

export const createCourseAssignmentSubmissionResponseSchema =
    courseAssignmentSubmissionSchema.openapi({
        ref: "CreateCourseAssignmentSubmissionResponse",
    });

// Update Course Assignment Submission Request
export const updateCourseAssignmentSubmissionRequestBodySchema = z
    .object({
        content: z
            .string()
            .optional()
            .openapi({ example: "Updated submission for the midterm project" }),
        grade: z.number().optional().openapi({ example: 90 }),
        feedback: z
            .string()
            .optional()
            .openapi({ example: "Excellent improvement in code organization" }),
    })
    .openapi({ ref: "UpdateCourseAssignmentSubmissionRequest" });

export const updateCourseAssignmentSubmissionResponseSchema =
    courseAssignmentSubmissionSchema.openapi({
        ref: "UpdateCourseAssignmentSubmissionResponse",
    });

// Get Course Assignment Submissions Response
export const getCourseAssignmentSubmissionsResponseSchema = z
    .array(courseAssignmentSubmissionSchema)
    .openapi({ ref: "GetCourseAssignmentSubmissionsResponse" });

// Course Enrollment Schema
export const courseEnrollmentSchema = z
    .object({
        id: z.string().openapi({ example: "enrollment123" }),
        campus_id: z.string().openapi({ example: "campus123" }),
        course_id: z.string().openapi({ example: "course123" }),
        user_id: z.string().openapi({ example: "user123" }),
        enrollment_date: z
            .string()
            .openapi({ example: "2023-01-15T00:00:00Z" }),
        status: z.string().openapi({ example: "active" }),
        progress: z.number().openapi({ example: 25 }),
        is_deleted: z.boolean().openapi({ example: false }),
        created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
        updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    })
    .openapi({ ref: "CourseEnrollment" });

// Create Course Enrollment Request
export const createCourseEnrollmentRequestBodySchema = z
    .object({
        enrollmentData: z
            .object({
                enrollment_date: z
                    .string()
                    .openapi({ example: "2023-01-15T00:00:00Z" }),
                status: z.string().openapi({ example: "active" }),
                progress: z.number().openapi({ example: 0 }),
            })
            .openapi({
                example: {
                    enrollment_date: "2023-01-15T00:00:00Z",
                    status: "active",
                    progress: 0,
                },
            }),
    })
    .openapi({ ref: "CreateCourseEnrollmentRequest" });

export const createCourseEnrollmentResponseSchema =
    courseEnrollmentSchema.openapi({ ref: "CreateCourseEnrollmentResponse" });

// Update Course Enrollment Request
export const updateCourseEnrollmentRequestBodySchema = z
    .object({
        status: z.string().optional().openapi({ example: "completed" }),
        progress: z.number().optional().openapi({ example: 100 }),
    })
    .openapi({ ref: "UpdateCourseEnrollmentRequest" });

export const updateCourseEnrollmentResponseSchema =
    courseEnrollmentSchema.openapi({ ref: "UpdateCourseEnrollmentResponse" });

// Get Course Enrollments Response
export const getCourseEnrollmentsResponseSchema = z
    .array(courseEnrollmentSchema)
    .openapi({ ref: "GetCourseEnrollmentsResponse" });
