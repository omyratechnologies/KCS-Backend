import { Context } from "hono";

import { StudentProgressService } from "@/services/student_progress.service";

export class StudentProgressController {
    /**
     * Get comprehensive student progress
     * Can be called by any authenticated user for their own progress,
     * or by admins/teachers/parents for other students
     */
    public static readonly getStudentProgress = async (ctx: Context) => {
        try {
            const requestingUserId = ctx.get("user_id");
            const requestingUserType = ctx.get("user_type");
            const campus_id = ctx.get("campus_id");
            
            // Get student_id from params, default to requesting user
            const { student_id } = ctx.req.param();
            const targetStudentId = student_id || requestingUserId;

            // Permission check
            const canAccess = await StudentProgressService.canAccessStudentProgress(
                requestingUserId,
                requestingUserType,
                targetStudentId,
                campus_id
            );

            if (!canAccess) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to access this student's progress",
                    },
                    403
                );
            }

            const result = await StudentProgressService.getComprehensiveProgress(
                targetStudentId,
                campus_id
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Student progress retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching student progress:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch student progress",
                },
                500
            );
        }
    };

    /**
     * Get detailed course progress for a specific course
     */
    public static readonly getCourseProgress = async (ctx: Context) => {
        try {
            const requestingUserId = ctx.get("user_id");
            const requestingUserType = ctx.get("user_type");
            const campus_id = ctx.get("campus_id");
            
            const { student_id, course_id } = ctx.req.param();
            const targetStudentId = student_id || requestingUserId;

            // Permission check
            const canAccess = await StudentProgressService.canAccessStudentProgress(
                requestingUserId,
                requestingUserType,
                targetStudentId,
                campus_id
            );

            if (!canAccess) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to access this student's progress",
                    },
                    403
                );
            }

            const result = await StudentProgressService.getCourseProgress(
                targetStudentId,
                course_id,
                campus_id
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Course progress retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching course progress:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch course progress",
                },
                500
            );
        }
    };

    /**
     * Get assignment progress summary
     */
    public static readonly getAssignmentProgress = async (ctx: Context) => {
        try {
            const requestingUserId = ctx.get("user_id");
            const requestingUserType = ctx.get("user_type");
            const campus_id = ctx.get("campus_id");
            
            const { student_id } = ctx.req.param();
            const targetStudentId = student_id || requestingUserId;

            // Permission check
            const canAccess = await StudentProgressService.canAccessStudentProgress(
                requestingUserId,
                requestingUserType,
                targetStudentId,
                campus_id
            );

            if (!canAccess) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to access this student's progress",
                    },
                    403
                );
            }

            const result = await StudentProgressService.getAssignmentProgress(
                targetStudentId,
                campus_id
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Assignment progress retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching assignment progress:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch assignment progress",
                },
                500
            );
        }
    };

    /**
     * Get overall academic performance summary
     */
    public static readonly getAcademicSummary = async (ctx: Context) => {
        try {
            const requestingUserId = ctx.get("user_id");
            const requestingUserType = ctx.get("user_type");
            const campus_id = ctx.get("campus_id");
            
            const { student_id } = ctx.req.param();
            const targetStudentId = student_id || requestingUserId;

            // Permission check
            const canAccess = await StudentProgressService.canAccessStudentProgress(
                requestingUserId,
                requestingUserType,
                targetStudentId,
                campus_id
            );

            if (!canAccess) {
                return ctx.json(
                    {
                        success: false,
                        error: "Insufficient permissions to access this student's progress",
                    },
                    403
                );
            }

            const result = await StudentProgressService.getAcademicSummary(
                targetStudentId,
                campus_id
            );

            return ctx.json({
                success: true,
                data: result,
                message: "Academic summary retrieved successfully",
            });
        } catch (error) {
            console.error("Error fetching academic summary:", error);
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch academic summary",
                },
                500
            );
        }
    };
}