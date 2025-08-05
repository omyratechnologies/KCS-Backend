import z from "zod";

import "zod-openapi/extend";

// Base schemas
const profileSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    user_id: z.string().optional(),
    class: z.string().optional(),
    role: z.string().optional(),
});

const classSchema = z.object({
    id: z.string(),
    name: z.string(),
    teacher: z.string().optional(),
    studentCount: z.number().optional(),
    academicYear: z.string().optional(),
});

const subjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    code: z.string().optional(),
});

const assignmentSchema = z.object({
    id: z.string(),
    title: z.string(),
    dueDate: z.string(),
    classId: z.string(),
});

const quizSchema = z.object({
    id: z.string(),
    title: z.string(),
    classId: z.string(),
    createdAt: z.string(),
});

const notificationSchema = z.object({
    id: z.string(),
    title: z.string(),
    message: z.string(),
    createdAt: z.string(),
    isRead: z.boolean(),
});

const attendanceRecordSchema = z.object({
    date: z.string(),
    status: z.string(),
});

const libraryBookSchema = z.object({
    id: z.string(),
    title: z.string(),
    issueDate: z.string().optional(),
    dueDate: z.string(),
});

const scheduleItemSchema = z.object({
    id: z.string(),
    subject: z.string().optional(),
    class: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    teacher: z.string().optional(),
});

const quickActionSchema = z.object({
    id: z.string(),
    title: z.string(),
    icon: z.string(),
});

const gradeSchema = z.object({
    id: z.string(),
    subject: z.any(),
    createdAt: z.string(),
});

const eventSchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.string(),
    date: z.string(),
    description: z.string().optional(),
});

const courseSchema = z.object({
    id: z.string(),
    title: z.string(),
    thumbnail: z.string().nullable().optional(),
    instructor_names: z.array(z.string()).optional(),
    progress_percentage: z.number().optional(),
    enrollment_date: z.string().optional(),
    last_accessed_at: z.string().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    difficulty_level: z.string().optional(),
    estimated_duration_hours: z.number().optional(),
    completed_lectures: z.number().optional(),
    total_lectures: z.number().optional(),
    certificate_issued: z.boolean().optional(),
    certificate_id: z.string().optional(),
    rating: z.number().optional(),
    total_enrollments: z.number().optional(),
    active_enrollments: z.number().optional(),
    completed_enrollments: z.number().optional(),
    completion_rate: z.number().optional(),
    rating_count: z.number().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

const coursesDataSchema = z
    .object({
        enrolled: z.array(courseSchema),
        inProgress: z.array(courseSchema),
        completed: z.array(courseSchema),
        totalCourses: z.number(),
        totalProgress: z.number(),
        certificates: z.number(),
    })
    .optional();

const teachingCoursesDataSchema = z
    .object({
        teaching: z.array(courseSchema),
        totalCourses: z.number(),
        totalEnrollments: z.number(),
        totalCompletions: z.number(),
        averageRating: z.number(),
    })
    .optional();

// Student Dashboard Schema
export const studentDashboardResponseSchema = z
    .object({
        success: z.boolean(),
        data: z.object({
            profile: profileSchema,
            classes: z.array(classSchema),
            currentGrades: z.array(gradeSchema),
            assignments: z.object({
                pending: z.array(assignmentSchema),
                submitted: z.array(assignmentSchema),
                overdue: z.array(assignmentSchema),
            }),
            quizzes: z.object({
                upcoming: z.array(quizSchema),
                completed: z.array(quizSchema),
            }),
            attendance: z.object({
                thisMonth: z.number(),
                percentage: z.number(),
                recent: z.array(attendanceRecordSchema),
            }),
            notifications: z.object({
                unread: z.number(),
                recent: z.array(notificationSchema),
            }),
            schedule: z.object({
                today: z.array(scheduleItemSchema),
                thisWeek: z.array(scheduleItemSchema),
            }),
            library: z.object({
                booksIssued: z.array(libraryBookSchema),
                dueBooks: z.array(libraryBookSchema),
            }),
            courses: coursesDataSchema,
        }),
    })
    .openapi({ ref: "StudentDashboardResponse" });

// Teacher Dashboard Schema
export const teacherDashboardResponseSchema = z
    .object({
        success: z.boolean(),
        data: z.object({
            profile: profileSchema,
            classes: z.array(classSchema),
            subjects: z.array(subjectSchema),
            students: z.object({
                total: z.number(),
                activeToday: z.number(),
            }),
            assignments: z.object({
                toGrade: z.array(assignmentSchema),
                recent: z.array(assignmentSchema),
            }),
            schedule: z.object({
                today: z.array(scheduleItemSchema),
                thisWeek: z.array(scheduleItemSchema),
            }),
            notifications: z.object({
                unread: z.number(),
                recent: z.array(notificationSchema),
            }),
            quickActions: z.array(quickActionSchema),
            courses: teachingCoursesDataSchema,
        }),
    })
    .openapi({ ref: "TeacherDashboardResponse" });

// Parent Dashboard Schema
export const parentDashboardResponseSchema = z
    .object({
        success: z.boolean(),
        data: z.object({
            profile: profileSchema,
            children: z.array(
                z.object({
                    profile: profileSchema,
                    grades: z.array(gradeSchema),
                    attendance: z.object({
                        thisMonth: z.number(),
                        percentage: z.number(),
                    }),
                    recentActivities: z.array(z.any()),
                    upcomingEvents: z.array(eventSchema),
                    courses: coursesDataSchema,
                })
            ),
            notifications: z.object({
                unread: z.number(),
                recent: z.array(notificationSchema),
            }),
        }),
    })
    .openapi({ ref: "ParentDashboardResponse" });

// Admin Dashboard Schema
export const adminDashboardResponseSchema = z
    .object({
        success: z.boolean(),
        data: z.object({
            profile: profileSchema,
            stats: z.object({
                totalStudents: z.number(),
                totalTeachers: z.number(),
                totalClasses: z.number(),
                activeCourses: z.number(),
                totalEnrollments: z.number().optional(),
                completedEnrollments: z.number().optional(),
                certificatesIssued: z.number().optional(),
            }),
            attendance: z.object({
                today: z.number(),
                thisWeek: z.number(),
            }),
            recentActivities: z.array(z.any()),
            notifications: z.object({
                unread: z.number(),
                recent: z.array(notificationSchema),
            }),
            quickActions: z.array(quickActionSchema),
        }),
    })
    .openapi({ ref: "AdminDashboardResponse" });

// Quick Stats Schema
export const quickStatsResponseSchema = z
    .object({
        success: z.boolean(),
        data: z.record(z.any()),
    })
    .openapi({ ref: "QuickStatsResponse" });

// Recent Activities Schema
export const recentActivitiesResponseSchema = z
    .object({
        success: z.boolean(),
        data: z.array(z.any()),
    })
    .openapi({ ref: "RecentActivitiesResponse" });

// Notifications Summary Schema
export const notificationsSummaryResponseSchema = z
    .object({
        success: z.boolean(),
        data: z.object({
            unreadCount: z.number(),
            recentNotifications: z.array(notificationSchema),
        }),
    })
    .openapi({ ref: "NotificationsSummaryResponse" });

// Upcoming Events Schema
export const upcomingEventsResponseSchema = z
    .object({
        success: z.boolean(),
        data: z.array(eventSchema),
    })
    .openapi({ ref: "UpcomingEventsResponse" });

// Error Schema
export const errorResponseSchema = z
    .object({
        success: z.boolean(),
        message: z.string(),
    })
    .openapi({ ref: "ErrorResponse" });
