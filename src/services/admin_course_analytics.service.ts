import { Course } from "@/models/course.model";
import { CourseCertificate } from "@/models/course_certificate.model";
import { CourseEnrollment } from "@/models/course_enrollment.model";
import { CourseLecture } from "@/models/course_lecture.model";
import { CourseProgress } from "@/models/course_progress.model";
import { CourseSection } from "@/models/course_section.model";
import { User } from "@/models/user.model";

export class AdminCourseAnalyticsService {
    /**
     * Get comprehensive campus-wide course analytics
     */
    public static readonly getCampusCourseAnalytics = async (campus_id: string) => {
        try {
            // Fetch all data in parallel
            const [
                coursesData,
                enrollmentsData,
                progressData,
                certificatesData,
            ] = await Promise.all([
                this.getCourseStats(campus_id),
                this.getEnrollmentStats(campus_id),
                this.getProgressStats(campus_id),
                this.getCertificateStats(campus_id),
            ]);

            // Calculate advanced metrics
            const performanceMetrics = this.calculatePerformanceMetrics(
                coursesData,
                enrollmentsData,
                progressData
            );

            const revenueMetrics = this.calculateRevenueMetrics(enrollmentsData.enrollments, coursesData.courses);

            const engagementMetrics = this.calculateEngagementMetrics(progressData.progressRecords);

            return {
                overview: {
                    total_courses: coursesData.total,
                    published_courses: coursesData.published,
                    draft_courses: coursesData.draft,
                    total_enrollments: enrollmentsData.total,
                    active_students: enrollmentsData.activeStudents,
                    completion_rate: performanceMetrics.overallCompletionRate,
                    certificates_issued: certificatesData.total,
                    last_updated: new Date(),
                },
                courses_breakdown: {
                    by_status: coursesData.byStatus,
                    by_category: coursesData.byCategory,
                    by_difficulty: coursesData.byDifficulty,
                    by_price_range: coursesData.byPriceRange,
                    featured_courses: coursesData.featuredCount,
                },
                enrollment_analytics: {
                    total_enrollments: enrollmentsData.total,
                    by_type: enrollmentsData.byType,
                    by_status: enrollmentsData.byStatus,
                    by_source: enrollmentsData.bySource,
                    monthly_trend: enrollmentsData.monthlyTrend,
                    active_students: enrollmentsData.activeStudents,
                },
                performance_metrics: performanceMetrics,
                revenue_metrics: revenueMetrics,
                engagement_metrics: engagementMetrics,
                certificates: certificatesData,
                top_performing_courses: await this.getTopPerformingCourses(campus_id, 10),
                underperforming_courses: await this.getUnderperformingCourses(campus_id, 10),
                recent_activities: await this.getRecentActivities(campus_id, 20),
                generated_at: new Date(),
            };
        } catch (error) {
            throw new Error(`Failed to get campus course analytics: ${error}`);
        }
    };

