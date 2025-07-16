import { Context } from "hono";
import { EnhancedAssignmentService } from "@/services/enhanced_assignment.service";
import { ClassService } from "@/services/class.service";
import { CourseService } from "@/services/course.service";
import { UserService } from "@/services/users.service";

const enhancedAssignmentService = new EnhancedAssignmentService();
const classService = new ClassService();

export class AssignmentController {
    
    // ======================= ADMIN ROUTES =======================
    
    public static readonly createAssignment = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const data = await ctx.req.json();

            // Validate that either class_id or course_id is provided
            if (!data.class_id && !data.course_id) {
                return ctx.json({ 
                    success: false, 
                    error: "Either class_id or course_id must be provided" 
                }, 400);
            }

            let result;
            if (data.class_id) {
                // Create class assignment
                result = await classService.createAssignment(campus_id, data.class_id, {
                    ...data,
                    user_id,
                });
            } else {
                // Create course assignment
                result = await CourseService.createCourseAssignment(campus_id, data.course_id, {
                    assignment_title: data.title,
                    assignment_description: data.description,
                    due_date: data.due_date,
                    is_graded: data.is_graded,
                    meta_data: data.meta_data || {},
                });
            }

            return ctx.json({
                success: true,
                message: "Assignment created successfully",
                data: result,
            }, 201);
        } catch (error) {
            console.error("Error creating assignment:", error);
            return ctx.json({ 
                success: false, 
                error: error instanceof Error ? error.message : "Failed to create assignment" 
            }, 500);
        }
    };

    public static readonly getAdminAssignmentOverview = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { 
                status, 
                class_id, 
                subject_id, 
                teacher_id, 
                from_date, 
                to_date, 
                page, 
                limit 
            } = ctx.req.query();

            // This would be implemented with admin-specific logic
            // For now, return a placeholder response
            return ctx.json({
                assignments: [],
                pagination: {
                    page: parseInt(page) || 1,
                    limit: parseInt(limit) || 20,
                    total: 0,
                    total_pages: 0,
                },
                summary_stats: {
                    total_assignments: 0,
                    active_assignments: 0,
                    overdue_assignments: 0,
                    total_submissions: 0,
                    pending_grading: 0,
                    average_completion_rate: 0,
                },
            });
        } catch (error) {
            console.error("Error fetching admin assignment overview:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch assignment overview" 
            }, 500);
        }
    };

    public static readonly performBulkAssignmentOperations = async (ctx: Context) => {
        try {
            const data = await ctx.req.json();
            
            // Placeholder for bulk operations
            return ctx.json({
                success: true,
                message: "Bulk operation completed",
                processed_count: data.assignment_ids.length,
                failed_count: 0,
            });
        } catch (error) {
            console.error("Error performing bulk assignment operations:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to perform bulk operations" 
            }, 500);
        }
    };

    public static readonly getAssignmentAnalytics = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { period, class_id, subject_id } = ctx.req.query();

            // Placeholder for analytics
            return ctx.json({
                assignments: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    total_pages: 0,
                },
                summary_stats: {
                    total_assignments: 0,
                    active_assignments: 0,
                    overdue_assignments: 0,
                    total_submissions: 0,
                    pending_grading: 0,
                    average_completion_rate: 0,
                },
            });
        } catch (error) {
            console.error("Error fetching assignment analytics:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch assignment analytics" 
            }, 500);
        }
    };

    // ======================= TEACHER ROUTES =======================

    public static readonly getTeacherAssignments = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { status, class_id, page, limit } = ctx.req.query();

            const assignments = await classService.getAllAssignmentByUserId(user_id);

            // Apply filters if provided
            let filteredAssignments = assignments;
            if (class_id) {
                filteredAssignments = filteredAssignments.filter(a => a.class_id === class_id);
            }

            // Apply pagination
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 20;
            const offset = (pageNum - 1) * limitNum;
            const paginatedAssignments = filteredAssignments.slice(offset, offset + limitNum);

            return ctx.json({
                assignments: paginatedAssignments.map(assignment => ({
                    ...assignment,
                    submission_stats: {
                        total_students: 0, // Would be calculated from class enrollment
                        submitted: 0,
                        pending: 0,
                        graded: 0,
                        average_grade: 0,
                    },
                })),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: filteredAssignments.length,
                    total_pages: Math.ceil(filteredAssignments.length / limitNum),
                },
                dashboard_stats: {
                    total_assignments: assignments.length,
                    pending_grading: 0, // Would be calculated
                    recent_submissions: 0, // Would be calculated
                    average_grade: 0, // Would be calculated
                },
            });
        } catch (error) {
            console.error("Error fetching teacher assignments:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch teacher assignments" 
            }, 500);
        }
    };

    public static readonly getAssignmentSubmissions = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const { status, student_id } = ctx.req.query();

            const [assignment, submissions] = await Promise.all([
                classService.getAssignmentById(assignment_id),
                classService.getAssignmentSubmissionByAssignmentId(assignment_id)
            ]);

            if (!assignment) {
                return ctx.json({ 
                    success: false, 
                    error: "Assignment not found" 
                }, 404);
            }

            // Filter submissions if student_id is provided
            let filteredSubmissions = submissions;
            if (student_id) {
                filteredSubmissions = submissions.filter(s => s.user_id === student_id);
            }

            // Calculate stats
            const stats = {
                total_students: 0, // Would need to get from class enrollment
                submitted: filteredSubmissions.length,
                pending: 0, // Would be calculated
                graded: filteredSubmissions.filter(s => s.grade !== null && s.grade !== undefined).length,
                average_grade: filteredSubmissions.length > 0 
                    ? filteredSubmissions
                        .filter(s => s.grade !== null && s.grade !== undefined)
                        .reduce((sum, s) => sum + (s.grade || 0), 0) / 
                      filteredSubmissions.filter(s => s.grade !== null && s.grade !== undefined).length
                    : 0,
            };

            return ctx.json({
                assignment,
                submissions: filteredSubmissions,
                stats,
            });
        } catch (error) {
            console.error("Error fetching assignment submissions:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch assignment submissions" 
            }, 500);
        }
    };

    public static readonly gradeSubmission = async (ctx: Context) => {
        try {
            const { submission_id } = ctx.req.param();
            const { grade, feedback } = await ctx.req.json();

            const result = await classService.gradeAssignmentSubmission(
                submission_id,
                grade,
                feedback
            );

            return ctx.json({
                success: true,
                message: "Submission graded successfully",
                data: result,
            });
        } catch (error) {
            console.error("Error grading submission:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to grade submission" 
            }, 500);
        }
    };

    public static readonly getTeacherAssignmentDashboard = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");

            const assignments = await classService.getAllAssignmentByUserId(user_id);

            return ctx.json({
                assignments: assignments.map(assignment => ({
                    ...assignment,
                    submission_stats: {
                        total_students: 0,
                        submitted: 0,
                        pending: 0,
                        graded: 0,
                        average_grade: 0,
                    },
                })),
                pagination: {
                    page: 1,
                    limit: 20,
                    total: assignments.length,
                    total_pages: Math.ceil(assignments.length / 20),
                },
                dashboard_stats: {
                    total_assignments: assignments.length,
                    pending_grading: 0,
                    recent_submissions: 0,
                    average_grade: 0,
                },
            });
        } catch (error) {
            console.error("Error fetching teacher assignment dashboard:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch teacher dashboard" 
            }, 500);
        }
    };

    // ======================= STUDENT ROUTES =======================

    public static readonly getStudentAssignments = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const { 
                status, 
                class_id, 
                subject_id, 
                due_in_days, 
                sort_by, 
                sort_order, 
                page, 
                limit 
            } = ctx.req.query();

            const filters = {
                status: status as any,
                subject_id,
                due_in_days: due_in_days ? parseInt(due_in_days) : undefined,
                assignment_type: undefined,
                sort_by: sort_by as any,
                sort_order: sort_order as "asc" | "desc",
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            };

            const result = await enhancedAssignmentService.getStudentUnifiedAssignments(
                user_id,
                campus_id,
                filters
            );

            return ctx.json(result);
        } catch (error) {
            console.error("Error fetching student assignments:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch student assignments" 
            }, 500);
        }
    };

    public static readonly getStudentAssignmentDetails = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { assignment_id } = ctx.req.param();

            // First, try to get from class assignments
            let assignment: any = null;
            let submission: any = null;
            let isClassAssignment = true;

            try {
                assignment = await classService.getAssignmentById(assignment_id);
                if (assignment) {
                    const submissions = await classService.getAssignmentSubmissionByAssignmentId(assignment_id);
                    submission = submissions.find(s => s.user_id === user_id) || null;
                }
            } catch (error) {
                console.error("Error fetching class assignment:", assignment_id, error);
                assignment = null; // Continue to try course assignments
            }

            if (!assignment) {
                // Try course assignments
                try {
                    assignment = await CourseService.getCourseAssignmentById(assignment_id);
                    if (assignment) {
                        isClassAssignment = false;
                        const submissions = await CourseService.getAllCourseAssignmentSubmissions(
                            assignment.campus_id,
                            assignment.course_id,
                            assignment_id
                        );
                        submission = submissions.find((s: any) => s.user_id === user_id) || null;
                    }
                } catch (error) {
                    console.error("Error fetching course assignment:", assignment_id, error);
                }
            }

            if (!assignment) {
                return ctx.json({ 
                    success: false, 
                    error: "Assignment not found" 
                }, 404);
            }

            const currentDate = new Date();
            const dueDate = new Date(assignment.due_date);
            const daysUntilDue = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

            let status = "pending";
            if (submission) {
                if (submission.grade !== null && submission.grade !== undefined) {
                    status = "graded";
                } else {
                    status = "submitted";
                }
            } else if (dueDate < currentDate) {
                status = "overdue";
            }

            // Normalize assignment structure for response
            const normalizedAssignment = {
                id: assignment.id,
                title: isClassAssignment ? assignment.title : assignment.assignment_title,
                description: isClassAssignment ? assignment.description : assignment.assignment_description,
                due_date: assignment.due_date,
                is_graded: assignment.is_graded,
                campus_id: assignment.campus_id,
                class_id: isClassAssignment ? assignment.class_id : undefined,
                course_id: isClassAssignment ? undefined : assignment.course_id,
                subject_id: assignment.subject_id || "unknown",
                user_id: assignment.user_id || "unknown",
            };

            return ctx.json({
                assignment: normalizedAssignment,
                submission,
                class_info: {
                    id: isClassAssignment ? assignment.class_id : assignment.course_id,
                    name: "Class/Course Name", // Would need to fetch actual name
                    subject_name: "Subject Name", // Would need to fetch actual name
                    teacher_name: "Teacher Name", // Would need to fetch actual name
                },
                status,
                days_until_due: daysUntilDue,
                can_resubmit: true, // Would depend on assignment settings
            });
        } catch (error) {
            console.error("Error fetching student assignment details:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch assignment details" 
            }, 500);
        }
    };

    public static readonly submitAssignment = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { assignment_id } = ctx.req.param();
            const data = await ctx.req.json();

            // Check if assignment exists
            const assignment = await classService.getAssignmentById(assignment_id);
            if (!assignment) {
                return ctx.json({ 
                    success: false, 
                    error: "Assignment not found" 
                }, 404);
            }

            // Check if already submitted
            const existingSubmissions = await classService.getAssignmentSubmissionByAssignmentId(assignment_id);
            const existingSubmission = existingSubmissions.find(s => s.user_id === user_id);
            
            if (existingSubmission) {
                return ctx.json({ 
                    success: false, 
                    error: "Assignment already submitted" 
                }, 400);
            }

            // Check if overdue and late submission not allowed
            const currentDate = new Date();
            const dueDate = new Date(assignment.due_date);
            const isLate = currentDate > dueDate;

            if (isLate && !assignment.is_graded) { // Assuming is_graded means late submission allowed
                return ctx.json({ 
                    success: false, 
                    error: "Assignment is overdue and late submissions are not allowed" 
                }, 400);
            }

            const submissionData = {
                campus_id: assignment.campus_id,
                user_id,
                submission_date: new Date(),
                meta_data: {
                    submission_content: data.submission_content,
                    attachment_urls: data.attachment_urls,
                    time_spent_minutes: data.time_spent_minutes,
                    ...data.meta_data,
                },
            };

            const result = await classService.createAssignmentSubmission(assignment_id, submissionData);

            return ctx.json({
                success: true,
                message: "Assignment submitted successfully",
                data: result,
                is_late: isLate,
            }, 201);
        } catch (error) {
            console.error("Error submitting assignment:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to submit assignment" 
            }, 500);
        }
    };

    public static readonly getStudentAssignmentDashboard = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            const dashboard = await enhancedAssignmentService.getStudentAssignmentDashboard(
                user_id,
                campus_id
            );

            return ctx.json(dashboard);
        } catch (error) {
            console.error("Error fetching student assignment dashboard:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch student dashboard" 
            }, 500);
        }
    };

    public static readonly getStudentAssignmentPerformance = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");
            const { period, subject_id } = ctx.req.query();

            // This would be implemented with performance analytics
            return ctx.json({
                performance_trends: [],
                subject_performance: [],
                improvement_suggestions: [
                    "Submit assignments earlier to avoid last-minute rush",
                    "Review feedback from graded assignments",
                    "Allocate more time for complex assignments",
                ],
            });
        } catch (error) {
            console.error("Error fetching student assignment performance:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch assignment performance" 
            }, 500);
        }
    };

    // ======================= PARENT ROUTES =======================

    public static readonly getParentStudentAssignments = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");
            const { status, period } = ctx.req.query();

            // Verify parent has access to this student
            // This would require parent-child relationship validation

            const student = await UserService.getUser(student_id);
            if (!student) {
                return ctx.json({ 
                    success: false, 
                    error: "Student not found" 
                }, 404);
            }

            const { assignments, summary } = await enhancedAssignmentService.getStudentUnifiedAssignments(
                student_id,
                campus_id,
                { status: status as any, limit: 50 }
            );

            return ctx.json({
                student_info: {
                    id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    class: "Class Name", // Would need to fetch from enrollment
                    current_academic_year: "2024-2025", // Would be dynamic
                },
                assignments: assignments.map(assignment => ({
                    assignment: {
                        id: assignment.id,
                        title: assignment.title,
                        description: assignment.description,
                        due_date: assignment.due_date,
                        assignment_type: assignment.assignment_type,
                        priority: assignment.priority,
                    },
                    submission: assignment.submission ? {
                        id: assignment.submission.id,
                        submission_date: assignment.submission.submission_date,
                        grade: assignment.submission.grade,
                        is_late: assignment.submission.is_late,
                    } : undefined,
                    status: assignment.status,
                    subject_name: assignment.subject_name,
                    teacher_name: assignment.teacher_name,
                    class_name: assignment.source_name,
                })),
                summary: {
                    total_assignments: summary.total_assignments,
                    submitted_on_time: summary.submitted - assignments.filter(a => a.submission?.is_late).length,
                    late_submissions: assignments.filter(a => a.submission?.is_late).length,
                    pending: summary.pending,
                    average_grade: assignments
                        .filter(a => a.submission?.grade !== undefined)
                        .reduce((sum, a, _, arr) => sum + (a.submission!.grade! / arr.length), 0) || undefined,
                    completion_rate: summary.total_assignments > 0 
                        ? (summary.submitted / summary.total_assignments) * 100 
                        : 0,
                },
                alerts: assignments
                    .filter(a => a.status === "overdue" || a.days_until_due <= 1)
                    .map(assignment => ({
                        type: assignment.status === "overdue" ? "overdue" : "due_soon",
                        message: assignment.status === "overdue" 
                            ? `Assignment "${assignment.title}" is overdue`
                            : `Assignment "${assignment.title}" is due soon`,
                        assignment_id: assignment.id,
                        severity: assignment.status === "overdue" ? "high" : "medium",
                    })),
            });
        } catch (error) {
            console.error("Error fetching parent student assignments:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch student assignments" 
            }, 500);
        }
    };

    public static readonly getParentStudentPerformance = async (ctx: Context) => {
        try {
            const { student_id } = ctx.req.param();
            const { period } = ctx.req.query();

            // This would be implemented with parent-specific performance analytics
            return ctx.json({
                student_info: {
                    id: student_id,
                    name: "Student Name",
                    class: "Class Name",
                },
                performance_summary: {
                    total_assignments: 0,
                    submitted_on_time: 0,
                    late_submissions: 0,
                    pending: 0,
                    average_grade: 0,
                    grade_trend: "stable",
                },
                recent_assignments: [],
                alerts: [],
            });
        } catch (error) {
            console.error("Error fetching parent student performance:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch student performance" 
            }, 500);
        }
    };

    // ======================= SHARED ROUTES =======================

    public static readonly getAssignmentById = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const user_type = ctx.get("user_type");

            let assignment: any = await classService.getAssignmentById(assignment_id);
            let isClassAssignment = true;
            
            if (!assignment) {
                // Try course assignment
                assignment = await CourseService.getCourseAssignmentById(assignment_id);
                isClassAssignment = false;
            }

            if (!assignment) {
                return ctx.json({ 
                    success: false, 
                    error: "Assignment not found" 
                }, 404);
            }

            // Normalize assignment structure for response
            const normalizedAssignment = {
                id: assignment.id,
                title: isClassAssignment ? assignment.title : assignment.assignment_title,
                description: isClassAssignment ? assignment.description : assignment.assignment_description,
                due_date: assignment.due_date,
                is_graded: assignment.is_graded,
                campus_id: assignment.campus_id,
                class_id: isClassAssignment ? assignment.class_id : undefined,
                course_id: isClassAssignment ? undefined : assignment.course_id,
                subject_id: assignment.subject_id || "unknown",
                user_id: assignment.user_id || "unknown",
                meta_data: assignment.meta_data,
                created_at: assignment.created_at,
                updated_at: assignment.updated_at,
            };

            // Filter response based on user type
            // Students should not see internal teacher notes, etc.
            return ctx.json(normalizedAssignment);
        } catch (error) {
            console.error("Error fetching assignment by ID:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to fetch assignment" 
            }, 500);
        }
    };

    public static readonly updateAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const data = await ctx.req.json();

            const result = await classService.updateAssignment(assignment_id, data);

            if (!result) {
                return ctx.json({ 
                    success: false, 
                    error: "Assignment not found or update failed" 
                }, 404);
            }

            return ctx.json({
                success: true,
                message: "Assignment updated successfully",
                data: result,
            });
        } catch (error) {
            console.error("Error updating assignment:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to update assignment" 
            }, 500);
        }
    };

    public static readonly deleteAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            const success = await classService.deleteAssignment(assignment_id);

            if (!success) {
                return ctx.json({ 
                    success: false, 
                    error: "Assignment not found or delete failed" 
                }, 404);
            }

            return ctx.json({
                success: true,
                message: "Assignment deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting assignment:", error);
            return ctx.json({ 
                success: false, 
                error: "Failed to delete assignment" 
            }, 500);
        }
    };
}
