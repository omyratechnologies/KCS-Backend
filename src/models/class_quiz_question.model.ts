import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IClassQuizQuestion {
    id: string;
    campus_id: string;
    class_id: string;
    quiz_id: string;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const ClassQuizQuestionSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    quiz_id: { type: String, required: true },
    question_text: { type: String, required: true },
    question_type: { type: String, required: true },
    options: { type: [String], required: true },
    correct_answer: { type: String, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ClassQuizQuestionSchema.index.findByCampusId = { by: "campus_id" };
ClassQuizQuestionSchema.index.findByClassId = { by: "class_id" };
ClassQuizQuestionSchema.index.findByQuizId = { by: "quiz_id" };

const ClassQuizQuestion = ottoman.model<IClassQuizQuestion>("class_quiz_questions", ClassQuizQuestionSchema);

export { ClassQuizQuestion, type IClassQuizQuestion };
