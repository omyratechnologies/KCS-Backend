import { Hono } from "hono";

import { SuperAdminController } from "@/controllers/super_admin.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const superAdminRoutes = new Hono();

// Apply authentication middleware to all routes
superAdminRoutes.use("*", authMiddleware());

// ========================= SCHOOL MANAGEMENT =========================

/**
 * Onboard a new school with payment system setup
 * POST /super-admin/schools/onboard
 */
superAdminRoutes.post("/schools/onboard", SuperAdminController.onboardNewSchool);

/**
 * Monitor health of all schools
 * GET /super-admin/schools/health?campus_ids=id1,id2,id3
 */
superAdminRoutes.get("/schools/health", SuperAdminController.monitorSchoolHealth);

/**
 * Get platform-wide analytics
 * GET /super-admin/analytics/platform
 */
superAdminRoutes.get("/analytics/platform", SuperAdminController.getPlatformAnalytics);

/**
 * Troubleshoot payment issues for a specific school
 * GET /super-admin/schools/:campus_id/troubleshoot
 */
superAdminRoutes.get("/schools/:campus_id/troubleshoot", SuperAdminController.troubleshootSchoolPayments);

/**
 * Check compliance for all schools
 * GET /super-admin/compliance/check-all
 */
superAdminRoutes.get("/compliance/check-all", SuperAdminController.checkComplianceForAllSchools);

// ========================= SYSTEM OPERATIONS =========================

/**
 * Monitor system security across all campuses
 * GET /super-admin/security/monitor
 */
superAdminRoutes.get("/security/monitor", SuperAdminController.monitorSystemSecurity);

/**
 * Update payment gateway configurations globally
 * POST /super-admin/gateways/update-configurations
 */
superAdminRoutes.post("/gateways/update-configurations", SuperAdminController.updateGatewayConfigurations);

/**
 * Monitor platform performance
 * GET /super-admin/performance/monitor
 */
superAdminRoutes.get("/performance/monitor", SuperAdminController.monitorPlatformPerformance);

/**
 * Get system backup status
 * GET /super-admin/backup/status
 */
superAdminRoutes.get("/backup/status", SuperAdminController.getBackupStatus);

/**
 * Initiate manual backup
 * POST /super-admin/backup/initiate
 */
superAdminRoutes.post("/backup/initiate", SuperAdminController.initiateManualBackup);

/**
 * Generate platform-wide audit report
 * GET /super-admin/audit/generate?start_date=2023-01-01&end_date=2023-12-31&include_payment_data=true
 */
superAdminRoutes.get("/audit/generate", SuperAdminController.generateAuditReport);

/**
 * List available backups
 * GET /super-admin/backup/list
 */
superAdminRoutes.get("/backup/list", SuperAdminController.listAvailableBackups);

/**
 * Validate backup integrity
 * GET /super-admin/backup/validate/:backup_id
 */
superAdminRoutes.get("/backup/validate/:backup_id", SuperAdminController.validateBackupIntegrity);

/**
 * Initiate data restore
 * POST /super-admin/backup/restore
 */
superAdminRoutes.post("/backup/restore", SuperAdminController.initiateDataRestore);

/**
 * Get disaster recovery plan
 * GET /super-admin/disaster-recovery/plan
 */
superAdminRoutes.get("/disaster-recovery/plan", SuperAdminController.getDisasterRecoveryPlan);

/**
 * Rotate encryption keys for all campuses or specific campuses
 * POST /super-admin/security/rotate-keys
 */
superAdminRoutes.post("/security/rotate-keys", SuperAdminController.rotateEncryptionKeys);

/**
 * Run automated compliance check with remediation suggestions
 * GET /super-admin/compliance/automated-check
 */
superAdminRoutes.get("/compliance/automated-check", SuperAdminController.runAutomatedComplianceCheck);

/**
 * Get enhanced performance metrics with real-time data
 * GET /super-admin/performance/enhanced-metrics
 */
superAdminRoutes.get("/performance/enhanced-metrics", SuperAdminController.getEnhancedPerformanceMetrics);

/**
 * Execute automated remediation actions
 * POST /super-admin/remediation/execute
 */
superAdminRoutes.post("/remediation/execute", SuperAdminController.executeAutomatedRemediation);

/**
 * Get comprehensive system health dashboard
 * GET /super-admin/dashboard/system-health
 */
superAdminRoutes.get("/dashboard/system-health", SuperAdminController.getSystemHealthDashboard);

export default superAdminRoutes;
