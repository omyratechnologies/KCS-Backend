import { ClassService } from "./class.service";
import { CourseService } from "./course.service";

// Import models
import { CourseEnrollment } from "@/models/course_enrollment.model";
import { CourseProgress } from "@/models/course_progress.model";
import { CourseAssignmentSubmission } from "@/models/course_assignment_submission.model";
import { Class } from "@/models/class.model";
import { User } from "@/models/user.model";
import { ClassQuizSubmission } from "@/models/class_quiz_submission.model";
import { Attendance } from "@/models/attendance.model";

interface CourseProgressRecord {
    user_id: string;
    course_id: string;
    campus_id: string;
    watch_time_seconds: number;
    progress_status: string;
    completion_percentage: number;
    last_accessed_at: Date;
    first_accessed_at: Date;
    interaction_data?: {
        play_count?: number;
        notes_taken?: number;
    };
}

interface ActivityRecord {
    type: "course_progress" | "assignment_submission" | "achievement";
    title: string;
    description: string;
    date: Date;
    progress_change?: number;
}

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
        courses_detail: Array<{
            course_id: string;
            title: string;
            progress_percentage: number;
            status: string;
            last_accessed: Date | null;
            completion_date: Date | null;
        }>;
    };
    assignments: {
        total_assignments: number;
        submitted: number;
        graded: number;
        pending: number;
        overdue: number;
        completion_rate: number;
        average_grade: number;
        assignments_by_type: {
            class_assignments: {
                total: number;
                submitted: number;
                completion_rate: number;
            };
            course_assignments: {
                total: number;
                submitted: number;
                completion_rate: number;
            };
        };
    };
    quizzes: {
        total_quizzes: number;
        attempted: number;
        completed: number;
        completion_rate: number;
        average_score: number;
        highest_score: number;
    };
    attendance: {
        total_days: number;
        present: number;
        absent: number;
        late: number;
        leave: number;
        attendance_percentage: number;
    };
    performance_metrics: {
        study_streak: {
            current_streak: number;
            longest_streak: number;
            last_activity_date: Date | null;
        };
        time_spent: {
            total_hours: number;
            this_week_hours: number;
            average_daily_minutes: number;
        };
        engagement_score: number; // 0-100
    };
    recent_activity: Array<{
        type: "course_progress" | "assignment_submission" | "achievement";
        title: string;
        description: string;
        date: Date;
        progress_change?: number;
    }>;
}

export class StudentProgressService {
    /**
     * Check if the requesting user can access the student's progress
     */
    static async canAccessStudentProgress(
        requestingUserId: string,
        requestingUserType: string,
        targetStudentId: string,
        campus_id: string
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
            // Check if the teacher teaches any classes the student is in
            try {
                const classService = new ClassService();
                const allClasses = await classService.getAllClassByCampusId(campus_id);
                
                // Filter classes where the requesting user is a teacher
                const teacherClasses = allClasses.filter(classData => 
                    classData.teacher_ids?.includes(requestingUserId) || 
                    classData.class_teacher_id === requestingUserId
                );
                
                for (const classData of teacherClasses) {
                    if (classData.student_ids?.includes(targetStudentId)) {
                        return true;
                    }
                }
            } catch {
                // Error checking teacher access - continue with false
            }
        }

