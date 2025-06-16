import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseQuizAttempt {
    id: string;
    campus_id: string;
    course_id: string;
    quiz_id: string;
    question_id: string;
    user_id: string;
    attempt_data: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const CourseQuizAttemptSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    quiz_id: { type: String, required: true },
    question_id: { type: String, required: true },
    user_id: { type: String, required: true },
    attempt_data: { type: String, required: true },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseQuizAttemptSchema.index.findByCampusId = { by: "campus_id" };
CourseQuizAttemptSchema.index.findByCourseId = { by: "course_id" };
CourseQuizAttemptSchema.index.findByQuizId = { by: "quiz_id" };
CourseQuizAttemptSchema.index.findByUserId = { by: "user_id" };
CourseQuizAttemptSchema.index.findByQuestionId = { by: "question_id" };
CourseQuizAttemptSchema.index.findByCampusIdAndCourseId = {
    by: ["campus_id", "course_id"],
};
CourseQuizAttemptSchema.index.findByCampusIdAndQuizId = {
    by: ["campus_id", "quiz_id"],
};
CourseQuizAttemptSchema.index.findByCampusIdAndUserId = {
    by: ["campus_id", "user_id"],
};
CourseQuizAttemptSchema.index.findByCampusIdAndQuestionId = {
    by: ["campus_id", "question_id"],
};

const CourseQuizAttempt = ottoman.model<ICourseQuizAttempt>(
    "course_quiz_attempt",
    CourseQuizAttemptSchema
);

export { CourseQuizAttempt, type ICourseQuizAttempt };
