import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IExamTermData {
    id: string;
    campus_id: string;
    name: string;
    class_ids: string[];
    start_date: Date;
    end_date: Date;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const ExamTermSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    class_ids: { type: [String], required: true, default: [] },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ExamTermSchema.index.findByCampusId = { by: "campus_id" };
ExamTermSchema.index.findByName = { by: "name" };
ExamTermSchema.index.findByStartDate = { by: "start_date" };
ExamTermSchema.index.findByEndDate = { by: "end_date" };

const ExamTerm = ottoman.model<IExamTermData>("exam_term", ExamTermSchema);

export { ExamTerm, type IExamTermData };
