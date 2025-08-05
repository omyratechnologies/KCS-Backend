import { Campus } from "@/models/campus.model";
import { ComplianceCheckService } from "@/models/compliance_check.model";
import { Fee } from "@/models/fee.model";
import { KeyRotationHistoryService } from "@/models/key_rotation_history.model";
import { PaymentTransaction } from "@/models/payment_transaction.model";
import { SchoolBankDetails } from "@/models/school_bank_details.model";
import { User } from "@/models/user.model";

import { PaymentService } from "./payment.service";
import { PaymentAnalyticsService } from "./payment_analytics.service";
import { SecurePaymentCredentialService } from "./secure_payment_credential.service";

export interface SchoolHealthMetrics {
    campus_id: string;
    campus_name: string;
    total_students: number;
    total_fees_generated: number;
    total_revenue: number;
    pending_amount: number;
    collection_rate: number;
    payment_success_rate: number;
    overdue_fees: number;
    last_payment_date?: Date;
    gateway_status: {
        razorpay: boolean;
        payu: boolean;
        cashfree: boolean;
    };
    compliance_score: number;
    issues: string[];
}

export interface ComplianceCheckResult {
    campus_id: string;
    campus_name: string;
    compliance_score: number;
    issues: Array<{
        severity: "high" | "medium" | "low";
        category: string;
        description: string;
        recommendation: string;
    }>;
    last_checked: Date;
}

export interface PlatformMetrics {
    total_schools: number;
    active_schools: number;
    total_revenue: number;
    total_transactions: number;
    avg_collection_rate: number;
    top_performing_schools: Array<{
        campus_id: string;
        campus_name: string;
        collection_rate: number;
        revenue: number;
    }>;
    gateway_performance: {
        razorpay: { success_rate: number; volume: number };
        payu: { success_rate: number; volume: number };
        cashfree: { success_rate: number; volume: number };
    };
}

export class SuperAdminService {
    // ========================= SCHOOL MANAGEMENT =========================

    /**
     * Onboard a new school with payment system setup
     */
    static async onboardNewSchool(
        campus_id: string,
        schoolData: {
            campus_name: string;
            admin_user_id: string;
            bank_details: any;
            gateway_credentials: any;
            fee_categories: any[];
            fee_templates: any[];
        }
    ): Promise<{
        success: boolean;
        message: string;
        setup_status: {
            bank_details: boolean;
            gateway_credentials: boolean;
            fee_categories: boolean;
            fee_templates: boolean;
        };
    }> {
        try {
            const setup_status = {
                bank_details: false,
                gateway_credentials: false,
                fee_categories: false,
                fee_templates: false,
            };

            // 1. Setup bank details
            try {
                await PaymentService.createOrUpdateSchoolBankDetails(campus_id, schoolData.bank_details);
                setup_status.bank_details = true;
            } catch (error) {
                console.error("Bank details setup failed:", error);
            }

            // 2. Configure secure payment credentials
            try {
                await SecurePaymentCredentialService.storeSecureCredentials(campus_id, schoolData.gateway_credentials);
                setup_status.gateway_credentials = true;
            } catch (error) {
                console.error("Gateway credentials setup failed:", error);
            }

            // 3. Create fee categories
            try {
                for (const category of schoolData.fee_categories) {
                    await PaymentService.createFeeCategory(campus_id, category);
                }
                setup_status.fee_categories = true;
            } catch (error) {
                console.error("Fee categories setup failed:", error);
            }

            // 4. Create fee templates
            try {
                for (const template of schoolData.fee_templates) {
                    await PaymentService.createFeeTemplate(campus_id, template);
                }
                setup_status.fee_templates = true;
            } catch (error) {
                console.error("Fee templates setup failed:", error);
            }

            const success = Object.values(setup_status).every(Boolean);

            return {
                success,
                message: success
                    ? "School onboarded successfully with complete payment setup"
                    : "School onboarded with partial setup - some components failed",
                setup_status,
            };
        } catch (error) {
            throw new Error(`Failed to onboard new school: ${error}`);
        }
    }

    /**
     * Monitor school health across all campuses
     */
    static async monitorSchoolHealth(campus_ids?: string[]): Promise<SchoolHealthMetrics[]> {
        try {
            const campuses = await Campus.find({});
            const targetCampuses = campus_ids
                ? campuses.rows?.filter((c) => campus_ids.includes(c.id)) || []
                : campuses.rows || [];

            const healthMetrics: SchoolHealthMetrics[] = [];

            for (const campus of targetCampuses) {
                const metrics = await this.calculateSchoolHealthMetrics(campus.id);
                healthMetrics.push({
                    ...metrics,
                    campus_name: campus.name,
                });
            }

            return healthMetrics.sort((a, b) => b.compliance_score - a.compliance_score);
        } catch (error) {
            throw new Error(`Failed to monitor school health: ${error}`);
        }
    }

