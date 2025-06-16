import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IStudentRecordData {
    id: string;
    campus_id: string;
    student_id: string;
    record_data: {
        exam_term_id: string;
        marks: {
            subject_id: string;
            mark_gained: number;
            total_marks: number;
            grade: string;
            examination_id: string;
        }[];
    }[];
    created_at: Date;
    updated_at: Date;
}

const StudentRecordSchema = new Schema({
    campus_id: { type: String, required: true },
    student_id: { type: String, required: true },
    record_data: { type: [Object], required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

StudentRecordSchema.index.findByCampusId = { by: "campus_id" };
StudentRecordSchema.index.findByStudentId = { by: "student_id" };

const StudentRecord = ottoman.model<IStudentRecordData>(
    "student_records",
    StudentRecordSchema
);

export { type IStudentRecordData, StudentRecord };
