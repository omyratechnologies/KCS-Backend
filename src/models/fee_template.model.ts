import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IFeeTemplate {
    id: string;
    campus_id: string;
    template_name: string;
    class_id: string;
    academic_year: string;
    fee_structure: {
        category_id: string;
        category_name: string;
        amount: number;
        is_mandatory: boolean;
        due_date: Date;
        late_fee_applicable: boolean;
    }[];
    total_amount: number;
    applicable_students: string[]; // student IDs, empty means all students in class
    validity_period: {
        start_date: Date;
        end_date: Date;
    };
    auto_generate: boolean; // automatically generate fees for applicable students
    is_active: boolean;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const FeeTemplateSchema = new Schema({
    campus_id: { type: String, required: true },
    template_name: { type: String, required: true },
    class_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    fee_structure: {
        type: [Object],
        required: true,
    },
    total_amount: { type: Number, required: true },
    applicable_students: { type: [String], required: true, default: [] },
    validity_period: {
        type: Object,
        required: true,
    },
    auto_generate: { type: Boolean, required: true, default: false },
    is_active: { type: Boolean, required: true, default: true },
    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

FeeTemplateSchema.index.findByCampusId = { by: "campus_id" };
FeeTemplateSchema.index.findByClassId = { by: "class_id" };
FeeTemplateSchema.index.findByAcademicYear = { by: "academic_year" };
FeeTemplateSchema.index.findByCampusIdAndClassId = {
    by: ["campus_id", "class_id"],
};
FeeTemplateSchema.index.findByCampusIdAndAcademicYear = {
    by: ["campus_id", "academic_year"],
};

const FeeTemplate = ottoman.model<IFeeTemplate>("fee_templates", FeeTemplateSchema);

export { FeeTemplate, type IFeeTemplate };
