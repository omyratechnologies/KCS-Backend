import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { CourseController } from "@/controllers/course.controller";
import {    courseAssignmentSubmissionSchema,
    courseContentSchema,
    courseEnrollmentSchema,
    courseSchema,    createCourseAssignmentSubmissionRequestBodySchema,
    createCourseAssignmentSubmissionResponseSchema,
    createCourseContentRequestBodySchema,
    createCourseContentResponseSchema,
    createCourseEnrollmentRequestBodySchema,
    createCourseEnrollmentResponseSchema,
    createCourseRequestBodySchema,
    createCourseResponseSchema,
    deleteCourseResponseSchema,    getCourseContentsResponseSchema,
    getCourseEnrollmentsResponseSchema,
    getCoursesResponseSchema,    updateCourseContentRequestBodySchema,
    updateCourseContentResponseSchema,
    updateCourseEnrollmentRequestBodySchema,
    updateCourseEnrollmentResponseSchema,
    updateCourseRequestBodySchema,
    updateCourseResponseSchema,
} from "@/schema/course";

const app = new Hono();

// Course routes
app.post(
    "/",
    describeRoute({
        tags: ["Course"],
        operationId: "createCourse",
        summary: "Create a new course",
        description: "Creates a new course in the system",
        responses: {
            200: {
                description: "Course created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createCourseResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createCourseRequestBodySchema),
    CourseController.createCourse
);

app.get(
    "/",
    describeRoute({
        tags: ["Course"],
        operationId: "getAllCourses",
        summary: "Get all courses",
        description: "Retrieves all courses for a campus",
        responses: {
            200: {
                description: "List of courses",
                content: {
                    "application/json": {
                        schema: resolver(getCoursesResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.getAllCourses
);

app.get(
    "/:course_id",
    describeRoute({
        tags: ["Course"],
        operationId: "getCourseById",
        summary: "Get course by ID",
        description: "Retrieves a specific course by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Course details",
                content: {
                    "application/json": {
                        schema: resolver(courseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.getCourseById
);

app.put(
    "/:course_id",
    describeRoute({
        tags: ["Course"],
        operationId: "updateCourse",
        summary: "Update a course",
        description: "Updates a specific course by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Course updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateCourseResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateCourseRequestBodySchema),
    CourseController.updateCourse
);

app.delete(
    "/:course_id",
    describeRoute({
        tags: ["Course"],
        operationId: "deleteCourse",
        summary: "Delete a course",
        description: "Deletes a specific course by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Course deleted successfully",
                content: {
                    "application/json": {
                        schema: resolver(deleteCourseResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.deleteCourse
);

// Course Content routes
app.post(
    "/:course_id/content",
    describeRoute({
        tags: ["Course"],
        operationId: "createCourseContent",
        summary: "Create course content",
        description: "Creates new content for a specific course",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Content created successfully",
                content: {
                    "application/json": {
                        schema: resolver(createCourseContentResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createCourseContentRequestBodySchema),
    CourseController.createCourseContent
);

app.get(
    "/:course_id/content",
    describeRoute({
        tags: ["Course"],
        operationId: "getAllCourseContents",
        summary: "Get all course contents",
        description: "Retrieves all content for a specific course",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "List of course contents",
                content: {
                    "application/json": {
                        schema: resolver(getCourseContentsResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.getAllCourseContents
);

app.get(
    "/:course_id/content/:content_id",
    describeRoute({
        tags: ["Course"],
        operationId: "getCourseContentById",
        summary: "Get course content by ID",
        description: "Retrieves specific content by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "content_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Content ID",
            },
        ],
        responses: {
            200: {
                description: "Content details",
                content: {
                    "application/json": {
                        schema: resolver(courseContentSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.getCourseContentById
);

app.put(
    "/:course_id/content/:content_id",
    describeRoute({
        tags: ["Course"],
        operationId: "updateCourseContent",
        summary: "Update course content",
        description: "Updates specific content by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "content_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Content ID",
            },
        ],
        responses: {
            200: {
                description: "Content updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateCourseContentResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateCourseContentRequestBodySchema),
    CourseController.updateCourseContent
);

app.delete(
    "/:course_id/content/:content_id",
    describeRoute({
        tags: ["Course"],
        operationId: "deleteCourseContent",
        summary: "Delete course content",
        description: "Deletes specific content by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "content_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Content ID",
            },
        ],
        responses: {
            200: {
                description: "Content deleted successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.deleteCourseContent
);

// Course Enrollment routes
app.post(
    "/:course_id/enroll",
    describeRoute({
        tags: ["Course"],
        operationId: "enrollInCourse",
        summary: "Enroll in a course",
        description: "Enrolls a user in a specific course",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Enrollment successful",
                content: {
                    "application/json": {
                        schema: resolver(createCourseEnrollmentResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", createCourseEnrollmentRequestBodySchema),
    CourseController.enrollInCourse
);

app.get(
    "/:course_id/enrollment",
    describeRoute({
        tags: ["Course"],
        operationId: "getCourseEnrollmentByCourseId",
        summary: "Get course enrollments by course ID",
        description: "Retrieves all enrollments for a specific course",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "List of course enrollments",
                content: {
                    "application/json": {
                        schema: resolver(getCourseEnrollmentsResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.getCourseEnrollmentByCourseId
);

app.get(
    "/:course_id/enrollment/:enrollment_id",
    describeRoute({
        tags: ["Course"],
        operationId: "getCourseEnrollmentById",
        summary: "Get course enrollment by ID",
        description: "Retrieves a specific enrollment by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "enrollment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Enrollment ID",
            },
        ],
        responses: {
            200: {
                description: "Enrollment details",
                content: {
                    "application/json": {
                        schema: resolver(courseEnrollmentSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.getCourseEnrollmentById
);

app.put(
    "/:course_id/enrollment/:enrollment_id",
    describeRoute({
        tags: ["Course"],
        operationId: "updateCourseEnrollment",
        summary: "Update course enrollment",
        description: "Updates a specific enrollment by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "enrollment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Enrollment ID",
            },
        ],
        responses: {
            200: {
                description: "Enrollment updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(updateCourseEnrollmentResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", updateCourseEnrollmentRequestBodySchema),
    CourseController.updateCourseEnrollment
);

app.delete(
    "/:course_id/enrollment/:enrollment_id",
    describeRoute({
        tags: ["Course"],
        operationId: "deleteCourseEnrollment",
        summary: "Delete course enrollment",
        description: "Deletes a specific enrollment by ID",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "enrollment_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Enrollment ID",
            },
        ],
        responses: {
            200: {
                description: "Enrollment deleted successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.deleteCourseEnrollment
);

// User enrollment routes
app.get(
    "/enrollment/user/:user_id",
    describeRoute({
        tags: ["Course"],
        operationId: "getCourseEnrollmentByUserId",
        summary: "Get course enrollments by user ID",
        description: "Retrieves all enrollments for a specific user",
        parameters: [
            {
                name: "user_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "User ID",
            },
        ],
        responses: {
            200: {
                description: "List of user enrollments",
                content: {
                    "application/json": {
                        schema: resolver(getCourseEnrollmentsResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    CourseController.getCourseEnrollmentByUserId
);

export default app;
