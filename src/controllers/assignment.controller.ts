import { Context } from "hono";
import { 
    AssignmentService, 
    AssignmentQueryOptions, 
    AssignmentSubmissionQueryOptions,
    CreateAssignmentRequest,
    BulkAssignmentOperation 
} from "@/services/assignment.service";

const assignmentService = new AssignmentService();

export class AssignmentController {
    /**
     * Get assignments with advanced filtering
     * GET /api/assignments?page=1&limit=20&class_id=123&subject_id=456&search=math
     */
    public static readonly getAssignments = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const query = ctx.req.query();

            const options: AssignmentQueryOptions = {
                campus_id,
                page: query.page ? parseInt(query.page) : undefined,
                limit: query.limit ? parseInt(query.limit) : undefined,
                class_id: query.class_id,
                subject_id: query.subject_id,
                user_id: query.teacher_id,
                is_graded: query.is_graded ? query.is_graded === 'true' : undefined,
                status: query.status as any,
                search: query.search,
                sort_by: query.sort_by as any,
                sort_order: query.sort_order as any,
                due_date_from: query.due_date_from ? new Date(query.due_date_from) : undefined,
                due_date_to: query.due_date_to ? new Date(query.due_date_to) : undefined,
                include_submissions: query.include_submissions === 'true',
                include_class_info: query.include_class_info === 'true',
                include_subject_info: query.include_subject_info === 'true',
                include_creator_info: query.include_creator_info === 'true',
                include_stats: query.include_stats === 'true',
            };

