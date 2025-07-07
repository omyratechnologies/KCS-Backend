import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

export interface IDiscountRule {
    id: string;
    campus_id: string;
    name: string;
    description: string;
    discount_type: "percentage" | "fixed_amount" | "bulk_discount" | "early_bird" | "sibling_discount" | "merit_based";
    conditions: {
        // Common conditions
        applicable_fee_categories?: string[]; // Fee category IDs
        applicable_classes?: string[]; // Class IDs
        academic_year?: string;
        min_amount?: number; // Minimum fee amount to qualify
        max_amount?: number; // Maximum discount amount (for percentage)
        
        // Time-based conditions
        valid_from?: Date;
        valid_until?: Date;
        early_payment_days?: number; // For early bird discounts
        
        // Student-based conditions
        student_criteria?: {
            performance_grade?: "A+" | "A" | "B+" | "B" | "C"; // Merit-based
            attendance_percentage?: number; // Minimum attendance
            previous_year_performance?: boolean;
        };
        
        // Bulk discount conditions
        bulk_criteria?: {
            min_students?: number; // Minimum students from same family
            same_class?: boolean;
            payment_together?: boolean; // All payments must be made together
        };
        
        // Sibling discount
        sibling_criteria?: {
            min_siblings?: number;
            discount_per_sibling?: number;
            max_discount_percentage?: number;
        };
    };
    discount_value: number; // Percentage or fixed amount
    max_discount_amount?: number; // Cap on discount amount
    is_stackable: boolean; // Can be combined with other discounts
    priority: number; // Higher priority applied first
    usage_limit?: number; // Maximum times this discount can be used
    used_count: number; // Current usage count
    auto_apply: boolean; // Automatically apply when conditions are met
    requires_approval: boolean; // Needs admin approval
    is_active: boolean;
    created_by: string;
    approved_by?: string;
    approved_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface IDiscountApplication {
    id: string;
    campus_id: string;
    discount_rule_id: string;
    fee_id: string;
    student_id: string;
    parent_id?: string;
    discount_amount: number;
    applied_percentage: number;
    original_amount: number;
    discounted_amount: number;
    status: "pending" | "approved" | "rejected" | "applied";
    application_reason?: string;
    applied_by: string;
    approved_by?: string;
    approved_at?: Date;
    rejection_reason?: string;
    created_at: Date;
    updated_at: Date;
}

export interface IDiscountSummary {
    total_discounts_given: number;
    total_discount_amount: number;
    total_students_benefited: number;
    discount_by_type: Array<{
        type: string;
        count: number;
        amount: number;
    }>;
    discount_by_class: Array<{
        class_name: string;
        count: number;
        amount: number;
    }>;
    top_discount_rules: Array<{
        rule_name: string;
        usage_count: number;
        total_amount: number;
    }>;
}

const DiscountRuleSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    discount_type: { 
        type: String, 
        required: true,
        enum: ["percentage", "fixed_amount", "bulk_discount", "early_bird", "sibling_discount", "merit_based"]
    },
    conditions: {
        applicable_fee_categories: [String],
        applicable_classes: [String],
        academic_year: String,
        min_amount: Number,
        max_amount: Number,
        valid_from: Date,
        valid_until: Date,
        early_payment_days: Number,
        student_criteria: {
            performance_grade: { type: String, enum: ["A+", "A", "B+", "B", "C"] },
            attendance_percentage: Number,
            previous_year_performance: Boolean
        },
        bulk_criteria: {
            min_students: Number,
            same_class: Boolean,
            payment_together: Boolean
        },
        sibling_criteria: {
            min_siblings: Number,
            discount_per_sibling: Number,
            max_discount_percentage: Number
        }
    },
    discount_value: { type: Number, required: true },
    max_discount_amount: Number,
    is_stackable: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
    usage_limit: Number,
    used_count: { type: Number, default: 0 },
    auto_apply: { type: Boolean, default: false },
    requires_approval: { type: Boolean, default: true },
    is_active: { type: Boolean, default: true },
    created_by: { type: String, required: true },
    approved_by: String,
    approved_at: Date,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const DiscountApplicationSchema = new Schema({
    campus_id: { type: String, required: true },
    discount_rule_id: { type: String, required: true },
    fee_id: { type: String, required: true },
    student_id: { type: String, required: true },
    parent_id: String,
    discount_amount: { type: Number, required: true },
    applied_percentage: { type: Number, required: true },
    original_amount: { type: Number, required: true },
    discounted_amount: { type: Number, required: true },
    status: { 
        type: String, 
        required: true,
        enum: ["pending", "approved", "rejected", "applied"],
        default: "pending"
    },
    application_reason: String,
    applied_by: { type: String, required: true },
    approved_by: String,
    approved_at: Date,
    rejection_reason: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export const DiscountRule = ottoman.model<IDiscountRule>("DiscountRule", DiscountRuleSchema);
export const DiscountApplication = ottoman.model<IDiscountApplication>("DiscountApplication", DiscountApplicationSchema);
