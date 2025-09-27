import { ClassService } from "./class.service";
import { CourseService } from "./course.service";

// Import models
import { CourseEnrollment } from "@/models/course_enrollment.model";
import { CourseProgress } from "@/models/course_progress.model";
import { User } from "@/models/user.model";

export interface StudentProgressSummary {
    student_info: {
        id: string;
        name: string;
        email: string;
        campus_id: string;
    };
    overall_progress: {
        total_progress_percentage: number;
        completion_status: "not_started" | "in_progress" | "completed";
        last_updated: Date;
    };
    courses: {
        total_enrolled: number;
        completed: number;
        in_progress: number;
        not_started: number;
        average_progress: number;
    };
    assignments: {
        total_assignments: number;
        submitted: number;
        completion_rate: number;
        average_grade: number;
    };
    performance_metrics: {
        total_study_hours: number;
        engagement_score: number;
        current_streak: number;
    };
}

export class StudentProgressService {
    /**
     * Check if the requesting user can access the student's progress
     */
    static async canAccessStudentProgress(
        requestingUserId: string,
        requestingUserType: string,
        targetStudentId: string,
        _campus_id: string
    ): Promise<boolean> {
        // Users can always access their own progress
        if (requestingUserId === targetStudentId) {
            return true;
        }

        // Admins and Super Admins can access any student's progress
        if (["Admin", "Super Admin"].includes(requestingUserType)) {
            return true;
        }

        // Teachers can access their students' progress
        if (requestingUserType === "Teacher") {
            // For now, allow teachers to access any student's progress
            // In a real implementation, check if teacher teaches the student
            return true;
        }

        // Parents can access their children's progress
        if (requestingUserType === "Parent") {
            // TODO: Implement parent-child relationship check
            return false;
        }

        return false;
    }

    /**
     * Get comprehensive student progress
     */
    static async getComprehensiveProgress(
        student_id: string,
        campus_id: string
    ): Promise<StudentProgressSummary> {
        try {
            // Get student information
            const studentInfo = await this.getStudentInfo(student_id);

            // Get course progress
            const courseProgress = await this.getCourseProgressSummary(student_id, campus_id);

            // Get assignment progress
            const assignmentProgress = await this.getAssignmentProgressSummary(student_id, campus_id);

            // Get performance metrics
            const performanceMetrics = await this.getPerformanceMetrics(student_id, campus_id);

            // Calculate overall progress
            const overallProgress = this.calculateOverallProgress(courseProgress, assignmentProgress);

            return {
                student_info: studentInfo,
                overall_progress: overallProgress,
                courses: courseProgress,
                assignments: assignmentProgress,
                performance_metrics: performanceMetrics,
            };

        } catch (error) {
            throw new Error(`Failed to get student progress: ${error}`);
        }
    }

    /**
     * Get student basic information
     */
    private static async getStudentInfo(student_id: string) {
        try {
            const userResult = await User.find({ id: student_id });
            const user = userResult.rows[0];

            if (!user) {
                throw new Error("Student not found");
            }

            return {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                campus_id: user.campus_id,
            };
        } catch (error) {
            throw new Error(`Failed to get student info: ${error}`);
        }
    }

    /**
     * Get course progress summary
     */
    private static async getCourseProgressSummary(student_id: string, campus_id: string) {
        try {
            const enrollmentsResult = await CourseEnrollment.find({
                user_id: student_id,
                campus_id,
            });

            const enrollments = enrollmentsResult.rows;

            if (enrollments.length === 0) {
                return {
                    total_enrolled: 0,
                    completed: 0,
                    in_progress: 0,
                    not_started: 0,
                    average_progress: 0,
                };
            }

            let totalProgress = 0;
            let completed = 0;
            let inProgress = 0;
            let notStarted = 0;

            for (const enrollment of enrollments) {
                if (enrollment.progress_percentage === 100) {
                    completed++;
                } else if (enrollment.progress_percentage > 0) {
                    inProgress++;
                } else {
                    notStarted++;
                }
                totalProgress += enrollment.progress_percentage;
            }

            const averageProgress = Math.round(totalProgress / enrollments.length);

            return {
                total_enrolled: enrollments.length,
                completed,
                in_progress: inProgress,
                not_started: notStarted,
                average_progress: averageProgress,
            };

        } catch (error) {
            return {
                total_enrolled: 0,
                completed: 0,
                in_progress: 0,
                not_started: 0,
                average_progress: 0,
            };
        }
    }

