import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IClassData {
    id: string;
    campus_id: string;
    name: string;
    class_teacher_id: string;
    student_ids: string[];
    student_count: number;
    academic_year: string;
    teacher_ids: string[];
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const ClassSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    class_teacher_id: { type: String, required: false },
    student_ids: { type: [String], required: false },
    student_count: { type: Number, required: false },
    academic_year: { type: String, required: true },
    teacher_ids: { type: [String], required: false },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ClassSchema.index.findByCampusId = { by: "campus_id" };
ClassSchema.index.findByAcademicYear = { by: "academic_year" };
ClassSchema.index.findByClassTeacherId = { by: "class_teacher_id" };

const Class = ottoman.model<IClassData>("class", ClassSchema);

export { Class, type IClassData };
