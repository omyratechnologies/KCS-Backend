import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseQuiz {
    id: string;
    campus_id: string;
    course_id: string;
    quiz_name: string;
    quiz_description: string;
    quiz_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseQuizSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    quiz_name: { type: String, required: true },
    quiz_description: { type: String, required: true },
    quiz_meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseQuizSchema.index.findByCampusId = { by: "campus_id" };
CourseQuizSchema.index.findByCourseId = { by: "course_id" };
CourseQuizSchema.index.findByQuizName = { by: "quiz_name" };

const CourseQuiz = ottoman.model<ICourseQuiz>("course_quiz", CourseQuizSchema);

export { CourseQuiz, type ICourseQuiz };
