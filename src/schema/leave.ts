import { z } from "zod";

// ======================= LEAVE REQUEST SCHEMAS =======================

export const createLeaveRequestSchema = z.object({
    leave_type_id: z.string().min(1, "Leave type is required"),
    start_date: z.string().transform(str => new Date(str)),
    end_date: z.string().transform(str => new Date(str)),
    reason: z.string().min(10, "Reason must be at least 10 characters"),
    priority: z.enum(["Normal", "Urgent", "Emergency"]).default("Normal"),
    supporting_documents: z.array(z.string()).optional(),
});

export const leaveRequestResponseSchema = z.object({
    id: z.string(),
    campus_id: z.string(),
    user_id: z.string(),
    user_type: z.enum(["Student", "Teacher"]),
    leave_type_id: z.string(),
    start_date: z.date(),
    end_date: z.date(),
    total_days: z.number(),
    reason: z.string(),
    priority: z.enum(["Normal", "Urgent", "Emergency"]),
    status: z.enum(["Pending", "Approved", "Rejected", "Cancelled"]),
    approved_by: z.string().optional(),
    approval_date: z.date().optional(),
    rejection_reason: z.string().optional(),
    supporting_documents: z.array(z.string()).optional(),
    applied_on: z.date(),
    created_at: z.date(),
    updated_at: z.date(),
    user: z.object({
        id: z.string(),
        first_name: z.string(),
        last_name: z.string(),
        email: z.string(),
        user_type: z.string(),
        user_id: z.string(),
    }).optional(),
    leave_type: z.object({
        id: z.string(),
        name: z.string(),
        color: z.string().optional(),
        icon: z.string().optional(),
    }).optional(),
});

export const getLeaveRequestsResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        requests: z.array(leaveRequestResponseSchema),
        pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            total_pages: z.number(),
        }),
    }),
});

// ======================= LEAVE TYPE SCHEMAS =======================

export const createLeaveTypeSchema = z.object({
    name: z.string().min(1, "Leave type name is required"),
    description: z.string().optional(),
    default_allocation: z.number().min(0, "Default allocation must be at least 0"),
    max_carry_forward: z.number().min(0).optional(),
    carry_forward_allowed: z.boolean().default(false),
    requires_approval: z.boolean().default(true),
    color: z.string().optional(),
    icon: z.string().optional(),
});

export const leaveTypeResponseSchema = z.object({
    id: z.string(),
    campus_id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    default_allocation: z.number(),
    max_carry_forward: z.number().optional(),
    carry_forward_allowed: z.boolean(),
    requires_approval: z.boolean(),
    color: z.string().optional(),
    icon: z.string().optional(),
    is_active: z.boolean(),
    created_at: z.date(),
    updated_at: z.date(),
});

export const getLeaveTypesResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(leaveTypeResponseSchema),
});

// ======================= LEAVE BALANCE SCHEMAS =======================

export const leaveBalanceResponseSchema = z.object({
    id: z.string(),
    campus_id: z.string(),
    user_id: z.string(),
    user_type: z.enum(["Student", "Teacher"]),
    leave_type_id: z.string(),
    year: z.number(),
    allocated_days: z.number(),
    used_days: z.number(),
    carry_forward_days: z.number().optional(),
    available_days: z.number(),
    created_at: z.date(),
    updated_at: z.date(),
    leave_type: leaveTypeResponseSchema.optional(),
});

export const getLeaveBalancesResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(leaveBalanceResponseSchema),
});

// ======================= LEAVE ANALYTICS SCHEMAS =======================

export const leaveAnalyticsResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        pending_requests: z.number(),
        approved_this_month: z.number(),
        total_days_taken: z.number(),
        avg_leave_days: z.number(),
        rejection_rate: z.number(),
        total_employees: z.number(),
    }),
});

// ======================= LEAVE APPROVAL SCHEMAS =======================

export const rejectLeaveRequestSchema = z.object({
    rejection_reason: z.string().min(1, "Rejection reason is required"),
});

export const bulkApproveRequestSchema = z.object({
    request_ids: z.array(z.string()).min(1, "At least one request ID is required"),
});

// ======================= SUCCESS/ERROR SCHEMAS =======================

export const successResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    message: z.string().optional(),
});

export const errorResponseSchema = z.object({
    success: z.boolean(),
    error: z.string(),
});
