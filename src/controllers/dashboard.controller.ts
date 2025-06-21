import { Context } from "hono";

import { DashboardService } from "@/services/dashboard.service";

export class DashboardController {
    /**
     * Get comprehensive dashboard data for students
     * Includes: profile, classes, assignments, quizzes, notifications, attendance, grades
     */
    public static readonly getStudentDashboard = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            const dashboardData = await DashboardService.getStudentDashboard(
                user_id,
                campus_id
            );

            return ctx.json({
                success: true,
                data: dashboardData,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    /**
     * Get comprehensive dashboard data for teachers
     * Includes: profile, classes, subjects, assignments, students, notifications, schedule
     */
    public static readonly getTeacherDashboard = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            const dashboardData = await DashboardService.getTeacherDashboard(
                user_id,
                campus_id
            );

            return ctx.json({
                success: true,
                data: dashboardData,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    /**
     * Get comprehensive dashboard data for parents
     * Includes: children's profiles, grades, attendance, notifications, upcoming events
     */
    public static readonly getParentDashboard = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            const dashboardData = await DashboardService.getParentDashboard(
                user_id,
                campus_id
            );

            return ctx.json({
                success: true,
                data: dashboardData,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    /**
     * Get comprehensive dashboard data for admin/staff
     * Includes: campus overview, student count, teacher count, recent activities, notifications
     */
    public static readonly getAdminDashboard = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            const dashboardData = await DashboardService.getAdminDashboard(
                user_id,
                campus_id,
                user_type
            );

            return ctx.json({
                success: true,
                data: dashboardData,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    /**
     * Get quick stats for any user type
     * Provides essential counts and metrics
     */
    public static readonly getQuickStats = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            const stats = await DashboardService.getQuickStats(
                user_id,
                campus_id,
                user_type
            );

            return ctx.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    /**
     * Get recent activities for dashboard
     * Shows latest 10 activities relevant to the user
     */
    public static readonly getRecentActivities = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            
            const limit = Number(ctx.req.query("limit")) || 10;

            const activities = await DashboardService.getRecentActivities(
                user_id,
                campus_id,
                user_type,
                limit
            );

            return ctx.json({
                success: true,
                data: activities,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    /**
     * Get notifications summary for dashboard
     * Returns unread count and recent notifications
     */
    public static readonly getNotificationsSummary = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            const notificationsSummary = await DashboardService.getNotificationsSummary(
                user_id,
                campus_id,
                user_type
            );

            return ctx.json({
                success: true,
                data: notificationsSummary,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };

    /**
     * Get upcoming events and deadlines
     * Returns assignments, exams, meetings, etc. for the next 7 days
     */
    public static readonly getUpcomingEvents = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            
            const days = Number(ctx.req.query("days")) || 7;

            const events = await DashboardService.getUpcomingEvents(
                user_id,
                campus_id,
                user_type,
                days
            );

            return ctx.json({
                success: true,
                data: events,
            });
        } catch (error) {
            if (error instanceof Error) {
                return ctx.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    500
                );
            }
        }
    };
}
