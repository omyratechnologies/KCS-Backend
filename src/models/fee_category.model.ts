import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IFeeCategory {
    id: string;
    campus_id: string;
    category_name: string;
    category_code: string;
    description: string;
    is_mandatory: boolean;
    applicable_classes: string[]; // class IDs
    academic_year: string;
    frequency: string; // monthly, quarterly, annually, one-time
    due_date_config: {
        type: string; // fixed_date, days_from_start, custom
        value: string | number; // date string or number of days
    };
    late_fee_config: {
        enabled: boolean;
        amount?: number;
        percentage?: number;
        grace_period_days?: number;
    };
    discount_config: {
        enabled: boolean;
        early_payment_discount?: {
            percentage: number;
            days_before_due: number;
        };
        sibling_discount?: {
            percentage: number;
            min_siblings: number;
        };
    };
    is_active: boolean;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const FeeCategorySchema = new Schema({
    campus_id: { type: String, required: true },
    category_name: { type: String, required: true },
    category_code: { type: String, required: true },
    description: { type: String, required: true },
    is_mandatory: { type: Boolean, required: true, default: true },
    applicable_classes: { type: [String], required: true },
    academic_year: { type: String, required: true },
    frequency: { 
        type: String, 
        required: true,
        enum: ["monthly", "quarterly", "annually", "one-time"]
    },
    due_date_config: {
        type: Object,
        required: true
    },
    late_fee_config: {
        type: Object,
        required: true,
        default: { enabled: false }
    },
    discount_config: {
        type: Object,
        required: true,
        default: { enabled: false }
    },
    is_active: { type: Boolean, required: true, default: true },
    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

FeeCategorySchema.index.findByCampusId = { by: "campus_id" };
FeeCategorySchema.index.findByCategoryCode = { by: "category_code" };
FeeCategorySchema.index.findByAcademicYear = { by: "academic_year" };
FeeCategorySchema.index.findByCampusIdAndAcademicYear = { 
    by: ["campus_id", "academic_year"] 
};

const FeeCategory = ottoman.model<IFeeCategory>(
    "fee_categories",
    FeeCategorySchema
);

export { FeeCategory, type IFeeCategory };
