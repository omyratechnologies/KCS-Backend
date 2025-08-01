import { Context } from "hono";
import { ICourseContentData, CourseContent } from "@/models/course_content.model";
import { ICourseSectionData, CourseSection } from "@/models/course_section.model";
import { ICourseUserNotesData, CourseUserNotes } from "@/models/course_user_notes.model";
import { ICourseDiscussionData, CourseDiscussion } from "@/models/course_discussion.model";
import { ICourseEnrollmentData, CourseEnrollment } from "@/models/course_enrollment.model";
import { ICourseProgressData, CourseProgress } from "@/models/course_progress.model";
import { ICourseWatchHistoryData, CourseWatchHistory } from "@/models/course_watch_history.model";

export class ModernCourseContentController {

    // ==================== SECTION MANAGEMENT ====================

    /**
     * Create a new course section
     * POST /api/course-content/{course_id}/sections
     */
    public static readonly createSection = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            
            const sectionData: Partial<ICourseSectionData> = await ctx.req.json();
            
            const section = await CourseSection.create({
                campus_id,
                course_id,
                ...sectionData,
                access_settings: {
                    access_level: "free",
                    is_preview: false,
                    ...sectionData.access_settings
                },
                is_active: true,
                is_deleted: false
            });
            
            return ctx.json({
                success: true,
                data: section,
                message: "Section created successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create section"
            }, 500);
        }
    };

    /**
     * Get course sections with content
     * GET /api/course-content/{course_id}/sections
     */
    public static readonly getCourseSections = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            const { include_content = "true", user_progress = "true" } = ctx.req.query();
            
            // Get sections
            const sections = await CourseSection.find({
                campus_id,
                course_id,
                is_active: true,
                is_deleted: false
            });
            
            // Sort sections
            const sortedSections = sections.sort((a, b) => a.sort_order - b.sort_order);
            
            let enrichedSections = sections;
            
            if (include_content === "true") {
                // Get content for each section
                enrichedSections = await Promise.all(
                    sortedSections.map(async (section) => {
                        const content = await CourseContent.find({
                            campus_id,
                            course_id,
                            section_id: section.id,
                            is_active: true,
                            is_deleted: false
                        });
                        
                        // Sort content
                        const sortedContent = content.sort((a, b) => a.sort_order - b.sort_order);
                        
                        return {
                            ...section,
                            content: sortedContent || []
                        };
                    })
                );
            } else {
                enrichedSections = sortedSections;
            }
            
            // Get user progress if requested
            let userProgress = null;
            if (user_progress === "true") {
                userProgress = await CourseProgress.findOne({
                    campus_id,
                    course_id,
                    user_id,
                    is_active: true
                });
            }
            
            return ctx.json({
                success: true,
                data: {
                    sections: enrichedSections,
                    user_progress: userProgress,
                    total_sections: sections.length
                },
                message: "Course sections retrieved successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve sections"
            }, 500);
        }
    };

    // ==================== CONTENT MANAGEMENT ====================

    /**
     * Create content in a section
     * POST /api/course-content/{course_id}/sections/{section_id}/content
     */
    public static readonly createContent = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id, section_id } = ctx.req.param();
            
            const contentData: Partial<ICourseContentData> = await ctx.req.json();
            
            const content = await CourseContent.create({
                campus_id,
                course_id,
                section_id,
                ...contentData,
                progress_tracking: {
                    is_completable: true,
                    completion_criteria: "view_time",
                    auto_complete_enabled: false
                },
                access_settings: {
                    access_level: "free",
                    is_preview: false,
                    ...contentData.access_settings
                },
                interaction_settings: {
                    allow_comments: true,
                    allow_notes: true,
                    allow_bookmarks: true,
                    allow_downloads: false,
                    require_completion: false,
                    enable_playback_speed: true,
                    enable_auto_play: false,
                    ...contentData.interaction_settings
                },
                analytics: {
                    view_count: 0,
                    completion_count: 0,
                    average_watch_time: 0,
                    engagement_score: 0,
                    notes_count: 0,
                    discussions_count: 0,
                    downloads_count: 0
                },
                meta_data: {
                    created_by: user_id,
                    content_source: "upload",
                    ...contentData.meta_data
                },
                is_active: true,
                is_deleted: false
            });
            
            return ctx.json({
                success: true,
                data: content,
                message: "Content created successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create content"
            }, 500);
        }
    };

    /**
     * Get content details with user-specific data
     * GET /api/course-content/{course_id}/content/{content_id}
     */
    public static readonly getContentDetails = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id, content_id } = ctx.req.param();
            
            // Get content
            const content = await CourseContent.findOne({
                id: content_id,
                campus_id,
                course_id,
                is_active: true,
                is_deleted: false
            });
            
            if (!content) {
                return ctx.json({
                    success: false,
                    message: "Content not found"
                }, 404);
            }
            
            // Get user's notes for this content
            const userNotes = await CourseUserNotes.find({
                campus_id,
                course_id,
                content_id,
                user_id,
                is_active: true,
                is_deleted: false
            });
            
            // Sort notes by creation date (newest first)
            const sortedUserNotes = userNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
            // Get discussions for this content
            const discussions = await CourseDiscussion.find({
                campus_id,
                course_id,
                content_id,
                parent_discussion_id: { $exists: false }, // Only top-level discussions
                is_active: true,
                is_deleted: false
            });
            
            // Sort discussions and limit to 10
            const sortedDiscussions = discussions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);
            
            // Get user's watch history
            const watchHistory = await CourseWatchHistory.findOne({
                campus_id,
                course_id,
                content_id,
                user_id
            });
            
            // Update analytics - view count
            await CourseContent.updateById(content_id, {
                $inc: { "analytics.view_count": 1 },
                updated_at: new Date()
            });
            
            return ctx.json({
                success: true,
                data: {
                    content,
                    user_notes: sortedUserNotes,
                    discussions: sortedDiscussions,
                    watch_history: watchHistory,
                    user_progress: {
                        is_completed: watchHistory?.is_completed || false,
                        last_position: watchHistory?.last_watched_position || 0,
                        watch_percentage: watchHistory?.watch_percentage || 0
                    }
                },
                message: "Content details retrieved successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve content details"
            }, 500);
        }
    };

    // ==================== USER NOTES ====================

    /**
     * Create a user note
     * POST /api/course-content/{course_id}/content/{content_id}/notes
     */
    public static readonly createUserNote = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id, content_id } = ctx.req.param();
            
            const noteData: Partial<ICourseUserNotesData> = await ctx.req.json();
            
            const note = await CourseUserNotes.create({
                campus_id,
                course_id,
                content_id,
                user_id,
                ...noteData,
                meta_data: {
                    created_from: "web",
                    view_count: 0,
                    ...noteData.meta_data
                },
                is_active: true,
                is_deleted: false
            });
            
            // Update content analytics
            await CourseContent.updateById(content_id, {
                $inc: { "analytics.notes_count": 1 },
                updated_at: new Date()
            });
            
            return ctx.json({
                success: true,
                data: note,
                message: "Note created successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create note"
            }, 500);
        }
    };

    /**
     * Get user notes for content or course
     * GET /api/course-content/{course_id}/notes
     */
    public static readonly getUserNotes = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            const { content_id, note_type, page = "1", limit = "20" } = ctx.req.query();
            
            const query: any = {
                campus_id,
                course_id,
                user_id,
                is_active: true,
                is_deleted: false
            };
            
            if (content_id) query.content_id = content_id;
            if (note_type) query.note_type = note_type;
            
            const notesResult = await CourseUserNotes.find(query);
            const notes = notesResult
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));
            
            const totalNotes = await CourseUserNotes.count(query);
            
            return ctx.json({
                success: true,
                data: {
                    notes,
                    pagination: {
                        current_page: parseInt(page),
                        per_page: parseInt(limit),
                        total_items: totalNotes,
                        total_pages: Math.ceil(totalNotes / parseInt(limit))
                    }
                },
                message: "Notes retrieved successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve notes"
            }, 500);
        }
    };

    // ==================== DISCUSSIONS ====================

    /**
     * Create a discussion
     * POST /api/course-content/{course_id}/discussions
     */
    public static readonly createDiscussion = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const { course_id } = ctx.req.param();
            
            const discussionData: Partial<ICourseDiscussionData> = await ctx.req.json();
            
            const discussion = await CourseDiscussion.create({
                campus_id,
                course_id,
                user_id,
                ...discussionData,
                is_instructor_reply: user_type === "teacher" || user_type === "instructor",
                engagement_metrics: {
                    view_count: 0,
                    reply_count: 0,
                    bookmark_count: 0,
                    share_count: 0
                },
                moderation: {
                    is_flagged: false,
                    is_approved: true
                },
                meta_data: {
                    last_activity_at: new Date()
                },
                is_active: true,
                is_deleted: false
            });
            
            // Update content analytics if content_id provided
            if (discussionData.content_id) {
                await CourseContent.updateById(discussionData.content_id, {
                    $inc: { "analytics.discussions_count": 1 },
                    updated_at: new Date()
                });
            }
            
            return ctx.json({
                success: true,
                data: discussion,
                message: "Discussion created successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to create discussion"
            }, 500);
        }
    };

    /**
     * Get discussions for course/content
     * GET /api/course-content/{course_id}/discussions
     */
    public static readonly getDiscussions = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { course_id } = ctx.req.param();
            const { content_id, discussion_type, sort = "recent", page = "1", limit = "10" } = ctx.req.query();
            
            const query: any = {
                campus_id,
                course_id,
                parent_discussion_id: { $exists: false }, // Only top-level discussions
                is_active: true,
                is_deleted: false
            };
            
            if (content_id) query.content_id = content_id;
            if (discussion_type) query.discussion_type = discussion_type;
            
            let sortCriteria: any = { created_at: -1 }; // default: recent
            if (sort === "popular") sortCriteria = { upvotes_count: -1, created_at: -1 };
            if (sort === "unanswered") {
                query.replies_count = 0;
                query.discussion_type = "question";
            }
            
            const discussionsResult = await CourseDiscussion.find(query);
            let sortedDiscussions = discussionsResult;
            
            if (sort === "popular") {
                sortedDiscussions = discussionsResult.sort((a, b) => {
                    if (b.upvotes_count !== a.upvotes_count) {
                        return b.upvotes_count - a.upvotes_count;
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
            } else {
                sortedDiscussions = discussionsResult.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            }
            
            const discussions = sortedDiscussions
                .slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));
            
            // Get replies for each discussion
            const enrichedDiscussions = await Promise.all(
                discussions.map(async (discussion) => {
                    const repliesResult = await CourseDiscussion.find({
                        parent_discussion_id: discussion.id,
                        is_active: true,
                        is_deleted: false
                    });
                    const replies = repliesResult
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .slice(0, 3); // Show recent 3 replies
                    
                    return {
                        ...discussion,
                        recent_replies: replies
                    };
                })
            );
            
            const totalDiscussions = await CourseDiscussion.count(query);
            
            return ctx.json({
                success: true,
                data: {
                    discussions: enrichedDiscussions,
                    pagination: {
                        current_page: parseInt(page),
                        per_page: parseInt(limit),
                        total_items: totalDiscussions,
                        total_pages: Math.ceil(totalDiscussions / parseInt(limit))
                    }
                },
                message: "Discussions retrieved successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve discussions"
            }, 500);
        }
    };

    // ==================== PROGRESS TRACKING ====================

    /**
     * Update user progress for content
     * POST /api/course-content/{course_id}/content/{content_id}/progress
     */
    public static readonly updateContentProgress = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id, content_id } = ctx.req.param();
            
            const progressData = await ctx.req.json();
            const { 
                watch_duration = 0, 
                total_duration = 0, 
                last_position = 0, 
                is_completed = false,
                device_info = {},
                engagement_metrics = {}
            } = progressData;
            
            const watch_percentage = total_duration > 0 ? Math.min((watch_duration / total_duration) * 100, 100) : 0;
            
            // Update or create watch history
            const existingHistory = await CourseWatchHistory.findOne({
                campus_id,
                course_id,
                content_id,
                user_id
            });
            
            if (existingHistory) {
                await CourseWatchHistory.updateById(existingHistory.id, {
                    watch_duration: Math.max(existingHistory.watch_duration, watch_duration),
                    watch_percentage,
                    is_completed: is_completed || existingHistory.is_completed,
                    last_watched_position: last_position,
                    engagement_metrics: {
                        ...existingHistory.engagement_metrics,
                        ...engagement_metrics
                    },
                    updated_at: new Date()
                });
            } else {
                await CourseWatchHistory.create({
                    campus_id,
                    course_id,
                    chapter_id: "", // You might want to get this from content
                    content_id,
                    user_id,
                    session_id: `session_${Date.now()}`,
                    watch_duration,
                    total_duration,
                    watch_percentage,
                    is_completed,
                    last_watched_position: last_position,
                    watch_quality: "720p", // Default
                    device_info,
                    engagement_metrics: {
                        pause_count: 0,
                        seek_count: 0,
                        replay_count: 0,
                        speed_changes: 0,
                        interaction_events: [],
                        ...engagement_metrics
                    }
                });
            }
            
            // Update overall course progress
            await this.updateCourseProgress(campus_id, course_id, user_id);
            
            return ctx.json({
                success: true,
                message: "Progress updated successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to update progress"
            }, 500);
        }
    };

    /**
     * Get comprehensive course progress
     * GET /api/course-content/{course_id}/progress
     */
    public static readonly getCourseProgress = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { course_id } = ctx.req.param();
            
            // Get enrollment info
            const enrollment = await CourseEnrollment.findOne({
                campus_id,
                course_id,
                user_id,
                is_active: true
            });
            
            if (!enrollment) {
                return ctx.json({
                    success: false,
                    message: "User not enrolled in this course"
                }, 404);
            }
            
            // Get course progress
            const progress = await CourseProgress.findOne({
                campus_id,
                course_id,
                user_id,
                is_active: true
            });
            
            // Get detailed section progress
            const sectionsResult = await CourseSection.find({
                campus_id,
                course_id,
                is_active: true,
                is_deleted: false
            });
            const sections = sectionsResult.sort((a, b) => a.sort_order - b.sort_order);
            
            const sectionProgress = await Promise.all(
                sections.map(async (section) => {
                    const sectionContent = await CourseContent.find({
                        campus_id,
                        course_id,
                        section_id: section.id,
                        is_active: true,
                        is_deleted: false
                    });
                    
                    const completedContent = await CourseWatchHistory.count({
                        campus_id,
                        course_id,
                        user_id,
                        is_completed: true,
                        content_id: { $in: sectionContent.map(c => c.id) }
                    });
                    
                    return {
                        section_id: section.id,
                        section_title: section.section_title,
                        total_content: sectionContent.length,
                        completed_content: completedContent,
                        completion_percentage: sectionContent.length > 0 ? (completedContent / sectionContent.length) * 100 : 0
                    };
                })
            );
            
            return ctx.json({
                success: true,
                data: {
                    overall_progress: progress,
                    enrollment_info: enrollment,
                    section_progress: sectionProgress,
                    summary: {
                        total_sections: sections.length,
                        completed_sections: sectionProgress.filter(s => s.completion_percentage === 100).length,
                        overall_completion: sectionProgress.length > 0 
                            ? sectionProgress.reduce((acc, s) => acc + s.completion_percentage, 0) / sectionProgress.length 
                            : 0
                    }
                },
                message: "Course progress retrieved successfully"
            });
        } catch (error) {
            return ctx.json({
                success: false,
                message: error instanceof Error ? error.message : "Failed to retrieve course progress"
            }, 500);
        }
    };

    // ==================== HELPER METHODS ====================

    /**
     * Update overall course progress
     */
    private static async updateCourseProgress(campus_id: string, course_id: string, user_id: string) {
        try {
            // Get total content count
            const totalContent = await CourseContent.count({
                campus_id,
                course_id,
                is_active: true,
                is_deleted: false
            });
            
            // Get completed content count
            const completedContent = await CourseWatchHistory.count({
                campus_id,
                course_id,
                user_id,
                is_completed: true
            });
            
            // Get total watch time
            const watchHistories = await CourseWatchHistory.find({
                campus_id,
                course_id,
                user_id
            });
            
            const totalWatchTime = watchHistories.reduce((acc, h) => acc + h.watch_duration, 0);
            
            // Update course progress
            const progressData = {
                campus_id,
                course_id,
                user_id,
                enrollment_id: "", // You might want to get this
                overall_progress: totalContent > 0 ? (completedContent / totalContent) * 100 : 0,
                chapters_completed: completedContent,
                total_chapters: totalContent,
                assignments_completed: 0, // Calculate based on your logic
                total_assignments: 0,
                quizzes_completed: 0,
                total_quizzes: 0,
                total_watch_time: totalWatchTime,
                completion_percentage: totalContent > 0 ? (completedContent / totalContent) * 100 : 0,
                is_completed: totalContent > 0 && completedContent === totalContent,
                last_accessed_at: new Date(),
                streak_days: 1 // Calculate based on your logic
            };
            
            const existingProgress = await CourseProgress.findOne({
                campus_id,
                course_id,
                user_id
            });
            
            if (existingProgress) {
                await CourseProgress.updateById(existingProgress.id, {
                    ...progressData,
                    updated_at: new Date()
                });
            } else {
                await CourseProgress.create(progressData);
            }
            
        } catch (error) {
            console.error("Error updating course progress:", error);
        }
    }
}
