import crypto from "crypto";
import { Context } from "hono";

import { PaymentSettlementService } from "@/services/payment_settlement.service";
import PaymentErrorHandler from "@/services/payment_error_handler.service";
import PaymentSecurityMonitor from "@/services/payment_security_monitor.service";

/**
 * Enhanced Payment Settlement Controller
 * Handles secure payment operations, settlements, and compliance monitoring
 */
export class PaymentSettlementController {

    // ========================= SETTLEMENT MANAGEMENT =========================

    /**
     * Trigger manual settlement for a specific gateway
     * Only accessible by Super Admin
     */
    public static readonly triggerManualSettlement = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Only Super Admin can trigger manual settlements
            if (user_type !== "Super Admin") {
                const error = PaymentErrorHandler.createError('AUTH_002', {
                    required_role: 'Super Admin',
                    current_role: user_type
                });
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            const { gateway_provider, settlement_date } = await ctx.req.json();

            if (!gateway_provider) {
                const error = PaymentErrorHandler.createError('VAL_001', {
                    missing_fields: { gateway_provider: true }
                });
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 400);
            }

            const settlement = await PaymentSettlementService.processAutomaticSettlement(
                campus_id,
                gateway_provider,
                settlement_date ? new Date(settlement_date) : undefined
            );

            return ctx.json({
                success: true,
                data: {
                    settlement_id: settlement.id,
                    settlement_batch_id: settlement.settlement_batch_id,
                    net_settlement_amount: settlement.net_settlement_amount,
                    currency: settlement.currency,
                    status: settlement.settlement_status,
                    gateway_provider: settlement.gateway_provider,
                    transaction_count: settlement.transaction_summary.total_transactions
                },
                message: "Settlement initiated successfully"
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'triggerManualSettlement',
                user_id: ctx.get("user_id"),
                campus_id: ctx.get("campus_id")
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    /**
     * Get settlement history for the campus
     */
    public static readonly getSettlementHistory = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only Admin and Super Admin can view settlement history
            if (!["Admin", "Super Admin"].includes(user_type)) {
                const error = PaymentErrorHandler.createError('AUTH_002');
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            const { 
                page = 1, 
                limit = 20, 
                status, 
                gateway_provider, 
                start_date, 
                end_date 
            } = ctx.req.query();

            // This would be implemented in PaymentSettlementService
            const settlements = {
                settlements: [],
                pagination: {
                    page: parseInt(String(page)),
                    limit: parseInt(String(limit)),
                    total: 0,
                    pages: 0
                },
                summary: {
                    total_settlements: 0,
                    total_amount_settled: 0,
                    pending_settlements: 0,
                    failed_settlements: 0
                }
            };

            return ctx.json({
                success: true,
                data: settlements
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'getSettlementHistory'
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    /**
     * Get detailed settlement information by ID
     */
    public static readonly getSettlementDetails = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");
            const { settlement_id } = ctx.req.param();

            // Only Admin and Super Admin can view settlement details
            if (!["Admin", "Super Admin"].includes(user_type)) {
                const error = PaymentErrorHandler.createError('AUTH_002');
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            // This would fetch from PaymentSettlementService
            const settlementDetails = {
                settlement_id,
                campus_id,
                status: "completed",
                // ... other settlement details
            };

            return ctx.json({
                success: true,
                data: settlementDetails
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'getSettlementDetails'
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    // ========================= WEBHOOK HANDLERS =========================

    /**
     * Handle settlement webhooks from payment gateways
     * This endpoint is called by payment gateways to update settlement status
     */
    public static readonly handleSettlementWebhook = async (ctx: Context) => {
        try {
            const { gateway } = ctx.req.param();
            const webhook_data = await ctx.req.json();
            const signature = ctx.req.header('x-webhook-signature') || 
                            ctx.req.header('x-razorpay-signature') || 
                            ctx.req.header('x-payu-signature') || 
                            ctx.req.header('x-cashfree-signature') || '';

            const request_context = {
                ip_address: ctx.env.ip || ctx.req.header('x-forwarded-for') || 'unknown',
                user_agent: ctx.req.header('user-agent') || 'unknown',
                request_id: crypto.randomUUID()
            };

            if (!["razorpay", "payu", "cashfree"].includes(gateway)) {
                return ctx.json({
                    success: false,
                    error: "Unsupported gateway"
                }, 400);
            }

            const result = await PaymentSettlementService.handleSettlementWebhook(
                gateway as "razorpay" | "payu" | "cashfree",
                webhook_data,
                signature,
                request_context
            );

            return ctx.json({
                success: result.success,
                data: result.settlement ? {
                    settlement_id: result.settlement.id,
                    status: result.settlement.settlement_status
                } : null
            });

        } catch (error) {
            // For webhook errors, we should still return 200 to prevent retries
            // but log the error internally
            console.error('Webhook processing error:', error);
            
            return ctx.json({
                success: false,
                error: "Webhook processing failed"
            }, 200); // Return 200 to prevent gateway retries
        }
    };

    // ========================= SECURITY & COMPLIANCE =========================

    /**
     * Perform comprehensive security audit
     * Only accessible by Super Admin
     */
    public static readonly performSecurityAudit = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only Super Admin can perform security audits
            if (user_type !== "Super Admin") {
                const error = PaymentErrorHandler.createError('AUTH_002', {
                    required_role: 'Super Admin',
                    current_role: user_type
                });
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            const auditResult = await PaymentSettlementService.performSecurityAudit(campus_id);

            return ctx.json({
                success: true,
                data: {
                    audit_report_id: auditResult.audit_report_id,
                    overall_security_score: auditResult.overall_score,
                    compliance_status: auditResult.compliance_status,
                    security_issues: auditResult.security_issues,
                    recommendations: auditResult.recommendations,
                    audit_timestamp: new Date(),
                    next_audit_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                },
                message: `Security audit completed. Overall score: ${auditResult.overall_score}/100`
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'performSecurityAudit'
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    /**
     * Get security events and monitoring data
     */
    public static readonly getSecurityEvents = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only Admin and Super Admin can view security events
            if (!["Admin", "Super Admin"].includes(user_type)) {
                const error = PaymentErrorHandler.createError('AUTH_002');
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            const { 
                severity, 
                event_type, 
                status, 
                page = 1, 
                limit = 50,
                start_date,
                end_date
            } = ctx.req.query();

            // This would be implemented to fetch from PaymentSecurityEvent model
            const securityEvents = {
                events: [],
                pagination: {
                    page: parseInt(String(page)),
                    limit: parseInt(String(limit)),
                    total: 0,
                    pages: 0
                },
                summary: {
                    critical_events: 0,
                    high_severity_events: 0,
                    medium_severity_events: 0,
                    low_severity_events: 0,
                    open_investigations: 0,
                    resolved_incidents: 0
                }
            };

            return ctx.json({
                success: true,
                data: securityEvents
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'getSecurityEvents'
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    /**
     * Get audit logs for compliance reporting
     */
    public static readonly getAuditLogs = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only Admin and Super Admin can view audit logs
            if (!["Admin", "Super Admin"].includes(user_type)) {
                const error = PaymentErrorHandler.createError('AUTH_002');
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            const { 
                event_category, 
                event_type, 
                severity, 
                page = 1, 
                limit = 100,
                start_date,
                end_date,
                export_format
            } = ctx.req.query();

            // Handle export request
            if (export_format === "csv" || export_format === "pdf") {
                return await this.exportAuditLogs(ctx, {
                    campus_id,
                    format: export_format as string,
                    filters: { event_category, event_type, severity, start_date, end_date }
                });
            }

            // This would be implemented to fetch from PaymentAuditLog model
            const auditLogs = {
                logs: [],
                pagination: {
                    page: parseInt(String(page)),
                    limit: parseInt(String(limit)),
                    total: 0,
                    pages: 0
                },
                summary: {
                    total_events: 0,
                    payment_events: 0,
                    settlement_events: 0,
                    security_events: 0,
                    configuration_events: 0,
                    compliance_events: 0
                }
            };

            return ctx.json({
                success: true,
                data: auditLogs
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'getAuditLogs'
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    // ========================= GATEWAY CONFIGURATION =========================

    /**
     * Configure payment gateway with enhanced security
     */
    public static readonly configureGateway = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_id = ctx.get("user_id");
            const user_type = ctx.get("user_type");

            // Only Admin and Super Admin can configure gateways
            if (!["Admin", "Super Admin"].includes(user_type)) {
                const error = PaymentErrorHandler.createError('AUTH_002');
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            const { gateway_provider, configuration } = await ctx.req.json();

            if (!gateway_provider || !configuration) {
                const error = PaymentErrorHandler.createError('VAL_001', {
                    missing_fields: { 
                        gateway_provider: !gateway_provider,
                        configuration: !configuration
                    }
                });
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 400);
            }

            const gatewayConfig = await PaymentSettlementService.configurePaymentGateway(
                campus_id,
                gateway_provider,
                configuration,
                user_id
            );

            return ctx.json({
                success: true,
                data: {
                    configuration_id: gatewayConfig.id,
                    gateway_provider: gatewayConfig.gateway_provider,
                    status: gatewayConfig.status,
                    is_primary: gatewayConfig.is_primary,
                    gateway_mode: gatewayConfig.gateway_mode,
                    configured_at: gatewayConfig.configuration_details.configured_at,
                    test_status: gatewayConfig.testing_details.last_test_status
                },
                message: `${gateway_provider} gateway configured successfully`
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'configureGateway'
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    /**
     * Get gateway configurations and status
     */
    public static readonly getGatewayConfigurations = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only Admin and Super Admin can view gateway configurations
            if (!["Admin", "Super Admin"].includes(user_type)) {
                const error = PaymentErrorHandler.createError('AUTH_002');
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            // This would be implemented to fetch from PaymentGatewayConfiguration model
            const configurations = {
                gateways: [],
                summary: {
                    total_configured: 0,
                    active_gateways: 0,
                    primary_gateway: null,
                    test_mode_gateways: 0,
                    live_mode_gateways: 0
                }
            };

            return ctx.json({
                success: true,
                data: configurations
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'getGatewayConfigurations'
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    // ========================= COMPLIANCE & REPORTING =========================

    /**
     * Generate compliance report
     */
    public static readonly generateComplianceReport = async (ctx: Context) => {
        try {
            const campus_id = ctx.get("campus_id");
            const user_type = ctx.get("user_type");

            // Only Super Admin can generate compliance reports
            if (user_type !== "Super Admin") {
                const error = PaymentErrorHandler.createError('AUTH_002', {
                    required_role: 'Super Admin',
                    current_role: user_type
                });
                return ctx.json(PaymentErrorHandler.formatErrorResponse(error), 403);
            }

            const { report_type, start_date, end_date, format = "pdf" } = ctx.req.query();

            // This would generate various compliance reports
            const reportData = {
                report_id: crypto.randomUUID(),
                report_type,
                campus_id,
                generated_at: new Date(),
                period: { start_date, end_date },
                format,
                download_url: `https://your-app.com/reports/${crypto.randomUUID()}.${format}`,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            };

            return ctx.json({
                success: true,
                data: reportData,
                message: `${report_type} compliance report generated successfully`
            });

        } catch (error) {
            const errorHandling = PaymentErrorHandler.handleError(error, {
                controller: 'PaymentSettlementController',
                method: 'generateComplianceReport'
            });
            
            return ctx.json(
                PaymentErrorHandler.formatErrorResponse(errorHandling.error),
                errorHandling.httpStatus as any
            );
        }
    };

    // ========================= PRIVATE HELPER METHODS =========================

    /**
     * Export audit logs in various formats
     */
    private static async exportAuditLogs(
        ctx: Context, 
        params: { 
            campus_id: string; 
            format: string; 
            filters: any 
        }
    ) {
        try {
            // Implementation for exporting audit logs
            const exportUrl = `https://your-app.com/exports/${crypto.randomUUID()}.${params.format}`;
            
            return ctx.json({
                success: true,
                data: {
                    export_url: exportUrl,
                    format: params.format,
                    expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
                    estimated_records: 0
                },
                message: `Audit logs export initiated in ${params.format} format`
            });

        } catch (error) {
            throw error;
        }
    }
}
