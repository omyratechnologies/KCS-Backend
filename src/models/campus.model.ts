import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICampus {
    id: string;
    name: string;
    address: string;
    domain: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CampusSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    domain: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CampusSchema.index.findByName = { by: "name" };

const Campus = ottoman.model<ICampus>("campus", CampusSchema);

export { Campus, type ICampus };
