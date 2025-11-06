import { Reminder, IReminder } from "@/models/reminder.model";
import { PushNotificationService } from "./push_notification.service";
import log, { LogTypes } from "@/libs/logger";
import { nanoid } from "napi-nanoid";

export interface CreateReminderPayload {
    user_id: string;
    campus_id: string;
    title: string;
    note?: string;
    reminder_date: Date;
    reminder_time: string; // HH:mm format
    frequency: "one_time" | "daily" | "weekly";
    is_am?: boolean;
}

export interface UpdateReminderPayload {
    title?: string;
    note?: string;
    reminder_date?: Date;
    reminder_time?: string;
    frequency?: "one_time" | "daily" | "weekly";
    is_active?: boolean;
    is_am?: boolean;
}

export class ReminderService {
    /**
     * Create a new reminder
     */
    public static async createReminder(payload: CreateReminderPayload): Promise<IReminder> {
        try {
            // Combine date and time to create datetime
            const reminderDatetime = this.combineDateTime(payload.reminder_date, payload.reminder_time);

            // Validate that reminder is in the future
            if (reminderDatetime <= new Date()) {
                throw new Error("Reminder time must be in the future");
            }

            const reminderId = `reminder_${nanoid()}`;

            const reminder = await Reminder.create({
                id: reminderId,
                user_id: payload.user_id,
                campus_id: payload.campus_id,
                title: payload.title,
                note: payload.note || "",
                reminder_date: payload.reminder_date,
                reminder_time: payload.reminder_time,
                reminder_datetime: reminderDatetime,
                frequency: payload.frequency,
                is_am: payload.is_am,
                is_active: true,
                is_sent: false,
                created_at: new Date(),
                updated_at: new Date(),
            });

            log(`Reminder created: ${reminderId} for user ${payload.user_id}`, LogTypes.LOGS, "ReminderService");

            return reminder;
        } catch (error) {
            log(`Error creating reminder: ${error}`, LogTypes.ERROR, "ReminderService");
            throw error;
        }
    }

    /**
     * Get reminder by ID
     */
    public static async getReminderById(reminderId: string, userId: string): Promise<IReminder | null> {
        try {
            const reminder = await Reminder.findById(reminderId);
            
            if (!reminder) {
                return null;
            }

            // Ensure user can only access their own reminders
            if (reminder.user_id !== userId) {
                throw new Error("Unauthorized access to reminder");
            }

            return reminder;
        } catch (error) {
            log(`Error fetching reminder ${reminderId}: ${error}`, LogTypes.ERROR, "ReminderService");
            throw error;
        }
    }

    /**
     * Get all reminders for a user
     */
    public static async getUserReminders(
        userId: string,
        filters?: {
            is_active?: boolean;
            frequency?: "one_time" | "daily" | "weekly";
            from_date?: Date;
            to_date?: Date;
        }
    ): Promise<IReminder[]> {
        try {
            const query: Record<string, unknown> = {
                user_id: userId,
            };

            if (filters?.is_active !== undefined) {
                query.is_active = filters.is_active;
            }

            if (filters?.frequency) {
                query.frequency = filters.frequency;
            }

            if (filters?.from_date && filters?.to_date) {
                query.reminder_datetime = {
                    $gte: filters.from_date,
                    $lte: filters.to_date,
                };
            } else if (filters?.from_date) {
                query.reminder_datetime = { $gte: filters.from_date };
            } else if (filters?.to_date) {
                query.reminder_datetime = { $lte: filters.to_date };
            }

            const result = await Reminder.find(query);

            return result.rows || [];
        } catch (error) {
            log(`Error fetching reminders for user ${userId}: ${error}`, LogTypes.ERROR, "ReminderService");
            return [];
        }
    }

