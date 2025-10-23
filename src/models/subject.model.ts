import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ISubjectMaterial {
    id: string;
    concept_title: string;
    status: string;
    description: string;
    title: string;
    size: string;
    upload_by: string;
    download_count: number;
    date: string;
    chapter: string;
    link: string;
    file_type: 'pdf' | 'video' | 'worksheet' | 'presentation';
    created_at: Date;
    updated_at: Date;
}

interface ISubjectTeacher {
    teacher_id: string;
    role: string;
    hours: number;
    days: string[];
    assigned_at: Date;
}

interface ISubject {
    id: string;
    campus_id: string;
    name: string;
    code: string;
    description: string;
    meta_data: {
        materials?: {
            pdfs: ISubjectMaterial[];
            videos: ISubjectMaterial[];
            worksheets: ISubjectMaterial[];
            presentations: ISubjectMaterial[];
        };
        teachers?: {
            [teacher_id: string]: ISubjectTeacher;
        };
        [key: string]: unknown;
    };
    is_active: boolean;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const SubjectSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String, required: true },
    meta_data: { 
        type: Object, 
        default: {
            materials: {
                pdfs: [],
                videos: [],
                worksheets: [],
                presentations: []
            },
            teachers: {}
        }
    },
    is_active: { type: Boolean, required: true },
    is_deleted: { type: Boolean, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

SubjectSchema.index.findByCampusId = { by: "campus_id" };
SubjectSchema.index.findByCode = { by: "code" };
SubjectSchema.index.findByName = { by: "name" };
SubjectSchema.index.findByCampusIdAndCode = { by: ["campus_id", "code"] };

const Subject = ottoman.model<ISubject>("subject", SubjectSchema);

export { type ISubject, type ISubjectMaterial, type ISubjectTeacher, Subject };
