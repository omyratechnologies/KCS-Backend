/**
 * Fee Notification Service (Manual Only)
 * Handles manual fee payment notifications to students and parents
 * Admins/Accountants have full control over who gets notified
 */

import { PushNotificationService } from "./push_notification.service";
import { ClassFeeStructure } from "@/models/class_fee_structure.model";
import { PaymentOrder } from "@/models/payment_order.model";
import { User, IUser } from "@/models/user.model";
import { UserService } from "@/services/users.service";
import log, { LogTypes } from "@/libs/logger";

export interface StudentWithUnpaidFees {
    student: IUser;
    unpaid_installments: Array<{
        fee_structure_id: string;
        class_name: string;
        installment_number: number;
        amount: number;
        due_date: Date;
        days_until_due: number;
        description?: string;
    }>;
    total_unpaid_amount: number;
}

export interface ManualFeeNotificationRequest {
    student_ids?: string[];
    parent_ids?: string[];
    message: string;
    title?: string;
}

export class FeeNotificationService {
    /**
     * Get students with unpaid fees in a campus
     * Admins can dynamically filter by:
     * - class_id: specific class
     * - days_until_due: exact days (e.g., 30 days remaining)
     * - days_until_due_range: range (e.g., 1-30 days remaining)
     */
    public static async getStudentsWithUnpaidFees(
        campusId: string,
        options?: {
            class_id?: string;
            days_until_due?: number; // e.g., 30 = fees due in exactly 30 days (±1 day tolerance)
            days_until_due_range?: { min: number; max: number }; // e.g., {min: 1, max: 30}
        }
    ): Promise<StudentWithUnpaidFees[]> {
        try {
            log(
                `Fetching students with unpaid fees (campus: ${campusId}, filters: ${JSON.stringify(options)})`,
                LogTypes.LOGS,
                "FeeNotificationService"
            );

            // Build query for students
            const studentQuery: Record<string, unknown> = {
                campus_id: campusId,
                user_type: "Student",
                is_active: true,
                is_deleted: false,
            };

            if (options?.class_id) {
                studentQuery.class_id = options.class_id;
            }

            // Get all students
            const studentsResult = await User.find(studentQuery);
            const students = studentsResult.rows || [];

            if (students.length === 0) {
                return [];
            }

            // Get all fee structures for the campus
            const feeStructureQuery: Record<string, unknown> = {
                campus_id: campusId,
                installments_enabled: true,
            };

            if (options?.class_id) {
                feeStructureQuery.class_id = options.class_id;
            }

            const feeStructuresResult = await ClassFeeStructure.find(feeStructureQuery);
            const feeStructures = feeStructuresResult.rows || [];

            // Process each student to find unpaid fees
            const studentsWithUnpaidFees: StudentWithUnpaidFees[] = [];
            const now = new Date();

            for (const student of students) {
                const unpaidInstallments: StudentWithUnpaidFees["unpaid_installments"] = [];

                // Find fee structure for student's class
                const studentFeeStructure = feeStructures.find((fs) => fs.class_id === student.class_id);

                if (!studentFeeStructure || !studentFeeStructure.installments) {
                    continue;
                }

                // Check each installment
                for (const installment of studentFeeStructure.installments) {
                    if (!installment.due_date) {
                        continue;
                    }

                    // Check if paid (compares total paid vs cumulative due)
                    const isPaid = await this.isInstallmentPaid(
                        student.id,
                        studentFeeStructure.id || "",
                        installment.installment_number,
                        installment.amount,
                        studentFeeStructure.installments
                    );

                    if (isPaid) {
                        continue;
                    }

                    // Calculate days until due
                    const dueDate = new Date(installment.due_date);
                    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    // Apply filters
                    if (options?.days_until_due !== undefined) {
                        // Exact match (with 1 day tolerance)
                        if (Math.abs(daysUntilDue - options.days_until_due) > 1) {
                            continue;
                        }
                    }

                    if (options?.days_until_due_range) {
                        // Range filter
                        if (
                            daysUntilDue < options.days_until_due_range.min ||
                            daysUntilDue > options.days_until_due_range.max
                        ) {
                            continue;
                        }
                    }

                    unpaidInstallments.push({
                        fee_structure_id: studentFeeStructure.id || "",
                        class_name: studentFeeStructure.class_name || student.class_id,
                        installment_number: installment.installment_number,
                        amount: installment.amount,
                        due_date: new Date(installment.due_date),
                        days_until_due: daysUntilDue,
                        description: installment.description,
                    });
                }

                // Add student if they have unpaid fees
                if (unpaidInstallments.length > 0) {
                    studentsWithUnpaidFees.push({
                        student,
                        unpaid_installments: unpaidInstallments,
                        total_unpaid_amount: unpaidInstallments.reduce((sum, inst) => sum + inst.amount, 0),
                    });
                }
            }

            log(
                `Found ${studentsWithUnpaidFees.length} students with unpaid fees`,
                LogTypes.LOGS,
                "FeeNotificationService"
            );

            return studentsWithUnpaidFees;
        } catch (error) {
            log(
                `Error fetching students with unpaid fees: ${error instanceof Error ? error.message : "Unknown error"}`,
                LogTypes.ERROR,
                "FeeNotificationService"
            );
            throw error;
        }
    }

