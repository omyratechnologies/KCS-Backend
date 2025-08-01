import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseAssignmentData {
    id: string;
    campus_id: string;
    course_id: string;
    user_id: string; // instructor/teacher who created the assignment
    assignment_title: string;
    assignment_description: string;
    assignment_type: "quiz" | "homework" | "project" | "exam" | "discussion" | "presentation";
    due_date: Date;
    max_score?: number;
    is_graded: boolean;
    allow_late_submission: boolean;
    instructions?: string;
    attachment_urls?: string[];
    rubric?: object;
    estimated_duration_minutes?: number;
    priority: "low" | "medium" | "high";
    is_active: boolean;
    is_deleted: boolean;
    meta_data?: object;
    created_at: Date;
    updated_at: Date;
}

const CourseAssignmentSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    user_id: { type: String, required: true },
    assignment_title: { type: String, required: true },
    assignment_description: { type: String, required: true },
    assignment_type: { 
        type: String, 
        required: true,
        enum: ["quiz", "homework", "project", "exam", "discussion", "presentation"]
    },
    due_date: { type: Date, required: true },
    max_score: { type: Number, required: false },
    is_graded: { type: Boolean, required: true, default: true },
    allow_late_submission: { type: Boolean, required: true, default: false },
    instructions: { type: String, required: false },
    attachment_urls: { type: [String], required: false, default: [] },
    rubric: { type: Object, required: false },
    estimated_duration_minutes: { type: Number, required: false },
    priority: { 
        type: String, 
        required: true, 
        default: "medium",
        enum: ["low", "medium", "high"]
    },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    meta_data: { type: Object, required: false, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Create indexes for efficient querying
CourseAssignmentSchema.index.findByCampusId = { by: "campus_id" };
CourseAssignmentSchema.index.findByCourseId = { by: "course_id" };
CourseAssignmentSchema.index.findByUserId = { by: "user_id" };
CourseAssignmentSchema.index.findByDueDate = { by: "due_date" };
CourseAssignmentSchema.index.findByAssignmentType = { by: "assignment_type" };
CourseAssignmentSchema.index.findByPriority = { by: "priority" };
CourseAssignmentSchema.index.findActiveAssignments = { by: "is_active" };

const CourseAssignment = ottoman.model<ICourseAssignmentData>(
    "course_assignments",
    CourseAssignmentSchema
);

export { CourseAssignment, type ICourseAssignmentData };