    /**
     * Get detailed analytics for a specific course
     */
    public static readonly getCourseDetailedAnalytics = async (course_id: string, campus_id: string) => {
        try {
            // Get course details
            const courseResult: any = await Course.find({ id: course_id, campus_id });
            if (!courseResult.rows || courseResult.rows.length === 0) {
                throw new Error("Course not found");
            }
            const course = courseResult.rows[0];

            // Fetch all related data in parallel
            const [
                enrollments,
                progressRecords,
                sections,
                lectures,
                certificates,
            ] = await Promise.all([
                this.getCourseEnrollments(course_id),
                this.getCourseProgress(course_id),
                this.getCourseSections(course_id),
                this.getCourseLectures(course_id),
                this.getCourseCertificates(course_id),
            ]);

            // Calculate metrics
            const studentMetrics = this.calculateStudentMetrics(enrollments, progressRecords);
            const contentMetrics = this.calculateContentMetrics(sections, lectures, progressRecords);
            const completionMetrics = this.calculateCompletionMetrics(enrollments, progressRecords, lectures);
            const engagementMetrics = this.calculateDetailedEngagement(progressRecords, lectures);

            return {
                course_info: {
                    id: course.id,
                    title: course.title,
                    category: course.category,
                    difficulty_level: course.difficulty_level,
                    status: course.status,
                    price: course.price,
                    enrollment_count: course.enrollment_count,
                    completion_count: course.completion_count,
                    rating: course.rating,
                    rating_count: course.rating_count,
                    created_at: course.created_at,
                    last_updated: course.updated_at,
                },
                student_metrics: studentMetrics,
                content_metrics: contentMetrics,
                completion_metrics: completionMetrics,
                engagement_metrics: engagementMetrics,
                enrollment_funnel: this.calculateEnrollmentFunnel(enrollments),
                lecture_analytics: this.analyzeLecturePerformance(lectures, progressRecords),
                dropout_analysis: this.analyzeDropouts(enrollments, progressRecords),
                time_analytics: this.analyzeTimeMetrics(progressRecords, course),
                certificates: {
                    total_issued: certificates.length,
                    issue_rate: enrollments.length > 0 ? (certificates.length / enrollments.length) * 100 : 0,
                    recent_certificates: certificates.slice(0, 10),
                },
                student_list: await this.getEnrolledStudentsList(course_id, enrollments),
                recommendations: this.generateCourseRecommendations(studentMetrics, contentMetrics, completionMetrics),
                generated_at: new Date(),
            };
        } catch (error) {
            throw new Error(`Failed to get course detailed analytics: ${error}`);
        }
    };

    /**
     * Get instructor performance analytics
     */
    public static readonly getInstructorAnalytics = async (instructor_id: string, campus_id: string) => {
        try {
            // Get all courses taught by instructor
            const coursesResult: any = await Course.find({ campus_id });
            const instructorCourses = coursesResult.rows.filter((c: any) =>
                c.instructor_ids && c.instructor_ids.includes(instructor_id)
            );

            // Get instructor details
            const instructorResult: any = await User.find({ id: instructor_id, campus_id });
            const instructor = instructorResult.rows && instructorResult.rows.length > 0 ? instructorResult.rows[0] : null;

            if (!instructor) {
                throw new Error("Instructor not found");
            }

            // Aggregate metrics across all courses
            const courseMetrics = await Promise.all(
                instructorCourses.map(async (course: any) => {
                    const enrollmentsResult: any = await CourseEnrollment.find({ course_id: course.id });
                    const enrollments = enrollmentsResult.rows || [];

                    const progressResult: any = await CourseProgress.find({ course_id: course.id });
                    const progress = progressResult.rows || [];

                    const completedEnrollments = enrollments.filter((e: any) => e.enrollment_status === "completed");

                    return {
                        course_id: course.id,
                        course_title: course.title,
                        total_enrollments: enrollments.length,
                        active_enrollments: enrollments.filter((e: any) => e.enrollment_status === "active").length,
                        completions: completedEnrollments.length,
                        completion_rate: enrollments.length > 0 ? (completedEnrollments.length / enrollments.length) * 100 : 0,
                        average_progress: enrollments.length > 0
                            ? enrollments.reduce((sum: number, e: any) => sum + (e.progress_percentage || 0), 0) / enrollments.length
                            : 0,
                        rating: course.rating,
                        total_watch_time_hours: progress.reduce((sum: number, p: any) => sum + (p.watch_time_seconds || 0), 0) / 3600,
                    };
                })
            );

            const totalEnrollments = courseMetrics.reduce((sum, m) => sum + m.total_enrollments, 0);
            const totalCompletions = courseMetrics.reduce((sum, m) => sum + m.completions, 0);
            const avgRating = instructorCourses.length > 0
                ? instructorCourses.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / instructorCourses.length
                : 0;

            return {
                instructor_info: {
                    id: instructor.id,
                    name: `${instructor.first_name} ${instructor.last_name}`,
                    email: instructor.email,
                    user_id: instructor.user_id,
                },
                overview: {
                    total_courses: instructorCourses.length,
                    published_courses: instructorCourses.filter((c: any) => c.status === "published").length,
                    total_enrollments: totalEnrollments,
                    total_completions: totalCompletions,
                    overall_completion_rate: totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0,
                    average_rating: avgRating.toFixed(2),
                    total_ratings: instructorCourses.reduce((sum: number, c: any) => sum + (c.rating_count || 0), 0),
                },
                courses_breakdown: courseMetrics,
                performance_trend: this.calculateInstructorTrend(courseMetrics),
                top_courses: courseMetrics.sort((a, b) => b.total_enrollments - a.total_enrollments).slice(0, 5),
                generated_at: new Date(),
            };
        } catch (error) {
            throw new Error(`Failed to get instructor analytics: ${error}`);
        }
    };

