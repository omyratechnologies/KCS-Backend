import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IClassQuizAttempt {
    id: string;
    campus_id: string;
    class_id: string;
    quiz_id: string;
    question_id: string;
    user_id: string;
    attempt_data: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const ClassQuizAttemptSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    quiz_id: { type: String, required: true },
    question_id: { type: String, required: true },
    user_id: { type: String, required: true },
    attempt_data: { type: String, required: true },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ClassQuizAttemptSchema.index.findByCampusId = { by: "campus_id" };
ClassQuizAttemptSchema.index.findByClassId = { by: "class_id" };
ClassQuizAttemptSchema.index.findByQuizId = { by: "quiz_id" };
ClassQuizAttemptSchema.index.findByUserId = { by: "user_id" };
ClassQuizAttemptSchema.index.findByQuestionId = { by: "question_id" };
ClassQuizAttemptSchema.index.findByCampusIdAndClassId = {
    by: ["campus_id", "class_id"],
};
ClassQuizAttemptSchema.index.findByCampusIdAndQuizId = {
    by: ["campus_id", "quiz_id"],
};
ClassQuizAttemptSchema.index.findByCampusIdAndUserId = {
    by: ["campus_id", "user_id"],
};
ClassQuizAttemptSchema.index.findByCampusIdAndQuestionId = {
    by: ["campus_id", "question_id"],
};

const ClassQuizAttempt = ottoman.model<IClassQuizAttempt>("class_quiz_attempt", ClassQuizAttemptSchema);

export { ClassQuizAttempt, type IClassQuizAttempt };
