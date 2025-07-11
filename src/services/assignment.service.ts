import { Assignment, IAssignmentData } from "@/models/assignment.model";
import {
    AssignmentSubmission,
    IAssignmentSubmission,
} from "@/models/assignment_submission.model";
import { IClassData, Class } from "@/models/class.model";
import { ISubject, Subject } from "@/models/subject.model";
import { IUser } from "@/models/user.model";
import { UserService } from "./users.service";
import { TeacherService } from "./teacher.service";

export interface AssignmentQueryOptions {
    // Filtering options
    campus_id?: string;
    class_id?: string;
    subject_id?: string;
    user_id?: string; // Creator/teacher ID
    is_graded?: boolean;
    status?: 'draft' | 'published' | 'archived';
    
    // Date filtering
    due_date_from?: Date;
    due_date_to?: Date;
    created_from?: Date;
    created_to?: Date;
    
    // Pagination
    page?: number;
    limit?: number;
    
    // Sorting
    sort_by?: 'title' | 'due_date' | 'created_at' | 'updated_at';
    sort_order?: 'ASC' | 'DESC';
    
    // Search
    search?: string; // Search in title and description
    
    // Include related data
    include_submissions?: boolean;
    include_class_info?: boolean;
    include_subject_info?: boolean;
    include_creator_info?: boolean;
    include_stats?: boolean;
}

export interface AssignmentSubmissionQueryOptions {
    // Filtering options
    campus_id?: string;
    assignment_id?: string;
    user_id?: string;
    class_id?: string;
    
    // Grade filtering
    min_grade?: number;
    max_grade?: number;
    has_grade?: boolean;
    has_feedback?: boolean;
    
    // Date filtering
    submitted_from?: Date;
    submitted_to?: Date;
    
    // Pagination
    page?: number;
    limit?: number;
    
    // Sorting
    sort_by?: 'submission_date' | 'grade' | 'created_at';
    sort_order?: 'ASC' | 'DESC';
    
    // Include related data
    include_assignment?: boolean;
    include_student?: boolean;
    include_class?: boolean;
}

export interface AssignmentWithRelations extends IAssignmentData {
    class_info?: IClassData;
    subject_info?: ISubject;
    creator_info?: IUser;
    submissions?: IAssignmentSubmission[];
    stats?: {
        total_submissions: number;
        pending_submissions: number;
        graded_submissions: number;
        average_grade: number;
        students_count: number;
        submission_rate: number;
    };
}

export interface AssignmentSubmissionWithRelations extends IAssignmentSubmission {
    assignment?: IAssignmentData;
    student?: IUser;
    class_info?: IClassData;
}

export interface BulkAssignmentOperation {
    assignment_ids: string[];
    action: 'archive' | 'publish' | 'delete' | 'update_due_date';
    data?: {
        due_date?: Date;
        status?: string;
        [key: string]: any;
    };
}

export interface CreateAssignmentRequest {
    title: string;
    description: string;
    due_date: Date;
    subject_id: string;
    class_id: string;
    is_graded?: boolean;
    status?: 'draft' | 'published';
    meta_data?: object;
    // Bulk assignment to multiple classes
    additional_class_ids?: string[];
    // Assignment template
    template_id?: string;
}

export class AssignmentService {
    /**
     * Create a new assignment with enhanced features
     */
    public async createAssignment(
        campus_id: string,
        creator_user_id: string,
        assignmentData: CreateAssignmentRequest
    ): Promise<AssignmentWithRelations> {
        try {
            // Validate required data
            await this.validateAssignmentCreation(campus_id, assignmentData);

            const baseAssignment = {
                campus_id,
                user_id: creator_user_id,
                title: assignmentData.title,
                description: assignmentData.description,
                due_date: assignmentData.due_date,
                subject_id: assignmentData.subject_id,
                class_id: assignmentData.class_id,
                is_graded: assignmentData.is_graded ?? true,
                meta_data: {
                    ...assignmentData.meta_data,
                    status: assignmentData.status ?? 'published',
                    template_id: assignmentData.template_id,
                },
                created_at: new Date(),
                updated_at: new Date(),
            };

            // Create primary assignment
            const assignment = await Assignment.create(baseAssignment);

            // Create assignments for additional classes if specified
            if (assignmentData.additional_class_ids?.length) {
                const additionalAssignments = await Promise.all(
                    assignmentData.additional_class_ids.map(class_id =>
                        Assignment.create({
                            ...baseAssignment,
                            class_id,
                            meta_data: {
                                ...baseAssignment.meta_data,
                                parent_assignment_id: assignment.id,
                            },
                        })
                    )
                );
                console.log(`Created ${additionalAssignments.length} additional assignments`);
            }

            return await this.getAssignmentWithRelations(assignment.id, {
                include_class_info: true,
                include_subject_info: true,
                include_creator_info: true,
            });
        } catch (error) {
            console.error("Error creating assignment:", error);
            throw error;
        }
    }

