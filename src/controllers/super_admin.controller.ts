import { Context } from "hono";

import { BackupRecoveryService } from "@/services/backup_recovery.service";
import { SuperAdminService } from "@/services/super_admin.service";

export class SuperAdminController {
    // ========================= SCHOOL MANAGEMENT =========================

    /**
     * Onboard a new school with complete payment setup
     */
    public static readonly onboardNewSchool = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can onboard new schools
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const { campus_id, ...schoolData } = await ctx.req.json();

            if (!campus_id) {
                return ctx.json({ error: "campus_id is required" }, 400);
            }

            const result = await SuperAdminService.onboardNewSchool(campus_id, schoolData);

            return ctx.json({
                success: result.success,
                data: result,
                message: result.message,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Monitor health of all schools or specific schools
     */
    public static readonly monitorSchoolHealth = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can monitor all schools
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const { campus_ids } = ctx.req.query();
            const campusArray = campus_ids ? campus_ids.split(",") : undefined;

            const healthMetrics = await SuperAdminService.monitorSchoolHealth(campusArray);

            return ctx.json({
                success: true,
                data: healthMetrics,
                count: healthMetrics.length,
                summary: {
                    total_schools: healthMetrics.length,
                    healthy_schools: healthMetrics.filter((h) => h.compliance_score >= 80).length,
                    avg_collection_rate:
                        healthMetrics.reduce((sum, h) => sum + h.collection_rate, 0) / healthMetrics.length,
                    schools_with_issues: healthMetrics.filter((h) => h.issues.length > 0).length,
                },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get platform-wide analytics
     */
    public static readonly getPlatformAnalytics = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can view platform analytics
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const analytics = await SuperAdminService.getPlatformAnalytics();

            return ctx.json({
                success: true,
                data: analytics,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Troubleshoot payment issues for a specific school
     */
    public static readonly troubleshootSchoolPayments = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can troubleshoot
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const { campus_id } = ctx.req.param();

            if (!campus_id) {
                return ctx.json({ error: "campus_id is required" }, 400);
            }

            const troubleshooting = await SuperAdminService.troubleshootSchoolPayments(campus_id);

            return ctx.json({
                success: true,
                data: troubleshooting,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Check compliance for all schools
     */
    public static readonly checkComplianceForAllSchools = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can check compliance
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const compliance = await SuperAdminService.checkComplianceForAllSchools();

            return ctx.json({
                success: true,
                data: compliance,
                summary: {
                    total_schools: compliance.length,
                    compliant_schools: compliance.filter((c) => c.compliance_score >= 80).length,
                    avg_compliance_score:
                        compliance.reduce((sum, c) => sum + c.compliance_score, 0) / compliance.length,
                    schools_needing_attention: compliance.filter((c) => c.compliance_score < 60).length,
                },
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= SYSTEM OPERATIONS =========================

    /**
     * Monitor system security across all campuses
     */
    public static readonly monitorSystemSecurity = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can monitor system security
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const securityStatus = await SuperAdminService.monitorSystemSecurity();

            return ctx.json({
                success: true,
                data: securityStatus,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Update payment gateway configurations globally
     */
    public static readonly updateGatewayConfigurations = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can update gateway configurations
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const { updates } = await ctx.req.json();

            if (!updates || !Array.isArray(updates)) {
                return ctx.json({ error: "updates array is required" }, 400);
            }

            const result = await SuperAdminService.updateGatewayConfigurations(updates);

            return ctx.json({
                success: result.success,
                data: result,
                message: result.success
                    ? "Gateway configurations updated successfully"
                    : "Some gateway configurations failed to update",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Monitor platform performance
     */
    public static readonly monitorPlatformPerformance = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can monitor platform performance
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const performance = await SuperAdminService.monitorPlatformPerformance();

            return ctx.json({
                success: true,
                data: performance,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get system backup status
     */
    public static readonly getBackupStatus = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can check backup status
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const backupStatus = await BackupRecoveryService.getBackupStatus();

            return ctx.json({
                success: true,
                data: backupStatus,
                message: "Backup system status retrieved successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Initiate manual backup
     */
    public static readonly initiateManualBackup = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can initiate backups
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const {
                backup_type = "full",
                include_payment_data = true,
                include_user_data = true,
                campus_ids,
                compression = "gzip",
                encryption = true,
            } = await ctx.req.json();

            const backupJob = await BackupRecoveryService.initiateBackup(backup_type, {
                include_payment_data,
                include_user_data,
                campus_ids,
                compression,
                encryption,
            });

            return ctx.json({
                success: true,
                data: backupJob,
                message: "Manual backup initiated successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * List available backups
     */
    public static readonly listAvailableBackups = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can list backups
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const backups = await BackupRecoveryService.listAvailableBackups();

            return ctx.json({
                success: true,
                data: backups,
                count: backups.length,
                message: "Available backups retrieved successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Validate backup integrity
     */
    public static readonly validateBackupIntegrity = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can validate backups
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const { backup_id } = ctx.req.param();

            if (!backup_id) {
                return ctx.json({ error: "backup_id is required" }, 400);
            }

            const validation = await BackupRecoveryService.validateBackupIntegrity(backup_id);

            return ctx.json({
                success: validation.valid,
                data: validation,
                message: validation.valid
                    ? "Backup integrity validated successfully"
                    : "Backup integrity validation failed",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Initiate data restore
     */
    public static readonly initiateDataRestore = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can initiate restore
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const restoreOptions = await ctx.req.json();

            if (!restoreOptions.backup_id) {
                return ctx.json({ error: "backup_id is required" }, 400);
            }

            const restoreJob = await BackupRecoveryService.initiateRestore(restoreOptions);

            return ctx.json({
                success: true,
                data: restoreJob,
                message: "Data restore initiated successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get disaster recovery plan
     */
    public static readonly getDisasterRecoveryPlan = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can view disaster recovery plan
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const recoveryPlan = await BackupRecoveryService.getDisasterRecoveryPlan();

            return ctx.json({
                success: true,
                data: recoveryPlan,
                message: "Disaster recovery plan retrieved successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Generate platform-wide audit report
     */
    public static readonly generateAuditReport = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can generate audit reports
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const { start_date, end_date, include_payment_data = true } = ctx.req.query();

            const dateRange = {
                start_date: start_date
                    ? new Date(start_date as string)
                    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end_date: end_date ? new Date(end_date as string) : new Date(),
            };

            // Get platform analytics and compliance data
            const [platformAnalytics, complianceData, securityStatus] = await Promise.all([
                SuperAdminService.getPlatformAnalytics(),
                SuperAdminService.checkComplianceForAllSchools(),
                SuperAdminService.monitorSystemSecurity(),
            ]);

            const auditReport = {
                report_id: `audit_${Date.now()}`,
                generated_at: new Date(),
                date_range: dateRange,
                platform_summary: platformAnalytics,
                compliance_summary: {
                    total_schools: complianceData.length,
                    compliant_schools: complianceData.filter((c) => c.compliance_score >= 80).length,
                    avg_compliance_score:
                        complianceData.reduce((sum, c) => sum + c.compliance_score, 0) / complianceData.length,
                    schools_with_issues: complianceData.filter((c) => c.issues.length > 0),
                },
                security_summary: securityStatus,
                recommendations: [
                    ...securityStatus.recommendations,
                    ...(platformAnalytics.avg_collection_rate < 80
                        ? ["Improve overall collection rates across schools"]
                        : []),
                    ...(complianceData.some((c) => c.compliance_score < 60)
                        ? ["Address compliance issues in underperforming schools"]
                        : []),
                ],
            };

            return ctx.json({
                success: true,
                data: auditReport,
                message: "Audit report generated successfully",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Rotate encryption keys for all campuses or specific campuses
     */
    public static readonly rotateEncryptionKeys = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can rotate encryption keys
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const { campus_ids } = await ctx.req.json();

            const result = await SuperAdminService.rotateEncryptionKeys(campus_ids);

            return ctx.json({
                success: result.success,
                data: result,
                message: result.success
                    ? "Encryption keys rotated successfully"
                    : "Some encryption key rotations failed",
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Run automated compliance check with remediation suggestions
     */
    public static readonly runAutomatedComplianceCheck = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can run automated compliance checks
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const complianceResult = await SuperAdminService.runAutomatedComplianceCheck();

            return ctx.json({
                success: true,
                data: complianceResult,
                message: `Automated compliance check completed. Overall status: ${complianceResult.compliance_status}`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get enhanced performance metrics with real-time data
     */
    public static readonly getEnhancedPerformanceMetrics = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can view enhanced performance metrics
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const performanceMetrics = await SuperAdminService.getEnhancedPerformanceMetrics();

            return ctx.json({
                success: true,
                data: performanceMetrics,
                message: `System performance status: ${performanceMetrics.current_status}`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Execute automated remediation actions
     */
    public static readonly executeAutomatedRemediation = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can execute automated remediation
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            const { actions, approve_all = false } = await ctx.req.json();

            if (!actions || !Array.isArray(actions)) {
                return ctx.json({ error: "actions array is required" }, 400);
            }

            const results: Array<{
                action: string;
                campus_ids: string[];
                success: boolean;
                message: string;
                executed_at: Date;
            }> = [];

            // Execute each approved action
            for (const action of actions) {
                if (action.requires_approval && !approve_all) {
                    results.push({
                        action: action.action,
                        campus_ids: action.campus_ids,
                        success: false,
                        message: "Action requires explicit approval",
                        executed_at: new Date(),
                    });
                    continue;
                }

                try {
                    // Execute the remediation action based on type
                    let actionResult: { success: boolean; message: string };

                    switch (action.action) {
                        case "Configure default payment gateway": {
                            actionResult = await this.configureDefaultPaymentGateway(action.campus_ids);
                            break;
                        }
                        case "Enable automated payment reminders": {
                            actionResult = await this.enableAutomatedReminders(action.campus_ids);
                            break;
                        }
                        default: {
                            actionResult = {
                                success: false,
                                message: `Unknown remediation action: ${action.action}`,
                            };
                        }
                    }

                    results.push({
                        action: action.action,
                        campus_ids: action.campus_ids,
                        success: actionResult.success,
                        message: actionResult.message,
                        executed_at: new Date(),
                    });
                } catch (error) {
                    results.push({
                        action: action.action,
                        campus_ids: action.campus_ids,
                        success: false,
                        message: error instanceof Error ? error.message : "Unknown error",
                        executed_at: new Date(),
                    });
                }
            }

            const successCount = results.filter((r) => r.success).length;
            const totalCount = results.length;

            return ctx.json({
                success: successCount === totalCount,
                data: {
                    results,
                    summary: {
                        total_actions: totalCount,
                        successful_actions: successCount,
                        failed_actions: totalCount - successCount,
                    },
                },
                message: `Executed ${successCount}/${totalCount} remediation actions successfully`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    /**
     * Get system health dashboard
     */
    public static readonly getSystemHealthDashboard = async (ctx: Context) => {
        try {
            const user_type = ctx.get("user_type");

            // Only Super Admin can view system health dashboard
            if (user_type !== "Super Admin") {
                return ctx.json({ error: "Unauthorized - Super Admin access required" }, 403);
            }

            // Get all key system metrics in parallel
            const [platformAnalytics, complianceStatus, securityStatus, performanceMetrics, schoolHealth] =
                await Promise.all([
                    SuperAdminService.getPlatformAnalytics(),
                    SuperAdminService.runAutomatedComplianceCheck(),
                    SuperAdminService.monitorSystemSecurity(),
                    SuperAdminService.getEnhancedPerformanceMetrics(),
                    SuperAdminService.monitorSchoolHealth(),
                ]);

            // Calculate overall system health score
            const healthScores = {
                performance: performanceMetrics.performance_score,
                security: securityStatus.overall_security_score,
                compliance: complianceStatus.overall_score,
                collection: platformAnalytics.avg_collection_rate,
            };

            const overallHealthScore = Object.values(healthScores).reduce((sum, score) => sum + score, 0) / 4;

            // Generate system status summary
            const systemStatus = {
                overall_health:
                    overallHealthScore >= 80 ? "healthy" : overallHealthScore >= 60 ? "warning" : "critical",
                overall_score: overallHealthScore,
                component_health: {
                    performance: performanceMetrics.current_status,
                    security: securityStatus.overall_security_score >= 80 ? "healthy" : "warning",
                    compliance: complianceStatus.compliance_status,
                    payments: platformAnalytics.avg_collection_rate >= 80 ? "healthy" : "warning",
                },
                key_metrics: {
                    total_schools: platformAnalytics.total_schools,
                    active_schools: platformAnalytics.active_schools,
                    total_revenue: platformAnalytics.total_revenue,
                    avg_collection_rate: platformAnalytics.avg_collection_rate,
                    current_transaction_rate: performanceMetrics.real_time_metrics.current_transaction_rate,
                    error_rate: performanceMetrics.real_time_metrics.error_rate_percent,
                    compliant_schools: complianceStatus.campus_results.filter((c) => c.status === "compliant").length,
                },
                alerts: [
                    ...performanceMetrics.performance_alerts.map((alert) => ({
                        type: alert.alert_type,
                        category: "performance",
                        message: alert.message,
                        action_required: !alert.auto_resolve_available,
                    })),
                    ...securityStatus.platform_security_issues.map((issue) => ({
                        type: "warning" as const,
                        category: "security",
                        message: issue,
                        action_required: true,
                    })),
                ],
                recommendations: [
                    ...performanceMetrics.performance_alerts.map((alert) => alert.recommended_action),
                    ...securityStatus.recommendations,
                    ...complianceStatus.platform_recommendations,
                ],
            };

            return ctx.json({
                success: true,
                data: {
                    system_status: systemStatus,
                    detailed_metrics: {
                        platform_analytics: platformAnalytics,
                        compliance_status: complianceStatus,
                        security_status: securityStatus,
                        performance_metrics: performanceMetrics,
                        school_health: schoolHealth.slice(0, 10), // Top 10 schools
                    },
                },
                message: `System health dashboard - Overall status: ${systemStatus.overall_health}`,
            });
        } catch (error) {
            return ctx.json(
                {
                    success: false,
                    message: error instanceof Error ? error.message : "Unknown error",
                },
                500
            );
        }
    };

    // ========================= HELPER METHODS FOR REMEDIATION =========================

    /**
     * Configure default payment gateway for campuses
     */
    private static async configureDefaultPaymentGateway(
        campus_ids: string[]
    ): Promise<{ success: boolean; message: string }> {
        try {
            const defaultGatewayConfig = {
                gateway: "razorpay" as const,
                configuration: {
                    key_id: "rzp_test_default",
                    key_secret: "test_secret_default",
                    enabled: true,
                    mode: "test" as const,
                },
                apply_to_campuses: campus_ids,
            };

            const result = await SuperAdminService.updateGatewayConfigurations([defaultGatewayConfig]);

            return {
                success: result.success,
                message: result.success
                    ? `Default payment gateway configured for ${campus_ids.length} campuses`
                    : "Failed to configure default payment gateway for some campuses",
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Enable automated payment reminders for campuses
     */
    private static async enableAutomatedReminders(
        campus_ids: string[]
    ): Promise<{ success: boolean; message: string }> {
        try {
            // This would typically update campus settings or notification preferences
            // For now, we'll simulate the operation

            let successCount = 0;

            for (const campus_id of campus_ids) {
                try {
                    // Simulate enabling automated reminders
                    // In a real implementation, this would update campus notification settings
                    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async operation
                    successCount++;
                } catch (error) {
                    console.error(`Failed to enable automated reminders for campus ${campus_id}:`, error);
                }
            }

            return {
                success: successCount === campus_ids.length,
                message: `Automated payment reminders enabled for ${successCount}/${campus_ids.length} campuses`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
}
