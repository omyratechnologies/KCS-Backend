import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ILeavePolicy {
    id: string;
    campus_id: string;
    leave_type_id: string;
    name: string;
    description?: string;
    eligibility: string; // e.g., "All employees", "After probation", "After 1 year service"
    notice_period: number; // Days in advance required
    documentation_required?: string;
    blackout_periods?: string[]; // Periods when leave is not allowed
    max_consecutive_days?: number;
    min_notice_days: number;
    approval_matrix?: {
        days: number;
        approvers: string[];
    }[];
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const LeavePolicySchema = new Schema({
    campus_id: { type: String, required: true },
    leave_type_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    eligibility: { type: String, required: true },
    notice_period: { type: Number, required: true, min: 0 },
    documentation_required: { type: String, required: false },
    blackout_periods: { type: [String], required: false },
    max_consecutive_days: { type: Number, required: false, min: 1 },
    min_notice_days: { type: Number, required: true, min: 0 },
    approval_matrix: { type: Object, required: false },
    is_active: { type: Boolean, required: true, default: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

LeavePolicySchema.index.findByCampusId = { by: "campus_id" };
LeavePolicySchema.index.findByLeaveTypeId = { by: "leave_type_id" };
LeavePolicySchema.index.findByActive = { by: "is_active" };

const LeavePolicy = ottoman.model<ILeavePolicy>("leave_policies", LeavePolicySchema);

export { LeavePolicy, type ILeavePolicy };
