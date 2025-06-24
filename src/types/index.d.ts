type ID = string;

type LogTypes = "INFO" | "WARN" | "ERROR"; // Define LogTypes as needed

interface IInfoLogs {
    infoLogs: (msg: string, logType: LogTypes) => void;
    generated_by: string;
}

// Student Parent Teacher  Staff Principal  Admin Super Admin Public User
export type UserType =
    | "Student"
    | "Parent"
    | "Teacher"
    | "Staff"
    | "Principal"
    | "Admin"
    | "Super Admin"
    | "Public";

// Dashboard Data Interfaces
export interface StudentDashboardData {
    profile: {
        id: string;
        name: string;
        email: string;
        user_id: string;
        class: string;
    };
    classes: any[];
    currentGrades: any[];
    assignments: {
        pending: any[];
        submitted: any[];
        overdue: any[];
    };
    quizzes: {
        upcoming: any[];
        completed: any[];
    };
    attendance: {
        thisMonth: number;
        percentage: number;
        recent: any[];
    };
    notifications: {
        unread: number;
        recent: any[];
    };
    schedule: {
        today: any[];
        thisWeek: any[];
    };
    library: {
        booksIssued: any[];
        dueBooks: any[];
    };
    performance: PerformanceMetrics;
    hoursSpent: StudyHoursData;
    grades: GradesData;
}

export interface TeacherDashboardData {
    profile: {
        id: string;
        name: string;
        email: string;
        user_id: string;
    };
    classes: any[];
    subjects: any[];
    students: {
        total: number;
        activeToday: number;
    };
    assignments: {
        toGrade: any[];
        recent: any[];
    };
    schedule: {
        upcoming: any[];
    };
    notifications: {
        unread: number;
        recent: any[];
    };
    quickActions: any[];
}

export interface ParentDashboardData {
    profile: {
        id: string;
        name: string;
        email: string;
    };
    children: ChildDashboardData[];
    notifications: {
        unread: number;
        recent: any[];
    };
}

export interface ChildDashboardData {
    profile: {
        id: string;
        name: string;
        email: string;
        class: string;
        user_id: string;
    };
    attendance: {
        thisMonth: number;
        percentage: number;
        totalDays: number;
        recent: any[];
    };
    assignments: {
        pending: any[];
        submitted: any[];
        overdue: any[];
        total: number;
    };
    quizzes: {
        upcoming: any[];
        completed: any[];
        recent: any[];
    };
    exams: {
        upcoming: any[];
        recent: any[];
    };
    library: {
        booksIssued: any[];
        dueBooks: any[];
    };
    schedule: {
        today: any[];
        thisWeek: any[];
    };
    recentActivities: any[];
    upcomingEvents: any[];
    performance: PerformanceMetrics;
    hoursSpent: StudyHoursData;
    grades: GradesData;
}

export interface AdminDashboardData {
    profile: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    stats: {
        totalStudents: number;
        totalTeachers: number;
        totalClasses: number;
        activeCourses: number;
    };
    attendance: {
        today: number;
        thisWeek: number;
    };
    recentActivities: any[];
    notifications: {
        unread: number;
        recent: any[];
    };
    quickActions: any[];
}

// Performance Analytics Interfaces
export interface PerformanceMetrics {
    overallGrade: string;
    gradePoint: number;
    percentageScore: number;
    subjectPerformance: SubjectPerformance[];
    monthlyTrend: MonthlyTrendData[];
    rankInClass: number;
    totalStudents: number;
}

export interface SubjectPerformance {
    subjectId: string;
    subjectName: string;
    averageScore: number;
    totalAssessments: number;
    trend: "improving" | "declining" | "stable" | "insufficient_data";
}

export interface MonthlyTrendData {
    month: string;
    score: number;
    assessments: number;
}

// Study Hours Analytics Interfaces
export interface StudyHoursData {
    thisWeek: number;
    thisMonth: number;
    avgDaily: number;
    subjectWise: SubjectHours[];
    weeklyTrend: WeeklyHoursData[];
}

export interface SubjectHours {
    subjectId: string;
    subjectName: string;
    hours: number;
}

export interface WeeklyHoursData {
    week: string;
    hours: number;
    activities: number;
}

// Grades Analytics Interfaces
export interface GradesData {
    currentTerm: CurrentTermGrade[];
    allTerms: TermGradesData[];
    subjectWise: SubjectWiseGrades[];
    termWiseAverage: TermAverage[];
    improvementAreas: ImprovementArea[];
}

export interface CurrentTermGrade {
    subjectId: string;
    subjectName: string;
    marksGained: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    examId: string;
}

export interface TermGradesData {
    termId: string;
    termName: string;
    subjects: TermSubjectGrade[];
    averagePercentage: number;
}

export interface TermSubjectGrade {
    subjectId: string;
    subjectName: string;
    marksGained: number;
    totalMarks: number;
    percentage: number;
    grade: string;
}

export interface SubjectWiseGrades {
    subjectId: string;
    subjectName: string;
    grades: SubjectGradeEntry[];
    averagePercentage: number;
    trend: "improving" | "declining" | "stable" | "insufficient_data";
    totalMarks: number;
    totalMaxMarks: number;
    count: number;
}

export interface SubjectGradeEntry {
    termId: string;
    marksGained: number;
    totalMarks: number;
    percentage: number;
    grade: string;
}

export interface TermAverage {
    termId: string;
    termName: string;
    average: number;
    subjectCount: number;
}

export interface ImprovementArea {
    subjectId: string;
    subjectName: string;
    currentPercentage: number;
    targetPercentage: number;
    improvementNeeded: number;
    suggestions: string[];
}

// Calculation Helper Interfaces
export interface ClassRankData {
    rank: number;
    totalStudents: number;
}
