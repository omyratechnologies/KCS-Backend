import z from "zod";
import "zod-openapi/extend";

// Base schemas
export const errorResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: false }),
        message: z.string().openapi({ example: "Error message" }),
    })
    .openapi({ ref: "ReminderErrorResponse" });

// Reminder frequency enum
export const reminderFrequencyEnum = z.enum(["one_time", "daily", "weekly"]).openapi({
    example: "one_time",
    description: "Frequency of reminder: one_time, daily, or weekly",
});

// Reminder schema
export const reminderSchema = z
    .object({
        id: z.string().openapi({ example: "reminder_abc123" }),
        user_id: z.string().openapi({ example: "user_123" }),
        campus_id: z.string().openapi({ example: "campus_123" }),
        title: z.string().openapi({ example: "Submit Assignment" }),
        note: z.string().optional().openapi({ 
            example: "Remember to submit the math assignment before 5 PM" 
        }),
        reminder_date: z.string().openapi({ 
            example: "2025-02-15T00:00:00.000Z",
            description: "Date of the reminder in ISO format"
        }),
        reminder_time: z.string().openapi({ 
            example: "14:30",
            description: "Time in HH:mm format (24-hour)"
        }),
        reminder_datetime: z.string().openapi({ 
            example: "2025-02-15T14:30:00.000Z",
            description: "Combined date and time in ISO format"
        }),
        frequency: reminderFrequencyEnum,
        is_am: z.boolean().optional().openapi({ 
            example: false,
            description: "For UI display: true for AM, false for PM"
        }),
        is_active: z.boolean().openapi({ example: true }),
        is_sent: z.boolean().openapi({ example: false }),
        sent_at: z.string().optional().openapi({ 
            example: "2025-02-15T14:30:05.000Z" 
        }),
        notification_id: z.string().optional().openapi({ 
            example: "notif_xyz789" 
        }),
        created_at: z.string().openapi({ example: "2025-01-01T00:00:00.000Z" }),
        updated_at: z.string().openapi({ example: "2025-01-01T00:00:00.000Z" }),
    })
    .openapi({ ref: "Reminder" });

// Create reminder request
export const createReminderRequestSchema = z
    .object({
        title: z.string().min(1).max(200).openapi({ 
            example: "Submit Assignment",
            description: "Title of the reminder (1-200 characters)"
        }),
        note: z.string().max(1000).optional().openapi({ 
            example: "Remember to submit the math assignment before 5 PM",
            description: "Optional note/description (max 1000 characters)"
        }),
        reminder_date: z.string().openapi({ 
            example: "2025-02-15",
            description: "Date in YYYY-MM-DD format"
        }),
        reminder_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).openapi({ 
            example: "14:30",
            description: "Time in HH:mm format (24-hour, e.g., 14:30 for 2:30 PM)"
        }),
        frequency: reminderFrequencyEnum,
        is_am: z.boolean().optional().openapi({ 
            example: false,
            description: "For UI: true for AM time, false for PM time"
        }),
    })
    .openapi({ ref: "CreateReminderRequest" });

// Update reminder request
export const updateReminderRequestSchema = z
    .object({
        title: z.string().min(1).max(200).optional().openapi({ 
            example: "Updated Assignment Title" 
        }),
        note: z.string().max(1000).optional().openapi({ 
            example: "Updated note for the reminder" 
        }),
        reminder_date: z.string().optional().openapi({ 
            example: "2025-02-20",
            description: "Updated date in YYYY-MM-DD format"
        }),
        reminder_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().openapi({ 
            example: "15:00",
            description: "Updated time in HH:mm format (24-hour)"
        }),
        frequency: reminderFrequencyEnum.optional(),
        is_active: z.boolean().optional().openapi({ 
            example: true,
            description: "Set to false to deactivate the reminder"
        }),
        is_am: z.boolean().optional().openapi({ 
            example: true 
        }),
    })
    .openapi({ ref: "UpdateReminderRequest" });

// Reminder response schemas
export const createReminderResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: "Reminder created successfully" }),
        data: reminderSchema,
    })
    .openapi({ ref: "CreateReminderResponse" });

export const getReminderResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: reminderSchema,
    })
    .openapi({ ref: "GetReminderResponse" });

export const getRemindersResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.array(reminderSchema).openapi({
            description: "List of user's reminders"
        }),
        total: z.number().openapi({ example: 10 }),
    })
    .openapi({ ref: "GetRemindersResponse" });

export const updateReminderResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: "Reminder updated successfully" }),
        data: reminderSchema,
    })
    .openapi({ ref: "UpdateReminderResponse" });

export const deleteReminderResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: "Reminder deleted successfully" }),
    })
    .openapi({ ref: "DeleteReminderResponse" });

// Reminder statistics
export const reminderStatsSchema = z
    .object({
        total: z.number().openapi({ example: 15 }),
        active: z.number().openapi({ example: 10 }),
        pending: z.number().openapi({ example: 5 }),
        completed: z.number().openapi({ example: 5 }),
        by_frequency: z.object({
            one_time: z.number().openapi({ example: 8 }),
            daily: z.number().openapi({ example: 5 }),
            weekly: z.number().openapi({ example: 2 }),
        }),
    })
    .openapi({ ref: "ReminderStats" });

export const getReminderStatsResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: reminderStatsSchema,
    })
    .openapi({ ref: "GetReminderStatsResponse" });

// Process reminders response (Admin only)
export const processRemindersResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: "Processed 5 pending reminders" }),
        data: z.object({
            processed: z.number().openapi({ example: 5 }),
            successful: z.number().openapi({ example: 4 }),
            failed: z.number().openapi({ example: 1 }),
        }),
    })
    .openapi({ ref: "ProcessRemindersResponse" });

// Cleanup reminders response
export const cleanupRemindersResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: "Cleaned up 10 old reminders" }),
        data: z.object({
            cleaned: z.number().openapi({ example: 10 }),
        }),
    })
    .openapi({ ref: "CleanupRemindersResponse" });
