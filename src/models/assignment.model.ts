import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IAssignmentData {
    id: string;
    campus_id: string;
    subject_id: string;
    user_id: string; // Creator/teacher ID
    class_id: string;
    title: string;
    description: string;
    due_date: Date;
    is_graded: boolean;
    meta_data: {
        status?: 'draft' | 'published' | 'archived';
        priority?: 'low' | 'medium' | 'high';
        template_id?: string;
        parent_assignment_id?: string; // For bulk assignments
        max_grade?: number;
        attachments?: Array<{
            file_name: string;
            file_url: string;
            file_type: string;
        }>;
        submission_instructions?: string;
        auto_grade?: boolean;
        late_submission_penalty?: number;
        [key: string]: any;
    };
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
    is_graded: { type: Boolean, required: true, default: true },
    meta_data: { 
        type: Object, 
        required: true, 
        default: () => ({ status: 'published' })
    },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Enhanced indexing for better query performance
AssignmentSchema.index.findByCampusId = { by: "campus_id" };
AssignmentSchema.index.findBySubjectId = { by: "subject_id" };
AssignmentSchema.index.findByUserId = { by: "user_id" };
AssignmentSchema.index.findByClassId = { by: "class_id" };
AssignmentSchema.index.findByDueDate = { by: "due_date" };
AssignmentSchema.index.findByStatus = { by: "meta_data.status" };
AssignmentSchema.index.findByCampusAndClass = { by: ["campus_id", "class_id"] };
AssignmentSchema.index.findByCampusAndSubject = { by: ["campus_id", "subject_id"] };
AssignmentSchema.index.findByClassAndSubject = { by: ["class_id", "subject_id"] };

const Assignment = ottoman.model<IAssignmentData>(
    "assignments",
    AssignmentSchema
);

export { Assignment, type IAssignmentData };
