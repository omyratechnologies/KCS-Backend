import { LeaveRequest } from "@/models/leave_request.model";
import { LeaveType } from "@/models/leave_type.model";
import { LeaveBalance } from "@/models/leave_balance.model";
import { User } from "@/models/user.model";

export class LeaveService {
    // ======================= LEAVE REQUEST METHODS =======================
    
    static async createLeaveRequest(data: {
        campus_id: string;
        user_id: string;
        user_type: "Student" | "Teacher";
        leave_type_id: string;
        start_date: Date;
        end_date: Date;
        reason: string;
        priority: "Normal" | "Urgent" | "Emergency";
        supporting_documents?: string[];
    }) {
        // Validation 1: Check for existing pending requests
        const existingPendingResult = await LeaveRequest.find({
            campus_id: data.campus_id,
            user_id: data.user_id,
            status: "Pending"
        });
        const existingPendingRequests = Array.isArray(existingPendingResult) ? existingPendingResult : existingPendingResult.rows || [];
        
        if (existingPendingRequests.length > 0) {
            throw new Error("You cannot submit a new leave request while you have a pending request. Please cancel your existing request first.");
        }
        
        // Validation 2: Check for overlapping approved leave
        const currentDate = new Date();
        const requestStartDate = data.start_date;
        const requestEndDate = data.end_date;
        
        // Get all approved requests for this user
        const approvedRequestsResult = await LeaveRequest.find({
            campus_id: data.campus_id,
            user_id: data.user_id,
            status: "Approved"
        });
        const approvedRequests = Array.isArray(approvedRequestsResult) ? approvedRequestsResult : approvedRequestsResult.rows || [];
        
        // Check for date overlaps
        const overlapping = approvedRequests.filter(request => {
            const existingStart = new Date(request.start_date);
            const existingEnd = new Date(request.end_date);
            
            return (
                (requestStartDate >= existingStart && requestStartDate <= existingEnd) ||
                (requestEndDate >= existingStart && requestEndDate <= existingEnd) ||
                (requestStartDate <= existingStart && requestEndDate >= existingEnd)
            );
        });
        
        if (overlapping.length > 0) {
            throw new Error("You cannot request leave during a period when you already have approved leave. Please select different dates.");
        }
        
        // Validation 3: Check if currently on approved leave
        const currentlyOnLeave = approvedRequests.filter(request => {
            const startDate = new Date(request.start_date);
            const endDate = new Date(request.end_date);
            
            return currentDate >= startDate && currentDate <= endDate;
        });
        
        if (currentlyOnLeave.length > 0) {
            throw new Error("You cannot request leave while you are currently on approved leave.");
        }
        
        // Calculate total days
        const totalDays = this.calculateWorkingDays(data.start_date, data.end_date);
        
        // Create the leave request
        const leaveRequestData = {
            campus_id: data.campus_id,
            user_id: data.user_id,
            user_type: data.user_type,
            leave_type_id: data.leave_type_id,
            start_date: data.start_date,
            end_date: data.end_date,
            total_days: totalDays,
            reason: data.reason,
            priority: data.priority,
            status: "Pending" as const,
            supporting_documents: data.supporting_documents || [],
            applied_on: new Date(),
        };
        
        const result = await LeaveRequest.create(leaveRequestData);
        return result;
    }
    
    static async getLeaveRequests(filters: {
        campus_id: string;
        user_id?: string;
        user_type?: "Student" | "Teacher";
        status?: string;
        leave_type?: string;
        from_date?: Date;
        to_date?: Date;
        page?: number;
        limit?: number;
        search?: string;
    }) {
        const queryConditions: Record<string, unknown> = { 
            campus_id: filters.campus_id 
        };
        
        if (filters.user_id) {
            queryConditions.user_id = filters.user_id;
        }
        if (filters.user_type) {
            queryConditions.user_type = filters.user_type;
        }
        if (filters.status && filters.status !== "All Status") {
            queryConditions.status = filters.status;
        }
        if (filters.leave_type && filters.leave_type !== "All Types") {
            queryConditions.leave_type_id = filters.leave_type;
        }
        
        if (filters.from_date || filters.to_date) {
            const dateConditions: Record<string, Date> = {};
            if (filters.from_date) {
                dateConditions.$gte = filters.from_date;
            }
            if (filters.to_date) {
                dateConditions.$lte = filters.to_date;
            }
            queryConditions.start_date = dateConditions;
        }
        
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        
        const requestQuery = await LeaveRequest.find(queryConditions);
        const requests = Array.isArray(requestQuery) ? requestQuery : requestQuery.rows || [];
        const totalRequests = requests.length;
        
        // Apply pagination manually
        const startIndex = (page - 1) * limit;
        const paginatedRequests = requests.slice(startIndex, startIndex + limit);
        
        // Enrich with user and leave type details
        const enrichedRequests = await Promise.all(
            paginatedRequests.map(async (request) => {
                try {
                    const user = await User.findOne({ user_id: request.user_id });
                    const leaveType = await LeaveType.findById(request.leave_type_id);
                    
                    return {
                        ...request,
                        user: user ? {
                            id: user.id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email: user.email,
                            user_type: user.user_type,
                            user_id: user.user_id,
                        } : null,
                        leave_type: leaveType ? {
                            id: leaveType.id,
                            name: leaveType.name,
                            color: leaveType.color,
                            icon: leaveType.icon,
                        } : null,
                    };
                } catch {
                    // Log error silently and return original request
                    return request;
                }
            })
        );
        
        return {
            requests: enrichedRequests,
            pagination: {
                page,
                limit,
                total: totalRequests,
                total_pages: Math.ceil(totalRequests / limit),
            },
        };
    }
    
