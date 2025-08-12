import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ITeacherData {
    id: string;
    campus_id: string;
    user_id: string;
    subjects: string[];
    classes: string[];
    meta_data: {
        rating?: number;
        degree?: string;
        experience_years?: number;
        specialization?: string[];
        [key: string]: unknown;
    };
    created_at: Date;
    updated_at: Date;
}

const TeacherSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    subjects: { type: [String], required: false },
    classes: { type: [String], required: false },
    meta_data: { 
        type: Object, 
        default: {
            rating: 0.0,
            degree: "",
            experience_years: 0,
            specialization: []
        }
    },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

TeacherSchema.index.findByCampusId = { by: "campus_id" };
TeacherSchema.index.findByUserId = { by: "user_id" };

const Teacher = ottoman.model<ITeacherData>("teachers", TeacherSchema);

export { type ITeacherData, Teacher };
