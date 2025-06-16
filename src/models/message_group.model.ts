import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IMessageGroup {
    id: string;
    campus_id: string;
    group_name: string;
    group_description: string;
    admin_user_id: string;
    members: string[];
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const MessageGroupSchema = new Schema({
    campus_id: { type: String, required: true },
    group_name: { type: String, required: true },
    group_description: { type: String, required: true },
    admin_user_id: { type: String, required: true },
    members: { type: [String], required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

MessageGroupSchema.index.findByCampusId = { by: "campus_id" };

const MessageGroup = ottoman.model<IMessageGroup>(
    "message_groups",
    MessageGroupSchema
);

export { type IMessageGroup, MessageGroup };
