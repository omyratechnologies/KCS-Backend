import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseMaterialData {
    id: string;
    campus_id: string;
    course_id: string;
    chapter_id?: string;
    folder_id?: string;
    material_title: string;
    material_description: string;
    material_type: "video" | "pdf" | "audio" | "image" | "document" | "link" | "interactive";
    file_url?: string;
    file_size?: number;
    file_format?: string;
    upload_id?: string;
    material_content?: string; // For text content
    external_link?: string;
    duration?: number; // For video/audio in seconds
    is_downloadable: boolean;
    is_streamable: boolean;
    access_level: "free" | "premium" | "restricted";
    sort_order: number;
    material_meta_data: {
        thumbnail_url?: string;
        subtitles?: string[];
        quality_options?: string[];
        interactive_elements?: object;
        scorm_data?: object;
        created_by: string;
        tags?: string[];
    };
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseMaterialSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    chapter_id: { type: String, required: false },
    folder_id: { type: String, required: false },
    material_title: { type: String, required: true },
    material_description: { type: String, required: true },
    material_type: { type: String, required: true },
    file_url: { type: String, required: false },
    file_size: { type: Number, required: false },
    file_format: { type: String, required: false },
    upload_id: { type: String, required: false },
    material_content: { type: String, required: false },
    external_link: { type: String, required: false },
    duration: { type: Number, required: false },
    is_downloadable: { type: Boolean, required: true },
    is_streamable: { type: Boolean, required: true },
    access_level: { type: String, required: true },
    sort_order: { type: Number, required: true },
    material_meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseMaterialSchema.index.findByCampusId = { by: "campus_id" };
CourseMaterialSchema.index.findByCourseId = { by: "course_id" };
CourseMaterialSchema.index.findByChapterId = { by: "chapter_id" };
CourseMaterialSchema.index.findByFolderId = { by: "folder_id" };

const CourseMaterial = ottoman.model<ICourseMaterialData>(
    "course_materials",
    CourseMaterialSchema
);

export { CourseMaterial, type ICourseMaterialData };
