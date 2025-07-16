import { 
    EnhancedAssignment, 
    EnhancedAssignmentSubmission,
    IEnhancedAssignmentData,
    IEnhancedAssignmentSubmissionData 
} from "@/models/enhanced_assignment.model";
import { Assignment, IAssignmentData } from "@/models/assignment.model";
import { AssignmentSubmission, IAssignmentSubmission } from "@/models/assignment_submission.model";
import { CourseAssignment, ICourseAssignmentData } from "@/models/course_assignment.model";
import { CourseAssignmentSubmission, ICourseAssignmentSubmissionData } from "@/models/course_assignment_submission.model";
import { Class, IClassData } from "@/models/class.model";
import { CourseEnrollment } from "@/models/course_enrollment.model";
import { Course } from "@/models/course.model";
import { Subject } from "@/models/subject.model";
import { UserService } from "./users.service";
import { TeacherService } from "./teacher.service";

export interface IUnifiedAssignmentView {
    id: string;
    title: string;
    description: string;
    instructions?: string;
    due_date: Date;
    max_score?: number;
    is_graded: boolean;
    allow_late_submission: boolean;
    priority: "low" | "medium" | "high";
    assignment_type: "homework" | "project" | "quiz" | "exam" | "presentation";
    estimated_duration_minutes?: number;
    attachment_urls?: string[];
    
    // Context information
    source_type: "class" | "course";
    source_id: string; // class_id or course_id
    source_name: string; // class name or course name
    subject_id: string;
    subject_name: string;
    teacher_id: string;
    teacher_name: string;
    
    // Student-specific information
    submission?: IUnifiedSubmissionView;
    status: "pending" | "submitted" | "graded" | "overdue" | "due_soon";
    days_until_due: number;
    priority_score: number; // Calculated priority for sorting
    
    // Metadata
    created_at: Date;
    updated_at: Date;
}

export interface IUnifiedSubmissionView {
    id: string;
    submission_date: Date;
    submission_content?: string;
    attachment_urls?: string[];
    grade?: number;
    feedback?: string;
    is_late: boolean;
    attempt_number: number;
    time_spent_minutes?: number;
    graded_by?: string;
    graded_date?: Date;
}

export interface IStudentAssignmentDashboard {
    upcoming_assignments: Array<{
        assignment: IUnifiedAssignmentView;
        urgency: "critical" | "high" | "medium" | "low";
    }>;
    overdue_assignments: IUnifiedAssignmentView[];
    recent_grades: Array<{
        assignment: IUnifiedAssignmentView;
        grade: number;
        feedback?: string;
        graded_date: Date;
    }>;
    due_today: IUnifiedAssignmentView[];
    due_this_week: IUnifiedAssignmentView[];
    statistics: {
        total_assignments: number;
        submitted: number;
        pending: number;
        overdue: number;
        graded: number;
        average_grade?: number;
        completion_rate: number;
        on_time_submission_rate: number;
    };
    performance_by_subject: Array<{
        subject_id: string;
        subject_name: string;
        total_assignments: number;
        completion_rate: number;
        average_grade?: number;
        trend: "improving" | "declining" | "stable";
    }>;
}

export class EnhancedAssignmentService {
    
