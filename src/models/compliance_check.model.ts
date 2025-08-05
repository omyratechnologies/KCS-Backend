import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

export interface IComplianceCheck {
    id: string;
    campus_id: string;
    check_type: "automated" | "manual" | "scheduled";
    check_date: Date;
    compliance_score: number;
    status: "compliant" | "partial" | "non_compliant";
    issues: Array<{
        severity: "critical" | "high" | "medium" | "low";
        category: string;
        description: string;
        recommendation: string;
        auto_remediation_available: boolean;
        remediation_steps: string[];
    }>;
    remediation_actions: Array<{
        action_id: string;
        action_type: string;
        status: "pending" | "in_progress" | "completed" | "failed";
        initiated_at: Date;
        completed_at?: Date;
        initiated_by: string;
        result?: string;
    }>;
    next_check_date: Date;
    created_at: Date;
    updated_at: Date;
}

const ComplianceCheckSchema = new Schema({
    campus_id: { type: String, required: true },
    check_type: { type: String, required: true },
    check_date: { type: Date, required: true },
    compliance_score: { type: Number, required: true },
    status: { type: String, required: true },
    issues: { type: [Object], required: true },
    remediation_actions: { type: [Object], required: true },
    next_check_date: { type: Date, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

ComplianceCheckSchema.index.findByCampusId = { by: "campus_id" };
ComplianceCheckSchema.index.findByStatus = { by: "status" };
ComplianceCheckSchema.index.findByCheckType = { by: "check_type" };
ComplianceCheckSchema.index.findByCheckDate = { by: "check_date" };

const ComplianceCheck = ottoman.model<IComplianceCheck>("compliance_checks", ComplianceCheckSchema);

export class ComplianceCheckService {
    public static async createComplianceCheck(
        data: Omit<IComplianceCheck, "id" | "created_at" | "updated_at">
    ): Promise<IComplianceCheck> {
        return await ComplianceCheck.create({
            ...data,
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    public static async getComplianceHistory(campus_id: string, limit?: number): Promise<IComplianceCheck[]> {
        const history = await ComplianceCheck.find({
            campus_id,
        });

        let checks = history.rows || [];

        // Sort by check_date descending
        checks = checks.sort((a, b) => new Date(b.check_date).getTime() - new Date(a.check_date).getTime());

        if (limit) {
            checks = checks.slice(0, limit);
        }

        return checks;
    }

    public static async getLatestComplianceCheck(campus_id: string): Promise<IComplianceCheck | null> {
        const checks = await this.getComplianceHistory(campus_id, 1);
        return checks[0] || null;
    }

    public static async updateRemediationAction(
        check_id: string,
        action_id: string,
        updates: {
            status?: "pending" | "in_progress" | "completed" | "failed";
            completed_at?: Date;
            result?: string;
        }
    ): Promise<IComplianceCheck> {
        const check = await ComplianceCheck.findById(check_id);
        if (!check) {
            throw new Error("Compliance check not found");
        }

        const updatedActions = check.remediation_actions.map((action) => {
            if (action.action_id === action_id) {
                return {
                    ...action,
                    ...updates,
                    completed_at: updates.completed_at || action.completed_at,
                };
            }
            return action;
        });

        return await ComplianceCheck.updateById(check_id, {
            remediation_actions: updatedActions,
            updated_at: new Date(),
        });
    }

    public static async getComplianceTrends(
        campus_id: string,
        days: number = 30
    ): Promise<{
        trend_direction: "improving" | "declining" | "stable";
        avg_score: number;
        score_change: number;
        checks_count: number;
        recent_issues: Array<{
            category: string;
            count: number;
            severity: string;
        }>;
    }> {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const allChecks = await ComplianceCheck.find({
            campus_id,
        });

        const checks = (allChecks.rows || [])
            .filter((check) => new Date(check.check_date) >= since)
            .sort((a, b) => new Date(a.check_date).getTime() - new Date(b.check_date).getTime());

        if (checks.length === 0) {
            return {
                trend_direction: "stable",
                avg_score: 0,
                score_change: 0,
                checks_count: 0,
                recent_issues: [],
            };
        }

        const avgScore = checks.reduce((sum, check) => sum + check.compliance_score, 0) / checks.length;

        // Calculate trend
        let trendDirection: "improving" | "declining" | "stable" = "stable";
        let scoreChange = 0;

        if (checks.length >= 2) {
            const firstHalf = checks.slice(0, Math.floor(checks.length / 2));
            const secondHalf = checks.slice(Math.floor(checks.length / 2));

            const firstHalfAvg = firstHalf.reduce((sum, check) => sum + check.compliance_score, 0) / firstHalf.length;
            const secondHalfAvg =
                secondHalf.reduce((sum, check) => sum + check.compliance_score, 0) / secondHalf.length;

            scoreChange = secondHalfAvg - firstHalfAvg;

            if (scoreChange > 5) {
                trendDirection = "improving";
            } else if (scoreChange < -5) {
                trendDirection = "declining";
            }
        }

        // Aggregate recent issues
        const issueMap = new Map<string, { category: string; count: number; severity: string }>();

        for (const check of checks) {
            for (const issue of check.issues) {
                const key = `${issue.category}_${issue.severity}`;
                if (issueMap.has(key)) {
                    issueMap.get(key)!.count++;
                } else {
                    issueMap.set(key, {
                        category: issue.category,
                        count: 1,
                        severity: issue.severity,
                    });
                }
            }
        }

        const recentIssues = [...issueMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

        return {
            trend_direction: trendDirection,
            avg_score: avgScore,
            score_change: scoreChange,
            checks_count: checks.length,
            recent_issues: recentIssues,
        };
    }

    public static async getComplianceStatistics(): Promise<{
        total_checks: number;
        compliant_checks: number;
        non_compliant_checks: number;
        avg_compliance_score: number;
        checks_by_type: {
            automated: number;
            manual: number;
            scheduled: number;
        };
        common_issues: Array<{
            category: string;
            count: number;
            severity: string;
        }>;
    }> {
        const allChecks = await ComplianceCheck.find({});
        const checks = allChecks.rows || [];

        const total = checks.length;
        const compliant = checks.filter((c) => c.status === "compliant").length;
        const nonCompliant = checks.filter((c) => c.status === "non_compliant").length;
        const avgScore = total > 0 ? checks.reduce((sum, c) => sum + c.compliance_score, 0) / total : 0;

        const checksByType = {
            automated: checks.filter((c) => c.check_type === "automated").length,
            manual: checks.filter((c) => c.check_type === "manual").length,
            scheduled: checks.filter((c) => c.check_type === "scheduled").length,
        };

        // Aggregate common issues
        const issueMap = new Map<string, { category: string; count: number; severity: string }>();

        for (const check of checks) {
            for (const issue of check.issues) {
                const key = `${issue.category}_${issue.severity}`;
                if (issueMap.has(key)) {
                    issueMap.get(key)!.count++;
                } else {
                    issueMap.set(key, {
                        category: issue.category,
                        count: 1,
                        severity: issue.severity,
                    });
                }
            }
        }

        const commonIssues = [...issueMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

        return {
            total_checks: total,
            compliant_checks: compliant,
            non_compliant_checks: nonCompliant,
            avg_compliance_score: avgScore,
            checks_by_type: checksByType,
            common_issues: commonIssues,
        };
    }
}

export { ComplianceCheck };
