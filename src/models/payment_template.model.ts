import { Schema } from "ottoman";

import { ottoman } from "../libs/db";
import { PaymentGateway, IFeeStructureItem } from "../types/payment-gateway.types";

interface IPaymentInstallment {
    installment_number: number;
    installment_name: string;
    amount: number;
    due_date: Date;
    description?: string;
}

interface IPaymentTemplate {
    id: string;
    campus_id: string;
    class_id: string;
    academic_year: string;
    template_name: string;
    description?: string;
    total_amount: number;
    currency: string; // INR, USD, etc.
    
    // Fee Structure Details (detailed breakdown)
    fee_structure: IFeeStructureItem[];
    
    // Payment Gateway Configuration
    primary_gateway: PaymentGateway;
    secondary_gateway?: PaymentGateway;
    gateway_preference: "primary_only" | "fallback" | "student_choice";
    
    // Installment configuration
    is_installment_enabled: boolean;
    allow_one_time_payment: boolean;  // Allow students to choose between installment/one-time
    installments: IPaymentInstallment[];
    
    // Payment deadline
    payment_deadline?: Date;
    
    // Late fee configuration
    is_late_fee_enabled: boolean;
    late_fee_amount?: number;
    late_fee_percentage?: number;
    late_fee_grace_period_days?: number;
    
    // Discount configuration
    is_discount_enabled: boolean;
    early_payment_discount_amount?: number;
    early_payment_discount_percentage?: number;
    early_payment_deadline?: Date;
    
    // Template metadata
    payment_category: string; // tuition, transport, library, hostel, exam, etc.
    is_mandatory: boolean;
    applicable_to_all_students: boolean;
    excluded_student_ids?: string[];
    
    // Status
    is_active: boolean;
    is_deleted: boolean;
    created_by: string;
    updated_by?: string;
    created_at: Date;
    updated_at: Date;
}

const PaymentInstallmentSchema = new Schema({
    installment_number: { type: Number, required: true },
    installment_name: { type: String, required: true },
    amount: { type: Number, required: true },
    due_date: { type: Date, required: true },
    description: { type: String, required: false },
});

const FeeStructureItemSchema = new Schema({
    item_name: { type: String, required: true },
    item_description: { type: String, required: false },
    amount: { type: Number, required: true },
    is_mandatory: { type: Boolean, required: true, default: true },
    category: { type: String, required: true },
});

const PaymentTemplateSchema = new Schema({
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    template_name: { type: String, required: true },
    description: { type: String, required: false },
    total_amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    
    fee_structure: { type: [FeeStructureItemSchema], required: true, default: [] },
    
    primary_gateway: { type: String, required: true, default: "cashfree" },
    secondary_gateway: { type: String, required: false },
    gateway_preference: { type: String, required: true, default: "primary_only" },
    
    is_installment_enabled: { type: Boolean, required: true, default: false },
    allow_one_time_payment: { type: Boolean, required: true, default: true },
    installments: { type: [PaymentInstallmentSchema], required: false, default: [] },
    
    payment_deadline: { type: Date, required: false },
    
    is_late_fee_enabled: { type: Boolean, required: true, default: false },
    late_fee_amount: { type: Number, required: false },
    late_fee_percentage: { type: Number, required: false },
    late_fee_grace_period_days: { type: Number, required: false, default: 0 },
    
    is_discount_enabled: { type: Boolean, required: true, default: false },
    early_payment_discount_amount: { type: Number, required: false },
    early_payment_discount_percentage: { type: Number, required: false },
    early_payment_deadline: { type: Date, required: false },
    
    payment_category: { type: String, required: true },
    is_mandatory: { type: Boolean, required: true, default: true },
    applicable_to_all_students: { type: Boolean, required: true, default: true },
    excluded_student_ids: { type: [String], required: false, default: [] },
    
    is_active: { type: Boolean, required: true, default: true },
    is_deleted: { type: Boolean, required: true, default: false },
    created_by: { type: String, required: true },
    updated_by: { type: String, required: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

PaymentTemplateSchema.index.findByCampusId = { by: "campus_id" };
PaymentTemplateSchema.index.findByClassId = { by: "class_id" };
PaymentTemplateSchema.index.findByAcademicYear = { by: "academic_year" };
PaymentTemplateSchema.index.findByCategory = { by: "payment_category" };

const PaymentTemplate = ottoman.model<IPaymentTemplate>("payment_template", PaymentTemplateSchema);

export { PaymentTemplate, type IPaymentTemplate, type IPaymentInstallment };
