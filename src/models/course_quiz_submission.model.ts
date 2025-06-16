import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseQuizSubmission {
    id: string;
    campus_id: string;
    course_id: string;
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

const CourseQuizSubmissionSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
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

CourseQuizSubmissionSchema.index.findByCampusId = { by: "campus_id" };
CourseQuizSubmissionSchema.index.findByCourseId = { by: "course_id" };
CourseQuizSubmissionSchema.index.findByQuizId = { by: "quiz_id" };
CourseQuizSubmissionSchema.index.findByUserId = { by: "user_id" };

const CourseQuizSubmission = ottoman.model<ICourseQuizSubmission>(
    "course_quiz_submissions",
    CourseQuizSubmissionSchema
);

export { CourseQuizSubmission, type ICourseQuizSubmission };
