import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface ICourseSectionData {
    id: string;
    course_id: string;
    campus_id: string;
    title: string;
    description?: string;
    section_order: number;
    is_preview: boolean; // Can be viewed without enrollment
    estimated_duration_minutes: number;
    is_published: boolean;
    meta_data: {
        learning_objectives?: string[];
        section_notes?: string;
        required_resources?: string[];
        completion_criteria?: string;
    };
    created_at: Date;
    updated_at: Date;
}

const CourseSectionSchema = new Schema({
    course_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    section_order: { type: Number, required: true },
    is_preview: { type: Boolean, default: false },
    estimated_duration_minutes: { type: Number, default: 0 },
    is_published: { type: Boolean, default: true },
    meta_data: { type: Object, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseSectionSchema.index.findByCourseId = { by: "course_id" };
CourseSectionSchema.index.findByCampusId = { by: "campus_id" };
CourseSectionSchema.index.findByOrder = { by: "section_order" };

const CourseSection = ottoman.model<ICourseSectionData>(
    "course_sections",
    CourseSectionSchema
);

export { CourseSection };
