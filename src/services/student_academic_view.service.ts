import { Assignment } from "@/models/assignment.model";
import { AssignmentSubmission } from "@/models/assignment_submission.model";
import { Attendance } from "@/models/attendance.model";
import { Class } from "@/models/class.model";
import { ClassQuiz } from "@/models/class_quiz.model";
import { ClassQuizSubmission } from "@/models/class_quiz_submission.model";
import { CourseEnrollment } from "@/models/course_enrollment.model";
import { CourseProgress } from "@/models/course_progress.model";
import { Examination } from "@/models/examination.model";
import { LeaveRequest } from "@/models/leave_request.model";
import { StudentPerformance } from "@/models/student_performance.model";
import { StudentRecord } from "@/models/student_record.model";
import { User } from "@/models/user.model";

export class StudentAcademicViewService {
    /**
     * Get comprehensive academic view and analytics for a student
     * Aggregates data from all relevant models to provide a complete picture
     */
    public static readonly getStudentAcademicView = async (student_id: string, campus_id: string) => {
        try {
            // Fetch student information
            const studentInfo = await this.getStudentInfo(student_id, campus_id);

            // Fetch all academic data in parallel for better performance
            const [
                performanceData,
                attendanceAnalytics,
                courseAnalytics,
                assignmentAnalytics,
                quizAnalytics,
                examResults,
                leaveHistory,
            ] = await Promise.all([
                this.getPerformanceData(student_id),
                this.getAttendanceAnalytics(student_id, campus_id),
                this.getCourseAnalytics(student_id, campus_id),
                this.getAssignmentAnalytics(student_id, campus_id),
                this.getQuizAnalytics(student_id, campus_id),
                this.getExamResults(student_id, campus_id),
                this.getLeaveHistory(student_id, campus_id),
            ]);

            // Calculate overall analytics
            const overallAnalytics = this.calculateOverallAnalytics({
                performanceData,
                attendanceAnalytics,
                courseAnalytics,
                assignmentAnalytics,
                quizAnalytics,
            });

            return {
                student_info: studentInfo,
                academic_performance: performanceData,
                attendance: attendanceAnalytics,
                courses: courseAnalytics,
                assignments: assignmentAnalytics,
                quizzes: quizAnalytics,
                examinations: examResults,
                leave_requests: leaveHistory,
                overall_analytics: overallAnalytics,
                generated_at: new Date(),
            };
        } catch (error) {
            console.error("Error fetching student academic view:", error);
            throw error;
        }
    };

    /**
     * Get student basic information
     */
    private static getStudentInfo = async (student_id: string, campus_id: string) => {
        const userResult: any = await User.find({
            id: student_id,
            campus_id,
            user_type: "Student",
            is_deleted: false,
        });

        if (!userResult.rows || userResult.rows.length === 0) {
            throw new Error("Student not found");
        }

        const student = userResult.rows[0];

        // Get class information if student is assigned to a class
        let classInfo: any = null;
        if (student.class_id) {
            const classResult: any = await Class.find({
                id: student.class_id,
                campus_id,
                is_deleted: false,
            });
            if (classResult.rows && classResult.rows.length > 0) {
                classInfo = {
                    class_id: classResult.rows[0].id,
                    class_name: classResult.rows[0].name,
                    academic_year: classResult.rows[0].academic_year,
                    class_teacher_id: classResult.rows[0].class_teacher_id,
                };
            }
        }

        return {
            user_id: student.user_id,
            student_name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            phone: student.phone,
            campus_id: student.campus_id,
            academic_year: student.academic_year,
            class_info: classInfo,
            is_active: student.is_active,
            meta_data: student.meta_data,
        };
    };

