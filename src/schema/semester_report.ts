import z from "zod";

import "zod-openapi/extend";

// Semester enum
export const semesterEnum = z.enum(["sem1", "sem2"]).openapi({
    description: "Semester identifier - sem1 or sem2",
    example: "sem1",
});

// Student info schema
export const studentInfoSchema = z.object({
    id: z.string().openapi({ example: "student123" }),
    name: z.string().openapi({ example: "John Doe" }),
    email: z.string().email().openapi({ example: "john.doe@example.com" }),
    class_id: z.string().openapi({ example: "class123" }),
    class_name: z.string().openapi({ example: "Grade 10 - A" }),
});

// Semester info schema
export const semesterInfoSchema = z.object({
    semester: semesterEnum,
    academic_year: z.string().openapi({ example: "2024-2025" }),
    class_id: z.string().openapi({ example: "class123" }),
});

// Attendance schema
export const attendanceReportSchema = z.object({
    total_days: z.number().openapi({ example: 120 }),
    days_present: z.number().openapi({ example: 110 }),
    days_absent: z.number().openapi({ example: 5 }),
    days_late: z.number().openapi({ example: 3 }),
    days_leave: z.number().openapi({ example: 2 }),
    attendance_percentage: z.number().openapi({ example: 91.67 }),
    status: z.enum(["Excellent", "Good", "Average", "Poor"]).openapi({ example: "Excellent" }),
});

// Exam subject schema
export const examSubjectSchema = z.object({
    subject_id: z.string().openapi({ example: "subject123" }),
    subject_name: z.string().openapi({ example: "Mathematics" }),
    marks_obtained: z.number().openapi({ example: 85 }),
    total_marks: z.number().openapi({ example: 100 }),
    percentage: z.number().openapi({ example: 85.0 }),
    grade: z.string().openapi({ example: "A" }),
});

// Exams schema
export const examsReportSchema = z.object({
    total_exams: z.number().openapi({ example: 6 }),
    exams_taken: z.number().openapi({ example: 6 }),
    subjects: z.array(examSubjectSchema),
    overall_marks_obtained: z.number().openapi({ example: 510 }),
    overall_total_marks: z.number().openapi({ example: 600 }),
    overall_percentage: z.number().openapi({ example: 85.0 }),
    overall_grade: z.string().openapi({ example: "A" }),
    overall_gpa: z.number().openapi({ example: 3.7 }),
});

// Quizzes schema
export const quizzesReportSchema = z.object({
    total_quizzes: z.number().openapi({ example: 15 }),
    quizzes_attempted: z.number().openapi({ example: 14 }),
    average_score: z.number().openapi({ example: 82.5 }),
    best_score: z.number().openapi({ example: 95.0 }),
    worst_score: z.number().openapi({ example: 65.0 }),
    total_marks_obtained: z.number().openapi({ example: 1155 }),
    total_marks_possible: z.number().openapi({ example: 1400 }),
    quiz_percentage: z.number().openapi({ example: 82.5 }),
});

// Assignments schema
export const assignmentsReportSchema = z.object({
    total_assignments: z.number().openapi({ example: 20 }),
    assignments_submitted: z.number().openapi({ example: 18 }),
    assignments_graded: z.number().openapi({ example: 16 }),
    submission_percentage: z.number().openapi({ example: 90.0 }),
    average_score: z.number().openapi({ example: 78.5 }),
    total_marks_obtained: z.number().openapi({ example: 1256 }),
    total_marks_possible: z.number().openapi({ example: 1600 }),
    assignment_percentage: z.number().openapi({ example: 78.5 }),
});

// Course item schema
export const courseItemSchema = z.object({
    course_id: z.string().openapi({ example: "course123" }),
    course_name: z.string().optional().openapi({ example: "Introduction to Programming" }),
    enrollment_status: z.string().openapi({ example: "active" }),
    progress_percentage: z.number().openapi({ example: 75.5 }),
    enrollment_date: z.date().openapi({ example: "2024-08-01T00:00:00Z" }),
    completion_date: z.date().optional().openapi({ example: "2024-12-15T00:00:00Z" }),
});

// Courses schema
export const coursesReportSchema = z.object({
    total_courses: z.number().openapi({ example: 5 }),
    active_courses: z.number().openapi({ example: 4 }),
    completed_courses: z.number().openapi({ example: 1 }),
    average_progress: z.number().openapi({ example: 68.5 }),
    courses_list: z.array(courseItemSchema),
});

// Overall summary schema
export const overallSummarySchema = z.object({
    overall_performance: z
        .enum(["Excellent", "Good", "Average", "Needs Improvement"])
        .openapi({ example: "Good" }),
    strengths: z.array(z.string()).openapi({
        example: ["Excellent attendance record", "Strong academic performance in exams"],
    }),
    areas_for_improvement: z.array(z.string()).openapi({
        example: ["Quiz performance needs attention"],
    }),
});

// Complete semester report schema
export const semesterReportSchema = z.object({
    student_info: studentInfoSchema,
    semester_info: semesterInfoSchema,
    attendance: attendanceReportSchema,
    exams: examsReportSchema,
    quizzes: quizzesReportSchema,
    assignments: assignmentsReportSchema,
    courses: coursesReportSchema,
    overall_summary: overallSummarySchema,
    generated_at: z.date().openapi({ example: "2024-10-16T00:00:00Z" }),
});

// Request schemas
export const semesterReportRequestSchema = z.object({
    student_id: z.string().openapi({
        description: "Student ID",
        example: "student123",
    }),
    class_id: z.string().openapi({
        description: "Class ID",
        example: "class123",
    }),
    semester: semesterEnum,
    academic_year: z.string().optional().openapi({
        description: "Academic year (e.g., 2024-2025). If not provided, current class academic year is used",
        example: "2024-2025",
    }),
});

export const studentSemesterReportRequestSchema = z.object({
    class_id: z.string().openapi({
        description: "Class ID",
        example: "class123",
    }),
    semester: semesterEnum,
    academic_year: z.string().optional().openapi({
        description: "Academic year (e.g., 2024-2025). If not provided, current class academic year is used",
        example: "2024-2025",
    }),
});

export const parentSemesterReportRequestSchema = z.object({
    student_id: z.string().openapi({
        description: "Student ID (must be a student linked to the parent)",
        example: "student123",
    }),
    class_id: z.string().openapi({
        description: "Class ID",
        example: "class123",
    }),
    semester: semesterEnum,
    academic_year: z.string().optional().openapi({
        description: "Academic year (e.g., 2024-2025). If not provided, current class academic year is used",
        example: "2024-2025",
    }),
});

// Response schemas
export const semesterReportResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    data: semesterReportSchema,
});

export const errorResponseSchema = z.object({
    success: z.boolean().openapi({ example: false }),
    message: z.string().openapi({ example: "Error message" }),
});
