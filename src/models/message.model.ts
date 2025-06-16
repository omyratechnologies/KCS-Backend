import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IMessage {
    id: string;
    campus_id: string;
    from_user_id: string;
    to_user_id: string;
    message: string;
    meta_data: object;
    is_seen: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const MessageSchema = new Schema({
    campus_id: { type: String, required: true },
    from_user_id: { type: String, required: true },
    to_user_id: { type: String, required: true },
    message: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_seen: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

MessageSchema.index.findByCampusId = { by: "campus_id" };
MessageSchema.index.findByFromUserId = { by: "from_user_id" };
MessageSchema.index.findByToUserId = { by: "to_user_id" };

const Message = ottoman.model<IMessage>("messages", MessageSchema);

export { type IMessage, Message };
