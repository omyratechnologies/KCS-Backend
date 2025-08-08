import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IExamTimetableData {
    id: string;
    campus_id: string;
    exam_term_id: string;
    exam_name: string;
    class_ids: string[];
    start_date: Date;
    end_date: Date;
    subjects: Array<{
        subject_id: string;
        exam_date: Date;
        start_time: string;
        end_time: string;
        room?: string;
        invigilator_ids?: string[];
    }>;
    is_published: boolean;
    is_active: boolean;
    is_deleted: boolean;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const ExamTimetableSchema = new Schema({
    campus_id: { type: String, required: true },
    exam_term_id: { type: String, required: true },
    exam_name: { type: String, required: true },
    class_ids: { type: [String], required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    subjects: {
        type: [
            {
                subject_id: { type: String, required: true },
                exam_date: { type: Date, required: true },
                start_time: { type: String, required: true },
                end_time: { type: String, required: true },
                room: { type: String, required: false },
                invigilator_ids: { type: [String], required: false, default: [] },
            },
        ],
        required: true,
        default: [],
    },
    is_published: { type: Boolean, required: true, default: false },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    meta_data: { type: Object, required: false, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Create indexes for efficient querying
ExamTimetableSchema.index.findByCampusId = { by: "campus_id" };
ExamTimetableSchema.index.findByExamTermId = { by: "exam_term_id" };
ExamTimetableSchema.index.findByStartDate = { by: "start_date" };
ExamTimetableSchema.index.findByEndDate = { by: "end_date" };
ExamTimetableSchema.index.findByIsPublished = { by: "is_published" };
ExamTimetableSchema.index.findByCampusIdAndExamTermId = {
    by: ["campus_id", "exam_term_id"],
};
ExamTimetableSchema.index.findByCampusIdAndIsPublished = {
    by: ["campus_id", "is_published"],
};

const ExamTimetable = ottoman.model<IExamTimetableData>("exam_timetables", ExamTimetableSchema);

export { ExamTimetable, type IExamTimetableData };
