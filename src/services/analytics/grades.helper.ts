import { StudentRecord } from "@/models/student_record.model";
import { Subject } from "@/models/subject.model";
import {
    CurrentTermGrade,
    GradesData,
    ImprovementArea,
    SubjectGradeEntry,
    SubjectWiseGrades,
    TermAverage,
    TermGradesData,
    TermSubjectGrade,
} from "@/types";

export class GradesAnalyticsHelper {
    /**
     * Get comprehensive grades analytics
     */
    static async getGradesData(
        user_id: string,
        campus_id: string
    ): Promise<GradesData> {
        try {
            // Get all student records
            const studentRecords = await StudentRecord.find({
                campus_id,
                student_id: user_id,
            });

            const records = studentRecords.rows || [];

            // Get current term grades
            const currentTerm = await this.getCurrentTermGrades(
                records,
                campus_id
            );

            // Get all terms
            const allTerms = await this.getAllTermsGrades(records, campus_id);

            // Calculate subject-wise performance
            const subjectWise = await this.calculateSubjectWiseGrades(
                records,
                campus_id
            );

            // Calculate term-wise averages
            const termWiseAverage = this.calculateTermWiseAverages(records);

            // Identify improvement areas
            const improvementAreas = this.identifyImprovementAreas(subjectWise);

            return {
                currentTerm,
                allTerms,
                subjectWise,
                termWiseAverage,
                improvementAreas,
            };
        } catch (error) {
            console.error("Error getting grades data:", error);
            return this.getDefaultGradesData();
        }
    }

    /**
     * Get current term grades
     */
    private static async getCurrentTermGrades(
        records: any[],
        campus_id: string
    ): Promise<CurrentTermGrade[]> {
        if (records.length === 0) return [];

        // Get the most recent record
        const latestRecord = records.sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        )[0];

        if (
            !latestRecord.record_data ||
            !Array.isArray(latestRecord.record_data)
        )
            return [];

        // Get the latest term from the record
        const currentTerm = latestRecord.record_data.at(-1);
        if (!currentTerm.marks || !Array.isArray(currentTerm.marks)) return [];

        // Get subject names
        const subjectIds = currentTerm.marks.map(
            (mark: any) => mark.subject_id
        );
        const subjectNames = await this.getSubjectNames(subjectIds, campus_id);

