import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IAssignmentSubmission {
    id: string;
    campus_id: string;
    assignment_id: string;
    user_id: string; // Student ID
    submission_date: Date;
    grade: number;
    feedback: string;
    meta_data: {
        status?: 'submitted' | 'graded' | 'late' | 'returned';
        submission_type?: 'text' | 'file' | 'link' | 'mixed';
        attachments?: Array<{
            file_name: string;
            file_url: string;
            file_type: string;
            file_size?: number;
        }>;
        submission_text?: string;
        submission_links?: string[];
        graded_at?: Date;
        graded_by?: string; // Teacher ID who graded
        late_penalty?: number;
        rubric_scores?: Array<{
            criterion: string;
            score: number;
            max_score: number;
            comments?: string;
        }>;
        plagiarism_check?: {
            checked: boolean;
            score?: number;
            report_url?: string;
        };
        [key: string]: any;
    };
    created_at: Date;
    updated_at: Date;
}

const AssignmentSubmissionSchema = new Schema({
    campus_id: { type: String, required: true },
    assignment_id: { type: String, required: true },
    user_id: { type: String, required: true },
    submission_date: { type: Date, required: true, default: () => new Date() },
    grade: { type: Number, required: false, default: 0 },
    feedback: { type: String, required: false, default: "" },
    meta_data: { 
        type: Object, 
        required: true, 
        default: () => ({ status: 'submitted' })
    },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Enhanced indexing for better query performance
AssignmentSubmissionSchema.index.findByCampusId = { by: "campus_id" };
AssignmentSubmissionSchema.index.findByAssignmentId = { by: "assignment_id" };
AssignmentSubmissionSchema.index.findByUserId = { by: "user_id" };
AssignmentSubmissionSchema.index.findByGrade = { by: "grade" };
AssignmentSubmissionSchema.index.findBySubmissionDate = { by: "submission_date" };
AssignmentSubmissionSchema.index.findByStatus = { by: "meta_data.status" };
AssignmentSubmissionSchema.index.findByCampusAndAssignment = { by: ["campus_id", "assignment_id"] };
AssignmentSubmissionSchema.index.findByAssignmentAndUser = { by: ["assignment_id", "user_id"] };

const AssignmentSubmission = ottoman.model<IAssignmentSubmission>(
    "assignment_submissions",
    AssignmentSubmissionSchema
);

export { AssignmentSubmission, type IAssignmentSubmission };
