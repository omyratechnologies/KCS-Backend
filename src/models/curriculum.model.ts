import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IChapter {
    id?: string; // Generated automatically
    name: string;
    chapter_number: number;
    brief_description?: string;
    link?: string;
    label_ids?: string[];
}

interface IUnit {
    id?: string; // Generated automatically
    name: string;
    unit_number: number;
    brief_description?: string;
    chapters: IChapter[];
}

interface ICurriculumData {
    id: string;
    campus_id: string;
    subject_id: string;
    units: IUnit[];
    created_by: string;
    updated_by: string;
    created_at: Date;
    updated_at: Date;
}

const ChapterSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    chapter_number: { type: Number, required: true },
    brief_description: { type: String },
    link: { type: String },
    label_ids: { type: [String], default: [] },
});

const UnitSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    unit_number: { type: Number, required: true },
    brief_description: { type: String },
    chapters: { type: [ChapterSchema], default: [] },
});

const CurriculumSchema = new Schema({
    campus_id: { type: String, required: true },
    subject_id: { type: String, required: true },
    units: { type: [UnitSchema], default: [] },
    created_by: { type: String, required: true },
    updated_by: { type: String, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CurriculumSchema.index.findByCampusId = { by: "campus_id" };
CurriculumSchema.index.findBySubjectId = { by: "subject_id" };
CurriculumSchema.index.findByCampusAndSubject = { by: ["campus_id", "subject_id"] };

const Curriculum = ottoman.model<ICurriculumData>("curriculum", CurriculumSchema);

export { Curriculum, type ICurriculumData, type IUnit, type IChapter };
