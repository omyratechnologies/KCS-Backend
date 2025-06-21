import { Attendance } from "@/models/attendance.model";
import { Class } from "@/models/class.model";
import { Course } from "@/models/course.model";
import { Examination } from "@/models/examination.model";
import { Library } from "@/models/library.model";
import { Meeting } from "@/models/meeting.model";
import { StudentNotification } from "@/models/student_notification.model";
import { TeacherNotification } from "@/models/teacher_notification.model";
import { StudentRecord } from "@/models/student_record.model";
import { Subject } from "@/models/subject.model";
import { Teacher } from "@/models/teacher.model";
import { User } from "@/models/user.model";
import { Assignment } from "@/models/assignment.model";
import { ClassQuiz } from "@/models/class_quiz.model";
import { CampusWideNotification } from "@/models/campus_wide_notification.model";
import { ParentNotification } from "@/models/parent_notification.model";

// Dashboard Data Interfaces
interface StudentDashboardData {
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
}

interface TeacherDashboardData {
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
        today: any[];
        thisWeek: any[];
    };
    notifications: {
        unread: number;
        recent: any[];
    };
    quickActions: any[];
}

interface ParentDashboardData {
    profile: {
        id: string;
        name: string;
        email: string;
    };
    children: {
        profile: any;
        grades: any[];
        attendance: any;
        recentActivities: any[];
        upcomingEvents: any[];
    }[];
    notifications: {
        unread: number;
        recent: any[];
    };
}

