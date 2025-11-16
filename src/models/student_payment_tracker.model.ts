/**
 * Student Payment Tracker Model
 * Track which installments a student has paid
 */

import { Schema } from "ottoman";
import { ottoman } from "@/libs/db";

export interface IStudentPaymentTracker {
    id?: string;
    student_id: string;
    campus_id: string;
    class_id: string;
    fee_structure_id: string;
    academic_year: string;
    
    // Payment tracking
    total_paid: number;
    total_due: number;
    
    // Installments paid
    installments_paid: number[]; // Array of installment numbers paid
    
    // One-time payment status
    one_time_paid: boolean;
    
    // Status
    payment_status: "PENDING" | "PARTIAL" | "COMPLETED" | "OVERDUE";
    
    // Metadata
    created_at: Date;
    updated_at: Date;
}

const studentPaymentTrackerSchema = new Schema({
    student_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    fee_structure_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    
    total_paid: { type: Number, default: 0 },
    total_due: { type: Number, required: true },
    
    installments_paid: { type: [Number], default: [] },
    one_time_paid: { type: Boolean, default: false },
    
    payment_status: { type: String, default: "PENDING" },
    
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

export const StudentPaymentTracker = ottoman.model("student_payment_tracker", studentPaymentTrackerSchema, {
    keyGenerator: () => `student_payment_tracker::${Date.now()}::${Math.random().toString(36).substr(2, 9)}`,
});
