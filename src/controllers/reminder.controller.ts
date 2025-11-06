import { Context } from "hono";
import { ReminderService } from "@/services/reminder.service";
import log, { LogTypes } from "@/libs/logger";

export class ReminderController {
    /**
     * Create a new reminder
     */
    public static async createReminder(ctx: Context) {
        try {
            const userId = ctx.get("user_id") as string;
            const campusId = ctx.get("campus_id") as string;
            const body = await ctx.req.json();

            // Parse date string to Date object
            const reminderDate = new Date(body.reminder_date);
            
            if (isNaN(reminderDate.getTime())) {
                return ctx.json(
                    {
                        success: false,
                        message: "Invalid date format. Use YYYY-MM-DD",
                    },
                    400
                );
            }

            const reminder = await ReminderService.createReminder({
                user_id: userId,
                campus_id: campusId,
                title: body.title,
                note: body.note,
                reminder_date: reminderDate,
                reminder_time: body.reminder_time,
                frequency: body.frequency,
                is_am: body.is_am,
            });

            return ctx.json(
                {
                    success: true,
                    message: "Reminder created successfully",
                    data: reminder,
                },
                201
            );
        } catch (error) {
            log(`Error creating reminder: ${error}`, LogTypes.ERROR, "ReminderController");
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to create reminder",
                },
                500
            );
        }
    }

    /**
     * Get a specific reminder
     */
    public static async getReminder(ctx: Context) {
        try {
            const userId = ctx.get("user_id") as string;
            const reminderId = ctx.req.param("id");

            const reminder = await ReminderService.getReminderById(reminderId, userId);

            if (!reminder) {
                return ctx.json(
                    {
                        success: false,
                        message: "Reminder not found",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                data: reminder,
            });
        } catch (error) {
            log(`Error fetching reminder: ${error}`, LogTypes.ERROR, "ReminderController");
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch reminder",
                },
                500
            );
        }
    }

    /**
     * Get all reminders for the user
     */
    public static async getUserReminders(ctx: Context) {
        try {
            const userId = ctx.get("user_id") as string;
            
            // Parse query parameters
            const isActive = ctx.req.query("is_active");
            const frequency = ctx.req.query("frequency") as "one_time" | "daily" | "weekly" | undefined;
            const fromDate = ctx.req.query("from_date");
            const toDate = ctx.req.query("to_date");

            const filters: {
                is_active?: boolean;
                frequency?: "one_time" | "daily" | "weekly";
                from_date?: Date;
                to_date?: Date;
            } = {};

            if (isActive !== undefined) {
                filters.is_active = isActive === "true";
            }

            if (frequency) {
                filters.frequency = frequency;
            }

            if (fromDate) {
                filters.from_date = new Date(fromDate);
            }

            if (toDate) {
                filters.to_date = new Date(toDate);
            }

            const reminders = await ReminderService.getUserReminders(userId, filters);

            return ctx.json({
                success: true,
                data: reminders,
                total: reminders.length,
            });
        } catch (error) {
            log(`Error fetching user reminders: ${error}`, LogTypes.ERROR, "ReminderController");
            return ctx.json(
                {
                    success: false,
                    message: "Failed to fetch reminders",
                },
                500
            );
        }
    }

    /**
     * Update a reminder
     */
    public static async updateReminder(ctx: Context) {
        try {
            const userId = ctx.get("user_id") as string;
            const reminderId = ctx.req.param("id");
            const body = await ctx.req.json();

            // Parse date if provided
            const updateData: {
                title?: string;
                note?: string;
                reminder_date?: Date;
                reminder_time?: string;
                frequency?: "one_time" | "daily" | "weekly";
                is_active?: boolean;
                is_am?: boolean;
            } = {
                title: body.title,
                note: body.note,
                reminder_time: body.reminder_time,
                frequency: body.frequency,
                is_active: body.is_active,
                is_am: body.is_am,
            };

            if (body.reminder_date) {
                const reminderDate = new Date(body.reminder_date);
                if (isNaN(reminderDate.getTime())) {
                    return ctx.json(
                        {
                            success: false,
                            message: "Invalid date format. Use YYYY-MM-DD",
                        },
                        400
                    );
                }
                updateData.reminder_date = reminderDate;
            }

            const updatedReminder = await ReminderService.updateReminder(reminderId, userId, updateData);

            return ctx.json({
                success: true,
                message: "Reminder updated successfully",
                data: updatedReminder,
            });
        } catch (error) {
            log(`Error updating reminder: ${error}`, LogTypes.ERROR, "ReminderController");
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to update reminder",
                },
                500
            );
        }
    }

    /**
     * Delete a reminder
     */
    public static async deleteReminder(ctx: Context) {
        try {
            const userId = ctx.get("user_id") as string;
            const reminderId = ctx.req.param("id");

            await ReminderService.deleteReminder(reminderId, userId);

            return ctx.json({
                success: true,
                message: "Reminder deleted successfully",
            });
        } catch (error) {
            log(`Error deleting reminder: ${error}`, LogTypes.ERROR, "ReminderController");
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to delete reminder",
                },
                500
            );
        }
    }

    /**
     * Get reminder statistics for the user
     */
    public static async getReminderStats(ctx: Context) {
        try {
            const userId = ctx.get("user_id") as string;

            const stats = await ReminderService.getReminderStats(userId);

            return ctx.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            log(`Error fetching reminder stats: ${error}`, LogTypes.ERROR, "ReminderController");
            return ctx.json(
                {
                    success: false,
                    message: "Failed to fetch reminder statistics",
                },
                500
            );
        }
    }

    /**
     * Process pending reminders (Admin/System endpoint)
     */
    public static async processPendingReminders(ctx: Context) {
        try {
            const userType = ctx.get("user_type") as string;

            // Only admins can manually trigger this
            if (userType !== "Admin" && userType !== "Super Admin") {
                return ctx.json(
                    {
                        success: false,
                        message: "Unauthorized. Admin access required.",
                    },
                    403
                );
            }

            const result = await ReminderService.processPendingReminders();

            return ctx.json({
                success: true,
                message: `Processed ${result.processed} pending reminders`,
                data: result,
            });
        } catch (error) {
            log(`Error processing pending reminders: ${error}`, LogTypes.ERROR, "ReminderController");
            return ctx.json(
                {
                    success: false,
                    message: "Failed to process pending reminders",
                },
                500
            );
        }
    }

    /**
     * Cleanup old reminders (Admin endpoint)
     */
    public static async cleanupOldReminders(ctx: Context) {
        try {
            const userType = ctx.get("user_type") as string;

            // Only admins can trigger cleanup
            if (userType !== "Admin" && userType !== "Super Admin") {
                return ctx.json(
                    {
                        success: false,
                        message: "Unauthorized. Admin access required.",
                    },
                    403
                );
            }

            const olderThanDays = parseInt(ctx.req.query("older_than_days") || "30");

            const result = await ReminderService.cleanupOldReminders(olderThanDays);

            return ctx.json({
                success: true,
                message: `Cleaned up ${result.cleaned} old reminders`,
                data: result,
            });
        } catch (error) {
            log(`Error cleaning up reminders: ${error}`, LogTypes.ERROR, "ReminderController");
            return ctx.json(
                {
                    success: false,
                    message: "Failed to cleanup old reminders",
                },
                500
            );
        }
    }
}