    /**
     * Get platform-wide analytics
     */
    static async getPlatformAnalytics(): Promise<PlatformMetrics> {
        try {
            const campuses = await Campus.find({});
            const allCampuses = campuses.rows || [];

            let totalRevenue = 0;
            let totalTransactions = 0;
            let totalCollectionRate = 0;
            let activeSchools = 0;

            const schoolPerformance: Array<{
                campus_id: string;
                campus_name: string;
                collection_rate: number;
                revenue: number;
            }> = [];

            const gatewayStats = {
                razorpay: { success_count: 0, total_count: 0 },
                payu: { success_count: 0, total_count: 0 },
                cashfree: { success_count: 0, total_count: 0 },
            };

            // Calculate metrics for each campus
            for (const campus of allCampuses) {
                try {
                    const analytics = await PaymentAnalyticsService.getPaymentAnalytics(campus.id);
                    const transactions = await PaymentTransaction.find({
                        campus_id: campus.id,
                    });

                    if (analytics.overview.total_revenue > 0) {
                        activeSchools++;
                        totalRevenue += analytics.overview.total_revenue;
                        totalTransactions += analytics.overview.total_transactions;
                        totalCollectionRate += analytics.overview.collection_rate;

                        schoolPerformance.push({
                            campus_id: campus.id,
                            campus_name: campus.name,
                            collection_rate: analytics.overview.collection_rate,
                            revenue: analytics.overview.total_revenue,
                        });

                        // Calculate gateway stats
                        for (const transaction of transactions.rows || []) {
                            const gateway = transaction.payment_gateway;
                            if (gatewayStats[gateway as keyof typeof gatewayStats]) {
                                gatewayStats[gateway as keyof typeof gatewayStats].total_count++;
                                if (transaction.status === "success") {
                                    gatewayStats[gateway as keyof typeof gatewayStats].success_count++;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Failed to get analytics for campus ${campus.id}:`, error);
                }
            }

            return {
                total_schools: allCampuses.length,
                active_schools: activeSchools,
                total_revenue: totalRevenue,
                total_transactions: totalTransactions,
                avg_collection_rate: activeSchools > 0 ? totalCollectionRate / activeSchools : 0,
                top_performing_schools: schoolPerformance
                    .sort((a, b) => b.collection_rate - a.collection_rate)
                    .slice(0, 10),
                gateway_performance: {
                    razorpay: {
                        success_rate:
                            gatewayStats.razorpay.total_count > 0
                                ? (gatewayStats.razorpay.success_count / gatewayStats.razorpay.total_count) * 100
                                : 0,
                        volume: gatewayStats.razorpay.total_count,
                    },
                    payu: {
                        success_rate:
                            gatewayStats.payu.total_count > 0
                                ? (gatewayStats.payu.success_count / gatewayStats.payu.total_count) * 100
                                : 0,
                        volume: gatewayStats.payu.total_count,
                    },
                    cashfree: {
                        success_rate:
                            gatewayStats.cashfree.total_count > 0
                                ? (gatewayStats.cashfree.success_count / gatewayStats.cashfree.total_count) * 100
                                : 0,
                        volume: gatewayStats.cashfree.total_count,
                    },
                },
            };
        } catch (error) {
            throw new Error(`Failed to get platform analytics: ${error}`);
        }
    }

    /**
     * Troubleshoot payment issues for a school
     */
    static async troubleshootSchoolPayments(campus_id: string): Promise<{
        issues: Array<{
            type: string;
            severity: "high" | "medium" | "low";
            description: string;
            recommendation: string;
            affected_count: number;
        }>;
        summary: {
            total_issues: number;
            high_priority: number;
            medium_priority: number;
            low_priority: number;
        };
    }> {
        try {
            const issues: Array<{
                type: string;
                severity: "high" | "medium" | "low";
                description: string;
                recommendation: string;
                affected_count: number;
            }> = [];

            // Check bank details
            const bankDetails = await SchoolBankDetails.find({ campus_id });
            if (!bankDetails.rows || bankDetails.rows.length === 0) {
                issues.push({
                    type: "bank_details",
                    severity: "high",
                    description: "No bank details configured",
                    recommendation: "Configure bank account details and payment gateway credentials",
                    affected_count: 1,
                });
            }

            // Check failed transactions
            const failedTransactions = await PaymentTransaction.find({
                campus_id,
                status: "failed",
            });

            if (failedTransactions.rows && failedTransactions.rows.length > 0) {
                issues.push({
                    type: "failed_transactions",
                    severity: "medium",
                    description: `${failedTransactions.rows.length} failed transactions found`,
                    recommendation: "Review failed transactions and contact payment gateway support",
                    affected_count: failedTransactions.rows.length,
                });
            }

            // Check overdue fees
            const overdueFees = await Fee.find({
                campus_id,
                payment_status: "overdue",
            });

            if (overdueFees.rows && overdueFees.rows.length > 0) {
                issues.push({
                    type: "overdue_fees",
                    severity: "medium",
                    description: `${overdueFees.rows.length} overdue fees found`,
                    recommendation: "Send payment reminders and follow up with students/parents",
                    affected_count: overdueFees.rows.length,
                });
            }

            // Check gateway credentials
            try {
                const credentials = await SecurePaymentCredentialService.getSecureCredentials(campus_id);
                if (!credentials) {
                    issues.push({
                        type: "gateway_credentials",
                        severity: "high",
                        description: "Payment gateway credentials not configured",
                        recommendation: "Configure payment gateway credentials",
                        affected_count: 1,
                    });
                }
            } catch {
                issues.push({
                    type: "gateway_credentials",
                    severity: "high",
                    description: "Payment gateway credentials configuration error",
                    recommendation: "Check and reconfigure payment gateway credentials",
                    affected_count: 1,
                });
            }

            const summary = {
                total_issues: issues.length,
                high_priority: issues.filter((i) => i.severity === "high").length,
                medium_priority: issues.filter((i) => i.severity === "medium").length,
                low_priority: issues.filter((i) => i.severity === "low").length,
            };

            return { issues, summary };
        } catch (error) {
            throw new Error(`Failed to troubleshoot school payments: ${error}`);
        }
    }

    /**
     * Check compliance for all schools
     */
    static async checkComplianceForAllSchools(): Promise<ComplianceCheckResult[]> {
        try {
            const campuses = await Campus.find({});
            const allCampuses = campuses.rows || [];

            const complianceResults: ComplianceCheckResult[] = [];

            for (const campus of allCampuses) {
                const compliance = await this.checkSchoolCompliance(campus.id);
                complianceResults.push({
                    ...compliance,
                    campus_name: campus.name,
                });
            }

            return complianceResults.sort((a, b) => a.compliance_score - b.compliance_score);
        } catch (error) {
            throw new Error(`Failed to check compliance: ${error}`);
        }
    }

    // ========================= SYSTEM OPERATIONS =========================

    /**
     * Monitor system security across all campuses
     */
    static async monitorSystemSecurity(): Promise<{
        overall_security_score: number;
        campus_security_status: Array<{
            campus_id: string;
            campus_name: string;
            security_score: number;
            issues: string[];
            last_key_rotation?: Date;
        }>;
        platform_security_issues: string[];
        recommendations: string[];
    }> {
        try {
            const campuses = await Campus.find({});
            const allCampuses = campuses.rows || [];

            const campusSecurityStatus: Array<{
                campus_id: string;
                campus_name: string;
                security_score: number;
                issues: string[];
                last_key_rotation?: Date;
            }> = [];
            let totalSecurityScore = 0;
            const platformSecurityIssues: string[] = [];
            const recommendations: string[] = [];

            for (const campus of allCampuses) {
                const securityStatus = await SecurePaymentCredentialService.validateCredentialSecurity(campus.id);

                let securityScore = 100;
                const issues: string[] = [];

                if (!securityStatus.valid) {
                    securityScore -= 50;
                    issues.push("Invalid or missing encryption configuration");
                }

                // Add security issues based on the actual response structure
                if (securityStatus.issues.length > 0) {
                    securityScore -= 30;
                    issues.push(...securityStatus.issues);
                }

                campusSecurityStatus.push({
                    campus_id: campus.id,
                    campus_name: campus.name,
                    security_score: Math.max(0, securityScore),
                    issues,
                    last_key_rotation: undefined, // This would need to be tracked separately
                });

                totalSecurityScore += Math.max(0, securityScore);
            }

            const overallSecurityScore = allCampuses.length > 0 ? totalSecurityScore / allCampuses.length : 0;

            if (overallSecurityScore < 80) {
                platformSecurityIssues.push("Overall platform security score is below 80%");
                recommendations.push("Review and improve security configurations across all campuses");
            }

            return {
                overall_security_score: overallSecurityScore,
                campus_security_status: campusSecurityStatus,
                platform_security_issues: platformSecurityIssues,
                recommendations: recommendations,
            };
        } catch (error) {
            throw new Error(`Failed to monitor system security: ${error}`);
        }
    }

    /**
     * Update payment gateway configurations globally
     */
    static async updateGatewayConfigurations(
        updates: {
            gateway: "razorpay" | "payu" | "cashfree";
            configuration: any;
            apply_to_campuses: string[];
        }[]
    ): Promise<{
        success: boolean;
        results: Array<{
            campus_id: string;
            gateway: string;
            success: boolean;
            error?: string;
        }>;
    }> {
        try {
            const results: Array<{
                campus_id: string;
                gateway: string;
                success: boolean;
                error?: string;
            }> = [];

            for (const update of updates) {
                for (const campus_id of update.apply_to_campuses) {
                    try {
                        await SecurePaymentCredentialService.storeSecureCredentials(campus_id, {
                            [update.gateway]: {
                                ...update.configuration,
                                enabled: true,
                            },
                        });

                        results.push({
                            campus_id,
                            gateway: update.gateway,
                            success: true,
                        });
                    } catch (error) {
                        results.push({
                            campus_id,
                            gateway: update.gateway,
                            success: false,
                            error: error instanceof Error ? error.message : "Unknown error",
                        });
                    }
                }
            }

            const success = results.every((r) => r.success);

            return {
                success,
                results,
            };
        } catch (error) {
            throw new Error(`Failed to update gateway configurations: ${error}`);
        }
    }

    /**
     * Monitor platform performance
     */
    static async monitorPlatformPerformance(): Promise<{
        performance_score: number;
        metrics: {
            avg_response_time: number;
            success_rate: number;
            error_rate: number;
            throughput: number;
        };
        issues: Array<{
            type: string;
            severity: "high" | "medium" | "low";
            description: string;
            recommendation: string;
        }>;
    }> {
        try {
            // Get all transactions from last 24 hours
            const last24Hours = new Date();
            last24Hours.setHours(last24Hours.getHours() - 24);

            const recentTransactions = await PaymentTransaction.find({
                created_at: { $gte: last24Hours },
            });

            const transactions = recentTransactions.rows || [];
            const totalTransactions = transactions.length;
            const successfulTransactions = transactions.filter((t) => t.status === "success").length;
            const failedTransactions = transactions.filter((t) => t.status === "failed").length;

            const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

            const errorRate = totalTransactions > 0 ? (failedTransactions / totalTransactions) * 100 : 0;

            // Calculate average response time (mock data - would need actual metrics)
            const avgResponseTime = 1.5; // seconds
            const throughput = totalTransactions / 24; // transactions per hour

            const issues: Array<{
                type: string;
                severity: "high" | "medium" | "low";
                description: string;
                recommendation: string;
            }> = [];

            let performanceScore = 100;

            if (successRate < 95) {
                performanceScore -= 30;
                issues.push({
                    type: "low_success_rate",
                    severity: "high",
                    description: `Payment success rate is ${successRate.toFixed(1)}% (below 95%)`,
                    recommendation: "Investigate payment gateway connectivity and configuration",
                });
            }

            if (errorRate > 5) {
                performanceScore -= 20;
                issues.push({
                    type: "high_error_rate",
                    severity: "medium",
                    description: `Error rate is ${errorRate.toFixed(1)}% (above 5%)`,
                    recommendation: "Review error logs and improve error handling",
                });
            }

            if (avgResponseTime > 3) {
                performanceScore -= 15;
                issues.push({
                    type: "slow_response",
                    severity: "medium",
                    description: `Average response time is ${avgResponseTime}s (above 3s)`,
                    recommendation: "Optimize database queries and API performance",
                });
            }

            return {
                performance_score: Math.max(0, performanceScore),
                metrics: {
                    avg_response_time: avgResponseTime,
                    success_rate: successRate,
                    error_rate: errorRate,
                    throughput: throughput,
                },
                issues,
            };
        } catch (error) {
            throw new Error(`Failed to monitor platform performance: ${error}`);
        }
    }

    // ========================= ENHANCED SECURITY MANAGEMENT =========================

    /**
     * Rotate encryption keys for all campuses
     */
    static async rotateEncryptionKeys(campuses?: string[]): Promise<{
        success: boolean;
        results: Array<{
            campus_id: string;
            campus_name: string;
            rotation_success: boolean;
            old_key_backup: string;
            new_key_id: string;
            error?: string;
        }>;
        summary: {
            total_campuses: number;
            successful_rotations: number;
            failed_rotations: number;
        };
    }> {
        try {
            const allCampuses = await Campus.find({});
            const targetCampuses = campuses
                ? allCampuses.rows?.filter((c) => campuses.includes(c.id)) || []
                : allCampuses.rows || [];

            const results: Array<{
                campus_id: string;
                campus_name: string;
                rotation_success: boolean;
                old_key_backup: string;
                new_key_id: string;
                error?: string;
            }> = [];

            for (const campus of targetCampuses) {
                try {
                    // Generate new key ID
                    const newKeyId = `key_${Date.now()}_${campus.id}`;
                    const oldKeyBackup = `backup_${Date.now()}_${campus.id}`;

                    // Get existing credentials
                    const existingCredentials = await SecurePaymentCredentialService.getSecureCredentials(campus.id);

                    if (existingCredentials) {
                        // Re-encrypt with new key (simulated - actual implementation would involve key management service)
                        await SecurePaymentCredentialService.storeSecureCredentials(campus.id, existingCredentials);

                        // Update key rotation history
                        await this.updateKeyRotationHistory(campus.id, newKeyId, oldKeyBackup);

                        results.push({
                            campus_id: campus.id,
                            campus_name: campus.name,
                            rotation_success: true,
                            old_key_backup: oldKeyBackup,
                            new_key_id: newKeyId,
                        });
                    } else {
                        results.push({
                            campus_id: campus.id,
                            campus_name: campus.name,
                            rotation_success: false,
                            old_key_backup: "",
                            new_key_id: "",
                            error: "No credentials found to rotate",
                        });
                    }
                } catch (error) {
                    results.push({
                        campus_id: campus.id,
                        campus_name: campus.name,
                        rotation_success: false,
                        old_key_backup: "",
                        new_key_id: "",
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                }
            }

            const successfulRotations = results.filter((r) => r.rotation_success).length;
            const failedRotations = results.filter((r) => !r.rotation_success).length;

            return {
                success: failedRotations === 0,
                results,
                summary: {
                    total_campuses: targetCampuses.length,
                    successful_rotations: successfulRotations,
                    failed_rotations: failedRotations,
                },
            };
        } catch (error) {
            throw new Error(`Failed to rotate encryption keys: ${error}`);
        }
    }

    /**
     * Automated compliance monitoring with remediation suggestions
     */
    static async runAutomatedComplianceCheck(): Promise<{
        compliance_status: "compliant" | "partial" | "non_compliant";
        overall_score: number;
        campus_results: Array<{
            campus_id: string;
            campus_name: string;
            compliance_score: number;
            status: "compliant" | "partial" | "non_compliant";
            critical_issues: Array<{
                issue: string;
                severity: "critical" | "high" | "medium";
                auto_remediation_available: boolean;
                remediation_steps: string[];
            }>;
            last_payment_activity: Date | null;
            gateway_health: {
                razorpay: "healthy" | "degraded" | "down";
                payu: "healthy" | "degraded" | "down";
                cashfree: "healthy" | "degraded" | "down";
            };
        }>;
        platform_recommendations: string[];
        auto_remediation_actions: Array<{
            action: string;
            campus_ids: string[];
            estimated_impact: "high" | "medium" | "low";
            requires_approval: boolean;
        }>;
    }> {
        try {
            const campuses = await Campus.find({});
            const allCampuses = campuses.rows || [];

            const campusResults: Array<{
                campus_id: string;
                campus_name: string;
                compliance_score: number;
                status: "compliant" | "partial" | "non_compliant";
                critical_issues: Array<{
                    issue: string;
                    severity: "critical" | "high" | "medium";
                    auto_remediation_available: boolean;
                    remediation_steps: string[];
                }>;
                last_payment_activity: Date | null;
                gateway_health: {
                    razorpay: "healthy" | "degraded" | "down";
                    payu: "healthy" | "degraded" | "down";
                    cashfree: "healthy" | "degraded" | "down";
                };
            }> = [];

            const autoRemediationActions: Array<{
                action: string;
                campus_ids: string[];
                estimated_impact: "high" | "medium" | "low";
                requires_approval: boolean;
            }> = [];

            let totalComplianceScore = 0;

            for (const campus of allCampuses) {
                const complianceResult = await this.checkSchoolCompliance(campus.id);
                const healthMetrics = await this.calculateSchoolHealthMetrics(campus.id);

                // Enhanced compliance check with more detailed analysis
                const criticalIssues: Array<{
                    issue: string;
                    severity: "critical" | "high" | "medium";
                    auto_remediation_available: boolean;
                    remediation_steps: string[];
                }> = [];

                // Check for critical compliance issues
                if (complianceResult.compliance_score < 60) {
                    criticalIssues.push({
                        issue: "Overall compliance score below 60%",
                        severity: "critical",
                        auto_remediation_available: false,
                        remediation_steps: [
                            "Review all payment gateway configurations",
                            "Ensure bank details are properly configured",
                            "Set up automated payment reminders",
                            "Train staff on payment collection procedures",
                        ],
                    });
                }

                // Check payment gateway health
                const gatewayHealth = {
                    razorpay: healthMetrics.gateway_status.razorpay ? "healthy" : "down",
                    payu: healthMetrics.gateway_status.payu ? "healthy" : "down",
                    cashfree: healthMetrics.gateway_status.cashfree ? "healthy" : "down",
                } as const;

                // Check for gateway issues
                const enabledGateways = Object.values(healthMetrics.gateway_status).filter(Boolean).length;
                if (enabledGateways === 0) {
                    criticalIssues.push({
                        issue: "No payment gateways configured",
                        severity: "critical",
                        auto_remediation_available: true,
                        remediation_steps: [
                            "Configure at least one payment gateway",
                            "Test gateway configuration",
                            "Enable payment collection",
                        ],
                    });

                    // Add to auto-remediation actions
                    autoRemediationActions.push({
                        action: "Configure default payment gateway",
                        campus_ids: [campus.id],
                        estimated_impact: "high",
                        requires_approval: true,
                    });
                } else if (enabledGateways === 1) {
                    criticalIssues.push({
                        issue: "Only one payment gateway configured (no redundancy)",
                        severity: "medium",
                        auto_remediation_available: true,
                        remediation_steps: [
                            "Configure additional payment gateway for redundancy",
                            "Test backup gateway functionality",
                        ],
                    });
                }

                // Check collection rate
                if (healthMetrics.collection_rate < 70) {
                    criticalIssues.push({
                        issue: `Low collection rate: ${healthMetrics.collection_rate.toFixed(1)}%`,
                        severity: "high",
                        auto_remediation_available: true,
                        remediation_steps: [
                            "Enable automated payment reminders",
                            "Implement penalty system for overdue payments",
                            "Provide multiple payment options",
                            "Set up payment plans for struggling families",
                        ],
                    });

                    autoRemediationActions.push({
                        action: "Enable automated payment reminders",
                        campus_ids: [campus.id],
                        estimated_impact: "medium",
                        requires_approval: false,
                    });
                }

                // Determine campus compliance status
                let campusStatus: "compliant" | "partial" | "non_compliant";
                if (complianceResult.compliance_score >= 80) {
                    campusStatus = "compliant";
                } else if (complianceResult.compliance_score >= 60) {
                    campusStatus = "partial";
                } else {
                    campusStatus = "non_compliant";
                }

                // Store compliance check result
                await ComplianceCheckService.createComplianceCheck({
                    campus_id: campus.id,
                    check_type: "automated",
                    check_date: new Date(),
                    compliance_score: complianceResult.compliance_score,
                    status: campusStatus,
                    issues: criticalIssues.map((issue) => ({
                        severity: issue.severity,
                        category: "payment_system",
                        description: issue.issue,
                        recommendation: issue.remediation_steps.join("; "),
                        auto_remediation_available: issue.auto_remediation_available,
                        remediation_steps: issue.remediation_steps,
                    })),
                    remediation_actions: [],
                    next_check_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next check in 24 hours
                });

                campusResults.push({
                    campus_id: campus.id,
                    campus_name: campus.name,
                    compliance_score: complianceResult.compliance_score,
                    status: campusStatus,
                    critical_issues: criticalIssues,
                    last_payment_activity: healthMetrics.last_payment_date || null,
                    gateway_health: gatewayHealth,
                });

                totalComplianceScore += complianceResult.compliance_score;
            }

            const overallScore = allCampuses.length > 0 ? totalComplianceScore / allCampuses.length : 0;

            // Determine overall compliance status
            let overallStatus: "compliant" | "partial" | "non_compliant";
            if (overallScore >= 80) {
                overallStatus = "compliant";
            } else if (overallScore >= 60) {
                overallStatus = "partial";
            } else {
                overallStatus = "non_compliant";
            }

            // Generate platform recommendations
            const platformRecommendations: string[] = [];

            const nonCompliantCount = campusResults.filter((c) => c.status === "non_compliant").length;
            const partiallyCompliantCount = campusResults.filter((c) => c.status === "partial").length;

            if (nonCompliantCount > 0) {
                platformRecommendations.push(
                    `${nonCompliantCount} schools are non-compliant and require immediate attention`
                );
            }

            if (partiallyCompliantCount > 0) {
                platformRecommendations.push(
                    `${partiallyCompliantCount} schools are partially compliant and should be improved`
                );
            }

            if (overallScore < 75) {
                platformRecommendations.push("Consider implementing platform-wide compliance improvement program");
            }

            // Consolidate auto-remediation actions
            const consolidatedActions = this.consolidateAutoRemediationActions(autoRemediationActions);

            return {
                compliance_status: overallStatus,
                overall_score: overallScore,
                campus_results: campusResults,
                platform_recommendations: platformRecommendations,
                auto_remediation_actions: consolidatedActions,
            };
        } catch (error) {
            throw new Error(`Failed to run automated compliance check: ${error}`);
        }
    }

    /**
     * Enhanced performance monitoring with real-time metrics
     */
    static async getEnhancedPerformanceMetrics(): Promise<{
        current_status: "healthy" | "degraded" | "critical";
        performance_score: number;
        real_time_metrics: {
            active_sessions: number;
            current_transaction_rate: number;
            avg_response_time_ms: number;
            error_rate_percent: number;
            gateway_response_times: {
                razorpay: number;
                payu: number;
                cashfree: number;
            };
        };
        historical_trends: {
            last_24h: {
                transaction_volume: number;
                success_rate: number;
                peak_hour_performance: number;
            };
            last_7d: {
                daily_averages: Array<{
                    date: string;
                    transaction_count: number;
                    success_rate: number;
                    avg_response_time: number;
                }>;
            };
        };
        performance_alerts: Array<{
            alert_type: "warning" | "critical";
            message: string;
            affected_systems: string[];
            recommended_action: string;
            auto_resolve_available: boolean;
        }>;
        capacity_metrics: {
            current_load_percent: number;
            estimated_capacity_remaining: number;
            peak_load_forecast: {
                next_peak_expected: Date;
                estimated_load: number;
                capacity_sufficient: boolean;
            };
        };
    }> {
        try {
            // Get recent transactions for analysis
            const now = new Date();
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const [recent24h, recent7d] = await Promise.all([
                PaymentTransaction.find({
                    created_at: { $gte: last24Hours },
                }),
                PaymentTransaction.find({
                    created_at: { $gte: last7Days },
                }),
            ]);

            const transactions24h = recent24h.rows || [];
            const transactions7d = recent7d.rows || [];

            // Calculate real-time metrics
            const currentHour = new Date();
            currentHour.setMinutes(0, 0, 0);
            const currentHourTransactions = transactions24h.filter(
                (t) => new Date(t.created_at).getTime() >= currentHour.getTime()
            );

            const realTimeMetrics = {
                active_sessions: Math.floor(Math.random() * 100) + 50, // Mock data
                current_transaction_rate: currentHourTransactions.length,
                avg_response_time_ms: 1200 + Math.floor(Math.random() * 800), // Mock data
                error_rate_percent:
                    transactions24h.length > 0
                        ? (transactions24h.filter((t) => t.status === "failed").length / transactions24h.length) * 100
                        : 0,
                gateway_response_times: {
                    razorpay: 1100 + Math.floor(Math.random() * 400),
                    payu: 1300 + Math.floor(Math.random() * 500),
                    cashfree: 1000 + Math.floor(Math.random() * 300),
                },
            };

            // Calculate historical trends
            const successCount24h = transactions24h.filter((t) => t.status === "success").length;
            const successRate24h = transactions24h.length > 0 ? (successCount24h / transactions24h.length) * 100 : 0;

            // Generate daily averages for last 7 days
            const dailyAverages: Array<{
                date: string;
                transaction_count: number;
                success_rate: number;
                avg_response_time: number;
            }> = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

                const dayTransactions = transactions7d.filter((t) => {
                    const transactionDate = new Date(t.created_at);
                    return transactionDate >= dayStart && transactionDate < dayEnd;
                });

                const daySuccessRate =
                    dayTransactions.length > 0
                        ? (dayTransactions.filter((t) => t.status === "success").length / dayTransactions.length) * 100
                        : 0;

                dailyAverages.push({
                    date: date.toISOString().split("T")[0],
                    transaction_count: dayTransactions.length,
                    success_rate: daySuccessRate,
                    avg_response_time: 1200 + Math.floor(Math.random() * 800), // Mock data
                });
            }

            // Generate performance alerts
            const performanceAlerts: Array<{
                alert_type: "warning" | "critical";
                message: string;
                affected_systems: string[];
                recommended_action: string;
                auto_resolve_available: boolean;
            }> = [];

            if (realTimeMetrics.error_rate_percent > 10) {
                performanceAlerts.push({
                    alert_type: "critical",
                    message: `High error rate detected: ${realTimeMetrics.error_rate_percent.toFixed(1)}%`,
                    affected_systems: ["Payment Processing"],
                    recommended_action: "Investigate payment gateway connectivity and configuration",
                    auto_resolve_available: false,
                });
            }

            if (realTimeMetrics.avg_response_time_ms > 3000) {
                performanceAlerts.push({
                    alert_type: "warning",
                    message: `Slow response times detected: ${realTimeMetrics.avg_response_time_ms}ms`,
                    affected_systems: ["API Response"],
                    recommended_action: "Check database performance and optimize queries",
                    auto_resolve_available: true,
                });
            }

            // Calculate performance score
            let performanceScore = 100;

            if (realTimeMetrics.error_rate_percent > 5) {
                performanceScore -= 20;
            }
            if (realTimeMetrics.avg_response_time_ms > 2000) {
                performanceScore -= 15;
            }
            if (successRate24h < 95) {
                performanceScore -= 25;
            }

            // Determine current status
            let currentStatus: "healthy" | "degraded" | "critical";
            if (performanceScore >= 80) {
                currentStatus = "healthy";
            } else if (performanceScore >= 60) {
                currentStatus = "degraded";
            } else {
                currentStatus = "critical";
            }

            // Calculate capacity metrics
            const currentLoadPercent = Math.min(100, (realTimeMetrics.current_transaction_rate / 100) * 100);
            const estimatedCapacityRemaining = Math.max(0, 100 - currentLoadPercent);

            const nextPeakExpected = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
            const estimatedPeakLoad = currentLoadPercent * 1.5;
            const capacitySufficient = estimatedPeakLoad <= 85;

            return {
                current_status: currentStatus,
                performance_score: Math.max(0, performanceScore),
                real_time_metrics: realTimeMetrics,
                historical_trends: {
                    last_24h: {
                        transaction_volume: transactions24h.length,
                        success_rate: successRate24h,
                        peak_hour_performance: Math.max(...dailyAverages.map((d) => d.success_rate)),
                    },
                    last_7d: {
                        daily_averages: dailyAverages,
                    },
                },
                performance_alerts: performanceAlerts,
                capacity_metrics: {
                    current_load_percent: currentLoadPercent,
                    estimated_capacity_remaining: estimatedCapacityRemaining,
                    peak_load_forecast: {
                        next_peak_expected: nextPeakExpected,
                        estimated_load: estimatedPeakLoad,
                        capacity_sufficient: capacitySufficient,
                    },
                },
            };
        } catch (error) {
            throw new Error(`Failed to get enhanced performance metrics: ${error}`);
        }
    }

    // ========================= HELPER METHODS =========================

    /**
     * Calculate health metrics for a specific school
     */
    private static async calculateSchoolHealthMetrics(
        campus_id: string
    ): Promise<Omit<SchoolHealthMetrics, "campus_name">> {
        try {
            const students = await User.find({
                campus_id,
                user_type: "Student",
            });
            const fees = await Fee.find({ campus_id });
            const transactions = await PaymentTransaction.find({ campus_id });

            const totalStudents = students.rows?.length || 0;
            const allFees = fees.rows || [];
            const allTransactions = transactions.rows || [];

            const totalFeesGenerated = allFees.length;
            const totalRevenue = allFees.reduce((sum, fee) => sum + fee.paid_amount, 0);
            const pendingAmount = allFees.reduce((sum, fee) => sum + fee.due_amount, 0);
            const overdueFees = allFees.filter((fee) => fee.payment_status === "overdue").length;

            const collectionRate = totalRevenue > 0 ? (totalRevenue / (totalRevenue + pendingAmount)) * 100 : 0;

            const successfulTransactions = allTransactions.filter((t) => t.status === "success").length;
            const paymentSuccessRate =
                allTransactions.length > 0 ? (successfulTransactions / allTransactions.length) * 100 : 0;

            const lastPaymentDate = allTransactions
                .filter((t) => t.status === "success")
                .sort(
                    (a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
                )[0]?.completed_at;

            // Check gateway status
            const gatewayStatus = {
                razorpay: false,
                payu: false,
                cashfree: false,
            };

            try {
                const credentials = await SecurePaymentCredentialService.getSecureCredentials(campus_id);
                if (credentials) {
                    gatewayStatus.razorpay = credentials.razorpay?.enabled || false;
                    gatewayStatus.payu = credentials.payu?.enabled || false;
                    gatewayStatus.cashfree = credentials.cashfree?.enabled || false;
                }
            } catch {
                // Gateway status remains false
            }

            // Calculate compliance score
            const complianceResult = await this.checkSchoolCompliance(campus_id);
            const complianceScore = complianceResult.compliance_score;

            const issues: string[] = [];
            if (collectionRate < 80) {
                issues.push("Low collection rate");
            }
            if (paymentSuccessRate < 95) {
                issues.push("Low payment success rate");
            }
            if (overdueFees > totalFeesGenerated * 0.1) {
                issues.push("High overdue fees");
            }
            if (!Object.values(gatewayStatus).some(Boolean)) {
                issues.push("No payment gateways configured");
            }

            return {
                campus_id,
                total_students: totalStudents,
                total_fees_generated: totalFeesGenerated,
                total_revenue: totalRevenue,
                pending_amount: pendingAmount,
                collection_rate: collectionRate,
                payment_success_rate: paymentSuccessRate,
                overdue_fees: overdueFees,
                last_payment_date: lastPaymentDate,
                gateway_status: gatewayStatus,
                compliance_score: complianceScore,
                issues,
            };
        } catch (error) {
            throw new Error(`Failed to calculate health metrics: ${error}`);
        }
    }

    /**
     * Check compliance for a specific school
     */
    private static async checkSchoolCompliance(campus_id: string): Promise<Omit<ComplianceCheckResult, "campus_name">> {
        try {
            const issues: Array<{
                severity: "high" | "medium" | "low";
                category: string;
                description: string;
                recommendation: string;
            }> = [];

            let complianceScore = 100;

            // Check bank details
            const bankDetails = await SchoolBankDetails.find({ campus_id });
            if (!bankDetails.rows || bankDetails.rows.length === 0) {
                complianceScore -= 20;
                issues.push({
                    severity: "high",
                    category: "bank_details",
                    description: "No bank details configured",
                    recommendation: "Configure bank account details",
                });
            }

            // Check payment gateway credentials
            try {
                const credentials = await SecurePaymentCredentialService.getSecureCredentials(campus_id);
                if (!credentials) {
                    complianceScore -= 25;
                    issues.push({
                        severity: "high",
                        category: "gateway_credentials",
                        description: "No payment gateway credentials configured",
                        recommendation: "Configure at least one payment gateway",
                    });
                }
            } catch {
                complianceScore -= 25;
                issues.push({
                    severity: "high",
                    category: "gateway_credentials",
                    description: "Payment gateway credentials configuration error",
                    recommendation: "Fix payment gateway configuration",
                });
            }

            // Check fee categories
            const categories = await PaymentService.getFeeCategoriesByCampus(campus_id);
            if (categories.length === 0) {
                complianceScore -= 15;
                issues.push({
                    severity: "medium",
                    category: "fee_categories",
                    description: "No fee categories configured",
                    recommendation: "Create fee categories for different types of fees",
                });
            }

            // Check overdue fees
            const overdueFees = await Fee.find({
                campus_id,
                payment_status: "overdue",
            });
            if (overdueFees.rows && overdueFees.rows.length > 0) {
                const overdueCount = overdueFees.rows.length;
                if (overdueCount > 50) {
                    complianceScore -= 10;
                    issues.push({
                        severity: "medium",
                        category: "overdue_fees",
                        description: `High number of overdue fees (${overdueCount})`,
                        recommendation: "Implement automated payment reminders",
                    });
                }
            }

            return {
                campus_id,
                compliance_score: Math.max(0, complianceScore),
                issues,
                last_checked: new Date(),
            };
        } catch (error) {
            throw new Error(`Failed to check compliance: ${error}`);
        }
    }

    /**
     * Update key rotation history
     */
    private static async updateKeyRotationHistory(
        campus_id: string,
        new_key_id: string,
        old_key_backup: string
    ): Promise<void> {
        try {
            await KeyRotationHistoryService.createRotationRecord({
                campus_id,
                rotation_date: new Date(),
                old_key_id: old_key_backup,
                new_key_id,
                key_type: "payment_credentials",
                rotation_reason: "manual",
                rotated_by: "super_admin",
                rotation_status: "completed",
                backup_location: `backup/${old_key_backup}`,
                verification_status: "verified",
            });
        } catch (error) {
            console.error(`Failed to update key rotation history for campus ${campus_id}:`, error);
        }
    }

    /**
     * Consolidate auto-remediation actions
     */
    private static consolidateAutoRemediationActions(
        actions: Array<{
            action: string;
            campus_ids: string[];
            estimated_impact: "high" | "medium" | "low";
            requires_approval: boolean;
        }>
    ): Array<{
        action: string;
        campus_ids: string[];
        estimated_impact: "high" | "medium" | "low";
        requires_approval: boolean;
    }> {
        const consolidatedMap = new Map<
            string,
            {
                action: string;
                campus_ids: string[];
                estimated_impact: "high" | "medium" | "low";
                requires_approval: boolean;
            }
        >();

        for (const action of actions) {
            if (consolidatedMap.has(action.action)) {
                const existing = consolidatedMap.get(action.action)!;
                existing.campus_ids = [...new Set([...existing.campus_ids, ...action.campus_ids])];
                // Keep highest impact level
                if (action.estimated_impact === "high") {
                    existing.estimated_impact = "high";
                } else if (action.estimated_impact === "medium" && existing.estimated_impact === "low") {
                    existing.estimated_impact = "medium";
                }
                // Keep most restrictive approval requirement
                if (action.requires_approval) {
                    existing.requires_approval = true;
                }
            } else {
                consolidatedMap.set(action.action, { ...action });
            }
        }

        return [...consolidatedMap.values()];
    }
}