    /**
     * Check if an installment has been paid
     * This checks the TOTAL amount paid by student for the fee structure
     * and compares it against the cumulative amount due up to this installment
     */
    private static async isInstallmentPaid(
        studentId: string,
        feeStructureId: string,
        installmentNumber: number,
        installmentAmount: number,
        allInstallments: Array<{ installment_number: number; amount: number }>
    ): Promise<boolean> {
        try {
            // Get ALL payments made by student for this fee structure (regardless of installment_number)
            const paymentResult = await PaymentOrder.find({
                student_id: studentId,
                fee_structure_id: feeStructureId,
                order_status: "PAID",
                is_deleted: false,
            });

            if (!paymentResult.rows || paymentResult.rows.length === 0) {
                log(
                    `No payments found for student ${studentId}, fee_structure ${feeStructureId}`,
                    LogTypes.LOGS,
                    "FeeNotificationService"
                );
                return false; // No payments at all
            }

            // Calculate total amount paid
            const totalPaid = paymentResult.rows.reduce((sum: number, payment: { order_amount?: number }) => {
                return sum + (payment.order_amount || 0);
            }, 0);

            // Calculate cumulative amount due up to this installment
            const sortedInstallments = allInstallments
                .filter((inst) => inst.installment_number <= installmentNumber)
                .sort((a, b) => a.installment_number - b.installment_number);

            const cumulativeDue = sortedInstallments.reduce((sum, inst) => sum + inst.amount, 0);

            // If total paid >= cumulative due, then this installment is covered
            const isPaid = totalPaid >= cumulativeDue;

            log(
                `Payment check for student ${studentId}, installment ${installmentNumber}: TotalPaid=₹${totalPaid}, CumulativeDue=₹${cumulativeDue}, IsPaid=${isPaid}`,
                LogTypes.LOGS,
                "FeeNotificationService"
            );

            return isPaid;
        } catch (error) {
            log(
                `Error checking payment status: ${error instanceof Error ? error.message : "Unknown error"}`,
                LogTypes.ERROR,
                "FeeNotificationService"
            );
            return false; // If error checking, assume unpaid to be safe
        }
    }

    /**
     * Manually send fee notification to selected students and parents
     * Admin/Accountant use this to send custom notifications
     */
    public static async sendManualFeeNotification(
        campusId: string,
        request: ManualFeeNotificationRequest
    ): Promise<{
        success: boolean;
        students_notified: number;
        parents_notified: number;
        total_notified: number;
        errors: string[];
    }> {
        const result = {
            success: false,
            students_notified: 0,
            parents_notified: 0,
            total_notified: 0,
            errors: [] as string[],
        };

        try {
            const title = request.title || "💰 Fee Payment Notification";
            const targetUsers: string[] = [];

            // Collect student IDs
            if (request.student_ids && request.student_ids.length > 0) {
                targetUsers.push(...request.student_ids);
                result.students_notified = request.student_ids.length;
            }

            // Collect parent IDs
            if (request.parent_ids && request.parent_ids.length > 0) {
                targetUsers.push(...request.parent_ids);
                result.parents_notified = request.parent_ids.length;
            }

            if (targetUsers.length === 0) {
                result.errors.push("No students or parents selected");
                return result;
            }

            // Send notification
            const notificationResult = await PushNotificationService.sendToSpecificUsers({
                title,
                message: request.message,
                data: {
                    type: "fee_manual",
                    manual_notification: "true",
                },
                notification_type: "fees",
                campus_id: campusId,
                target_users: targetUsers,
            });

            result.success = notificationResult.success;
            result.total_notified = notificationResult.successful_sends;

            if (!notificationResult.success) {
                result.errors.push(...notificationResult.details.errors);
            }

            log(
                `Manual fee notification sent to ${result.total_notified} users`,
                LogTypes.LOGS,
                "FeeNotificationService"
            );
        } catch (error) {
            const errorMsg = `Error sending manual fee notification: ${error instanceof Error ? error.message : "Unknown error"}`;
            log(errorMsg, LogTypes.ERROR, "FeeNotificationService"
);
            result.errors.push(errorMsg);
        }

        return result;
    }

    /**
     * Get students by class for manual notification selection
     */
    public static async getStudentsByClass(campusId: string, classId: string): Promise<IUser[]> {
        try {
            const studentsResult = await User.find({
                campus_id: campusId,
                class_id: classId,
                user_type: "Student",
                is_active: true,
                is_deleted: false,
            });

            return studentsResult.rows || [];
        } catch (error) {
            log(
                `Error fetching students for class ${classId}: ${error instanceof Error ? error.message : "Unknown error"}`,
                LogTypes.ERROR,
                "FeeNotificationService"
            );
            return [];
        }
    }

    /**
     * Get parents of students for manual notification selection
     */
    public static async getParentsForStudents(studentIds: string[]): Promise<IUser[]> {
        const parents: IUser[] = [];
        const parentIdsSet = new Set<string>();

        for (const studentId of studentIds) {
            try {
                const studentParents = await UserService.getParentForStudent(studentId);
                for (const parent of studentParents) {
                    if (!parentIdsSet.has(parent.id)) {
                        parentIdsSet.add(parent.id);
                        parents.push(parent);
                    }
                }
            } catch (error) {
                log(
                    `Error fetching parents for student ${studentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
                    LogTypes.ERROR,
                    "FeeNotificationService"
                );
            }
        }

        return parents;
    }
}
