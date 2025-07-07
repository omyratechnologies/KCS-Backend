import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IPaymentTransaction {
    id: string;
    campus_id: string;
    fee_id: string;
    student_id: string;
    parent_id?: string;
    payment_gateway: string; // razorpay, payu, cashfree
    gateway_transaction_id?: string;
    gateway_order_id?: string;
    gateway_payment_id?: string;
    amount: number;
    currency: string;
    status: string; // pending, success, failed, cancelled, refunded
    payment_method?: string; // card, netbanking, upi, wallet
    payment_details: {
        gateway_response?: object;
        failure_reason?: string;
        refund_details?: object;
    };
    initiated_at: Date;
    completed_at?: Date;
    webhook_verified: boolean;
    invoice_generated: boolean;
    invoice_url?: string;
    receipt_number?: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const PaymentTransactionSchema = new Schema({
    campus_id: { type: String, required: true },
    fee_id: { type: String, required: true },
    student_id: { type: String, required: true },
    parent_id: { type: String, required: false },
    payment_gateway: { 
        type: String, 
        required: true,
        enum: ["razorpay", "payu", "cashfree"]
    },
    gateway_transaction_id: { type: String, required: false },
    gateway_order_id: { type: String, required: false },
    gateway_payment_id: { type: String, required: false },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },
    status: { 
        type: String, 
        required: true,
        enum: ["pending", "success", "failed", "cancelled", "refunded"],
        default: "pending"
    },
    payment_method: { 
        type: String, 
        required: false,
        enum: ["card", "netbanking", "upi", "wallet", "emi"]
    },
    payment_details: {
        type: Object,
        required: true,
        default: {}
    },
    initiated_at: { type: Date, required: true, default: () => new Date() },
    completed_at: { type: Date, required: false },
    webhook_verified: { type: Boolean, required: true, default: false },
    invoice_generated: { type: Boolean, required: true, default: false },
    invoice_url: { type: String, required: false },
    receipt_number: { type: String, required: false },
    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

PaymentTransactionSchema.index.findByCampusId = { by: "campus_id" };
PaymentTransactionSchema.index.findByFeeId = { by: "fee_id" };
PaymentTransactionSchema.index.findByStudentId = { by: "student_id" };
PaymentTransactionSchema.index.findByParentId = { by: "parent_id" };
PaymentTransactionSchema.index.findByStatus = { by: "status" };
PaymentTransactionSchema.index.findByPaymentGateway = { by: "payment_gateway" };
PaymentTransactionSchema.index.findByGatewayTransactionId = { by: "gateway_transaction_id" };
PaymentTransactionSchema.index.findByGatewayOrderId = { by: "gateway_order_id" };
PaymentTransactionSchema.index.findByReceiptNumber = { by: "receipt_number" };

const PaymentTransaction = ottoman.model<IPaymentTransaction>(
    "payment_transactions",
    PaymentTransactionSchema
);

export { PaymentTransaction, type IPaymentTransaction };
