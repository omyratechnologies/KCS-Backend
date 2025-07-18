import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ICourseFolderData {
    id: string;
    campus_id: string;
    course_id: string;
    folder_name: string;
    folder_description?: string;
    parent_folder_id?: string;
    folder_path: string;
    folder_type: "materials" | "assignments" | "resources" | "media" | "custom";
    access_level: "public" | "enrolled" | "premium" | "restricted";
    sort_order: number;
    permissions: {
        can_upload: string[]; // role names
        can_download: string[];
        can_delete: string[];
        can_modify: string[];
    };
    folder_meta_data: {
        color?: string;
        icon?: string;
        tags?: string[];
        created_by: string;
        size_limit?: number; // in bytes
        file_types_allowed?: string[];
    };
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const CourseFolderSchema = new Schema({
    campus_id: { type: String, required: true },
    course_id: { type: String, required: true },
    folder_name: { type: String, required: true },
    folder_description: { type: String, required: false },
    parent_folder_id: { type: String, required: false },
    folder_path: { type: String, required: true },
    folder_type: { type: String, required: true },
    access_level: { type: String, required: true },
    sort_order: { type: Number, required: true },
    permissions: { type: Object, required: true },
    folder_meta_data: { type: Object, required: true },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

CourseFolderSchema.index.findByCampusId = { by: "campus_id" };
CourseFolderSchema.index.findByCourseId = { by: "course_id" };
CourseFolderSchema.index.findByParentFolderId = { by: "parent_folder_id" };

const CourseFolder = ottoman.model<ICourseFolderData>(
    "course_folders",
    CourseFolderSchema
);

export { CourseFolder, type ICourseFolderData };