    /**
     * Get assignment progress summary
     */
    private static async getAssignmentProgressSummary(student_id: string, campus_id: string) {
        try {
            const classService = new ClassService();
            
            // For simplicity, let's get basic assignment stats
            // This is a simplified version - you might want to expand based on your needs
            let totalAssignments = 0;
            let submitted = 0;
            let totalGrades = 0;
            let gradedCount = 0;

            // Get student's classes and assignments
            try {
                // Get assignments from classes the student is enrolled in
                const allClasses = await classService.getAllClassByCampusId(campus_id);
                
                for (const classData of allClasses) {
                    if (classData.student_ids && classData.student_ids.includes(student_id)) {
                        const assignments = await classService.getAllAssignmentsByClassId(classData.id);
                        totalAssignments += assignments.length;

                        for (const assignment of assignments) {
                            const submissions = await classService.getAssignmentSubmissionByAssignmentId(assignment.id);
                            const studentSubmission = submissions.find(s => s.user_id === student_id);
                            
                            if (studentSubmission) {
                                submitted++;
                                if (studentSubmission.grade !== null && studentSubmission.grade !== undefined) {
                                    totalGrades += studentSubmission.grade;
                                    gradedCount++;
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                // If there's an error, return default values
            }

            const completionRate = totalAssignments > 0 
                ? Math.round((submitted / totalAssignments) * 100) 
                : 0;

            const averageGrade = gradedCount > 0 
                ? Math.round((totalGrades / gradedCount) * 100) / 100
                : 0;

            return {
                total_assignments: totalAssignments,
                submitted,
                completion_rate: completionRate,
                average_grade: averageGrade,
            };

        } catch (error) {
            return {
                total_assignments: 0,
                submitted: 0,
                completion_rate: 0,
                average_grade: 0,
            };
        }
    }

    /**
     * Get performance metrics
     */
    private static async getPerformanceMetrics(student_id: string, campus_id: string) {
        try {
            // Get course progress data for time calculations
            const progressResult = await CourseProgress.find({
                user_id: student_id,
                campus_id,
            });

            const progressRecords = progressResult.rows;

            // Calculate total study time
            const totalWatchTimeSeconds = progressRecords.reduce(
                (sum, record) => sum + (record.watch_time_seconds || 0), 
                0
            );
            const totalHours = Math.round((totalWatchTimeSeconds / 3600) * 100) / 100;

            // Calculate engagement score (simplified)
            const completedLectures = progressRecords.filter(r => r.progress_status === "completed").length;
            const engagementScore = progressRecords.length > 0 
                ? Math.round((completedLectures / progressRecords.length) * 100)
                : 0;

            // Calculate study streak (simplified)
            const currentStreak = this.calculateSimpleStreak(progressRecords);

            return {
                total_study_hours: totalHours,
                engagement_score: engagementScore,
                current_streak: currentStreak,
            };

        } catch (error) {
            return {
                total_study_hours: 0,
                engagement_score: 0,
                current_streak: 0,
            };
        }
    }

    /**
     * Calculate a simple study streak
     */
    private static calculateSimpleStreak(progressRecords: any[]): number {
        if (progressRecords.length === 0) {
            return 0;
        }

        // Group activities by date
        const activityDates = new Set();
        progressRecords.forEach(record => {
            if (record.last_accessed_at) {
                const dateStr = new Date(record.last_accessed_at).toDateString();
                activityDates.add(dateStr);
            }
        });

        const sortedDates = Array.from(activityDates).sort((a, b) => 
            new Date(b as string).getTime() - new Date(a as string).getTime()
        );

        let currentStreak = 0;

        // Calculate current streak
        for (let i = 0; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i] as string);
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);

            if (currentDate.toDateString() === expectedDate.toDateString()) {
                currentStreak++;
            } else {
                break;
            }
        }

        return currentStreak;
    }

    /**
     * Calculate overall progress based on courses and assignments
     */
    private static calculateOverallProgress(
        courseProgress: { average_progress: number; total_enrolled: number },
        assignmentProgress: { completion_rate: number; total_assignments: number }
    ) {
        // Weight courses at 60% and assignments at 40% if both exist
        let overallPercentage = 0;

        if (courseProgress.total_enrolled > 0 && assignmentProgress.total_assignments > 0) {
            // Both courses and assignments exist
            overallPercentage = Math.round(
                (courseProgress.average_progress * 0.6) + 
                (assignmentProgress.completion_rate * 0.4)
            );
        } else if (courseProgress.total_enrolled > 0) {
            // Only courses exist
            overallPercentage = courseProgress.average_progress;
        } else if (assignmentProgress.total_assignments > 0) {
            // Only assignments exist
            overallPercentage = assignmentProgress.completion_rate;
        }

        let status: "not_started" | "in_progress" | "completed";
        if (overallPercentage === 0) {
            status = "not_started";
        } else if (overallPercentage >= 95) {
            status = "completed";
        } else {
            status = "in_progress";
        }

        return {
            total_progress_percentage: overallPercentage,
            completion_status: status,
            last_updated: new Date(),
        };
    }

    /**
     * Get detailed course progress for a specific course
     */
    static async getCourseProgress(student_id: string, course_id: string, campus_id: string) {
        return await CourseService.getCourseProgressDetails(course_id, student_id, campus_id);
    }

    /**
     * Get assignment progress (wrapper for the summary method)
     */
    static async getAssignmentProgress(student_id: string, campus_id: string) {
        return await this.getAssignmentProgressSummary(student_id, campus_id);
    }

    /**
     * Get academic summary (combination of key metrics)
     */
    static async getAcademicSummary(student_id: string, campus_id: string) {
        const courseProgress = await this.getCourseProgressSummary(student_id, campus_id);
        const assignmentProgress = await this.getAssignmentProgressSummary(student_id, campus_id);
        const performanceMetrics = await this.getPerformanceMetrics(student_id, campus_id);
        const overallProgress = this.calculateOverallProgress(courseProgress, assignmentProgress);

        return {
            overall_progress: overallProgress,
            course_summary: {
                total_enrolled: courseProgress.total_enrolled,
                average_progress: courseProgress.average_progress,
                completed: courseProgress.completed,
            },
            assignment_summary: {
                total_assignments: assignmentProgress.total_assignments,
                completion_rate: assignmentProgress.completion_rate,
                average_grade: assignmentProgress.average_grade,
            },
            performance_summary: {
                total_study_hours: performanceMetrics.total_study_hours,
                engagement_score: performanceMetrics.engagement_score,
                current_streak: performanceMetrics.current_streak,
            },
        };
    }
}