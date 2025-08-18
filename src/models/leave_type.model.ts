import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ILeaveType {
    id: string;
    campus_id: string;
    name: string;
    description?: string;
    default_allocation: number; // Days allocated per year
    max_carry_forward?: number; // Maximum days that can be carried forward
    carry_forward_allowed: boolean;
    requires_approval: boolean;
    color?: string; // For UI display
    icon?: string; // For UI display
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const LeaveTypeSchema = new Schema({
    campus_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    default_allocation: { type: Number, required: true, min: 0 },
    max_carry_forward: { type: Number, required: false, min: 0 },
    carry_forward_allowed: { type: Boolean, required: true, default: false },
    requires_approval: { type: Boolean, required: true, default: true },
    color: { type: String, required: false },
    icon: { type: String, required: false },
    is_active: { type: Boolean, required: true, default: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

LeaveTypeSchema.index.findByCampusId = { by: "campus_id" };
LeaveTypeSchema.index.findByActive = { by: "is_active" };

const LeaveType = ottoman.model<ILeaveType>("leave_types", LeaveTypeSchema);

export { LeaveType, type ILeaveType };
