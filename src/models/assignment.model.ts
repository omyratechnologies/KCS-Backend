import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IAssignmentData {
    id: string;
    campus_id: string;
    subject_id: string;
    user_id: string;
    class_id: string;
    title: string;
    description: string;
    due_date: Date;
    is_graded: boolean;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const AssignmentSchema = new Schema({
    campus_id: { type: String, required: true },
    subject_id: { type: String, required: true },
    user_id: { type: String, required: true },
    class_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    due_date: { type: Date, required: true },
    is_graded: { type: Boolean, required: true },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

AssignmentSchema.index.findByCampusId = { by: "campus_id" };
AssignmentSchema.index.findBySubjectId = { by: "subject_id" };
AssignmentSchema.index.findByUserId = { by: "user_id" };
AssignmentSchema.index.findByClassId = { by: "class_id" };

const Assignment = ottoman.model<IAssignmentData>(
    "assignments",
    AssignmentSchema
);

export { Assignment, type IAssignmentData };
