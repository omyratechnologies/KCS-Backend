import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IClassQuizSession {
    id: string;
    campus_id: string;
    class_id: string;
    quiz_id: string;
    user_id: string;
    session_token: string;
    status: "not_started" | "in_progress" | "completed" | "expired" | "abandoned";
    started_at: Date | null;
    completed_at: Date | null;
    expires_at: Date | null;
    time_limit_minutes: number | null;
    remaining_time_seconds: number | null;
    last_activity_at: Date;
    answers_count: number;
    total_questions: number;
    current_question_index: number;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const ClassQuizSessionSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    quiz_id: { type: String, required: true },
    user_id: { type: String, required: true },
    session_token: { type: String, required: true },
    status: { 
        type: String, 
        required: true, 
        enum: ["not_started", "in_progress", "completed", "expired", "abandoned"] 
    },
    started_at: { type: Date, required: false },
    completed_at: { type: Date, required: false },
    expires_at: { type: Date, required: false },
    time_limit_minutes: { type: Number, required: false },
    remaining_time_seconds: { type: Number, required: false },
    last_activity_at: { type: Date, required: true },
    answers_count: { type: Number, required: true, default: 0 },
    total_questions: { type: Number, required: true },
    current_question_index: { type: Number, required: true, default: 0 },
    meta_data: { type: Object, required: true, default: {} },
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for efficient querying
ClassQuizSessionSchema.index.findByCampusId = { by: "campus_id" };
ClassQuizSessionSchema.index.findByClassId = { by: "class_id" };
ClassQuizSessionSchema.index.findByQuizId = { by: "quiz_id" };
ClassQuizSessionSchema.index.findByUserId = { by: "user_id" };
ClassQuizSessionSchema.index.findBySessionToken = { by: "session_token" };
ClassQuizSessionSchema.index.findByStatus = { by: "status" };
ClassQuizSessionSchema.index.findByUserAndQuiz = { by: ["user_id", "quiz_id"] };
ClassQuizSessionSchema.index.findByQuizAndStatus = { by: ["quiz_id", "status"] };

const ClassQuizSession = ottoman.model<IClassQuizSession>(
    "class_quiz_session",
    ClassQuizSessionSchema
);

export { ClassQuizSession, type IClassQuizSession };
