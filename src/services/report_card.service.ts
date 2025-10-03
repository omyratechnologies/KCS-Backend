import { Attendance } from "@/models/attendance.model";
import { AssignmentSubmission } from "@/models/assignment_submission.model";
import { Class } from "@/models/class.model";
import { ClassQuizSubmission } from "@/models/class_quiz_submission.model";
import { CourseEnrollment } from "@/models/course_enrollment.model";
import { ReportCard } from "@/models/report_card.model";
import { StudentRecord } from "@/models/student_record.model";
import { Subject } from "@/models/subject.model";
import { User } from "@/models/user.model";

interface SubjectPerformance {
    subject_id: string;
    subject_name: string;
    exam_marks?: {
        marks_obtained: number;
        total_marks: number;
        percentage: number;
        grade: string;
    };
    assignment_stats: {
        total_assignments: number;
        submitted: number;
        average_grade?: number;
        completion_rate: number;
    };
    quiz_stats: {
        total_quizzes: number;
        attempted: number;
        average_score?: number;
        completion_rate: number;
    };
    overall_performance: {
        percentage: number;
        grade: string;
        remarks: string;
    };
}

interface MonthlyReportCard {
    report_id: string;
    student_info: {
        id: string;
        name: string;
        email: string;
        class_id: string;
        class_name: string;
        roll_number?: string;
    };
    academic_info: {
        academic_year: string;
        month: string;
        month_name: string;
        semester?: string;
    };
    attendance: {
        total_days: number;
        present: number;
        absent: number;
        late: number;
        leave: number;
        attendance_percentage: number;
        remarks: string;
    };
    subjects_performance: any[];
    activity_summary: any;
    overall_performance: any;
    behavioral_metrics: any;
    teacher_remarks?: any[];
    achievements?: string[];
    co_curricular_activities?: any[];
    generated_at: string;
    generated_by: string;
}

export class ReportCardService {
    /**
     * Generate monthly report card for a student
     */
    static async generateMonthlyReportCard(
        student_id: string,
        campus_id: string,
        month: string, // Format: YYYY-MM
        generated_by: string,
        academic_year?: string
    ): Promise<MonthlyReportCard> {
        // Parse month
        const [, monthNum] = month.split("-");
        const monthStart = new Date(`${month}-01T00:00:00.000Z`);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const month_name = monthNames[parseInt(monthNum) - 1];

        // Determine academic year if not provided
        if (!academic_year) {
            academic_year = this.getAcademicYear(monthStart);
        }

        // Get student info
        const student = await User.findById(student_id);
        if (!student) {
            throw new Error("Student not found");
        }

        // Get student's class - Ottoman automatically handles array contains
        // But if that doesn't work, we'll fall back to manual filtering
        let studentClasses = await Class.find({
            campus_id,
            student_ids: student_id, // Ottoman handles array contains automatically
            is_active: true,
            is_deleted: false,
        });

        // Fallback: Get all classes and filter manually (like class.service.ts does)
        if (!studentClasses.rows || studentClasses.rows.length === 0) {
            const allClasses = await Class.find({
                campus_id,
                is_active: true,
                is_deleted: false,
            });

            const filteredClasses = allClasses.rows.filter(
                (classItem: any) => classItem.student_ids && classItem.student_ids.includes(student_id)
            );

            if (filteredClasses.length === 0) {
                throw new Error("Student not enrolled in any class");
            }

            studentClasses = { rows: filteredClasses } as any;
        }

        const studentClass = studentClasses.rows[0];

        // Gather all data for the month
        const attendance = await this.getMonthlyAttendance(student_id, campus_id, monthStart, monthEnd);
        const subjectsPerformance = await this.getSubjectsPerformance(
            student_id,
            campus_id,
            studentClass.id,
            monthStart,
            monthEnd,
            academic_year
        );
        const activitySummary = await this.getActivitySummary(student_id, campus_id, monthStart, monthEnd);
        const overallPerformance = this.calculateOverallPerformance(subjectsPerformance, activitySummary);
        const behavioralMetrics = this.calculateBehavioralMetrics(attendance, activitySummary);

        // Check if report already exists
        const existingReport = await ReportCard.find({
            campus_id,
            student_id,
            month,
        });

        const reportData = {
            attendance,
            subjects_performance: subjectsPerformance,
            activity_summary: activitySummary,
            overall_performance: overallPerformance,
            behavioral_metrics: behavioralMetrics,
        };

        let reportCard;

        if (existingReport.rows && existingReport.rows.length > 0) {
            // Update existing report
            reportCard = existingReport.rows[0];
            reportCard.report_data = reportData;
            reportCard.updated_at = new Date();
            reportCard.updated_by = generated_by;
            await ReportCard.updateById(reportCard.id, reportCard);
        } else {
            // Create new report
            // Auto-publish if generated by student themselves
            const isStudentGenerated = generated_by === student_id;
            
            reportCard = await ReportCard.create({
                campus_id,
                student_id,
                class_id: studentClass.id,
                academic_year,
                month,
                month_name,
                semester: this.getSemester(monthStart),
                report_data: reportData,
                generated_at: new Date(),
                generated_by,
                updated_at: new Date(),
                is_published: isStudentGenerated, // Auto-publish for students
                is_final: false,
            });
        }

        return this.formatReportCard(reportCard, student, studentClass);
    }