    static async approveLeaveRequest(
        campus_id: string, 
        request_id: string, 
        approved_by: string
    ) {
        const request = await LeaveRequest.findById(request_id);
        if (!request || request.campus_id !== campus_id) {
            throw new Error("Leave request not found");
        }
        
        if (request.status !== "Pending") {
            throw new Error("Leave request is not in pending status");
        }
        
        const updatedRequest = await LeaveRequest.replaceById(request_id, {
            ...request,
            status: "Approved",
            approved_by: approved_by,
            approval_date: new Date(),
            updated_at: new Date(),
        });
        
        return updatedRequest;
    }
    
    static async rejectLeaveRequest(
        campus_id: string, 
        request_id: string, 
        rejection_reason: string
    ) {
        const request = await LeaveRequest.findById(request_id);
        if (!request || request.campus_id !== campus_id) {
            throw new Error("Leave request not found");
        }
        
        if (request.status !== "Pending") {
            throw new Error("Leave request is not in pending status");
        }
        
        const updatedRequest = await LeaveRequest.replaceById(request_id, {
            ...request,
            status: "Rejected",
            rejection_reason: rejection_reason,
            updated_at: new Date(),
        });
        
        return updatedRequest;
    }
    
    static async cancelLeaveRequest(
        campus_id: string, 
        request_id: string, 
        user_id: string
    ) {
        const request = await LeaveRequest.findById(request_id);
        if (!request || request.campus_id !== campus_id) {
            throw new Error("Leave request not found");
        }
        
        // Only the user who created the request can cancel it
        if (request.user_id !== user_id) {
            throw new Error("You can only cancel your own leave requests");
        }
        
        // Can only cancel pending or approved requests (not rejected ones)
        if (request.status !== "Pending" && request.status !== "Approved") {
            throw new Error(`Cannot cancel leave request with status: ${request.status}`);
        }
        
        // If approved leave, check if it hasn't started yet
        if (request.status === "Approved") {
            const currentDate = new Date();
            const startDate = new Date(request.start_date);
            
            if (startDate <= currentDate) {
                throw new Error("Cannot cancel approved leave that has already started");
            }
        }
        
        const updatedRequest = await LeaveRequest.replaceById(request_id, {
            ...request,
            status: "Cancelled",
            updated_at: new Date(),
        });
        
        return updatedRequest;
    }
    
    static async bulkApproveLeaveRequests(
        campus_id: string,
        request_ids: string[],
        approved_by: string
    ) {
        const results: Array<{
            request_id: string;
            status: string;
            data?: unknown;
            error?: string;
        }> = [];
        
        for (const request_id of request_ids) {
            try {
                const result = await this.approveLeaveRequest(campus_id, request_id, approved_by);
                results.push({ request_id, status: "approved", data: result });
            } catch (error) {
                results.push({ 
                    request_id, 
                    status: "error", 
                    error: error instanceof Error ? error.message : "Unknown error" 
                });
            }
        }
        
        return results;
    }
    
    // ======================= LEAVE TYPE METHODS =======================
    
    static async createLeaveType(data: {
        campus_id: string;
        name: string;
        description?: string;
        default_allocation: number;
        max_carry_forward?: number;
        carry_forward_allowed: boolean;
        requires_approval: boolean;
        color?: string;
        icon?: string;
    }) {
        const leaveTypeData = {
            ...data,
            is_active: true,
        };
        
        const leaveType = await LeaveType.create(leaveTypeData);
        return leaveType;
    }
    
    static async getLeaveTypes(campus_id: string) {
        const queryResult = await LeaveType.find({ 
            campus_id, 
            is_active: true 
        });
        const leaveTypes = Array.isArray(queryResult) ? queryResult : queryResult.rows || [];
        return leaveTypes;
    }
    
    static async updateLeaveType(
        campus_id: string,
        leave_type_id: string,
        updates: Partial<{
            name: string;
            description: string;
            default_allocation: number;
            max_carry_forward: number;
            carry_forward_allowed: boolean;
            requires_approval: boolean;
            color: string;
            icon: string;
        }>
    ) {
        const leaveType = await LeaveType.findById(leave_type_id);
        if (!leaveType || leaveType.campus_id !== campus_id) {
            throw new Error("Leave type not found");
        }
        
        const updatedLeaveType = await LeaveType.replaceById(leave_type_id, {
            ...leaveType,
            ...updates,
            updated_at: new Date(),
        });
        
        return updatedLeaveType;
    }
    
