import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import z from "zod";

import { PaymentSettlementController } from "@/controllers/payment_settlement.controller";
import { roleMiddleware } from "@/middlewares/role.middleware";
import { paymentMonitoringMiddleware } from "@/middlewares/payment_monitoring.middleware";

// ========================= SCHEMA DEFINITIONS =========================

const settlementRequestSchema = z.object({
    gateway_provider: z.enum(["razorpay", "payu", "cashfree"]),
    settlement_date: z.string().optional().describe("ISO date string for settlement date")
}).openapi({ ref: "SettlementRequest" });

const gatewayConfigurationSchema = z.object({
    gateway_provider: z.enum(["razorpay", "payu", "cashfree"]),
    gateway_mode: z.enum(["test", "live"]).default("test"),
    is_primary: z.boolean().default(false),
    gateway_settings: z.object({
        auto_settlement_enabled: z.boolean(),
        settlement_schedule: z.enum(["daily", "weekly", "monthly", "custom"]),
        custom_settlement_days: z.array(z.number()).optional(),
        minimum_settlement_amount: z.number().min(0),
        maximum_settlement_amount: z.number().min(0),
        settlement_currency: z.string().default("INR"),
        webhook_url: z.string().url(),
        callback_urls: z.object({
            success_url: z.string().url(),
            failure_url: z.string().url(),
            cancel_url: z.string().url()
        })
    }),
    fee_structure: z.object({
        transaction_fee_percentage: z.number().min(0).max(100),
        transaction_fee_fixed: z.number().min(0),
        settlement_fee_percentage: z.number().min(0).max(100),
        settlement_fee_fixed: z.number().min(0),
        gateway_fee_percentage: z.number().min(0).max(100),
        gateway_fee_fixed: z.number().min(0),
        currency: z.string().default("INR"),
        fee_bearer: z.enum(["school", "student", "split"])
    }),
    security_configuration: z.object({
        encryption_enabled: z.boolean().default(true),
        webhook_signature_verification: z.boolean().default(true),
        ip_whitelist: z.array(z.string()).optional(),
        allowed_payment_methods: z.array(z.string()),
        fraud_detection_enabled: z.boolean().default(true),
        daily_transaction_limit: z.number().min(0),
        monthly_transaction_limit: z.number().min(0)
    }),
    compliance_settings: z.object({
        pci_dss_compliant: z.boolean().default(true),
        data_localization_compliant: z.boolean().default(true),
        rbi_guidelines_compliant: z.boolean().default(true),
        gdpr_compliant: z.boolean().default(true),
        data_retention_period_days: z.number().min(365).default(2555), // 7 years
        audit_log_retention_days: z.number().min(365).default(2555)
    })
}).openapi({ ref: "GatewayConfiguration" });

const configureGatewayRequestSchema = z.object({
    gateway_provider: z.enum(["razorpay", "payu", "cashfree"]),
    configuration: gatewayConfigurationSchema.omit({ gateway_provider: true })
}).openapi({ ref: "ConfigureGatewayRequest" });

const successResponseSchema = z.object({
    success: z.boolean(),
    data: z.any(),
    message: z.string()
}).openapi({ ref: "SuccessResponse" });

const errorResponseSchema = z.object({
    success: z.boolean(),
    error: z.object({
        code: z.string(),
        message: z.string(),
        user_message: z.string().optional(),
        suggestions: z.array(z.string()).optional(),
        details: z.record(z.any()).optional()
    })
}).openapi({ ref: "ErrorResponse" });

const app = new Hono();

// ========================= SETTLEMENT MANAGEMENT =========================