interface AdminDashboardData {
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

export class DashboardService {
    /**
     * Get comprehensive student dashboard data
     */
    public static async getStudentDashboard(
        user_id: string,
        campus_id: string
    ): Promise<StudentDashboardData> {
        try {
            // Get student profile
            const userResult = await User.find({
                id: user_id,
                campus_id,
                user_type: "Student",
                is_active: true,
                is_deleted: false,
            });
            
            const profile = userResult.rows?.[0];
            if (!profile) {
                throw new Error("Student not found");
            }

            // Get student's classes
            const classResult = await Class.find({
                campus_id,
                student_ids: { $elemMatch: user_id },
                is_active: true,
                is_deleted: false,
            });

            const classes = classResult.rows || [];
            const classIds = classes.map((c) => c.id);

            // Get assignments for student's classes
            const assignmentResult = await Assignment.find({
                campus_id,
                class_id: { $in: classIds },
                is_active: true,
                is_deleted: false,
            });

            const allAssignments = assignmentResult.rows || [];

            // Categorize assignments
            const now = new Date();
            const pendingAssignments = allAssignments.filter(
                (a) => new Date(a.due_date) > now
            );
            const overdueAssignments = allAssignments.filter(
                (a) => new Date(a.due_date) < now
            );

            // Get quizzes
            const quizResult = await ClassQuiz.find({
                campus_id,
                class_id: { $in: classIds },
                is_active: true,
                is_deleted: false,
            });

            const upcomingQuizzes = quizResult.rows || [];

            // Get attendance for current month
            const currentMonth = new Date();
            currentMonth.setDate(1);
            const attendanceResult = await Attendance.find({
                campus_id,
                user_id,
                date: { $gte: currentMonth },
            });

            const attendanceRecords = attendanceResult.rows || [];
            const presentDays = attendanceRecords.filter((a) => a.status === "Present").length;
            const totalDays = attendanceRecords.length;
            const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

            // Get notifications
            const notificationResult = await StudentNotification.find({
                campus_id,
                user_id,
                is_active: true,
                is_deleted: false,
            });

            const notifications = notificationResult.rows || [];
            const unreadNotifications = notifications.filter((n) => !n.is_seen).length;

            // Get library books
            const libraryResult = await Library.find({
                campus_id,
                user_id,
                is_returned: false,
            });

            const libraryBooks = libraryResult.rows || [];
            const dueBooks = libraryBooks.filter(
                (book) => new Date(book.due_date) < now
            );

            // Get current grades
            const recordResult = await StudentRecord.find({
                campus_id,
                student_id: user_id,
            });

            const studentRecords = recordResult.rows || [];

            return {
                profile: {
                    id: profile.id,
                    name: `${profile.first_name} ${profile.last_name}`,
                    email: profile.email,
                    user_id: profile.user_id,
                    class: classes[0]?.name || "Not assigned",
                },
                classes: classes.map((c) => ({
                    id: c.id,
                    name: c.name,
                    teacher: c.class_teacher_id,
                    studentCount: c.student_count,
                })),
                currentGrades: studentRecords.slice(0, 5).map((record) => ({
                    id: record.id,
                    subject: record.record_data,
                    createdAt: record.created_at,
                })),
                assignments: {
                    pending: pendingAssignments.slice(0, 5).map((a) => ({
                        id: a.id,
                        title: a.title,
                        dueDate: a.due_date,
                        classId: a.class_id,
                    })),
                    submitted: [],
                    overdue: overdueAssignments.slice(0, 5).map((a) => ({
                        id: a.id,
                        title: a.title,
                        dueDate: a.due_date,
                        classId: a.class_id,
                    })),
                },
                quizzes: {
                    upcoming: upcomingQuizzes.slice(0, 5).map((q) => ({
                        id: q.id,
                        title: q.title,
                        classId: q.class_id,
                        createdAt: q.created_at,
                    })),
                    completed: [],
                },
                attendance: {
                    thisMonth: presentDays,
                    percentage: Math.round(attendancePercentage),
                    recent: attendanceRecords.slice(-7).map((a) => ({
                        date: a.date,
                        status: a.status,
                    })),
                },
                notifications: {
                    unread: unreadNotifications,
                    recent: notifications.slice(0, 5).map((n) => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        createdAt: n.created_at,
                        isRead: n.is_seen,
                    })),
                },
                schedule: {
                    today: [],
                    thisWeek: [],
                },
                library: {
                    booksIssued: libraryBooks.map((book) => ({
                        id: book.id,
                        title: book.book_title,
                        issueDate: book.issue_date,
                        dueDate: book.due_date,
                    })),
                    dueBooks: dueBooks.map((book) => ({
                        id: book.id,
                        title: book.book_title,
                        dueDate: book.due_date,
                    })),
                },
            };
        } catch (error) {
            throw new Error(`Failed to get student dashboard: ${error}`);
        }
    }

    /**
     * Get comprehensive teacher dashboard data
     */
    public static async getTeacherDashboard(
        user_id: string,
        campus_id: string
    ): Promise<TeacherDashboardData> {
        try {
            // Get teacher profile
            const userResult = await User.find({
                id: user_id,
                campus_id,
                user_type: "Teacher",
                is_active: true,
                is_deleted: false,
            });
            
            const profile = userResult.rows?.[0];
            if (!profile) {
                throw new Error("Teacher not found");
            }

            // Get teacher record
            const teacherResult = await Teacher.find({
                campus_id,
                user_id,
            });

            const teacherRecord = teacherResult.rows?.[0];
            const teacherId = teacherRecord?.id;

            // Get teacher's classes
            const classResult = await Class.find({
                campus_id,
                $or: [
                    { class_teacher_id: teacherId },
                    { teacher_ids: { $in: [teacherId] } },
                ],
                is_active: true,
                is_deleted: false,
            });

            const classes = classResult.rows || [];

            // Get teacher's subjects
            const subjectIds = teacherRecord?.subjects || [];
            const subjectResult = await Subject.find({
                campus_id,
                id: { $in: subjectIds },
                is_active: true,
                is_deleted: false,
            });

            const subjects = subjectResult.rows || [];

            // Get total students count
            const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);

            // Get assignments to grade
            const classIds = classes.map((c) => c.id);
            const assignmentResult = await Assignment.find({
                campus_id,
                class_id: { $in: classIds },
                is_active: true,
                is_deleted: false,
            });

            const assignmentsToGrade = assignmentResult.rows || [];

            // Get notifications
            const notificationResult = await TeacherNotification.find({
                campus_id,
                user_id,
                is_active: true,
                is_deleted: false,
            });

            const notifications = notificationResult.rows || [];
            const unreadNotifications = notifications.filter((n) => !n.is_seen).length;

            return {
                profile: {
                    id: profile.id,
                    name: `${profile.first_name} ${profile.last_name}`,
                    email: profile.email,
                    user_id: profile.user_id,
                },
                classes: classes.map((c) => ({
                    id: c.id,
                    name: c.name,
                    studentCount: c.student_count,
                    academicYear: c.academic_year,
                })),
                subjects: subjects.map((s) => ({
                    id: s.id,
                    name: s.name,
                    code: s.code,
                })),
                students: {
                    total: totalStudents,
                    activeToday: 0, // This would need attendance calculation
                },
                assignments: {
                    toGrade: assignmentsToGrade.slice(0, 10).map((a) => ({
                        id: a.id,
                        title: a.title,
                        dueDate: a.due_date,
                        classId: a.class_id,
                    })),
                    recent: [],
                },
                schedule: {
                    today: [],
                    thisWeek: [],
                },
                notifications: {
                    unread: unreadNotifications,
                    recent: notifications.slice(0, 5).map((n) => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        createdAt: n.created_at,
                        isRead: n.is_seen,
                    })),
                },
                quickActions: [
                    { id: "take_attendance", title: "Take Attendance", icon: "📝" },
                    { id: "create_assignment", title: "Create Assignment", icon: "📋" },
                    { id: "grade_assignments", title: "Grade Assignments", icon: "✏️" },
                    { id: "schedule_meeting", title: "Schedule Meeting", icon: "📅" },
                ],
            };
        } catch (error) {
            throw new Error(`Failed to get teacher dashboard: ${error}`);
        }
    }

    /**
     * Get comprehensive parent dashboard data
     */
    public static async getParentDashboard(
        user_id: string,
        campus_id: string
    ): Promise<ParentDashboardData> {
        try {
            // Get parent profile
            const userResult = await User.find({
                id: user_id,
                campus_id,
                user_type: "Parent",
                is_active: true,
                is_deleted: false,
            });
            
            const profile = userResult.rows?.[0];
            if (!profile) {
                throw new Error("Parent not found");
            }

            // Get children (this assumes parent-child relationship exists in your data model)
            // You might need to adjust this based on your actual data model
            const childrenResult = await User.find({
                campus_id,
                user_type: "Student",
                is_active: true,
                is_deleted: false,
            });

            const allStudents = childrenResult.rows || [];
            
            // Filter children based on parent relationship - adjust this query based on your data model
            const children = allStudents.filter(child => {
                // This is a placeholder - implement based on your parent-child relationship model
                return child.parent_id === user_id || (child.meta_data && child.meta_data.parent_id === user_id);
            });

            const childrenData = await Promise.all(
                children.map(async (child) => {
                    try {
                        // Get child's grades
                        const gradesResult = await StudentRecord.find({
                            campus_id,
                            student_id: child.id,
                        });

                        const grades = gradesResult.rows || [];

                        // Get child's attendance
                        const currentMonth = new Date();
                        currentMonth.setDate(1);
                        const attendanceResult = await Attendance.find({
                            campus_id,
                            user_id: child.id,
                            date: { $gte: currentMonth },
                        });

                        const attendanceRecords = attendanceResult.rows || [];
                        const presentDays = attendanceRecords.filter((a) => a.status === "Present").length;
                        const totalDays = attendanceRecords.length;
                        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

                        return {
                            profile: {
                                id: child.id,
                                name: `${child.first_name} ${child.last_name}`,
                                class: "Class details would go here",
                            },
                            grades: grades.slice(0, 5).map((grade) => ({
                                id: grade.id,
                                subject: grade.record_data,
                                createdAt: grade.created_at,
                            })),
                            attendance: {
                                thisMonth: presentDays,
                                percentage: Math.round(attendancePercentage),
                            },
                            recentActivities: [],
                            upcomingEvents: [],
                        };
                    } catch (error) {
                        console.error(`Error fetching data for child ${child.id}:`, error);
                        return {
                            profile: {
                                id: child.id,
                                name: `${child.first_name} ${child.last_name}`,
                                class: "Unknown",
                            },
                            grades: [],
                            attendance: { thisMonth: 0, percentage: 0 },
                            recentActivities: [],
                            upcomingEvents: [],
                        };
                    }
                })
            );

            // Get parent notifications
            const notificationResult = await ParentNotification.find({
                campus_id,
                user_id,
                is_active: true,
                is_deleted: false,
            });

            const notifications = notificationResult.rows || [];
            const unreadNotifications = notifications.filter((n) => !n.is_seen).length;

            return {
                profile: {
                    id: profile.id,
                    name: `${profile.first_name} ${profile.last_name}`,
                    email: profile.email,
                },
                children: childrenData,
                notifications: {
                    unread: unreadNotifications,
                    recent: notifications.slice(0, 5).map((n) => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        createdAt: n.created_at,
                        isRead: n.is_seen,
                    })),
                },
            };
        } catch (error) {
            throw new Error(`Failed to get parent dashboard: ${error}`);
        }
    }

    /**
     * Get comprehensive admin dashboard data
     */
    public static async getAdminDashboard(
        user_id: string,
        campus_id: string,
        user_type: string
    ): Promise<AdminDashboardData> {
        try {
            // Get admin profile
            const userResult = await User.find({
                id: user_id,
                campus_id,
                user_type,
                is_active: true,
                is_deleted: false,
            });
            
            const profile = userResult.rows?.[0];
            if (!profile) {
                throw new Error("Admin user not found");
            }

            // Get campus statistics
            const [studentResult, teacherResult, classResult, courseResult] = await Promise.all([
                User.find({ campus_id, user_type: "Student", is_active: true, is_deleted: false }),
                User.find({ campus_id, user_type: "Teacher", is_active: true, is_deleted: false }),
                Class.find({ campus_id, is_active: true, is_deleted: false }),
                Course.find({ campus_id, is_active: true, is_deleted: false }),
            ]);

            const totalStudents = studentResult.rows?.length || 0;
            const totalTeachers = teacherResult.rows?.length || 0;
            const totalClasses = classResult.rows?.length || 0;
            const activeCourses = courseResult.rows?.length || 0;

            // Get today's attendance
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const attendanceResult = await Attendance.find({
                campus_id,
                date: { $gte: today },
                status: "Present",
            });

            const todayAttendance = attendanceResult.rows?.length || 0;

            // Get campus-wide notifications
            const notificationResult = await CampusWideNotification.find({
                campus_id,
                is_active: true,
                is_deleted: false,
            });

            const notifications = notificationResult.rows || [];

            return {
                profile: {
                    id: profile.id,
                    name: `${profile.first_name} ${profile.last_name}`,
                    email: profile.email,
                    role: user_type,
                },
                stats: {
                    totalStudents,
                    totalTeachers,
                    totalClasses,
                    activeCourses,
                },
                attendance: {
                    today: todayAttendance,
                    thisWeek: 0, // Would need week calculation
                },
                recentActivities: [],
                notifications: {
                    unread: 0,
                    recent: notifications.slice(0, 5).map((n) => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        createdAt: n.created_at,
                    })),
                },
                quickActions: [
                    { id: "manage_users", title: "Manage Users", icon: "👥" },
                    { id: "view_reports", title: "View Reports", icon: "📊" },
                    { id: "create_notification", title: "Send Notification", icon: "📢" },
                    { id: "manage_classes", title: "Manage Classes", icon: "🏫" },
                ],
            };
        } catch (error) {
            throw new Error(`Failed to get admin dashboard: ${error}`);
        }
    }

    /**
     * Get quick stats for any user type
     */
    public static async getQuickStats(
        user_id: string,
        campus_id: string,
        user_type: string
    ) {
        try {
            switch (user_type) {
                case "Student":
                    const classResult = await Class.find({
                        campus_id,
                        student_ids: { $elemMatch: user_id },
                        is_active: true,
                    });
                    
                    const notificationResult = await StudentNotification.find({
                        campus_id,
                        user_id,
                        is_seen: false,
                        is_active: true,
                    });

                    return {
                        classes: classResult.rows?.length || 0,
                        unreadNotifications: notificationResult.rows?.length || 0,
                        pendingAssignments: 0, // Would need detailed calculation
                    };

                case "Teacher":
                    const teacherResult = await Teacher.find({ campus_id, user_id });
                    const teacherRecord = teacherResult.rows?.[0];
                    
                    const teacherClassResult = await Class.find({
                        campus_id,
                        $or: [
                            { class_teacher_id: teacherRecord?.id },
                            { teacher_ids: { $in: [teacherRecord?.id] } },
                        ],
                        is_active: true,
                    });

                    const teacherClasses = teacherClassResult.rows || [];

                    return {
                        classes: teacherClasses.length,
                        students: teacherClasses.reduce((sum, c) => sum + (c.student_count || 0), 0),
                        subjects: teacherRecord?.subjects?.length || 0,
                    };

                default:
                    return {};
            }
        } catch (error) {
            throw new Error(`Failed to get quick stats: ${error}`);
        }
    }

    /**
     * Get recent activities
     */
    public static async getRecentActivities(
        user_id: string,
        campus_id: string,
        user_type: string,
        limit: number = 10
    ) {
        const activities: any[] = [];

        // This is a simplified version - you'd want to aggregate from various sources
        // like assignments, quizzes, grades, etc.

        return activities.slice(0, limit);
    }

    /**
     * Get notifications summary
     */
    public static async getNotificationsSummary(
        user_id: string,
        campus_id: string,
        user_type: string
    ) {
        try {
            let notifications: any[] = [];
            let unreadCount = 0;

            switch (user_type) {
                case "Student":
                    const studentResult = await StudentNotification.find({
                        campus_id,
                        user_id,
                        is_active: true,
                        is_deleted: false,
                    });
                    notifications = studentResult.rows || [];
                    unreadCount = notifications.filter(n => !n.is_seen).length;
                    break;

                case "Teacher":
                    const teacherResult = await TeacherNotification.find({
                        campus_id,
                        user_id,
                        is_active: true,
                        is_deleted: false,
                    });
                    notifications = teacherResult.rows || [];
                    unreadCount = notifications.filter(n => !n.is_seen).length;
                    break;

                case "Parent":
                    const parentResult = await ParentNotification.find({
                        campus_id,
                        user_id,
                        is_active: true,
                        is_deleted: false,
                    });
                    notifications = parentResult.rows || [];
                    unreadCount = notifications.filter(n => !n.is_seen).length;
                    break;
            }

            return {
                unreadCount,
                recentNotifications: notifications.slice(0, 5).map(n => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    createdAt: n.created_at,
                    isRead: n.is_seen,
                })),
            };
        } catch (error) {
            throw new Error(`Failed to get notifications summary: ${error}`);
        }
    }

    /**
     * Get upcoming events
     */
    public static async getUpcomingEvents(
        user_id: string,
        campus_id: string,
        user_type: string,
        days: number = 7
    ) {
        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + days);

            const events: any[] = [];

            // Get upcoming exams
            const examResult = await Examination.find({
                campus_id,
                exam_date: { $gte: startDate, $lte: endDate },
                is_active: true,
                is_deleted: false,
            });

            const upcomingExams = examResult.rows || [];
            events.push(...upcomingExams.map(exam => ({
                id: exam.id,
                title: `Exam: ${exam.subject_id}`,
                type: "exam",
                date: exam.exam_date,
                description: exam.description,
            })));

            // Get upcoming meetings
            const meetingResult = await Meeting.find({
                campus_id,
                meeting_date: { $gte: startDate, $lte: endDate },
                is_active: true,
                is_deleted: false,
            });

            const upcomingMeetings = meetingResult.rows || [];
            events.push(...upcomingMeetings.map(meeting => ({
                id: meeting.id,
                title: meeting.title,
                type: "meeting",
                date: meeting.meeting_date,
                description: meeting.description,
            })));

            // Sort by date
            events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return events;
        } catch (error) {
            throw new Error(`Failed to get upcoming events: ${error}`);
        }
    }
}
