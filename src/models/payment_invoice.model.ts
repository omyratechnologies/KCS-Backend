import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IInvoiceLineItem {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

interface IPaymentInvoice {
    id: string;
    invoice_number: string;
    campus_id: string;
    student_id: string;
    class_id: string;
    academic_year: string;
    payment_template_id: string;
    payment_transaction_id: string;
    
    // Invoice details
    invoice_date: Date;
    due_date?: Date;
    
    // Student details
    student_name: string;
    student_email?: string;
    student_phone?: string;
    parent_name?: string;
    
    // School details
    school_name: string;
    school_address?: string;
    school_email?: string;
    school_phone?: string;
    school_gstin?: string;
    school_logo_url?: string;
    
    // Line items
    line_items: IInvoiceLineItem[];
    
    // Amounts
    subtotal: number;
    late_fee: number;
    discount: number;
    tax_amount: number;
    tax_percentage?: number;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    
    currency: string;
    
    // Payment information
    payment_status: "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled";
    payment_date?: Date;
    payment_method?: string;
    razorpay_payment_id?: string;
    
    // Invoice notes
    notes?: string;
    terms_and_conditions?: string;
    
    // PDF generation
    pdf_url?: string;
    pdf_generated_at?: Date;
    
    // System fields
    is_deleted: boolean;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

const InvoiceLineItemSchema = new Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    unit_price: { type: Number, required: true },
    amount: { type: Number, required: true },
});

const PaymentInvoiceSchema = new Schema({
    invoice_number: { type: String, required: true, unique: true },
    campus_id: { type: String, required: true },
    student_id: { type: String, required: true },
    class_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    payment_template_id: { type: String, required: true },
    payment_transaction_id: { type: String, required: true },
    
    invoice_date: { type: Date, required: true, default: () => new Date() },
    due_date: { type: Date, required: false },
    
    student_name: { type: String, required: true },
    student_email: { type: String, required: false },
    student_phone: { type: String, required: false },
    parent_name: { type: String, required: false },
    
    school_name: { type: String, required: true },
    school_address: { type: String, required: false },
    school_email: { type: String, required: false },
    school_phone: { type: String, required: false },
    school_gstin: { type: String, required: false },
    school_logo_url: { type: String, required: false },
    
    line_items: { type: [InvoiceLineItemSchema], required: true },
    
    subtotal: { type: Number, required: true },
    late_fee: { type: Number, required: false, default: 0 },
    discount: { type: Number, required: false, default: 0 },
    tax_amount: { type: Number, required: false, default: 0 },
    tax_percentage: { type: Number, required: false },
    total_amount: { type: Number, required: true },
    amount_paid: { type: Number, required: true, default: 0 },
    balance_due: { type: Number, required: true },
    
    currency: { type: String, required: true, default: "INR" },
    
    payment_status: { type: String, required: true, default: "unpaid" },
    payment_date: { type: Date, required: false },
    payment_method: { type: String, required: false },
    razorpay_payment_id: { type: String, required: false },
    
    notes: { type: String, required: false },
    terms_and_conditions: { type: String, required: false },
    
    pdf_url: { type: String, required: false },
    pdf_generated_at: { type: Date, required: false },
    
    is_deleted: { type: Boolean, required: true, default: false },
    created_by: { type: String, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

PaymentInvoiceSchema.index.findByInvoiceNumber = { by: "invoice_number" };
PaymentInvoiceSchema.index.findByStudentId = { by: "student_id" };
PaymentInvoiceSchema.index.findByCampusId = { by: "campus_id" };
PaymentInvoiceSchema.index.findByTransactionId = { by: "payment_transaction_id" };
PaymentInvoiceSchema.index.findByStatus = { by: "payment_status" };

const PaymentInvoice = ottoman.model<IPaymentInvoice>("payment_invoice", PaymentInvoiceSchema);

export { PaymentInvoice, type IPaymentInvoice, type IInvoiceLineItem };
