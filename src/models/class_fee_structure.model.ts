/**
 * Class Fee Structure Model
 * Admin sets fee structure per class with installment options
 */

import { Schema } from "ottoman";
import { ottoman } from "@/libs/db";

export interface IAmenity {
    name: string;
    gst_rate: number; // Percentage (e.g., 18 for 18%)
    total_amount: number;
    description?: string;
}

export interface IInstallment {
    installment_number: number;
    amount: number;
    due_date?: Date;
    late_fee?: number; // Integer amount for late payment penalty
    description?: string;
}

export interface IClassFeeStructure {
    id?: string;
    campus_id: string;
    class_id: string;
    class_name: string;
    academic_year: string;
    
    // Fee amounts
    total_amount: number;
    
    // Amenities breakdown (optional detailed breakdown)
    amenities?: IAmenity[];
    
    // Payment options
    one_time_amount: number; // May have discount
    one_time_enabled: boolean;
    
    installments_enabled: boolean;
    installments: IInstallment[];
    
    // Metadata
    fee_description?: string;
    
    created_by: string;
    created_at: Date;
    updated_by?: string;
    updated_at?: Date;
}

// Sub-schema for amenities
const AmenitySchema = new Schema({
    name: { type: String, required: true },
    gst_rate: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
    description: { type: String, required: false },
});

// Sub-schema for installments
const InstallmentSchema = new Schema({
    installment_number: { type: Number, required: true },
    amount: { type: Number, required: true },
    due_date: { type: String, required: false },
    late_fee: { type: Number, required: false }, // Integer
    description: { type: String, required: false },
});

const classFeeStructureSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    
    total_amount: { type: Number, required: true },
    
    amenities: { type: [AmenitySchema], default: [] },
    
    one_time_amount: { type: Number, required: true },
    one_time_enabled: { type: Boolean, default: true },
    
    installments_enabled: { type: Boolean, default: true },
    installments: { type: [InstallmentSchema], default: [] },
    
    fee_description: String,
    
    created_by: String,
    created_at: { type: Date, default: Date.now },
    updated_by: String,
    updated_at: Date,
});

export const ClassFeeStructure = ottoman.model("class_fee_structure", classFeeStructureSchema);
