import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { z } from "zod";

import { EnhancedCourseContentController } from "@/controllers/enhanced-course-content.controller";
import { roleMiddleware } from "@/middlewares/role.middleware";

const app = new Hono();

// ==================== CHAPTER MANAGEMENT ====================

app.post(
    "/:course_id/chapters",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "createCourseChapter",
        summary: "Create a new course chapter",
        description: "Create a new chapter with lesson planning support",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        requestBody: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            chapter_title: { type: "string" },
                            chapter_description: { type: "string" },
                            chapter_number: { type: "number" },
                            parent_chapter_id: { type: "string" },
                            estimated_duration: { type: "number" },
                            is_published: { type: "boolean" },
                            is_free: { type: "boolean" },
                            sort_order: { type: "number" },
                            chapter_meta_data: {
                                type: "object",
                                properties: {
                                    difficulty_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                                    prerequisites: { type: "array", items: { type: "string" } },
                                    learning_objectives: { type: "array", items: { type: "string" } },
                                    resources: { type: "array", items: { type: "string" } },
                                    tags: { type: "array", items: { type: "string" } },
                                },
                            },
                        },
                        required: ["chapter_title", "chapter_description", "chapter_number", "estimated_duration"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Chapter created successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("create_assignment"), // Temporary - will be updated once role store is fixed
    EnhancedCourseContentController.createChapter
);

app.get(
    "/:course_id/chapters",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "getCourseChapters",
        summary: "Get all course chapters",
        description: "Get hierarchical structure of course chapters",
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
                description: "Chapters retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "array", items: { type: "object" } },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("view_course_content"),
    EnhancedCourseContentController.getCourseChapters
);

app.put(
    "/:course_id/chapters/:chapter_id/steps",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "updateChapterSteps",
        summary: "Update chapter lesson steps",
        description: "Update chapter with step-by-step lesson planning",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "chapter_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Chapter ID",
            },
        ],
        requestBody: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            steps: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        step_number: { type: "number" },
                                        step_title: { type: "string" },
                                        step_description: { type: "string" },
                                        step_type: { type: "string", enum: ["intro", "content", "activity", "assessment", "summary"] },
                                        estimated_time: { type: "number" },
                                        content_data: { type: "object" },
                                    },
                                },
                            },
                        },
                        required: ["steps"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Chapter steps updated successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("update_course_chapter"),
    EnhancedCourseContentController.updateChapterSteps
);

// ==================== FOLDER MANAGEMENT ====================

app.post(
    "/:course_id/folders",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "createCourseFolder",
        summary: "Create a new course folder",
        description: "Create a folder with permission-based access control",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        requestBody: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            folder_name: { type: "string" },
                            folder_description: { type: "string" },
                            parent_folder_id: { type: "string" },
                            folder_type: { type: "string", enum: ["materials", "assignments", "resources", "media", "custom"] },
                            access_level: { type: "string", enum: ["public", "enrolled", "premium", "restricted"] },
                            sort_order: { type: "number" },
                            permissions: {
                                type: "object",
                                properties: {
                                    can_upload: { type: "array", items: { type: "string" } },
                                    can_download: { type: "array", items: { type: "string" } },
                                    can_delete: { type: "array", items: { type: "string" } },
                                    can_modify: { type: "array", items: { type: "string" } },
                                },
                            },
                        },
                        required: ["folder_name", "folder_type"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Folder created successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("create_course_folder"),
    EnhancedCourseContentController.createFolder
);

app.get(
    "/:course_id/folders",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "getFolderStructure",
        summary: "Get course folder structure",
        description: "Get hierarchical folder structure with role-based permissions",
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
                description: "Folder structure retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "array", items: { type: "object" } },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("view_course_content"),
    EnhancedCourseContentController.getFolderStructure
);

// ==================== MATERIAL MANAGEMENT ====================