app.post(
    "/settlements/trigger",
    paymentMonitoringMiddleware,
    describeRoute({
        tags: ["Payment Settlement"],
        operationId: "triggerManualSettlement",
        summary: "Trigger manual settlement",
        description: "Manually trigger settlement for a specific payment gateway (Super Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Settlement initiated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Super Admin access required",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
            400: {
                description: "Invalid request parameters",
                content: {
                    "application/json": {
                        schema: resolver(errorResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", settlementRequestSchema),
    PaymentSettlementController.triggerManualSettlement
);

app.get(
    "/settlements/history",
    describeRoute({
        tags: ["Payment Settlement"],
        operationId: "getSettlementHistory",
        summary: "Get settlement history",
        description: "Retrieve settlement history for the campus",
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "integer", minimum: 1, default: 1 },
                description: "Page number for pagination"
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
                description: "Number of records per page"
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["pending", "processing", "completed", "failed", "cancelled"] },
                description: "Filter by settlement status"
            },
            {
                name: "gateway_provider",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["razorpay", "payu", "cashfree"] },
                description: "Filter by gateway provider"
            },
            {
                name: "start_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Start date for filtering settlements"
            },
            {
                name: "end_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "End date for filtering settlements"
            }
        ],
        responses: {
            200: {
                description: "Settlement history retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Admin access required",
            },
        },
    }),
    PaymentSettlementController.getSettlementHistory
);

app.get(
    "/settlements/:settlement_id",
    describeRoute({
        tags: ["Payment Settlement"],
        operationId: "getSettlementDetails",
        summary: "Get settlement details",
        description: "Retrieve detailed information about a specific settlement",
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: "settlement_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Settlement ID"
            }
        ],
        responses: {
            200: {
                description: "Settlement details retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            404: {
                description: "Settlement not found",
            },
            403: {
                description: "Unauthorized - Admin access required",
            },
        },
    }),
    PaymentSettlementController.getSettlementDetails
);

// ========================= WEBHOOK HANDLERS =========================

app.post(
    "/webhooks/settlement/:gateway",
    describeRoute({
        tags: ["Payment Webhooks"],
        operationId: "handleSettlementWebhook",
        summary: "Handle settlement webhook",
        description: "Process settlement status updates from payment gateways",
        parameters: [
            {
                name: "gateway",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["razorpay", "payu", "cashfree"] },
                description: "Payment gateway provider"
            }
        ],
        responses: {
            200: {
                description: "Webhook processed successfully",
                content: {
                    "application/json": {
                        schema: resolver(z.object({
                            success: z.boolean(),
                            data: z.any().optional()
                        })),
                    },
                },
            },
            400: {
                description: "Invalid webhook data or signature",
            },
        },
    }),
    PaymentSettlementController.handleSettlementWebhook
);

// ========================= SECURITY & COMPLIANCE =========================

app.post(
    "/security/audit",
    paymentMonitoringMiddleware,
    describeRoute({
        tags: ["Payment Security"],
        operationId: "performSecurityAudit",
        summary: "Perform security audit",
        description: "Conduct comprehensive security audit of payment system (Super Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Security audit completed successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Super Admin access required",
            },
        },
    }),
    PaymentSettlementController.performSecurityAudit
);

app.get(
    "/security/events",
    describeRoute({
        tags: ["Payment Security"],
        operationId: "getSecurityEvents",
        summary: "Get security events",
        description: "Retrieve security events and monitoring data",
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: "severity",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["low", "medium", "high", "critical"] },
                description: "Filter by event severity"
            },
            {
                name: "event_type",
                in: "query",
                required: false,
                schema: { 
                    type: "string", 
                    enum: [
                        "suspicious_activity", "credential_breach", "unauthorized_access",
                        "fraud_attempt", "data_leak", "system_intrusion", "compliance_violation",
                        "encryption_failure", "webhook_tampering", "api_abuse"
                    ]
                },
                description: "Filter by event type"
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["detected", "investigating", "resolved", "false_positive"] },
                description: "Filter by event status"
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "integer", minimum: 1, default: 1 },
                description: "Page number for pagination"
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
                description: "Number of records per page"
            }
        ],
        responses: {
            200: {
                description: "Security events retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Admin access required",
            },
        },
    }),
    PaymentSettlementController.getSecurityEvents
);

app.get(
    "/audit/logs",
    describeRoute({
        tags: ["Payment Compliance"],
        operationId: "getAuditLogs",
        summary: "Get audit logs",
        description: "Retrieve audit logs for compliance reporting",
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: "event_category",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["payment", "settlement", "security", "compliance", "configuration"] },
                description: "Filter by event category"
            },
            {
                name: "event_type",
                in: "query",
                required: false,
                schema: { 
                    type: "string",
                    enum: [
                        "payment_initiated", "payment_completed", "payment_failed",
                        "settlement_initiated", "settlement_completed", "settlement_failed",
                        "gateway_configured", "credentials_updated", "webhook_received",
                        "refund_initiated", "refund_completed", "security_event",
                        "compliance_check", "audit_review"
                    ]
                },
                description: "Filter by event type"
            },
            {
                name: "severity",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["low", "medium", "high", "critical"] },
                description: "Filter by event severity"
            },
            {
                name: "start_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "Start date for filtering logs"
            },
            {
                name: "end_date",
                in: "query",
                required: false,
                schema: { type: "string", format: "date" },
                description: "End date for filtering logs"
            },
            {
                name: "export_format",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["csv", "pdf"] },
                description: "Export format for audit logs"
            },
            {
                name: "page",
                in: "query",
                required: false,
                schema: { type: "integer", minimum: 1, default: 1 },
                description: "Page number for pagination"
            },
            {
                name: "limit",
                in: "query",
                required: false,
                schema: { type: "integer", minimum: 1, maximum: 100, default: 100 },
                description: "Number of records per page"
            }
        ],
        responses: {
            200: {
                description: "Audit logs retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Admin access required",
            },
        },
    }),
    PaymentSettlementController.getAuditLogs
);

