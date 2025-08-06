import { Context } from "hono";

import { CourseService } from "@/services/course.service";

export class CourseController {
    // ==================== ADMIN/TEACHER COURSE MANAGEMENT ====================

    /**
     * Create a new course
     * Admin/Teacher only
     */
    public static readonly createCourse = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const courseData = await ctx.req.json();

            const result = await CourseService.createCourse(campus_id, user_id, courseData);

            return ctx.json(
                {
                    success: true,
                    data: result.data,
                    message: result.message,
                },
                201
            );
        } catch (error) {
            console.error("Error creating course:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to create course",
                },
                500
            );
        }
    };

    /**
     * Get all courses with filtering
     * Public access with different data based on role
     */
    public static readonly getCourses = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            const query = ctx.req.query();
            const filters = {
                page: query.page ? Number.parseInt(query.page as string) : 1,
                limit: query.limit ? Number.parseInt(query.limit as string) : 20,
                status: query.status as string,
                category: query.category as string,
                difficulty_level: query.difficulty_level as string,
                price_range: query.price_range as string,
                search_query: query.search as string,
                instructor_id: query.instructor_id as string,
                class_id: query.class_id as string,
                is_featured: query.featured ? query.featured === "true" : undefined,
                sort_by: (query.sort_by as string) || "created_at",
                sort_order: (query.sort_order as "asc" | "desc") || "desc",
            };

            // Filter by published status for non-admin users
            if (!["Admin", "Super Admin", "Teacher"].includes(user_type)) {
                filters.status = "published";
            }

            const result = await CourseService.getCourses(campus_id, filters);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting courses:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get courses",
                },
                500
            );
        }
    };

    /**
     * Get course by ID with detailed information
     */
    public static readonly getCourseById = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.getCourseById(course_id, campus_id, user_id);

            // Check if user can access this course
            if (
                result.data.status !== "published" &&
                !["Admin", "Super Admin", "Teacher"].includes(user_type) &&
                result.data.created_by !== user_id
            ) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course not found or access denied",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting course:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get course",
                },
                500
            );
        }
    };

    /**
     * Update course
     * Admin/Teacher only (creator or assigned instructor)
     */
    public static readonly updateCourse = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const updateData = await ctx.req.json();

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            // Check permissions
            const courseResult = await CourseService.getCourseById(course_id, campus_id);
            const course = courseResult.data;

            const canUpdate =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canUpdate) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to update this course",
                    },
                    403
                );
            }

            const result = await CourseService.updateCourse(course_id, campus_id, user_id, updateData);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating course:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update course",
                },
                500
            );
        }
    };

    /**
     * Publish course
     * Admin/Teacher only (creator or assigned instructor)
     */
    public static readonly publishCourse = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            // Check permissions
            const courseResult = await CourseService.getCourseById(course_id, campus_id);
            const course = courseResult.data;

            const canPublish =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canPublish) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to publish this course",
                    },
                    403
                );
            }

            const result = await CourseService.publishCourse(course_id, campus_id, user_id);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error publishing course:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to publish course",
                },
                500
            );
        }
    };

    /**
     * Delete/Archive course
     * Admin only or course creator
     */
    public static readonly deleteCourse = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            // Check permissions
            const courseResult = await CourseService.getCourseById(course_id, campus_id);
            const course = courseResult.data;

            const canDelete = ["Admin", "Super Admin"].includes(user_type) || course.created_by === user_id;

            if (!canDelete) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to delete this course",
                    },
                    403
                );
            }

            const result = await CourseService.deleteCourse(course_id, campus_id, user_id);

            return ctx.json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            console.error("Error deleting course:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to delete course",
                },
                500
            );
        }
    };

    // ==================== COURSE CONTENT MANAGEMENT ====================

    /**
     * Get section by ID with detailed information
     */
    public static readonly getSectionById = async (ctx: Context) => {
        try {
            const section_id = ctx.req.param("section_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            if (!section_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Section ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.getSectionById(section_id, campus_id, user_id);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting section:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get section",
                },
                500
            );
        }
    };

    /**
     * Update course section
     */
    public static readonly updateCourseSection = async (ctx: Context) => {
        try {
            const section_id = ctx.req.param("section_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const updateData = await ctx.req.json();

            if (!section_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Section ID is required",
                    },
                    400
                );
            }

            // Check permissions - get section first to get course_id
            const sectionResult = await CourseService.getSectionById(section_id, campus_id);
            const courseResult = await CourseService.getCourseById(sectionResult.data.course_id, campus_id);
            const course = courseResult.data;

            const canUpdate =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canUpdate) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to update section in this course",
                    },
                    403
                );
            }

            const result = await CourseService.updateCourseSection(section_id, campus_id, user_id, updateData);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating section:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update section",
                },
                500
            );
        }
    };

    /**
     * Delete course section
     */
    public static readonly deleteCourseSection = async (ctx: Context) => {
        try {
            const section_id = ctx.req.param("section_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            if (!section_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Section ID is required",
                    },
                    400
                );
            }

            // Check permissions - get section first to get course_id
            const sectionResult = await CourseService.getSectionById(section_id, campus_id);
            const courseResult = await CourseService.getCourseById(sectionResult.data.course_id, campus_id);
            const course = courseResult.data;

            const canDelete =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canDelete) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to delete section in this course",
                    },
                    403
                );
            }

            const result = await CourseService.deleteCourseSection(section_id, campus_id, user_id);

            return ctx.json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            console.error("Error deleting section:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to delete section",
                },
                500
            );
        }
    };

    /**
     * Create course section
     */
    public static readonly createCourseSection = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const sectionData = await ctx.req.json();

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            // Check permissions
            const courseResult = await CourseService.getCourseById(course_id, campus_id);
            const course = courseResult.data;

            const canCreateSection =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canCreateSection) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to create section in this course",
                    },
                    403
                );
            }

            const result = await CourseService.createCourseSection(course_id, campus_id, sectionData);

            return ctx.json(
                {
                    success: true,
                    data: result.data,
                    message: result.message,
                },
                201
            );
        } catch (error) {
            console.error("Error creating course section:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to create course section",
                },
                500
            );
        }
    };

    /**
     * Get lecture by ID with detailed information
     */
    public static readonly getLectureById = async (ctx: Context) => {
        try {
            const lecture_id = ctx.req.param("lecture_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");

            if (!lecture_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Lecture ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.getLectureById(lecture_id, campus_id, user_id);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting lecture:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get lecture",
                },
                500
            );
        }
    };

    /**
     * Update course lecture
     */
    public static readonly updateCourseLecture = async (ctx: Context) => {
        try {
            const lecture_id = ctx.req.param("lecture_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const updateData = await ctx.req.json();

            if (!lecture_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Lecture ID is required",
                    },
                    400
                );
            }

            // Check permissions - get lecture first to get course_id
            const lectureResult = await CourseService.getLectureById(lecture_id, campus_id);
            const courseResult = await CourseService.getCourseById(lectureResult.data.course_id, campus_id);
            const course = courseResult.data;

            const canUpdate =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canUpdate) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to update lecture in this course",
                    },
                    403
                );
            }

            const result = await CourseService.updateCourseLecture(lecture_id, campus_id, user_id, updateData);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating lecture:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update lecture",
                },
                500
            );
        }
    };

    /**
     * Delete course lecture
     */
    public static readonly deleteCourseLecture = async (ctx: Context) => {
        try {
            const lecture_id = ctx.req.param("lecture_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            if (!lecture_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Lecture ID is required",
                    },
                    400
                );
            }

            // Check permissions - get lecture first to get course_id
            const lectureResult = await CourseService.getLectureById(lecture_id, campus_id);
            const courseResult = await CourseService.getCourseById(lectureResult.data.course_id, campus_id);
            const course = courseResult.data;

            const canDelete =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canDelete) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to delete lecture in this course",
                    },
                    403
                );
            }

            const result = await CourseService.deleteCourseLecture(lecture_id, campus_id, user_id);

            return ctx.json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            console.error("Error deleting lecture:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to delete lecture",
                },
                500
            );
        }
    };

    /**
     * Create course lecture
     */
    public static readonly createCourseLecture = async (ctx: Context) => {
        try {
            const section_id = ctx.req.param("section_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const lectureData = await ctx.req.json();

            if (!section_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Section ID is required",
                    },
                    400
                );
            }

            // TODO: Add permission check for section/course access

            const result = await CourseService.createCourseLecture(section_id, campus_id, lectureData);

            return ctx.json(
                {
                    success: true,
                    data: result.data,
                    message: result.message,
                },
                201
            );
        } catch (error) {
            console.error("Error creating course lecture:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to create course lecture",
                },
                500
            );
        }
    };

    /**
     * Update section order
     */
    public static readonly updateSectionOrder = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const { section_orders } = await ctx.req.json();

            if (!course_id || !section_orders || !Array.isArray(section_orders)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID and section_orders array are required",
                    },
                    400
                );
            }

            // Check permissions
            const courseResult = await CourseService.getCourseById(course_id, campus_id);
            const course = courseResult.data;

            const canReorder =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canReorder) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to reorder sections",
                    },
                    403
                );
            }

            const result = await CourseService.updateSectionOrder(course_id, campus_id, section_orders);

            return ctx.json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating section order:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update section order",
                },
                500
            );
        }
    };

    /**
     * Update lecture order
     */
    public static readonly updateLectureOrder = async (ctx: Context) => {
        try {
            const section_id = ctx.req.param("section_id");
            const campus_id = ctx.get("campus_id");
            const { lecture_orders } = await ctx.req.json();

            if (!section_id || !lecture_orders || !Array.isArray(lecture_orders)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Section ID and lecture_orders array are required",
                    },
                    400
                );
            }

            // TODO: Add permission check

            const result = await CourseService.updateLectureOrder(section_id, campus_id, lecture_orders);

            return ctx.json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating lecture order:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update lecture order",
                },
                500
            );
        }
    };

    // ==================== STUDENT ENROLLMENT & PROGRESS ====================

    /**
     * Enroll in course
     */
    public static readonly enrollInCourse = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const enrollmentData = await ctx.req.json().catch(() => ({}));

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.enrollInCourse(course_id, user_id, campus_id, enrollmentData);

            return ctx.json(
                {
                    success: true,
                    data: result.data,
                    message: result.message,
                },
                201
            );
        } catch (error) {
            console.error("Error enrolling in course:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to enroll in course",
                },
                500
            );
        }
    };

    /**
     * Get user's enrolled courses
     */
    public static readonly getUserEnrolledCourses = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            const query = ctx.req.query();
            const filters = {
                status: query.status as string,
                progress: query.progress as string,
                page: query.page ? Number.parseInt(query.page as string) : 1,
                limit: query.limit ? Number.parseInt(query.limit as string) : 20,
            };

            const result = await CourseService.getUserEnrolledCourses(user_id, campus_id, filters);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting enrolled courses:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get enrolled courses",
                },
                500
            );
        }
    };

    /**
     * Update course progress
     */
    public static readonly updateCourseProgress = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const lecture_id = ctx.req.param("lecture_id");
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const progressData = await ctx.req.json();

            if (!course_id || !lecture_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID and Lecture ID are required",
                    },
                    400
                );
            }

            const result = await CourseService.updateCourseProgress(
                course_id,
                lecture_id,
                user_id,
                campus_id,
                progressData
            );

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating course progress:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update course progress",
                },
                500
            );
        }
    };

    // ==================== REAL-TIME & AUTOMATED TRACKING ====================

    /**
     * Update real-time lecture progress
     * Student only - for automated tracking
     */
    public static readonly updateRealtimeProgress = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const lecture_id = ctx.req.param("lecture_id");
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const progressData = await ctx.req.json();

            if (!course_id || !lecture_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID and Lecture ID are required",
                    },
                    400
                );
            }

            const result = await CourseService.updateRealtimeProgress(
                course_id,
                lecture_id,
                user_id,
                campus_id,
                progressData
            );

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating real-time progress:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update real-time progress",
                },
                500
            );
        }
    };

    /**
     * Update batch progress data
     * Student only - for offline sync
     */
    public static readonly updateBatchProgress = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const batchData = await ctx.req.json();

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.updateBatchProgress(
                course_id,
                user_id,
                campus_id,
                batchData
            );

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating batch progress:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update batch progress",
                },
                500
            );
        }
    };

    /**
     * Get auto-completion status
     * Public access for enrolled users
     */
    public static readonly getAutoCompletionStatus = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const campus_id = ctx.get("campus_id");

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.getAutoCompletionStatus(course_id, campus_id);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting auto-completion status:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get auto-completion status",
                },
                500
            );
        }
    };

    /**
     * Update auto-completion configuration
     * Admin/Teacher/Instructor only
     */
    public static readonly updateAutoCompletionConfig = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const configData = await ctx.req.json();

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.updateAutoCompletionConfig(
                course_id,
                campus_id,
                user_id,
                configData
            );

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error updating auto-completion config:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update auto-completion config",
                },
                500
            );
        }
    };

    /**
     * Get personalized learning analytics
     * Student only
     */
    public static readonly getLearningAnalytics = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const timeframe = ctx.req.query("timeframe") || "month";

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.getLearningAnalytics(
                course_id,
                user_id,
                campus_id,
                timeframe
            );

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting learning analytics:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get learning analytics",
                },
                500
            );
        }
    };

    /**
     * Get AI-powered learning recommendations
     * Student only
     */
    public static readonly getSmartRecommendations = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const recommendationType = ctx.req.query("recommendation_type") || "all";

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.getSmartRecommendations(
                course_id,
                user_id,
                campus_id,
                recommendationType
            );

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting smart recommendations:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get smart recommendations",
                },
                500
            );
        }
    };

    /**
     * Auto-progress to next lecture
     * Student only
     */
    public static readonly autoProgressToNext = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.autoProgressToNext(
                course_id,
                user_id,
                campus_id
            );

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error auto-progressing to next lecture:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to auto-progress to next lecture",
                },
                500
            );
        }
    };

    /**
     * Get detailed watch time analytics
     * Student only
     */
    public static readonly getWatchTimeAnalytics = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const granularity = ctx.req.query("granularity") || "daily";

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            const result = await CourseService.getWatchTimeAnalytics(
                course_id,
                user_id,
                campus_id,
                granularity
            );

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting watch time analytics:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get watch time analytics",
                },
                500
            );
        }
    };

    // ==================== ANALYTICS ====================

    /**
     * Get course analytics
     * Admin/Teacher/Instructor only
     */
    public static readonly getCourseAnalytics = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID is required",
                    },
                    400
                );
            }

            // Check permissions
            const courseResult = await CourseService.getCourseById(course_id, campus_id);
            const course = courseResult.data;

            const canViewAnalytics =
                ["Admin", "Super Admin"].includes(user_type) ||
                course.created_by === user_id ||
                course.instructor_ids.includes(user_id);

            if (!canViewAnalytics) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to view course analytics",
                    },
                    403
                );
            }

            const result = await CourseService.getCourseAnalytics(course_id, campus_id);

            return ctx.json({
                success: true,
                data: result.data,
                message: result.message,
            });
        } catch (error) {
            console.error("Error getting course analytics:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get course analytics",
                },
                500
            );
        }
    };

    // ==================== ADMIN BULK OPERATIONS ====================

    /**
     * Bulk enroll students
     * Admin only
     */
    public static readonly bulkEnrollStudents = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const { student_ids, enrollment_type = "admin_assigned" } = await ctx.req.json();

            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Only admins can perform bulk enrollment",
                    },
                    403
                );
            }

            if (!course_id || !student_ids || !Array.isArray(student_ids)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Course ID and student_ids array are required",
                    },
                    400
                );
            }

            const results: Array<{
                student_id: string;
                success: boolean;
                data?: any;
            }> = [];
            const errors: Array<{
                student_id: string;
                success: boolean;
                error: string;
            }> = [];

            for (const student_id of student_ids) {
                try {
                    const result = await CourseService.enrollInCourse(course_id, student_id, campus_id, {
                        enrollment_type,
                        enrollment_source: "admin",
                        meta_data: {
                            custom_fields: {
                                enrolled_by: user_id,
                                bulk_enrollment: true,
                            },
                        },
                    });
                    results.push({
                        student_id,
                        success: true,
                        data: result.data,
                    });
                } catch (error) {
                    errors.push({
                        student_id,
                        success: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }

            return ctx.json({
                success: true,
                data: {
                    successful_enrollments: results.length,
                    failed_enrollments: errors.length,
                    results,
                    errors,
                },
                message: `Bulk enrollment completed: ${results.length} successful, ${errors.length} failed`,
            });
        } catch (error) {
            console.error("Error in bulk enrollment:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to perform bulk enrollment",
                },
                500
            );
        }
    };

    /**
     * Get course dashboard data
     * Admin/Teacher only
     */
    public static readonly getCourseDashboard = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const user_id = ctx.get("user_id");

            if (!["Admin", "Super Admin", "Teacher"].includes(user_type)) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to view course dashboard",
                    },
                    403
                );
            }

            // Get course statistics
            const stats = await CourseService.getCourseStatistics(campus_id);

            // Get recent courses
            const recentCoursesResult = await CourseService.getCourses(campus_id, {
                limit: 10,
                sort_by: "updated_at",
                sort_order: "desc",
                ...(user_type === "Teacher" ? { instructor_id: user_id } : {}),
            });

            return ctx.json({
                success: true,
                data: {
                    statistics: stats,
                    recent_courses: recentCoursesResult.data.courses,
                    quick_actions: ["create_course", "manage_enrollments", "view_analytics", "export_reports"],
                },
                message: "Course dashboard data retrieved successfully",
            });
        } catch (error) {
            console.error("Error getting course dashboard:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to get course dashboard",
                },
                500
            );
        }
    };
}