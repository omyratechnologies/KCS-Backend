import { AssignmentSubmission } from "@/models/assignment_submission.model";
import { ClassQuiz } from "@/models/class_quiz.model";
import { ClassQuizAttempt } from "@/models/class_quiz_attempt.model";
import { Subject } from "@/models/subject.model";
import { StudyHoursData, SubjectHours, WeeklyHoursData } from "@/types";

export class StudyHoursAnalyticsHelper {
    /**
     * Calculate comprehensive study hours analytics
     */
    static async calculateStudyHours(
        user_id: string,
        campus_id: string
    ): Promise<StudyHoursData> {
        try {
            // Get quiz attempts (to estimate time spent)
            const quizAttempts = await ClassQuizAttempt.find({
                campus_id,
                user_id,
            });

            // Get assignment submissions for additional time estimation
            const assignmentSubmissions = await AssignmentSubmission.find({
                campus_id,
                user_id,
            });

            const attempts = quizAttempts.rows || [];
            const submissions = assignmentSubmissions.rows || [];

            // Calculate weekly hours
            const thisWeek = this.calculateWeeklyHours(attempts, submissions);

            // Calculate monthly hours (approximate)
            const thisMonth = this.calculateMonthlyHours(attempts, submissions);

            // Calculate daily average
            const avgDaily = thisWeek / 7;

            // Calculate subject-wise hours
            const subjectWise = await this.calculateSubjectWiseHours(
                attempts,
                campus_id
            );

            // Calculate weekly trend (last 8 weeks)
            const weeklyTrend = this.calculateWeeklyTrend(
                attempts,
                submissions
            );

            return {
                thisWeek,
                thisMonth,
                avgDaily: Math.round(avgDaily * 100) / 100,
                subjectWise,
                weeklyTrend,
            };
        } catch (error) {
            console.error("Error calculating study hours:", error);
            return this.getDefaultStudyHours();
        }
    }

    /**
     * Calculate hours spent this week
     */
    private static calculateWeeklyHours(
        attempts: any[],
        submissions: any[]
    ): number {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentAttempts = attempts.filter(
            (attempt) => new Date(attempt.created_at) >= weekAgo
        );

        const recentSubmissions = submissions.filter(
            (submission) => new Date(submission.created_at) >= weekAgo
        );

        // Estimation:
        // - Each quiz attempt = 30 minutes of study
        // - Each assignment submission = 2 hours of work
        const attemptHours = recentAttempts.length * 0.5;
        const submissionHours = recentSubmissions.length * 2;

        return Math.round((attemptHours + submissionHours) * 100) / 100;
    }

    /**
     * Calculate hours spent this month
     */
    private static calculateMonthlyHours(
        attempts: any[],
        submissions: any[]
    ): number {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        const recentAttempts = attempts.filter(
            (attempt) => new Date(attempt.created_at) >= monthAgo
        );

        const recentSubmissions = submissions.filter(
            (submission) => new Date(submission.created_at) >= monthAgo
        );

        // Same estimation as weekly but for month
        const attemptHours = recentAttempts.length * 0.5;
        const submissionHours = recentSubmissions.length * 2;

        return Math.round((attemptHours + submissionHours) * 100) / 100;
    }