    /**
     * Update reminder
     */
    public static async updateReminder(
        reminderId: string,
        userId: string,
        payload: UpdateReminderPayload
    ): Promise<IReminder> {
        try {
            // First verify the reminder belongs to the user
            const existingReminder = await this.getReminderById(reminderId, userId);
            
            if (!existingReminder) {
                throw new Error("Reminder not found");
            }

            const updateData: Partial<IReminder> = {
                updated_at: new Date(),
            };

            if (payload.title !== undefined) {
                updateData.title = payload.title;
            }

            if (payload.note !== undefined) {
                updateData.note = payload.note;
            }

            if (payload.frequency !== undefined) {
                updateData.frequency = payload.frequency;
            }

            if (payload.is_active !== undefined) {
                updateData.is_active = payload.is_active;
            }

            if (payload.is_am !== undefined) {
                updateData.is_am = payload.is_am;
            }

            // If date or time is updated, recalculate datetime
            if (payload.reminder_date || payload.reminder_time) {
                const newDate = payload.reminder_date || existingReminder.reminder_date;
                const newTime = payload.reminder_time || existingReminder.reminder_time;
                
                const newDatetime = this.combineDateTime(newDate, newTime);

                // Validate that new reminder is in the future
                if (newDatetime <= new Date()) {
                    throw new Error("Reminder time must be in the future");
                }

                updateData.reminder_date = newDate;
                updateData.reminder_time = newTime;
                updateData.reminder_datetime = newDatetime;
                
                // Reset sent status if datetime changed
                updateData.is_sent = false;
                updateData.sent_at = undefined;
            }

            await Reminder.updateById(reminderId, updateData);

            const updatedReminder = await Reminder.findById(reminderId);

            log(`Reminder updated: ${reminderId}`, LogTypes.LOGS, "ReminderService");

            return updatedReminder;
        } catch (error) {
            log(`Error updating reminder ${reminderId}: ${error}`, LogTypes.ERROR, "ReminderService");
            throw error;
        }
    }

    /**
     * Delete reminder (soft delete by deactivating)
     */
    public static async deleteReminder(reminderId: string, userId: string): Promise<void> {
        try {
            // Verify ownership
            const reminder = await this.getReminderById(reminderId, userId);
            
            if (!reminder) {
                throw new Error("Reminder not found");
            }

            await Reminder.updateById(reminderId, {
                is_active: false,
                updated_at: new Date(),
            });

            log(`Reminder deleted: ${reminderId}`, LogTypes.LOGS, "ReminderService");
        } catch (error) {
            log(`Error deleting reminder ${reminderId}: ${error}`, LogTypes.ERROR, "ReminderService");
            throw error;
        }
    }

    /**
     * Get pending reminders that need to be sent
     */
    public static async getPendingReminders(): Promise<IReminder[]> {
        try {
            const now = new Date();
            const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

            const result = await Reminder.find({
                is_active: true,
                is_sent: false,
                reminder_datetime: {
                    $gte: now,
                    $lte: fiveMinutesFromNow,
                },
            });

            return result.rows || [];
        } catch (error) {
            log(`Error fetching pending reminders: ${error}`, LogTypes.ERROR, "ReminderService");
            return [];
        }
    }

    /**
     * Send reminder notification
     */
    public static async sendReminderNotification(reminder: IReminder): Promise<void> {
        try {
            log(`Sending reminder notification: ${reminder.id}`, LogTypes.LOGS, "ReminderService");

            // Send push notification
            const result = await PushNotificationService.sendToSpecificUsers({
                title: `🔔 Reminder: ${reminder.title}`,
                message: reminder.note || "Your scheduled reminder",
                data: {
                    reminder_id: reminder.id,
                    type: "reminder",
                    frequency: reminder.frequency,
                },
                notification_type: "student",
                campus_id: reminder.campus_id,
                target_users: [reminder.user_id],
            });

            if (result.success) {
                // Mark as sent for one-time reminders
                if (reminder.frequency === "one_time") {
                    await Reminder.updateById(reminder.id, {
                        is_sent: true,
                        sent_at: new Date(),
                        updated_at: new Date(),
                    });
                } else {
                    // For recurring reminders, schedule the next occurrence
                    await this.scheduleNextOccurrence(reminder);
                }

                log(
                    `Reminder notification sent successfully: ${reminder.id}`,
                    LogTypes.LOGS,
                    "ReminderService"
                );
            } else {
                log(
                    `Failed to send reminder notification: ${reminder.id} - ${result.details.errors.join(", ")}`,
                    LogTypes.ERROR,
                    "ReminderService"
                );
            }
        } catch (error) {
            log(`Error sending reminder notification ${reminder.id}: ${error}`, LogTypes.ERROR, "ReminderService");
        }
    }

