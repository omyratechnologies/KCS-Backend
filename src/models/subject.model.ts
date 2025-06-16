import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ISubject {
    id: string;
    campus_id: string;
    name: string;
    code: string;
    description: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const SubjectSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

SubjectSchema.index.findByCampusId = { by: "campus_id" };
SubjectSchema.index.findByCode = { by: "code" };
SubjectSchema.index.findByName = { by: "name" };
SubjectSchema.index.findByCampusIdAndCode = { by: ["campus_id", "code"] };

const Subject = ottoman.model<ISubject>("subject", SubjectSchema);

export { type ISubject, Subject };
