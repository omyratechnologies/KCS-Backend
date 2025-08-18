import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface ILeaveRequest {
    id: string;
    campus_id: string;
    user_id: string;
    user_type: "Student" | "Teacher";
    leave_type_id: string;
    start_date: Date;
    end_date: Date;
    total_days: number;
    reason: string;
    priority: "Normal" | "Urgent" | "Emergency";
    status: "Pending" | "Approved" | "Rejected" | "Cancelled";
    approved_by?: string; // User ID of approver
    approval_date?: Date;
    rejection_reason?: string;
    supporting_documents?: string[]; // Array of file URLs
    applied_on: Date;
    created_at: Date;
    updated_at: Date;
}

const LeaveRequestSchema = new Schema({
    campus_id: { type: String, required: true },
    user_id: { type: String, required: true },
    user_type: { 
        type: String, 
        required: true,
        enum: ["Student", "Teacher"]
    },
    leave_type_id: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    total_days: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, minlength: 10 },
    priority: {
        type: String,
        required: true,
        enum: ["Normal", "Urgent", "Emergency"],
        default: "Normal"
    },
    status: {
        type: String,
        required: true,
        enum: ["Pending", "Approved", "Rejected", "Cancelled"],
        default: "Pending"
    },
    approved_by: { type: String, required: false },
    approval_date: { type: Date, required: false },
    rejection_reason: { type: String, required: false },
    supporting_documents: { type: [String], required: false },
    applied_on: { type: Date, default: () => new Date() },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

LeaveRequestSchema.index.findByCampusId = { by: "campus_id" };
LeaveRequestSchema.index.findByUserId = { by: "user_id" };
LeaveRequestSchema.index.findByStatus = { by: "status" };
LeaveRequestSchema.index.findByUserType = { by: "user_type" };
LeaveRequestSchema.index.findByLeaveTypeId = { by: "leave_type_id" };

const LeaveRequest = ottoman.model<ILeaveRequest>("leave_requests", LeaveRequestSchema);

export { LeaveRequest, type ILeaveRequest };
