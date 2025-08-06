import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IExaminationData {
    id: string;
    campus_id: string;
    subject_id: string;
    date: Date;
    start_time: Date;
    end_time: Date;
    exam_term_id: string;
    created_at: Date;
    updated_at: Date;
}

const ExaminationSchema = new Schema({
    campus_id: { type: String, required: true },
    subject_id: { type: String, required: true },
    date: { type: Date, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    exam_term_id: { type: String, required: true },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ExaminationSchema.index.findByCampusId = { by: "campus_id" };
ExaminationSchema.index.findByStartDate = { by: "start_date" };
ExaminationSchema.index.findByEndDate = { by: "end_date" };
ExaminationSchema.index.findBySubjectId = { by: "subject_id" };
ExaminationSchema.index.findByExamTermId = { by: "exam_term_id" };

const Examination = ottoman.model<IExaminationData>("examination", ExaminationSchema);

export { Examination, type IExaminationData };
