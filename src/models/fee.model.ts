import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IFeeData {
    id: string;
    campus_id: string;
    user_id: string;
    items: {
        fee_type: string;
        amount: number;
        name: string;
    }[];
    paid_amount: number;
    due_amount: number;
    payment_status: string;
    is_paid: boolean;
    payment_date: Date;
    payment_mode: string;
    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

const FeeSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    items: [
        {
            fee_type: { type: String, required: true },
            amount: { type: Number, required: true },
            name: { type: String, required: true },
        },
    ],
    paid_amount: { type: Number, required: false },
    due_amount: { type: Number, required: true },
    payment_status: { type: String, required: true },
    is_paid: { type: Boolean, required: true },
    payment_date: { type: Date, required: false },
    payment_mode: { type: String, required: false },
    meta_data: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

FeeSchema.index.findByCampusId = { by: "campus_id" };
FeeSchema.index.findByUserId = { by: "user_id" };
FeeSchema.index.findByPaymentStatus = { by: "payment_status" };
FeeSchema.index.findByPaymentDate = { by: "payment_date" };
FeeSchema.index.findByPaymentMode = { by: "payment_mode" };

const Fee = ottoman.model<IFeeData>("fee", FeeSchema);

export { Fee, type IFeeData };
