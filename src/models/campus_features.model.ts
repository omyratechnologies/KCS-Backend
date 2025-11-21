import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface ICampusFeatures {
    id?: string;
    campus_id: string;
    features: {
        chat: boolean;
        meetings: boolean;
        payments: boolean;
        curriculum: boolean;
        subject_materials: boolean;
        student_parent_access: boolean; // For teachers only - controls if they can see student/parent info
    };
    updated_by: string; // User ID of super admin who made the change
    updated_at?: Date;
    created_at?: Date;
}

const CampusFeaturesSchema = new Schema({
    campus_id: { type: String, required: true },
    features: {
        chat: { type: Boolean, default: true },
        meetings: { type: Boolean, default: true },
        payments: { type: Boolean, default: true },
        curriculum: { type: Boolean, default: true },
        subject_materials: { type: Boolean, default: true },
        student_parent_access: { type: Boolean, default: true },
    },
    updated_by: { type: String, required: true },
    updated_at: { type: Date, default: () => new Date() },
    created_at: { type: Date, default: () => new Date() },
});

CampusFeaturesSchema.index.findByCampusId = { by: "campus_id", type: "n1ql" };

const CampusFeatures = ottoman.model<ICampusFeatures>("campus_features", CampusFeaturesSchema);

export { CampusFeatures };
