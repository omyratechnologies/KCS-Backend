import { CourseEnrollment, ICourseEnrollmentData } from "@/models/course_enrollment.model";
import { Course, ICourseData } from "@/models/course.model";
import { CourseContent } from "@/models/course_content.model";
import { CourseProgress } from "@/models/course_progress.model";
import { CourseWatchHistory } from "@/models/course_watch_history.model";

interface StudentCourseReportOptions {
    course_id?: string;
    include_analytics?: boolean;
    include_progress?: boolean;
    include_grades?: boolean;
}

interface CourseFilterOptions {
    filter_type: "all" | "available" | "enrolled" | "in_progress" | "completed";
    category?: string;
    search?: string;
    page: number;
    limit: number;
}

export class StudentCoursesService {
    
    /**
     * Get comprehensive student course report
     */
    public static async getStudentCourseReport(
        campus_id: string,
        student_id: string,
        options: StudentCourseReportOptions
    ) {
        try {
            // Get student's enrollments
            const enrollmentsQuery: any = {
                campus_id,
                user_id: student_id,
                is_deleted: false
            };
            
            if (options.course_id) {
                enrollmentsQuery.course_id = options.course_id;
            }
            
            const enrollments: { rows: ICourseEnrollmentData[] } = await CourseEnrollment.find(enrollmentsQuery);
            
            const report = {
                student_id,
                campus_id,
                summary: {
                    total_enrolled: 0,
                    in_progress: 0,
                    completed: 0,
                    average_grade: 0
                },
                courses: [] as any[],
                analytics: null as any,
                overall_progress: null as any
            };
            
            if (!enrollments.rows || enrollments.rows.length === 0) {
                return report;
            }
            
            // Process each enrollment
            for (const enrollment of enrollments.rows) {
                const course: ICourseData = await Course.findById(enrollment.course_id);
                
                const courseData: any = {
                    course_id: enrollment.course_id,
                    course_title: course?.course_name || "Unknown Course",
                    course_description: course?.course_description || "",
                    course_code: course?.course_code || "",
                    enrollment_date: enrollment.enrollment_date,
                    completion_date: enrollment.completion_date,
                    is_completed: enrollment.is_completed,
                    overall_grade: enrollment.overall_grade,
                    status: this.getCourseStatus(enrollment)
                };
                
                // Include progress if requested
                if (options.include_progress) {
                    try {
                        const progress = await CourseProgress.find({
                            campus_id,
                            course_id: enrollment.course_id,
                            user_id: student_id
                        });
                        courseData.progress = progress.rows[0] || null;
                    } catch (error) {
                        courseData.progress = null;
                    }
                }
                
                // Include grades if requested
                if (options.include_grades) {
                    courseData.grade_details = {
                        grade_data: enrollment.grade_data,
                        overall_grade: enrollment.overall_grade,
                        is_graded: enrollment.is_graded
                    };
                }
                
                // Include analytics if requested
                if (options.include_analytics) {
                    try {
                        const watchHistory = await CourseWatchHistory.find({
                            campus_id,
                            course_id: enrollment.course_id,
                            user_id: student_id
                        });
                        
                        courseData.analytics = this.calculateCourseAnalytics(watchHistory.rows || []);
                    } catch (error) {
                        courseData.analytics = null;
                    }
                }
                
                report.courses.push(courseData);
            }
            
            // Calculate summary
            report.summary = this.calculateSummary(enrollments.rows);
            
            return report;
            
        } catch (error) {
            console.error("Error getting student course report:", error);
            throw new Error("Failed to retrieve student course report");
        }
    }
    
    /**
     * Get filtered courses for student
     */
    public static async getFilteredCourses(
        campus_id: string,
        user_id: string,
        options: CourseFilterOptions
    ) {
        try {
            let courses: ICourseData[] = [];
            let enrollments: ICourseEnrollmentData[] = [];
            
            // Get student's enrollments first
            const studentEnrollments = await CourseEnrollment.find({
                campus_id,
                user_id,
                is_deleted: false
            });
            enrollments = studentEnrollments.rows || [];
            
            const enrolledCourseIds = enrollments.map(e => e.course_id);
            
            switch (options.filter_type) {
                case "available":
                    // Courses student can enroll in (not already enrolled)
                    const allCourses = await Course.find({ 
                        campus_id, 
                        is_active: true, 
                        is_deleted: false 
                    });
                    courses = (allCourses.rows || []).filter(course => 
                        !enrolledCourseIds.includes(course.id)
                    );
                    break;
                    
                case "enrolled":
                    // All courses student is enrolled in
                    courses = await this.getCoursesFromEnrollments(enrollments);
                    break;
                    
                case "in_progress":
                    // Enrolled but not completed courses
                    const inProgressEnrollments = enrollments.filter(e => !e.is_completed);
                    courses = await this.getCoursesFromEnrollments(inProgressEnrollments);
                    break;
                    
                case "completed":
                    // Completed courses
                    const completedEnrollments = enrollments.filter(e => e.is_completed);
                    courses = await this.getCoursesFromEnrollments(completedEnrollments);
                    break;
                    
                default:
                    // All courses
                    const allCoursesResult = await Course.find({ 
                        campus_id, 
                        is_active: true, 
                        is_deleted: false 
                    });
                    courses = allCoursesResult.rows || [];
            }
            
            // Apply search filter
            if (options.search) {
                const searchTerm = options.search.toLowerCase();
                courses = courses.filter(course => 
                    course.course_name?.toLowerCase().includes(searchTerm) ||
                    course.course_description?.toLowerCase().includes(searchTerm) ||
                    course.course_code?.toLowerCase().includes(searchTerm)
                );
            }
            
            // Apply category filter
            if (options.category) {
                courses = courses.filter(course => 
                    course.course_meta_data && 
                    (course.course_meta_data as any).category === options.category
                );
            }
            
            // Pagination
            const total = courses.length;
            const startIndex = (options.page - 1) * options.limit;
            const endIndex = startIndex + options.limit;
            const paginatedCourses = courses.slice(startIndex, endIndex);
            
            // Enhance courses with enrollment info
            const enhancedCourses = await Promise.all(
                paginatedCourses.map(async (course) => {
                    const enrollment = enrollments.find(e => e.course_id === course.id);
                    return {
                        ...course,
                        enrollment_status: enrollment ? this.getCourseStatus(enrollment) : "not_enrolled",
                        enrollment_data: enrollment || null
                    };
                })
            );
            
            return {
                courses: enhancedCourses,
                pagination: {
                    current_page: options.page,
                    per_page: options.limit,
                    total_items: total,
                    total_pages: Math.ceil(total / options.limit)
                },
                filter_applied: options.filter_type
            };
            
        } catch (error) {
            console.error("Error getting filtered courses:", error);
            throw new Error("Failed to retrieve courses");
        }
    }
    
