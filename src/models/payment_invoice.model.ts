import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IPaymentInvoice {
    id: string;
    campus_id: string;
    transaction_id: string;
    fee_id: string;
    student_id: string;
    parent_id?: string;
    invoice_number: string;
    invoice_date: Date;
    due_date: Date;
    amount_details: {
        subtotal: number;
        discount_amount: number;
        late_fee_amount: number;
        tax_amount: number;
        total_amount: number;
    };
    payment_details: {
        amount_paid: number;
        payment_date?: Date;
        payment_method?: string;
        transaction_reference?: string;
    };
    student_details: {
        name: string;
        class: string;
        roll_number: string;
        parent_name: string;
        contact_number: string;
        email: string;
    };
    school_details: {
        name: string;
        address: string;
        contact: string;
        email: string;
        logo_url?: string;
    };
    fee_breakdown: {
        category_name: string;
        amount: number;
        description?: string;
    }[];
    status: string; // generated, sent, paid, overdue
    invoice_url?: string;
    sent_notifications: {
        email_sent: boolean;
        sms_sent: boolean;
        whatsapp_sent: boolean;
        sent_at?: Date;
    };
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const PaymentInvoiceSchema = new Schema({
    campus_id: { type: String, required: true },
    transaction_id: { type: String, required: true },
    fee_id: { type: String, required: true },
    student_id: { type: String, required: true },
    parent_id: { type: String, required: false },
    invoice_number: { type: String, required: true, unique: true },
    invoice_date: { type: Date, required: true },
    due_date: { type: Date, required: true },
    amount_details: {
        type: Object,
        required: true,
    },
    payment_details: {
        type: Object,
        required: true,
        default: { amount_paid: 0 },
    },
    student_details: {
        type: Object,
        required: true,
    },
    school_details: {
        type: Object,
        required: true,
    },
    fee_breakdown: {
        type: [Object],
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["generated", "sent", "paid", "overdue"],
        default: "generated",
    },
    invoice_url: { type: String, required: false },
    sent_notifications: {
        type: Object,
        required: true,
        default: {
            email_sent: false,
            sms_sent: false,
            whatsapp_sent: false,
        },
    },
    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

PaymentInvoiceSchema.index.findByCampusId = { by: "campus_id" };
PaymentInvoiceSchema.index.findByTransactionId = { by: "transaction_id" };
PaymentInvoiceSchema.index.findByFeeId = { by: "fee_id" };
PaymentInvoiceSchema.index.findByStudentId = { by: "student_id" };
PaymentInvoiceSchema.index.findByParentId = { by: "parent_id" };
PaymentInvoiceSchema.index.findByInvoiceNumber = { by: "invoice_number" };
PaymentInvoiceSchema.index.findByStatus = { by: "status" };
PaymentInvoiceSchema.index.findByInvoiceDate = { by: "invoice_date" };
PaymentInvoiceSchema.index.findByDueDate = { by: "due_date" };

const PaymentInvoice = ottoman.model<IPaymentInvoice>(
    "payment_invoices",
    PaymentInvoiceSchema
);

export { type IPaymentInvoice, PaymentInvoice };