    /**
     * Get enrollment trends and forecasting
     */
    public static readonly getEnrollmentTrends = async (
        campus_id: string,
        timeframe: "week" | "month" | "quarter" | "year" = "month"
    ) => {
        try {
            const endDate = new Date();
            const startDate = new Date();

            switch (timeframe) {
                case "week":
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case "month":
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case "quarter":
                    startDate.setMonth(endDate.getMonth() - 3);
                    break;
                case "year":
                    startDate.setFullYear(endDate.getFullYear() - 1);
                    break;
            }

            const enrollmentsResult: any = await CourseEnrollment.find({ campus_id });
            const allEnrollments = enrollmentsResult.rows || [];

            // Filter by date range
            const enrollments = allEnrollments.filter((e: any) => {
                const enrollDate = new Date(e.enrollment_date);
                return enrollDate >= startDate && enrollDate <= endDate;
            });

            // Group by day/week/month
            const groupedData = this.groupEnrollmentsByPeriod(enrollments, timeframe);

            // Calculate trend metrics
            const trendMetrics = this.calculateTrendMetrics(groupedData);

            return {
                timeframe,
                period: { start_date: startDate, end_date: endDate },
                total_enrollments: enrollments.length,
                trend_data: groupedData,
                metrics: trendMetrics,
                forecast: this.forecastEnrollments(groupedData, timeframe),
                comparison: this.compareWithPreviousPeriod(allEnrollments, startDate, timeframe),
                generated_at: new Date(),
            };
        } catch (error) {
            throw new Error(`Failed to get enrollment trends: ${error}`);
        }
    };

    /**
     * Get revenue analytics
     */
    public static readonly getRevenueAnalytics = async (
        campus_id: string,
        timeframe: "month" | "quarter" | "year" = "month"
    ) => {
        try {
            // Get all courses and enrollments
            const coursesResult: any = await Course.find({ campus_id });
            const courses = coursesResult.rows || [];

            const enrollmentsResult: any = await CourseEnrollment.find({ campus_id });
            const enrollments = enrollmentsResult.rows || [];

            // Calculate revenue metrics
            const paidEnrollments = enrollments.filter((e: any) => e.payment_status === "completed");

            const totalRevenue = paidEnrollments.reduce((sum: number, e: any) => {
                const course = courses.find((c: any) => c.id === e.course_id);
                return sum + (course?.price || 0);
            }, 0);

            const monthlyRevenue = this.calculateMonthlyRevenue(paidEnrollments, courses, timeframe);

            return {
                timeframe,
                overview: {
                    total_revenue: totalRevenue,
                    paid_enrollments: paidEnrollments.length,
                    average_revenue_per_enrollment: paidEnrollments.length > 0 ? totalRevenue / paidEnrollments.length : 0,
                    pending_revenue: enrollments
                        .filter((e: any) => e.payment_status === "pending")
                        .reduce((sum: number, e: any) => {
                            const course = courses.find((c: any) => c.id === e.course_id);
                            return sum + (course?.price || 0);
                        }, 0),
                },
                revenue_by_course: this.calculateRevenueByCourse(enrollments, courses),
                revenue_by_category: this.calculateRevenueByCategory(enrollments, courses),
                monthly_trend: monthlyRevenue,
                top_revenue_courses: this.getTopRevenueCourses(enrollments, courses, 10),
                payment_status_breakdown: {
                    completed: paidEnrollments.length,
                    pending: enrollments.filter((e: any) => e.payment_status === "pending").length,
                    failed: enrollments.filter((e: any) => e.payment_status === "failed").length,
                },
                generated_at: new Date(),
            };
        } catch (error) {
            throw new Error(`Failed to get revenue analytics: ${error}`);
        }
    };

