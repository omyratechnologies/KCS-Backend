import { Class } from "@/models/class.model";
import { ExamTerm } from "@/models/exam_term.model";
import {
    IStudentPerformanceData,
    StudentPerformance,
} from "@/models/student_performance.model";
import { StudentRecord } from "@/models/student_record.model";

export class StudentPerformanceService {
    // Get student performance by semester
    public static readonly getStudentPerformanceBySemester = async (
        student_id: string,
        semester: string,
        academic_year?: string
    ) => {
        const query: any = {
            student_id,
            semester,
        };

        if (academic_year) {
            query.academic_year = academic_year;
        }

        const performanceRecords: {
            rows: IStudentPerformanceData[];
        } = await StudentPerformance.find(
            query,
            {
                sort: {
                    updated_at: "DESC",
                },
            }
        );

        if (performanceRecords.rows.length === 0) {
            return null;
        }

        return performanceRecords.rows[0];
    };

    // Get student performance by academic year (all semesters)
    public static readonly getStudentPerformanceByAcademicYear = async (
        student_id: string,
        academic_year: string
    ) => {
        const performanceRecords: {
            rows: IStudentPerformanceData[];
        } = await StudentPerformance.find(
            {
                student_id,
                academic_year,
            },
            {
                sort: {
                    semester: "ASC",
                },
            }
        );

        return performanceRecords.rows;
    };

    // Get all student performance records
    public static readonly getAllStudentPerformance = async (
        student_id: string
    ) => {
        const performanceRecords: {
            rows: IStudentPerformanceData[];
        } = await StudentPerformance.find(
            {
                student_id,
            },
            {
                sort: {
                    academic_year: "DESC",
                    semester: "DESC",
                },
            }
        );

        return performanceRecords.rows;
    };

