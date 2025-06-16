import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseEnrollmentData {
    id: string;
    campus_id: string;
    course_id: string;
    user_id: string;
    enrollment_date: Date;
    completion_date: Date;
    is_completed: boolean;
    is_graded: boolean;
    grade_data: {
        assignment_id: string;
        grade: number;
    }[];
    overall_grade: number;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const CourseEnrollmentSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    user_id: { type: String, required: true },
    enrollment_date: { type: Date, required: true },
    completion_date: { type: Date, required: true },
    is_completed: { type: Boolean, required: true },
    is_graded: { type: Boolean, required: true },
    grade_data: { type: [Object], required: true },
    overall_grade: { type: Number, required: true },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseEnrollmentSchema.index.findByCampusId = { by: "campus_id" };
CourseEnrollmentSchema.index.findByCourseId = { by: "course_id" };

const CourseEnrollment = ottoman.model<ICourseEnrollmentData>(
    "course_enrollment",
    CourseEnrollmentSchema
);

export { CourseEnrollment, type ICourseEnrollmentData };
