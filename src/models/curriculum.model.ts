import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICurriculumData {
    id: string;
    campus_id: string;
    name: string;
    description: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CurriculumSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CurriculumSchema.index.findByCampusId = { by: "campus_id" };

const Curriculum = ottoman.model<ICurriculumData>(
    "curriculum",
    CurriculumSchema
);

export { Curriculum, type ICurriculumData };