    // ======================= LEAVE BALANCE METHODS =======================
    
    static async getLeaveBalances(
        campus_id: string,
        user_id: string,
        user_type: "Student" | "Teacher",
        year?: number
    ) {
        const currentYear = year || new Date().getFullYear();
        
        const balanceQuery = await LeaveBalance.find({
            campus_id,
            user_id,
            user_type,
            year: currentYear,
        });
        
        // Extract rows from Ottoman result
        const balances = Array.isArray(balanceQuery) ? balanceQuery : balanceQuery.rows || [];
        
        // Get leave type details for each balance
        const enrichedBalances = await Promise.all(
            balances.map(async (balance) => {
                try {
                    const leaveType = await LeaveType.findById(balance.leave_type_id);
                    return {
                        ...balance,
                        leave_type: leaveType,
                    };
                } catch {
                    // Log error silently and return original balance
                    return balance;
                }
            })
        );
        
        return enrichedBalances;
    }
    
    static async initializeUserLeaveBalances(
        campus_id: string,
        user_id: string,
        user_type: "Student" | "Teacher",
        year?: number
    ) {
        const currentYear = year || new Date().getFullYear();
        const leaveTypes = await this.getLeaveTypes(campus_id);
        
        for (const leaveType of leaveTypes) {
            // Check if balance already exists
            const existingBalanceQuery = await LeaveBalance.find({
                campus_id,
                user_id,
                user_type,
                leave_type_id: leaveType.id,
                year: currentYear,
            });
            
            const existingBalances = Array.isArray(existingBalanceQuery) ? existingBalanceQuery : existingBalanceQuery.rows || [];
            
            if (existingBalances.length === 0) {
                const balanceData = {
                    campus_id,
                    user_id,
                    user_type,
                    leave_type_id: leaveType.id,
                    year: currentYear,
                    allocated_days: leaveType.default_allocation,
                    used_days: 0,
                    carry_forward_days: 0,
                    available_days: leaveType.default_allocation,
                };
                
                await LeaveBalance.create(balanceData);
            }
        }
    }
    
    // ======================= ANALYTICS METHODS =======================
    
    static async getLeaveAnalytics(campus_id: string, period?: string) {
        const currentDate = new Date();
        let startDate: Date;
        
        switch (period) {
            case "week": {
                startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            }
            case "month": {
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                break;
            }
            case "quarter": {
                const quarterStartMonth = Math.floor(currentDate.getMonth() / 3) * 3;
                startDate = new Date(currentDate.getFullYear(), quarterStartMonth, 1);
                break;
            }
            default: {
                startDate = new Date(currentDate.getFullYear(), 0, 1);
            }
        }
        
        const requestQuery = await LeaveRequest.find({
            campus_id,
            applied_on: { $gte: startDate, $lte: currentDate },
        });
        
        const requests = Array.isArray(requestQuery) ? requestQuery : requestQuery.rows || [];
        
        const pendingRequests = requests.filter(r => r.status === "Pending").length;
        const approvedThisMonth = requests.filter(r => 
            r.status === "Approved" && 
            r.approval_date && 
            r.approval_date.getMonth() === currentDate.getMonth()
        ).length;
        
        const totalDaysTaken = requests
            .filter(r => r.status === "Approved")
            .reduce((sum, r) => sum + r.total_days, 0);
        
        const totalEmployeeQuery = await User.find({ 
            campus_id,
            is_active: true,
            is_deleted: false 
        });
        
        const totalEmployees = Array.isArray(totalEmployeeQuery) ? totalEmployeeQuery : totalEmployeeQuery.rows || [];
        
        const avgLeaveDays = totalEmployees.length > 0 ? totalDaysTaken / totalEmployees.length : 0;
        
        const rejectedRequests = requests.filter(r => r.status === "Rejected").length;
        const totalRequests = requests.length;
        const rejectionRate = totalRequests > 0 ? (rejectedRequests / totalRequests) * 100 : 0;
        
        return {
            pending_requests: pendingRequests,
            approved_this_month: approvedThisMonth,
            total_days_taken: totalDaysTaken,
            avg_leave_days: Math.round(avgLeaveDays * 10) / 10,
            rejection_rate: Math.round(rejectionRate * 10) / 10,
            total_employees: totalEmployees.length,
        };
    }
    
    // ======================= HELPER METHODS =======================
    
    private static calculateWorkingDays(startDate: Date, endDate: Date): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let workingDays = 0;
        
        while (start <= end) {
            const dayOfWeek = start.getDay();
            // Assuming weekends are Saturday (6) and Sunday (0)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDays++;
            }
            start.setDate(start.getDate() + 1);
        }
        
        return workingDays;
    }
}
