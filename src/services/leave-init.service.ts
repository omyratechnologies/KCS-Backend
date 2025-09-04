import { LeaveType } from "@/models/leave_type.model";
import { LeaveService } from "@/services/leave.service";

export class LeaveInitializationService {
    /**
     * Initialize default leave types for a campus
     */
    static async initializeDefaultLeaveTypes(campus_id: string) {
        const defaultLeaveTypes = [
            {
                name: "Sick Leave",
                description: "Medical emergencies",
                default_allocation: 8,
                max_carry_forward: 10,
                carry_forward_allowed: true,
                requires_approval: true,
                color: "#ef4444", // red
                icon: "🤒",
            },
            {
                name: "Casual Leave",
                description: "General purposes",
                default_allocation: 6,
                max_carry_forward: 6,
                carry_forward_allowed: false,
                requires_approval: true,
                color: "#3b82f6", // blue
                icon: "📅",
            },
            {
                name: "Personal Leave",
                description: "Personal matters",
                default_allocation: 3,
                max_carry_forward: 5,
                carry_forward_allowed: true,
                requires_approval: true,
                color: "#8b5cf6", // purple
                icon: "👤",
            },
            {
                name: "Annual Leave",
                description: "Vacation time",
                default_allocation: 15,
                max_carry_forward: 20,
                carry_forward_allowed: true,
                requires_approval: true,
                color: "#10b981", // green
                icon: "📧",
            },
            {
                name: "Maternity Leave",
                description: "Maternity support",
                default_allocation: 90,
                max_carry_forward: 90,
                carry_forward_allowed: false,
                requires_approval: true,
                color: "#ec4899", // pink
                icon: "💕",
            },
            {
                name: "Compensatory Off",
                description: "Overtime compensation",
                default_allocation: 5,
                max_carry_forward: 10,
                carry_forward_allowed: false,
                requires_approval: false,
                color: "#f59e0b", // yellow
                icon: "⏰",
            },
        ];

        const createdTypes: unknown[] = [];
        
        for (const leaveTypeData of defaultLeaveTypes) {
            try {
                // Check if leave type already exists
                const existingQuery = await LeaveType.find({ 
                    campus_id, 
                    name: leaveTypeData.name 
                });
                
                const existingTypes = Array.isArray(existingQuery) ? existingQuery : existingQuery.rows || [];
                
                if (existingTypes.length === 0) {
                    const leaveType = await LeaveService.createLeaveType({
                        campus_id,
                        ...leaveTypeData,
                    });
                    createdTypes.push(leaveType);
                }
            } catch {
                // Silently continue if creation fails
            }
        }
        
        return createdTypes;
    }
    
    /**
     * Initialize leave balances for a user
     */
    static async initializeUserLeaveBalances(
        campus_id: string,
        user_id: string,
        user_type: "Student" | "Teacher"
    ) {
        return await LeaveService.initializeUserLeaveBalances(
            campus_id,
            user_id,
            user_type
        );
    }
}
