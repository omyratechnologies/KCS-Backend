import { Assignment } from "@/models/assignment.model";
import { AssignmentSubmission } from "@/models/assignment_submission.model";
import { Attendance } from "@/models/attendance.model";
import { CampusWideNotification } from "@/models/campus_wide_notification.model";
import { Class } from "@/models/class.model";
import { ClassQuiz } from "@/models/class_quiz.model";
import { ClassQuizAttempt } from "@/models/class_quiz_attempt.model";
import { ClassQuizSubmission } from "@/models/class_quiz_submission.model";
import { ClassSubject } from "@/models/class_subject.model";
import { Course } from "@/models/course.model";
import { Examination } from "@/models/examination.model";
import { Library } from "@/models/library.model";
import { LibraryIssue } from "@/models/library_issue.model";
import { Meeting } from "@/models/meeting.model";
import { ParentNotification } from "@/models/parent_notification.model";
import { StudentNotification } from "@/models/student_notification.model";
import { StudentRecord } from "@/models/student_record.model";
import { Subject } from "@/models/subject.model";
import { Teacher } from "@/models/teacher.model";
import { TeacherNotification } from "@/models/teacher_notification.model";
import { Timetable } from "@/models/time_table.model";
import { User } from "@/models/user.model";
// Import types
import { 
    AdminDashboardData,
    GradesData,
    ParentDashboardData,
    PerformanceMetrics,
    StudentDashboardData,
    StudyHoursData,
    TeacherDashboardData} from "@/types";

