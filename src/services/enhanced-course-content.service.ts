import { CourseChapter, ICourseChapterData } from "@/models/course_chapter.model";
import { CourseFolder, ICourseFolderData } from "@/models/course_folder.model";
import { CourseMaterial, ICourseMaterialData } from "@/models/course_material.model";
import { CourseProgress, ICourseProgressData } from "@/models/course_progress.model";
import { CourseWatchHistory, ICourseWatchHistoryData } from "@/models/course_watch_history.model";
import { CourseContent, ICourseContentData } from "@/models/course_content.model";

export class EnhancedCourseContentService {
    // ==================== CHAPTER MANAGEMENT ====================
    
    /**
     * Create a new course chapter with step-by-step lesson planning
     */
    public static async createChapter(
        campus_id: string,
        course_id: string,
        chapterData: Partial<ICourseChapterData>
    ): Promise<ICourseChapterData> {
        const chapter = await CourseChapter.create({
            ...chapterData,
            campus_id,
            course_id,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Initialize progress tracking for all enrolled students
        await this.initializeChapterProgress(course_id, chapter.id);

        return chapter;
    }

    /**
     * Get all chapters for a course with hierarchical structure
     */
    public static async getCourseChapters(
        campus_id: string,
        course_id: string
    ): Promise<ICourseChapterData[]> {
        const chaptersResult: { rows: ICourseChapterData[] } = await CourseChapter.find(
            {
                campus_id,
                course_id,
                is_deleted: false,
            },
            {
                sort: { sort_order: "ASC" },
            }
        );

        return this.buildChapterHierarchy(chaptersResult.rows);
    }

    /**
     * Build hierarchical chapter structure
     */
    private static buildChapterHierarchy(chapters: ICourseChapterData[]): ICourseChapterData[] {
        const chapterMap = new Map<string, any>();
        const rootChapters: any[] = [];

        // Create map of all chapters
        chapters.forEach(chapter => {
            chapterMap.set(chapter.id, { ...chapter, children: [] });
        });

        // Build hierarchy
        chapters.forEach(chapter => {
            const chapterNode = chapterMap.get(chapter.id);
            if (chapter.parent_chapter_id) {
                const parent = chapterMap.get(chapter.parent_chapter_id);
                if (parent) {
                    parent.children.push(chapterNode);
                }
            } else {
                rootChapters.push(chapterNode);
            }
        });

        return rootChapters;
    }

    /**
     * Update chapter with lesson plan steps
     */
    public static async updateChapterWithSteps(
        chapter_id: string,
        steps: any[]
    ): Promise<ICourseChapterData> {
        const chapter = await CourseChapter.updateById(chapter_id, {
            chapter_meta_data: {
                ...await this.getChapterMetaData(chapter_id),
                lesson_steps: steps,
            },
            updated_at: new Date(),
        });

        if (!chapter) throw new Error("Chapter not found");
        return chapter;
    }

    // ==================== FOLDER MANAGEMENT ====================

    /**
     * Create course folder with permission-based access
     */
    public static async createFolder(
        campus_id: string,
        course_id: string,
        folderData: Partial<ICourseFolderData>
    ): Promise<ICourseFolderData> {
        const folder_path = await this.generateFolderPath(
            course_id,
            folderData.folder_name!,
            folderData.parent_folder_id
        );

        return await CourseFolder.create({
            ...folderData,
            campus_id,
            course_id,
            folder_path,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    /**
     * Get folder structure with materials
     */
    public static async getFolderStructure(
        campus_id: string,
        course_id: string,
        user_role: string
    ): Promise<any[]> {
        const folders: { rows: ICourseFolderData[] } = await CourseFolder.find(
            {
                campus_id,
                course_id,
                is_deleted: false,
            },
            {
                sort: { sort_order: "ASC" },
            }
        );

        return this.buildFolderHierarchy(folders.rows, user_role);
    }

    /**
     * Build folder hierarchy with permissions
     */
    private static buildFolderHierarchy(folders: ICourseFolderData[], user_role: string): any[] {
        const folderMap = new Map<string, any>();
        const rootFolders: any[] = [];

        // Filter folders based on user permissions
        const accessibleFolders = folders.filter(folder => 
            this.hasAccessToFolder(folder, user_role)
        );

        // Create map of accessible folders
        accessibleFolders.forEach(folder => {
            folderMap.set(folder.id, { ...folder, children: [], materials: [] });
        });

        // Build hierarchy
        accessibleFolders.forEach(folder => {
            const folderNode = folderMap.get(folder.id);
            if (folder.parent_folder_id) {
                const parent = folderMap.get(folder.parent_folder_id);
                if (parent) {
                    parent.children.push(folderNode);
                }
            } else {
                rootFolders.push(folderNode);
            }
        });

        return rootFolders;
    }

    // ==================== MATERIAL MANAGEMENT ====================

    /**
     * Upload material to course with folder support
     */
    public static async uploadMaterial(
        campus_id: string,
        course_id: string,
        materialData: Partial<ICourseMaterialData>
    ): Promise<ICourseMaterialData> {
        return await CourseMaterial.create({
            ...materialData,
            campus_id,
            course_id,
            is_active: true,
            is_deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    /**
     * Get materials by folder or chapter
     */
    public static async getMaterials(
        campus_id: string,
        course_id: string,
        filter: {
            folder_id?: string;
            chapter_id?: string;
            material_type?: string;
        }
    ): Promise<ICourseMaterialData[]> {
        const query: any = {
            campus_id,
            course_id,
            is_deleted: false,
        };

        if (filter.folder_id) query.folder_id = filter.folder_id;
        if (filter.chapter_id) query.chapter_id = filter.chapter_id;
        if (filter.material_type) query.material_type = filter.material_type;

        const materials: { rows: ICourseMaterialData[] } = await CourseMaterial.find(
            query,
            {
                sort: { sort_order: "ASC" },
            }
        );

        return materials.rows;
    }

    // ==================== WATCH TIME TRACKING ====================

    /**
     * Record watch history for video content
     */
    public static async recordWatchHistory(
        campus_id: string,
        watchData: Partial<ICourseWatchHistoryData>
    ): Promise<ICourseWatchHistoryData> {
        const watchHistory = await CourseWatchHistory.create({
            ...watchData,
            campus_id,
            created_at: new Date(),
            updated_at: new Date(),
        });

        // Update course progress
        await this.updateCourseProgress(
            campus_id,
            watchData.course_id!,
            watchData.user_id!,
            watchData.watch_duration!,
            watchData.is_completed!
        );

        return watchHistory;
    }

    /**
     * Get detailed watch analytics
     */
    public static async getWatchAnalytics(
        campus_id: string,
        course_id: string,
        user_id?: string
    ): Promise<any> {
        const query: any = {
            campus_id,
            course_id,
        };

        if (user_id) query.user_id = user_id;

        const watchHistory: { rows: ICourseWatchHistoryData[] } = await CourseWatchHistory.find(query);

        return this.calculateWatchAnalytics(watchHistory.rows);
    }

    // ==================== PROGRESS TRACKING ====================

    /**
     * Get comprehensive course progress
     */
    public static async getCourseProgress(
        campus_id: string,
        course_id: string,
        user_id: string
    ): Promise<ICourseProgressData> {
        const progress: { rows: ICourseProgressData[] } = await CourseProgress.find({
            campus_id,
            course_id,
            user_id,
        });

        if (progress.rows.length === 0) {
            // Create initial progress record
            return await this.initializeCourseProgress(campus_id, course_id, user_id);
        }

        return progress.rows[0];
    }

    /**
     * Update course progress with advanced metrics
     */
    private static async updateCourseProgress(
        campus_id: string,
        course_id: string,
        user_id: string,
        watch_duration: number,
        is_completed: boolean
    ): Promise<void> {
        const progress = await this.getCourseProgress(campus_id, course_id, user_id);
        
        const updatedProgress: any = {
            total_watch_time: progress.total_watch_time + watch_duration,
            last_accessed_at: new Date(),
            updated_at: new Date(),
        };

        if (is_completed) {
            updatedProgress.chapters_completed = progress.chapters_completed + 1;
            updatedProgress.overall_progress = (updatedProgress.chapters_completed / progress.total_chapters) * 100;
        }

        await CourseProgress.updateById(progress.id, updatedProgress);
    }

    // ==================== STEP BUILDER FOR LESSONS ====================

    /**
     * Create lesson with step-by-step structure
     */
    public static async createLessonWithSteps(
        campus_id: string,
        course_id: string,
        chapter_id: string,
        lessonData: {
            title: string;
            description: string;
            steps: Array<{
                step_number: number;
                step_type: "intro" | "content" | "activity" | "assessment" | "summary";
                step_title: string;
                step_instructions: string;
                estimated_time: number;
                content_data: any;
            }>;
        }
    ): Promise<ICourseContentData[]> {
        const createdSteps: ICourseContentData[] = [];

        for (const step of lessonData.steps) {
            const stepContent = await CourseContent.create({
                campus_id,
                course_id,
                chapter_id,
                content_title: step.step_title,
                content_description: step.step_instructions,
                content_type: "lesson",
                content_format: "interactive",
                content_data: step.content_data,
                step_data: {
                    step_number: step.step_number,
                    step_type: step.step_type,
                    step_title: step.step_title,
                    step_instructions: step.step_instructions,
                    estimated_time: step.estimated_time,
                },
                access_settings: {
                    access_level: "enrolled",
                },
                interaction_settings: {
                    allow_comments: true,
                    allow_notes: true,
                    allow_bookmarks: true,
                    require_completion: true,
                },
                sort_order: step.step_number,
                meta_data: {
                    created_by: "system",
                    difficulty_level: "intermediate",
                    estimated_completion_time: step.estimated_time,
                },
                is_active: true,
                is_deleted: false,
                created_at: new Date(),
                updated_at: new Date(),
            });

            createdSteps.push(stepContent);
        }

        return createdSteps;
    }

    // ==================== HELPER METHODS ====================

    private static async generateFolderPath(
        course_id: string,
        folder_name: string,
        parent_folder_id?: string
    ): Promise<string> {
        if (!parent_folder_id) {
            return `/${course_id}/${folder_name}`;
        }

        const parentFolder = await CourseFolder.findById(parent_folder_id);
        if (!parentFolder) {
            throw new Error("Parent folder not found");
        }

        return `${parentFolder.folder_path}/${folder_name}`;
    }

    private static hasAccessToFolder(folder: ICourseFolderData, user_role: string): boolean {
        return folder.permissions.can_download.includes(user_role) ||
               folder.permissions.can_upload.includes(user_role) ||
               folder.access_level === "public";
    }

    private static async getChapterMetaData(chapter_id: string): Promise<any> {
        const chapter = await CourseChapter.findById(chapter_id);
        return chapter?.chapter_meta_data || {};
    }

    private static async initializeChapterProgress(course_id: string, chapter_id: string): Promise<void> {
        // This would typically get enrolled students and create progress records
        // Implementation depends on your enrollment system
    }

    private static async initializeCourseProgress(
        campus_id: string,
        course_id: string,
        user_id: string
    ): Promise<ICourseProgressData> {
        // Get total chapters and assignments for this course
        const chaptersCount = await this.getChaptersCount(course_id);
        const assignmentsCount = await this.getAssignmentsCount(course_id);

        return await CourseProgress.create({
            campus_id,
            course_id,
            user_id,
            enrollment_id: "", // This should be populated from enrollment
            overall_progress: 0,
            chapters_completed: 0,
            total_chapters: chaptersCount,
            assignments_completed: 0,
            total_assignments: assignmentsCount,
            quizzes_completed: 0,
            total_quizzes: 0,
            total_watch_time: 0,
            completion_percentage: 0,
            is_completed: false,
            certificates_earned: [],
            last_accessed_at: new Date(),
            streak_days: 0,
            performance_metrics: {
                average_quiz_score: 0,
                average_assignment_score: 0,
                engagement_score: 0,
                learning_velocity: 0,
            },
            badges_earned: [],
            study_patterns: {
                preferred_study_time: "evening",
                average_session_duration: 0,
                study_frequency: 0,
            },
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    private static async getChaptersCount(course_id: string): Promise<number> {
        const chapters: { rows: ICourseChapterData[] } = await CourseChapter.find({
            course_id,
            is_deleted: false,
        });
        return chapters.rows.length;
    }

    private static async getAssignmentsCount(course_id: string): Promise<number> {
        // This would count course assignments
        return 0; // Placeholder
    }

    private static calculateWatchAnalytics(watchHistory: ICourseWatchHistoryData[]): any {
        const totalWatchTime = watchHistory.reduce((sum, record) => sum + record.watch_duration, 0);
        const totalSessions = watchHistory.length;
        const completionRate = watchHistory.filter(record => record.is_completed).length / totalSessions;

        return {
            total_watch_time: totalWatchTime,
            total_sessions: totalSessions,
            completion_rate: completionRate,
            average_session_duration: totalWatchTime / totalSessions,
            engagement_metrics: {
                average_pause_count: watchHistory.reduce((sum, record) => sum + record.engagement_metrics.pause_count, 0) / totalSessions,
                average_seek_count: watchHistory.reduce((sum, record) => sum + record.engagement_metrics.seek_count, 0) / totalSessions,
                average_replay_count: watchHistory.reduce((sum, record) => sum + record.engagement_metrics.replay_count, 0) / totalSessions,
            },
            device_statistics: this.calculateDeviceStats(watchHistory),
            quality_preferences: this.calculateQualityStats(watchHistory),
        };
    }

    private static calculateDeviceStats(watchHistory: ICourseWatchHistoryData[]): any {
        const deviceStats = watchHistory.reduce((stats, record) => {
            const device = record.device_info.device_type;
            stats[device] = (stats[device] || 0) + 1;
            return stats;
        }, {} as any);

        return deviceStats;
    }

    private static calculateQualityStats(watchHistory: ICourseWatchHistoryData[]): any {
        const qualityStats = watchHistory.reduce((stats, record) => {
            const quality = record.watch_quality;
            stats[quality] = (stats[quality] || 0) + 1;
            return stats;
        }, {} as any);

        return qualityStats;
    }
}
