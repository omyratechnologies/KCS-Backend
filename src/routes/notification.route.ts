import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { NotificationController } from "@/controllers/notification.controller";
import {
    campusWideNotificationSchema,
    classNotificationSchema,
    createCampusWideNotificationRequestBodySchema,
    createCampusWideNotificationResponseSchema,
    createClassNotificationRequestBodySchema,
    createClassNotificationResponseSchema,
    createParentNotificationRequestBodySchema,
    createParentNotificationResponseSchema,
    createStudentNotificationRequestBodySchema,
    createStudentNotificationResponseSchema,
    createTeacherNotificationRequestBodySchema,
    createTeacherNotificationResponseSchema,
    errorResponseSchema,
    getCampusWideNotificationsResponseSchema,
    getClassNotificationsResponseSchema,
    getParentNotificationsResponseSchema,
    getStudentNotificationsResponseSchema,
    getTeacherNotificationsResponseSchema,
    parentNotificationSchema,
    studentNotificationSchema,
    teacherNotificationSchema,
    updateNotificationRequestBodySchema,
} from "@/schema/notification";

const app = new Hono();

// Campus Wide Notification Routes
app.post(
    "/campus_wide",
    describeRoute({
        operationId: "createCampusWideNotification",
        summary: "Create a campus-wide notification",
        description:
            "Creates a new notification that applies to the entire campus",
        tags: ["Notification"],
        responses: {
            200: {
                description: "Campus-wide notification created successfully",
                content: {
                    "application/json": {
                        schema: resolver(
                            createCampusWideNotificationResponseSchema
                        ),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createCampusWideNotificationRequestBodySchema),
    NotificationController.createCampusWideNotification
);

app.get(
    "/campus_wide/",
    describeRoute({
        operationId: "getCampusWideNotifications",
        summary: "Get all campus-wide notifications",
        description: "Retrieves all campus-wide notifications for a campus",
        tags: ["Notification"],
        responses: {
            200: {
                description: "List of campus-wide notifications",
                content: {
                    "application/json": {
                        schema: resolver(
                            getCampusWideNotificationsResponseSchema
                        ),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getCampusWideNotifications
);

app.get(
    "/campus_wide/:id",
    describeRoute({
        operationId: "getCampusWideNotificationById",
        summary: "Get campus-wide notification by ID",
        description: "Retrieves a specific campus-wide notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Campus-wide notification details",
                content: {
                    "application/json": {
                        schema: resolver(campusWideNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getCampusWideNotificationById
);

app.put(
    "/campus_wide/:id",
    describeRoute({
        operationId: "updateCampusWideNotification",
        summary: "Update a campus-wide notification",
        description: "Updates a specific campus-wide notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Campus-wide notification updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(campusWideNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", updateNotificationRequestBodySchema),
    NotificationController.updateCampusWideNotification
);

app.delete(
    "/campus_wide/:id",
    describeRoute({
        operationId: "deleteCampusWideNotification",
        summary: "Delete a campus-wide notification",
        description: "Deletes a specific campus-wide notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Campus-wide notification deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(campusWideNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.deleteCampusWideNotification
);

// Class Notification Routes
app.post(
    "/class",
    describeRoute({
        operationId: "createClassNotification",
        summary: "Create a class notification",
        description: "Creates a new notification for a specific class",
        tags: ["Notification"],
        responses: {
            200: {
                description: "Class notification created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createClassNotificationResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createClassNotificationRequestBodySchema),
    NotificationController.createClassNotification
);

app.get(
    "/class/:class_id",
    describeRoute({
        operationId: "getClassNotifications",
        summary: "Get class notifications",
        description: "Retrieves all notifications for a specific class",
        tags: ["Notification"],
        parameters: [
            {
                name: "class_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Class ID",
            },
        ],
        responses: {
            200: {
                description: "List of class notifications",
                content: {
                    "application/json": {
                        schema: resolver(getClassNotificationsResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getClassNotifications
);

app.get(
    "/class/:id",
    describeRoute({
        operationId: "getClassNotificationById",
        summary: "Get class notification by ID",
        description: "Retrieves a specific class notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Class notification details",
                content: {
                    "application/json": {
                        schema: resolver(classNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getClassNotificationById
);

app.put(
    "/class/:id",
    describeRoute({
        operationId: "updateClassNotification",
        summary: "Update a class notification",
        description: "Updates a specific class notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Class notification updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(classNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", updateNotificationRequestBodySchema),
    NotificationController.updateClassNotification
);

app.delete(
    "/class/:id",
    describeRoute({
        operationId: "deleteClassNotification",
        summary: "Delete a class notification",
        description: "Deletes a specific class notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Class notification deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(classNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.deleteClassNotification
);

// Parent Notification Routes
app.post(
    "/parent",
    describeRoute({
        operationId: "createParentNotification",
        summary: "Create a parent notification",
        description: "Creates a new notification for a specific parent",
        tags: ["Notification"],
        responses: {
            200: {
                description: "Parent notification created successfully",
                content: {
                    "application/json": {
                        schema: resolver(
                            createParentNotificationResponseSchema
                        ),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createParentNotificationRequestBodySchema),
    NotificationController.createParentNotification
);

app.get(
    "/parent",
    describeRoute({
        operationId: "getParentNotifications",
        summary: "Get parent notifications",
        description: "Retrieves all notifications for the current parent user",
        tags: ["Notification"],
        responses: {
            200: {
                description: "List of parent notifications",
                content: {
                    "application/json": {
                        schema: resolver(getParentNotificationsResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getParentNotifications
);

app.get(
    "/parent/:id",
    describeRoute({
        operationId: "getParentNotificationById",
        summary: "Get parent notification by ID",
        description: "Retrieves a specific parent notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Parent notification details",
                content: {
                    "application/json": {
                        schema: resolver(parentNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getParentNotificationById
);

app.put(
    "/parent/:id",
    describeRoute({
        operationId: "updateParentNotification",
        summary: "Update a parent notification",
        description: "Updates a specific parent notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Parent notification updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(parentNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", updateNotificationRequestBodySchema),
    NotificationController.updateParentNotification
);

app.delete(
    "/parent/:id",
    describeRoute({
        operationId: "deleteParentNotification",
        summary: "Delete a parent notification",
        description: "Deletes a specific parent notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Parent notification deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(parentNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.deleteParentNotification
);

// Student Notification Routes
app.post(
    "/student",
    describeRoute({
        operationId: "createStudentNotification",
        summary: "Create a student notification",
        description: "Creates a new notification for a specific student",
        tags: ["Notification"],
        responses: {
            200: {
                description: "Student notification created successfully",
                content: {
                    "application/json": {
                        schema: resolver(
                            createStudentNotificationResponseSchema
                        ),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createStudentNotificationRequestBodySchema),
    NotificationController.createStudentNotification
);

app.get(
    "/student",
    describeRoute({
        operationId: "getStudentNotifications",
        summary: "Get student notifications",
        description: "Retrieves all notifications for the current student user",
        tags: ["Notification"],
        responses: {
            200: {
                description: "List of student notifications",
                content: {
                    "application/json": {
                        schema: resolver(getStudentNotificationsResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getStudentNotifications
);

app.get(
    "/student/:id",
    describeRoute({
        operationId: "getStudentNotificationById",
        summary: "Get student notification by ID",
        description: "Retrieves a specific student notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Student notification details",
                content: {
                    "application/json": {
                        schema: resolver(studentNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getStudentNotificationById
);

app.put(
    "/student/:id",
    describeRoute({
        operationId: "updateStudentNotification",
        summary: "Update a student notification",
        description: "Updates a specific student notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Student notification updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", updateNotificationRequestBodySchema),
    NotificationController.updateStudentNotification
);

app.delete(
    "/student/:id",
    describeRoute({
        operationId: "deleteStudentNotification",
        summary: "Delete a student notification",
        description: "Deletes a specific student notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Student notification deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.deleteStudentNotification
);

// Teacher Notification Routes
app.post(
    "/teacher",
    describeRoute({
        operationId: "createTeacherNotification",
        summary: "Create a teacher notification",
        description: "Creates a new notification for a specific teacher",
        tags: ["Notification"],
        responses: {
            200: {
                description: "Teacher notification created successfully",
                content: {
                    "application/json": {
                        schema: resolver(
                            createTeacherNotificationResponseSchema
                        ),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createTeacherNotificationRequestBodySchema),
    NotificationController.createTeacherNotification
);

app.get(
    "/teacher",
    describeRoute({
        operationId: "getTeacherNotifications",
        summary: "Get teacher notifications",
        description: "Retrieves all notifications for the current teacher user",
        tags: ["Notification"],
        responses: {
            200: {
                description: "List of teacher notifications",
                content: {
                    "application/json": {
                        schema: resolver(getTeacherNotificationsResponseSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getTeacherNotifications
);

app.get(
    "/teacher/:id",
    describeRoute({
        operationId: "getTeacherNotificationById",
        summary: "Get teacher notification by ID",
        description: "Retrieves a specific teacher notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Teacher notification details",
                content: {
                    "application/json": {
                        schema: resolver(teacherNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.getTeacherNotificationById
);

app.put(
    "/teacher/:id",
    describeRoute({
        operationId: "updateTeacherNotification",
        summary: "Update a teacher notification",
        description: "Updates a specific teacher notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Teacher notification updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(teacherNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", updateNotificationRequestBodySchema),
    NotificationController.updateTeacherNotification
);

app.delete(
    "/teacher/:id",
    describeRoute({
        operationId: "deleteTeacherNotification",
        summary: "Delete a teacher notification",
        description: "Deletes a specific teacher notification by ID",
        tags: ["Notification"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Notification ID",
            },
        ],
        responses: {
            200: {
                description: "Teacher notification deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(teacherNotificationSchema),
                    },
                },
            },
            400: {
                description: "Bad request",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    NotificationController.deleteTeacherNotification
);

export default app;