    /**
     * Get monthly report card (for student viewing)
     * Auto-generates if not exists
     */
    static async getMonthlyReportCard(
        student_id: string,
        campus_id: string,
        month: string
    ): Promise<MonthlyReportCard> {
        // Try to find existing report
        let reportCard = await ReportCard.find({
            campus_id,
            student_id,
            month,
            is_published: true,
        });

        // If no published report exists, generate it automatically
        if (!reportCard.rows || reportCard.rows.length === 0) {
            // Generate new report
            return await this.generateMonthlyReportCard(
                student_id,
                campus_id,
                month,
                student_id // Student auto-generates
            );
        }

        const student = await User.findById(student_id);
        const studentClass = await Class.findById(reportCard.rows[0].class_id);

        return this.formatReportCard(reportCard.rows[0], student, studentClass);
    }

    /**
     * Get all report cards for a student (accessible by teacher/admin)
     */
    static async getAllReportCards(
        student_id: string,
        campus_id: string,
        academic_year?: string
    ): Promise<MonthlyReportCard[]> {
        const query: Record<string, any> = {
            campus_id,
            student_id,
        };

        if (academic_year) {
            query.academic_year = academic_year;
        }

        const reportCards = await ReportCard.find(query);

        if (!reportCards.rows || reportCards.rows.length === 0) {
            return [];
        }

        const student = await User.findById(student_id);
        const studentClass = await Class.findById(reportCards.rows[0].class_id);

        return reportCards.rows.map(rc => this.formatReportCard(rc, student, studentClass));
    }

    /**
     * Update teacher remarks and achievements
     */
    static async updateTeacherRemarks(
        report_id: string,
        campus_id: string,
        updated_by: string,
        data: {
            teacher_remarks?: Array<{
                subject_id: string;
                subject_name: string;
                teacher_name: string;
                remarks: string;
                strengths: string[];
                areas_for_improvement: string[];
            }>;
            achievements?: string[];
            co_curricular_activities?: Array<{
                activity_name: string;
                participation_level: string;
                remarks?: string;
            }>;
        }
    ): Promise<MonthlyReportCard> {
        const reportCard = await ReportCard.findById(report_id);

        if (!reportCard) {
            throw new Error("Report card not found");
        }

        if (reportCard.campus_id !== campus_id) {
            throw new Error("Report card does not belong to this campus");
        }

        if (reportCard.is_final) {
            throw new Error("Cannot update a finalized report card");
        }

        // Update fields
        if (data.teacher_remarks) {
            reportCard.teacher_remarks = data.teacher_remarks;
        }
        if (data.achievements) {
            reportCard.achievements = data.achievements;
        }
        if (data.co_curricular_activities) {
            reportCard.co_curricular_activities = data.co_curricular_activities;
        }

        reportCard.updated_at = new Date();
        reportCard.updated_by = updated_by;

        await ReportCard.updateById(report_id, reportCard);

        const student = await User.findById(reportCard.student_id);
        const studentClass = await Class.findById(reportCard.class_id);

        return this.formatReportCard(reportCard, student, studentClass);
    }

