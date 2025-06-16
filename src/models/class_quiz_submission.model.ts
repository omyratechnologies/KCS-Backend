import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IClassQuizSubmission {
    id: string;
    campus_id: string;
    class_id: string;
    quiz_id: string;
    user_id: string;
    submission_date: Date;
    score: number;
    feedback: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const ClassQuizSubmissionSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    quiz_id: { type: String, required: true },
    user_id: { type: String, required: true },
    submission_date: { type: Date, required: true },
    score: { type: Number, required: true },
    feedback: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ClassQuizSubmissionSchema.index.findByCampusId = { by: "campus_id" };
ClassQuizSubmissionSchema.index.findByClassId = { by: "class_id" };
ClassQuizSubmissionSchema.index.findByQuizId = { by: "quiz_id" };
ClassQuizSubmissionSchema.index.findByUserId = { by: "user_id" };

const ClassQuizSubmission = ottoman.model<IClassQuizSubmission>(
    "class_quiz_submissions",
    ClassQuizSubmissionSchema
);

export { ClassQuizSubmission, type IClassQuizSubmission };