    /**
     * Get all assignments for a student across their class and enrolled courses
     */
    public async getStudentUnifiedAssignments(
        student_id: string,
        campus_id: string,
        filters?: {
            status?: "pending" | "submitted" | "graded" | "overdue" | "due_soon" | "all";
            subject_id?: string;
            due_in_days?: number;
            assignment_type?: string;
            sort_by?: "due_date" | "priority" | "created_date" | "subject";
            sort_order?: "asc" | "desc";
            page?: number;
            limit?: number;
        }
    ): Promise<{
        assignments: IUnifiedAssignmentView[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
        summary: {
            total_assignments: number;
            pending: number;
            submitted: number;
            graded: number;
            overdue: number;
            due_today: number;
            due_this_week: number;
        };
    }> {
        try {
            const page = filters?.page || 1;
            const limit = filters?.limit || 20;
            const offset = (page - 1) * limit;

            // Get student's class
            const studentClasses: { rows: IClassData[] } = await Class.find({
                campus_id,
                student_ids: student_id,
                is_active: true,
                is_deleted: false,
            });

            // Get student's course enrollments
            const courseEnrollments: { rows: any[] } = await CourseEnrollment.find({
                campus_id,
                user_id: student_id,
                is_active: true,
                is_deleted: false,
            });

            const enrolledCourseIds = courseEnrollments.rows.map(enrollment => enrollment.course_id);

            let allAssignments: IUnifiedAssignmentView[] = [];

            // Get class assignments
            for (const classData of studentClasses.rows) {
                const classAssignments = await this.getClassAssignmentsForStudent(
                    student_id,
                    classData.id,
                    campus_id,
                    filters
                );
                allAssignments = allAssignments.concat(classAssignments);
            }

            // Get course assignments
            for (const courseId of enrolledCourseIds) {
                const courseAssignments = await this.getCourseAssignmentsForStudent(
                    student_id,
                    courseId,
                    campus_id,
                    filters
                );
                allAssignments = allAssignments.concat(courseAssignments);
            }

            // Apply filters
            let filteredAssignments = allAssignments;

            if (filters?.status && filters.status !== "all") {
                filteredAssignments = filteredAssignments.filter(assignment => 
                    assignment.status === filters.status
                );
            }

            if (filters?.subject_id) {
                filteredAssignments = filteredAssignments.filter(assignment => 
                    assignment.subject_id === filters.subject_id
                );
            }

            if (filters?.due_in_days) {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + filters.due_in_days);
                filteredAssignments = filteredAssignments.filter(assignment => 
                    assignment.due_date <= futureDate && assignment.due_date >= new Date()
                );
            }

            if (filters?.assignment_type) {
                filteredAssignments = filteredAssignments.filter(assignment => 
                    assignment.assignment_type === filters.assignment_type
                );
            }

            // Sort assignments
            this.sortAssignments(filteredAssignments, filters?.sort_by, filters?.sort_order);

            // Calculate summary statistics
            const summary = this.calculateAssignmentSummary(allAssignments);

            // Apply pagination
            const total = filteredAssignments.length;
            const paginatedAssignments = filteredAssignments.slice(offset, offset + limit);

            return {
                assignments: paginatedAssignments,
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                },
                summary,
            };
        } catch (error) {
            console.error("Error fetching student unified assignments:", error);
            throw error;
        }
    }

    /**
     * Get student assignment dashboard with comprehensive overview
     */
    public async getStudentAssignmentDashboard(
        student_id: string,
        campus_id: string
    ): Promise<IStudentAssignmentDashboard> {
        try {
            // Get all assignments
            const { assignments } = await this.getStudentUnifiedAssignments(
                student_id,
                campus_id,
                { limit: 1000 } // Get all assignments for dashboard
            );

            const currentDate = new Date();
            const todayEnd = new Date(currentDate);
            todayEnd.setHours(23, 59, 59, 999);
            
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 7);

            // Categorize assignments
            const upcomingAssignments = assignments
                .filter(a => a.status === "pending" && a.due_date > currentDate)
                .slice(0, 10)
                .map(assignment => ({
                    assignment,
                    urgency: this.calculateUrgency(assignment) as "critical" | "high" | "medium" | "low"
                }));

            const overdueAssignments = assignments
                .filter(a => a.status === "overdue")
                .slice(0, 10);

            const recentGrades = assignments
                .filter(a => a.status === "graded" && a.submission?.graded_date)
                .sort((a, b) => new Date(b.submission!.graded_date!).getTime() - new Date(a.submission!.graded_date!).getTime())
                .slice(0, 5)
                .map(assignment => ({
                    assignment,
                    grade: assignment.submission!.grade!,
                    feedback: assignment.submission?.feedback,
                    graded_date: assignment.submission!.graded_date!,
                }));

            const dueToday = assignments.filter(a => 
                a.status === "pending" && 
                a.due_date >= currentDate && 
                a.due_date <= todayEnd
            );

            const dueThisWeek = assignments.filter(a => 
                a.status === "pending" && 
                a.due_date > todayEnd && 
                a.due_date <= weekEnd
            );

            // Calculate statistics
            const statistics = this.calculateDetailedStatistics(assignments);

            // Calculate performance by subject
            const performanceBySubject = this.calculatePerformanceBySubject(assignments);

            return {
                upcoming_assignments: upcomingAssignments,
                overdue_assignments: overdueAssignments,
                recent_grades: recentGrades,
                due_today: dueToday,
                due_this_week: dueThisWeek,
                statistics,
                performance_by_subject: performanceBySubject,
            };
        } catch (error) {
            console.error("Error fetching student assignment dashboard:", error);
            throw error;
        }
    }

    /**
     * Get class assignments for a student
     */
    private async getClassAssignmentsForStudent(
        student_id: string,
        class_id: string,
        campus_id: string,
        filters?: any
    ): Promise<IUnifiedAssignmentView[]> {
        try {
            // Get class assignments (both legacy and enhanced)
            const [legacyAssignments, enhancedAssignments, classData] = await Promise.all([
                Assignment.find({
                    campus_id,
                    class_id,
                    is_active: true,
                    is_deleted: false,
                }).catch(error => {
                    console.error("Error fetching legacy assignments:", error);
                    return { rows: [] };
                }),
                EnhancedAssignment.find({
                    campus_id,
                    class_id,
                    is_active: true,
                    is_deleted: false,
                }).catch(error => {
                    console.error("Error fetching enhanced assignments:", error);
                    return { rows: [] };
                }),
                Class.findById(class_id).catch(error => {
                    console.error("Error fetching class by ID:", class_id, error);
                    return null;
                })
            ]);

            if (!classData) {
                console.warn(`Class not found for ID: ${class_id}`);
                return [];
            }

            const unifiedAssignments: IUnifiedAssignmentView[] = [];

            // Process legacy assignments
            for (const assignment of legacyAssignments.rows) {
                try {
                    const unifiedAssignment = await this.convertLegacyClassAssignmentToUnified(
                        assignment,
                        student_id,
                        classData,
                        "class"
                    );
                    if (unifiedAssignment) {
                        unifiedAssignments.push(unifiedAssignment);
                    }
                } catch (error) {
                    console.error("Error converting legacy assignment:", assignment.id, error);
                }
            }

            // Process enhanced assignments
            for (const assignment of enhancedAssignments.rows) {
                try {
                    const unifiedAssignment = await this.convertEnhancedAssignmentToUnified(
                        assignment,
                        student_id,
                        classData,
                        "class"
                    );
                    if (unifiedAssignment) {
                        unifiedAssignments.push(unifiedAssignment);
                    }
                } catch (error) {
                    console.error("Error converting enhanced assignment:", assignment.id, error);
                }
            }

            return unifiedAssignments;
        } catch (error) {
            console.error("Error fetching class assignments for student:", error);
            return [];
        }
    }

    /**
     * Get course assignments for a student
     */
    private async getCourseAssignmentsForStudent(
        student_id: string,
        course_id: string,
        campus_id: string,
        filters?: any
    ): Promise<IUnifiedAssignmentView[]> {
        try {
            // Get course assignments (both legacy and enhanced)
            const [legacyAssignments, enhancedAssignments, courseData] = await Promise.all([
                CourseAssignment.find({
                    campus_id,
                    course_id,
                    is_active: true,
                    is_deleted: false,
                }).catch(error => {
                    console.error("Error fetching legacy course assignments:", error);
                    return { rows: [] };
                }),
                EnhancedAssignment.find({
                    campus_id,
                    course_id,
                    is_active: true,
                    is_deleted: false,
                }).catch(error => {
                    console.error("Error fetching enhanced course assignments:", error);
                    return { rows: [] };
                }),
                Course.findById(course_id).catch(error => {
                    console.error("Error fetching course by ID:", course_id, error);
                    return null;
                })
            ]);

            if (!courseData) {
                console.warn(`Course not found for ID: ${course_id}`);
                return [];
            }

            const unifiedAssignments: IUnifiedAssignmentView[] = [];

            // Process legacy course assignments
            for (const assignment of legacyAssignments.rows) {
                try {
                    const unifiedAssignment = await this.convertLegacyCourseAssignmentToUnified(
                        assignment,
                        student_id,
                        courseData,
                        "course"
                    );
                    if (unifiedAssignment) {
                        unifiedAssignments.push(unifiedAssignment);
                    }
                } catch (error) {
                    console.error("Error converting legacy course assignment:", assignment.id, error);
                }
            }

            // Process enhanced assignments
            for (const assignment of enhancedAssignments.rows) {
                try {
                    const unifiedAssignment = await this.convertEnhancedAssignmentToUnified(
                        assignment,
                        student_id,
                        courseData,
                        "course"
                    );
                    if (unifiedAssignment) {
                        unifiedAssignments.push(unifiedAssignment);
                    }
                } catch (error) {
                    console.error("Error converting enhanced course assignment:", assignment.id, error);
                }
            }

            return unifiedAssignments;
        } catch (error) {
            console.error("Error fetching course assignments for student:", error);
            return [];
        }
    }

    /**
     * Convert legacy class assignment to unified format
     */
    private async convertLegacyClassAssignmentToUnified(
        assignment: IAssignmentData,
        student_id: string,
        classData: IClassData,
        source_type: "class" | "course"
    ): Promise<IUnifiedAssignmentView | null> {
        try {
            // Get submission if exists
            const submissions: { rows: IAssignmentSubmission[] } = await AssignmentSubmission.find({
                assignment_id: assignment.id,
                user_id: student_id,
            });

            const submission = submissions.rows[0];

            // Get subject and teacher info
            const [subjectData, teacherData] = await Promise.all([
                Subject.findById(assignment.subject_id),
                TeacherService.getTeacherById(assignment.user_id)
            ]);

            const status = this.calculateAssignmentStatus(assignment.due_date, submission);
            const daysUntilDue = this.calculateDaysUntilDue(assignment.due_date);

            return {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                instructions: assignment.description, // Legacy assignments don't have separate instructions
                due_date: assignment.due_date,
                max_score: undefined, // Legacy assignments don't have max_score
                is_graded: assignment.is_graded,
                allow_late_submission: false, // Legacy default
                priority: "medium", // Legacy default
                assignment_type: "homework", // Legacy default
                estimated_duration_minutes: undefined,
                attachment_urls: [],
                
                source_type,
                source_id: assignment.class_id,
                source_name: classData.name,
                subject_id: assignment.subject_id,
                subject_name: subjectData?.name || "Unknown Subject",
                teacher_id: assignment.user_id,
                teacher_name: teacherData ? `${teacherData.teacher_profile.first_name} ${teacherData.teacher_profile.last_name}` : "Unknown Teacher",
                
                submission: submission ? this.convertLegacySubmissionToUnified(submission) : undefined,
                status,
                days_until_due: daysUntilDue,
                priority_score: this.calculatePriorityScore(assignment.due_date, "medium", status),
                
                created_at: assignment.created_at,
                updated_at: assignment.updated_at,
            };
        } catch (error) {
            console.error("Error converting legacy class assignment:", error);
            return null;
        }
    }

    /**
     * Convert legacy course assignment to unified format
     */
    private async convertLegacyCourseAssignmentToUnified(
        assignment: ICourseAssignmentData,
        student_id: string,
        courseData: any,
        source_type: "class" | "course"
    ): Promise<IUnifiedAssignmentView | null> {
        try {
            // Get submission if exists
            const submissions: { rows: ICourseAssignmentSubmissionData[] } = await CourseAssignmentSubmission.find({
                assignment_id: assignment.id,
                user_id: student_id,
            });

            const submission = submissions.rows[0];

            const status = this.calculateAssignmentStatus(assignment.due_date, submission);
            const daysUntilDue = this.calculateDaysUntilDue(assignment.due_date);

            return {
                id: assignment.id,
                title: assignment.assignment_title,
                description: assignment.assignment_description,
                instructions: assignment.assignment_description,
                due_date: assignment.due_date,
                max_score: undefined,
                is_graded: assignment.is_graded,
                allow_late_submission: false,
                priority: "medium",
                assignment_type: "homework",
                estimated_duration_minutes: undefined,
                attachment_urls: [],
                
                source_type,
                source_id: assignment.course_id,
                source_name: courseData?.title || "Unknown Course",
                subject_id: courseData?.subject_id || "unknown",
                subject_name: "Course Assignment", // Course assignments might not have direct subject
                teacher_id: "unknown",
                teacher_name: "Course Instructor",
                
                submission: submission ? this.convertLegacyCourseSubmissionToUnified(submission) : undefined,
                status,
                days_until_due: daysUntilDue,
                priority_score: this.calculatePriorityScore(assignment.due_date, "medium", status),
                
                created_at: assignment.created_at,
                updated_at: assignment.updated_at,
            };
        } catch (error) {
            console.error("Error converting legacy course assignment:", error);
            return null;
        }
    }

    /**
     * Convert enhanced assignment to unified format
     */
    private async convertEnhancedAssignmentToUnified(
        assignment: IEnhancedAssignmentData,
        student_id: string,
        sourceData: any,
        source_type: "class" | "course"
    ): Promise<IUnifiedAssignmentView | null> {
        try {
            // Get submission if exists
            const submissions: { rows: IEnhancedAssignmentSubmissionData[] } = await EnhancedAssignmentSubmission.find({
                assignment_id: assignment.id,
                user_id: student_id,
            });

            const submission = submissions.rows[0];

            // Get subject and teacher info
            const [subjectData, teacherData] = await Promise.all([
                Subject.findById(assignment.subject_id),
                TeacherService.getTeacherById(assignment.user_id)
            ]);

            const status = this.calculateAssignmentStatus(assignment.due_date, submission);
            const daysUntilDue = this.calculateDaysUntilDue(assignment.due_date);

            return {
                id: assignment.id,
                title: assignment.title,
                description: assignment.description,
                instructions: assignment.instructions,
                due_date: assignment.due_date,
                max_score: assignment.max_score,
                is_graded: assignment.is_graded,
                allow_late_submission: assignment.allow_late_submission,
                priority: assignment.priority,
                assignment_type: assignment.assignment_type,
                estimated_duration_minutes: assignment.estimated_duration_minutes,
                attachment_urls: assignment.attachment_urls,
                
                source_type,
                source_id: source_type === "class" ? assignment.class_id! : assignment.course_id!,
                source_name: sourceData?.name || sourceData?.title || "Unknown",
                subject_id: assignment.subject_id,
                subject_name: subjectData?.name || "Unknown Subject",
                teacher_id: assignment.user_id,
                teacher_name: teacherData ? `${teacherData.teacher_profile.first_name} ${teacherData.teacher_profile.last_name}` : "Unknown Teacher",
                
                submission: submission ? this.convertEnhancedSubmissionToUnified(submission) : undefined,
                status,
                days_until_due: daysUntilDue,
                priority_score: this.calculatePriorityScore(assignment.due_date, assignment.priority, status),
                
                created_at: assignment.created_at,
                updated_at: assignment.updated_at,
            };
        } catch (error) {
            console.error("Error converting enhanced assignment:", error);
            return null;
        }
    }

    /**
     * Convert legacy submission to unified format
     */
    private convertLegacySubmissionToUnified(submission: IAssignmentSubmission): IUnifiedSubmissionView {
        return {
            id: submission.id,
            submission_date: submission.submission_date,
            submission_content: submission.meta_data ? JSON.stringify(submission.meta_data) : undefined,
            attachment_urls: [],
            grade: submission.grade,
            feedback: submission.feedback,
            is_late: false, // Legacy submissions don't track this
            attempt_number: 1,
            time_spent_minutes: undefined,
            graded_by: undefined,
            graded_date: submission.grade ? submission.updated_at : undefined,
        };
    }

    /**
     * Convert legacy course submission to unified format
     */
    private convertLegacyCourseSubmissionToUnified(submission: ICourseAssignmentSubmissionData): IUnifiedSubmissionView {
        return {
            id: submission.id,
            submission_date: submission.submission_date,
            submission_content: submission.meta_data ? JSON.stringify(submission.meta_data) : undefined,
            attachment_urls: [],
            grade: submission.grade,
            feedback: submission.feedback,
            is_late: false,
            attempt_number: 1,
            time_spent_minutes: undefined,
            graded_by: undefined,
            graded_date: submission.grade ? submission.updated_at : undefined,
        };
    }

    /**
     * Convert enhanced submission to unified format
     */
    private convertEnhancedSubmissionToUnified(submission: IEnhancedAssignmentSubmissionData): IUnifiedSubmissionView {
        return {
            id: submission.id,
            submission_date: submission.submission_date,
            submission_content: submission.submission_content,
            attachment_urls: submission.attachment_urls,
            grade: submission.grade,
            feedback: submission.feedback,
            is_late: submission.is_late,
            attempt_number: submission.attempt_number,
            time_spent_minutes: submission.time_spent_minutes,
            graded_by: submission.graded_by,
            graded_date: submission.graded_date,
        };
    }

    /**
     * Calculate assignment status
     */
    private calculateAssignmentStatus(dueDate: Date, submission: any): "pending" | "submitted" | "graded" | "overdue" | "due_soon" {
        const currentDate = new Date();
        const dueDateObj = new Date(dueDate);
        
        if (submission) {
            if (submission.grade !== null && submission.grade !== undefined) {
                return "graded";
            }
            return "submitted";
        }
        
        if (dueDateObj < currentDate) {
            return "overdue";
        }
        
        const daysUntilDue = Math.ceil((dueDateObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 2) {
            return "due_soon";
        }
        
        return "pending";
    }

    /**
     * Calculate days until due
     */
    private calculateDaysUntilDue(dueDate: Date): number {
        const currentDate = new Date();
        const dueDateObj = new Date(dueDate);
        return Math.ceil((dueDateObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Calculate priority score for sorting
     */
    private calculatePriorityScore(
        dueDate: Date, 
        priority: "low" | "medium" | "high", 
        status: string
    ): number {
        let score = 0;
        
        // Priority weight
        const priorityWeights = { high: 100, medium: 50, low: 10 };
        score += priorityWeights[priority];
        
        // Days until due weight (more urgent = higher score)
        const daysUntilDue = this.calculateDaysUntilDue(dueDate);
        if (daysUntilDue <= 0) score += 1000; // Overdue
        else if (daysUntilDue <= 1) score += 500; // Due today/tomorrow
        else if (daysUntilDue <= 3) score += 200; // Due soon
        else if (daysUntilDue <= 7) score += 100; // Due this week
        
        // Status weight
        if (status === "overdue") score += 2000;
        else if (status === "due_soon") score += 800;
        
        return score;
    }

    /**
     * Sort assignments based on criteria
     */
    private sortAssignments(
        assignments: IUnifiedAssignmentView[], 
        sortBy?: string, 
        sortOrder: "asc" | "desc" = "asc"
    ): void {
        assignments.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case "due_date":
                    comparison = a.due_date.getTime() - b.due_date.getTime();
                    break;
                case "priority":
                    comparison = a.priority_score - b.priority_score;
                    break;
                case "created_date":
                    comparison = a.created_at.getTime() - b.created_at.getTime();
                    break;
                case "subject":
                    comparison = a.subject_name.localeCompare(b.subject_name);
                    break;
                default:
                    // Default sort by priority score (most urgent first)
                    comparison = b.priority_score - a.priority_score;
                    break;
            }
            
            return sortOrder === "desc" ? -comparison : comparison;
        });
    }

    /**
     * Calculate assignment summary statistics
     */
    private calculateAssignmentSummary(assignments: IUnifiedAssignmentView[]) {
        const currentDate = new Date();
        const todayEnd = new Date(currentDate);
        todayEnd.setHours(23, 59, 59, 999);
        
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return {
            total_assignments: assignments.length,
            pending: assignments.filter(a => a.status === "pending").length,
            submitted: assignments.filter(a => a.status === "submitted").length,
            graded: assignments.filter(a => a.status === "graded").length,
            overdue: assignments.filter(a => a.status === "overdue").length,
            due_today: assignments.filter(a => 
                a.status === "pending" && 
                a.due_date >= currentDate && 
                a.due_date <= todayEnd
            ).length,
            due_this_week: assignments.filter(a => 
                a.status === "pending" && 
                a.due_date > todayEnd && 
                a.due_date <= weekEnd
            ).length,
        };
    }

    /**
     * Calculate detailed statistics for dashboard
     */
    private calculateDetailedStatistics(assignments: IUnifiedAssignmentView[]) {
        const total = assignments.length;
        const submitted = assignments.filter(a => a.submission).length;
        const graded = assignments.filter(a => a.status === "graded").length;
        const overdue = assignments.filter(a => a.status === "overdue").length;
        const pending = assignments.filter(a => a.status === "pending").length;
        
        const gradedAssignments = assignments.filter(a => a.submission?.grade !== undefined);
        const averageGrade = gradedAssignments.length > 0 
            ? gradedAssignments.reduce((sum, a) => sum + (a.submission!.grade || 0), 0) / gradedAssignments.length
            : undefined;
        
        const completionRate = total > 0 ? (submitted / total) * 100 : 0;
        
        const onTimeSubmissions = assignments.filter(a => 
            a.submission && !a.submission.is_late
        ).length;
        const onTimeSubmissionRate = submitted > 0 ? (onTimeSubmissions / submitted) * 100 : 0;

        return {
            total_assignments: total,
            submitted,
            pending,
            overdue,
            graded,
            average_grade: averageGrade,
            completion_rate: Math.round(completionRate * 100) / 100,
            on_time_submission_rate: Math.round(onTimeSubmissionRate * 100) / 100,
        };
    }

    /**
     * Calculate performance by subject
     */
    private calculatePerformanceBySubject(assignments: IUnifiedAssignmentView[]) {
        const subjectMap = new Map<string, {
            subject_id: string;
            subject_name: string;
            assignments: IUnifiedAssignmentView[];
        }>();

        // Group assignments by subject
        assignments.forEach(assignment => {
            if (!subjectMap.has(assignment.subject_id)) {
                subjectMap.set(assignment.subject_id, {
                    subject_id: assignment.subject_id,
                    subject_name: assignment.subject_name,
                    assignments: [],
                });
            }
            subjectMap.get(assignment.subject_id)!.assignments.push(assignment);
        });

        // Calculate performance for each subject
        return Array.from(subjectMap.values()).map(subject => {
            const total = subject.assignments.length;
            const submitted = subject.assignments.filter(a => a.submission).length;
            const graded = subject.assignments.filter(a => a.status === "graded").length;
            
            const gradedAssignments = subject.assignments.filter(a => a.submission?.grade !== undefined);
            const averageGrade = gradedAssignments.length > 0 
                ? gradedAssignments.reduce((sum, a) => sum + (a.submission!.grade || 0), 0) / gradedAssignments.length
                : undefined;
            
            const completionRate = total > 0 ? (submitted / total) * 100 : 0;
            
            // Simple trend calculation (would be better with historical data)
            const recentGrades = gradedAssignments
                .sort((a, b) => new Date(b.submission!.graded_date || 0).getTime() - new Date(a.submission!.graded_date || 0).getTime())
                .slice(0, 3);
            
            let trend: "improving" | "declining" | "stable" = "stable";
            if (recentGrades.length >= 2) {
                const latestGrade = recentGrades[0].submission!.grade!;
                const previousGrade = recentGrades[1].submission!.grade!;
                if (latestGrade > previousGrade + 5) trend = "improving";
                else if (latestGrade < previousGrade - 5) trend = "declining";
            }

            return {
                subject_id: subject.subject_id,
                subject_name: subject.subject_name,
                total_assignments: total,
                completion_rate: Math.round(completionRate * 100) / 100,
                average_grade: averageGrade,
                trend,
            };
        });
    }

    /**
     * Calculate urgency level for assignments
     */
    private calculateUrgency(assignment: IUnifiedAssignmentView): string {
        const daysUntilDue = assignment.days_until_due;
        const priority = assignment.priority;
        
        if (daysUntilDue <= 0) return "critical";
        if (daysUntilDue <= 1 && priority === "high") return "critical";
        if (daysUntilDue <= 1) return "high";
        if (daysUntilDue <= 3 && priority === "high") return "high";
        if (daysUntilDue <= 3) return "medium";
        return "low";
    }
}