import { GradesAnalyticsHelper } from "./analytics/grades.helper";
// Import helper classes
import { PerformanceAnalyticsHelper } from "./analytics/performance.helper";
import { StudyHoursAnalyticsHelper } from "./analytics/study-hours.helper";
// Import services
import { ClassService } from "./class.service";

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

            // Get student's classes using ClassService
            const classService = new ClassService();
            const classes = await classService.getClassesByStudentId(user_id);
            const classIds = classes.map((c) => c.id);

            // Get assignments for student's classes
            let allAssignments: any[] = [];
            if (classIds.length > 0) {
                const assignmentResult = await Assignment.find({
                    campus_id,
                    class_id: { $in: classIds },
                });
                allAssignments = assignmentResult.rows || [];
            }

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

            // Get library books issued to student
            const libraryResult = await LibraryIssue.find({
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

            // Get performance metrics
            const performance = await PerformanceAnalyticsHelper.calculateStudentPerformance(user_id, campus_id, classIds);

            // Get study hours data
            const hoursSpent = await StudyHoursAnalyticsHelper.calculateStudyHours(user_id, campus_id);

            // Get comprehensive grades data
            const grades = await GradesAnalyticsHelper.getGradesData(user_id, campus_id);

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
                performance,
                hoursSpent,
                grades,
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

            // Get teacher_id from user metadata
            let teacherId: string | undefined;
            if (profile.meta_data) {
                // Handle both string and object meta_data formats
                let metaData = profile.meta_data;
                if (typeof profile.meta_data === "string") {
                    try {
                        metaData = JSON.parse(profile.meta_data);
                    } catch {
                        metaData = {};
                    }
                }
                teacherId = (metaData as any)?.teacher_id;
            }

            // If no teacher_id in metadata, try to get it from Teacher table
            if (!teacherId) {
                const teacherResult = await Teacher.find({
                    campus_id,
                    user_id,
                });
                teacherId = teacherResult.rows?.[0]?.id;
            }

            // Get teacher's classes using teacher_id
            let classes: any[] = [];
            if (teacherId) {
                // Get all classes first, then filter in JavaScript
                const allClassesResult = await Class.find({
                    campus_id,
                    is_active: true,
                    is_deleted: false,
                });
                
                const allClasses = allClassesResult.rows || [];
                
                // Filter classes where teacher is assigned
                classes = allClasses.filter(cls => {
                    const isClassTeacher = cls.class_teacher_id === teacherId;
                    const isAssignedTeacher = cls.teacher_ids && cls.teacher_ids.includes(teacherId);
                    return isClassTeacher || isAssignedTeacher;
                });
            }

            // Get teacher's subjects from Teacher record or ClassSubject
            let subjects: any[] = [];
            
            // First, get the Teacher record by user_id
            const teacherResult = await Teacher.find({
                campus_id,
                user_id,
            });
            const teacherRecord = teacherResult.rows?.[0];
            
            if (teacherRecord?.subjects && teacherRecord.subjects.length > 0) {
                // Get subjects from Teacher record
                const subjectResult = await Subject.find({
                    campus_id,
                    id: { $in: teacherRecord.subjects },
                    is_active: true,
                    is_deleted: false,
                });
                subjects = subjectResult.rows || [];
            } else if (teacherId) {
                // Get subjects from ClassSubject table using teacherId
                try {
                    const classSubjectResult = await ClassSubject.find({
                        campus_id,
                        teacher_id: teacherId,
                    });
                    
                    const subjectIds = [...new Set(classSubjectResult.rows?.map((cs: any) => cs.subject_id) || [])];
                    
                    if (subjectIds.length > 0) {
                        const subjectResult = await Subject.find({
                            campus_id,
                            id: { $in: subjectIds },
                            is_active: true,
                            is_deleted: false,
                        });
                        subjects = subjectResult.rows || [];
                    }
                } catch (error) {
                    console.error("Error fetching subjects from ClassSubject:", error);
                }
            }

            // Get total students count
            const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);

            // Get assignments to grade
            const classIds = classes.map((c) => c.id);
            let assignmentsToGrade: any[] = [];
            
            if (classIds.length > 0) {
                // Get assignments for teacher's classes
                const assignmentResult = await Assignment.find({
                    campus_id,
                    class_id: { $in: classIds },
                });
                
                // Filter assignments created by this teacher (user_id should match)
                const allAssignments = assignmentResult.rows || [];
                assignmentsToGrade = allAssignments.filter(assignment => 
                    assignment.user_id === user_id
                );
            }
            
            // Also get assignments by teacher's user_id directly (alternative approach)
            try {
                const teacherAssignmentsResult = await Assignment.find({
                    campus_id,
                    user_id,
                });
                
                const teacherAssignments = teacherAssignmentsResult.rows || [];
                
                // Merge and deduplicate assignments
                const allTeacherAssignments = [...assignmentsToGrade];
                for (const assignment of teacherAssignments) {
                    if (!allTeacherAssignments.find(a => a.id === assignment.id)) {
                        allTeacherAssignments.push(assignment);
                    }
                }
                
                assignmentsToGrade = allTeacherAssignments;
            } catch (error) {
                console.error("Error fetching teacher assignments:", error);
            }

            // Get notifications
            const notificationResult = await TeacherNotification.find({
                campus_id,
                user_id,
                is_active: true,
                is_deleted: false,
            });

            const notifications = notificationResult.rows || [];
            const unreadNotifications = notifications.filter((n) => !n.is_seen).length;

            // Get teacher's schedule/timetable
            let upcomingClasses: any[] = [];
            
            // Get the Teacher record to find the correct teacher_id for timetable
            const teacherRecordForTimetable = teacherResult.rows?.[0];
            const timetableTeacherId = teacherRecordForTimetable?.id || teacherId;
            
            if (timetableTeacherId) {
                try {
                    // Get all active timetable entries for the teacher
                    const allTimetableResult = await Timetable.find({
                        campus_id,
                        teacher_id: timetableTeacherId,
                        is_active: true,
                        is_deleted: false,
                        is_cancelled: false,
                        is_suspended: false,
                    });
                    
                    const allSchedule = allTimetableResult.rows || [];
                    
                    // Get current date and time
                    const now = new Date();
                    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
                    const currentTime = now.toTimeString().slice(0, 5); // Format: "HH:MM"
                    
                    // Define day order for sorting
                    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                    const currentDayIndex = dayOrder.indexOf(currentDay);
                    
                    // Filter and sort upcoming classes
                    const upcomingSchedule = allSchedule
                        .map(schedule => {
                            const scheduleDayIndex = dayOrder.indexOf(schedule.day);
                            return {
                                ...schedule,
                                dayIndex: scheduleDayIndex,
                                isToday: schedule.day === currentDay,
                                isPast: schedule.day === currentDay && schedule.end_time < currentTime
                            };
                        })
                        .filter(schedule => {
                            // Include classes that are:
                            // 1. Later today (not yet finished)
                            // 2. On future days this week
                            // 3. Next week's classes if needed
                            if (schedule.isToday) {
                                return !schedule.isPast; // Only future classes today
                            }
                            return schedule.dayIndex > currentDayIndex || schedule.dayIndex < currentDayIndex;
                        })
                        .sort((a, b) => {
                            // Sort by day, then by start time
                            if (a.day === b.day) {
                                return a.start_time.localeCompare(b.start_time);
                            }
                            
                            // Handle week boundary (today to end of week, then start of next week)
                            const aDayFromToday = a.dayIndex >= currentDayIndex ? a.dayIndex - currentDayIndex : 7 + a.dayIndex - currentDayIndex;
                            const bDayFromToday = b.dayIndex >= currentDayIndex ? b.dayIndex - currentDayIndex : 7 + b.dayIndex - currentDayIndex;
                            
                            return aDayFromToday - bDayFromToday;
                        })
                        .slice(0, 3); // Get only the next 3 upcoming classes
                    
                    upcomingClasses = upcomingSchedule;
                } catch (error) {
                    console.error("Error fetching teacher schedule:", error);
                }
            }

            return {
                profile: {
                    id: profile.id,
                    name: `${profile.first_name} ${profile.last_name}`,
                    email: profile.email,
                    user_id: profile.user_id,
                    profileImg: profile.meta_data?.imageURL || "",
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
                    upcoming: upcomingClasses.map((t) => ({
                        id: t.id,
                        classId: t.class_id,
                        subjectId: t.subject_id,
                        day: t.day,
                        startTime: t.start_time,
                        endTime: t.end_time,
                        isActive: t.is_active,
                        isCancelled: t.is_cancelled,
                        isSuspended: t.is_suspended,
                        isAdjourned: t.is_adjourned,
                        isToday: t.isToday,
                        // Add class and subject names if available
                        className: classes.find(c => c.id === t.class_id)?.name || "Unknown Class",
                        subjectName: subjects.find(s => s.id === t.subject_id)?.name || "Unknown Subject",
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

            // Get children IDs from parent's meta_data
            const childrenIds = profile.meta_data?.student_id || [];
            
            if (childrenIds.length === 0) {
                return {
                    profile: {
                        id: profile.id,
                        name: `${profile.first_name} ${profile.last_name}`,
                        email: profile.email,
                    },
                    children: [],
                    notifications: {
                        unread: 0,
                        recent: [],
                    },
                };
            }

            // Get children details using the IDs from parent's meta_data
            const childrenResult = await User.find({
                id: { $in: childrenIds },
                campus_id,
                user_type: "Student",
                is_active: true,
                is_deleted: false,
            });

            const children = childrenResult.rows || [];

            const childrenData = await Promise.all(
                children.map(async (child) => {
                    try {
                        // Get child's classes using ClassService
                        const classService = new ClassService();
                        const classes = await classService.getClassesByStudentId(child.id);
                        const classIds = classes.map((c) => c.id);

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

                        // Get child's assignments
                        const assignmentResult = await Assignment.find({
                            campus_id,
                            class_id: { $in: classIds },
                            is_active: true,
                            is_deleted: false,
                        });

                        const allAssignments = assignmentResult.rows || [];
                        const now = new Date();
                        const pendingAssignments = allAssignments.filter(
                            (a) => new Date(a.due_date) > now
                        );
                        const overdueAssignments = allAssignments.filter(
                            (a) => new Date(a.due_date) < now
                        );

                        // Get child's quizzes
                        const quizResult = await ClassQuiz.find({
                            campus_id,
                            class_id: { $in: classIds },
                            is_active: true,
                            is_deleted: false,
                        });

                        const allQuizzes = quizResult.rows || [];
                        const upcomingQuizzes = allQuizzes.filter(
                            (q) => new Date(q.quiz_date) > now
                        );
                        const completedQuizzes = allQuizzes.filter(
                            (q) => new Date(q.quiz_date) <= now
                        );

                        // Get child's exams
                        const examResult = await Examination.find({
                            campus_id,
                            class_id: { $in: classIds },
                            is_active: true,
                            is_deleted: false,
                        });

                        const allExams = examResult.rows || [];
                        const upcomingExams = allExams.filter(
                            (e) => new Date(e.exam_date) > now
                        );
                        const recentExams = allExams.filter(
                            (e) => new Date(e.exam_date) <= now
                        ).slice(0, 5);

                        // Get child's library data
                        const libraryResult = await Library.find({
                            campus_id,
                            user_id: child.id,
                            is_active: true,
                            is_deleted: false,
                        });

                        const libraryRecords = libraryResult.rows || [];
                        const booksIssued = libraryRecords.filter(
                            (l) => l.status === "issued"
                        );
                        const dueBooks = libraryRecords.filter(
                            (l) => l.status === "issued" && new Date(l.due_date) < now
                        );

                        // Get child's schedule (meetings/classes for today and this week)
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const weekEnd = new Date(today);
                        weekEnd.setDate(today.getDate() + 7);

                        const meetingResult = await Meeting.find({
                            campus_id,
                            class_id: { $in: classIds },
                            meeting_date: { $gte: today, $lte: weekEnd },
                            is_active: true,
                            is_deleted: false,
                        });

                        const meetings = meetingResult.rows || [];
                        const todayMeetings = meetings.filter(
                            (m) => new Date(m.meeting_date).toDateString() === today.toDateString()
                        );

                        // Get performance metrics for child
                        const childPerformance = await PerformanceAnalyticsHelper.calculateStudentPerformance(child.id, campus_id, classIds);

                        // Get study hours data for child
                        const childHoursSpent = await StudyHoursAnalyticsHelper.calculateStudyHours(child.id, campus_id);

                        // Get comprehensive grades data for child
                        const childGrades = await GradesAnalyticsHelper.getGradesData(child.id, campus_id);

                        return {
                            profile: {
                                id: child.id,
                                name: `${child.first_name} ${child.last_name}`,
                                email: child.email,
                                class: classes.length > 0 ? classes[0].name : "No class assigned",
                                user_id: child.user_id,
                            },
                            attendance: {
                                thisMonth: presentDays,
                                percentage: Math.round(attendancePercentage),
                                totalDays: totalDays,
                                recent: attendanceRecords.slice(0, 7).map((a) => ({
                                    id: a.id,
                                    date: a.date,
                                    status: a.status,
                                })),
                            },
                            assignments: {
                                pending: pendingAssignments.slice(0, 5).map((a) => ({
                                    id: a.id,
                                    title: a.title,
                                    description: a.description,
                                    dueDate: a.due_date,
                                    subject: a.subject,
                                })),
                                submitted: [], // This would need assignment submission tracking
                                overdue: overdueAssignments.slice(0, 5).map((a) => ({
                                    id: a.id,
                                    title: a.title,
                                    description: a.description,
                                    dueDate: a.due_date,
                                    subject: a.subject,
                                })),
                                total: allAssignments.length,
                            },
                            quizzes: {
                                upcoming: upcomingQuizzes.slice(0, 5).map((q) => ({
                                    id: q.id,
                                    title: q.title,
                                    description: q.description,
                                    quizDate: q.quiz_date,
                                    duration: q.duration,
                                })),
                                completed: completedQuizzes.slice(0, 5).map((q) => ({
                                    id: q.id,
                                    title: q.title,
                                    quizDate: q.quiz_date,
                                    score: q.total_marks, // This might need quiz attempt data
                                })),
                                recent: allQuizzes.slice(0, 3).map((q) => ({
                                    id: q.id,
                                    title: q.title,
                                    quizDate: q.quiz_date,
                                    status: new Date(q.quiz_date) > now ? "upcoming" : "completed",
                                })),
                            },
                            exams: {
                                upcoming: upcomingExams.slice(0, 5).map((e) => ({
                                    id: e.id,
                                    title: e.title,
                                    subject: e.subject,
                                    examDate: e.exam_date,
                                    duration: e.duration,
                                    totalMarks: e.total_marks,
                                })),
                                recent: recentExams.map((e) => ({
                                    id: e.id,
                                    title: e.title,
                                    subject: e.subject,
                                    examDate: e.exam_date,
                                    totalMarks: e.total_marks,
                                })),
                            },
                            library: {
                                booksIssued: booksIssued.map((l) => ({
                                    id: l.id,
                                    bookTitle: l.book_title,
                                    issuedDate: l.issued_date,
                                    dueDate: l.due_date,
                                    status: l.status,
                                })),
                                dueBooks: dueBooks.map((l) => ({
                                    id: l.id,
                                    bookTitle: l.book_title,
                                    dueDate: l.due_date,
                                    daysOverdue: Math.floor((now.getTime() - new Date(l.due_date).getTime()) / (1000 * 60 * 60 * 24)),
                                })),
                            },
                            schedule: {
                                today: todayMeetings.map((m) => ({
                                    id: m.id,
                                    title: m.title,
                                    subject: m.subject,
                                    time: m.meeting_time,
                                    duration: m.duration,
                                    type: m.meeting_type,
                                })),
                                thisWeek: meetings.map((m) => ({
                                    id: m.id,
                                    title: m.title,
                                    subject: m.subject,
                                    date: m.meeting_date,
                                    time: m.meeting_time,
                                    type: m.meeting_type,
                                })),
                            },
                            recentActivities: [
                                ...pendingAssignments.slice(0, 2).map((a) => ({
                                    type: "assignment",
                                    title: `New assignment: ${a.title}`,
                                    date: a.created_at,
                                })),
                                ...upcomingQuizzes.slice(0, 2).map((q) => ({
                                    type: "quiz",
                                    title: `Upcoming quiz: ${q.title}`,
                                    date: q.quiz_date,
                                })),
                                ...upcomingExams.slice(0, 2).map((e) => ({
                                    type: "exam",
                                    title: `Upcoming exam: ${e.title}`,
                                    date: e.exam_date,
                                })),
                            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
                            upcomingEvents: [
                                ...upcomingQuizzes.slice(0, 3).map((q) => ({
                                    type: "quiz",
                                    title: q.title,
                                    date: q.quiz_date,
                                })),
                                ...upcomingExams.slice(0, 3).map((e) => ({
                                    type: "exam",
                                    title: e.title,
                                    date: e.exam_date,
                                })),
                                ...pendingAssignments.slice(0, 3).map((a) => ({
                                    type: "assignment",
                                    title: `${a.title} due`,
                                    date: a.due_date,
                                })),
                            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5),
                            performance: childPerformance,
                            hoursSpent: childHoursSpent,
                            grades: childGrades,
                        };
                    } catch (error) {
                        console.error(`Error fetching data for child ${child.id}:`, error);
                        return {
                            profile: {
                                id: child.id,
                                name: `${child.first_name} ${child.last_name}`,
                                email: child.email,
                                class: "Unknown",
                                user_id: child.user_id,
                            },
                            attendance: { thisMonth: 0, percentage: 0, totalDays: 0, recent: [] },
                            assignments: { pending: [], submitted: [], overdue: [], total: 0 },
                            quizzes: { upcoming: [], completed: [], recent: [] },
                            exams: { upcoming: [], recent: [] },
                            library: { booksIssued: [], dueBooks: [] },
                            schedule: { today: [], thisWeek: [] },
                            recentActivities: [],
                            upcomingEvents: [],
                            performance: {
                                overallGrade: "N/A",
                                gradePoint: 0,
                                percentageScore: 0,
                                subjectPerformance: [],
                                monthlyTrend: [],
                                rankInClass: 0,
                                totalStudents: 0,
                            },
                            hoursSpent: {
                                thisWeek: 0,
                                thisMonth: 0,
                                avgDaily: 0,
                                subjectWise: [],
                                weeklyTrend: [],
                            },
                            grades: {
                                currentTerm: [],
                                allTerms: [],
                                subjectWise: [],
                                termWiseAverage: [],
                                improvementAreas: [],
                            },
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
     * Get detailed performance analytics for a student
     */
    public static async getStudentPerformance(
        user_id: string,
        campus_id: string
    ): Promise<PerformanceMetrics> {
        try {
            // Get student's classes
            const allClassesResult = await Class.find({
                campus_id,
                is_active: true,
                is_deleted: false,
            });

            const allClasses = allClassesResult.rows || [];
            const classes = allClasses.filter(cls => 
                cls.student_ids && cls.student_ids.includes(user_id)
            );
            const classIds = classes.map((c) => c.id);

            return await PerformanceAnalyticsHelper.calculateStudentPerformance(user_id, campus_id, classIds);
        } catch (error) {
            throw new Error(`Failed to get student performance: ${error}`);
        }
    }

    /**
     * Get detailed study hours analytics for a student
     */
    public static async getStudentHours(
        user_id: string,
        campus_id: string
    ): Promise<StudyHoursData> {
        try {
            return await StudyHoursAnalyticsHelper.calculateStudyHours(user_id, campus_id);
        } catch (error) {
            throw new Error(`Failed to get student hours: ${error}`);
        }
    }

    /**
     * Get detailed grades analytics for a student
     */
    public static async getStudentGrades(
        user_id: string,
        campus_id: string
    ): Promise<GradesData> {
        try {
            return await GradesAnalyticsHelper.getGradesData(user_id, campus_id);
        } catch (error) {
            throw new Error(`Failed to get student grades: ${error}`);
        }
    }

    /**
     * Get performance analytics for a parent's child
     */
    public static async getChildPerformance(
        parent_user_id: string,
        child_user_id: string,
        campus_id: string
    ): Promise<PerformanceMetrics> {
        try {
            // Verify parent has access to this child
            const parentResult = await User.find({
                id: parent_user_id,
                campus_id,
                user_type: "Parent",
                is_active: true,
                is_deleted: false,
            });

            const parent = parentResult.rows?.[0];
            if (!parent) {
                throw new Error("Parent not found");
            }

            const childrenIds = parent.meta_data?.student_id || [];
            if (!childrenIds.includes(child_user_id)) {
                throw new Error("Unauthorized access to child data");
            }

            // Get child's classes
            const allClassesResult = await Class.find({
                campus_id,
                is_active: true,
                is_deleted: false,
            });

            const allClasses = allClassesResult.rows || [];
            const classes = allClasses.filter(cls => 
                cls.student_ids && cls.student_ids.includes(child_user_id)
            );
            const classIds = classes.map((c) => c.id);

            return await PerformanceAnalyticsHelper.calculateStudentPerformance(child_user_id, campus_id, classIds);
        } catch (error) {
            throw new Error(`Failed to get child performance: ${error}`);
        }
    }

    /**
     * Get study hours analytics for a parent's child
     */
    public static async getChildHours(
        parent_user_id: string,
        child_user_id: string,
        campus_id: string
    ): Promise<StudyHoursData> {
        try {
            // Verify parent has access to this child
            const parentResult = await User.find({
                id: parent_user_id,
                campus_id,
                user_type: "Parent",
                is_active: true,
                is_deleted: false,
            });

            const parent = parentResult.rows?.[0];
            if (!parent) {
                throw new Error("Parent not found");
            }

            const childrenIds = parent.meta_data?.student_id || [];
            if (!childrenIds.includes(child_user_id)) {
                throw new Error("Unauthorized access to child data");
            }

            return await StudyHoursAnalyticsHelper.calculateStudyHours(child_user_id, campus_id);
        } catch (error) {
            throw new Error(`Failed to get child hours: ${error}`);
        }
    }

    /**
     * Get grades analytics for a parent's child
     */
    public static async getChildGrades(
        parent_user_id: string,
        child_user_id: string,
        campus_id: string
    ): Promise<GradesData> {
        try {
            // Verify parent has access to this child
            const parentResult = await User.find({
                id: parent_user_id,
                campus_id,
                user_type: "Parent",
                is_active: true,
                is_deleted: false,
            });

            const parent = parentResult.rows?.[0];
            if (!parent) {
                throw new Error("Parent not found");
            }

            const childrenIds = parent.meta_data?.student_id || [];
            if (!childrenIds.includes(child_user_id)) {
                throw new Error("Unauthorized access to child data");
            }

            return await GradesAnalyticsHelper.getGradesData(child_user_id, campus_id);
        } catch (error) {
            throw new Error(`Failed to get child grades: ${error}`);
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
                case "Student": {
                    const classService = new ClassService();
                    const studentClasses = await classService.getClassesByStudentId(user_id);
                    
                    const notificationResult = await StudentNotification.find({
                        campus_id,
                        user_id,
                        is_seen: false,
                        is_active: true,
                    });

                    return {
                        classes: studentClasses.length,
                        unreadNotifications: notificationResult.rows?.length || 0,
                        pendingAssignments: 0, // Would need detailed calculation
                    };
                }

                case "Teacher": {
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
                }

                default: {
                    return {};
                }
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
                case "Student": {
                    const studentResult = await StudentNotification.find({
                        campus_id,
                        user_id,
                        is_active: true,
                        is_deleted: false,
                    });
                    notifications = studentResult.rows || [];
                    unreadCount = notifications.filter(n => !n.is_seen).length;
                    break;
                }

                case "Teacher": {
                    const teacherResult = await TeacherNotification.find({
                        campus_id,
                        user_id,
                        is_active: true,
                        is_deleted: false,
                    });
                    notifications = teacherResult.rows || [];
                    unreadCount = notifications.filter(n => !n.is_seen).length;
                    break;
                }

                case "Parent": {
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