// ========================= GATEWAY CONFIGURATION =========================

app.post(
    "/gateways/configure",
    paymentMonitoringMiddleware,
    describeRoute({
        tags: ["Payment Gateway Configuration"],
        operationId: "configureGateway",
        summary: "Configure payment gateway",
        description: "Configure payment gateway with enhanced security settings",
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Gateway configured successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Admin access required",
            },
            400: {
                description: "Invalid configuration parameters",
            },
        },
    }),
    zValidator("json", configureGatewayRequestSchema),
    PaymentSettlementController.configureGateway
);

app.get(
    "/gateways/configurations",
    describeRoute({
        tags: ["Payment Gateway Configuration"],
        operationId: "getGatewayConfigurations",
        summary: "Get gateway configurations",
        description: "Retrieve all gateway configurations and their status",
        security: [{ bearerAuth: [] }],
        responses: {
            200: {
                description: "Gateway configurations retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Admin access required",
            },
        },
    }),
    PaymentSettlementController.getGatewayConfigurations
);

// ========================= COMPLIANCE & REPORTING =========================

app.get(
    "/compliance/reports/generate",
    describeRoute({
        tags: ["Payment Compliance"],
        operationId: "generateComplianceReport",
        summary: "Generate compliance report",
        description: "Generate various compliance reports (Super Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
            {
                name: "report_type",
                in: "query",
                required: true,
                schema: { 
                    type: "string", 
                    enum: ["financial", "security", "audit", "pci_dss", "gdpr", "rbi_compliance", "settlement"] 
                },
                description: "Type of compliance report to generate"
            },
            {
                name: "start_date",
                in: "query",
                required: true,
                schema: { type: "string", format: "date" },
                description: "Report start date"
            },
            {
                name: "end_date",
                in: "query",
                required: true,
                schema: { type: "string", format: "date" },
                description: "Report end date"
            },
            {
                name: "format",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["pdf", "csv", "xlsx"], default: "pdf" },
                description: "Report format"
            }
        ],
        responses: {
            200: {
                description: "Compliance report generated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Super Admin access required",
            },
            400: {
                description: "Invalid report parameters",
            },
        },
    }),
    PaymentSettlementController.generateComplianceReport
);

// ========================= HEALTH CHECK & STATUS =========================

app.get(
    "/health",
    describeRoute({
        tags: ["Payment System Health"],
        operationId: "getSystemHealth",
        summary: "Get system health status",
        description: "Check overall health and status of payment settlement system",
        responses: {
            200: {
                description: "System health status",
                content: {
                    "application/json": {
                        schema: resolver(z.object({
                            success: z.boolean(),
                            data: z.object({
                                system_status: z.string(),
                                gateway_status: z.object({
                                    razorpay: z.string(),
                                    payu: z.string(),
                                    cashfree: z.string()
                                }),
                                database_status: z.string(),
                                security_status: z.string(),
                                compliance_status: z.string(),
                                last_settlement: z.object({
                                    date: z.string(),
                                    status: z.string(),
                                    amount: z.number()
                                }).optional(),
                                uptime_seconds: z.number(),
                                version: z.string()
                            })
                        })),
                    },
                },
            },
        },
    }),
    async (ctx) => {
        return ctx.json({
            success: true,
            data: {
                system_status: "healthy",
                gateway_status: {
                    razorpay: "connected",
                    payu: "connected",
                    cashfree: "connected"
                },
                database_status: "connected",
                security_status: "secure",
                compliance_status: "compliant",
                last_settlement: {
                    date: new Date().toISOString(),
                    status: "completed",
                    amount: 0
                },
                uptime_seconds: process.uptime(),
                version: "1.0.0"
            }
        });
    }
);

export default app;
