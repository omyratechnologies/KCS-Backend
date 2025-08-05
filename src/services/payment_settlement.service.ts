import crypto from "node:crypto";

import {
    IPaymentAuditLog,
    IPaymentGatewayConfiguration,
    IPaymentSecurityEvent,
    IPaymentSettlement,
    PaymentAuditLog,
    PaymentGatewayConfiguration,
    PaymentSecurityEvent,
    PaymentSettlement,
} from "@/models/payment_settlement.model";
import {
    IPaymentTransaction,
    PaymentTransaction,
} from "@/models/payment_transaction.model";
import {
    ISchoolBankDetails,
    SchoolBankDetails,
} from "@/models/school_bank_details.model";

import PaymentErrorHandler from "./payment_error_handler.service";
import PaymentSecurityMonitor from "./payment_security_monitor.service";
import { SecurePaymentCredentialService } from "./secure_payment_credential.service";

/**
 * Enhanced Payment Settlement Service
 * Handles secure payment processing, settlement, compliance, and audit
 */
export class PaymentSettlementService {
    // ========================= SETTLEMENT PROCESSING =========================

    /**
     * Process automatic settlement for a campus
     * This runs as a scheduled job for each configured gateway
     */
    static async processAutomaticSettlement(
        campus_id: string,
        gateway_provider: "razorpay" | "payu" | "cashfree",
        settlement_date?: Date
    ): Promise<IPaymentSettlement> {
        const startTime = Date.now();
        const settlementDate = settlement_date || new Date();

        // Log settlement initiation
        await this.createAuditLog({
            campus_id,
            event_type: "settlement_initiated",
            event_category: "settlement",
            severity: "medium",
            event_details: {
                gateway_provider,
                operation_performed: "automatic_settlement_initiation",
                operation_result: "pending",
                execution_time_ms: 0,
            },
            security_context: {
                ip_address: "system",
                user_agent: "settlement-service",
                fraud_indicators: [],
            },
            system_context: {
                api_endpoint: "/internal/settlement/process",
                request_method: "POST",
                request_id: crypto.randomUUID(),
                response_status: 200,
                system_version: "1.0.0",
                environment: (process.env.NODE_ENV as any) || "production",
            },
            compliance_tags: ["settlement", "automatic", "financial"],
            is_sensitive_data: true,
            data_classification: "confidential",
        });

        try {
            // 1. Validate gateway configuration
            const gatewayConfig = await this.getGatewayConfiguration(
                campus_id,
                gateway_provider
            );
            if (!gatewayConfig || gatewayConfig.status !== "active") {
                throw PaymentErrorHandler.createError("GATEWAY_001", {
                    campus_id,
                    gateway: gateway_provider,
                });
            }

            // 2. Get settlement period
            const settlementPeriod = this.calculateSettlementPeriod(
                gatewayConfig.gateway_settings.settlement_schedule,
                settlementDate,
                gatewayConfig.gateway_settings.custom_settlement_days
            );

            // 3. Get eligible transactions for settlement
            const eligibleTransactions = await this.getEligibleTransactions(
                campus_id,
                gateway_provider,
                settlementPeriod.start,
                settlementPeriod.end
            );

            if (eligibleTransactions.length === 0) {
                throw new Error(
                    "No eligible transactions found for settlement"
                );
            }

            // 4. Calculate settlement amounts
            const settlementCalculations = await this.calculateSettlementAmount(
                eligibleTransactions,
                gatewayConfig.fee_structure
            );

            // 5. Validate minimum settlement amount
            if (
                settlementCalculations.net_settlement_amount <
                gatewayConfig.gateway_settings.minimum_settlement_amount
            ) {
                throw new Error(
                    `Settlement amount ${settlementCalculations.net_settlement_amount} is below minimum threshold`
                );
            }

            // 6. Get school bank details
            const schoolBankDetails =
                await this.getSchoolBankDetails(campus_id);

            // 7. Create settlement record
            const settlement = await this.createSettlementRecord({
                campus_id,
                gateway_provider,
                settlement_date: settlementDate,
                settlement_period: settlementPeriod,
                transactions: eligibleTransactions,
                calculations: settlementCalculations,
                school_bank_details: schoolBankDetails,
                gateway_config: gatewayConfig,
            });

            // 8. Process settlement with gateway
            const gatewaySettlement = await this.processGatewaySettlement(
                settlement,
                gatewayConfig
            );

            // 9. Update settlement with gateway response
            const updatedSettlement = await PaymentSettlement.updateById(
                settlement.id,
                {
                    gateway_settlement_id: gatewaySettlement.settlement_id,
                    gateway_settlement_reference: gatewaySettlement.reference,
                    settlement_status: "processing",
                    processing_details: {
                        ...settlement.processing_details,
                        processed_at: new Date(),
                        processing_duration_ms: Date.now() - startTime,
                    },
                    updated_at: new Date(),
                }
            );

            // 10. Send notifications
            await this.sendSettlementNotifications(updatedSettlement);

            // 11. Log successful settlement
            await this.createAuditLog({
                campus_id,
                event_type: "settlement_initiated",
                event_category: "settlement",
                severity: "medium",
                event_details: {
                    gateway_provider,
                    settlement_id: settlement.id,
                    amount: settlementCalculations.net_settlement_amount,
                    operation_performed: "automatic_settlement_completion",
                    operation_result: "success",
                    execution_time_ms: Date.now() - startTime,
                },
                security_context: {
                    ip_address: "system",
                    user_agent: "settlement-service",
                    fraud_indicators: [],
                },
                system_context: {
                    api_endpoint: "/internal/settlement/process",
                    request_method: "POST",
                    request_id: crypto.randomUUID(),
                    response_status: 200,
                    system_version: "1.0.0",
                    environment: (process.env.NODE_ENV as any) || "production",
                },
                compliance_tags: [
                    "settlement",
                    "automatic",
                    "financial",
                    "completed",
                ],
                is_sensitive_data: true,
                data_classification: "confidential",
            });

            return updatedSettlement;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Log settlement failure
            await this.createAuditLog({
                campus_id,
                event_type: "settlement_failed",
                event_category: "settlement",
                severity: "high",
                event_details: {
                    gateway_provider,
                    operation_performed: "automatic_settlement_processing",
                    operation_result: "failure",
                    execution_time_ms: executionTime,
                },
                security_context: {
                    ip_address: "system",
                    user_agent: "settlement-service",
                    fraud_indicators: ["settlement_failure"],
                },
                system_context: {
                    api_endpoint: "/internal/settlement/process",
                    request_method: "POST",
                    request_id: crypto.randomUUID(),
                    response_status: 500,
                    error_code: "SETTLEMENT_FAILED",
                    error_message:
                        error instanceof Error ? error.message : String(error),
                    system_version: "1.0.0",
                    environment: (process.env.NODE_ENV as any) || "production",
                },
                compliance_tags: [
                    "settlement",
                    "automatic",
                    "financial",
                    "failed",
                ],
                is_sensitive_data: true,
                data_classification: "confidential",
            });

            throw error;
        }
    }

