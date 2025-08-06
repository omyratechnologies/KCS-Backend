import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { CourseController } from "@/controllers/course.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    bulkEnrollStudentsRequestBodySchema,
    courseAnalyticsResponseSchema,
    courseEnrollmentResponseSchema,
    courseLectureResponseSchema,
    courseProgressResponseSchema,
    courseResponseSchema,
    courseSectionResponseSchema,
    coursesListResponseSchema,
    createCourseLectureRequestBodySchema,
    createCourseRequestBodySchema,
    createCourseSectionRequestBodySchema,
    enrollInCourseRequestBodySchema,
    errorResponseSchema,
    successResponseSchema,
    updateCourseLectureRequestBodySchema,
    updateCourseRequestBodySchema,
    updateCourseSectionRequestBodySchema,
    updateLectureOrderRequestBodySchema,
    updateProgressRequestBodySchema,
    updateSectionOrderRequestBodySchema,
} from "@/schema/course";

const app = new Hono();

// Apply authentication to all routes
app.use("*", authMiddleware());

// ==================== PUBLIC COURSE DISCOVERY ====================

app.get(
    "/",
    describeRoute({
        operationId: "getCourses",
        summary: "Get courses with filtering",
        description:
            "Get all courses with advanced filtering, search, and pagination. Returns published courses for students, all courses for admins/teachers.",
        tags: ["Courses"],
        parameters: [
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "number", default: 1 },
                description: "Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", default: 20 },
                description: "Number of courses per page",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["draft", "published", "archived", "suspended"],
                },
                description: "Filter by course status (Admin/Teacher only)",
            },
            {
                name: "category",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by course category",
            },
            {
                name: "difficulty_level",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["beginner", "intermediate", "advanced"],
                },
                description: "Filter by difficulty level",
            },
            {
                name: "price_range",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by price range (e.g., '0-50', 'free', 'paid')",
            },
            {
                name: "search",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Search in title, description, and tags",
            },
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by target class/grade",
            },
            {
                name: "featured",
                in: "query",
                required: false,
                schema: { type: "boolean" },
                description: "Show only featured courses",
            },
            {
                name: "sort_by",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["created_at", "updated_at", "title", "rating", "enrollment_count", "price"],
                },
                description: "Sort by field",
            },
            {
                name: "sort_order",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["asc", "desc"],
                },
                description: "Sort order",
            },
        ],
        responses: {
            200: {
                description: "Courses retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(coursesListResponseSchema),
                    },
                },
            },
            500: {
                description: "Server error",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    CourseController.getCourses
);

app.get(
    "/:id",
    describeRoute({
        operationId: "getCourseById",
        summary: "Get course by ID",
        description: "Get detailed course information including sections, lectures, and user progress (if enrolled).",
        tags: ["Courses"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Course retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseResponseSchema),
                    },
                },
            },
            404: {
                description: "Course not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    CourseController.getCourseById
);

// ==================== ADMIN/TEACHER COURSE MANAGEMENT ====================

