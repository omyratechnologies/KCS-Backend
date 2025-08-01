import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseAssignmentSubmissionData {
    id: string;
    campus_id: string;
    assignment_id: string; // Reference to CourseAssignment
    course_id: string;
    user_id: string; // Student who submitted
    submission_date: Date;
    submission_content?: string; // Text content of submission
    attachment_urls?: string[]; // Files uploaded with submission
    grade?: number; // Grade received (null if not yet graded)
    feedback?: string; // Teacher feedback
    is_late: boolean; // Whether submission was after due date
    attempt_number: number; // For multiple attempts
    time_spent_minutes?: number; // Time student spent on assignment
    submission_status: "submitted" | "draft" | "graded" | "returned";
    graded_by?: string; // User ID of grader
    graded_date?: Date; // When it was graded
    is_active: boolean;
    is_deleted: boolean;
    meta_data?: object; // Additional submission data
    created_at: Date;
    updated_at: Date;
}

const CourseAssignmentSubmissionSchema = new Schema({
    campus_id: { type: String, required: true },
    assignment_id: { type: String, required: true },
    course_id: { type: String, required: true },
    user_id: { type: String, required: true },
    submission_date: { type: Date, required: true },
    submission_content: { type: String, required: false },
    attachment_urls: { type: [String], required: false, default: [] },
    grade: { type: Number, required: false }, // null until graded
    feedback: { type: String, required: false },
    is_late: { type: Boolean, required: true, default: false },
    attempt_number: { type: Number, required: true, default: 1 },
    time_spent_minutes: { type: Number, required: false },
    submission_status: { 
        type: String, 
        required: true, 
        default: "submitted",
        enum: ["submitted", "draft", "graded", "returned"]
    },
    graded_by: { type: String, required: false },
    graded_date: { type: Date, required: false },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    meta_data: { type: Object, required: false, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Create indexes for efficient querying
CourseAssignmentSubmissionSchema.index.findByCampusId = { by: "campus_id" };
CourseAssignmentSubmissionSchema.index.findByAssignmentId = { by: "assignment_id" };
CourseAssignmentSubmissionSchema.index.findByCourseId = { by: "course_id" };
CourseAssignmentSubmissionSchema.index.findByUserId = { by: "user_id" };
CourseAssignmentSubmissionSchema.index.findBySubmissionDate = { by: "submission_date" };
CourseAssignmentSubmissionSchema.index.findBySubmissionStatus = { by: "submission_status" };
CourseAssignmentSubmissionSchema.index.findByGradedBy = { by: "graded_by" };

const CourseAssignmentSubmission = ottoman.model<ICourseAssignmentSubmissionData>(
    "course_assignment_submissions",
    CourseAssignmentSubmissionSchema
);

export { CourseAssignmentSubmission, type ICourseAssignmentSubmissionData };