    /**
     * Schedule next occurrence for recurring reminders
     */
    private static async scheduleNextOccurrence(reminder: IReminder): Promise<void> {
        try {
            const currentDatetime = new Date(reminder.reminder_datetime);
            let nextDatetime: Date;

            if (reminder.frequency === "daily") {
                // Add 1 day
                nextDatetime = new Date(currentDatetime.getTime() + 24 * 60 * 60 * 1000);
            } else if (reminder.frequency === "weekly") {
                // Add 7 days
                nextDatetime = new Date(currentDatetime.getTime() + 7 * 24 * 60 * 60 * 1000);
            } else {
                // One-time reminder, don't reschedule
                return;
            }

            await Reminder.updateById(reminder.id, {
                reminder_date: nextDatetime,
                reminder_datetime: nextDatetime,
                is_sent: false,
                sent_at: undefined,
                updated_at: new Date(),
            });

            log(
                `Next occurrence scheduled for reminder ${reminder.id}: ${nextDatetime.toISOString()}`,
                LogTypes.LOGS,
                "ReminderService"
            );
        } catch (error) {
            log(`Error scheduling next occurrence for ${reminder.id}: ${error}`, LogTypes.ERROR, "ReminderService");
        }
    }

    /**
     * Process all pending reminders (called by scheduler)
     */
    public static async processPendingReminders(): Promise<{
        processed: number;
        successful: number;
        failed: number;
    }> {
        try {
            const pendingReminders = await this.getPendingReminders();
            
            let successful = 0;
            let failed = 0;

            for (const reminder of pendingReminders) {
                try {
                    await this.sendReminderNotification(reminder);
                    successful++;
                } catch {
                    failed++;
                }
            }

            log(
                `Processed ${pendingReminders.length} reminders - Success: ${successful}, Failed: ${failed}`,
                LogTypes.LOGS,
                "ReminderService"
            );

            return {
                processed: pendingReminders.length,
                successful,
                failed,
            };
        } catch (error) {
            log(`Error processing pending reminders: ${error}`, LogTypes.ERROR, "ReminderService");
            return {
                processed: 0,
                successful: 0,
                failed: 0,
            };
        }
    }

    /**
     * Get reminder statistics for a user
     */
    public static async getReminderStats(userId: string): Promise<{
        total: number;
        active: number;
        pending: number;
        completed: number;
        by_frequency: {
            one_time: number;
            daily: number;
            weekly: number;
        };
    }> {
        try {
            const allReminders = await Reminder.find({ user_id: userId });
            const reminders = allReminders.rows || [];

            const now = new Date();

            const stats = {
                total: reminders.length,
                active: reminders.filter(r => r.is_active).length,
                pending: reminders.filter(r => r.is_active && !r.is_sent && r.reminder_datetime > now).length,
                completed: reminders.filter(r => r.is_sent).length,
                by_frequency: {
                    one_time: reminders.filter(r => r.frequency === "one_time").length,
                    daily: reminders.filter(r => r.frequency === "daily").length,
                    weekly: reminders.filter(r => r.frequency === "weekly").length,
                },
            };

            return stats;
        } catch (error) {
            log(`Error getting reminder stats for user ${userId}: ${error}`, LogTypes.ERROR, "ReminderService");
            throw error;
        }
    }

    /**
     * Helper: Combine date and time strings into a Date object
     */
    private static combineDateTime(date: Date, time: string): Date {
        const [hours, minutes] = time.split(":").map(Number);
        const datetime = new Date(date);
        datetime.setHours(hours, minutes, 0, 0);
        return datetime;
    }

    /**
     * Clean up old completed one-time reminders
     */
    public static async cleanupOldReminders(olderThanDays: number = 30): Promise<{ cleaned: number }> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

            const result = await Reminder.updateMany(
                {
                    frequency: "one_time",
                    is_sent: true,
                    sent_at: { $lt: cutoffDate },
                },
                {
                    is_active: false,
                    updated_at: new Date(),
                }
            );

            const cleaned = (result as { modifiedCount?: number }).modifiedCount || 0;

            log(`Cleaned up ${cleaned} old reminders`, LogTypes.LOGS, "ReminderService");

            return { cleaned };
        } catch (error) {
            log(`Error cleaning up old reminders: ${error}`, LogTypes.ERROR, "ReminderService");
            return { cleaned: 0 };
        }
    }
}
