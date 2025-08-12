import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { CourseController } from "@/controllers/course.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    autoCompletionConfigSchema,
    batchProgressUpdateSchema,
    bulkEnrollStudentsRequestBodySchema,
    courseAnalyticsResponseSchema,
    courseAnnouncementResponseSchema,
    courseAnnouncementsListResponseSchema,
    courseEnrollmentResponseSchema,
    courseLectureResponseSchema,
    courseProgressResponseSchema,
    courseResponseSchema,
    courseSectionResponseSchema,
    coursesListResponseSchema,
    createCampusAnnouncementRequestBodySchema,
    createCourseAnnouncementRequestBodySchema,
    createCourseLectureRequestBodySchema,
    createCourseRequestBodySchema,
    createCourseSectionRequestBodySchema,
    enrollInCourseRequestBodySchema,
    errorResponseSchema,
    learningAnalyticsResponseSchema,
    realtimeProgressUpdateSchema,
    smartRecommendationsResponseSchema,
    successResponseSchema,
    updateCourseAnnouncementRequestBodySchema,
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

// ==================== REAL-TIME & AUTOMATED TRACKING ====================

app.post(
    "/:course_id/lectures/:lecture_id/realtime-progress",
    describeRoute({
        operationId: "updateRealtimeProgress",
        summary: "Update real-time lecture progress",
        description: "Update user's real-time progress on a specific lecture for automated tracking. Student only.",
        tags: ["Courses", "Progress Tracking"],
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
                description: "Real-time progress updated successfully",
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
    zValidator("json", realtimeProgressUpdateSchema),
    CourseController.updateRealtimeProgress
);

app.post(
    "/:course_id/batch-progress",
    describeRoute({
        operationId: "updateBatchProgress",
        summary: "Update batch progress data",
        description: "Update multiple lecture progress data in batch for offline sync. Student only.",
        tags: ["Courses", "Progress Tracking"],
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
                description: "Batch progress updated successfully",
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
    zValidator("json", batchProgressUpdateSchema),
    CourseController.updateBatchProgress
);

app.get(
    "/:course_id/auto-completion-status",
    describeRoute({
        operationId: "getAutoCompletionStatus",
        summary: "Get auto-completion status",
        description: "Get the current auto-completion and tracking configuration for a course.",
        tags: ["Courses", "Automation"],
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
                description: "Auto-completion status retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
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
    CourseController.getAutoCompletionStatus
);

app.put(
    "/:course_id/auto-completion-config",
    describeRoute({
        operationId: "updateAutoCompletionConfig",
        summary: "Update auto-completion configuration",
        description: "Update auto-completion and tracking settings for a course. Admin, course creator, or assigned instructor only.",
        tags: ["Courses", "Automation"],
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
                description: "Auto-completion configuration updated successfully",
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
    zValidator("json", autoCompletionConfigSchema),
    CourseController.updateAutoCompletionConfig
);

app.get(
    "/:course_id/learning-analytics",
    describeRoute({
        operationId: "getLearningAnalytics",
        summary: "Get personalized learning analytics",
        description: "Get detailed learning analytics and insights for the authenticated user in a course.",
        tags: ["Courses", "Analytics"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "timeframe",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["week", "month", "quarter", "all"], default: "month" },
                description: "Analytics timeframe",
            },
        ],
        responses: {
            200: {
                description: "Learning analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(learningAnalyticsResponseSchema),
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
    roleMiddleware("view_enrolled_courses"),
    CourseController.getLearningAnalytics
);

app.get(
    "/:course_id/smart-recommendations",
    describeRoute({
        operationId: "getSmartRecommendations",
        summary: "Get AI-powered learning recommendations",
        description: "Get personalized recommendations for optimal learning based on user behavior and progress.",
        tags: ["Courses", "AI Recommendations"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "recommendation_type",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["content", "schedule", "study_tips", "all"], default: "all" },
                description: "Type of recommendations to fetch",
            },
        ],
        responses: {
            200: {
                description: "Smart recommendations retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(smartRecommendationsResponseSchema),
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
    roleMiddleware("view_enrolled_courses"),
    CourseController.getSmartRecommendations
);

app.post(
    "/:course_id/auto-progress-next",
    describeRoute({
        operationId: "autoProgressToNext",
        summary: "Auto-progress to next lecture",
        description: "Automatically progress to the next lecture when current one is completed based on smart criteria.",
        tags: ["Courses", "Automation"],
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
                description: "Auto-progressed to next lecture successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            400: {
                description: "No next lecture available or criteria not met",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("track_watch_history"),
    CourseController.autoProgressToNext
);

app.get(
    "/:course_id/watch-time-analytics",
    describeRoute({
        operationId: "getWatchTimeAnalytics",
        summary: "Get detailed watch time analytics",
        description: "Get comprehensive watch time analytics including engagement patterns and completion predictions.",
        tags: ["Courses", "Analytics"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "granularity",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["hourly", "daily", "weekly"], default: "daily" },
                description: "Analytics granularity",
            },
        ],
        responses: {
            200: {
                description: "Watch time analytics retrieved successfully",
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
    roleMiddleware("view_enrolled_courses"),
    CourseController.getWatchTimeAnalytics
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

// ==================== COURSE ANNOUNCEMENTS ====================

app.post(
    "/:course_id/announcements",
    describeRoute({
        operationId: "createCourseAnnouncement",
        summary: "Create course announcement",
        description: "Create an announcement for a specific course and send push notifications to enrolled students. Instructors only.",
        tags: ["Course Announcements"],
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
                description: "Course announcement created successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseAnnouncementResponseSchema),
                    },
                },
            },
            403: {
                description: "Instructor access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
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
    roleMiddleware("send_course_announcements"),
    zValidator("json", createCourseAnnouncementRequestBodySchema),
    CourseController.createCourseAnnouncement
);

app.post(
    "/announcements/campus",
    describeRoute({
        operationId: "createCampusAnnouncement",
        summary: "Create campus-wide announcement",
        description: "Create a campus-wide announcement and send push notifications to all users. Admin only.",
        tags: ["Course Announcements"],
        responses: {
            201: {
                description: "Campus announcement created successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseAnnouncementResponseSchema),
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
    roleMiddleware("system_course_administration"),
    zValidator("json", createCampusAnnouncementRequestBodySchema),
    CourseController.createCampusAnnouncement
);

app.get(
    "/:course_id/announcements",
    describeRoute({
        operationId: "getCourseAnnouncements",
        summary: "Get course announcements",
        description: "Get all announcements for a specific course. Enrolled users only.",
        tags: ["Course Announcements"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "active_only",
                in: "query",
                required: false,
                schema: { type: "boolean", default: false },
                description: "Only return active announcements",
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
                description: "Number of announcements to return",
            },
            {
                name: "offset",
                in: "query",
                required: false,
                schema: { type: "integer", default: 0, minimum: 0 },
                description: "Number of announcements to skip",
            },
        ],
        responses: {
            200: {
                description: "Course announcements retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseAnnouncementsListResponseSchema),
                    },
                },
            },
            403: {
                description: "Access denied - not enrolled in course",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
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
    CourseController.getCourseAnnouncements
);

app.put(
    "/:course_id/announcements/:announcement_id",
    describeRoute({
        operationId: "updateCourseAnnouncement",
        summary: "Update course announcement",
        description: "Update a course announcement. Only announcement creator or course instructors can update.",
        tags: ["Course Announcements"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "announcement_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Announcement ID",
            },
        ],
        responses: {
            200: {
                description: "Course announcement updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(courseAnnouncementResponseSchema),
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
            404: {
                description: "Course or announcement not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("send_course_announcements"),
    zValidator("json", updateCourseAnnouncementRequestBodySchema),
    CourseController.updateCourseAnnouncement
);

app.delete(
    "/:course_id/announcements/:announcement_id",
    describeRoute({
        operationId: "deleteCourseAnnouncement",
        summary: "Delete course announcement",
        description: "Delete a course announcement. Only announcement creator or course instructors can delete.",
        tags: ["Course Announcements"],
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "announcement_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Announcement ID",
            },
        ],
        responses: {
            200: {
                description: "Course announcement deleted successfully",
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
            404: {
                description: "Course or announcement not found",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    roleMiddleware("send_course_announcements"),
    CourseController.deleteCourseAnnouncement
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