    // ==================== HELPER METHODS ====================

    private static getCourseStats = async (campus_id: string) => {
        const coursesResult: any = await Course.find({ campus_id });
        const courses = coursesResult.rows || [];

        const byStatus: any = {};
        const byCategory: any = {};
        const byDifficulty: any = {};
        const byPriceRange: any = { free: 0, "0-1000": 0, "1000-5000": 0, "5000+": 0 };

        for (const course of courses) {
            // By status
            byStatus[course.status] = (byStatus[course.status] || 0) + 1;

            // By category
            byCategory[course.category] = (byCategory[course.category] || 0) + 1;

            // By difficulty
            byDifficulty[course.difficulty_level] = (byDifficulty[course.difficulty_level] || 0) + 1;

            // By price range
            if (course.price === 0) byPriceRange.free++;
            else if (course.price <= 1000) byPriceRange["0-1000"]++;
            else if (course.price <= 5000) byPriceRange["1000-5000"]++;
            else byPriceRange["5000+"]++;
        }

        return {
            total: courses.length,
            published: courses.filter((c: any) => c.status === "published").length,
            draft: courses.filter((c: any) => c.status === "draft").length,
            featuredCount: courses.filter((c: any) => c.is_featured).length,
            courses,
            byStatus,
            byCategory,
            byDifficulty,
            byPriceRange,
        };
    };

    private static getEnrollmentStats = async (campus_id: string) => {
        const enrollmentsResult: any = await CourseEnrollment.find({ campus_id });
        const enrollments = enrollmentsResult.rows || [];

        const byType: any = {};
        const byStatus: any = {};
        const bySource: any = {};

        for (const enrollment of enrollments) {
            byType[enrollment.enrollment_type] = (byType[enrollment.enrollment_type] || 0) + 1;
            byStatus[enrollment.enrollment_status] = (byStatus[enrollment.enrollment_status] || 0) + 1;
            bySource[enrollment.enrollment_source] = (bySource[enrollment.enrollment_source] || 0) + 1;
        }

        const activeStudents = new Set(
            enrollments
                .filter((e: any) => e.enrollment_status === "active")
                .map((e: any) => e.user_id)
        ).size;

        const monthlyTrend = this.groupEnrollmentsByMonth(enrollments);

        return {
            total: enrollments.length,
            enrollments,
            byType,
            byStatus,
            bySource,
            activeStudents,
            monthlyTrend,
        };
    };

    private static getProgressStats = async (campus_id: string) => {
        const progressResult: any = await CourseProgress.find({ campus_id });
        const progressRecords = progressResult.rows || [];

        return {
            total: progressRecords.length,
            progressRecords,
        };
    };

    private static getCertificateStats = async (campus_id: string) => {
        const certificatesResult: any = await CourseCertificate.find({ campus_id });
        const certificates = certificatesResult.rows || [];

        return {
            total: certificates.length,
            issued: certificates.filter((c: any) => c.status === "issued").length,
            pending: certificates.filter((c: any) => c.status === "pending").length,
            certificates,
        };
    };

    private static calculatePerformanceMetrics = (coursesData: any, enrollmentsData: any, progressData: any) => {
        const completedEnrollments = enrollmentsData.enrollments.filter(
            (e: any) => e.enrollment_status === "completed"
        ).length;

        return {
            overallCompletionRate:
                enrollmentsData.total > 0 ? ((completedEnrollments / enrollmentsData.total) * 100).toFixed(2) : "0",
            avgProgressPercentage:
                enrollmentsData.total > 0
                    ? (
                          enrollmentsData.enrollments.reduce(
                              (sum: number, e: any) => sum + (e.progress_percentage || 0),
                              0
                          ) / enrollmentsData.total
                      ).toFixed(2)
                    : "0",
            totalWatchTimeHours: (
                progressData.progressRecords.reduce((sum: number, p: any) => sum + (p.watch_time_seconds || 0), 0) /
                3600
            ).toFixed(2),
        };
    };