app.post(
    "/",
    describeRoute({
        operationId: "createCourse",
        summary: "Create course",
        description: "Create a new course. Admin or authorized teacher only.",
        tags: ["Courses"],
        responses: {
            201: {
                description: "Course created successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("create_course"),
    zValidator("json", createCourseRequestBodySchema),
    CourseController.createCourse
);

app.put(
    "/:id",
    describeRoute({
        operationId: "updateCourse",
        summary: "Update course",
        description: "Update course details. Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "id",
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
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("update_course"),
    zValidator("json", updateCourseRequestBodySchema),
    CourseController.updateCourse
);

app.put(
    "/:id/publish",
    describeRoute({
        operationId: "publishCourse",
        summary: "Publish course",
        description:
            "Publish a draft course to make it available for enrollment. Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Course published successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            400: {
                description: "Course cannot be published (missing required content)",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("publish_course"),
    CourseController.publishCourse
);

app.delete(
    "/:id",
    describeRoute({
        operationId: "deleteCourse",
        summary: "Delete/Archive course",
        description: "Archive a course (soft delete). Admin or course creator only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        responses: {
            200: {
                description: "Course archived successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            400: {
                description: "Cannot delete course with active enrollments",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("delete_course"),
    CourseController.deleteCourse
);

// ==================== COURSE CONTENT MANAGEMENT ====================

app.get(
    "/sections/:section_id",
    describeRoute({
        operationId: "getSectionById",
        summary: "Get section by ID",
        description: "Get detailed section information including lectures and user progress (if enrolled).",
        tags: ["Courses"],
        parameters: [
            {
                name: "section_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Section ID",
            },
        ],
        responses: {
            200: {
                description: "Section retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseSectionResponseSchema),
                    },
                },
            },
            404: {
                description: "Section not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    CourseController.getSectionById
);

app.put(
    "/sections/:section_id",
    describeRoute({
        operationId: "updateCourseSection",
        summary: "Update course section",
        description: "Update section details (title, description, notes, etc.). Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "section_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Section ID",
            },
        ],
        responses: {
            200: {
                description: "Section updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("update_course_sections"),
    zValidator("json", updateCourseSectionRequestBodySchema),
    CourseController.updateCourseSection
);

app.delete(
    "/sections/:section_id",
    describeRoute({
        operationId: "deleteCourseSection",
        summary: "Delete/Archive course section",
        description: "Archive a course section (soft delete). Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "section_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Section ID",
            },
        ],
        responses: {
            200: {
                description: "Section archived successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            400: {
                description: "Cannot delete section with active content",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("delete_course_sections"),
    CourseController.deleteCourseSection
);

app.get(
    "/lectures/:lecture_id",
    describeRoute({
        operationId: "getLectureById",
        summary: "Get lecture by ID",
        description: "Get detailed lecture information including user progress (if enrolled).",
        tags: ["Courses"],
        parameters: [
            {
                name: "lecture_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Lecture ID",
            },
        ],
        responses: {
            200: {
                description: "Lecture retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseLectureResponseSchema),
                    },
                },
            },
            404: {
                description: "Lecture not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    CourseController.getLectureById
);

app.put(
    "/lectures/:lecture_id",
    describeRoute({
        operationId: "updateCourseLecture",
        summary: "Update course lecture",
        description: "Update lecture details (title, description, video URL, etc.). Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "lecture_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Lecture ID",
            },
        ],
        responses: {
            200: {
                description: "Lecture updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("update_course_lectures"),
    zValidator("json", updateCourseLectureRequestBodySchema),
    CourseController.updateCourseLecture
);

app.delete(
    "/lectures/:lecture_id",
    describeRoute({
        operationId: "deleteCourseLecture",
        summary: "Delete/Archive course lecture",
        description: "Archive a course lecture (soft delete). Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "lecture_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Lecture ID",
            },
        ],
        responses: {
            200: {
                description: "Lecture archived successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            400: {
                description: "Cannot delete lecture with user progress",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("delete_course_lectures"),
    CourseController.deleteCourseLecture
);

app.post(
    "/:course_id/sections",
    describeRoute({
        operationId: "createCourseSection",
        summary: "Create course section",
        description: "Create a new section in a course. Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
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
            201: {
                description: "Section created successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("create_course_sections"),
    zValidator("json", createCourseSectionRequestBodySchema),
    CourseController.createCourseSection
);

app.post(
    "/sections/:section_id/lectures",
    describeRoute({
        operationId: "createCourseLecture",
        summary: "Create course lecture",
        description: "Create a new lecture in a course section. Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "section_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Section ID",
            },
        ],
        responses: {
            201: {
                description: "Lecture created successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("create_course_lectures"),
    zValidator("json", createCourseLectureRequestBodySchema),
    CourseController.createCourseLecture
);

app.put(
    "/:course_id/sections/order",
    describeRoute({
        operationId: "updateSectionOrder",
        summary: "Update section order",
        description: "Reorder sections within a course. Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
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
                description: "Section order updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("reorder_course_content"),
    zValidator("json", updateSectionOrderRequestBodySchema),
    CourseController.updateSectionOrder
);

app.put(
    "/sections/:section_id/lectures/order",
    describeRoute({
        operationId: "updateLectureOrder",
        summary: "Update lecture order",
        description: "Reorder lectures within a section. Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "section_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Section ID",
            },
        ],
        responses: {
            200: {
                description: "Lecture order updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("reorder_course_content"),
    zValidator("json", updateLectureOrderRequestBodySchema),
    CourseController.updateLectureOrder
);

// ==================== STUDENT ENROLLMENT & PROGRESS ====================

app.post(
    "/:course_id/enroll",
    describeRoute({
        operationId: "enrollInCourse",
        summary: "Enroll in course",
        description: "Enroll the authenticated user in a course. Student only.",
        tags: ["Courses"],
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
            201: {
                description: "Successfully enrolled in course",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            400: {
                description: "Enrollment not allowed (course full, not published, etc.)",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("enroll_in_course"),
    zValidator("json", enrollInCourseRequestBodySchema),
    CourseController.enrollInCourse
);

app.get(
    "/my/enrolled",
    describeRoute({
        operationId: "getUserEnrolledCourses",
        summary: "Get user's enrolled courses",
        description: "Get all courses the authenticated user is enrolled in. Student only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "status",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["active", "completed", "dropped", "suspended", "expired"],
                },
                description: "Filter by enrollment status",
            },
            {
                name: "progress",
                in: "query",
                required: false,
                schema: {
                    type: "string",
                    enum: ["not_started", "in_progress", "completed"],
                },
                description: "Filter by progress status",
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "number", default: 1 },
                description: "Page number for pagination",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "number", default: 20 },
                description: "Number of enrollments per page",
            },
        ],
        responses: {
            200: {
                description: "Enrolled courses retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_enrolled_courses"),
    CourseController.getUserEnrolledCourses
);

app.put(
    "/:course_id/lectures/:lecture_id/progress",
    describeRoute({
        operationId: "updateCourseProgress",
        summary: "Update lecture progress",
        description: "Update user's progress on a specific lecture. Student only.",
        tags: ["Courses"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "lecture_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Lecture ID",
            },
        ],
        responses: {
            200: {
                description: "Progress updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            400: {
                description: "User not enrolled in course",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("track_watch_history"),
    zValidator("json", updateProgressRequestBodySchema),
    CourseController.updateCourseProgress
);

// ==================== ANALYTICS & REPORTING ====================

app.get(
    "/:course_id/analytics",
    describeRoute({
        operationId: "getCourseAnalytics",
        summary: "Get course analytics",
        description:
            "Get detailed analytics for a course including enrollment, engagement, and performance metrics. Admin, course creator, or assigned instructor only.",
        tags: ["Courses"],
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
                description: "Course analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseAnalyticsResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("view_course_analytics"),
    CourseController.getCourseAnalytics
);

app.get(
    "/dashboard",
    describeRoute({
        operationId: "getCourseDashboard",
        summary: "Get course dashboard",
        description: "Get course dashboard with statistics and recent activity. Admin/Teacher only.",
        tags: ["Courses"],
        responses: {
            200: {
                description: "Course dashboard retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Insufficient permissions",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("manage_course_analytics"),
    CourseController.getCourseDashboard
);

// ==================== ADMIN BULK OPERATIONS ====================

app.post(
    "/:course_id/enroll/bulk",
    describeRoute({
        operationId: "bulkEnrollStudents",
        summary: "Bulk enroll students",
        description: "Enroll multiple students in a course at once. Admin only.",
        tags: ["Courses"],
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
                description: "Bulk enrollment completed",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Admin access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("bulk_enroll_students"),
    zValidator("json", bulkEnrollStudentsRequestBodySchema),
    CourseController.bulkEnrollStudents
);

export default app;
