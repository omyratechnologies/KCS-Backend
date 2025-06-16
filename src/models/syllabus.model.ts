import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ISyllabusData {
    id: string;
    campus_id: string;
    subject_id: string;
    name: string;
    description: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const SyllabusSchema = new Schema({
    campus_id: { type: String, required: true },
    subject_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

SyllabusSchema.index.findByCampusId = { by: "campus_id" };
SyllabusSchema.index.findBySubjectId = { by: "subject_id" };
SyllabusSchema.index.findByCampusIdAndSubjectId = {
    by: ["campus_id", "subject_id"],
};
SyllabusSchema.index.findByName = { by: "name" };

const Syllabus = ottoman.model<ISyllabusData>("syllabus", SyllabusSchema);

export { type ISyllabusData, Syllabus };
