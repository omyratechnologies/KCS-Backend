/**
 * Fee Notification Controller
 * Handles manual fee notification sending with dynamic filtering
 */

import { Context } from "hono";
import { FeeNotificationService } from "@/services/fee_notification.service";
import log, { LogTypes } from "@/libs/logger";

export class FeeNotificationController {
    /**
     * Send manual fee notification to selected students and parents
     * POST /api/fee-notifications/send
     */
    public static async sendManualFeeNotification(ctx: Context) {
        try {
            const campusId = ctx.get("campus_id") as string;

            const body = await ctx.req.json();
            const { student_ids, parent_ids, message, title } = body;

            // Validate that at least one recipient type is provided
            if ((!student_ids || student_ids.length === 0) && (!parent_ids || parent_ids.length === 0)) {
                return ctx.json(
                    {
                        success: false,
                        message: "At least one student or parent must be selected",
                    },
                    400
                );
            }

            if (!message || message.trim().length === 0) {
                return ctx.json(
                    {
                        success: false,
                        message: "Message is required",
                    },
                    400
                );
            }

            const result = await FeeNotificationService.sendManualFeeNotification(campusId, {
                student_ids,
                parent_ids,
                message,
                title,
            });

            log(
                `Manual fee notification sent by ${ctx.get("user_id")} - Students: ${result.students_notified}, Parents: ${result.parents_notified}`,
                LogTypes.LOGS,
                "FeeNotificationController"
            );

            return ctx.json({
                success: result.success,
                message: result.success
                    ? "Fee notifications sent successfully"
                    : "Failed to send some notifications",
                data: result,
            });
        } catch (error) {
            log(
                `Error sending manual fee notification: ${error instanceof Error ? error.message : "Unknown error"}`,
                LogTypes.ERROR,
                "FeeNotificationController"
            );
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to send fee notifications",
                },
                500
            );
        }
    }

    /**
     * Get students by class for manual notification selection
     * GET /api/fee-notifications/students/:class_id
     */
    public static async getStudentsByClass(ctx: Context) {
        try {
            const campusId = ctx.get("campus_id") as string;
            const classId = ctx.req.param("class_id");

            const students = await FeeNotificationService.getStudentsByClass(campusId, classId);

            return ctx.json({
                success: true,
                data: students.map((student) => ({
                    id: student.id,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    email: student.email,
                    phone: student.phone,
                    class_id: student.class_id,
                })),
                total: students.length,
            });
        } catch (error) {
            log(
                `Error fetching students by class: ${error instanceof Error ? error.message : "Unknown error"}`,
                LogTypes.ERROR,
                "FeeNotificationController"
            );
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch students",
                },
                500
            );
        }
    }

    /**
     * Get parents for selected students
     * POST /api/fee-notifications/parents
     */
    public static async getParentsForStudents(ctx: Context) {
        try {
            const body = await ctx.req.json();
            const { student_ids } = body;

            if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
                return ctx.json(
                    {
                        success: false,
                        message: "student_ids array is required",
                    },
                    400
                );
            }

            const parents = await FeeNotificationService.getParentsForStudents(student_ids);

            return ctx.json({
                success: true,
                data: parents.map((parent) => ({
                    id: parent.id,
                    first_name: parent.first_name,
                    last_name: parent.last_name,
                    email: parent.email,
                    phone: parent.phone,
                })),
                total: parents.length,
            });
        } catch (error) {
            log(
                `Error fetching parents for students: ${error instanceof Error ? error.message : "Unknown error"}`,
                LogTypes.ERROR,
                "FeeNotificationController"
            );
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch parents",
                },
                500
            );
        }
    }

    /**
     * Get students with unpaid fees (with dynamic filtering)
     * GET /api/fee-notifications/unpaid-fees
     * Query params: class_id, days_until_due, days_until_due_min, days_until_due_max
     */
    public static async getStudentsWithUnpaidFees(ctx: Context) {
        try {
            const campusId = ctx.get("campus_id") as string;
            const userType = ctx.get("user_type") as string;

            // Only admins can access this
            if (!["Admin", "Super Admin", "Accountant"].includes(userType)) {
                return ctx.json(
                    {
                        success: false,
                        message: "Unauthorized access",
                    },
                    403
                );
            }

            // Parse query parameters
            const class_id = ctx.req.query("class_id");
            const days_until_due = ctx.req.query("days_until_due");
            const days_until_due_min = ctx.req.query("days_until_due_min");
            const days_until_due_max = ctx.req.query("days_until_due_max");

            // Build options object
            const options: {
                class_id?: string;
                days_until_due?: number;
                days_until_due_range?: { min: number; max: number };
            } = {};

            if (class_id) {
                options.class_id = class_id;
            }

            // Handle days_until_due (exact match with ±1 day tolerance)
            if (days_until_due) {
                const daysNum = parseInt(days_until_due, 10);
                if (isNaN(daysNum) || daysNum < 0) {
                    return ctx.json(
                        {
                            success: false,
                            message: "days_until_due must be a positive number",
                        },
                        400
                    );
                }
                options.days_until_due = daysNum;
            }

            // Handle days_until_due_range
            if (days_until_due_min || days_until_due_max) {
                const min = days_until_due_min ? parseInt(days_until_due_min, 10) : 0;
                const max = days_until_due_max ? parseInt(days_until_due_max, 10) : 365;

                if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
                    return ctx.json(
                        {
                            success: false,
                            message: "Invalid days_until_due range. min and max must be positive numbers with min <= max",
                        },
                        400
                    );
                }

                options.days_until_due_range = { min, max };
            }

            const students = await FeeNotificationService.getStudentsWithUnpaidFees(campusId, options);

            log(
                `Fetched ${students.length} students with unpaid fees for campus ${campusId} (filters: ${JSON.stringify(options)})`,
                LogTypes.LOGS,
                "FeeNotificationController"
            );

            return ctx.json({
                success: true,
                data: students,
                total: students.length,
                filters: options,
            });
        } catch (error) {
            log(
                `Error fetching students with unpaid fees: ${error instanceof Error ? error.message : "Unknown error"}`,
                LogTypes.ERROR,
                "FeeNotificationController"
            );
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch students with unpaid fees",
                },
                500
            );
        }
    }
}