    /**
     * Get performance data from student performance records
     */
    private static getPerformanceData = async (student_id: string) => {
        const performanceResult: any = await StudentPerformance.find(
            { student_id },
            {
                sort: { academic_year: "DESC", semester: "DESC" },
            }
        );

        const records = performanceResult.rows || [];

        // Calculate aggregate statistics
        let totalGPA = 0;
        let totalPercentage = 0;
        let semesterCount = 0;

        for (const record of records) {
            if (record.performance_data?.overall_gpa) {
                totalGPA += record.performance_data.overall_gpa;
                semesterCount++;
            }
            if (record.performance_data?.overall_percentage) {
                totalPercentage += record.performance_data.overall_percentage;
            }
        }

        return {
            semester_records: records,
            summary: {
                total_semesters: records.length,
                average_gpa: semesterCount > 0 ? (totalGPA / semesterCount).toFixed(2) : "N/A",
                average_percentage: records.length > 0 ? (totalPercentage / records.length).toFixed(2) : "N/A",
                best_semester:
                    records.length > 0
                        ? records.reduce((best: any, current: any) =>
                              !best ||
                              current.performance_data?.overall_percentage >
                                  best.performance_data?.overall_percentage
                                  ? current
                                  : best
                          )
                        : null,
                recent_semester: records.length > 0 ? records[0] : null,
            },
        };
    };

    /**
     * Get attendance analytics
     */
    private static getAttendanceAnalytics = async (student_id: string, campus_id: string) => {
        const attendanceResult: any = await Attendance.find({
            user_id: student_id,
            campus_id,
        });

        const records = attendanceResult.rows || [];

        // Calculate statistics
        const totalDays = records.length;
        const presentDays = records.filter((r: any) => r.status === "present").length;
        const absentDays = records.filter((r: any) => r.status === "absent").length;
        const lateDays = records.filter((r: any) => r.status === "late").length;
        const leaveDays = records.filter((r: any) => r.status === "leave").length;

        const attendancePercentage = totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0;

        // Group by month for trend analysis
        const monthlyAttendance = this.groupAttendanceByMonth(records);

        return {
            summary: {
                total_days: totalDays,
                present_days: presentDays,
                absent_days: absentDays,
                late_days: lateDays,
                leave_days: leaveDays,
                attendance_percentage: attendancePercentage.toFixed(2),
            },
            monthly_trend: monthlyAttendance,
            recent_records: records.slice(0, 10), // Last 10 attendance records
        };
    };

    /**
     * Get course enrollment and progress analytics
     */
    private static getCourseAnalytics = async (student_id: string, campus_id: string) => {
        const enrollmentResult: any = await CourseEnrollment.find({
            user_id: student_id,
            campus_id,
        });

        const enrollments = enrollmentResult.rows || [];

        // Get progress data for all enrolled courses
        const courseProgressPromises = enrollments.map(async (enrollment: any) => {
            const progressResult: any = await CourseProgress.find({
                user_id: student_id,
                course_id: enrollment.course_id,
            });

            return {
                enrollment,
                progress: progressResult.rows || [],
            };
        });

        const coursesWithProgress = await Promise.all(courseProgressPromises);

        // Calculate statistics
        const totalCourses = enrollments.length;
        const activeCourses = enrollments.filter((e: any) => e.enrollment_status === "active").length;
        const completedCourses = enrollments.filter((e: any) => e.enrollment_status === "completed").length;

        const totalProgress = enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0);
        const avgProgress = totalCourses > 0 ? totalProgress / totalCourses : 0;

