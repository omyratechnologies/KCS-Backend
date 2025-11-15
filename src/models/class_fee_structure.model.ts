/**
 * Class Fee Structure Model
 * Admin sets fee structure per class with installment options
 */

import { Schema } from "ottoman";
import { ottoman } from "@/libs/db";

export interface IInstallment {
    installment_number: number;
    amount: number;
    due_date?: Date;
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
    
    // Payment options
    one_time_amount: number; // May have discount
    one_time_enabled: boolean;
    
    installments_enabled: boolean;
    installments: IInstallment[];
    
    // Vendor split configuration
    vendor_id: string; // Cashfree vendor ID
    vendor_split_percentage: number; // Percentage to split to campus vendor (default 100)
    
    // Metadata
    fee_description?: string;
    is_active: boolean;
    is_deleted: boolean;
    
    created_by: string;
    created_at: Date;
    updated_by?: string;
    updated_at?: Date;
}

// Sub-schema for installments
const InstallmentSchema = new Schema({
    installment_number: { type: Number, required: true },
    amount: { type: Number, required: true },
    due_date: { type: String, required: false },
    description: { type: String, required: false },
});

const classFeeStructureSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    class_name: { type: String, required: true },
    academic_year: { type: String, required: true },
    
    total_amount: { type: Number, required: true },
    
    one_time_amount: { type: Number, required: true },
    one_time_enabled: { type: Boolean, default: true },
    
    installments_enabled: { type: Boolean, default: true },
    installments: { type: [InstallmentSchema], default: [] },
    
    vendor_id: { type: String, required: true },
    vendor_split_percentage: { type: Number, default: 100 },
    
    fee_description: String,
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    
    created_by: String,
    created_at: { type: Date, default: Date.now },
    updated_by: String,
    updated_at: Date,
});

export const ClassFeeStructure = ottoman.model("class_fee_structure", classFeeStructureSchema, {
    keyGenerator: () => `class_fee_structure::${Date.now()}::${Math.random().toString(36).substr(2, 9)}`,
});
