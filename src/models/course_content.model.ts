import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseContentData {
    id: string;
    campus_id: string;
    course_id: string;
    content_type: string;
    data: object;
    meta_data: object;
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseContentSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    content_type: { type: String, required: true },
    data: { type: Object, required: true },
    meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseContentSchema.index.findByCampusId = { by: "campus_id" };
CourseContentSchema.index.findByCourseId = { by: "course_id" };

const CourseContent = ottoman.model<ICourseContentData>(
    "course_content",
    CourseContentSchema
);

export { CourseContent, type ICourseContentData };
