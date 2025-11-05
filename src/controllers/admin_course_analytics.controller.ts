import { Context } from "hono";

import { AdminCourseAnalyticsService } from "@/services/admin_course_analytics.service";

export class AdminCourseAnalyticsController {
    /**
     * Get campus-wide course analytics
     * Admin only
     */
    public static readonly getCampusCourseAnalytics = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Verify admin permissions
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json(
                    {
                        success: false,
                        message: "Insufficient permissions. Admin access required.",
                    },
                    403
                );
            }

            const analytics = await AdminCourseAnalyticsService.getCampusCourseAnalytics(campus_id);

            return ctx.json({
                success: true,
                data: analytics,
                message: "Campus course analytics retrieved successfully",
            });
        } catch (error) {
            console.error("Error getting campus course analytics:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to get campus course analytics",
                },
                500
            );
        }
    };

    /**
     * Get detailed analytics for a specific course
     * Admin/Teacher/Instructor only
     */
    public static readonly getCourseDetailedAnalytics = async (ctx: Context) => {
        try {
            const course_id = ctx.req.param("course_id");
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const user_id = ctx.get("user_id");

            if (!course_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Course ID is required",
                    },
                    400
                );
            }

            // Verify permissions (Admin or course instructor)
            if (!["Admin", "Super Admin", "Teacher"].includes(user_type)) {
                return ctx.json(
                    {
                        success: false,
                        message: "Insufficient permissions. Admin or instructor access required.",
                    },
                    403
                );
            }

            const analytics = await AdminCourseAnalyticsService.getCourseDetailedAnalytics(course_id, campus_id);

            return ctx.json({
                success: true,
                data: analytics,
                message: "Course detailed analytics retrieved successfully",
            });
        } catch (error) {
            console.error("Error getting course detailed analytics:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to get course detailed analytics",
                },
                500
            );
        }
    };

    /**
     * Get instructor performance analytics
     * Admin or self-access only
     */
    public static readonly getInstructorAnalytics = async (ctx: Context) => {
        try {
            const instructor_id = ctx.req.param("instructor_id");
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const user_id = ctx.get("user_id");

            if (!instructor_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Instructor ID is required",
                    },
                    400
                );
            }

            // Verify permissions (Admin or self)
            if (!["Admin", "Super Admin"].includes(user_type) && user_id !== instructor_id) {
                return ctx.json(
                    {
                        success: false,
                        message: "Insufficient permissions. You can only view your own analytics.",
                    },
                    403
                );
            }

            const analytics = await AdminCourseAnalyticsService.getInstructorAnalytics(instructor_id, campus_id);

            return ctx.json({
                success: true,
                data: analytics,
                message: "Instructor analytics retrieved successfully",
            });
        } catch (error) {
            console.error("Error getting instructor analytics:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to get instructor analytics",
                },
                500
            );
        }
    };

    /**
     * Get enrollment trends and forecasting
     * Admin only
     */
    public static readonly getEnrollmentTrends = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const timeframe = (ctx.req.query("timeframe") as "week" | "month" | "quarter" | "year") || "month";

            // Verify admin permissions
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json(
                    {
                        success: false,
                        message: "Insufficient permissions. Admin access required.",
                    },
                    403
                );
            }

            const trends = await AdminCourseAnalyticsService.getEnrollmentTrends(campus_id, timeframe);

            return ctx.json({
                success: true,
                data: trends,
                message: "Enrollment trends retrieved successfully",
            });
        } catch (error) {
            console.error("Error getting enrollment trends:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to get enrollment trends",
                },
                500
            );
        }
    };

    /**
     * Get revenue analytics
     * Admin only
     */
    public static readonly getRevenueAnalytics = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const timeframe = (ctx.req.query("timeframe") as "month" | "quarter" | "year") || "month";

            // Verify admin permissions
            if (!["Admin", "Super Admin"].includes(user_type)) {
                return ctx.json(
                    {
                        success: false,
                        message: "Insufficient permissions. Admin access required.",
                    },
                    403
                );
            }

            const revenue = await AdminCourseAnalyticsService.getRevenueAnalytics(campus_id, timeframe);

            return ctx.json({
                success: true,
                data: revenue,
                message: "Revenue analytics retrieved successfully",
            });
        } catch (error) {
            console.error("Error getting revenue analytics:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to get revenue analytics",
                },
                500
            );
        }
    };

    /**
     * Get my instructor analytics (for logged-in teacher)
     * Teacher only - self access
     */
    public static readonly getMyInstructorAnalytics = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            if (!["Teacher", "Admin", "Super Admin"].includes(user_type)) {
                return ctx.json(
                    {
                        success: false,
                        message: "This endpoint is for instructors only",
                    },
                    403
                );
            }

            const analytics = await AdminCourseAnalyticsService.getInstructorAnalytics(user_id, campus_id);

            return ctx.json({
                success: true,
                data: analytics,
                message: "Your instructor analytics retrieved successfully",
            });
        } catch (error) {
            console.error("Error getting my instructor analytics:", error);
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to get your instructor analytics",
                },
                500
            );
        }
    };
}
