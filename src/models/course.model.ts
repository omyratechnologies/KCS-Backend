import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseData {
    id: string;
    campus_id: string;
    course_name: string;
    course_code: string;
    course_description: string;
    course_meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseSchema = new Schema({
    campus_id: { type: String, required: true },
    course_name: { type: String, required: true },
    course_code: { type: String, required: true },
    course_description: { type: String, required: true },
    course_meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseSchema.index.findByCampusId = { by: "campus_id" };
CourseSchema.index.findByCourseCode = { by: "course_code" };

const Course = ottoman.model<ICourseData>("courses", CourseSchema);

export { Course, type ICourseData };
