import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

// Enhanced Assignment Interface
export interface IEnhancedAssignmentData {
    id: string;
    campus_id: string;
    class_id?: string; // For class-based assignments
    course_id?: string; // For course-based assignments
    subject_id: string;
    user_id: string; // Teacher who created it
    title: string;
    description: string;
    instructions?: string;
    due_date: Date;
    max_score?: number;
    is_graded: boolean;
    allow_late_submission: boolean;
    attachment_urls?: string[];
    priority: "low" | "medium" | "high";
    assignment_type: "homework" | "project" | "quiz" | "exam" | "presentation";
    estimated_duration_minutes?: number;
    meta_data?: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

// Enhanced Assignment Submission Interface
export interface IEnhancedAssignmentSubmissionData {
    id: string;
    assignment_id: string;
    campus_id: string;
    user_id: string; // Student who submitted
    submission_date: Date;
    submission_content?: string;
    attachment_urls?: string[];
    grade?: number;
    feedback?: string;
    is_late: boolean;
    attempt_number: number;
    time_spent_minutes?: number;
    meta_data?: object;
    graded_by?: string; // Teacher who graded
    graded_date?: Date;
    created_at: Date;
    updated_at: Date;
}

// Enhanced Assignment Schema
const EnhancedAssignmentSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: false }, // Optional for course assignments
    course_id: { type: String, required: false }, // Optional for class assignments
    subject_id: { type: String, required: true },
    user_id: { type: String, required: true }, // Teacher who created
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructions: { type: String, required: false },
    due_date: { type: Date, required: true },
    max_score: { type: Number, required: false },
    is_graded: { type: Boolean, required: true, default: true },
    allow_late_submission: { type: Boolean, required: true, default: false },
    attachment_urls: { type: [String], required: false, default: [] },
    priority: { 
        type: String, 
        required: true, 
        default: "medium",
        enum: ["low", "medium", "high"]
    },
    assignment_type: { 
        type: String, 
        required: true, 
        default: "homework",
        enum: ["homework", "project", "quiz", "exam", "presentation"]
    },
    estimated_duration_minutes: { type: Number, required: false },
    meta_data: { type: Object, required: false, default: {} },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for Enhanced Assignment
EnhancedAssignmentSchema.index.findByCampusId = { by: "campus_id" };
EnhancedAssignmentSchema.index.findByClassId = { by: "class_id" };
EnhancedAssignmentSchema.index.findByCourseId = { by: "course_id" };
EnhancedAssignmentSchema.index.findBySubjectId = { by: "subject_id" };
EnhancedAssignmentSchema.index.findByUserId = { by: "user_id" };
EnhancedAssignmentSchema.index.findByDueDate = { by: "due_date" };
EnhancedAssignmentSchema.index.findByPriority = { by: "priority" };
EnhancedAssignmentSchema.index.findByType = { by: "assignment_type" };
EnhancedAssignmentSchema.index.findByStatus = { by: "is_active, is_deleted" };

// Enhanced Assignment Submission Schema
const EnhancedAssignmentSubmissionSchema = new Schema({
    assignment_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true }, // Student who submitted
    submission_date: { type: Date, required: true },
    submission_content: { type: String, required: false },
    attachment_urls: { type: [String], required: false, default: [] },
    grade: { type: Number, required: false },
    feedback: { type: String, required: false },
    is_late: { type: Boolean, required: true, default: false },
    attempt_number: { type: Number, required: true, default: 1 },
    time_spent_minutes: { type: Number, required: false },
    meta_data: { type: Object, required: false, default: {} },
    graded_by: { type: String, required: false }, // Teacher who graded
    graded_date: { type: Date, required: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for Enhanced Assignment Submission
EnhancedAssignmentSubmissionSchema.index.findByAssignmentId = { by: "assignment_id" };
EnhancedAssignmentSubmissionSchema.index.findByCampusId = { by: "campus_id" };
EnhancedAssignmentSubmissionSchema.index.findByUserId = { by: "user_id" };
EnhancedAssignmentSubmissionSchema.index.findByGradedBy = { by: "graded_by" };
EnhancedAssignmentSubmissionSchema.index.findBySubmissionDate = { by: "submission_date" };
EnhancedAssignmentSubmissionSchema.index.findByGradeStatus = { by: "grade" };
EnhancedAssignmentSubmissionSchema.index.findByLateStatus = { by: "is_late" };

// Models
const EnhancedAssignment = ottoman.model<IEnhancedAssignmentData>(
    "enhanced_assignments",
    EnhancedAssignmentSchema
);

const EnhancedAssignmentSubmission = ottoman.model<IEnhancedAssignmentSubmissionData>(
    "enhanced_assignment_submissions",
    EnhancedAssignmentSubmissionSchema
);

export { 
    EnhancedAssignment, 
    EnhancedAssignmentSubmission
};
