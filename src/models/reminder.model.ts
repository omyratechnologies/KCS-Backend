import { model, Schema } from "ottoman";

export interface IReminder {
    id: string;
    user_id: string;
    campus_id: string;
    title: string;
    note?: string;
    reminder_date: Date;
    reminder_time: string; // Format: "HH:mm" (24-hour format)
    reminder_datetime: Date; // Combined date and time for easy querying
    frequency: "one_time" | "daily" | "weekly";
    is_am?: boolean; // For UI display purposes
    is_active: boolean;
    is_sent: boolean;
    sent_at?: Date;
    notification_id?: string; // Reference to sent notification
    created_at: Date;
    updated_at: Date;
}

const reminderSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    user_id: {
        type: String,
        required: true,
        index: true,
    },
    campus_id: {
        type: String,
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 200,
    },
    note: {
        type: String,
        required: false,
        maxlength: 1000,
    },
    reminder_date: {
        type: Date,
        required: true,
        index: true,
    },
    reminder_time: {
        type: String,
        required: true,
        validate: {
            validator: (value: string) => {
                // Validate HH:mm format (24-hour)
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
            },
            message: "Time must be in HH:mm format (24-hour)",
        },
    },
    reminder_datetime: {
        type: Date,
        required: true,
        index: true,
    },
    frequency: {
        type: String,
        required: true,
        enum: ["one_time", "daily", "weekly"],
        default: "one_time",
    },
    is_am: {
        type: Boolean,
        required: false,
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true,
        index: true,
    },
    is_sent: {
        type: Boolean,
        required: true,
        default: false,
        index: true,
    },
    sent_at: {
        type: Date,
        required: false,
    },
    notification_id: {
        type: String,
        required: false,
    },
    created_at: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
    updated_at: {
        type: Date,
        required: true,
        default: () => new Date(),
    },
});

// Index for finding pending reminders
reminderSchema.index.findByDateTime = {
    by: "reminder_datetime",
    type: "refdoc",
};

// Index for finding user's active reminders
reminderSchema.index.findByUserActive = {
    by: ["user_id", "is_active"],
    type: "refdoc",
};

export const Reminder = model("Reminder", reminderSchema);
export default Reminder;