    /**
     * Calculate subject-wise study hours
     */
    private static async calculateSubjectWiseHours(
        attempts: any[],
        campus_id: string
    ): Promise<SubjectHours[]> {
        const subjectHoursMap = new Map<string, number>();
        const quizSubjectMap = new Map<string, string>();

        // First, map quiz IDs to subjects
        try {
            const quizIds = [
                ...new Set(attempts.map((attempt) => attempt.quiz_id)),
            ];

            if (quizIds.length > 0) {
                const quizResults = await ClassQuiz.find({
                    campus_id,
                    id: { $in: quizIds },
                    is_active: true,
                    is_deleted: false,
                });

                const quizzes = quizResults.rows || [];
                for (const quiz of quizzes) {
                    if (quiz.subject_id) {
                        quizSubjectMap.set(quiz.id, quiz.subject_id);
                    }
                }
            }
        } catch (error) {
            console.error("Error mapping quizzes to subjects:", error);
        }

        // Calculate hours per subject
        for (const attempt of attempts) {
            const subjectId = quizSubjectMap.get(attempt.quiz_id);
            if (subjectId) {
                const currentHours = subjectHoursMap.get(subjectId) || 0;
                subjectHoursMap.set(subjectId, currentHours + 0.5); // 30 minutes per attempt
            }
        }

        // Get subject names
        const subjectNames = await this.getSubjectNames(
            [...subjectHoursMap.keys()],
            campus_id
        );

        // Convert to result array
        return [...subjectHoursMap.entries()].map(([subjectId, hours]) => ({
            subjectId,
            subjectName: subjectNames[subjectId] || "Unknown Subject",
            hours: Math.round(hours * 100) / 100,
        }));
    }

    /**
     * Calculate weekly trend over last 8 weeks
     */
    private static calculateWeeklyTrend(
        attempts: any[],
        submissions: any[]
    ): WeeklyHoursData[] {
        const weeks: WeeklyHoursData[] = [];
        const currentDate = new Date();

        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - i * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const weekAttempts = attempts.filter((attempt) => {
                const attemptDate = new Date(attempt.created_at);
                return attemptDate >= weekStart && attemptDate <= weekEnd;
            });

            const weekSubmissions = submissions.filter((submission) => {
                const submissionDate = new Date(submission.created_at);
                return submissionDate >= weekStart && submissionDate <= weekEnd;
            });

            const attemptHours = weekAttempts.length * 0.5;
            const submissionHours = weekSubmissions.length * 2;
            const totalHours = attemptHours + submissionHours;

            weeks.push({
                week: `Week ${8 - i}`,
                hours: Math.round(totalHours * 100) / 100,
                activities: weekAttempts.length + weekSubmissions.length,
            });
        }

        return weeks;
    }

    /**
     * Get subject names mapping
     */
    private static async getSubjectNames(
        subjectIds: string[],
        campus_id: string
    ): Promise<{ [key: string]: string }> {
        const subjectNames: { [key: string]: string } = {};

        if (subjectIds.length > 0) {
            try {
                const subjectResult = await Subject.find({
                    campus_id,
                    id: { $in: subjectIds },
                    is_active: true,
                    is_deleted: false,
                });

                const subjects = subjectResult.rows || [];
                for (const subject of subjects) {
                    subjectNames[subject.id] = subject.name;
                }
            } catch (error) {
                console.error("Error fetching subject names:", error);
            }
        }

        return subjectNames;
    }

    /**
     * Get default study hours for error cases
     */
    private static getDefaultStudyHours(): StudyHoursData {
        return {
            thisWeek: 0,
            thisMonth: 0,
            avgDaily: 0,
            subjectWise: [],
            weeklyTrend: [],
        };
    }

    /**
     * Estimate study time based on activity type
     */
    static estimateActivityTime(
        activityType: "quiz" | "assignment" | "exam"
    ): number {
        switch (activityType) {
            case "quiz": {
                return 0.5;
            } // 30 minutes
            case "assignment": {
                return 2;
            } // 2 hours
            case "exam": {
                return 3;
            } // 3 hours of preparation
            default: {
                return 0.5;
            }
        }
    }

    /**
     * Calculate productivity score based on time spent vs outcomes
     */
    static calculateProductivityScore(
        hoursSpent: number,
        averageScore: number
    ): number {
        if (hoursSpent === 0) {return 0;}

        // Productivity = (Score / 100) / (Hours / optimal_hours)
        // Optimal hours per week for a student might be 20-25
        const optimalHoursPerWeek = 22;
        const timeEfficiency = optimalHoursPerWeek / Math.max(hoursSpent, 1);
        const scoreEfficiency = averageScore / 100;

        return Math.min(
            Math.round(timeEfficiency * scoreEfficiency * 100),
            100
        );
    }
}
