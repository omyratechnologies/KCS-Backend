import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ITeacherNotificationData {
    id: string;
    campus_id: string;
    user_id: string;
    title: string;
    message: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    is_seen: boolean;
    created_at: Date;
    updated_at: Date;
}

const TeacherNotificationSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    is_seen: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

TeacherNotificationSchema.index.findByCampusId = { by: "campus_id" };
TeacherNotificationSchema.index.findByUserId = { by: "user_id" };

const TeacherNotification = ottoman.model<ITeacherNotificationData>(
    "teacher_notifications",
    TeacherNotificationSchema
);

export { type ITeacherNotificationData, TeacherNotification };
