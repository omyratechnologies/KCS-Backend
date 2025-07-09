import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IClassQuiz {
    id: string;
    campus_id: string;
    class_id: string;
    created_by: string;
    quiz_name: string;
    quiz_description: string;
    quiz_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const ClassQuizSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    created_by: { type: String, required: true },
    quiz_name: { type: String, required: true },
    quiz_description: { type: String, required: true },
    quiz_meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ClassQuizSchema.index.findByCampusId = { by: "campus_id" };
ClassQuizSchema.index.findByClassId = { by: "class_id" };
ClassQuizSchema.index.findByCreatedBy = { by: "created_by" };

const ClassQuiz = ottoman.model<IClassQuiz>("class_quiz", ClassQuizSchema);

export { ClassQuiz, type IClassQuiz };
