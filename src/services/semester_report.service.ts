import { Attendance } from "@/models/attendance.model";
import { Assignment } from "@/models/assignment.model";
import { AssignmentSubmission } from "@/models/assignment_submission.model";
import { Class } from "@/models/class.model";
import { ClassQuiz } from "@/models/class_quiz.model";
import { ClassQuizSubmission } from "@/models/class_quiz_submission.model";
import { CourseEnrollment } from "@/models/course_enrollment.model";
import { StudentRecord } from "@/models/student_record.model";
import { User } from "@/models/user.model";

interface SemesterReportData {
    student_info: {
        id: string;
        name: string;
        email: string;
        class_id: string;
        class_name: string;
    };
    semester_info: {
        semester: string;
        academic_year: string;
        class_id: string;
    };
    attendance: {
        total_days: number;
        days_present: number;
        days_absent: number;
        days_late: number;
        days_leave: number;
        attendance_percentage: number;
        status: "Excellent" | "Good" | "Average" | "Poor";
    };
    exams: {
        total_exams: number;
        exams_taken: number;
        subjects: Array<{
            subject_id: string;
            subject_name: string;
            marks_obtained: number;
            total_marks: number;
            percentage: number;
            grade: string;
        }>;
        overall_marks_obtained: number;
        overall_total_marks: number;
        overall_percentage: number;
        overall_grade: string;
        overall_gpa: number;
    };
    quizzes: {
        total_quizzes: number;
        quizzes_attempted: number;
        average_score: number;
        best_score: number;
        worst_score: number;
        total_marks_obtained: number;
        total_marks_possible: number;
        quiz_percentage: number;
    };
    assignments: {
        total_assignments: number;
        assignments_submitted: number;
        assignments_graded: number;
        submission_percentage: number;
        average_score: number;
        total_marks_obtained: number;
        total_marks_possible: number;
        assignment_percentage: number;
    };
    courses: {
        total_courses: number;
        active_courses: number;
        completed_courses: number;
        average_progress: number;
        courses_list: Array<{
            course_id: string;
            course_name?: string;
            enrollment_status: string;
            progress_percentage: number;
            enrollment_date: Date;
            completion_date?: Date;
        }>;
    };
    overall_summary: {
        overall_performance: "Excellent" | "Good" | "Average" | "Needs Improvement";
        strengths: string[];
        areas_for_improvement: string[];
    };
    generated_at: Date;
}

