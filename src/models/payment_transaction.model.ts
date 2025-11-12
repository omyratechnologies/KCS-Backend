import { Schema } from "ottoman";

import { ottoman } from "../libs/db";
import { PaymentGateway, PaymentMode } from "../types/payment-gateway.types";

interface IPaymentTransaction {
    id: string;
    campus_id: string;
    student_id: string;
    class_id: string;
    academic_year: string;
    payment_template_id: string;
    
    // Payment Gateway
    payment_gateway: PaymentGateway;
    payment_mode: PaymentMode; // one_time or installment
    
    // Installment details (if applicable)
    installment_number?: number;
    installment_id?: string;
    
    // Cashfree order details
    cashfree_order_id?: string;
    cashfree_payment_id?: string;
    cashfree_payment_session_id?: string;
    
    // Razorpay order details
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    
    // Transfer/Split details (Cashfree Easy Split or Razorpay Route Transfer)
    cashfree_vendor_id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cashfree_split_data?: any;
    razorpay_transfer_id?: string;
    transfer_status?: "pending" | "processed" | "failed" | "reversed";
    transfer_amount?: number;
    platform_fee?: number;
    vendor_amount?: number;
    
    // Payment amounts
    amount: number;
    currency: string;
    late_fee?: number;
    discount?: number;
    final_amount: number;
    
    // Payment status
    payment_status: "created" | "pending" | "authorized" | "captured" | "failed" | "refunded" | "partially_refunded";
    payment_method?: string; // card, netbanking, upi, wallet
    
    // Student and school account details
    student_email?: string;
    student_phone?: string;
    school_account_id?: string; // Razorpay account ID for route transfer
    
    // Payment metadata
    description?: string;
    notes?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    
    // Timestamps
    payment_initiated_at: Date;
    payment_captured_at?: Date;
    transfer_initiated_at?: Date;
    transfer_completed_at?: Date;
    
    // Failure information
    failure_reason?: string;
    error_code?: string;
    error_description?: string;
    
    // Refund information
    refund_id?: string;
    refund_amount?: number;
    refund_status?: "pending" | "processed" | "failed";
    refund_reason?: string;
    refunded_at?: Date;
    
    // Invoice
    invoice_id?: string;
    receipt_number?: string;
    
    // System fields
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

const PaymentTransactionSchema = new Schema({
    campus_id: { type: String, required: true },
    student_id: { type: String, required: true },
    class_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    payment_template_id: { type: String, required: true },
    
    payment_gateway: { type: String, required: true, default: "cashfree" },
    payment_mode: { type: String, required: true, default: "one_time" },
    
    installment_number: { type: Number, required: false },
    installment_id: { type: String, required: false },
    
    cashfree_order_id: { type: String, required: false },
    cashfree_payment_id: { type: String, required: false },
    cashfree_payment_session_id: { type: String, required: false },
    
    razorpay_order_id: { type: String, required: false },
    razorpay_payment_id: { type: String, required: false },
    razorpay_signature: { type: String, required: false },
    
    cashfree_vendor_id: { type: String, required: false },
    cashfree_split_data: { type: Object, required: false },
    razorpay_transfer_id: { type: String, required: false },
    transfer_status: { type: String, required: false },
    transfer_amount: { type: Number, required: false },
    platform_fee: { type: Number, required: false },
    vendor_amount: { type: Number, required: false },
    
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    late_fee: { type: Number, required: false, default: 0 },
    discount: { type: Number, required: false, default: 0 },
    final_amount: { type: Number, required: true },
    
    payment_status: { type: String, required: true, default: "created" },
    payment_method: { type: String, required: false },
    
    student_email: { type: String, required: false },
    student_phone: { type: String, required: false },
    school_account_id: { type: String, required: false },
    
    description: { type: String, required: false },
    notes: { type: Object, required: false },
    
    payment_initiated_at: { type: Date, default: () => new Date() },
    payment_captured_at: { type: Date, required: false },
    transfer_initiated_at: { type: Date, required: false },
    transfer_completed_at: { type: Date, required: false },
    
    failure_reason: { type: String, required: false },
    error_code: { type: String, required: false },
    error_description: { type: String, required: false },
    
    refund_id: { type: String, required: false },
    refund_amount: { type: Number, required: false },
    refund_status: { type: String, required: false },
    refund_reason: { type: String, required: false },
    refunded_at: { type: Date, required: false },
    
    invoice_id: { type: String, required: false },
    receipt_number: { type: String, required: false },
    
    is_deleted: { type: Boolean, required: true, default: false },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

PaymentTransactionSchema.index.findByStudentId = { by: "student_id" };
PaymentTransactionSchema.index.findByCampusId = { by: "campus_id" };
PaymentTransactionSchema.index.findByClassId = { by: "class_id" };
PaymentTransactionSchema.index.findByTemplateId = { by: "payment_template_id" };
PaymentTransactionSchema.index.findByGateway = { by: "payment_gateway" };
PaymentTransactionSchema.index.findByCashfreeOrderId = { by: "cashfree_order_id" };
PaymentTransactionSchema.index.findByRazorpayOrderId = { by: "razorpay_order_id" };
PaymentTransactionSchema.index.findByCashfreePaymentId = { by: "cashfree_payment_id" };
PaymentTransactionSchema.index.findByRazorpayPaymentId = { by: "razorpay_payment_id" };
PaymentTransactionSchema.index.findByStatus = { by: "payment_status" };

const PaymentTransaction = ottoman.model<IPaymentTransaction>("payment_transaction", PaymentTransactionSchema);

export { PaymentTransaction, type IPaymentTransaction };
