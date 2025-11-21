/**
 * Payment Order Model (Cashfree Integration)
 * Tracks student fee payments with vendor splits
 */

import { Schema } from "ottoman";
import { ottoman } from "@/libs/db";

export interface IPaymentOrder {
    id?: string;
    
    // Order identification
    order_id: string; // Cashfree order ID
    cf_order_id?: string; // Cashfree's internal order ID
    
    // Student & Class info
    student_id: string;
    campus_id: string;
    class_id: string;
    fee_structure_id: string;
    
    // Parent relation (who made the payment)
    paid_by_id: string; // User ID of who paid (Student or Parent)
    paid_by_type: "Student" | "Parent"; // Type of user who paid
    
    // Payment details
    payment_type: "ONE_TIME" | "INSTALLMENT";
    installment_number?: number; // If installment payment
    
    order_amount: number;
    order_currency: string;
    order_status: "ACTIVE" | "PAID" | "EXPIRED" | "CANCELLED";
    
    // Payment response
    payment_session_id?: string;
    payment_link?: string;
    
    // Payment completion
    payment_method?: string;
    payment_time?: Date;
    payment_status?: "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED";
    
    cf_payment_id?: string;
    bank_reference?: string;
    
    // Settlement tracking
    settlement_status?: "PENDING" | "SETTLED" | "FAILED";
    settlement_id?: string;
    settlement_date?: Date;
    
    // Metadata
    order_note?: string;
    order_tags?: Record<string, string>;
    
    is_deleted: boolean;
    created_at: Date;
    updated_at?: Date;
}

const paymentOrderSchema = new Schema({
    order_id: { type: String, required: true },
    cf_order_id: String,
    
    student_id: { type: String, required: true },
    campus_id: { type: String, required: true },
    class_id: { type: String, required: true },
    fee_structure_id: { type: String, required: true },
    
    paid_by_id: { type: String, required: true },
    paid_by_type: { type: String, required: true },
    
    payment_type: { type: String, required: true },
    installment_number: Number,
    
    order_amount: { type: Number, required: true },
    order_currency: { type: String, default: "INR" },
    order_status: { type: String, default: "ACTIVE" },
    
    payment_session_id: String,
    payment_link: String,
    
    payment_method: String,
    payment_time: Date,
    payment_status: String,
    
    cf_payment_id: String,
    bank_reference: String,
    
    settlement_status: String,
    settlement_id: String,
    settlement_date: Date,
    
    order_note: String,
    order_tags: Object,
    
    is_deleted: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: Date,
});

export const PaymentOrder = ottoman.model("payment_order", paymentOrderSchema);
