import { AssignmentSubmission } from "@/models/assignment_submission.model";
import { ClassQuizSubmission } from "@/models/class_quiz_submission.model";
import { StudentRecord } from "@/models/student_record.model";
import { Class } from "@/models/class.model";
import { Subject } from "@/models/subject.model";
import { 
    PerformanceMetrics, 
    SubjectPerformance, 
    MonthlyTrendData, 
    ClassRankData 
} from "@/types";

export class PerformanceAnalyticsHelper {
    
    /**
     * Calculate comprehensive student performance metrics
     */
    static async calculateStudentPerformance(
        user_id: string,
        campus_id: string,
        classIds: string[]
    ): Promise<PerformanceMetrics> {
        try {
            // Get all assignment submissions
            const assignmentSubmissions = await AssignmentSubmission.find({
                campus_id,
                user_id,
            });

            // Get all quiz submissions
            const quizSubmissions = await ClassQuizSubmission.find({
                campus_id,
                user_id,
                is_active: true,
                is_deleted: false,
            });

            // Get student records (exam grades)
            const studentRecords = await StudentRecord.find({
                campus_id,
                student_id: user_id,
            });

            const submissions = assignmentSubmissions.rows || [];
            const quizResults = quizSubmissions.rows || [];
            const examRecords = studentRecords.rows || [];

            // Calculate overall performance
            const overallMetrics = this.calculateOverallPerformance(
                submissions, 
                quizResults, 
                examRecords
            );

            // Calculate subject-wise performance
            const subjectPerformance = await this.calculateSubjectPerformance(
                submissions, 
                quizResults, 
                examRecords,
                campus_id
            );

            // Calculate monthly trend (last 6 months)
            const monthlyTrend = await this.calculateMonthlyTrend(user_id, campus_id);

            // Get class rank
            const rankData = await this.calculateClassRank(
                user_id, 
                campus_id, 
                classIds, 
                overallMetrics.percentageScore
            );

            return {
                overallGrade: overallMetrics.overallGrade,
                gradePoint: overallMetrics.gradePoint,
                percentageScore: overallMetrics.percentageScore,
                subjectPerformance,
                monthlyTrend,
                rankInClass: rankData.rank,
                totalStudents: rankData.totalStudents,
            };
        } catch (error) {
            console.error("Error calculating student performance:", error);
            return this.getDefaultPerformanceMetrics();
        }
    }

    /**
     * Calculate overall performance from all assessment types
     */
    private static calculateOverallPerformance(
        submissions: any[], 
        quizResults: any[], 
        examRecords: any[]
    ) {
        let totalScore = 0;
        let maxScore = 0;
        let gradePoints = 0;
        let totalItems = 0;

        // Process assignment submissions
        submissions.forEach(sub => {
            if (sub.grade && sub.grade > 0) {
                totalScore += sub.grade;
                maxScore += 100; // Assuming assignments are graded out of 100
                gradePoints += this.convertGradeToPoints(sub.grade);
                totalItems++;
            }
        });

        // Process quiz submissions
        quizResults.forEach(quiz => {
            if (quiz.score && quiz.score > 0) {
                totalScore += quiz.score;
                maxScore += 100; // Assuming quizzes are scored out of 100
                gradePoints += this.convertGradeToPoints(quiz.score);
                totalItems++;
            }
        });

        // Process exam records
        examRecords.forEach(record => {
            if (record.record_data && Array.isArray(record.record_data)) {
                record.record_data.forEach((termData: any) => {
                    if (termData.marks && Array.isArray(termData.marks)) {
                        termData.marks.forEach((mark: any) => {
                            if (mark.mark_gained && mark.total_marks) {
                                const percentage = (mark.mark_gained / mark.total_marks) * 100;
                                totalScore += percentage;
                                maxScore += 100;
                                gradePoints += this.convertGradeToPoints(percentage);
                                totalItems++;
                            }
                        });
                    }
                });
            }
        });

        const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        const averageGradePoint = totalItems > 0 ? gradePoints / totalItems : 0;
        const overallGrade = this.convertPointsToGrade(averageGradePoint);

        return {
            overallGrade,
            gradePoint: Math.round(averageGradePoint * 100) / 100,
            percentageScore: Math.round(percentageScore * 100) / 100,
        };
    }