    /**
     * Get student dashboard summary
     */
    public static async getStudentDashboard(campus_id: string, user_id: string) {
        try {
            const enrollments = await CourseEnrollment.find({
                campus_id,
                user_id,
                is_deleted: false
            });
            
            const enrollmentData = enrollments.rows || [];
            
            const dashboard = {
                overview: this.calculateSummary(enrollmentData),
                recent_activity: await this.getRecentActivity(campus_id, user_id),
                upcoming_deadlines: await this.getUpcomingDeadlines(campus_id, user_id),
                progress_summary: await this.getProgressSummary(campus_id, user_id, enrollmentData)
            };
            
            return dashboard;
            
        } catch (error) {
            console.error("Error getting student dashboard:", error);
            throw new Error("Failed to retrieve dashboard");
        }
    }
    
    // Helper methods
    
    private static getCourseStatus(enrollment: ICourseEnrollmentData): string {
        if (enrollment.is_completed) return "completed";
        if (enrollment.enrollment_date && new Date(enrollment.enrollment_date) <= new Date()) {
            return "in_progress";
        }
        return "enrolled";
    }
    
    private static calculateSummary(enrollments: ICourseEnrollmentData[]) {
        const total = enrollments.length;
        const completed = enrollments.filter(e => e.is_completed).length;
        const inProgress = enrollments.filter(e => !e.is_completed).length;
        
        const gradedEnrollments = enrollments.filter(e => e.is_graded && e.overall_grade > 0);
        const averageGrade = gradedEnrollments.length > 0 
            ? gradedEnrollments.reduce((sum, e) => sum + e.overall_grade, 0) / gradedEnrollments.length
            : 0;
            
        return {
            total_enrolled: total,
            in_progress: inProgress,
            completed,
            average_grade: Math.round(averageGrade * 100) / 100,
            completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }
    
    private static calculateCourseAnalytics(watchHistory: any[]) {
        const totalWatchTime = watchHistory.reduce((sum, record) => sum + (record.watch_duration || 0), 0);
        const totalSessions = watchHistory.length;
        
        return {
            total_watch_time: totalWatchTime,
            total_sessions: totalSessions,
            average_session_duration: totalSessions > 0 ? totalWatchTime / totalSessions : 0,
            engagement_score: this.calculateEngagementScore(watchHistory)
        };
    }
    
    private static calculateEngagementScore(watchHistory: any[]): number {
        if (watchHistory.length === 0) return 0;
        
        const avgWatchPercentage = watchHistory.reduce((sum, record) => 
            sum + (record.watch_percentage || 0), 0) / watchHistory.length;
        
        return Math.round(avgWatchPercentage);
    }
    
    private static async getCoursesFromEnrollments(enrollments: ICourseEnrollmentData[]): Promise<ICourseData[]> {
        const courses: ICourseData[] = [];
        
        for (const enrollment of enrollments) {
            try {
                const course = await Course.findById(enrollment.course_id);
                if (course) courses.push(course);
            } catch (error) {
                console.error(`Error fetching course ${enrollment.course_id}:`, error);
            }
        }
        
        return courses;
    }
    
    private static async getRecentActivity(campus_id: string, user_id: string) {
        // Get recent watch history, submissions, etc.
        // Implementation depends on your activity tracking requirements
        return [];
    }
    
    private static async getUpcomingDeadlines(campus_id: string, user_id: string) {
        // Get upcoming assignment deadlines, exam dates, etc.
        // Implementation depends on your assignment/exam models
        return [];
    }
    
    private static async getProgressSummary(campus_id: string, user_id: string, enrollments: ICourseEnrollmentData[]) {
        const progressData: Array<{
            course_id: string;
            progress_percentage: number;
            last_accessed: Date;
        }> = [];
        
        for (const enrollment of enrollments.slice(0, 5)) { // Top 5 courses
            try {
                const progress = await CourseProgress.find({
                    campus_id,
                    course_id: enrollment.course_id,
                    user_id
                });
                
                if (progress.rows && progress.rows.length > 0) {
                    progressData.push({
                        course_id: enrollment.course_id,
                        progress_percentage: progress.rows[0].completion_percentage || 0,
                        last_accessed: progress.rows[0].last_accessed_at
                    });
                }
            } catch (error) {
                console.error(`Error getting progress for course ${enrollment.course_id}:`, error);
            }
        }
        
        return progressData;
    }
}
