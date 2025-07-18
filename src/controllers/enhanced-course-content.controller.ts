import { Context } from "hono";
import { EnhancedCourseContentService } from "@/services/enhanced-course-content.service";
import { ICourseChapterData } from "@/models/course_chapter.model";
import { ICourseFolderData } from "@/models/course_folder.model";
import { ICourseMaterialData } from "@/models/course_material.model";
import { ICourseWatchHistoryData } from "@/models/course_watch_history.model";
import { UploadFactory } from "@/libs/s3/upload.factory";
import { UploadService } from "@/services/upload.service";

export class EnhancedCourseContentController {
    
    // ==================== CHAPTER MANAGEMENT ====================
    
    /**
     * Create a new course chapter
     */
    public static readonly createChapter = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            
            const chapterData: Partial<ICourseChapterData> = await ctx.req.json();
            
            // Add created_by to meta_data
            chapterData.chapter_meta_data = {
                ...chapterData.chapter_meta_data,
                tags: [],
            };
            
            const chapter = await EnhancedCourseContentService.createChapter(
                campus_id,
                course_id,
                chapterData
            );
            
            return ctx.json({
                success: true,
                data: chapter,
                message: "Chapter created successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create chapter",
            }, 500);
        }
    };

    /**
     * Get all chapters for a course
     */
    public static readonly getCourseChapters = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { course_id } = ctx.req.param();
            
            const chapters = await EnhancedCourseContentService.getCourseChapters(
                campus_id,
                course_id
            );
            
            return ctx.json({
                success: true,
                data: chapters,
                message: "Chapters retrieved successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve chapters",
            }, 500);
        }
    };

    /**
     * Update chapter with lesson steps
     */
    public static readonly updateChapterSteps = async (ctx: Context) => {
        try {
            const { chapter_id } = ctx.req.param();
            const { steps } = await ctx.req.json();
            
            const chapter = await EnhancedCourseContentService.updateChapterWithSteps(
                chapter_id,
                steps
            );
            
            return ctx.json({
                success: true,
                data: chapter,
                message: "Chapter steps updated successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to update chapter steps",
            }, 500);
        }
    };

    // ==================== FOLDER MANAGEMENT ====================

    /**
     * Create a new folder
     */
    public static readonly createFolder = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const { course_id } = ctx.req.param();
            
            const folderData: Partial<ICourseFolderData> = await ctx.req.json();
            
            // Set default permissions based on user role
            folderData.permissions = {
                can_upload: ["Admin", "Teacher"],
                can_download: ["Admin", "Teacher", "Student"],
                can_delete: ["Admin", "Teacher"],
                can_modify: ["Admin", "Teacher"],
                ...folderData.permissions,
            };
            
            // Add created_by to meta_data
            folderData.folder_meta_data = {
                ...folderData.folder_meta_data,
                created_by: user_id,
            };
            
            const folder = await EnhancedCourseContentService.createFolder(
                campus_id,
                course_id,
                folderData
            );
            
            return ctx.json({
                success: true,
                data: folder,
                message: "Folder created successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create folder",
            }, 500);
        }
    };

    /**
     * Get folder structure
     */
    public static readonly getFolderStructure = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const { course_id } = ctx.req.param();
            
            const folderStructure = await EnhancedCourseContentService.getFolderStructure(
                campus_id,
                course_id,
                user_type
            );
            
            return ctx.json({
                success: true,
                data: folderStructure,
                message: "Folder structure retrieved successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve folder structure",
            }, 500);
        }
    };

    // ==================== MATERIAL MANAGEMENT ====================

    /**
     * Upload material to course
     */
    public static readonly uploadMaterial = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            
            const body = await ctx.req.parseBody();
            const { file, folder_id, chapter_id, material_title, material_description, material_type } = body;
            
            if (!file || typeof file === "string") {
                return ctx.json({
                    success: false,
                    message: "No file uploaded",
                }, 400);
            }
            
            // Upload file to S3
            const s3Data = await UploadFactory.upload(file);
            
            // Create upload record
            const uploadRecord = await UploadService.createUpload(campus_id, user_id, {
                file_size: file.size,
                file_type: file.type,
                original_file_name: file.name,
                stored_file_name: s3Data.file_name,
                s3_url: s3Data.url,
                meta_data: {
                    course_id,
                    folder_id: folder_id || null,
                    chapter_id: chapter_id || null,
                },
            });
            
            // Create material record
            const materialData: Partial<ICourseMaterialData> = {
                chapter_id: chapter_id as string || undefined,
                folder_id: folder_id as string || undefined,
                material_title: material_title as string,
                material_description: material_description as string,
                material_type: material_type as any,
                file_url: s3Data.url,
                file_size: file.size,
                file_format: file.type,
                upload_id: uploadRecord.id,
                is_downloadable: true,
                is_streamable: material_type === "video" || material_type === "audio",
                access_level: "free",
                sort_order: 0,
                material_meta_data: {
                    created_by: user_id,
                    tags: [],
                },
            };
            
            const material = await EnhancedCourseContentService.uploadMaterial(
                campus_id,
                course_id,
                materialData
            );
            
            return ctx.json({
                success: true,
                data: material,
                message: "Material uploaded successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to upload material",
            }, 500);
        }
    };

    /**
     * Get materials by folder or chapter
     */
    public static readonly getMaterials = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { course_id } = ctx.req.param();
            
            const { folder_id, chapter_id, material_type } = ctx.req.query();
            
            const materials = await EnhancedCourseContentService.getMaterials(
                campus_id,
                course_id,
                {
                    folder_id,
                    chapter_id,
                    material_type,
                }
            );
            
            return ctx.json({
                success: true,
                data: materials,
                message: "Materials retrieved successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve materials",
            }, 500);
        }
    };

    // ==================== WATCH TIME TRACKING ====================

    /**
     * Record watch history
     */
    public static readonly recordWatchHistory = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            
            const watchData: Partial<ICourseWatchHistoryData> = await ctx.req.json();
            watchData.user_id = user_id;
            
            const watchHistory = await EnhancedCourseContentService.recordWatchHistory(
                campus_id,
                watchData
            );
            
            return ctx.json({
                success: true,
                data: watchHistory,
                message: "Watch history recorded successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to record watch history",
            }, 500);
        }
    };

    /**
     * Get watch analytics
     */
    public static readonly getWatchAnalytics = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            
            const { user_filter } = ctx.req.query();
            
            const analytics = await EnhancedCourseContentService.getWatchAnalytics(
                campus_id,
                course_id,
                user_filter === "self" ? user_id : undefined
            );
            
            return ctx.json({
                success: true,
                data: analytics,
                message: "Watch analytics retrieved successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve watch analytics",
            }, 500);
        }
    };

    // ==================== PROGRESS TRACKING ====================

    /**
     * Get course progress
     */
    public static readonly getCourseProgress = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            
            const progress = await EnhancedCourseContentService.getCourseProgress(
                campus_id,
                course_id,
                user_id
            );
            
            return ctx.json({
                success: true,
                data: progress,
                message: "Course progress retrieved successfully",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve course progress",
            }, 500);
        }
    };

    // ==================== LESSON BUILDER ====================

    /**
     * Create lesson with steps
     */
    public static readonly createLessonWithSteps = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { course_id, chapter_id } = ctx.req.param();
            
            const lessonData = await ctx.req.json();
            
            const lesson = await EnhancedCourseContentService.createLessonWithSteps(
                campus_id,
                course_id,
                chapter_id,
                lessonData
            );
            
            return ctx.json({
                success: true,
                data: lesson,
                message: "Lesson created successfully with steps",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create lesson with steps",
            }, 500);
        }
    };

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk upload materials
     */
    public static readonly bulkUploadMaterials = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            
            const body = await ctx.req.parseBody();
            const files = Array.isArray(body.files) ? body.files : [body.files];
            const folder_id = body.folder_id as string;
            
            const uploadResults: any[] = [];
            
            for (const file of files) {
                if (file && typeof file !== "string") {
                    try {
                        const s3Data = await UploadFactory.upload(file);
                        
                        const uploadRecord = await UploadService.createUpload(campus_id, user_id, {
                            file_size: file.size,
                            file_type: file.type,
                            original_file_name: file.name,
                            stored_file_name: s3Data.file_name,
                            s3_url: s3Data.url,
                            meta_data: {
                                course_id,
                                folder_id,
                            },
                        });
                        
                        const materialData: Partial<ICourseMaterialData> = {
                            folder_id,
                            material_title: file.name,
                            material_description: `Uploaded file: ${file.name}`,
                            material_type: this.detectMaterialType(file.type),
                            file_url: s3Data.url,
                            file_size: file.size,
                            file_format: file.type,
                            upload_id: uploadRecord.id,
                            is_downloadable: true,
                            is_streamable: file.type.startsWith("video/") || file.type.startsWith("audio/"),
                            access_level: "free",
                            sort_order: 0,
                            material_meta_data: {
                                created_by: user_id,
                                tags: [],
                            },
                        };
                        
                        const material = await EnhancedCourseContentService.uploadMaterial(
                            campus_id,
                            course_id,
                            materialData
                        );
                        
                        uploadResults.push({
                            success: true,
                            file_name: file.name,
                            material_id: material.id,
                        });
                    } catch (error) {
                        uploadResults.push({
                            success: false,
                            file_name: file.name,
                            error: error instanceof Error ? error.message : "Upload failed",
                        });
                    }
                }
            }
            
            return ctx.json({
                success: true,
                data: uploadResults,
                message: "Bulk upload completed",
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to bulk upload materials",
            }, 500);
        }
    };

    // ==================== HELPER METHODS ====================

    private static detectMaterialType(mimeType: string): ICourseMaterialData["material_type"] {
        if (mimeType.startsWith("video/")) return "video";
        if (mimeType.startsWith("audio/")) return "audio";
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType === "application/pdf") return "pdf";
        return "document";
    }
}