    private static calculateRevenueMetrics = (enrollments: any[], courses: any[]) => {
        const paidEnrollments = enrollments.filter((e: any) => e.payment_status === "completed");

        const totalRevenue = paidEnrollments.reduce((sum: number, e: any) => {
            const course = courses.find((c: any) => c.id === e.course_id);
            return sum + (course?.price || 0);
        }, 0);

        return {
            totalRevenue,
            paidEnrollments: paidEnrollments.length,
            avgRevenuePerStudent: paidEnrollments.length > 0 ? (totalRevenue / paidEnrollments.length).toFixed(2) : "0",
        };
    };

    private static calculateEngagementMetrics = (progressRecords: any[]) => {
        const totalSessions = progressRecords.length;
        const avgWatchTime =
            totalSessions > 0
                ? progressRecords.reduce((sum: number, p: any) => sum + (p.watch_time_seconds || 0), 0) / totalSessions
                : 0;

        return {
            totalSessions,
            avgWatchTimeMinutes: (avgWatchTime / 60).toFixed(2),
            uniqueLectures: new Set(progressRecords.map((p: any) => p.lecture_id)).size,
        };
    };

    private static getTopPerformingCourses = async (campus_id: string, limit: number) => {
        const coursesResult: any = await Course.find({ campus_id });
        const courses = coursesResult.rows || [];

        return courses
            .filter((c: any) => c.status === "published")
            .sort((a: any, b: any) => b.enrollment_count - a.enrollment_count)
            .slice(0, limit)
            .map((c: any) => ({
                id: c.id,
                title: c.title,
                enrollment_count: c.enrollment_count,
                completion_count: c.completion_count,
                rating: c.rating,
                completion_rate:
                    c.enrollment_count > 0 ? ((c.completion_count / c.enrollment_count) * 100).toFixed(2) : "0",
            }));
    };

    private static getUnderperformingCourses = async (campus_id: string, limit: number) => {
        const coursesResult: any = await Course.find({ campus_id });
        const courses = coursesResult.rows || [];

        return courses
            .filter((c: any) => c.status === "published" && c.enrollment_count > 0)
            .sort((a: any, b: any) => {
                const aRate = a.completion_count / a.enrollment_count;
                const bRate = b.completion_count / b.enrollment_count;
                return aRate - bRate;
            })
            .slice(0, limit)
            .map((c: any) => ({
                id: c.id,
                title: c.title,
                enrollment_count: c.enrollment_count,
                completion_count: c.completion_count,
                completion_rate:
                    c.enrollment_count > 0 ? ((c.completion_count / c.enrollment_count) * 100).toFixed(2) : "0",
                issues: this.identifyCourseIssues(c),
            }));
    };

    private static identifyCourseIssues = (course: any) => {
        const issues: string[] = [];
        const completionRate = course.enrollment_count > 0 ? course.completion_count / course.enrollment_count : 0;

        if (completionRate < 0.3) issues.push("Low completion rate");
        if (course.rating < 3) issues.push("Low rating");
        if (course.enrollment_count < 10) issues.push("Low enrollment");

        return issues.length > 0 ? issues : ["No major issues identified"];
    };

    private static getRecentActivities = async (campus_id: string, limit: number) => {
        const enrollmentsResult: any = await CourseEnrollment.find({ campus_id });
        const enrollments = enrollmentsResult.rows || [];

        return enrollments
            .sort((a: any, b: any) => new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime())
            .slice(0, limit)
            .map((e: any) => ({
                type: "enrollment",
                user_id: e.user_id,
                course_id: e.course_id,
                enrollment_type: e.enrollment_type,
                timestamp: e.enrollment_date,
            }));
    };

    private static getCourseEnrollments = async (course_id: string) => {
        const result: any = await CourseEnrollment.find({ course_id });
        return result.rows || [];
    };

    private static getCourseProgress = async (course_id: string) => {
        const result: any = await CourseProgress.find({ course_id });
        return result.rows || [];
    };

    private static getCourseSections = async (course_id: string) => {
        const result: any = await CourseSection.find({ course_id });
        return result.rows || [];
    };