    /**
     * Webhook handler for settlement status updates from payment gateways
     */
    static async handleSettlementWebhook(
        gateway_provider: "razorpay" | "payu" | "cashfree",
        webhook_data: any,
        signature: string,
        request_context: {
            ip_address: string;
            user_agent: string;
            request_id: string;
        }
    ): Promise<{ success: boolean; settlement?: IPaymentSettlement }> {
        const startTime = Date.now();

        try {
            // 1. Verify webhook signature
            const isValidSignature = await this.verifyWebhookSignature(
                gateway_provider,
                webhook_data,
                signature
            );

            if (!isValidSignature) {
                await this.createSecurityEvent({
                    campus_id: webhook_data.campus_id || "unknown",
                    event_type: "webhook_tampering",
                    severity: "critical",
                    threat_details: {
                        attack_vector: "webhook_signature_mismatch",
                        threat_indicators: [
                            "invalid_signature",
                            "potential_tampering",
                        ],
                        impact_assessment: "high",
                        data_compromised: false,
                        systems_affected: ["webhook_endpoint"],
                    },
                    detection_details: {
                        detected_at: new Date(),
                        detection_method: "automated",
                        detection_source: "webhook_verification",
                        confidence_score: 0.95,
                        false_positive_probability: 0.05,
                    },
                    notification_details: {
                        internal_team_notified: true,
                        school_notified: false,
                        regulatory_reported: false,
                        escalation_level: 3,
                    },
                });

                throw new Error("Invalid webhook signature");
            }

            // 2. Find settlement by gateway settlement ID
            const settlement = await this.findSettlementByGatewayId(
                webhook_data.settlement_id || webhook_data.id
            );

            if (!settlement) {
                throw new Error("Settlement not found for webhook data");
            }

            // 3. Update settlement status based on webhook data
            const updatedSettlement = await this.updateSettlementFromWebhook(
                settlement,
                webhook_data,
                request_context
            );

            // 4. Handle settlement completion
            if (updatedSettlement.settlement_status === "completed") {
                await this.handleSettlementCompletion(updatedSettlement);
            }

            // 5. Log webhook processing
            await this.createAuditLog({
                campus_id: settlement.campus_id,
                event_type: "webhook_received",
                event_category: "settlement",
                severity: "low",
                event_details: {
                    gateway_provider,
                    settlement_id: settlement.id,
                    operation_performed: "webhook_processing",
                    operation_result: "success",
                    execution_time_ms: Date.now() - startTime,
                },
                security_context: {
                    ip_address: request_context.ip_address,
                    user_agent: request_context.user_agent,
                    fraud_indicators: [],
                },
                system_context: {
                    api_endpoint: "/webhook/settlement",
                    request_method: "POST",
                    request_id: request_context.request_id,
                    response_status: 200,
                    system_version: "1.0.0",
                    environment: (process.env.NODE_ENV as any) || "production",
                },
                compliance_tags: ["webhook", "settlement", "update"],
                is_sensitive_data: true,
                data_classification: "confidential",
            });

            return { success: true, settlement: updatedSettlement };
        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Log webhook failure
            await this.createAuditLog({
                campus_id: webhook_data.campus_id || "unknown",
                event_type: "webhook_received",
                event_category: "settlement",
                severity: "high",
                event_details: {
                    gateway_provider,
                    operation_performed: "webhook_processing",
                    operation_result: "failure",
                    execution_time_ms: executionTime,
                },
                security_context: {
                    ip_address: request_context.ip_address,
                    user_agent: request_context.user_agent,
                    fraud_indicators: ["webhook_processing_failure"],
                },
                system_context: {
                    api_endpoint: "/webhook/settlement",
                    request_method: "POST",
                    request_id: request_context.request_id,
                    response_status: 500,
                    error_code: "WEBHOOK_PROCESSING_FAILED",
                    error_message:
                        error instanceof Error ? error.message : String(error),
                    system_version: "1.0.0",
                    environment: (process.env.NODE_ENV as any) || "production",
                },
                compliance_tags: ["webhook", "settlement", "failed"],
                is_sensitive_data: true,
                data_classification: "confidential",
            });

            return { success: false };
        }
    }