app.post(
    "/:course_id/materials/upload",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "uploadCourseMaterial",
        summary: "Upload course material",
        description: "Upload material with folder support and metadata",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        requestBody: {
            content: {
                "multipart/form-data": {
                    schema: {
                        type: "object",
                        properties: {
                            file: { type: "string", format: "binary" },
                            folder_id: { type: "string" },
                            chapter_id: { type: "string" },
                            material_title: { type: "string" },
                            material_description: { type: "string" },
                            material_type: { type: "string", enum: ["video", "pdf", "audio", "image", "document", "link", "interactive"] },
                        },
                        required: ["file", "material_title", "material_description", "material_type"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Material uploaded successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("upload_course_materials"),
    EnhancedCourseContentController.uploadMaterial
);

app.get(
    "/:course_id/materials",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "getCourseMaterials",
        summary: "Get course materials",
        description: "Get materials by folder or chapter",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "folder_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by folder ID",
            },
            {
                name: "chapter_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by chapter ID",
            },
            {
                name: "material_type",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by material type",
            },
        ],
        responses: {
            200: {
                description: "Materials retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "array", items: { type: "object" } },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("view_course_materials"),
    EnhancedCourseContentController.getMaterials
);

app.post(
    "/:course_id/materials/bulk-upload",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "bulkUploadMaterials",
        summary: "Bulk upload materials",
        description: "Upload multiple materials at once",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        requestBody: {
            content: {
                "multipart/form-data": {
                    schema: {
                        type: "object",
                        properties: {
                            files: { type: "array", items: { type: "string", format: "binary" } },
                            folder_id: { type: "string" },
                        },
                        required: ["files", "folder_id"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Bulk upload completed",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "array", items: { type: "object" } },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("bulk_upload_materials"),
    EnhancedCourseContentController.bulkUploadMaterials
);

// ==================== WATCH TIME TRACKING ====================

app.post(
    "/:course_id/watch-history",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "recordWatchHistory",
        summary: "Record watch history",
        description: "Record video watch time and engagement metrics",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
        ],
        requestBody: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            chapter_id: { type: "string" },
                            content_id: { type: "string" },
                            session_id: { type: "string" },
                            watch_duration: { type: "number" },
                            total_duration: { type: "number" },
                            watch_percentage: { type: "number" },
                            is_completed: { type: "boolean" },
                            last_watched_position: { type: "number" },
                            watch_quality: { type: "string" },
                            device_info: { type: "object" },
                            engagement_metrics: { type: "object" },
                        },
                        required: ["chapter_id", "content_id", "session_id", "watch_duration", "total_duration"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Watch history recorded successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("track_watch_history"),
    EnhancedCourseContentController.recordWatchHistory
);

app.get(
    "/:course_id/analytics/watch",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "getWatchAnalytics",
        summary: "Get watch analytics",
        description: "Get detailed watch time and engagement analytics",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "user_filter",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["self", "all"] },
                description: "Filter analytics by user",
            },
        ],
        responses: {
            200: {
                description: "Watch analytics retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("view_course_analytics"),
    EnhancedCourseContentController.getWatchAnalytics
);

// ==================== PROGRESS TRACKING ====================

app.get(
    "/:course_id/progress",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "getCourseProgress",
        summary: "Get course progress",
        description: "Get comprehensive course progress with analytics",
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
                description: "Course progress retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "object" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("view_course_progress"),
    EnhancedCourseContentController.getCourseProgress
);

// ==================== LESSON BUILDER ====================

app.post(
    "/:course_id/chapters/:chapter_id/lessons",
    describeRoute({
        tags: ["Course Content Management"],
        operationId: "createLessonWithSteps",
        summary: "Create lesson with steps",
        description: "Create a lesson with step-by-step structure",
        parameters: [
            {
                name: "course_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Course ID",
            },
            {
                name: "chapter_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Chapter ID",
            },
        ],
        requestBody: {
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            steps: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        step_number: { type: "number" },
                                        step_type: { type: "string", enum: ["intro", "content", "activity", "assessment", "summary"] },
                                        step_title: { type: "string" },
                                        step_instructions: { type: "string" },
                                        estimated_time: { type: "number" },
                                        content_data: { type: "object" },
                                    },
                                },
                            },
                        },
                        required: ["title", "description", "steps"],
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Lesson created successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean" },
                                data: { type: "array", items: { type: "object" } },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    roleMiddleware("create_lesson_steps"),
    EnhancedCourseContentController.createLessonWithSteps
);

export default app;
