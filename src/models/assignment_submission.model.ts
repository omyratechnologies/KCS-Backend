import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IAssignmentSubmission {
    id: string;
    campus_id: string;
    assignment_id: string;
    user_id: string;
    submission_date: Date;
    grade?: number; // Optional - for ungraded submissions
    feedback?: string; // Optional - for ungraded submissions
    meta_data?: object; // Optional - additional data
    created_at: Date;
    updated_at: Date;
}

const AssignmentSubmissionSchema = new Schema({
    campus_id: { type: String, required: true },
    assignment_id: { type: String, required: true },
    user_id: { type: String, required: true },
    submission_date: { type: Date, required: true },
    grade: { type: Number, required: false }, // Optional - will be set when graded
    feedback: { type: String, required: false }, // Optional - will be set when graded
    meta_data: { type: Object, required: false, default: {} }, // Optional with default
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

AssignmentSubmissionSchema.index.findByCampusId = { by: "campus_id" };
AssignmentSubmissionSchema.index.findByAssignmentId = { by: "assignment_id" };
AssignmentSubmissionSchema.index.findByUserId = { by: "user_id" };

const AssignmentSubmission = ottoman.model<IAssignmentSubmission>("assignment_submissions", AssignmentSubmissionSchema);

export { AssignmentSubmission, type IAssignmentSubmission };
