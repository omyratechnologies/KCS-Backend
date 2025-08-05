import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IClassNotificationData {
    id: string;
    campus_id: string;
    class_id: string;
    title: string;
    message: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const ClassNotificationSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ClassNotificationSchema.index.findByCampusId = { by: "campus_id" };
ClassNotificationSchema.index.findByClassId = { by: "class_id" };

const ClassNotification = ottoman.model<IClassNotificationData>("class_notifications", ClassNotificationSchema);

export { ClassNotification, type IClassNotificationData };