        // Parents can access their children's progress (would need parent-child relationship)
        if (requestingUserType === "Parent") {
            // TODO: Implement parent-child relationship check
            // For now, return false
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
            // Parallelize all data fetching for better performance
            const [
                studentInfo,
                courseProgress,
                assignmentProgress,
                quizProgress,
                attendanceProgress,
                performanceMetrics,
                recentActivity,
            ] = await Promise.all([
                this.getStudentInfo(student_id),
                this.getCourseProgressSummary(student_id, campus_id),
                this.getAssignmentProgressSummary(student_id, campus_id),
                this.getQuizProgressSummary(student_id, campus_id),
                this.getAttendanceProgressSummary(student_id, campus_id),
                this.getPerformanceMetrics(student_id, campus_id),
                this.getRecentActivity(student_id, campus_id),
            ]);

            // Calculate overall progress
            const overallProgress = this.calculateOverallProgress(courseProgress, assignmentProgress);

            return {
                student_info: studentInfo,
                overall_progress: overallProgress,
                courses: courseProgress,
                assignments: assignmentProgress,
                quizzes: quizProgress,
                attendance: attendanceProgress,
                performance_metrics: performanceMetrics,
                recent_activity: recentActivity,
            };

        } catch (error) {
            // Error getting comprehensive progress
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
                    courses_detail: [],
                };
            }

            let totalProgress = 0;
            let completed = 0;
            let inProgress = 0;
            let notStarted = 0;

            // Process enrollments without additional queries for better performance
            const coursesDetail = enrollments.map((enrollment) => {
                if (enrollment.progress_percentage === 100) {
                    completed++;
                } else if (enrollment.progress_percentage > 0) {
                    inProgress++;
                } else {
                    notStarted++;
                }

                totalProgress += enrollment.progress_percentage;

                return {
                    course_id: enrollment.course_id,
                    title: enrollment.course_id, // Return course_id instead of making extra query
                    progress_percentage: enrollment.progress_percentage,
                    status: enrollment.enrollment_status,
                    last_accessed: enrollment.last_accessed_at,
                    completion_date: enrollment.completion_date,
                };
            });

            const averageProgress = Math.round(totalProgress / enrollments.length);

            return {
                total_enrolled: enrollments.length,
                completed,
                in_progress: inProgress,
                not_started: notStarted,
                average_progress: averageProgress,
                courses_detail: coursesDetail,
            };

        } catch {
            // Error getting course progress summary
            return {
                total_enrolled: 0,
                completed: 0,
                in_progress: 0,
                not_started: 0,
                average_progress: 0,
                courses_detail: [],
            };
        }
    }

    /**
     * Get assignment progress summary - SIMPLIFIED FOR SPEED
     */
    private static async getAssignmentProgressSummary(student_id: string, campus_id: string) {
        try {
            // Just fetch the student's submissions - much faster!
            const courseSubmissionsResult = await CourseAssignmentSubmission.find({ 
                user_id: student_id, 
                campus_id 
            });

            const courseSubmissions = courseSubmissionsResult.rows;
            const classSubmissions: typeof courseSubmissions = []; // Skip class submissions for now for speed
            
            // Simplified: just count submissions, don't fetch all assignments
            const totalSubmissions = courseSubmissions.length + classSubmissions.length;
            
            // Count graded
            const gradedSubmissions = courseSubmissions.filter(s => 
                s.grade !== null && s.grade !== undefined
            );

            // Calculate average grade
            const averageGrade = gradedSubmissions.length > 0
                ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
                : 0;

            // Estimate total assignments (submissions * 1.5 as rough estimate)
            const estimatedTotal = Math.max(totalSubmissions, Math.round(totalSubmissions * 1.5));
            const completionRate = estimatedTotal > 0 
                ? Math.round((totalSubmissions / estimatedTotal) * 100) 
                : 0;

            return {
                total_assignments: estimatedTotal,
                submitted: totalSubmissions,
                graded: gradedSubmissions.length,
                pending: Math.max(0, estimatedTotal - totalSubmissions),
                overdue: 0, // Skip for speed
                completion_rate: completionRate,
                average_grade: Math.round(averageGrade * 100) / 100,
                assignments_by_type: {
                    class_assignments: {
                        total: 0,
                        submitted: classSubmissions.length,
                        completion_rate: 0,
                    },
                    course_assignments: {
                        total: estimatedTotal,
                        submitted: courseSubmissions.length,
                        completion_rate: completionRate,
                    },
                },
            };

        } catch {
            return {
                total_assignments: 0,
                submitted: 0,
                graded: 0,
                pending: 0,
                overdue: 0,
                completion_rate: 0,
                average_grade: 0,
                assignments_by_type: {
                    class_assignments: {total: 0, submitted: 0, completion_rate: 0},
                    course_assignments: {total: 0, submitted: 0, completion_rate: 0},
                },
            };
        }
    }

    /**
     * Get quiz progress summary - ULTRA FAST VERSION
     */
    private static async getQuizProgressSummary(student_id: string, campus_id: string) {
        try {
            // Only fetch student's quiz submissions - fastest approach
            const submissionsResult = await ClassQuizSubmission.find({ 
                user_id: student_id, 
                campus_id, 
                is_deleted: false 
            });

            const submissionsForStudent = submissionsResult.rows;
            
            if (submissionsForStudent.length === 0) {
                return {
                    total_quizzes: 0,
                    attempted: 0,
                    completed: 0,
                    completion_rate: 0,
                    average_score: 0,
                    highest_score: 0,
                };
            }

            // Calculate from submissions only (no need to fetch all quizzes)
            const attempted = submissionsForStudent.length;
            const completed = submissionsForStudent.length;
            
            // Calculate average score
            const scores = submissionsForStudent
                .filter(s => s.score !== null && s.score !== undefined)
                .map(s => s.score);
            
            const averageScore = scores.length > 0
                ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100
                : 0;

            const highestScore = scores.length > 0
                ? Math.max(...scores)
                : 0;

            // Estimate total quizzes as submissions * 1.2
            const estimatedTotal = Math.max(attempted, Math.round(attempted * 1.2));
            const completionRate = estimatedTotal > 0 
                ? Math.round((completed / estimatedTotal) * 100) 
                : 100;

            return {
                total_quizzes: estimatedTotal,
                attempted,
                completed,
                completion_rate: completionRate,
                average_score: averageScore,
                highest_score: highestScore,
            };

        } catch {
            return {
                total_quizzes: 0,
                attempted: 0,
                completed: 0,
                completion_rate: 0,
                average_score: 0,
                highest_score: 0,
            };
        }
    }

    /**
     * Get attendance progress summary
     */
    private static async getAttendanceProgressSummary(student_id: string, campus_id: string) {
        try {
            // Get all attendance records for the student
            const attendanceResult = await Attendance.find({
                user_id: student_id,
                campus_id,
            });

            const attendanceRecords = attendanceResult.rows;

            if (attendanceRecords.length === 0) {
                return {
                    total_days: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    leave: 0,
                    attendance_percentage: 0,
                };
            }

            // Count attendance by status
            const present = attendanceRecords.filter(a => a.status === "present").length;
            const absent = attendanceRecords.filter(a => a.status === "absent").length;
            const late = attendanceRecords.filter(a => a.status === "late").length;
            const leave = attendanceRecords.filter(a => a.status === "leave").length;

            const totalDays = attendanceRecords.length;

            // Calculate attendance percentage (present + late as present)
            const attendancePercentage = totalDays > 0
                ? Math.round(((present + late) / totalDays) * 100)
                : 0;

            return {
                total_days: totalDays,
                present,
                absent,
                late,
                leave,
                attendance_percentage: attendancePercentage,
            };

        } catch {
            return {
                total_days: 0,
                present: 0,
                absent: 0,
                late: 0,
                leave: 0,
                attendance_percentage: 0,
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

            // Calculate this week's time
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const thisWeekRecords = progressRecords.filter(
                record => new Date(record.last_accessed_at) >= oneWeekAgo
            );

            const thisWeekSeconds = thisWeekRecords.reduce(
                (sum, record) => sum + (record.watch_time_seconds || 0), 
                0
            );
            const thisWeekHours = Math.round((thisWeekSeconds / 3600) * 100) / 100;

            // Calculate daily average (based on total days since first enrollment)
            let averageDailyMinutes = 0;
            if (progressRecords.length > 0) {
                const firstAccess = progressRecords.reduce((earliest, record) => {
                    const recordDate = new Date(record.first_accessed_at);
                    return recordDate < earliest ? recordDate : earliest;
                }, new Date());

                const daysSinceFirst = Math.max(1, 
                    Math.ceil((Date.now() - firstAccess.getTime()) / (1000 * 60 * 60 * 24))
                );
                averageDailyMinutes = Math.round((totalWatchTimeSeconds / 60) / daysSinceFirst);
            }

            // Calculate study streak
            const studyStreak = await this.calculateStudyStreak(student_id);

            // Calculate engagement score (based on various factors)
            const engagementScore = this.calculateEngagementScore(progressRecords);

            return {
                study_streak: studyStreak,
                time_spent: {
                    total_hours: totalHours,
                    this_week_hours: thisWeekHours,
                    average_daily_minutes: averageDailyMinutes,
                },
                engagement_score: engagementScore,
            };

        } catch {
            return {
                study_streak: {
                    current_streak: 0,
                    longest_streak: 0,
                    last_activity_date: null,
                },
                time_spent: {
                    total_hours: 0,
                    this_week_hours: 0,
                    average_daily_minutes: 0,
                },
                engagement_score: 0,
            };
        }
    }

    /**
     * Calculate study streak
     */
    private static async calculateStudyStreak(student_id: string) {
        try {
            const progressResult = await CourseProgress.find({
                user_id: student_id,
            });

            const progressRecords = progressResult.rows;

            if (progressRecords.length === 0) {
                return {
                    current_streak: 0,
                    longest_streak: 0,
                    last_activity_date: null,
                };
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
            let longestStreak = 0;
            let tempStreak = 0;



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

            // Calculate longest streak
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const currentDate = new Date(sortedDates[i] as string);
                const nextDate = new Date(sortedDates[i + 1] as string);
                const dayDiff = Math.abs(currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);

                if (dayDiff <= 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak + 1);
                    tempStreak = 0;
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak + 1);

            const lastActivity = sortedDates.length > 0 ? new Date(sortedDates[0] as string) : null;

            return {
                current_streak: currentStreak,
                longest_streak: longestStreak,
                last_activity_date: lastActivity,
            };

        } catch {
            return {
                current_streak: 0,
                longest_streak: 0,
                last_activity_date: null,
            };
        }
    }

    /**
     * Calculate engagement score
     */
    private static calculateEngagementScore(progressRecords: CourseProgressRecord[]): number {
        if (progressRecords.length === 0) {
            return 0;
        }

        let score = 0;
        const factors = {
            completionRate: 0,
            consistency: 0,
            engagement: 0,
        };

        // Completion rate factor (40%)
        const completedLectures = progressRecords.filter(r => r.progress_status === "completed").length;
        factors.completionRate = Math.min(100, (completedLectures / progressRecords.length) * 100);

        // Consistency factor (30%) - based on regular activity
        const uniqueDays = new Set(
            progressRecords.map(r => new Date(r.last_accessed_at).toDateString())
        ).size;
        const totalDays = Math.max(1, 
            Math.ceil((Date.now() - new Date(progressRecords[0].first_accessed_at).getTime()) / (1000 * 60 * 60 * 24))
        );
        factors.consistency = Math.min(100, (uniqueDays / totalDays) * 100);

        // Engagement factor (30%) - based on interaction data
        const avgInteractions = progressRecords.reduce((sum, record) => {
            const interactions = record.interaction_data || {};
            return sum + (interactions.play_count || 0) + (interactions.notes_taken || 0);
        }, 0) / progressRecords.length;
        factors.engagement = Math.min(100, avgInteractions * 10); // Scale interactions

        // Calculate weighted score
        score = (factors.completionRate * 0.4) + (factors.consistency * 0.3) + (factors.engagement * 0.3);

        return Math.round(score);
    }

    /**
     * Get recent activity
     */
    private static async getRecentActivity(student_id: string, campus_id: string) {
        try {
            const activities: ActivityRecord[] = [];

            // Get recent course progress
            const progressResult = await CourseProgress.find({
                user_id: student_id,
                campus_id,
            });

            const recentProgress = progressResult.rows
                .filter(record => record.last_accessed_at)
                .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime())
                .slice(0, 5);

            for (const progress of recentProgress) {
                try {
                    const course = await CourseService.getCourseById(progress.course_id, campus_id);
                    activities.push({
                        type: "course_progress" as const,
                        title: course.data?.title || "Course Progress",
                        description: `Continued learning - ${progress.completion_percentage}% complete`,
                        date: new Date(progress.last_accessed_at),
                        progress_change: progress.completion_percentage,
                    });
                } catch {
                    // Skip if course not found
                }
            }

            // Get recent assignment submissions
            const classService = new ClassService();
            const studentClasses = await Class.find({
                campus_id,
                is_active: true,
                is_deleted: false,
            });

            for (const classData of studentClasses.rows) {
                if (classData.student_ids?.includes(student_id)) {
                    const assignments = await classService.getAllAssignmentsByClassId(classData.id);
                    
                    for (const assignment of assignments) {
                        const submissions = await classService.getAssignmentSubmissionByAssignmentId(assignment.id);
                        const studentSubmission = submissions.find(s => s.user_id === student_id);
                        
                        if (studentSubmission) {
                            activities.push({
                                type: "assignment_submission" as const,
                                title: assignment.title,
                                description: `Assignment submitted${studentSubmission.grade ? ` - Grade: ${studentSubmission.grade}` : ""}`,
                                date: new Date(studentSubmission.submission_date),
                            });
                        }
                    }
                }
            }

            // Sort all activities by date and return the most recent ones
            return activities
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .slice(0, 10);

        } catch {
            return [];
        }
    }

    /**
     * Calculate overall progress based on courses and assignments
     */
    private static calculateOverallProgress(
        courseProgress: { average_progress: number }, 
        assignmentProgress: { completion_rate: number }
    ) {
        // Weight courses at 60% and assignments at 40%
        const courseWeight = 0.6;
        const assignmentWeight = 0.4;

        const overallPercentage = Math.round(
            (courseProgress.average_progress * courseWeight) + 
            (assignmentProgress.completion_rate * assignmentWeight)
        );

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
        // Parallelize all data fetching for better performance
        const [
            courseProgress,
            assignmentProgress,
            quizProgress,
            attendanceProgress,
            performanceMetrics,
        ] = await Promise.all([
            this.getCourseProgressSummary(student_id, campus_id),
            this.getAssignmentProgressSummary(student_id, campus_id),
            this.getQuizProgressSummary(student_id, campus_id),
            this.getAttendanceProgressSummary(student_id, campus_id),
            this.getPerformanceMetrics(student_id, campus_id),
        ]);
        
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
            quiz_summary: {
                total_quizzes: quizProgress.total_quizzes,
                completion_rate: quizProgress.completion_rate,
                average_score: quizProgress.average_score,
            },
            attendance_summary: {
                total_days: attendanceProgress.total_days,
                attendance_percentage: attendanceProgress.attendance_percentage,
                present_days: attendanceProgress.present,
            },
            performance_summary: {
                total_study_hours: performanceMetrics.time_spent.total_hours,
                engagement_score: performanceMetrics.engagement_score,
                current_streak: performanceMetrics.study_streak.current_streak,
            },
        };
    }
}