    /**
     * Publish report card (make it visible to student/parent)
     */
    static async publishReportCard(report_id: string, campus_id: string): Promise<void> {
        const reportCard = await ReportCard.findById(report_id);

        if (!reportCard) {
            throw new Error("Report card not found");
        }

        if (reportCard.campus_id !== campus_id) {
            throw new Error("Report card does not belong to this campus");
        }

        reportCard.is_published = true;
        reportCard.updated_at = new Date();

        await ReportCard.updateById(report_id, reportCard);
    }

    /**
     * Finalize report card (no more edits allowed)
     */
    static async finalizeReportCard(report_id: string, campus_id: string): Promise<void> {
        const reportCard = await ReportCard.findById(report_id);

        if (!reportCard) {
            throw new Error("Report card not found");
        }

        if (reportCard.campus_id !== campus_id) {
            throw new Error("Report card does not belong to this campus");
        }

        reportCard.is_final = true;
        reportCard.is_published = true;
        reportCard.updated_at = new Date();

        await ReportCard.updateById(report_id, reportCard);
    }

    /**
     * Get available months with published report cards for a student
     */
    static async getAvailableMonths(
        student_id: string,
        campus_id: string,
        include_unpublished = false
    ): Promise<Array<{
        month: string;
        month_name: string;
        academic_year: string;
        is_published: boolean;
        is_final: boolean;
        generated_at: string;
    }>> {
        const query: Record<string, string | boolean> = {
            campus_id,
            student_id,
        };

        // Students can only see published reports
        if (!include_unpublished) {
            query.is_published = true;
        }

        const reportCards = await ReportCard.find(query);

        if (!reportCards.rows || reportCards.rows.length === 0) {
            return [];
        }

        // Sort by month descending (most recent first)
        const sortedReports = reportCards.rows.sort((a, b) => {
            return b.month.localeCompare(a.month);
        });

        return sortedReports.map(report => ({
            month: report.month,
            month_name: report.month_name,
            academic_year: report.academic_year,
            is_published: report.is_published,
            is_final: report.is_final,
            generated_at: report.generated_at.toISOString(),
        }));
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private static async getMonthlyAttendance(
        student_id: string,
        campus_id: string,
        monthStart: Date,
        monthEnd: Date
    ) {
        const attendanceRecords = await Attendance.find({
            campus_id,
            user_id: student_id,
        });

        const monthRecords = (attendanceRecords.rows || []).filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= monthStart && recordDate < monthEnd;
        });

        const total_days = monthRecords.length;
        const present = monthRecords.filter(r => r.status === "present").length;
        const absent = monthRecords.filter(r => r.status === "absent").length;
        const late = monthRecords.filter(r => r.status === "late").length;
        const leave = monthRecords.filter(r => r.status === "leave").length;
        const attendance_percentage = total_days > 0 ? (present / total_days) * 100 : 0;

        let remarks = "";
        if (attendance_percentage >= 95) {
            remarks = "Excellent attendance";
        } else if (attendance_percentage >= 85) {
            remarks = "Good attendance";
        } else if (attendance_percentage >= 75) {
            remarks = "Satisfactory attendance";
        } else if (attendance_percentage >= 65) {
            remarks = "Poor attendance - needs improvement";
        } else {
            remarks = "Very poor attendance - immediate attention required";
        }

