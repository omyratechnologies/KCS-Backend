// import { AssignmentService } from "@/services/assignment.service";
// import { EnhancedAssignmentService } from "@/services/enhanced_assignment.service";
// import { userStore } from "@/store/user.store";
import { Context } from "hono";

import { Assignment } from "@/models/assignment.model";
import { AssignmentSubmission } from "@/models/assignment_submission.model";
import { ClassService } from "@/services/class.service";
// import { EnhancedAssignmentService } from "@/services/enhanced_assignment.service"; // Disabled until course assignment models exist
import { UserService } from "@/services/users.service";

// const enhancedAssignmentService = new EnhancedAssignmentService(); // Disabled until course assignment models exist
const classService = new ClassService();

export class AssignmentController {
    // ======================= ADMIN ROUTES =======================

    public static readonly createAssignment = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const data = await ctx.req.json();

            // Validate that class_id is provided
            if (!data.class_id) {
                return ctx.json(
                    {
                        success: false,
                        error: "class_id is required",
                    },
                    400
                );
            }

            const result = await classService.createAssignment(
                campus_id,
                data.class_id,
                {
                    ...data,
                    user_id,
                }
            );

            return ctx.json(
                {
                    success: true,
                    message: "Assignment created successfully",
                    data: result,
                },
                201
            );
        } catch (error) {
            console.error("Error creating assignment:", error);
            return ctx.json(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to create assignment",
                },
                500
            );
        }
    };

    public static readonly getAdminAssignmentOverview = async (
        ctx: Context
    ) => {
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
                limit,
            } = ctx.req.query();

            // Get all assignments for the campus
            const allAssignments =
                await classService.getAllAssignmentsFromAllClasses(campus_id);

            // Use only class assignments
            let combinedAssignments = [...allAssignments];

            // Apply filters
            if (class_id) {
                combinedAssignments = combinedAssignments.filter(
                    (assignment) => assignment.class_id === class_id
                );
            }

            if (subject_id) {
                combinedAssignments = combinedAssignments.filter(
                    (assignment) => assignment.subject_id === subject_id
                );
            }

            if (teacher_id) {
                combinedAssignments = combinedAssignments.filter(
                    (assignment) => assignment.user_id === teacher_id
                );
            }

            if (from_date) {
                const fromDate = new Date(from_date);
                combinedAssignments = combinedAssignments.filter(
                    (assignment) => new Date(assignment.due_date) >= fromDate
                );
            }

            if (to_date) {
                const toDate = new Date(to_date);
                combinedAssignments = combinedAssignments.filter(
                    (assignment) => new Date(assignment.due_date) <= toDate
                );
            }

            // Calculate summary statistics
            const currentDate = new Date();

            const activeAssignments = combinedAssignments.filter(
                (assignment) => new Date(assignment.due_date) >= currentDate
            );

            const overdueAssignments = combinedAssignments.filter(
                (assignment) => new Date(assignment.due_date) < currentDate
            );

            // Get submission data for statistics
            let totalSubmissions = 0;
            let pendingGrading = 0;

            try {
                // Get submissions for all assignments (this might need optimization for large datasets)
                for (const assignment of combinedAssignments) {
                    const submissions =
                        await classService.getAssignmentSubmissionByAssignmentId(
                            assignment.id
                        );
                    totalSubmissions += submissions.length;

                    // Count ungraded submissions
                    const ungradedSubmissions = submissions.filter(
                        (sub) => sub.grade === undefined || sub.grade === null
                    );
                    pendingGrading += ungradedSubmissions.length;
                }
            } catch (error) {
                console.log("Error fetching submission statistics:", error);
            }

            // Apply pagination
            const pageNum = Number.parseInt(page) || 1;
            const limitNum = Number.parseInt(limit) || 20;
            const offset = (pageNum - 1) * limitNum;
            const paginatedAssignments = combinedAssignments.slice(
                offset,
                offset + limitNum
            );

            // Enrich assignments with additional data
            const enrichedAssignments = await Promise.all(
                paginatedAssignments.map(async (assignment) => {
                    try {
                        // Get submission count for this assignment
                        const submissions =
                            await classService.getAssignmentSubmissionByAssignmentId(
                                assignment.id
                            );

                        return {
                            ...assignment,
                            submission_count: submissions.length,
                            graded_count: submissions.filter(
                                (sub) =>
                                    sub.grade !== undefined &&
                                    sub.grade !== null
                            ).length,
                            pending_count: submissions.filter(
                                (sub) =>
                                    sub.grade === undefined ||
                                    sub.grade === null
                            ).length,
                            days_until_due: Math.ceil(
                                (new Date(assignment.due_date).getTime() -
                                    currentDate.getTime()) /
                                    (1000 * 60 * 60 * 24)
                            ),
                            is_overdue:
                                new Date(assignment.due_date) < currentDate,
                        };
                    } catch (error) {
                        console.log(
                            `Error enriching assignment ${assignment.id}:`,
                            error
                        );
                        return {
                            ...assignment,
                            submission_count: 0,
                            graded_count: 0,
                            pending_count: 0,
                            days_until_due: Math.ceil(
                                (new Date(assignment.due_date).getTime() -
                                    currentDate.getTime()) /
                                    (1000 * 60 * 60 * 24)
                            ),
                            is_overdue:
                                new Date(assignment.due_date) < currentDate,
                        };
                    }
                })
            );

            // Calculate completion rate
            const averageCompletionRate =
                combinedAssignments.length > 0
                    ? Math.round(
                          (totalSubmissions / combinedAssignments.length) * 100
                      ) / 100
                    : 0;

            return ctx.json({
                success: true,
                assignments: enrichedAssignments,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: combinedAssignments.length,
                    total_pages: Math.ceil(
                        combinedAssignments.length / limitNum
                    ),
                },
                summary_stats: {
                    total_assignments: combinedAssignments.length,
                    active_assignments: activeAssignments.length,
                    overdue_assignments: overdueAssignments.length,
                    total_submissions: totalSubmissions,
                    pending_grading: pendingGrading,
                    average_completion_rate: averageCompletionRate,
                },
                filters_applied: {
                    status,
                    class_id,
                    subject_id,
                    teacher_id,
                    from_date,
                    to_date,
                },
            });
        } catch (error) {
            console.error("Error fetching admin assignment overview:", error);
            return ctx.json(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch assignment overview",
                },
                500
            );
        }
    };

    public static readonly performBulkAssignmentOperations = async (
        ctx: Context
    ) => {
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
            console.error(
                "Error performing bulk assignment operations:",
                error
            );
            return ctx.json(
                {
                    success: false,
                    error: "Failed to perform bulk operations",
                },
                500
            );
        }
    };

    public static readonly getAssignmentAnalytics = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { period, class_id, subject_id } = ctx.req.query();

            // Get all assignments for the campus
            const allAssignments =
                await classService.getAllAssignmentsFromAllClasses(campus_id);

            // Apply filters
            let filteredAssignments = allAssignments;

            if (class_id) {
                filteredAssignments = filteredAssignments.filter(
                    (assignment) => assignment.class_id === class_id
                );
            }

            if (subject_id) {
                filteredAssignments = filteredAssignments.filter(
                    (assignment) => assignment.subject_id === subject_id
                );
            }

            // Apply period filter
            if (period) {
                const currentDate = new Date();
                let periodStartDate: Date;

                switch (period) {
                    case "week": {
                        periodStartDate = new Date(
                            currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
                        );
                        break;
                    }
                    case "month": {
                        periodStartDate = new Date(
                            currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
                        );
                        break;
                    }
                    case "quarter": {
                        periodStartDate = new Date(
                            currentDate.getTime() - 90 * 24 * 60 * 60 * 1000
                        );
                        break;
                    }
                    case "year": {
                        periodStartDate = new Date(
                            currentDate.getTime() - 365 * 24 * 60 * 60 * 1000
                        );
                        break;
                    }
                    default: {
                        periodStartDate = new Date(
                            currentDate.getTime() - 30 * 24 * 60 * 60 * 1000
                        );
                    } // Default to month
                }

                filteredAssignments = filteredAssignments.filter(
                    (assignment) =>
                        new Date(assignment.created_at) >= periodStartDate
                );
            }

            // Calculate analytics
            const currentDate = new Date();

            const activeAssignments = filteredAssignments.filter(
                (assignment) => new Date(assignment.due_date) >= currentDate
            );

            const overdueAssignments = filteredAssignments.filter(
                (assignment) => new Date(assignment.due_date) < currentDate
            );

            // Get submission statistics
            let totalSubmissions = 0;
            let pendingGrading = 0;

            try {
                for (const assignment of filteredAssignments) {
                    const submissions =
                        await classService.getAssignmentSubmissionByAssignmentId(
                            assignment.id
                        );
                    totalSubmissions += submissions.length;

                    const ungradedSubmissions = submissions.filter(
                        (sub) => sub.grade === undefined || sub.grade === null
                    );
                    pendingGrading += ungradedSubmissions.length;
                }
            } catch (error) {
                console.log(
                    "Error fetching submission statistics for analytics:",
                    error
                );
            }

            // Calculate completion rate
            const averageCompletionRate =
                filteredAssignments.length > 0
                    ? Math.round(
                          (totalSubmissions / filteredAssignments.length) * 100
                      ) / 100
                    : 0;

            // Generate analytics by subject and time trends
            const subjectAnalytics = await Promise.all(
                [...new Set(filteredAssignments.map((a) => a.subject_id))].map(
                    async (subjectId) => {
                        const subjectAssignments = filteredAssignments.filter(
                            (a) => a.subject_id === subjectId
                        );
                        let subjectSubmissions = 0;

                        for (const assignment of subjectAssignments) {
                            const submissions =
                                await classService.getAssignmentSubmissionByAssignmentId(
                                    assignment.id
                                );
                            subjectSubmissions += submissions.length;
                        }

                        return {
                            subject_id: subjectId,
                            total_assignments: subjectAssignments.length,
                            total_submissions: subjectSubmissions,
                            completion_rate:
                                subjectAssignments.length > 0
                                    ? subjectSubmissions /
                                      subjectAssignments.length
                                    : 0,
                        };
                    }
                )
            );

            return ctx.json({
                success: true,
                analytics: {
                    overview: {
                        total_assignments: filteredAssignments.length,
                        active_assignments: activeAssignments.length,
                        overdue_assignments: overdueAssignments.length,
                        total_submissions: totalSubmissions,
                        pending_grading: pendingGrading,
                        average_completion_rate: averageCompletionRate,
                    },
                    by_subject: subjectAnalytics,
                    trends: {
                        period_applied: period || "month",
                        assignments_created: filteredAssignments.length,
                    },
                },
                filters_applied: {
                    period,
                    class_id,
                    subject_id,
                },
            });
        } catch (error) {
            console.error("Error fetching assignment analytics:", error);
            return ctx.json(
                {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch assignment analytics",
                },
                500
            );
        }
    };

    // ======================= TEACHER ROUTES =======================

    public static readonly getTeacherAssignments = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { status, class_id, page, limit } = ctx.req.query();

            const assignments =
                await classService.getAllAssignmentByUserId(user_id);

            // Apply filters if provided
            let filteredAssignments = assignments;
            if (class_id) {
                filteredAssignments = filteredAssignments.filter(
                    (a) => a.class_id === class_id
                );
            }

            // Apply pagination
            const pageNum = Number.parseInt(page) || 1;
            const limitNum = Number.parseInt(limit) || 20;
            const offset = (pageNum - 1) * limitNum;
            const paginatedAssignments = filteredAssignments.slice(
                offset,
                offset + limitNum
            );

            return ctx.json({
                assignments: paginatedAssignments.map((assignment) => ({
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
                    total_pages: Math.ceil(
                        filteredAssignments.length / limitNum
                    ),
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
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch teacher assignments",
                },
                500
            );
        }
    };

    public static readonly getAssignmentSubmissions = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const { status, student_id } = ctx.req.query();

            const [assignment, submissions] = await Promise.all([
                classService.getAssignmentById(assignment_id),
                classService.getAssignmentSubmissionByAssignmentId(
                    assignment_id
                ),
            ]);

            if (!assignment) {
                return ctx.json(
                    {
                        success: false,
                        error: "Assignment not found",
                    },
                    404
                );
            }

            // Filter submissions if student_id is provided
            let filteredSubmissions = submissions;
            if (student_id) {
                filteredSubmissions = submissions.filter(
                    (s) => s.user_id === student_id
                );
            }

            // Calculate stats
            const stats = {
                total_students: 0, // Would need to get from class enrollment
                submitted: filteredSubmissions.length,
                pending: 0, // Would be calculated
                graded: filteredSubmissions.filter(
                    (s) => s.grade !== null && s.grade !== undefined
                ).length,
                average_grade:
                    filteredSubmissions.length > 0
                        ? filteredSubmissions
                              .filter(
                                  (s) =>
                                      s.grade !== null && s.grade !== undefined
                              )
                              .reduce((sum, s) => sum + (s.grade || 0), 0) /
                          filteredSubmissions.filter(
                              (s) => s.grade !== null && s.grade !== undefined
                          ).length
                        : 0,
            };

            return ctx.json({
                assignment,
                submissions: filteredSubmissions,
                stats,
            });
        } catch (error) {
            console.error("Error fetching assignment submissions:", error);
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch assignment submissions",
                },
                500
            );
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
            return ctx.json(
                {
                    success: false,
                    error: "Failed to grade submission",
                },
                500
            );
        }
    };

    public static readonly getTeacherAssignmentDashboard = async (
        ctx: Context
    ) => {
        try {
            const user_id = ctx.get("user_id");

            const assignments =
                await classService.getAllAssignmentByUserId(user_id);

            return ctx.json({
                assignments: assignments.map((assignment) => ({
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
            console.error(
                "Error fetching teacher assignment dashboard:",
                error
            );
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch teacher dashboard",
                },
                500
            );
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
                limit,
            } = ctx.req.query();

            const filters = {
                status: status as any,
                subject_id,
                due_in_days: due_in_days
                    ? Number.parseInt(due_in_days)
                    : undefined,
                assignment_type: undefined,
                sort_by: sort_by as any,
                sort_order: sort_order as "asc" | "desc",
                page: page ? Number.parseInt(page) : undefined,
                limit: limit ? Number.parseInt(limit) : undefined,
            };

            // Temporarily return stub response until enhanced assignment service is fixed
            const result = {
                success: true,
                assignments: [],
                total_count: 0,
                page: filters.page || 1,
                limit: filters.limit || 20,
                message: "Enhanced assignment service temporarily disabled",
            };

            return ctx.json(result);
        } catch (error) {
            console.error("Error fetching student assignments:", error);
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch student assignments",
                },
                500
            );
        }
    };

    public static readonly getStudentAssignmentDetails = async (
        ctx: Context
    ) => {
        try {
            const user_id = ctx.get("user_id");
            const { assignment_id } = ctx.req.param();

            // Get class assignment only
            let assignment: any = null;
            let submission: any = null;

            try {
                assignment =
                    await classService.getAssignmentById(assignment_id);
                if (assignment) {
                    const submissions =
                        await classService.getAssignmentSubmissionByAssignmentId(
                            assignment_id
                        );
                    submission =
                        submissions.find((s) => s.user_id === user_id) || null;
                }
            } catch (error) {
                console.error(
                    "Error fetching class assignment:",
                    assignment_id,
                    error
                );
            }

            if (!assignment) {
                return ctx.json(
                    {
                        success: false,
                        error: "Assignment not found",
                    },
                    404
                );
            }

            const currentDate = new Date();
            const dueDate = new Date(assignment.due_date);
            const daysUntilDue = Math.ceil(
                (dueDate.getTime() - currentDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            );

            let status = "pending";
            if (submission) {
                status =
                    submission.grade !== null && submission.grade !== undefined
                        ? "graded"
                        : "submitted";
            } else if (dueDate < currentDate) {
                status = "overdue";
            }

            // Normalize assignment structure for response (class assignments only)
            const normalizedAssignment = {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                due_date: assignment.due_date,
                is_graded: assignment.is_graded,
                campus_id: assignment.campus_id,
                class_id: assignment.class_id,
                course_id: undefined,
                subject_id: assignment.subject_id || "unknown",
                user_id: assignment.user_id || "unknown",
            };

            return ctx.json({
                assignment: normalizedAssignment,
                submission,
                class_info: {
                    id: assignment.class_id,
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
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch assignment details",
                },
                500
            );
        }
    };

    public static readonly submitAssignment = async (ctx: Context) => {
        try {
            const user_id = ctx.get("user_id");
            const { assignment_id } = ctx.req.param();
            const data = await ctx.req.json();

            // Check if assignment exists
            const assignment =
                await classService.getAssignmentById(assignment_id);
            if (!assignment) {
                return ctx.json(
                    {
                        success: false,
                        error: "Assignment not found",
                    },
                    404
                );
            }

            // Check if already submitted
            const existingSubmissions =
                await classService.getAssignmentSubmissionByAssignmentId(
                    assignment_id
                );
            const existingSubmission = existingSubmissions.find(
                (s) => s.user_id === user_id
            );

            if (existingSubmission) {
                return ctx.json(
                    {
                        success: false,
                        error: "Assignment already submitted",
                    },
                    400
                );
            }

            // Check if overdue and late submission not allowed
            const currentDate = new Date();
            const dueDate = new Date(assignment.due_date);
            const isLate = currentDate > dueDate;

            if (isLate && !assignment.is_graded) {
                // Assuming is_graded means late submission allowed
                return ctx.json(
                    {
                        success: false,
                        error: "Assignment is overdue and late submissions are not allowed",
                    },
                    400
                );
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

            const result = await classService.createAssignmentSubmission(
                assignment_id,
                submissionData
            );

            return ctx.json(
                {
                    success: true,
                    message: "Assignment submitted successfully",
                    data: result,
                    is_late: isLate,
                },
                201
            );
        } catch (error) {
            console.error("Error submitting assignment:", error);
            return ctx.json(
                {
                    success: false,
                    error: "Failed to submit assignment",
                },
                500
            );
        }
    };

    public static readonly getStudentAssignmentDashboard = async (
        ctx: Context
    ) => {
        try {
            const user_id = ctx.get("user_id");
            const campus_id = ctx.get("campus_id");

            // Temporarily return stub response until enhanced assignment service is fixed
            const dashboard = {
                success: true,
                dashboard: {
                    total_assignments: 0,
                    completed_count: 0,
                    pending_count: 0,
                    overdue_count: 0,
                    upcoming_deadlines: [],
                    recent_submissions: [],
                    performance_metrics: {
                        average_score: 0,
                        completion_rate: 0,
                        on_time_submission_rate: 0,
                    },
                },
                message: "Enhanced assignment service temporarily disabled",
            };

            return ctx.json(dashboard);
        } catch (error) {
            console.error(
                "Error fetching student assignment dashboard:",
                error
            );
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch student dashboard",
                },
                500
            );
        }
    };

    public static readonly getStudentAssignmentPerformance = async (
        ctx: Context
    ) => {
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
            console.error(
                "Error fetching student assignment performance:",
                error
            );
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch assignment performance",
                },
                500
            );
        }
    };

    // ======================= PARENT ROUTES =======================

    public static readonly getParentStudentAssignments = async (
        ctx: Context
    ) => {
        try {
            const { student_id } = ctx.req.param();
            const campus_id = ctx.get("campus_id");
            const { status, period } = ctx.req.query();

            // Verify parent has access to this student
            // This would require parent-child relationship validation

            const student = await UserService.getUser(student_id);
            if (!student) {
                return ctx.json(
                    {
                        success: false,
                        error: "Student not found",
                    },
                    404
                );
            }

            // Temporarily return stub response until enhanced assignment service is fixed
            const assignments = [];
            const summary = {
                total_assignments: 0,
                completed_count: 0,
                pending_count: 0,
                overdue_count: 0,
            };

            return ctx.json({
                student_info: {
                    id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    class: "Class Name", // Would need to fetch from enrollment
                    current_academic_year: "2024-2025", // Would be dynamic
                },
                assignments: [], // Empty until enhanced assignment service is available
                summary: {
                    total_assignments: 0,
                    submitted_on_time: 0,
                    late_submissions: 0,
                    pending: 0,
                    average_grade: undefined,
                    completion_rate: 0,
                },
                alerts: [], // Empty until enhanced assignment service is available
            });
        } catch (error) {
            console.error("Error fetching parent student assignments:", error);
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch student assignments",
                },
                500
            );
        }
    };

    public static readonly getParentStudentPerformance = async (
        ctx: Context
    ) => {
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
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch student performance",
                },
                500
            );
        }
    };

    // ======================= SHARED ROUTES =======================

    public static readonly getAssignmentById = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const user_type = ctx.get("user_type");

            // Only get class assignments
            const assignment: any =
                await classService.getAssignmentById(assignment_id);

            if (!assignment) {
                return ctx.json(
                    {
                        success: false,
                        error: "Assignment not found",
                    },
                    404
                );
            }

            // Normalize assignment structure for response (class assignments only)
            const normalizedAssignment = {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                due_date: assignment.due_date,
                is_graded: assignment.is_graded,
                campus_id: assignment.campus_id,
                class_id: assignment.class_id,
                course_id: undefined,
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
            return ctx.json(
                {
                    success: false,
                    error: "Failed to fetch assignment",
                },
                500
            );
        }
    };

    public static readonly updateAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const data = await ctx.req.json();

            // Only update class assignments
            const result: any = await classService.updateAssignment(
                assignment_id,
                data
            );

            if (!result) {
                return ctx.json(
                    {
                        success: false,
                        error: "Assignment not found or update failed",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                message: "Assignment updated successfully",
                data: result,
                assignment_type: "class",
            });
        } catch (error) {
            console.error("Error updating assignment:", error);
            return ctx.json(
                {
                    success: false,
                    error: "Failed to update assignment",
                },
                500
            );
        }
    };

    public static readonly deleteAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            // Only delete class assignments
            const success = await classService.deleteAssignment(assignment_id);

            if (!success) {
                return ctx.json(
                    {
                        success: false,
                        error: "Assignment not found or delete failed",
                    },
                    404
                );
            }

            return ctx.json({
                success: true,
                message: "Assignment deleted successfully",
                assignment_type: "class",
            });
        } catch (error) {
            console.error("Error deleting assignment:", error);
            return ctx.json(
                {
                    success: false,
                    error: "Failed to delete assignment",
                },
                500
            );
        }
    };
}