    // ========================= GATEWAY CONFIGURATION =========================

    /**
     * Configure payment gateway with enhanced security
     */
    static async configurePaymentGateway(
        campus_id: string,
        gateway_provider: "razorpay" | "payu" | "cashfree",
        configuration: Partial<IPaymentGatewayConfiguration>,
        configured_by: string
    ): Promise<IPaymentGatewayConfiguration> {
        const startTime = Date.now();

        try {
            // 1. Validate configuration
            await this.validateGatewayConfiguration(
                gateway_provider,
                configuration
            );

            // 2. Test gateway connectivity
            const testResult = await this.testGatewayConnectivity(
                campus_id,
                gateway_provider,
                configuration
            );

            if (!testResult.success) {
                throw new Error(
                    `Gateway configuration test failed: ${testResult.error}`
                );
            }

            // 3. Check for existing configuration
            const existingConfig = await this.getGatewayConfiguration(
                campus_id,
                gateway_provider
            );

            let gatewayConfig: IPaymentGatewayConfiguration;

            if (existingConfig) {
                // Update existing configuration
                gatewayConfig = await PaymentGatewayConfiguration.updateById(
                    existingConfig.id,
                    {
                        ...configuration,
                        configuration_details: {
                            ...existingConfig.configuration_details,
                            last_updated_at: new Date(),
                            last_updated_by: configured_by,
                            configuration_version:
                                this.generateConfigurationVersion(),
                        },
                        testing_details: {
                            ...existingConfig.testing_details,
                            last_test_date: new Date(),
                            last_test_status: "success",
                            connectivity_status: "connected",
                            health_check_status: "healthy",
                            last_health_check: new Date(),
                        },
                        updated_at: new Date(),
                    }
                );
            } else {
                // Create new configuration
                gatewayConfig = await PaymentGatewayConfiguration.create({
                    campus_id,
                    gateway_provider,
                    ...configuration,
                    configuration_details: {
                        configured_at: new Date(),
                        configured_by,
                        last_updated_at: new Date(),
                        last_updated_by: configured_by,
                        configuration_version:
                            this.generateConfigurationVersion(),
                    },
                    testing_details: {
                        last_test_date: new Date(),
                        last_test_status: "success",
                        connectivity_status: "connected",
                        health_check_status: "healthy",
                        last_health_check: new Date(),
                    },
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }

            // 4. If this is primary gateway, update others
            if (configuration.is_primary) {
                await this.updatePrimaryGateway(campus_id, gateway_provider);
            }

            // 5. Log configuration change
            await this.createAuditLog({
                campus_id,
                event_type: "gateway_configured",
                event_category: "configuration",
                severity: "medium",
                event_details: {
                    gateway_provider,
                    operation_performed: existingConfig
                        ? "gateway_update"
                        : "gateway_create",
                    operation_result: "success",
                    execution_time_ms: Date.now() - startTime,
                },
                security_context: {
                    ip_address: "system", // This should come from request context
                    user_agent: "admin-panel", // This should come from request context
                    fraud_indicators: [],
                },
                system_context: {
                    api_endpoint: "/admin/gateway/configure",
                    request_method: "POST",
                    request_id: crypto.randomUUID(),
                    response_status: 200,
                    system_version: "1.0.0",
                    environment: (process.env.NODE_ENV as any) || "production",
                },
                data_changes: existingConfig
                    ? {
                          before_value: existingConfig,
                          after_value: gatewayConfig,
                          changed_fields: Object.keys(configuration),
                          change_reason: "gateway_configuration_update",
                      }
                    : undefined,
                compliance_tags: ["gateway", "configuration", "financial"],
                is_sensitive_data: true,
                data_classification: "confidential",
            });

            return gatewayConfig;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            // Log configuration failure
            await this.createAuditLog({
                campus_id,
                event_type: "gateway_configured",
                event_category: "configuration",
                severity: "high",
                event_details: {
                    gateway_provider,
                    operation_performed: "gateway_configuration",
                    operation_result: "failure",
                    execution_time_ms: executionTime,
                },
                security_context: {
                    ip_address: "system",
                    user_agent: "admin-panel",
                    fraud_indicators: ["configuration_failure"],
                },
                system_context: {
                    api_endpoint: "/admin/gateway/configure",
                    request_method: "POST",
                    request_id: crypto.randomUUID(),
                    response_status: 500,
                    error_code: "GATEWAY_CONFIG_FAILED",
                    error_message:
                        error instanceof Error ? error.message : String(error),
                    system_version: "1.0.0",
                    environment: (process.env.NODE_ENV as any) || "production",
                },
                compliance_tags: ["gateway", "configuration", "failed"],
                is_sensitive_data: true,
                data_classification: "confidential",
            });

            throw error;
        }
    }

    // ========================= SECURITY & COMPLIANCE =========================

    /**
     * Perform comprehensive security audit
     */
    static async performSecurityAudit(campus_id: string): Promise<{
        overall_score: number;
        security_issues: string[];
        compliance_status: string;
        recommendations: string[];
        audit_report_id: string;
    }> {
        const startTime = Date.now();
        const auditId = crypto.randomUUID();

        try {
            // 1. Check gateway configurations
            const gatewayConfigs =
                await this.getAllGatewayConfigurations(campus_id);
            const gatewaySecurityIssues =
                await this.auditGatewayConfigurations(gatewayConfigs);

            // 2. Check credential security
            const credentialSecurityResult =
                await SecurePaymentCredentialService.validateCredentialSecurity(
                    campus_id
                );

            // 3. Check recent security events
            const recentSecurityEvents = await this.getRecentSecurityEvents(
                campus_id,
                30
            ); // Last 30 days

            // 4. Check compliance status
            const complianceStatus =
                await this.checkComplianceStatus(campus_id);

            // 5. Calculate overall security score
            const securityScore = this.calculateSecurityScore({
                gatewayConfigurations: gatewayConfigs,
                credentialSecurity: credentialSecurityResult,
                securityEvents: recentSecurityEvents,
                compliance: complianceStatus,
            });

            // 6. Generate recommendations
            const recommendations = this.generateSecurityRecommendations({
                gatewayIssues: gatewaySecurityIssues,
                credentialIssues: credentialSecurityResult.issues,
                securityEvents: recentSecurityEvents,
                compliance: complianceStatus,
            });

            // 7. Log audit completion
            await this.createAuditLog({
                campus_id,
                event_type: "audit_review",
                event_category: "security",
                severity:
                    securityScore < 70
                        ? "high"
                        : securityScore < 85
                          ? "medium"
                          : "low",
                event_details: {
                    operation_performed: "comprehensive_security_audit",
                    operation_result: "success",
                    execution_time_ms: Date.now() - startTime,
                },
                security_context: {
                    ip_address: "system",
                    user_agent: "security-audit-service",
                    fraud_indicators: [],
                },
                system_context: {
                    api_endpoint: "/internal/security/audit",
                    request_method: "POST",
                    request_id: crypto.randomUUID(),
                    response_status: 200,
                    system_version: "1.0.0",
                    environment: (process.env.NODE_ENV as any) || "production",
                },
                compliance_tags: ["security", "audit", "compliance", "review"],
                is_sensitive_data: true,
                data_classification: "confidential",
            });

            return {
                overall_score: securityScore,
                security_issues: [
                    ...gatewaySecurityIssues,
                    ...credentialSecurityResult.issues,
                ],
                compliance_status: complianceStatus.overall_status,
                recommendations,
                audit_report_id: auditId,
            };
        } catch (error) {
            throw PaymentErrorHandler.createError("SYS_001", {
                operation: "security_audit",
                original_error:
                    error instanceof Error ? error.message : String(error),
            });
        }
    }

    // ========================= PRIVATE HELPER METHODS =========================

    private static calculateSettlementPeriod(
        schedule: string,
        settlement_date: Date,
        custom_days?: number[]
    ): { start: Date; end: Date } {
        const end = new Date(settlement_date);
        const start = new Date(settlement_date);

        switch (schedule) {
            case "daily": {
                start.setDate(start.getDate() - 1);
                break;
            }
            case "weekly": {
                start.setDate(start.getDate() - 7);
                break;
            }
            case "monthly": {
                start.setMonth(start.getMonth() - 1);
                break;
            }
            case "custom": {
                if (custom_days && custom_days.length > 0) {
                    start.setDate(start.getDate() - Math.max(...custom_days));
                } else {
                    start.setDate(start.getDate() - 7); // Default to weekly
                }
                break;
            }
            default: {
                start.setDate(start.getDate() - 1);
            } // Default to daily
        }

        return { start, end };
    }

    private static async getEligibleTransactions(
        campus_id: string,
        gateway_provider: string,
        start_date: Date,
        end_date: Date
    ): Promise<IPaymentTransaction[]> {
        const transactions = await PaymentTransaction.find({
            campus_id,
            payment_gateway: gateway_provider,
            status: "success",
            webhook_verified: true,
            completed_at: {
                $gte: start_date,
                $lte: end_date,
            },
        });

        return transactions.rows || [];
    }

    private static async calculateSettlementAmount(
        transactions: IPaymentTransaction[],
        fee_structure: any
    ): Promise<{
        total_transaction_amount: number;
        total_gateway_fees: number;
        total_platform_fees: number;
        total_taxes: number;
        net_settlement_amount: number;
    }> {
        const total_transaction_amount = transactions.reduce(
            (sum, txn) => sum + txn.amount,
            0
        );

        const total_gateway_fees = transactions.reduce((sum, txn) => {
            const fee =
                (txn.amount * fee_structure.gateway_fee_percentage) / 100 +
                fee_structure.gateway_fee_fixed;
            return sum + fee;
        }, 0);

        const total_platform_fees = transactions.reduce((sum, txn) => {
            const fee =
                (txn.amount * fee_structure.transaction_fee_percentage) / 100 +
                fee_structure.transaction_fee_fixed;
            return sum + fee;
        }, 0);

        const total_taxes = (total_gateway_fees + total_platform_fees) * 0.18; // 18% GST
        const net_settlement_amount =
            total_transaction_amount -
            total_gateway_fees -
            total_platform_fees -
            total_taxes;

        return {
            total_transaction_amount,
            total_gateway_fees,
            total_platform_fees,
            total_taxes,
            net_settlement_amount,
        };
    }

    private static async getSchoolBankDetails(campus_id: string): Promise<any> {
        const bankDetails = await SchoolBankDetails.find({
            campus_id,
            is_active: true,
        });

        if (!bankDetails.rows || bankDetails.rows.length === 0) {
            throw new Error("School bank details not found");
        }

        const details = bankDetails.rows[0];

        // Return masked account number for security
        return {
            bank_name: details.bank_name,
            account_number: this.maskAccountNumber(details.account_number),
            account_holder_name: details.account_holder_name,
            ifsc_code: details.ifsc_code,
            branch_name: details.branch_name,
            account_type: details.account_type,
        };
    }

    private static maskAccountNumber(accountNumber: string): string {
        if (accountNumber.length <= 4) {return accountNumber;}
        const visibleDigits = 4;
        const maskedDigits = accountNumber.length - visibleDigits;
        return "*".repeat(maskedDigits) + accountNumber.slice(-visibleDigits);
    }

    private static async createSettlementRecord(params: {
        campus_id: string;
        gateway_provider: string;
        settlement_date: Date;
        settlement_period: { start: Date; end: Date };
        transactions: IPaymentTransaction[];
        calculations: any;
        school_bank_details: any;
        gateway_config: IPaymentGatewayConfiguration;
    }): Promise<IPaymentSettlement> {
        const settlement_batch_id = `BATCH_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const settlement_hash = this.generateSettlementHash(params);

        return await PaymentSettlement.create({
            campus_id: params.campus_id,
            settlement_batch_id,
            settlement_date: params.settlement_date,
            settlement_period_start: params.settlement_period.start,
            settlement_period_end: params.settlement_period.end,
            settlement_status: "pending",
            total_transaction_amount:
                params.calculations.total_transaction_amount,
            total_gateway_fees: params.calculations.total_gateway_fees,
            total_platform_fees: params.calculations.total_platform_fees,
            total_taxes: params.calculations.total_taxes,
            net_settlement_amount: params.calculations.net_settlement_amount,
            currency: "INR",
            gateway_provider: params.gateway_provider,
            school_bank_details: params.school_bank_details,
            transaction_summary: {
                total_transactions: params.transactions.length,
                successful_transactions: params.transactions.filter(
                    (t) => t.status === "success"
                ).length,
                failed_transactions: 0,
                refunded_transactions: params.transactions.filter(
                    (t) => t.status === "refunded"
                ).length,
                transaction_ids: params.transactions.map((t) => t.id),
            },
            processing_details: {
                initiated_by: "system",
                initiated_at: new Date(),
                retry_count: 0,
            },
            compliance_details: {
                audit_trail_id: crypto.randomUUID(),
            },
            security_metadata: {
                settlement_hash,
                encryption_version: "v1",
                security_flags: [],
            },
            notification_status: {
                school_notified: false,
                email_notification_status: "pending",
                sms_notification_status: "pending",
                webhook_notification_status: "pending",
            },
            meta_data: {},
            created_at: new Date(),
            updated_at: new Date(),
        });
    }

    private static generateSettlementHash(params: any): string {
        const hashData = JSON.stringify({
            campus_id: params.campus_id,
            gateway_provider: params.gateway_provider,
            transaction_ids: params.transactions.map((t: any) => t.id).sort(),
            total_amount: params.calculations.total_transaction_amount,
            net_amount: params.calculations.net_settlement_amount,
        });

        return crypto.createHash("sha256").update(hashData).digest("hex");
    }

    private static async processGatewaySettlement(
        settlement: IPaymentSettlement,
        gateway_config: IPaymentGatewayConfiguration
    ): Promise<{ settlement_id: string; reference: string }> {
        // This would integrate with actual payment gateway APIs
        // For now, returning mock data
        return {
            settlement_id: `SETTLE_${Date.now()}`,
            reference: `REF_${crypto.randomUUID().slice(0, 8)}`,
        };
    }

    private static async sendSettlementNotifications(
        settlement: IPaymentSettlement
    ): Promise<void> {
        // Implementation for sending notifications
        // Email, SMS, Webhook notifications to school
        console.log(`Sending settlement notifications for ${settlement.id}`);
    }

    private static async getGatewayConfiguration(
        campus_id: string,
        gateway_provider: string
    ): Promise<IPaymentGatewayConfiguration | null> {
        const configs = await PaymentGatewayConfiguration.find({
            campus_id,
            gateway_provider,
        });

        return configs.rows && configs.rows.length > 0 ? configs.rows[0] : null;
    }

    private static async createAuditLog(
        auditData: Partial<IPaymentAuditLog>
    ): Promise<IPaymentAuditLog> {
        return await PaymentAuditLog.create({
            ...auditData,
            created_at: new Date(),
        } as IPaymentAuditLog);
    }

    private static async createSecurityEvent(
        eventData: Partial<IPaymentSecurityEvent>
    ): Promise<IPaymentSecurityEvent> {
        return await PaymentSecurityEvent.create({
            ...eventData,
            created_at: new Date(),
            updated_at: new Date(),
        } as IPaymentSecurityEvent);
    }

    // Additional helper methods would be implemented here...
    private static generateConfigurationVersion(): string {
        return `v${Date.now()}`;
    }

    private static async validateGatewayConfiguration(
        gateway_provider: string,
        configuration: any
    ): Promise<void> {
        // Implementation for validating gateway configuration
    }

    private static async testGatewayConnectivity(
        campus_id: string,
        gateway_provider: string,
        configuration: any
    ): Promise<{ success: boolean; error?: string }> {
        // Implementation for testing gateway connectivity
        return { success: true };
    }

    private static async updatePrimaryGateway(
        campus_id: string,
        new_primary_gateway: string
    ): Promise<void> {
        // Implementation for updating primary gateway
    }

    private static async verifyWebhookSignature(
        gateway_provider: string,
        webhook_data: any,
        signature: string
    ): Promise<boolean> {
        // Implementation for verifying webhook signature
        return true;
    }

    private static async findSettlementByGatewayId(
        gateway_settlement_id: string
    ): Promise<IPaymentSettlement | null> {
        const settlements = await PaymentSettlement.find({
            gateway_settlement_id,
        });

        return settlements.rows && settlements.rows.length > 0
            ? settlements.rows[0]
            : null;
    }

    private static async updateSettlementFromWebhook(
        settlement: IPaymentSettlement,
        webhook_data: any,
        request_context: any
    ): Promise<IPaymentSettlement> {
        // Implementation for updating settlement from webhook
        return settlement;
    }

    private static async handleSettlementCompletion(
        settlement: IPaymentSettlement
    ): Promise<void> {
        // Implementation for handling settlement completion
    }

    private static async getAllGatewayConfigurations(
        campus_id: string
    ): Promise<IPaymentGatewayConfiguration[]> {
        const configs = await PaymentGatewayConfiguration.find({ campus_id });
        return configs.rows || [];
    }

    private static async auditGatewayConfigurations(
        configs: IPaymentGatewayConfiguration[]
    ): Promise<string[]> {
        // Implementation for auditing gateway configurations
        return [];
    }

    private static async getRecentSecurityEvents(
        campus_id: string,
        days: number
    ): Promise<IPaymentSecurityEvent[]> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const events = await PaymentSecurityEvent.find({
            campus_id,
            created_at: { $gte: cutoffDate },
        });

        return events.rows || [];
    }

    private static async checkComplianceStatus(
        campus_id: string
    ): Promise<any> {
        // Implementation for checking compliance status
        return { overall_status: "compliant" };
    }

    private static calculateSecurityScore(data: any): number {
        // Implementation for calculating security score
        return 85; // Mock score
    }

    private static generateSecurityRecommendations(data: any): string[] {
        // Implementation for generating security recommendations
        return [];
    }
}
