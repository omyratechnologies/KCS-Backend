import z from "zod";

import "zod-openapi/extend";

// Base notification schema with common fields
const baseNotificationSchema = {
    id: z.string().openapi({ example: "notification123" }),
    campus_id: z.string().openapi({ example: "campus123" }),
    title: z.string().openapi({ example: "Important Announcement" }),
    message: z
        .string()
        .openapi({
            example: "This is an important notification for all users.",
        }),
    meta_data: z
        .record(z.string(), z.any())
        .openapi({ example: { priority: "high", category: "announcement" } }),
    is_active: z.boolean().openapi({ example: true }),
    is_deleted: z.boolean().openapi({ example: false }),
    created_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
    updated_at: z.string().openapi({ example: "2023-01-01T00:00:00Z" }),
};

// Campus Wide Notification Schema
export const campusWideNotificationSchema = z
    .object({
        ...baseNotificationSchema,
    })
    .openapi({ ref: "CampusWideNotification" });

// Class Notification Schema
export const classNotificationSchema = z
    .object({
        ...baseNotificationSchema,
        class_id: z.string().openapi({ example: "class123" }),
    })
    .openapi({ ref: "ClassNotification" });

// User-specific notification schema with common fields
const userNotificationSchema = {
    ...baseNotificationSchema,
    user_id: z.string().openapi({ example: "user123" }),
    is_seen: z.boolean().openapi({ example: false }),
};

// Parent Notification Schema
export const parentNotificationSchema = z
    .object({
        ...userNotificationSchema,
    })
    .openapi({ ref: "ParentNotification" });

// Student Notification Schema
export const studentNotificationSchema = z
    .object({
        ...userNotificationSchema,
    })
    .openapi({ ref: "StudentNotification" });

// Teacher Notification Schema
export const teacherNotificationSchema = z
    .object({
        ...userNotificationSchema,
    })
    .openapi({ ref: "TeacherNotification" });

// Create Campus Wide Notification Request
export const createCampusWideNotificationRequestBodySchema = z
    .object({
        title: z.string().openapi({ example: "Important Announcement" }),
        message: z
            .string()
            .openapi({
                example: "This is an important notification for all users.",
            }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({
                example: { priority: "high", category: "announcement" },
            }),
    })
    .openapi({ ref: "CreateCampusWideNotificationRequest" });

export const createCampusWideNotificationResponseSchema =
    campusWideNotificationSchema.openapi({
        ref: "CreateCampusWideNotificationResponse",
    });

// Create Class Notification Request
export const createClassNotificationRequestBodySchema = z
    .object({
        class_id: z.string().openapi({ example: "class123" }),
        title: z.string().openapi({ example: "Class Announcement" }),
        message: z
            .string()
            .openapi({
                example: "This is an important notification for this class.",
            }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({
                example: { priority: "medium", category: "class_announcement" },
            }),
    })
    .openapi({ ref: "CreateClassNotificationRequest" });

export const createClassNotificationResponseSchema =
    classNotificationSchema.openapi({ ref: "CreateClassNotificationResponse" });

// Create Parent Notification Request
export const createParentNotificationRequestBodySchema = z
    .object({
        user_id: z.string().openapi({ example: "parent123" }),
        title: z.string().openapi({ example: "Parent Meeting" }),
        message: z
            .string()
            .openapi({
                example: "There is a parent-teacher meeting scheduled.",
            }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { priority: "high", category: "meeting" } }),
    })
    .openapi({ ref: "CreateParentNotificationRequest" });

export const createParentNotificationResponseSchema =
    parentNotificationSchema.openapi({
        ref: "CreateParentNotificationResponse",
    });

// Create Student Notification Request
export const createStudentNotificationRequestBodySchema = z
    .object({
        user_id: z.string().openapi({ example: "student123" }),
        title: z.string().openapi({ example: "Assignment Due" }),
        message: z
            .string()
            .openapi({ example: "Your assignment is due tomorrow." }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { priority: "high", category: "assignment" } }),
    })
    .openapi({ ref: "CreateStudentNotificationRequest" });

export const createStudentNotificationResponseSchema =
    studentNotificationSchema.openapi({
        ref: "CreateStudentNotificationResponse",
    });

// Create Teacher Notification Request
export const createTeacherNotificationRequestBodySchema = z
    .object({
        user_id: z.string().openapi({ example: "teacher123" }),
        title: z.string().openapi({ example: "Staff Meeting" }),
        message: z
            .string()
            .openapi({ example: "There is a staff meeting scheduled." }),
        meta_data: z
            .record(z.string(), z.any())
            .openapi({ example: { priority: "medium", category: "meeting" } }),
    })
    .openapi({ ref: "CreateTeacherNotificationRequest" });

export const createTeacherNotificationResponseSchema =
    teacherNotificationSchema.openapi({
        ref: "CreateTeacherNotificationResponse",
    });

// Update Notification Request (generic for all types)
export const updateNotificationRequestBodySchema = z
    .object({
        title: z
            .string()
            .optional()
            .openapi({ example: "Updated Announcement" }),
        message: z
            .string()
            .optional()
            .openapi({ example: "This is an updated notification." }),
        meta_data: z
            .record(z.string(), z.any())
            .optional()
            .openapi({ example: { priority: "low", category: "general" } }),
        is_active: z.boolean().optional().openapi({ example: true }),
        is_seen: z.boolean().optional().openapi({ example: true }),
    })
    .openapi({ ref: "UpdateNotificationRequest" });

// Get Notifications Response
export const getCampusWideNotificationsResponseSchema = z
    .array(campusWideNotificationSchema)
    .openapi({ ref: "GetCampusWideNotificationsResponse" });
export const getClassNotificationsResponseSchema = z
    .array(classNotificationSchema)
    .openapi({ ref: "GetClassNotificationsResponse" });
export const getParentNotificationsResponseSchema = z
    .array(parentNotificationSchema)
    .openapi({ ref: "GetParentNotificationsResponse" });
export const getStudentNotificationsResponseSchema = z
    .array(studentNotificationSchema)
    .openapi({ ref: "GetStudentNotificationsResponse" });
export const getTeacherNotificationsResponseSchema = z
    .array(teacherNotificationSchema)
    .openapi({ ref: "GetTeacherNotificationsResponse" });

// Error Response
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "An error occurred" }),
    })
    .openapi({ ref: "ErrorResponse" });
