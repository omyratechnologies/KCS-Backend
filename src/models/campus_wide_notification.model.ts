import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICampusWideNotificationData {
    id: string;
    campus_id: string;
    title: string;
    message: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CampusWideNotificationSchema = new Schema({
    campus_id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CampusWideNotificationSchema.index.findByCampusId = { by: "campus_id" };

const CampusWideNotification = ottoman.model<ICampusWideNotificationData>(
    "campus_wide_notifications",
    CampusWideNotificationSchema
);

export { CampusWideNotification, type ICampusWideNotificationData };