    private static getCourseLectures = async (course_id: string) => {
        const result: any = await CourseLecture.find({ course_id });
        return result.rows || [];
    };

    private static getCourseCertificates = async (course_id: string) => {
        const result: any = await CourseCertificate.find({ course_id });
        return result.rows || [];
    };

    private static calculateStudentMetrics = (enrollments: any[], progressRecords: any[]) => {
        const uniqueStudents = new Set(enrollments.map((e) => e.user_id)).size;
        const activeStudents = enrollments.filter((e) => e.enrollment_status === "active").length;
        const completedStudents = enrollments.filter((e) => e.enrollment_status === "completed").length;

        return {
            total_students: uniqueStudents,
            active_students: activeStudents,
            completed_students: completedStudents,
            completion_rate: enrollments.length > 0 ? (completedStudents / enrollments.length) * 100 : 0,
            avg_progress:
                enrollments.length > 0
                    ? enrollments.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / enrollments.length
                    : 0,
        };
    };

    private static calculateContentMetrics = (sections: any[], lectures: any[], progressRecords: any[]) => {
        const totalDuration = lectures.reduce((sum, l) => sum + (l.estimated_duration_minutes || 0), 0);

        return {
            total_sections: sections.length,
            total_lectures: lectures.length,
            total_duration_hours: (totalDuration / 60).toFixed(2),
            lectures_by_type: this.groupLecturesByType(lectures),
        };
    };

    private static calculateCompletionMetrics = (enrollments: any[], progressRecords: any[], lectures: any[]) => {
        const completedLectures = progressRecords.filter((p) => p.progress_status === "completed").length;
        const totalPossibleCompletions = enrollments.length * lectures.length;

        return {
            completed_lectures: completedLectures,
            total_possible: totalPossibleCompletions,
            lecture_completion_rate:
                totalPossibleCompletions > 0 ? (completedLectures / totalPossibleCompletions) * 100 : 0,
        };
    };

    private static calculateDetailedEngagement = (progressRecords: any[], lectures: any[]) => {
        const totalWatchTime = progressRecords.reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0);
        const avgWatchTime = progressRecords.length > 0 ? totalWatchTime / progressRecords.length : 0;