        return {
            total_days,
            present,
            absent,
            late,
            leave,
            attendance_percentage: parseFloat(attendance_percentage.toFixed(2)),
            remarks,
        };
    }

    private static async getSubjectsPerformance(
        student_id: string,
        campus_id: string,
        _class_id: string,
        monthStart: Date,
        monthEnd: Date,
        _academic_year: string
    ): Promise<SubjectPerformance[]> {
        // Get all subjects for the class
        const subjects = await Subject.find({ campus_id });
        const allSubjects = subjects.rows || [];

        // Get exam records
        const studentRecords = await StudentRecord.find({
            campus_id,
            student_id,
        });

        const subjectsPerformance: SubjectPerformance[] = [];

        for (const subject of allSubjects) {
            // Get exam marks for this subject
            let examMarks: SubjectPerformance["exam_marks"] = undefined;
            if (studentRecords.rows && studentRecords.rows.length > 0) {
                for (const record of studentRecords.rows) {
                    for (const termData of record.record_data || []) {
                        for (const mark of termData.marks || []) {
                            if (mark.subject_id === subject.id) {
                                const percentage = (mark.mark_gained / mark.total_marks) * 100;
                                examMarks = {
                                    marks_obtained: mark.mark_gained,
                                    total_marks: mark.total_marks,
                                    percentage: parseFloat(percentage.toFixed(2)),
                                    grade: mark.grade,
                                };
                                break;
                            }
                        }
                    }
                }
            }

            // Get assignment stats
            const assignmentStats = await this.getSubjectAssignmentStats(
                student_id,
                campus_id,
                subject.id,
                monthStart,
                monthEnd
            );

            // Get quiz stats
            const quizStats = await this.getSubjectQuizStats(
                student_id,
                campus_id,
                subject.id,
                monthStart,
                monthEnd
            );

            // Calculate overall performance for the subject
            const overallPerformance = this.calculateSubjectOverallPerformance(
                examMarks,
                assignmentStats,
                quizStats
            );

            // Only include subjects with some activity
            if (examMarks || assignmentStats.total_assignments > 0 || quizStats.total_quizzes > 0) {
                subjectsPerformance.push({
                    subject_id: subject.id,
                    subject_name: subject.name,
                    exam_marks: examMarks,
                    assignment_stats: assignmentStats,
                    quiz_stats: quizStats,
                    overall_performance: overallPerformance,
                });
            }
        }

        return subjectsPerformance;
    }

    private static async getSubjectAssignmentStats(
        student_id: string,
        campus_id: string,
        subject_id: string,
        monthStart: Date,
        monthEnd: Date
    ) {
        const submissions = await AssignmentSubmission.find({
            campus_id,
            user_id: student_id,
        });

        const monthSubmissions = (submissions.rows || []).filter(sub => {
            const subDate = new Date(sub.submission_date);
            return subDate >= monthStart && subDate < monthEnd;
        });

        const total_assignments = monthSubmissions.length;
        const submitted = monthSubmissions.filter(s => s.grade !== null && s.grade !== undefined).length;
        const grades = monthSubmissions
            .filter(s => s.grade !== null && s.grade !== undefined)
            .map(s => s.grade);
        const average_grade = grades.length > 0
            ? parseFloat((grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2))
            : undefined;
        const completion_rate = total_assignments > 0
            ? parseFloat(((submitted / total_assignments) * 100).toFixed(2))
            : 0;

        return {
            total_assignments,
            submitted,
            average_grade,
            completion_rate,
        };
    }

    private static async getSubjectQuizStats(
        student_id: string,
        campus_id: string,
        subject_id: string,
        monthStart: Date,
        monthEnd: Date
    ) {
        const quizSubmissions = await ClassQuizSubmission.find({
            campus_id,
            user_id: student_id,
            is_active: true,
            is_deleted: false,
        });

        const monthQuizzes = (quizSubmissions.rows || []).filter(quiz => {
            const quizDate = new Date(quiz.created_at);
            return quizDate >= monthStart && quizDate < monthEnd;
        });

        const total_quizzes = monthQuizzes.length;
        const attempted = monthQuizzes.filter(q => q.score !== null && q.score !== undefined).length;
        const scores = monthQuizzes
            .filter(q => q.score !== null && q.score !== undefined)
            .map(q => q.score);
        const average_score = scores.length > 0
            ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
            : undefined;
        const completion_rate = total_quizzes > 0
            ? parseFloat(((attempted / total_quizzes) * 100).toFixed(2))
            : 0;

        return {
            total_quizzes,
            attempted,
            average_score,
            completion_rate,
        };
    }

    private static async getActivitySummary(
        student_id: string,
        campus_id: string,
        monthStart: Date,
        monthEnd: Date
    ) {
        // Get assignments
        const submissions = await AssignmentSubmission.find({
            campus_id,
            user_id: student_id,
        });

        const monthSubmissions = (submissions.rows || []).filter(sub => {
            const subDate = new Date(sub.submission_date);
            return subDate >= monthStart && subDate < monthEnd;
        });

        const assignmentGrades = monthSubmissions
            .filter(s => s.grade !== null && s.grade !== undefined)
            .map(s => s.grade);

        // Get quizzes
        const quizSubmissions = await ClassQuizSubmission.find({
            campus_id,
            user_id: student_id,
            is_active: true,
            is_deleted: false,
        });

        const monthQuizzes = (quizSubmissions.rows || []).filter(quiz => {
            const quizDate = new Date(quiz.created_at);
            return quizDate >= monthStart && quizDate < monthEnd;
        });

        const quizScores = monthQuizzes
            .filter(q => q.score !== null && q.score !== undefined)
            .map(q => q.score);

        // Get courses
        const courseEnrollments = await CourseEnrollment.find({
            campus_id,
            user_id: student_id,
        });

        const enrolledCourses = courseEnrollments.rows || [];
        const inProgressCourses = enrolledCourses.filter(
            c => c.progress_percentage > 0 && c.progress_percentage < 100
        );
        const completedCourses = enrolledCourses.filter(c => c.progress_percentage === 100);
        const avgProgress = enrolledCourses.length > 0
            ? enrolledCourses.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) / enrolledCourses.length
            : 0;

        return {
            assignments: {
                total: monthSubmissions.length,
                submitted: monthSubmissions.filter(s => s.grade !== null).length,
                pending: monthSubmissions.filter(s => s.grade === null).length,
                overdue: 0, // Would need due_date logic
                average_grade: assignmentGrades.length > 0
                    ? parseFloat((assignmentGrades.reduce((a, b) => a + b, 0) / assignmentGrades.length).toFixed(2))
                    : undefined,
                completion_rate: monthSubmissions.length > 0
                    ? parseFloat(((monthSubmissions.filter(s => s.grade !== null).length / monthSubmissions.length) * 100).toFixed(2))
                    : 0,
            },
            quizzes: {
                total: monthQuizzes.length,
                attempted: monthQuizzes.filter(q => q.score !== null).length,
                average_score: quizScores.length > 0
                    ? parseFloat((quizScores.reduce((a, b) => a + b, 0) / quizScores.length).toFixed(2))
                    : undefined,
                completion_rate: monthQuizzes.length > 0
                    ? parseFloat(((monthQuizzes.filter(q => q.score !== null).length / monthQuizzes.length) * 100).toFixed(2))
                    : 0,
            },
            courses: {
                enrolled: enrolledCourses.length,
                in_progress: inProgressCourses.length,
                completed: completedCourses.length,
                average_progress: parseFloat(avgProgress.toFixed(2)),
            },
        };
    }

    private static calculateSubjectOverallPerformance(
        examMarks: SubjectPerformance["exam_marks"],
        assignmentStats: any,
        quizStats: any
    ) {
        let totalScore = 0;
        let weightSum = 0;

        // Exams: 60% weight
        if (examMarks) {
            totalScore += examMarks.percentage * 0.6;
            weightSum += 0.6;
        }

        // Assignments: 25% weight
        if (assignmentStats.average_grade !== undefined) {
            totalScore += assignmentStats.average_grade * 0.25;
            weightSum += 0.25;
        }

        // Quizzes: 15% weight
        if (quizStats.average_score !== undefined) {
            totalScore += quizStats.average_score * 0.15;
            weightSum += 0.15;
        }

        const percentage = weightSum > 0 ? totalScore / weightSum : 0;
        const grade = this.calculateGrade(percentage);
        const remarks = this.getPerformanceRemarks(percentage);

        return {
            percentage: parseFloat(percentage.toFixed(2)),
            grade,
            remarks,
        };
    }

    private static calculateOverallPerformance(subjectsPerformance: SubjectPerformance[], _activitySummary: any) {
        const subjectPercentages = subjectsPerformance
            .filter(s => s.overall_performance.percentage > 0)
            .map(s => s.overall_performance.percentage);

        const total_marks_obtained = subjectPercentages.reduce((sum, p) => sum + p, 0);
        const total_marks_possible = subjectPercentages.length * 100;
        const overall_percentage = subjectPercentages.length > 0
            ? parseFloat((total_marks_obtained / subjectPercentages.length).toFixed(2))
            : 0;

        return {
            total_marks_obtained: parseFloat(total_marks_obtained.toFixed(2)),
            total_marks_possible,
            overall_percentage,
            overall_grade: this.calculateGrade(overall_percentage),
            overall_gpa: this.calculateGPA(overall_percentage),
        };
    }

    private static calculateBehavioralMetrics(attendance: any, activitySummary: any) {
        // Discipline score based on attendance
        const discipline_score = Math.min(100, attendance.attendance_percentage);

        // Participation score based on quiz and assignment completion
        const assignmentParticipation = activitySummary.assignments.completion_rate || 0;
        const quizParticipation = activitySummary.quizzes.completion_rate || 0;
        const participation_score = parseFloat(((assignmentParticipation + quizParticipation) / 2).toFixed(2));

        // Punctuality score (based on late attendance)
        const latePercentage = attendance.total_days > 0
            ? (attendance.late / attendance.total_days) * 100
            : 0;
        const punctuality_score = Math.max(0, parseFloat((100 - latePercentage).toFixed(2)));

        const remarks: string[] = [];
        if (discipline_score >= 90) {
            remarks.push("Excellent discipline and attendance");
        } else if (discipline_score < 75) {
            remarks.push("Needs improvement in attendance");
        }

        if (participation_score >= 90) {
            remarks.push("Highly engaged and participative");
        } else if (participation_score < 70) {
            remarks.push("Should participate more actively");
        }

        if (punctuality_score >= 95) {
            remarks.push("Always punctual");
        } else if (punctuality_score < 80) {
            remarks.push("Needs to improve punctuality");
        }

        return {
            discipline_score: parseFloat(discipline_score.toFixed(2)),
            participation_score,
            punctuality_score,
            remarks,
        };
    }

    private static calculateGrade(percentage: number): string {
        if (percentage >= 90) {
            return "A+";
        }
        if (percentage >= 80) {
            return "A";
        }
        if (percentage >= 70) {
            return "B+";
        }
        if (percentage >= 60) {
            return "B";
        }
        if (percentage >= 50) {
            return "C+";
        }
        if (percentage >= 40) {
            return "C";
        }
        if (percentage >= 33) {
            return "D";
        }
        return "F";
    }

    private static calculateGPA(percentage: number): number {
        if (percentage >= 90) {
            return 4.0;
        }
        if (percentage >= 80) {
            return 3.7;
        }
        if (percentage >= 70) {
            return 3.3;
        }
        if (percentage >= 60) {
            return 3.0;
        }
        if (percentage >= 50) {
            return 2.7;
        }
        if (percentage >= 40) {
            return 2.3;
        }
        if (percentage >= 33) {
            return 2.0;
        }
        return 0.0;
    }

    private static getPerformanceRemarks(percentage: number): string {
        if (percentage >= 90) {
            return "Outstanding performance";
        }
        if (percentage >= 80) {
            return "Excellent work";
        }
        if (percentage >= 70) {
            return "Good progress";
        }
        if (percentage >= 60) {
            return "Satisfactory performance";
        }
        if (percentage >= 50) {
            return "Needs improvement";
        }
        if (percentage >= 40) {
            return "Below expectations";
        }
        return "Significant improvement required";
    }

    private static getAcademicYear(date: Date): string {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // Academic year typically starts in April
        if (month >= 4) {
            return `${year}-${year + 1}`;
        } else {
            return `${year - 1}-${year}`;
        }
    }

    private static getSemester(date: Date): string {
        const month = date.getMonth() + 1;

        // Semester 1: April to September
        // Semester 2: October to March
        if (month >= 4 && month <= 9) {
            return "Semester 1";
        } else {
            return "Semester 2";
        }
    }

    private static formatReportCard(reportCard: any, student: any, studentClass: any): MonthlyReportCard {
        return {
            report_id: reportCard.id,
            student_info: {
                id: student.id,
                name: student.name,
                email: student.email,
                class_id: studentClass?.id || reportCard.class_id,
                class_name: studentClass?.name || "N/A",
                roll_number: student.roll_number,
            },
            academic_info: {
                academic_year: reportCard.academic_year,
                month: reportCard.month,
                month_name: reportCard.month_name,
                semester: reportCard.semester,
            },
            attendance: reportCard.report_data.attendance,
            subjects_performance: reportCard.report_data.subjects_performance,
            activity_summary: reportCard.report_data.activity_summary,
            overall_performance: reportCard.report_data.overall_performance,
            behavioral_metrics: reportCard.report_data.behavioral_metrics,
            teacher_remarks: reportCard.teacher_remarks,
            achievements: reportCard.achievements,
            co_curricular_activities: reportCard.co_curricular_activities,
            generated_at: reportCard.generated_at.toISOString(),
            generated_by: reportCard.generated_by,
        };
    }
}