export class SemesterReportService {
    /**
     * Generate comprehensive semester report for a student
     */
    public static readonly generateSemesterReport = async (
        student_id: string,
        class_id: string,
        semester: "sem1" | "sem2",
        academic_year?: string
    ): Promise<SemesterReportData> => {
        // Validate student exists
        let student;
        try {
            student = await User.findById(student_id);
        } catch (error) {
            throw new Error(`Student not found with ID: ${student_id}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        if (!student) {
            throw new Error(`Student not found with ID: ${student_id}`);
        }

        // Validate class exists
        let classData;
        try {
            classData = await Class.findById(class_id);
        } catch (error) {
            throw new Error(`Class not found with ID: ${class_id}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        if (!classData) {
            throw new Error(`Class not found with ID: ${class_id}`);
        }

        // If no academic year provided, use current from class
        const reportAcademicYear = academic_year || classData.academic_year;

        // Determine semester date range based on semester and academic year
        const semesterDates = this.getSemesterDateRange(semester, reportAcademicYear);

        // Generate student info
        const student_info = {
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            email: student.email,
            class_id: classData.id,
            class_name: classData.name,
        };

        const semester_info = {
            semester,
            academic_year: reportAcademicYear,
            class_id,
        };

        // Fetch all data in parallel for better performance
        const [attendance, exams, quizzes, assignments, courses] = await Promise.all([
            this.getAttendanceData(student_id, class_id, semesterDates.start, semesterDates.end),
            this.getExamData(student_id, class_id, semester, reportAcademicYear),
            this.getQuizData(student_id, class_id, semesterDates.start, semesterDates.end),
            this.getAssignmentData(student_id, class_id, semesterDates.start, semesterDates.end),
            this.getCourseData(student_id, semesterDates.start, semesterDates.end),
        ]);

        // Generate overall summary
        const overall_summary = this.generateOverallSummary(attendance, exams, quizzes, assignments, courses);

        return {
            student_info,
            semester_info,
            attendance,
            exams,
            quizzes,
            assignments,
            courses,
            overall_summary,
            generated_at: new Date(),
        };
    };

    /**
     * Get semester date range
     */
    private static getSemesterDateRange(
        semester: "sem1" | "sem2",
        academic_year: string
    ): { start: Date; end: Date } {
        // Parse academic year (e.g., "2024-2025")
        const [startYear, endYear] = academic_year.split("-").map((y) => parseInt(y));

        let start: Date;
        let end: Date;

        if (semester === "sem1") {
            // Semester 1: Typically August/September to December/January
            start = new Date(startYear, 7, 1); // August 1st
            end = new Date(startYear, 11, 31); // December 31st
        } else {
            // Semester 2: Typically January/February to May/June
            start = new Date(endYear, 0, 1); // January 1st
            end = new Date(endYear, 5, 30); // June 30th
        }

        return { start, end };
    }

    /**
     * Get attendance data for the semester
     */
    private static async getAttendanceData(
        student_id: string,
        class_id: string,
        start_date: Date,
        end_date: Date
    ) {
        const attendanceRecords: { rows: Record<string, unknown>[] } = await Attendance.find({
            user_id: student_id,
            class_id,
            date: { $gte: start_date, $lte: end_date },
        });

        const total_days = attendanceRecords.rows.length;
        const days_present = attendanceRecords.rows.filter((r) => r.status === "present").length;
        const days_absent = attendanceRecords.rows.filter((r) => r.status === "absent").length;
        const days_late = attendanceRecords.rows.filter((r) => r.status === "late").length;
        const days_leave = attendanceRecords.rows.filter((r) => r.status === "leave").length;

        const attendance_percentage = total_days > 0 ? (days_present / total_days) * 100 : 0;

        let status: "Excellent" | "Good" | "Average" | "Poor";
        if (attendance_percentage >= 90) {
            status = "Excellent";
        } else if (attendance_percentage >= 75) {
            status = "Good";
        } else if (attendance_percentage >= 60) {
            status = "Average";
        } else {
            status = "Poor";
        }

        return {
            total_days,
            days_present,
            days_absent,
            days_late,
            days_leave,
            attendance_percentage: Math.round(attendance_percentage * 100) / 100,
            status,
        };
    }

    /**
     * Get exam data for the semester
     */
    private static async getExamData(
        student_id: string,
        _class_id: string,
        _semester: string,
        _academic_year: string
    ) {
        // Get student records
        const studentRecords: { rows: Record<string, unknown>[] } = await StudentRecord.find({
            student_id,
        });

        const subjects: Array<{
            subject_id: string;
            subject_name: string;
            marks_obtained: number;
            total_marks: number;
            percentage: number;
            grade: string;
        }> = [];

        let overall_marks_obtained = 0;
        let overall_total_marks = 0;
        let total_exams = 0;
        let exams_taken = 0;

        // Process student records to extract exam data
        for (const record of studentRecords.rows) {
            if (record.record_data && Array.isArray(record.record_data)) {
                for (const termData of record.record_data) {
                    // Check if this record is for the current semester
                    if (termData.marks && Array.isArray(termData.marks)) {
                        for (const mark of termData.marks) {
                            total_exams++;
                            if (mark.mark_gained !== undefined && mark.mark_gained !== null) {
                                exams_taken++;
                                overall_marks_obtained += mark.mark_gained;
                                overall_total_marks += mark.total_marks;

                                const percentage = (mark.mark_gained / mark.total_marks) * 100;

                                subjects.push({
                                    subject_id: mark.subject_id || "unknown",
                                    subject_name: mark.subject_name || "Unknown Subject",
                                    marks_obtained: mark.mark_gained,
                                    total_marks: mark.total_marks,
                                    percentage: Math.round(percentage * 100) / 100,
                                    grade: this.calculateGrade(percentage),
                                });
                            }
                        }
                    }
                }
            }
        }

        const overall_percentage = overall_total_marks > 0 ? (overall_marks_obtained / overall_total_marks) * 100 : 0;

        return {
            total_exams,
            exams_taken,
            subjects,
            overall_marks_obtained,
            overall_total_marks,
            overall_percentage: Math.round(overall_percentage * 100) / 100,
            overall_grade: this.calculateGrade(overall_percentage),
            overall_gpa: this.calculateGPA(overall_percentage),
        };
    }

    /**
     * Get quiz data for the semester
     */
    private static async getQuizData(student_id: string, class_id: string, start_date: Date, end_date: Date) {
        // Get all quizzes for the class in the semester
        const quizzes: { rows: Record<string, unknown>[] } = await ClassQuiz.find({
            class_id,
            created_at: { $gte: start_date, $lte: end_date },
            is_deleted: false,
        });

        // Get student's quiz submissions
        const quizSubmissions: { rows: Record<string, unknown>[] } = await ClassQuizSubmission.find({
            user_id: student_id,
            class_id,
            submission_date: { $gte: start_date, $lte: end_date },
            is_deleted: false,
        });

        const total_quizzes = quizzes.rows.length;
        const quizzes_attempted = quizSubmissions.rows.length;

        let total_marks_obtained = 0;
        let total_marks_possible = 0;
        const scores: number[] = [];

        for (const submission of quizSubmissions.rows) {
            if (
                submission.score !== undefined &&
                submission.score !== null &&
                typeof submission.score === "number"
            ) {
                scores.push(submission.score);
                // Assuming score is a percentage or out of 100
                total_marks_obtained += submission.score;
                total_marks_possible += 100; // Assuming each quiz is out of 100
            }
        }

        const average_score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const best_score = scores.length > 0 ? Math.max(...scores) : 0;
        const worst_score = scores.length > 0 ? Math.min(...scores) : 0;
        const quiz_percentage = total_marks_possible > 0 ? (total_marks_obtained / total_marks_possible) * 100 : 0;

        return {
            total_quizzes,
            quizzes_attempted,
            average_score: Math.round(average_score * 100) / 100,
            best_score: Math.round(best_score * 100) / 100,
            worst_score: Math.round(worst_score * 100) / 100,
            total_marks_obtained: Math.round(total_marks_obtained * 100) / 100,
            total_marks_possible,
            quiz_percentage: Math.round(quiz_percentage * 100) / 100,
        };
    }

    /**
     * Get assignment data for the semester
     */
    private static async getAssignmentData(student_id: string, class_id: string, start_date: Date, end_date: Date) {
        // Get all assignments for the class in the semester
        const assignments: { rows: Record<string, unknown>[] } = await Assignment.find({
            class_id,
            due_date: { $gte: start_date, $lte: end_date },
        });

        // Get student's assignment submissions
        const assignmentSubmissions: { rows: Record<string, unknown>[] } = await AssignmentSubmission.find({
            user_id: student_id,
            submission_date: { $gte: start_date, $lte: end_date },
        });

        // Filter submissions to only those for assignments in this class
        const assignmentIds = new Set(assignments.rows.map((a) => a.id));
        const relevantSubmissions = assignmentSubmissions.rows.filter((s) => assignmentIds.has(s.assignment_id));

        const total_assignments = assignments.rows.length;
        const assignments_submitted = relevantSubmissions.length;
        const assignments_graded = relevantSubmissions.filter((s) => s.grade !== undefined && s.grade !== null).length;

        const submission_percentage =
            total_assignments > 0 ? (assignments_submitted / total_assignments) * 100 : 0;

        let total_marks_obtained = 0;
        let total_marks_possible = 0;
        const grades: number[] = [];

        for (const submission of relevantSubmissions) {
            if (
                submission.grade !== undefined &&
                submission.grade !== null &&
                typeof submission.grade === "number"
            ) {
                grades.push(submission.grade);
                total_marks_obtained += submission.grade;
                total_marks_possible += 100; // Assuming each assignment is out of 100
            }
        }

        const average_score = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        const assignment_percentage =
            total_marks_possible > 0 ? (total_marks_obtained / total_marks_possible) * 100 : 0;

        return {
            total_assignments,
            assignments_submitted,
            assignments_graded,
            submission_percentage: Math.round(submission_percentage * 100) / 100,
            average_score: Math.round(average_score * 100) / 100,
            total_marks_obtained: Math.round(total_marks_obtained * 100) / 100,
            total_marks_possible,
            assignment_percentage: Math.round(assignment_percentage * 100) / 100,
        };
    }

    /**
     * Get course enrollment data for the semester
     */
    private static async getCourseData(student_id: string, start_date: Date, end_date: Date) {
        // Get all course enrollments for the student in the semester
        const enrollments: { rows: Record<string, unknown>[] } = await CourseEnrollment.find({
            user_id: student_id,
            enrollment_date: { $gte: start_date, $lte: end_date },
        });

        const total_courses = enrollments.rows.length;
        const active_courses = enrollments.rows.filter((e) => e.enrollment_status === "active").length;
        const completed_courses = enrollments.rows.filter((e) => e.enrollment_status === "completed").length;

        const progressSum = enrollments.rows.reduce(
            (sum, e) => sum + (typeof e.progress_percentage === "number" ? e.progress_percentage : 0),
            0
        );
        const average_progress = total_courses > 0 ? progressSum / total_courses : 0;

        const courses_list = enrollments.rows.map((e) => ({
            course_id: (e.course_id as string) || "",
            course_name: (e.meta_data as Record<string, unknown>)?.course_name as string | undefined,
            enrollment_status: (e.enrollment_status as string) || "",
            progress_percentage: (e.progress_percentage as number) || 0,
            enrollment_date: (e.enrollment_date as Date) || new Date(),
            completion_date: e.completion_date as Date | undefined,
        }));

        return {
            total_courses,
            active_courses,
            completed_courses,
            average_progress: Math.round(average_progress * 100) / 100,
            courses_list,
        };
    }

    /**
     * Generate overall summary and insights
     */
    private static generateOverallSummary(
        attendance: Record<string, unknown>,
        exams: Record<string, unknown>,
        quizzes: Record<string, unknown>,
        assignments: Record<string, unknown>,
        courses: Record<string, unknown>
    ) {
        const strengths: string[] = [];
        const areas_for_improvement: string[] = [];

        const attendancePercentage = (attendance.attendance_percentage as number) || 0;
        const examsPercentage = (exams.overall_percentage as number) || 0;
        const quizzesScore = (quizzes.average_score as number) || 0;
        const assignmentsPercentage = (assignments.submission_percentage as number) || 0;
        const assignmentsScore = (assignments.average_score as number) || 0;
        const coursesProgress = (courses.average_progress as number) || 0;

        // Analyze attendance
        if (attendancePercentage >= 90) {
            strengths.push("Excellent attendance record");
        } else if (attendancePercentage < 75) {
            areas_for_improvement.push("Attendance needs improvement");
        }

        // Analyze exam performance
        if (examsPercentage >= 85) {
            strengths.push("Strong academic performance in exams");
        } else if (examsPercentage < 60) {
            areas_for_improvement.push("Exam performance needs improvement");
        }

        // Analyze quiz performance
        if (quizzesScore >= 80) {
            strengths.push("Consistent quiz performance");
        } else if (quizzesScore < 60) {
            areas_for_improvement.push("Quiz performance needs attention");
        }

        // Analyze assignment submission
        if (assignmentsPercentage >= 90) {
            strengths.push("Excellent assignment submission rate");
        } else if (assignmentsPercentage < 70) {
            areas_for_improvement.push("Assignment submission needs improvement");
        }

        // Analyze course progress
        if (coursesProgress >= 75) {
            strengths.push("Good progress in enrolled courses");
        } else if (coursesProgress < 50) {
            areas_for_improvement.push("Course completion rate needs attention");
        }

        // Calculate overall performance
        const performanceScore =
            (attendancePercentage + examsPercentage + quizzesScore + assignmentsScore + coursesProgress) / 5;

        let overall_performance: "Excellent" | "Good" | "Average" | "Needs Improvement";
        if (performanceScore >= 85) {
            overall_performance = "Excellent";
        } else if (performanceScore >= 70) {
            overall_performance = "Good";
        } else if (performanceScore >= 55) {
            overall_performance = "Average";
        } else {
            overall_performance = "Needs Improvement";
        }

        return {
            overall_performance,
            strengths,
            areas_for_improvement,
        };
    }

    /**
     * Calculate grade based on percentage
     */
    private static calculateGrade(percentage: number): string {
        if (percentage >= 90) {
            return "A+";
        }
        if (percentage >= 85) {
            return "A";
        }
        if (percentage >= 80) {
            return "A-";
        }
        if (percentage >= 75) {
            return "B+";
        }
        if (percentage >= 70) {
            return "B";
        }
        if (percentage >= 65) {
            return "B-";
        }
        if (percentage >= 60) {
            return "C+";
        }
        if (percentage >= 55) {
            return "C";
        }
        if (percentage >= 50) {
            return "C-";
        }
        if (percentage >= 45) {
            return "D";
        }
        return "F";
    }

    /**
     * Calculate GPA based on percentage
     */
    private static calculateGPA(percentage: number): number {
        if (percentage >= 90) {
            return 4.0;
        }
        if (percentage >= 85) {
            return 3.7;
        }
        if (percentage >= 80) {
            return 3.3;
        }
        if (percentage >= 75) {
            return 3.0;
        }
        if (percentage >= 70) {
            return 2.7;
        }
        if (percentage >= 65) {
            return 2.3;
        }
        if (percentage >= 60) {
            return 2.0;
        }
        if (percentage >= 55) {
            return 1.7;
        }
        if (percentage >= 50) {
            return 1.3;
        }
        if (percentage >= 45) {
            return 1.0;
        }
        return 0.0;
    }

    /**
     * Verify if a parent has access to a student's data
     */
    public static readonly verifyParentAccess = async (parent_id: string, student_id: string): Promise<boolean> => {
        // Get parent user
        const parent = await User.findById(parent_id);
        if (!parent || parent.user_type !== "Parent") {
            return false;
        }

        // Check if student_id is in parent's meta_data
        // Check both student_ids (array) and student_id (array) fields
        if (parent.meta_data) {
            if (Array.isArray(parent.meta_data.student_ids) && parent.meta_data.student_ids.includes(student_id)) {
                return true;
            }
            if (Array.isArray(parent.meta_data.student_id) && parent.meta_data.student_id.includes(student_id)) {
                return true;
            }
        }

        return false;
    };
}
