import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IClassSubjectData {
    id: string;
    campus_id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    academic_year: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const ClassSubjectSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    subject_id: { type: String, required: true },
    teacher_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ClassSubjectSchema.index.findByCampusId = { by: "campus_id" };
ClassSubjectSchema.index.findByClassId = { by: "class_id" };
ClassSubjectSchema.index.findBySubjectId = { by: "subject_id" };
ClassSubjectSchema.index.findByCampusIdAndClassId = {
    by: ["campus_id", "class_id"],
};
ClassSubjectSchema.index.findByCampusIdAndSubjectId = {
    by: ["campus_id", "subject_id"],
};
ClassSubjectSchema.index.findByClassIdAndSubjectId = {
    by: ["class_id", "subject_id"],
};

const ClassSubject = ottoman.model<IClassSubjectData>("class_subject", ClassSubjectSchema);

export { ClassSubject, type IClassSubjectData };