    /**
     * Get assignments with advanced filtering and relations
     */
    public async getAssignments(
        options: AssignmentQueryOptions = {}
    ): Promise<{
        assignments: AssignmentWithRelations[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }> {
        try {
            const {
                page = 1,
                limit = 20,
                sort_by = 'created_at',
                sort_order = 'DESC',
                search,
                ...filters
            } = options;

            // Build query filters
            const query: any = {};
            
            if (filters.campus_id) query.campus_id = filters.campus_id;
            if (filters.class_id) query.class_id = filters.class_id;
            if (filters.subject_id) query.subject_id = filters.subject_id;
            if (filters.user_id) query.user_id = filters.user_id;
            if (filters.is_graded !== undefined) query.is_graded = filters.is_graded;

            // Date range filters
            if (filters.due_date_from || filters.due_date_to) {
                query.due_date = {};
                if (filters.due_date_from) query.due_date.$gte = filters.due_date_from;
                if (filters.due_date_to) query.due_date.$lte = filters.due_date_to;
            }

            // Status filter (stored in meta_data)
            if (filters.status) {
                query['meta_data.status'] = filters.status;
            }

            // Search functionality
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Get assignments with pagination
            const result: { rows: IAssignmentData[] } = await Assignment.find(
                query,
                {
                    sort: { [sort_by]: sort_order },
                    limit: limit,
                    skip: (page - 1) * limit,
                }
            );

            // Get total count for pagination
            const totalResult: { rows: IAssignmentData[] } = await Assignment.find(query);
            const total = totalResult.rows.length;

            // Enhance assignments with relations
            const enhancedAssignments = await Promise.all(
                result.rows.map(assignment =>
                    this.enhanceAssignmentWithRelations(assignment, options)
                )
            );

            return {
                assignments: enhancedAssignments,
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            };
        } catch (error) {
            console.error("Error fetching assignments:", error);
            throw error;
        }
    }

    /**
     * Get single assignment with relations
     */
    public async getAssignmentWithRelations(
        assignment_id: string,
        options: Partial<AssignmentQueryOptions> = {}
    ): Promise<AssignmentWithRelations> {
        try {
            const assignment = await Assignment.findById(assignment_id);
            if (!assignment) {
                throw new Error("Assignment not found");
            }

            return await this.enhanceAssignmentWithRelations(assignment, options);
        } catch (error) {
            console.error("Error fetching assignment with relations:", error);
            throw error;
        }
    }

    /**
     * Update assignment with validation
     */
    public async updateAssignment(
        assignment_id: string,
        updateData: Partial<IAssignmentData>
    ): Promise<AssignmentWithRelations> {
        try {
            // Validate assignment exists
            const existingAssignment = await Assignment.findById(assignment_id);
            if (!existingAssignment) {
                throw new Error("Assignment not found");
            }

            // Update the assignment
            const updatedAssignment = await Assignment.findOneAndUpdate(
                { id: assignment_id },
                {
                    ...updateData,
                    updated_at: new Date(),
                },
                { new: true }
            );

            if (!updatedAssignment) {
                throw new Error("Failed to update assignment");
            }

            return await this.getAssignmentWithRelations(assignment_id, {
                include_class_info: true,
                include_subject_info: true,
                include_stats: true,
            });
        } catch (error) {
            console.error("Error updating assignment:", error);
            throw error;
        }
    }

    /**
     * Delete assignment (soft delete)
     */
    public async deleteAssignment(assignment_id: string): Promise<boolean> {
        try {
            // Check if assignment has submissions
            const submissions = await this.getAssignmentSubmissions({
                assignment_id,
                limit: 1,
            });

            if (submissions.total > 0) {
                // Soft delete - mark as archived instead of hard delete
                await Assignment.findOneAndUpdate(
                    { id: assignment_id },
                    {
                        meta_data: { status: 'archived', archived_at: new Date() },
                        updated_at: new Date(),
                    }
                );
                return true;
            } else {
                // Hard delete if no submissions
                await Assignment.findByIdAndDelete(assignment_id);
                return true;
            }
        } catch (error) {
            console.error("Error deleting assignment:", error);
            return false;
        }
    }

    /**
     * Bulk operations on assignments
     */
    public async bulkUpdateAssignments(
        operation: BulkAssignmentOperation
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const assignment_id of operation.assignment_ids) {
            try {
                switch (operation.action) {
                    case 'archive':
                        await Assignment.findOneAndUpdate(
                            { id: assignment_id },
                            {
                                meta_data: { status: 'archived', archived_at: new Date() },
                                updated_at: new Date(),
                            }
                        );
                        break;
                    case 'publish':
                        await Assignment.findOneAndUpdate(
                            { id: assignment_id },
                            {
                                meta_data: { status: 'published' },
                                updated_at: new Date(),
                            }
                        );
                        break;
                    case 'update_due_date':
                        if (operation.data?.due_date) {
                            await Assignment.findOneAndUpdate(
                                { id: assignment_id },
                                {
                                    due_date: operation.data.due_date,
                                    updated_at: new Date(),
                                }
                            );
                        }
                        break;
                    case 'delete':
                        await this.deleteAssignment(assignment_id);
                        break;
                }
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(`Assignment ${assignment_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return results;
    }

    /**
     * Get assignment submissions with advanced filtering
     */
    public async getAssignmentSubmissions(
        options: AssignmentSubmissionQueryOptions = {}
    ): Promise<{
        submissions: AssignmentSubmissionWithRelations[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }> {
        try {
            const {
                page = 1,
                limit = 20,
                sort_by = 'submission_date',
                sort_order = 'DESC',
                ...filters
            } = options;

            // Build query filters
            const query: any = {};
            
            if (filters.campus_id) query.campus_id = filters.campus_id;
            if (filters.assignment_id) query.assignment_id = filters.assignment_id;
            if (filters.user_id) query.user_id = filters.user_id;

            // Grade filtering
            if (filters.min_grade !== undefined || filters.max_grade !== undefined) {
                query.grade = {};
                if (filters.min_grade !== undefined) query.grade.$gte = filters.min_grade;
                if (filters.max_grade !== undefined) query.grade.$lte = filters.max_grade;
            }

            if (filters.has_grade !== undefined) {
                query.grade = filters.has_grade ? { $gt: 0 } : { $eq: 0 };
            }

            if (filters.has_feedback !== undefined) {
                query.feedback = filters.has_feedback ? { $ne: '' } : { $eq: '' };
            }

            // Date range filters
            if (filters.submitted_from || filters.submitted_to) {
                query.submission_date = {};
                if (filters.submitted_from) query.submission_date.$gte = filters.submitted_from;
                if (filters.submitted_to) query.submission_date.$lte = filters.submitted_to;
            }

            // Get submissions with pagination
            const result: { rows: IAssignmentSubmission[] } = await AssignmentSubmission.find(
                query,
                {
                    sort: { [sort_by]: sort_order },
                    limit: limit,
                    skip: (page - 1) * limit,
                }
            );

            // Get total count
            const totalResult: { rows: IAssignmentSubmission[] } = await AssignmentSubmission.find(query);
            const total = totalResult.rows.length;

            // Enhance submissions with relations
            const enhancedSubmissions = await Promise.all(
                result.rows.map(submission =>
                    this.enhanceSubmissionWithRelations(submission, options)
                )
            );

            return {
                submissions: enhancedSubmissions,
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            };
        } catch (error) {
            console.error("Error fetching assignment submissions:", error);
            throw error;
        }
    }

    /**
     * Create assignment submission
     */
    public async createAssignmentSubmission(
        assignment_id: string,
        user_id: string,
        submissionData: Partial<IAssignmentSubmission>
    ): Promise<AssignmentSubmissionWithRelations> {
        try {
            // Validate assignment exists and is accessible
            const assignment = await Assignment.findById(assignment_id);
            if (!assignment) {
                throw new Error("Assignment not found");
            }

            // Check if submission already exists
            const existingSubmissions = await AssignmentSubmission.find({
                assignment_id,
                user_id,
            });

            if (existingSubmissions.rows.length > 0) {
                throw new Error("Submission already exists for this assignment");
            }

            const submission = await AssignmentSubmission.create({
                campus_id: assignment.campus_id,
                assignment_id,
                user_id,
                submission_date: new Date(),
                grade: submissionData.grade ?? 0,
                feedback: submissionData.feedback ?? '',
                meta_data: submissionData.meta_data ?? {},
                created_at: new Date(),
                updated_at: new Date(),
            });

            return await this.enhanceSubmissionWithRelations(submission, {
                include_assignment: true,
                include_student: true,
            });
        } catch (error) {
            console.error("Error creating assignment submission:", error);
            throw error;
        }
    }

    /**
     * Get assignment statistics for dashboard
     */
    public async getAssignmentStats(
        campus_id: string,
        filters: {
            class_id?: string;
            subject_id?: string;
            teacher_id?: string;
            date_from?: Date;
            date_to?: Date;
        } = {}
    ): Promise<{
        total_assignments: number;
        active_assignments: number;
        overdue_assignments: number;
        total_submissions: number;
        pending_grading: number;
        average_submission_rate: number;
        upcoming_deadlines: AssignmentWithRelations[];
        recent_assignments: AssignmentWithRelations[];
    }> {
        try {
            const query: any = { campus_id };
            if (filters.class_id) query.class_id = filters.class_id;
            if (filters.subject_id) query.subject_id = filters.subject_id;
            if (filters.teacher_id) query.user_id = filters.teacher_id;

            // Get all assignments matching criteria
            const assignmentsResult: { rows: IAssignmentData[] } = await Assignment.find(query);
            const assignments = assignmentsResult.rows;

            const now = new Date();
            const total_assignments = assignments.length;
            const active_assignments = assignments.filter(a => 
                (a.meta_data as any)?.status !== 'archived' && a.due_date > now
            ).length;
            const overdue_assignments = assignments.filter(a => 
                (a.meta_data as any)?.status !== 'archived' && a.due_date <= now
            ).length;

            // Get submission statistics
            const submissionsResult: { rows: IAssignmentSubmission[] } = await AssignmentSubmission.find({
                campus_id,
            });
            const submissions = submissionsResult.rows;

            const total_submissions = submissions.length;
            const pending_grading = submissions.filter(s => s.grade === 0).length;

            // Calculate average submission rate
            let totalSubmissionRate = 0;
            for (const assignment of assignments) {
                const assignmentSubmissions = submissions.filter(s => s.assignment_id === assignment.id);
                // This would need class student count for accurate calculation
                // For now, using a simplified calculation
                totalSubmissionRate += assignmentSubmissions.length;
            }
            const average_submission_rate = assignments.length > 0 
                ? (totalSubmissionRate / assignments.length) * 100 
                : 0;

            // Get upcoming deadlines (next 7 days)
            const weekFromNow = new Date();
            weekFromNow.setDate(now.getDate() + 7);
            
            const upcomingAssignments = assignments
                .filter(a => a.due_date > now && a.due_date <= weekFromNow)
                .sort((a, b) => a.due_date.getTime() - b.due_date.getTime())
                .slice(0, 5);

            const upcoming_deadlines = await Promise.all(
                upcomingAssignments.map(a => this.enhanceAssignmentWithRelations(a, {
                    include_class_info: true,
                    include_subject_info: true,
                }))
            );

            // Get recent assignments (last 5)
            const recentAssignments = assignments
                .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
                .slice(0, 5);

            const recent_assignments = await Promise.all(
                recentAssignments.map(a => this.enhanceAssignmentWithRelations(a, {
                    include_class_info: true,
                    include_subject_info: true,
                }))
            );

            return {
                total_assignments,
                active_assignments,
                overdue_assignments,
                total_submissions,
                pending_grading,
                average_submission_rate,
                upcoming_deadlines,
                recent_assignments,
            };
        } catch (error) {
            console.error("Error fetching assignment stats:", error);
            throw error;
        }
    }

    // Private helper methods

    private async validateAssignmentCreation(
        campus_id: string,
        assignmentData: CreateAssignmentRequest
    ): Promise<void> {
        // Validate class exists
        const classData = await Class.findById(assignmentData.class_id);
        if (!classData || classData.campus_id !== campus_id) {
            throw new Error("Invalid class for this campus");
        }

        // Validate subject exists
        const subject = await Subject.findById(assignmentData.subject_id);
        if (!subject || subject.campus_id !== campus_id) {
            throw new Error("Invalid subject for this campus");
        }

        // Validate due date is in the future
        if (assignmentData.due_date <= new Date()) {
            throw new Error("Due date must be in the future");
        }
    }

    private async enhanceAssignmentWithRelations(
        assignment: IAssignmentData,
        options: Partial<AssignmentQueryOptions>
    ): Promise<AssignmentWithRelations> {
        const enhanced: AssignmentWithRelations = { ...assignment };

        try {
            // Include class info
            if (options.include_class_info) {
                enhanced.class_info = await Class.findById(assignment.class_id) || undefined;
            }

            // Include subject info
            if (options.include_subject_info) {
                enhanced.subject_info = await Subject.findById(assignment.subject_id) || undefined;
            }

            // Include creator info
            if (options.include_creator_info) {
                enhanced.creator_info = await UserService.getUser(assignment.user_id) || undefined;
            }

            // Include submissions
            if (options.include_submissions) {
                const submissionsResult = await AssignmentSubmission.find({
                    assignment_id: assignment.id,
                });
                enhanced.submissions = submissionsResult.rows;
            }

            // Include stats
            if (options.include_stats) {
                enhanced.stats = await this.calculateAssignmentStats(assignment.id);
            }
        } catch (error) {
            console.warn("Error enhancing assignment with relations:", error);
        }

        return enhanced;
    }

    private async enhanceSubmissionWithRelations(
        submission: IAssignmentSubmission,
        options: Partial<AssignmentSubmissionQueryOptions>
    ): Promise<AssignmentSubmissionWithRelations> {
        const enhanced: AssignmentSubmissionWithRelations = { ...submission };

        try {
            // Include assignment info
            if (options.include_assignment) {
                enhanced.assignment = await Assignment.findById(submission.assignment_id) || undefined;
            }

            // Include student info
            if (options.include_student) {
                enhanced.student = await UserService.getUser(submission.user_id) || undefined;
            }

            // Include class info
            if (options.include_class && enhanced.assignment) {
                enhanced.class_info = await Class.findById(enhanced.assignment.class_id) || undefined;
            }
        } catch (error) {
            console.warn("Error enhancing submission with relations:", error);
        }

        return enhanced;
    }

    private async calculateAssignmentStats(assignment_id: string): Promise<{
        total_submissions: number;
        pending_submissions: number;
        graded_submissions: number;
        average_grade: number;
        students_count: number;
        submission_rate: number;
    }> {
        try {
            // Get assignment to find class
            const assignment = await Assignment.findById(assignment_id);
            if (!assignment) {
                throw new Error("Assignment not found");
            }

            // Get class to find student count
            const classData = await Class.findById(assignment.class_id);
            const students_count = classData?.student_count || 0;

            // Get submissions
            const submissionsResult = await AssignmentSubmission.find({
                assignment_id,
            });
            const submissions = submissionsResult.rows;

            const total_submissions = submissions.length;
            const graded_submissions = submissions.filter(s => s.grade > 0).length;
            const pending_submissions = total_submissions - graded_submissions;
            
            const average_grade = graded_submissions > 0 
                ? submissions
                    .filter(s => s.grade > 0)
                    .reduce((sum, s) => sum + s.grade, 0) / graded_submissions
                : 0;

            const submission_rate = students_count > 0 
                ? (total_submissions / students_count) * 100 
                : 0;

            return {
                total_submissions,
                pending_submissions,
                graded_submissions,
                average_grade,
                students_count,
                submission_rate,
            };
        } catch (error) {
            console.error("Error calculating assignment stats:", error);
            return {
                total_submissions: 0,
                pending_submissions: 0,
                graded_submissions: 0,
                average_grade: 0,
                students_count: 0,
                submission_rate: 0,
            };
        }
    }
}
