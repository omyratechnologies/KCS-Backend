import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseChapterData {
    id: string;
    campus_id: string;
    course_id: string;
    chapter_title: string;
    chapter_description: string;
    chapter_number: number;
    parent_chapter_id?: string; // For nested chapters
    estimated_duration: number; // in minutes
    is_published: boolean;
    is_free: boolean;
    sort_order: number;
    chapter_meta_data: {
        difficulty_level?: "beginner" | "intermediate" | "advanced";
        prerequisites?: string[];
        learning_objectives?: string[];
        resources?: string[];
        tags?: string[];
    };
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseChapterSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    chapter_title: { type: String, required: true },
    chapter_description: { type: String, required: true },
    chapter_number: { type: Number, required: true },
    parent_chapter_id: { type: String, required: false },
    estimated_duration: { type: Number, required: true },
    is_published: { type: Boolean, required: true },
    is_free: { type: Boolean, required: true },
    sort_order: { type: Number, required: true },
    chapter_meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseChapterSchema.index.findByCampusId = { by: "campus_id" };
CourseChapterSchema.index.findByCourseId = { by: "course_id" };
CourseChapterSchema.index.findByParentChapterId = { by: "parent_chapter_id" };

const CourseChapter = ottoman.model<ICourseChapterData>(
    "course_chapters",
    CourseChapterSchema
);

export { CourseChapter, type ICourseChapterData };
