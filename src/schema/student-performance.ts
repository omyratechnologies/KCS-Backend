import { z } from "zod";

// Base schemas
const subjectPerformanceSchema = z.object({
    subject_id: z.string(),
    subject_name: z.string(),
    marks_obtained: z.number(),
    total_marks: z.number(),
    percentage: z.number(),
    grade: z.string(),
    grade_points: z.number(),
    examination_id: z.string(),
    examination_name: z.string(),
});

const performanceDataSchema = z.object({
    exam_term_id: z.string(),
    exam_term_name: z.string(),
    subjects: z.array(subjectPerformanceSchema),
    total_marks_obtained: z.number(),
    total_marks_possible: z.number(),
    overall_percentage: z.number(),
    overall_grade: z.string(),
    overall_gpa: z.number(),
    rank: z.number(),
    total_students: z.number(),
});

const attendanceSchema = z.object({
    total_days: z.number(),
    days_present: z.number(),
    days_absent: z.number(),
    attendance_percentage: z.number(),
});

const quizPerformanceSchema = z.object({
    total_quizzes: z.number(),
    quizzes_attempted: z.number(),
    average_score: z.number(),
    best_score: z.number(),
    total_marks_obtained: z.number(),
    total_marks_possible: z.number(),
});

const assignmentPerformanceSchema = z.object({
    total_assignments: z.number(),
    assignments_submitted: z.number(),
    submission_percentage: z.number(),
    average_score: z.number(),
    total_marks_obtained: z.number(),
    total_marks_possible: z.number(),
});

// Main student performance schema
export const studentPerformanceSchema = z.object({
    id: z.string(),
    campus_id: z.string(),
    student_id: z.string(),
    academic_year: z.string(),
    semester: z.string(),
    class_id: z.string(),
    performance_data: performanceDataSchema,
    attendance: attendanceSchema,
    quiz_performance: quizPerformanceSchema,
    assignment_performance: assignmentPerformanceSchema,
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
});

// Request schemas
export const createStudentPerformanceRequestBodySchema = z.object({
    student_id: z.string(),
    academic_year: z.string(),
    semester: z.string(),
    class_id: z.string(),
    performance_data: performanceDataSchema,
    attendance: attendanceSchema,
    quiz_performance: quizPerformanceSchema,
    assignment_performance: assignmentPerformanceSchema,
});

export const calculatePerformanceRequestBodySchema = z.object({
    student_id: z.string(),
    semester: z.string(),
    academic_year: z.string(),
    class_id: z.string(),
});

// Response schemas
export const studentPerformanceResponseSchema = z.object({
    success: z.boolean(),
    data: studentPerformanceSchema,
    message: z.string().optional(),
});

export const studentPerformanceListResponseSchema = z.object({
    success: z.boolean(),
    data: z.array(studentPerformanceSchema),
    count: z.number(),
});

export const performanceSummarySchema = z.object({
    total_semesters: z.number(),
    overall_gpa: z.number(),
    overall_percentage: z.number(),
    best_semester: studentPerformanceSchema.nullable(),
    semester_wise_performance: z.array(studentPerformanceSchema),
});

export const performanceSummaryResponseSchema = z.object({
    success: z.boolean(),
    data: performanceSummarySchema,
});

// Error response schema
export const errorResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

// Query parameter schemas
export const semesterParamSchema = z.object({
    semester: z.string(),
});

export const academicYearParamSchema = z.object({
    academic_year: z.string(),
});

export const studentIdParamSchema = z.object({
    student_id: z.string(),
});

export const performanceQuerySchema = z.object({
    academic_year: z.string().optional(),
    academic_years: z.string().optional(), // comma-separated list
    semester: z.string().optional(),
});
