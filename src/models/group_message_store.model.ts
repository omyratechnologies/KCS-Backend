import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IGroupMessageStore {
    id: string;
    campus_id: string;
    group_id: string;
    message: string;
    meta_data: object;
    is_seen: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const GroupMessageStoreSchema = new Schema({
    campus_id: { type: String, required: true },
    group_id: { type: String, required: true },
    message: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_seen: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

GroupMessageStoreSchema.index.findByCampusId = { by: "campus_id" };
GroupMessageStoreSchema.index.findByGroupId = { by: "group_id" };

const GroupMessageStore = ottoman.model<IGroupMessageStore>(
    "group_messages_store",
    GroupMessageStoreSchema
);

export { GroupMessageStore, type IGroupMessageStore };
