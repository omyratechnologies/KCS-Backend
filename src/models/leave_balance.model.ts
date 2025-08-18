import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ILeaveBalance {
    id: string;
    campus_id: string;
    user_id: string;
    user_type: "Student" | "Teacher";
    leave_type_id: string;
    year: number; // Academic year
    allocated_days: number;
    used_days: number;
    carry_forward_days?: number;
    available_days: number; // calculated field
    created_at: Date;
    updated_at: Date;
}

const LeaveBalanceSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    user_type: { 
        type: String, 
        required: true,
        enum: ["Student", "Teacher"]
    },
    leave_type_id: { type: String, required: true },
    year: { type: Number, required: true },
    allocated_days: { type: Number, required: true, min: 0 },
    used_days: { type: Number, required: true, min: 0, default: 0 },
    carry_forward_days: { type: Number, required: false, min: 0, default: 0 },
    available_days: { type: Number, required: true, min: 0 },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

LeaveBalanceSchema.index.findByCampusId = { by: "campus_id" };
LeaveBalanceSchema.index.findByUserId = { by: "user_id" };
LeaveBalanceSchema.index.findByUserType = { by: "user_type" };
LeaveBalanceSchema.index.findByYear = { by: "year" };
LeaveBalanceSchema.index.findByLeaveTypeId = { by: "leave_type_id" };

const LeaveBalance = ottoman.model<ILeaveBalance>("leave_balances", LeaveBalanceSchema);

export { LeaveBalance, type ILeaveBalance };