            const result = await assignmentService.getAssignments(options);
            return ctx.json(result);
        } catch (error) {
            console.error("Error in getAssignments:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch assignments", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };

    /**
     * Get assignments for a specific class
     * GET /api/classes/:class_id/assignments
     */
    public static readonly getClassAssignments = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const { class_id } = ctx.req.param();
            const query = ctx.req.query();

            const options: AssignmentQueryOptions = {
                campus_id,
                class_id,
                page: query.page ? parseInt(query.page) : undefined,
                limit: query.limit ? parseInt(query.limit) : undefined,
                search: query.search,
                status: query.status as any,
                include_subject_info: true,
                include_creator_info: true,
                include_stats: query.include_stats === 'true',
            };

            const result = await assignmentService.getAssignments(options);
            return ctx.json(result);
        } catch (error) {
            console.error("Error in getClassAssignments:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch class assignments", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };

    /**
     * Get assignments for a specific teacher
     * GET /api/teachers/my-assignments
     */
    public static readonly getMyAssignments = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const query = ctx.req.query();

            const options: AssignmentQueryOptions = {
                campus_id,
                user_id,
                page: query.page ? parseInt(query.page) : undefined,
                limit: query.limit ? parseInt(query.limit) : undefined,
                search: query.search,
                status: query.status as any,
                include_class_info: true,
                include_subject_info: true,
                include_stats: true,
            };

            const result = await assignmentService.getAssignments(options);
            return ctx.json(result);
        } catch (error) {
            console.error("Error in getMyAssignments:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch teacher assignments", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };

    /**
     * Get assignments for a specific student
     * GET /api/students/my-assignments
     */
    public static readonly getStudentAssignments = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const query = ctx.req.query();

            // First, get student's classes
            // Note: This would need to be implemented in ClassService
            // For now, we'll get assignments from query parameter
            if (!query.class_id) {
                return ctx.json({ error: "Class ID is required for student assignments" }, 400);
            }

            const options: AssignmentQueryOptions = {
                campus_id,
                class_id: query.class_id,
                page: query.page ? parseInt(query.page) : undefined,
                limit: query.limit ? parseInt(query.limit) : undefined,
                include_subject_info: true,
                include_creator_info: true,
                include_stats: false, // Students don't need stats
            };

            const result = await assignmentService.getAssignments(options);
            
            // For each assignment, check if student has submitted
            const assignmentsWithSubmissionStatus = await Promise.all(
                result.assignments.map(async (assignment) => {
                    const submissionOptions: AssignmentSubmissionQueryOptions = {
                        assignment_id: assignment.id,
                        user_id,
                        limit: 1,
                    };
                    const submissions = await assignmentService.getAssignmentSubmissions(submissionOptions);
                    
                    return {
                        ...assignment,
                        student_submission: submissions.submissions[0] || null,
                        is_submitted: submissions.total > 0,
                    };
                })
            );

            return ctx.json({
                ...result,
                assignments: assignmentsWithSubmissionStatus,
            });
        } catch (error) {
            console.error("Error in getStudentAssignments:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch student assignments", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };

    /**
     * Get assignment by ID
     * GET /api/assignments/:assignment_id
     */
    public static readonly getAssignmentById = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const query = ctx.req.query();

            const options: Partial<AssignmentQueryOptions> = {
                include_class_info: true,
                include_subject_info: true,
                include_creator_info: true,
                include_stats: query.include_stats === 'true',
                include_submissions: query.include_submissions === 'true',
            };

            const assignment = await assignmentService.getAssignmentWithRelations(assignment_id, options);
            return ctx.json(assignment);
        } catch (error) {
            console.error("Error in getAssignmentById:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch assignment", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                404
            );
        }
    };

    /**
     * Create new assignment
     * POST /api/assignments
     */
    public static readonly createAssignment = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const assignmentData: CreateAssignmentRequest = await ctx.req.json();

            const assignment = await assignmentService.createAssignment(
                campus_id,
                user_id,
                assignmentData
            );

            return ctx.json(assignment, 201);
        } catch (error) {
            console.error("Error in createAssignment:", error);
            return ctx.json(
                { 
                    error: "Failed to create assignment", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                400
            );
        }
    };

    /**
     * Update assignment
     * PUT /api/assignments/:assignment_id
     */
    public static readonly updateAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const updateData = await ctx.req.json();

            const assignment = await assignmentService.updateAssignment(assignment_id, updateData);
            return ctx.json(assignment);
        } catch (error) {
            console.error("Error in updateAssignment:", error);
            return ctx.json(
                { 
                    error: "Failed to update assignment", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                400
            );
        }
    };

    /**
     * Delete assignment
     * DELETE /api/assignments/:assignment_id
     */
    public static readonly deleteAssignment = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();

            const success = await assignmentService.deleteAssignment(assignment_id);
            
            if (success) {
                return ctx.json({ message: "Assignment deleted successfully" });
            } else {
                return ctx.json({ error: "Failed to delete assignment" }, 400);
            }
        } catch (error) {
            console.error("Error in deleteAssignment:", error);
            return ctx.json(
                { 
                    error: "Failed to delete assignment", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };

    /**
     * Bulk operations on assignments
     * POST /api/assignments/bulk
     */
    public static readonly bulkUpdateAssignments = async (ctx: Context) => {
        try {
            const operation: BulkAssignmentOperation = await ctx.req.json();

            const result = await assignmentService.bulkUpdateAssignments(operation);
            return ctx.json(result);
        } catch (error) {
            console.error("Error in bulkUpdateAssignments:", error);
            return ctx.json(
                { 
                    error: "Failed to perform bulk operation", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                400
            );
        }
    };

    /**
     * Get assignment submissions
     * GET /api/assignments/:assignment_id/submissions
     */
    public static readonly getAssignmentSubmissions = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const query = ctx.req.query();

            const options: AssignmentSubmissionQueryOptions = {
                assignment_id,
                page: query.page ? parseInt(query.page) : undefined,
                limit: query.limit ? parseInt(query.limit) : undefined,
                sort_by: query.sort_by as any,
                sort_order: query.sort_order as any,
                has_grade: query.has_grade ? query.has_grade === 'true' : undefined,
                include_student: true,
                include_assignment: query.include_assignment === 'true',
            };

            const result = await assignmentService.getAssignmentSubmissions(options);
            return ctx.json(result);
        } catch (error) {
            console.error("Error in getAssignmentSubmissions:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch submissions", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };

    /**
     * Create assignment submission
     * POST /api/assignments/:assignment_id/submissions
     */
    public static readonly createAssignmentSubmission = async (ctx: Context) => {
        try {
            const { assignment_id } = ctx.req.param();
            const user_id = ctx.get("user_id");
            const submissionData = await ctx.req.json();

            const submission = await assignmentService.createAssignmentSubmission(
                assignment_id,
                user_id,
                submissionData
            );

            return ctx.json(submission, 201);
        } catch (error) {
            console.error("Error in createAssignmentSubmission:", error);
            return ctx.json(
                { 
                    error: "Failed to create submission", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                400
            );
        }
    };

    /**
     * Get student's submissions
     * GET /api/students/my-submissions
     */
    public static readonly getMySubmissions = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const query = ctx.req.query();

            const options: AssignmentSubmissionQueryOptions = {
                campus_id,
                user_id,
                page: query.page ? parseInt(query.page) : undefined,
                limit: query.limit ? parseInt(query.limit) : undefined,
                include_assignment: true,
                include_class: true,
            };

            const result = await assignmentService.getAssignmentSubmissions(options);
            return ctx.json(result);
        } catch (error) {
            console.error("Error in getMySubmissions:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch submissions", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };

    /**
     * Get assignment statistics for dashboard
     * GET /api/assignments/stats
     */
    public static readonly getAssignmentStats = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const query = ctx.req.query();

            const filters = {
                class_id: query.class_id,
                subject_id: query.subject_id,
                teacher_id: query.teacher_id,
                date_from: query.date_from ? new Date(query.date_from) : undefined,
                date_to: query.date_to ? new Date(query.date_to) : undefined,
            };

            const stats = await assignmentService.getAssignmentStats(campus_id, filters);
            return ctx.json(stats);
        } catch (error) {
            console.error("Error in getAssignmentStats:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch assignment statistics", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };

    /**
     * Get teacher's assignment statistics
     * GET /api/teachers/assignment-stats
     */
    public static readonly getTeacherAssignmentStats = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const query = ctx.req.query();

            const filters = {
                teacher_id: user_id,
                class_id: query.class_id,
                subject_id: query.subject_id,
                date_from: query.date_from ? new Date(query.date_from) : undefined,
                date_to: query.date_to ? new Date(query.date_to) : undefined,
            };

            const stats = await assignmentService.getAssignmentStats(campus_id, filters);
            return ctx.json(stats);
        } catch (error) {
            console.error("Error in getTeacherAssignmentStats:", error);
            return ctx.json(
                { 
                    error: "Failed to fetch teacher assignment statistics", 
                    message: error instanceof Error ? error.message : "Unknown error" 
                }, 
                500
            );
        }
    };
}