        return {
            summary: {
                total_courses: totalCourses,
                active_courses: activeCourses,
                completed_courses: completedCourses,
                average_progress: avgProgress.toFixed(2),
                certificates_earned: enrollments.filter((e: any) => e.certificate_issued).length,
            },
            courses: coursesWithProgress,
            status_breakdown: {
                active: activeCourses,
                completed: completedCourses,
                dropped: enrollments.filter((e: any) => e.enrollment_status === "dropped").length,
                suspended: enrollments.filter((e: any) => e.enrollment_status === "suspended").length,
                expired: enrollments.filter((e: any) => e.enrollment_status === "expired").length,
            },
        };
    };

    /**
     * Get assignment submission and performance analytics
     */
    private static getAssignmentAnalytics = async (student_id: string, campus_id: string) => {
        const submissionResult: any = await AssignmentSubmission.find({
            user_id: student_id,
            campus_id,
        });

        const submissions = submissionResult.rows || [];

        // Get all assignments for the student's class
        const assignmentResult: any = await Assignment.find({
            campus_id,
        });

        const allAssignments = assignmentResult.rows || [];

        // Calculate statistics
        const totalAssignments = allAssignments.length;
        const submittedCount = submissions.length;
        const gradedSubmissions = submissions.filter((s: any) => s.grade !== undefined && s.grade !== null);

        let totalGrade = 0;
        let highestGrade = 0;
        let lowestGrade = 100;

        for (const submission of gradedSubmissions) {
            totalGrade += submission.grade || 0;
            if (submission.grade > highestGrade) highestGrade = submission.grade;
            if (submission.grade < lowestGrade) lowestGrade = submission.grade;
        }

        const avgGrade = gradedSubmissions.length > 0 ? totalGrade / gradedSubmissions.length : 0;

        return {
            summary: {
                total_assignments: totalAssignments,
                submitted_count: submittedCount,
                pending_count: totalAssignments - submittedCount,
                submission_percentage:
                    totalAssignments > 0 ? ((submittedCount / totalAssignments) * 100).toFixed(2) : "0",
                graded_count: gradedSubmissions.length,
                average_grade: avgGrade.toFixed(2),
                highest_grade: gradedSubmissions.length > 0 ? highestGrade : "N/A",
                lowest_grade: gradedSubmissions.length > 0 ? lowestGrade : "N/A",
            },
            recent_submissions: submissions.slice(0, 10),
            grade_distribution: this.calculateGradeDistribution(gradedSubmissions),
        };
    };

    /**
     * Get quiz performance analytics
     */
    private static getQuizAnalytics = async (student_id: string, campus_id: string) => {
        const submissionResult: any = await ClassQuizSubmission.find({
            user_id: student_id,
            campus_id,
            is_deleted: false,
        });

        const submissions = submissionResult.rows || [];

        // Get all quizzes
        const quizResult: any = await ClassQuiz.find({
            campus_id,
            is_active: true,
            is_deleted: false,
        });

        const allQuizzes = quizResult.rows || [];

        // Calculate statistics
        let totalScore = 0;
        let highestScore = 0;
        let lowestScore = 100;

        for (const submission of submissions) {
            totalScore += submission.score || 0;
            if (submission.score > highestScore) highestScore = submission.score;
            if (submission.score < lowestScore) lowestScore = submission.score;
        }

        const avgScore = submissions.length > 0 ? totalScore / submissions.length : 0;

        return {
            summary: {
                total_quizzes_available: allQuizzes.length,
                quizzes_attempted: submissions.length,
                average_score: avgScore.toFixed(2),
                highest_score: submissions.length > 0 ? highestScore : "N/A",
                lowest_score: submissions.length > 0 ? lowestScore : "N/A",
                attempt_percentage:
                    allQuizzes.length > 0 ? ((submissions.length / allQuizzes.length) * 100).toFixed(2) : "0",
            },
            recent_submissions: submissions.slice(0, 10),
            performance_trend: this.calculateQuizPerformanceTrend(submissions),
        };
    };

    /**
     * Get examination results
     */
    private static getExamResults = async (student_id: string, campus_id: string) => {
        const recordResult: any = await StudentRecord.find({
            student_id,
            campus_id,
        });

        const records = recordResult.rows || [];

        // Process exam records
        const examResults: any[] = [];
        let totalSubjects = 0;
        let totalMarksObtained = 0;
        let totalMarksPossible = 0;

        for (const record of records) {
            if (record.record_data && Array.isArray(record.record_data)) {
                for (const termData of record.record_data) {
                    if (termData.marks && Array.isArray(termData.marks)) {
                        for (const mark of termData.marks) {
                            examResults.push({
                                exam_term_id: termData.exam_term_id,
                                subject_id: mark.subject_id,
                                marks_obtained: mark.mark_gained,
                                total_marks: mark.total_marks,
                                grade: mark.grade,
                                percentage: ((mark.mark_gained / mark.total_marks) * 100).toFixed(2),
                                examination_id: mark.examination_id,
                            });

                            totalSubjects++;
                            totalMarksObtained += mark.mark_gained || 0;
                            totalMarksPossible += mark.total_marks || 0;
                        }
                    }
                }
            }
        }

        return {
            summary: {
                total_exams: totalSubjects,
                total_marks_obtained: totalMarksObtained,
                total_marks_possible: totalMarksPossible,
                overall_percentage:
                    totalMarksPossible > 0 ? ((totalMarksObtained / totalMarksPossible) * 100).toFixed(2) : "0",
            },
            exam_results: examResults,
        };
    };

    /**
     * Get leave request history
     */
    private static getLeaveHistory = async (student_id: string, campus_id: string) => {
        const leaveResult: any = await LeaveRequest.find({
            user_id: student_id,
            campus_id,
            user_type: "Student",
        });

        const leaves = leaveResult.rows || [];

        return {
            summary: {
                total_requests: leaves.length,
                approved: leaves.filter((l: any) => l.status === "Approved").length,
                rejected: leaves.filter((l: any) => l.status === "Rejected").length,
                pending: leaves.filter((l: any) => l.status === "Pending").length,
                cancelled: leaves.filter((l: any) => l.status === "Cancelled").length,
                total_leave_days: leaves
                    .filter((l: any) => l.status === "Approved")
                    .reduce((sum: number, l: any) => sum + (l.total_days || 0), 0),
            },
            recent_requests: leaves.slice(0, 10),
        };
    };

    /**
     * Calculate overall analytics combining all data
     */
    private static calculateOverallAnalytics = (data: any) => {
        const {
            performanceData,
            attendanceAnalytics,
            courseAnalytics,
            assignmentAnalytics,
            quizAnalytics,
        } = data;

        // Calculate academic health score (0-100)
        let academicHealthScore = 0;
        let scoreComponents = 0;

        if (performanceData.summary.average_percentage !== "N/A") {
            academicHealthScore += parseFloat(performanceData.summary.average_percentage) * 0.3;
            scoreComponents++;
        }

        if (attendanceAnalytics.summary.attendance_percentage) {
            academicHealthScore += parseFloat(attendanceAnalytics.summary.attendance_percentage) * 0.2;
            scoreComponents++;
        }

        if (assignmentAnalytics.summary.average_grade) {
            academicHealthScore += parseFloat(assignmentAnalytics.summary.average_grade) * 0.25;
            scoreComponents++;
        }

        if (quizAnalytics.summary.average_score !== "N/A") {
            academicHealthScore += parseFloat(quizAnalytics.summary.average_score) * 0.25;
            scoreComponents++;
        }

        return {
            academic_health_score: academicHealthScore.toFixed(2),
            performance_grade: this.getPerformanceGrade(academicHealthScore),
            strengths: this.identifyStrengths(data),
            areas_for_improvement: this.identifyImprovementAreas(data),
            recommendations: this.generateRecommendations(data),
        };
    };

    /**
     * Helper: Group attendance by month
     */
    private static groupAttendanceByMonth = (records: any[]) => {
        const monthlyData: any = {};

        for (const record of records) {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthKey,
                    total: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    leave: 0,
                };
            }

            monthlyData[monthKey].total++;
            monthlyData[monthKey][record.status]++;
        }

        return Object.values(monthlyData);
    };

    /**
     * Helper: Calculate grade distribution
     */
    private static calculateGradeDistribution = (submissions: any[]) => {
        const distribution: any = {
            "90-100": 0,
            "80-89": 0,
            "70-79": 0,
            "60-69": 0,
            "50-59": 0,
            "Below 50": 0,
        };

        for (const submission of submissions) {
            const grade = submission.grade || 0;
            if (grade >= 90) distribution["90-100"]++;
            else if (grade >= 80) distribution["80-89"]++;
            else if (grade >= 70) distribution["70-79"]++;
            else if (grade >= 60) distribution["60-69"]++;
            else if (grade >= 50) distribution["50-59"]++;
            else distribution["Below 50"]++;
        }

        return distribution;
    };

    /**
     * Helper: Calculate quiz performance trend
     */
    private static calculateQuizPerformanceTrend = (submissions: any[]) => {
        // Sort by date
        const sorted = [...submissions].sort(
            (a, b) => new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime()
        );

        return sorted.map((s) => ({
            date: s.submission_date,
            score: s.score,
        }));
    };

    /**
     * Helper: Get performance grade
     */
    private static getPerformanceGrade = (score: number): string => {
        if (score >= 90) return "Excellent";
        if (score >= 80) return "Very Good";
        if (score >= 70) return "Good";
        if (score >= 60) return "Satisfactory";
        if (score >= 50) return "Needs Improvement";
        return "Poor";
    };

    /**
     * Helper: Identify strengths
     */
    private static identifyStrengths = (data: any): string[] => {
        const strengths: string[] = [];

        if (parseFloat(data.performanceData.summary.average_gpa) >= 3.5) {
            strengths.push("Excellent academic performance");
        }

        if (parseFloat(data.attendanceAnalytics.summary.attendance_percentage) >= 90) {
            strengths.push("Outstanding attendance record");
        }

        if (parseFloat(data.assignmentAnalytics.summary.submission_percentage) >= 90) {
            strengths.push("Consistent assignment submissions");
        }

        if (parseFloat(data.quizAnalytics.summary.average_score) >= 80) {
            strengths.push("Strong quiz performance");
        }

        return strengths.length > 0 ? strengths : ["Showing potential for improvement"];
    };

    /**
     * Helper: Identify areas for improvement
     */
    private static identifyImprovementAreas = (data: any): string[] => {
        const areas: string[] = [];

        if (parseFloat(data.attendanceAnalytics.summary.attendance_percentage) < 75) {
            areas.push("Improve attendance regularity");
        }

        if (parseFloat(data.assignmentAnalytics.summary.submission_percentage) < 75) {
            areas.push("Submit assignments on time");
        }

        if (parseFloat(data.quizAnalytics.summary.average_score) < 60) {
            areas.push("Enhance quiz preparation");
        }

        if (parseFloat(data.performanceData.summary.average_gpa) < 2.5) {
            areas.push("Focus on improving overall grades");
        }

        return areas.length > 0 ? areas : ["Maintain current performance level"];
    };

    /**
     * Helper: Generate recommendations
     */
    private static generateRecommendations = (data: any): string[] => {
        const recommendations: string[] = [];

        if (parseFloat(data.attendanceAnalytics.summary.attendance_percentage) < 75) {
            recommendations.push("Regular class attendance is crucial for academic success");
        }

        if (parseFloat(data.assignmentAnalytics.summary.submission_percentage) < 75) {
            recommendations.push("Create a study schedule to complete assignments on time");
        }

        if (parseFloat(data.courseAnalytics.summary.average_progress) < 50) {
            recommendations.push("Increase time spent on course materials");
        }

        if (data.feeStatus.summary.total_due_amount > 0) {
            recommendations.push("Clear pending fee payments to avoid disruptions");
        }

        if (recommendations.length === 0) {
            recommendations.push("Keep up the excellent work!");
        }

        return recommendations;
    };
}
