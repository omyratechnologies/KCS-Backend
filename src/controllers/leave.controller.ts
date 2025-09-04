import { Context } from "hono";
import { LeaveService } from "@/services/leave.service";
import { LeaveInitializationService } from "@/services/leave-init.service";

export class LeaveController {
    // ======================= INITIALIZATION ROUTES =======================
    
    /**
     * Initialize default leave types for a campus
     */
    public static readonly initializeLeaveSystem = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            
            const createdTypes = await LeaveInitializationService.initializeDefaultLeaveTypes(campus_id);
            
            return ctx.json({
                success: true,
                data: createdTypes,
                message: `Initialized ${createdTypes.length} default leave types`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to initialize leave system",
                },
                500
            );
        }
    };
    
    /**
     * Initialize leave balances for a specific user
     */
    public static readonly initializeUserBalances = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const query = ctx.req.query();
            const targetUserId = query.user_id as string;
            const targetUserType = query.user_type as "Student" | "Teacher";
            
            if (!targetUserId || !targetUserType) {
                return ctx.json(
                    {
                        success: false,
                        error: "user_id and user_type parameters are required",
                    },
                    400
                );
            }
            
            await LeaveService.initializeUserLeaveBalances(
                campus_id,
                targetUserId,
                targetUserType
            );
            
            return ctx.json({
                success: true,
                message: `Initialized leave balances for user ${targetUserId}`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to initialize user balances",
                },
                500
            );
        }
    };
    
    /**
     * Test endpoint to verify leave system is working
     */
    public static readonly testLeaveSystem = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            
            // Get leave types
            const leaveTypes = await LeaveService.getLeaveTypes(campus_id);
            
            // Get user's leave balances
            const balances = await LeaveService.getLeaveBalances(
                campus_id, 
                user_id, 
                user_type as "Student" | "Teacher"
            );
            
            return ctx.json({
                success: true,
                data: {
                    campus_id,
                    user_id,
                    user_type,
                    available_leave_types: leaveTypes.length,
                    leave_types: leaveTypes,
                    balances: balances.length,
                    user_balances: balances,
                },
                message: "Leave system is working correctly",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to test leave system",
                },
                500
            );
        }
    };
    
    // ======================= ADMIN ROUTES =======================
    
    /**
     * Get all leave requests for admin dashboard
     */
    public static readonly getLeaveRequests = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const query = ctx.req.query();
            
            const filters = {
                campus_id,
                user_type: query.user_type as "Student" | "Teacher" | undefined,
                status: query.status as string,
                leave_type: query.leave_type as string,
                page: query.page ? Number.parseInt(query.page) : 1,
                limit: query.limit ? Number.parseInt(query.limit) : 20,
                search: query.search as string,
                from_date: query.from_date ? new Date(query.from_date) : undefined,
                to_date: query.to_date ? new Date(query.to_date) : undefined,
            };
            
            const result = await LeaveService.getLeaveRequests(filters);
            
            return ctx.json({
                success: true,
                data: result,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch leave requests",
                },
                500
            );
        }
    };
    
    /**
     * Get leave analytics for admin dashboard
     */
    public static readonly getLeaveAnalytics = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const query = ctx.req.query();
            const period = query.period as string;
            
            const analytics = await LeaveService.getLeaveAnalytics(campus_id, period);
            
            return ctx.json({
                success: true,
                data: analytics,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch leave analytics",
                },
                500
            );
        }
    };
    
    /**
     * Approve a leave request
     */
    public static readonly approveLeaveRequest = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { request_id } = ctx.req.param();
            
            const result = await LeaveService.approveLeaveRequest(campus_id, request_id, user_id);
            
            return ctx.json({
                success: true,
                data: result,
                message: "Leave request approved successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to approve leave request",
                },
                500
            );
        }
    };
    
    /**
     * Reject a leave request
     */
    public static readonly rejectLeaveRequest = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { request_id } = ctx.req.param();
            const { rejection_reason } = await ctx.req.json();
            
            const result = await LeaveService.rejectLeaveRequest(campus_id, request_id, rejection_reason);
            
            return ctx.json({
                success: true,
                data: result,
                message: "Leave request rejected successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to reject leave request",
                },
                500
            );
        }
    };
    
    /**
     * Bulk approve leave requests
     */
    public static readonly bulkApproveLeaveRequests = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const { request_ids } = await ctx.req.json();
            
            const results = await LeaveService.bulkApproveLeaveRequests(campus_id, request_ids, user_id);
            
            return ctx.json({
                success: true,
                data: results,
                message: "Bulk approval completed",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to bulk approve leave requests",
                },
                500
            );
        }
    };
    
    // ======================= LEAVE TYPE MANAGEMENT =======================
    
    /**
     * Create a new leave type
     */
    public static readonly createLeaveType = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const leaveTypeData = await ctx.req.json();
            
            const result = await LeaveService.createLeaveType({
                campus_id,
                ...leaveTypeData,
            });
            
            return ctx.json(
                {
                    success: true,
                    data: result,
                    message: "Leave type created successfully",
                },
                201
            );
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to create leave type",
                },
                500
            );
        }
    };
    
    /**
     * Get all leave types
     */
    public static readonly getLeaveTypes = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            
            const leaveTypes = await LeaveService.getLeaveTypes(campus_id);
            
            return ctx.json({
                success: true,
                data: leaveTypes,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch leave types",
                },
                500
            );
        }
    };
    
    /**
     * Get a specific leave type by ID
     */
    public static readonly getLeaveTypeById = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { leave_type_id } = ctx.req.param();
            
            const leaveType = await LeaveService.getLeaveTypeById(campus_id, leave_type_id);
            
            return ctx.json({
                success: true,
                data: leaveType,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch leave type",
                },
                error instanceof Error && error.message === "Leave type not found or has been deactivated" ? 404 : 500
            );
        }
    };
    
    /**
     * Update a leave type
     */
    public static readonly updateLeaveType = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { leave_type_id } = ctx.req.param();
            const updates = await ctx.req.json();
            
            const result = await LeaveService.updateLeaveType(campus_id, leave_type_id, updates);
            
            return ctx.json({
                success: true,
                data: result,
                message: "Leave type updated successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to update leave type",
                },
                500
            );
        }
    };
    
    // ======================= STUDENT/TEACHER ROUTES =======================
    
    /**
     * Apply for leave (Students and Teachers)
     */
    public static readonly applyForLeave = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            
            const leaveData = await ctx.req.json();
            
            // Convert date strings to Date objects
            const processedData = {
                ...leaveData,
                start_date: new Date(leaveData.start_date),
                end_date: new Date(leaveData.end_date),
            };
            
            const result = await LeaveService.createLeaveRequest({
                campus_id,
                user_id,
                user_type: user_type as "Student" | "Teacher",
                ...processedData,
            });
            
            return ctx.json(
                {
                    success: true,
                    data: result,
                    message: "Leave request submitted successfully",
                },
                201
            );
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to submit leave request",
                },
                500
            );
        }
    };
    
    /**
     * Get user's own leave requests
     */
    public static readonly getMyLeaveRequests = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const query = ctx.req.query();
            
            const filters = {
                campus_id,
                user_id,
                user_type: user_type as "Student" | "Teacher",
                status: query.status as string,
                page: query.page ? Number.parseInt(query.page) : 1,
                limit: query.limit ? Number.parseInt(query.limit) : 20,
            };
            
            const result = await LeaveService.getLeaveRequests(filters);
            
            return ctx.json({
                success: true,
                data: result,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch leave requests",
                },
                500
            );
        }
    };
    
    /**
     * Get user's leave balances
     */
    public static readonly getMyLeaveBalances = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");
            const query = ctx.req.query();
            const year = query.year ? Number.parseInt(query.year) : undefined;
            
            const balances = await LeaveService.getLeaveBalances(
                campus_id,
                user_id,
                user_type as "Student" | "Teacher",
                year
            );
            
            return ctx.json({
                success: true,
                data: balances,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch leave balances",
                },
                500
            );
        }
    };
    
    /**
     * Cancel a leave request (Only pending requests)
     */
    public static readonly cancelLeaveRequest = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const request_id = ctx.req.param("request_id");
            
            const result = await LeaveService.cancelLeaveRequest(campus_id, request_id, user_id);
            
            return ctx.json({
                success: true,
                data: result,
                message: "Leave request cancelled successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to cancel leave request",
                },
                500
            );
        }
    };
    
    /**
     * Delete a leave type (Hard delete with safety checks)
     */
    public static readonly deleteLeaveType = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const leave_type_id = ctx.req.param("leave_type_id");
            
            const result = await LeaveService.deleteLeaveType(campus_id, leave_type_id);
            
            return ctx.json({
                success: true,
                data: result,
                message: "Leave type deleted successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to delete leave type",
                },
                500
            );
        }
    };
    
    // ======================= TEACHER SPECIFIC ROUTES =======================
    
    /**
     * Get leave requests for students in teacher's classes
     */
    public static readonly getStudentLeaveRequests = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const query = ctx.req.query();
            
            const filters = {
                campus_id,
                user_type: "Student" as const,
                status: query.status as string,
                page: query.page ? Number.parseInt(query.page) : 1,
                limit: query.limit ? Number.parseInt(query.limit) : 20,
                search: query.search as string,
            };
            
            const result = await LeaveService.getLeaveRequests(filters);
            
            return ctx.json({
                success: true,
                data: result,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : "Failed to fetch student leave requests",
                },
                500
            );
        }
    };
}
