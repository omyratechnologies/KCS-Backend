import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

interface IStudentPerformanceData {
    id: string;
    campus_id: string;
    student_id: string;
    academic_year: string;
    semester: string;
    class_id: string;
    performance_data: {
        exam_term_id: string;
        exam_term_name: string;
        subjects: {
            subject_id: string;
            subject_name: string;
            marks_obtained: number;
            total_marks: number;
            percentage: number;
            grade: string;
            grade_points: number;
            examination_id: string;
            examination_name: string;
        }[];
        total_marks_obtained: number;
        total_marks_possible: number;
        overall_percentage: number;
        overall_grade: string;
        overall_gpa: number;
        rank: number;
        total_students: number;
    };
    attendance: {
        total_days: number;
        days_present: number;
        days_absent: number;
        attendance_percentage: number;
    };
    quiz_performance: {
        total_quizzes: number;
        quizzes_attempted: number;
        average_score: number;
        best_score: number;
        total_marks_obtained: number;
        total_marks_possible: number;
    };
    assignment_performance: {
        total_assignments: number;
        assignments_submitted: number;
        submission_percentage: number;
        average_score: number;
        total_marks_obtained: number;
        total_marks_possible: number;
    };
    created_at: Date;
    updated_at: Date;
}

const StudentPerformanceSchema = new Schema({
    campus_id: { type: String, required: true },
    student_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    semester: { type: String, required: true },
    class_id: { type: String, required: true },
    performance_data: { type: Object, required: true },
    attendance: { type: Object, required: true },
    quiz_performance: { type: Object, required: true },
    assignment_performance: { type: Object, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

StudentPerformanceSchema.index.findByCampusId = { by: "campus_id" };
StudentPerformanceSchema.index.findByStudentId = { by: "student_id" };
StudentPerformanceSchema.index.findByAcademicYear = { by: "academic_year" };
StudentPerformanceSchema.index.findBySemester = { by: "semester" };
StudentPerformanceSchema.index.findByClassId = { by: "class_id" };
StudentPerformanceSchema.index.findByStudentIdAndSemester = {
    by: ["student_id", "semester"],
};
StudentPerformanceSchema.index.findByStudentIdAndAcademicYear = {
    by: ["student_id", "academic_year"],
};

const StudentPerformance = ottoman.model<IStudentPerformanceData>(
    "student_performance",
    StudentPerformanceSchema
);

export { type IStudentPerformanceData, StudentPerformance };