        return currentTerm.marks.map((mark: any) => ({
            subjectId: mark.subject_id,
            subjectName: subjectNames[mark.subject_id] || "Unknown Subject",
            marksGained: mark.mark_gained,
            totalMarks: mark.total_marks,
            percentage: Math.round((mark.mark_gained / mark.total_marks) * 100),
            grade: mark.grade,
            examId: mark.examination_id,
        }));
    }

    /**
     * Get all terms grades
     */
    private static async getAllTermsGrades(
        records: any[],
        campus_id: string
    ): Promise<TermGradesData[]> {
        const allTerms: TermGradesData[] = [];
        const subjectIds = new Set<string>();

        // Collect all subject IDs first
        for (const record of records) {
            if (record.record_data && Array.isArray(record.record_data)) {
                record.record_data.forEach((termData: any) => {
                    if (termData.marks && Array.isArray(termData.marks)) {
                        termData.marks.forEach((mark: any) => {
                            if (mark.subject_id) {
                                subjectIds.add(mark.subject_id);
                            }
                        });
                    }
                });
            }
        }

        // Get subject names
        const subjectNames = await this.getSubjectNames(
            [...subjectIds],
            campus_id
        );

        // Process terms
        for (const record of records) {
            if (record.record_data && Array.isArray(record.record_data)) {
                record.record_data.forEach((termData: any) => {
                    if (termData.marks && Array.isArray(termData.marks)) {
                        const subjects: TermSubjectGrade[] = termData.marks.map(
                            (mark: any) => ({
                                subjectId: mark.subject_id,
                                subjectName:
                                    subjectNames[mark.subject_id] ||
                                    "Unknown Subject",
                                marksGained: mark.mark_gained,
                                totalMarks: mark.total_marks,
                                percentage: Math.round(
                                    (mark.mark_gained / mark.total_marks) * 100
                                ),
                                grade: mark.grade,
                            })
                        );

                        const averagePercentage = Math.round(
                            termData.marks.reduce(
                                (sum: number, mark: any) =>
                                    sum +
                                    (mark.mark_gained / mark.total_marks) * 100,
                                0
                            ) / termData.marks.length
                        );

                        allTerms.push({
                            termId: termData.exam_term_id,
                            termName: `Term ${termData.exam_term_id}`,
                            subjects,
                            averagePercentage,
                        });
                    }
                });
            }
        }

        return allTerms.sort((a, b) => b.termId.localeCompare(a.termId));
    }

    /**
     * Calculate subject-wise grades
     */
    private static async calculateSubjectWiseGrades(
        records: any[],
        campus_id: string
    ): Promise<SubjectWiseGrades[]> {
        const subjectGrades = new Map<
            string,
            {
                subjectId: string;
                grades: SubjectGradeEntry[];
                totalMarks: number;
                totalMaxMarks: number;
                count: number;
            }
        >();

        // Process all records to group by subject
        for (const record of records) {
            if (record.record_data && Array.isArray(record.record_data)) {
                record.record_data.forEach((termData: any) => {
                    if (termData.marks && Array.isArray(termData.marks)) {
                        termData.marks.forEach((mark: any) => {
                            const subjectId = mark.subject_id;
                            if (!subjectGrades.has(subjectId)) {
                                subjectGrades.set(subjectId, {
                                    subjectId,
                                    grades: [],
                                    totalMarks: 0,
                                    totalMaxMarks: 0,
                                    count: 0,
                                });
                            }

                            const subject = subjectGrades.get(subjectId)!;
                            subject.grades.push({
                                termId: termData.exam_term_id,
                                marksGained: mark.mark_gained,
                                totalMarks: mark.total_marks,
                                percentage: Math.round(
                                    (mark.mark_gained / mark.total_marks) * 100
                                ),
                                grade: mark.grade,
                            });
                            subject.totalMarks += mark.mark_gained;
                            subject.totalMaxMarks += mark.total_marks;
                            subject.count++;
                        });
                    }
                });
            }
        }

        // Get subject names
        const subjectIds = [...subjectGrades.keys()];
        const subjectNames = await this.getSubjectNames(subjectIds, campus_id);

        // Convert to result array
        return [...subjectGrades.values()].map((subject) => ({
            subjectId: subject.subjectId,
            subjectName: subjectNames[subject.subjectId] || "Unknown Subject",
            grades: subject.grades,
            averagePercentage:
                subject.totalMaxMarks > 0
                    ? Math.round(
                          (subject.totalMarks / subject.totalMaxMarks) * 100
                      )
                    : 0,
            trend: this.calculateSubjectTrend(subject.grades),
            totalMarks: subject.totalMarks,
            totalMaxMarks: subject.totalMaxMarks,
            count: subject.count,
        }));
    }

    /**
     * Calculate term-wise averages
     */
    private static calculateTermWiseAverages(records: any[]): TermAverage[] {
        const termAverages: TermAverage[] = [];

        for (const record of records) {
            if (record.record_data && Array.isArray(record.record_data)) {
                record.record_data.forEach((termData: any) => {
                    if (termData.marks && Array.isArray(termData.marks)) {
                        const average =
                            termData.marks.reduce(
                                (sum: number, mark: any) =>
                                    sum +
                                    (mark.mark_gained / mark.total_marks) * 100,
                                0
                            ) / termData.marks.length;

                        termAverages.push({
                            termId: termData.exam_term_id,
                            termName: `Term ${termData.exam_term_id}`,
                            average: Math.round(average),
                            subjectCount: termData.marks.length,
                        });
                    }
                });
            }
        }

        return termAverages.sort((a, b) => a.termId.localeCompare(b.termId));
    }

    /**
     * Identify improvement areas
     */
    private static identifyImprovementAreas(
        subjectWiseGrades: SubjectWiseGrades[]
    ): ImprovementArea[] {
        return subjectWiseGrades
            .filter((subject) => subject.averagePercentage < 75) // Below 75% needs improvement
            .sort((a, b) => a.averagePercentage - b.averagePercentage)
            .slice(0, 3) // Top 3 improvement areas
            .map((subject) => ({
                subjectId: subject.subjectId,
                subjectName: subject.subjectName,
                currentPercentage: subject.averagePercentage,
                targetPercentage: 80,
                improvementNeeded: 80 - subject.averagePercentage,
                suggestions: this.generateImprovementSuggestions(subject),
            }));
    }

    /**
     * Calculate trend for a subject
     */
    private static calculateSubjectTrend(
        grades: SubjectGradeEntry[]
    ): "improving" | "declining" | "stable" | "insufficient_data" {
        if (grades.length < 3) return "insufficient_data";

        const recentGrades = grades.slice(-3); // Last 3 grades
        const earlyGrades = grades.slice(0, 3); // First 3 grades

        const recentAvg =
            recentGrades.reduce((sum, g) => sum + g.percentage, 0) /
            recentGrades.length;
        const earlyAvg =
            earlyGrades.reduce((sum, g) => sum + g.percentage, 0) /
            earlyGrades.length;

        const difference = recentAvg - earlyAvg;

        if (difference > 5) return "improving";
        if (difference < -5) return "declining";
        return "stable";
    }

    /**
     * Generate improvement suggestions based on performance
     */
    private static generateImprovementSuggestions(
        subject: SubjectWiseGrades
    ): string[] {
        const suggestions: string[] = [];

        if (subject.averagePercentage < 50) {
            suggestions.push(
                "Seek immediate help from teacher or tutor",
                "Review fundamental concepts",
                "Dedicate extra study time daily"
            );
        } else if (subject.averagePercentage < 65) {
            suggestions.push(
                "Increase study time for this subject",
                "Practice more past papers and exercises",
                "Form study group with classmates"
            );
        } else {
            suggestions.push(
                "Focus on challenging topics",
                "Practice advanced problems",
                "Seek clarification on weak areas"
            );
        }

        // Add trend-based suggestions
        if (subject.trend === "declining") {
            suggestions.push(
                "Identify what changed recently",
                "Review study methods and habits"
            );
        }

        return suggestions.slice(0, 4); // Limit to 4 suggestions
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
     * Get default grades data for error cases
     */
    private static getDefaultGradesData(): GradesData {
        return {
            currentTerm: [],
            allTerms: [],
            subjectWise: [],
            termWiseAverage: [],
            improvementAreas: [],
        };
    }

    /**
     * Calculate grade letter from percentage
     */
    static calculateGradeLetter(percentage: number): string {
        if (percentage >= 90) return "A+";
        if (percentage >= 85) return "A";
        if (percentage >= 80) return "A-";
        if (percentage >= 75) return "B+";
        if (percentage >= 70) return "B";
        if (percentage >= 65) return "B-";
        if (percentage >= 60) return "C+";
        if (percentage >= 55) return "C";
        if (percentage >= 50) return "C-";
        if (percentage >= 45) return "D";
        return "F";
    }

    /**
     * Calculate GPA from grades
     */
    static calculateGPA(
        grades: { percentage: number; creditHours?: number }[]
    ): number {
        if (grades.length === 0) return 0;

        const totalCredits = grades.reduce(
            (sum, grade) => sum + (grade.creditHours || 1),
            0
        );
        const weightedPoints = grades.reduce((sum, grade) => {
            const points = this.percentageToGradePoints(grade.percentage);
            return sum + points * (grade.creditHours || 1);
        }, 0);

        return Math.round((weightedPoints / totalCredits) * 100) / 100;
    }

    /**
     * Convert percentage to grade points (4.0 scale)
     */
    private static percentageToGradePoints(percentage: number): number {
        if (percentage >= 90) return 4;
        if (percentage >= 85) return 3.7;
        if (percentage >= 80) return 3.3;
        if (percentage >= 75) return 3;
        if (percentage >= 70) return 2.7;
        if (percentage >= 65) return 2.3;
        if (percentage >= 60) return 2;
        if (percentage >= 55) return 1.7;
        if (percentage >= 50) return 1;
        return 0;
    }
}
