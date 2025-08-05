import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IFeeData {
    id: string;
    campus_id: string;
    user_id: string; // student_id
    parent_id?: string;
    class_id: string;
    academic_year: string;
    fee_template_id?: string;
    items: {
        category_id: string;
        fee_type: string;
        amount: number;
        name: string;
        due_date: Date;
        is_mandatory: boolean;
        late_fee_applicable: boolean;
    }[];
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    discount_amount: number;
    late_fee_amount: number;
    payment_status: string; // unpaid, partial, paid, overdue
    is_paid: boolean;
    payment_date?: Date;
    payment_mode?: string;
    installments_allowed: boolean;
    installment_plan?: {
        total_installments: number;
        completed_installments: number;
        next_due_date: Date;
        installment_amount: number;
    };
    auto_late_fee: boolean;
    reminder_sent: {
        email_count: number;
        sms_count: number;
        last_sent_at?: Date;
    };
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const FeeSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true }, // student_id
    parent_id: { type: String, required: false },
    class_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    fee_template_id: { type: String, required: false },
    items: [
        {
            category_id: { type: String, required: true },
            fee_type: { type: String, required: true },
            amount: { type: Number, required: true },
            name: { type: String, required: true },
            due_date: { type: Date, required: true },
            is_mandatory: { type: Boolean, required: true, default: true },
            late_fee_applicable: {
                type: Boolean,
                required: true,
                default: true,
            },
        },
    ],
    total_amount: { type: Number, required: true },
    paid_amount: { type: Number, required: false, default: 0 },
    due_amount: { type: Number, required: true },
    discount_amount: { type: Number, required: false, default: 0 },
    late_fee_amount: { type: Number, required: false, default: 0 },
    payment_status: {
        type: String,
        required: true,
        enum: ["unpaid", "partial", "paid", "overdue"],
        default: "unpaid",
    },
    is_paid: { type: Boolean, required: true, default: false },
    payment_date: { type: Date, required: false },
    payment_mode: { type: String, required: false },
    installments_allowed: { type: Boolean, required: true, default: false },
    installment_plan: {
        type: Object,
        required: false,
    },
    auto_late_fee: { type: Boolean, required: true, default: true },
    reminder_sent: {
        type: Object,
        required: true,
        default: {
            email_count: 0,
            sms_count: 0,
        },
    },
    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

FeeSchema.index.findByCampusId = { by: "campus_id" };
FeeSchema.index.findByUserId = { by: "user_id" };
FeeSchema.index.findByParentId = { by: "parent_id" };
FeeSchema.index.findByClassId = { by: "class_id" };
FeeSchema.index.findByAcademicYear = { by: "academic_year" };
FeeSchema.index.findByPaymentStatus = { by: "payment_status" };
FeeSchema.index.findByPaymentDate = { by: "payment_date" };
FeeSchema.index.findByPaymentMode = { by: "payment_mode" };
FeeSchema.index.findByFeeTemplateId = { by: "fee_template_id" };
FeeSchema.index.findByCampusIdAndUserId = { by: ["campus_id", "user_id"] };
FeeSchema.index.findByCampusIdAndClassId = { by: ["campus_id", "class_id"] };
FeeSchema.index.findByCampusIdAndAcademicYear = {
    by: ["campus_id", "academic_year"],
};

const Fee = ottoman.model<IFeeData>("fee", FeeSchema);

export { Fee, type IFeeData };