        return {
            total_watch_time_hours: (totalWatchTime / 3600).toFixed(2),
            avg_watch_time_minutes: (avgWatchTime / 60).toFixed(2),
            total_interactions: progressRecords.length,
        };
    };

    private static calculateEnrollmentFunnel = (enrollments: any[]) => {
        const total = enrollments.length;
        const started = enrollments.filter((e) => e.progress_percentage > 0).length;
        const halfway = enrollments.filter((e) => e.progress_percentage >= 50).length;
        const completed = enrollments.filter((e) => e.enrollment_status === "completed").length;

        return {
            enrolled: total,
            started: { count: started, percentage: total > 0 ? (started / total) * 100 : 0 },
            halfway: { count: halfway, percentage: total > 0 ? (halfway / total) * 100 : 0 },
            completed: { count: completed, percentage: total > 0 ? (completed / total) * 100 : 0 },
        };
    };

    private static analyzeLecturePerformance = (lectures: any[], progressRecords: any[]) => {
        return lectures.map((lecture) => {
            const lectureProgress = progressRecords.filter((p) => p.lecture_id === lecture.id);
            const completions = lectureProgress.filter((p) => p.progress_status === "completed").length;

            return {
                lecture_id: lecture.id,
                title: lecture.title,
                type: lecture.lecture_type,
                views: lectureProgress.length,
                completions,
                completion_rate: lectureProgress.length > 0 ? (completions / lectureProgress.length) * 100 : 0,
                avg_watch_time_minutes:
                    lectureProgress.length > 0
                        ? lectureProgress.reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0) /
                          60 /
                          lectureProgress.length
                        : 0,
            };
        });
    };

    private static analyzeDropouts = (enrollments: any[], progressRecords: any[]) => {
        const dropped = enrollments.filter((e) => e.enrollment_status === "dropped");

        return {
            total_dropouts: dropped.length,
            dropout_rate: enrollments.length > 0 ? (dropped.length / enrollments.length) * 100 : 0,
            avg_progress_before_dropout:
                dropped.length > 0
                    ? dropped.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / dropped.length
                    : 0,
        };
    };

    private static analyzeTimeMetrics = (progressRecords: any[], course: any) => {
        const totalWatchTime = progressRecords.reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0);
        const estimatedTime = (course.estimated_duration_hours || 0) * 3600;

        return {
            total_watch_time_hours: (totalWatchTime / 3600).toFixed(2),
            estimated_course_hours: course.estimated_duration_hours || 0,
            engagement_ratio: estimatedTime > 0 ? (totalWatchTime / estimatedTime).toFixed(2) : "0",
        };
    };

    private static getEnrolledStudentsList = async (course_id: string, enrollments: any[]) => {
        const studentDetails = await Promise.all(
            enrollments.slice(0, 50).map(async (enrollment) => {
                const userResult: any = await User.find({ id: enrollment.user_id });
                const user = userResult.rows && userResult.rows.length > 0 ? userResult.rows[0] : null;

                return {
                    user_id: enrollment.user_id,
                    name: user ? `${user.first_name} ${user.last_name}` : "Unknown",
                    email: user?.email,
                    enrollment_date: enrollment.enrollment_date,
                    progress_percentage: enrollment.progress_percentage,
                    status: enrollment.enrollment_status,
                };
            })
        );

        return studentDetails;
    };

    private static generateCourseRecommendations = (
        studentMetrics: any,
        contentMetrics: any,
        completionMetrics: any
    ) => {
        const recommendations: string[] = [];

        if (studentMetrics.completion_rate < 50) {
            recommendations.push("Consider improving course content - low completion rate detected");
        }

        if (studentMetrics.avg_progress < 30) {
            recommendations.push("Many students are not progressing - review course difficulty and engagement");
        }

        if (completionMetrics.lecture_completion_rate < 40) {
            recommendations.push("Low lecture completion - consider shorter, more engaging lectures");
        }

        if (recommendations.length === 0) {
            recommendations.push("Course is performing well - maintain current quality");
        }

        return recommendations;
    };

    private static calculateInstructorTrend = (courseMetrics: any[]) => {
        // Simple trend calculation based on course performance
        const avgCompletionRate =
            courseMetrics.length > 0
                ? courseMetrics.reduce((sum, m) => sum + m.completion_rate, 0) / courseMetrics.length
                : 0;

        return {
            trend: avgCompletionRate > 60 ? "improving" : avgCompletionRate > 40 ? "stable" : "declining",
            avg_completion_rate: avgCompletionRate.toFixed(2),
        };
    };

    private static groupEnrollmentsByPeriod = (enrollments: any[], timeframe: string) => {
        const grouped: any = {};

        enrollments.forEach((enrollment) => {
            const date = new Date(enrollment.enrollment_date);
            let key: string;

            switch (timeframe) {
                case "week":
                    key = `${date.getFullYear()}-W${this.getWeekNumber(date)}`;
                    break;
                case "month":
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    break;
                case "quarter":
                    key = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
                    break;
                case "year":
                    key = `${date.getFullYear()}`;
                    break;
                default:
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            }

            if (!grouped[key]) {
                grouped[key] = { period: key, count: 0, enrollments: [] };
            }
            grouped[key].count++;
            grouped[key].enrollments.push(enrollment);
        });

        return Object.values(grouped);
    };

    private static getWeekNumber = (date: Date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    private static calculateTrendMetrics = (groupedData: any[]) => {
        if (groupedData.length < 2) {
            return { trend: "insufficient_data", growth_rate: 0 };
        }

        const recent = groupedData[groupedData.length - 1].count;
        const previous = groupedData[groupedData.length - 2].count;
        const growthRate = previous > 0 ? ((recent - previous) / previous) * 100 : 0;

        return {
            trend: growthRate > 0 ? "growing" : growthRate < 0 ? "declining" : "stable",
            growth_rate: growthRate.toFixed(2),
        };
    };

    private static forecastEnrollments = (groupedData: any[], timeframe: string) => {
        if (groupedData.length < 3) {
            return { forecast: "insufficient_data" };
        }

        // Simple linear forecast
        const recentAvg =
            groupedData.slice(-3).reduce((sum, d) => sum + d.count, 0) / 3;

        return {
            next_period_forecast: Math.round(recentAvg),
            confidence: "low", // Would need more sophisticated algorithm for higher confidence
        };
    };

    private static compareWithPreviousPeriod = (allEnrollments: any[], currentStart: Date, timeframe: string) => {
        const duration = new Date().getTime() - currentStart.getTime();
        const previousStart = new Date(currentStart.getTime() - duration);
        const previousEnd = new Date(currentStart.getTime());

        const previousEnrollments = allEnrollments.filter((e: any) => {
            const enrollDate = new Date(e.enrollment_date);
            return enrollDate >= previousStart && enrollDate < previousEnd;
        });

        const currentEnrollments = allEnrollments.filter((e: any) => {
            const enrollDate = new Date(e.enrollment_date);
            return enrollDate >= currentStart;
        });

        const change = currentEnrollments.length - previousEnrollments.length;
        const changePercentage =
            previousEnrollments.length > 0 ? (change / previousEnrollments.length) * 100 : 0;

        return {
            previous_period_count: previousEnrollments.length,
            current_period_count: currentEnrollments.length,
            change,
            change_percentage: changePercentage.toFixed(2),
        };
    };

    private static calculateMonthlyRevenue = (paidEnrollments: any[], courses: any[], timeframe: string) => {
        const grouped: any = {};

        paidEnrollments.forEach((enrollment) => {
            const course = courses.find((c) => c.id === enrollment.course_id);
            const revenue = course?.price || 0;
            const date = new Date(enrollment.enrollment_date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (!grouped[key]) {
                grouped[key] = { month: key, revenue: 0, enrollments: 0 };
            }
            grouped[key].revenue += revenue;
            grouped[key].enrollments++;
        });

        return Object.values(grouped);
    };

    private static calculateRevenueByCourse = (enrollments: any[], courses: any[]) => {
        const revenue: any = {};

        enrollments
            .filter((e: any) => e.payment_status === "completed")
            .forEach((enrollment) => {
                const course = courses.find((c) => c.id === enrollment.course_id);
                if (course) {
                    if (!revenue[course.id]) {
                        revenue[course.id] = {
                            course_id: course.id,
                            course_title: course.title,
                            revenue: 0,
                            enrollments: 0,
                        };
                    }
                    revenue[course.id].revenue += course.price || 0;
                    revenue[course.id].enrollments++;
                }
            });

        return Object.values(revenue);
    };

    private static calculateRevenueByCategory = (enrollments: any[], courses: any[]) => {
        const revenue: any = {};

        enrollments
            .filter((e: any) => e.payment_status === "completed")
            .forEach((enrollment) => {
                const course = courses.find((c) => c.id === enrollment.course_id);
                if (course) {
                    const category = course.category;
                    if (!revenue[category]) {
                        revenue[category] = { category, revenue: 0, enrollments: 0 };
                    }
                    revenue[category].revenue += course.price || 0;
                    revenue[category].enrollments++;
                }
            });

        return Object.values(revenue);
    };

    private static getTopRevenueCourses = (enrollments: any[], courses: any[], limit: number) => {
        const revenueData = this.calculateRevenueByCourse(enrollments, courses) as any[];
        return revenueData.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    };

    private static groupEnrollmentsByMonth = (enrollments: any[]) => {
        const grouped: any = {};

        enrollments.forEach((enrollment) => {
            const date = new Date(enrollment.enrollment_date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (!grouped[key]) {
                grouped[key] = { month: key, count: 0 };
            }
            grouped[key].count++;
        });

        return Object.values(grouped);
    };

    private static groupLecturesByType = (lectures: any[]) => {
        const grouped: any = {};

        lectures.forEach((lecture) => {
            const type = lecture.lecture_type;
            grouped[type] = (grouped[type] || 0) + 1;
        });

        return grouped;
    };
}