    /**
     * Calculate performance by subject
     */
    private static async calculateSubjectPerformance(
        submissions: any[], 
        quizResults: any[], 
        examRecords: any[],
        campus_id: string
    ): Promise<SubjectPerformance[]> {
        const subjectMap = new Map<string, {
            name: string;
            totalScore: number;
            maxScore: number;
            count: number;
            scores: number[];
        }>();

        // Get subject names mapping
        const subjectIds = new Set<string>();

        // Process exam records to get subject performance
        examRecords.forEach(record => {
            if (record.record_data && Array.isArray(record.record_data)) {
                record.record_data.forEach((termData: any) => {
                    if (termData.marks && Array.isArray(termData.marks)) {
                        termData.marks.forEach((mark: any) => {
                            if (mark.subject_id && mark.mark_gained && mark.total_marks) {
                                const subjectId = mark.subject_id;
                                const percentage = (mark.mark_gained / mark.total_marks) * 100;
                                
                                subjectIds.add(subjectId);
                                
                                if (!subjectMap.has(subjectId)) {
                                    subjectMap.set(subjectId, {
                                        name: "Subject",
                                        totalScore: 0,
                                        maxScore: 0,
                                        count: 0,
                                        scores: [],
                                    });
                                }

                                const subject = subjectMap.get(subjectId)!;
                                subject.totalScore += percentage;
                                subject.maxScore += 100;
                                subject.count++;
                                subject.scores.push(percentage);
                            }
                        });
                    }
                });
            }
        });

        // Get subject names
        let subjectNames: { [key: string]: string } = {};
        if (subjectIds.size > 0) {
            try {
                const subjectResult = await Subject.find({
                    campus_id,
                    id: { $in: Array.from(subjectIds) },
                    is_active: true,
                    is_deleted: false,
                });
                
                const subjects = subjectResult.rows || [];
                subjects.forEach(subject => {
                    subjectNames[subject.id] = subject.name;
                });
            } catch (error) {
                console.error("Error fetching subject names:", error);
            }
        }

        // Convert to result array
        return Array.from(subjectMap.entries()).map(([subjectId, data]) => ({
            subjectId,
            subjectName: subjectNames[subjectId] || "Unknown Subject",
            averageScore: data.count > 0 ? Math.round((data.totalScore / data.count) * 100) / 100 : 0,
            totalAssessments: data.count,
            trend: this.calculateSubjectTrend(data.scores),
        }));
    }

    /**
     * Calculate monthly performance trend
     */
    private static async calculateMonthlyTrend(
        user_id: string, 
        campus_id: string
    ): Promise<MonthlyTrendData[]> {
        const months: MonthlyTrendData[] = [];
        const currentDate = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
            
            try {
                // Get submissions for this month
                const monthSubmissions = await AssignmentSubmission.find({
                    campus_id,
                    user_id,
                    created_at: { $gte: monthDate, $lt: nextMonth },
                });

                const submissions = monthSubmissions.rows || [];
                const avgScore = submissions.length > 0 
                    ? submissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / submissions.length
                    : 0;

                months.push({
                    month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    score: Math.round(avgScore * 100) / 100,
                    assessments: submissions.length,
                });
            } catch (error) {
                console.error(`Error calculating trend for month ${i}:`, error);
                months.push({
                    month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                    score: 0,
                    assessments: 0,
                });
            }
        }

        return months;
    }

    /**
     * Calculate class rank
     */
    private static async calculateClassRank(
        user_id: string, 
        campus_id: string, 
        classIds: string[], 
        userScore: number
    ): Promise<ClassRankData> {
        try {
            if (classIds.length === 0) return { rank: 0, totalStudents: 0 };

            // Get all students in the same classes
            const classResults = await Class.find({
                campus_id,
                id: { $in: classIds },
                is_active: true,
                is_deleted: false,
            });

            const classes = classResults.rows || [];
            const allStudentIds = new Set<string>();
            
            classes.forEach(cls => {
                if (cls.student_ids && Array.isArray(cls.student_ids)) {
                    cls.student_ids.forEach((id: string) => allStudentIds.add(id));
                }
            });

            const totalStudents = allStudentIds.size;

            // Simplified ranking calculation - in practice, you'd calculate scores for all students
            // For now, assume a normal distribution
            const rank = Math.max(1, Math.ceil(totalStudents * (100 - userScore) / 100));

            return {
                rank: Math.min(rank, totalStudents),
                totalStudents,
            };
        } catch (error) {
            console.error("Error calculating class rank:", error);
            return { rank: 0, totalStudents: 0 };
        }
    }

    /**
     * Calculate trend for a subject based on recent scores
     */
    private static calculateSubjectTrend(scores: number[]): "improving" | "declining" | "stable" | "insufficient_data" {
        if (scores.length < 3) return "insufficient_data";

        const recentScores = scores.slice(-3); // Last 3 scores
        const earlyScores = scores.slice(0, 3); // First 3 scores

        const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
        const earlyAvg = earlyScores.reduce((sum, score) => sum + score, 0) / earlyScores.length;

        const difference = recentAvg - earlyAvg;

        if (difference > 5) return "improving";
        if (difference < -5) return "declining";
        return "stable";
    }

    /**
     * Convert score to grade points (4.0 scale)
     */
    private static convertGradeToPoints(score: number): number {
        if (score >= 90) return 4.0;
        if (score >= 80) return 3.0;
        if (score >= 70) return 2.0;
        if (score >= 60) return 1.0;
        return 0.0;
    }

    /**
     * Convert grade points to letter grade
     */
    private static convertPointsToGrade(points: number): string {
        if (points >= 3.5) return "A";
        if (points >= 2.5) return "B";
        if (points >= 1.5) return "C";
        if (points >= 0.5) return "D";
        return "F";
    }

    /**
     * Get default performance metrics for error cases
     */
    private static getDefaultPerformanceMetrics(): PerformanceMetrics {
        return {
            overallGrade: "N/A",
            gradePoint: 0,
            percentageScore: 0,
            subjectPerformance: [],
            monthlyTrend: [],
            rankInClass: 0,
            totalStudents: 0,
        };
    }
}