    // Create or update student performance
    public static readonly createOrUpdateStudentPerformance = async (
        campus_id: string,
        student_id: string,
        academic_year: string,
        semester: string,
        class_id: string,
        performanceData: Partial<IStudentPerformanceData>
    ) => {
        // Check if performance record already exists
        const existingRecord = await this.getStudentPerformanceBySemester(
            student_id,
            semester,
            academic_year
        );

        if (existingRecord) {
            // Update existing record
            return await StudentPerformance.replaceById(
                existingRecord.id,
                {
                    ...existingRecord,
                    ...performanceData,
                    updated_at: new Date(),
                }
            );
        } else {
            // Create new record
            return await StudentPerformance.create({
                campus_id,
                student_id,
                academic_year,
                semester,
                class_id,
                ...performanceData,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }
    };

    // Calculate performance metrics from raw data
    public static readonly calculatePerformanceMetrics = async (
        student_id: string,
        semester: string,
        academic_year: string
    ) => {
        // This method would calculate performance metrics from various sources
        // like student records, attendance, quiz results, assignments, etc.
        
        // Get student records for the semester
        const studentRecords: any = await StudentRecord.find({
            student_id,
        });

        // Calculate exam performance
        const examPerformance = this.calculateExamPerformance(
            studentRecords.rows,
            semester,
            academic_year
        );

        // Get attendance data (you would implement this based on your attendance model)
        const attendanceData = await this.getAttendanceData(
            student_id,
            semester,
            academic_year
        );

        // Get quiz performance (you would implement this based on your quiz models)
        const quizPerformance = await this.getQuizPerformance(
            student_id,
            semester,
            academic_year
        );

        // Get assignment performance (you would implement this based on your assignment models)
        const assignmentPerformance = await this.getAssignmentPerformance(
            student_id,
            semester,
            academic_year
        );

        return {
            performance_data: examPerformance,
            attendance: attendanceData,
            quiz_performance: quizPerformance,
            assignment_performance: assignmentPerformance,
        };
    };

    // Helper method to calculate exam performance
    private static calculateExamPerformance = (
        studentRecords: any[],
        semester: string,
        academic_year: string
    ) => {
        // Implementation would depend on your exam term structure
        // This is a placeholder that you can customize based on your needs
        
        let totalMarksObtained = 0;
        let totalMarksPossible = 0;
        const subjects: any[] = [];

        for (const record of studentRecords) {
            record.record_data.forEach((termData: any) => {
                termData.marks.forEach((mark: any) => {
                    totalMarksObtained += mark.mark_gained;
                    totalMarksPossible += mark.total_marks;
                    
                    subjects.push({
                        subject_id: mark.subject_id,
                        marks_obtained: mark.mark_gained,
                        total_marks: mark.total_marks,
                        percentage: (mark.mark_gained / mark.total_marks) * 100,
                        grade: mark.grade,
                        examination_id: mark.examination_id,
                    });
                });
            });
        }

        const overallPercentage = totalMarksPossible > 0 
            ? (totalMarksObtained / totalMarksPossible) * 100 
            : 0;

        return {
            exam_term_id: "", // You would set this based on your logic
            exam_term_name: `${semester} ${academic_year}`,
            subjects,
            total_marks_obtained: totalMarksObtained,
            total_marks_possible: totalMarksPossible,
            overall_percentage: overallPercentage,
            overall_grade: this.calculateGrade(overallPercentage),
            overall_gpa: this.calculateGPA(overallPercentage),
            rank: 0, // You would calculate this based on class performance
            total_students: 0, // You would get this from class data
        };
    };

    // Helper method to get attendance data
    private static getAttendanceData = async (
        student_id: string,
        semester: string,
        academic_year: string
    ) => {
        // Implementation would depend on your attendance model
        // This is a placeholder
        return {
            total_days: 0,
            days_present: 0,
            days_absent: 0,
            attendance_percentage: 0,
        };
    };

    // Helper method to get quiz performance
    private static getQuizPerformance = async (
        student_id: string,
        semester: string,
        academic_year: string
    ) => {
        // Implementation would depend on your quiz models
        // This is a placeholder
        return {
            total_quizzes: 0,
            quizzes_attempted: 0,
            average_score: 0,
            best_score: 0,
            total_marks_obtained: 0,
            total_marks_possible: 0,
        };
    };

    // Helper method to get assignment performance
    private static getAssignmentPerformance = async (
        student_id: string,
        semester: string,
        academic_year: string
    ) => {
        // Implementation would depend on your assignment models
        // This is a placeholder
        return {
            total_assignments: 0,
            assignments_submitted: 0,
            submission_percentage: 0,
            average_score: 0,
            total_marks_obtained: 0,
            total_marks_possible: 0,
        };
    };

    // Helper method to calculate grade
    private static calculateGrade = (percentage: number): string => {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 50) return "C";
        if (percentage >= 40) return "D";
        return "F";
    };

    // Helper method to calculate GPA
    private static calculateGPA = (percentage: number): number => {
        if (percentage >= 90) return 4;
        if (percentage >= 80) return 3.5;
        if (percentage >= 70) return 3;
        if (percentage >= 60) return 2.5;
        if (percentage >= 50) return 2;
        if (percentage >= 40) return 1.5;
        return 0;
    };

    // Get performance summary for multiple semesters
    public static readonly getPerformanceSummary = async (
        student_id: string,
        academic_years?: string[]
    ) => {
        const query: any = { student_id };
        
        if (academic_years && academic_years.length > 0) {
            query.academic_year = { $in: academic_years };
        }

        const performanceRecords: {
            rows: IStudentPerformanceData[];
        } = await StudentPerformance.find(
            query,
            {
                sort: {
                    academic_year: "DESC",
                    semester: "DESC",
                },
            }
        );

        // Calculate overall statistics
        const summary = {
            total_semesters: performanceRecords.rows.length,
            overall_gpa: 0,
            overall_percentage: 0,
            best_semester: null as IStudentPerformanceData | null,
            semester_wise_performance: performanceRecords.rows,
        };

        if (performanceRecords.rows.length > 0) {
            const totalGPA = performanceRecords.rows.reduce(
                (sum, record) => sum + (record.performance_data.overall_gpa || 0),
                0
            );
            const totalPercentage = performanceRecords.rows.reduce(
                (sum, record) => sum + (record.performance_data.overall_percentage || 0),
                0
            );

            summary.overall_gpa = totalGPA / performanceRecords.rows.length;
            summary.overall_percentage = totalPercentage / performanceRecords.rows.length;
            
            // Find best semester based on percentage
            summary.best_semester = performanceRecords.rows.reduce(
                (best, current) => 
                    !best || current.performance_data.overall_percentage > best.performance_data.overall_percentage
                        ? current 
                        : best,
                performanceRecords.rows[0]
            );
        }

        return summary;
    };
}
