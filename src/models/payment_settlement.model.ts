import { Schema } from "ottoman";

import { ottoman } from "../libs/db";

// ========================= PAYMENT SETTLEMENT INTERFACES =========================

interface IPaymentSettlement {
    id: string;
    campus_id: string;
    settlement_batch_id: string;

    // Settlement Details
    settlement_date: Date;
    settlement_period_start: Date;
    settlement_period_end: Date;
    settlement_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled";

    // Financial Information
    total_transaction_amount: number;
    total_gateway_fees: number;
    total_platform_fees: number;
    total_taxes: number;
    net_settlement_amount: number;
    currency: string;

    // Gateway Information
    gateway_provider: "razorpay" | "payu" | "cashfree";
    gateway_settlement_id?: string;
    gateway_settlement_reference?: string;

    // School Bank Details (for settlement)
    school_bank_details: {
        bank_name: string;
        account_number: string; // Masked for security
        account_holder_name: string;
        ifsc_code: string;
        branch_name: string;
        account_type: "savings" | "current";
    };

    // Transaction Summary
    transaction_summary: {
        total_transactions: number;
        successful_transactions: number;
        failed_transactions: number;
        refunded_transactions: number;
        transaction_ids: string[]; // References to payment_transactions
    };

    // Settlement Processing
    processing_details: {
        initiated_by: string; // System or manual
        initiated_at: Date;
        processed_at?: Date;
        processing_duration_ms?: number;
        retry_count: number;
        error_details?: {
            error_code: string;
            error_message: string;
            gateway_error?: any;
        };
    };

    // Compliance & Audit
    compliance_details: {
        settlement_report_url?: string;
        tax_documents: {
            tds_certificate_url?: string;
            gst_invoice_url?: string;
            consolidated_report_url?: string;
        };
        regulatory_reference?: string;
        audit_trail_id: string;
    };

    // Security & Monitoring
    security_metadata: {
        settlement_hash: string; // For integrity verification
        encryption_version: string;
        ip_address?: string;
        user_agent?: string;
        security_flags: string[];
    };

    // Notification Status
    notification_status: {
        school_notified: boolean;
        school_notification_sent_at?: Date;
        email_notification_status: "pending" | "sent" | "failed" | "bounced";
        sms_notification_status: "pending" | "sent" | "failed";
        webhook_notification_status: "pending" | "sent" | "failed" | "retry";
    };

    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface IPaymentGatewayConfiguration {
    id: string;
    campus_id: string;

    // Gateway Provider Details
    gateway_provider: "razorpay" | "payu" | "cashfree";
    gateway_mode: "test" | "live";

    // Configuration Status
    status: "active" | "inactive" | "suspended" | "under_review";
    is_primary: boolean; // Primary gateway for the school

    // Configuration Metadata
    configuration_details: {
        configured_at: Date;
        configured_by: string; // User ID
        last_updated_at: Date;
        last_updated_by: string;
        configuration_version: string;
    };

    // Gateway Specific Settings
    gateway_settings: {
        auto_settlement_enabled: boolean;
        settlement_schedule: "daily" | "weekly" | "monthly" | "custom";
        custom_settlement_days?: number[];
        minimum_settlement_amount: number;
        maximum_settlement_amount: number;
        settlement_currency: string;
        webhook_url: string;
        webhook_secret_hash: string; // Encrypted
        callback_urls: {
            success_url: string;
            failure_url: string;
            cancel_url: string;
        };
    };

    // Fee Structure
    fee_structure: {
        transaction_fee_percentage: number;
        transaction_fee_fixed: number;
        settlement_fee_percentage: number;
        settlement_fee_fixed: number;
        gateway_fee_percentage: number;
        gateway_fee_fixed: number;
        currency: string;
        fee_bearer: "school" | "student" | "split"; // Who pays the fees
    };

    // Security Settings
    security_configuration: {
        encryption_enabled: boolean;
        encryption_algorithm: string;
        webhook_signature_verification: boolean;
        ip_whitelist: string[];
        allowed_payment_methods: string[];
        fraud_detection_enabled: boolean;
        risk_scoring_enabled: boolean;
        daily_transaction_limit: number;
        monthly_transaction_limit: number;
    };

    // Testing & Validation
    testing_details: {
        last_test_date?: Date;
        last_test_status: "success" | "failed" | "pending" | "not_tested";
        test_transaction_id?: string;
        connectivity_status: "connected" | "disconnected" | "error";
        health_check_status: "healthy" | "degraded" | "unhealthy";
        last_health_check: Date;
    };

    // Compliance & Legal
    compliance_settings: {
        pci_dss_compliant: boolean;
        data_localization_compliant: boolean;
        rbi_guidelines_compliant: boolean;
        gdpr_compliant: boolean;
        data_retention_period_days: number;
        audit_log_retention_days: number;
    };

    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

interface IPaymentAuditLog {
    id: string;
    campus_id: string;

    // Event Information
    event_type:
        | "payment_initiated"
        | "payment_completed"
        | "payment_failed"
        | "settlement_initiated"
        | "settlement_completed"
        | "settlement_failed"
        | "gateway_configured"
        | "credentials_updated"
        | "webhook_received"
        | "refund_initiated"
        | "refund_completed"
        | "security_event"
        | "compliance_check"
        | "audit_review";

    event_category:
        | "payment"
        | "settlement"
        | "security"
        | "compliance"
        | "configuration";
    severity: "low" | "medium" | "high" | "critical";

    // Event Details
    event_details: {
        transaction_id?: string;
        settlement_id?: string;
        gateway_provider?: string;
        amount?: number;
        currency?: string;
        user_id?: string;
        parent_id?: string;
        student_id?: string;
        fee_id?: string;
        operation_performed: string;
        operation_result: "success" | "failure" | "partial" | "pending";
        execution_time_ms: number;
    };

    // Security Context
    security_context: {
        ip_address: string;
        user_agent: string;
        session_id?: string;
        device_fingerprint?: string;
        geolocation?: {
            country: string;
            state: string;
            city: string;
        };
        risk_score?: number;
        fraud_indicators: string[];
    };

    // System Context
    system_context: {
        api_endpoint: string;
        request_method: string;
        request_id: string;
        response_status: number;
        error_code?: string;
        error_message?: string;
        stack_trace?: string;
        system_version: string;
        environment: "development" | "staging" | "production";
    };

    // Data Changes (for configuration changes)
    data_changes?: {
        before_value?: any;
        after_value?: any;
        changed_fields: string[];
        change_reason?: string;
    };

    // Compliance & Legal
    compliance_tags: string[];
    retention_period_days: number;
    is_sensitive_data: boolean;
    data_classification: "public" | "internal" | "confidential" | "restricted";

    created_at: Date;
}

interface IPaymentSecurityEvent {
    id: string;
    campus_id: string;

    // Security Event Details
    event_type:
        | "suspicious_activity"
        | "credential_breach"
        | "unauthorized_access"
        | "fraud_attempt"
        | "data_leak"
        | "system_intrusion"
        | "compliance_violation"
        | "encryption_failure"
        | "webhook_tampering"
        | "api_abuse";

    severity: "low" | "medium" | "high" | "critical";
    status: "detected" | "investigating" | "resolved" | "false_positive";

    // Threat Information
    threat_details: {
        threat_actor?: string;
        attack_vector?: string;
        attack_pattern?: string;
        threat_indicators: string[];
        impact_assessment: "none" | "low" | "medium" | "high" | "critical";
        data_compromised: boolean;
        systems_affected: string[];
    };

    // Detection Information
    detection_details: {
        detected_at: Date;
        detection_method: "automated" | "manual" | "external_report";
        detection_source: string;
        confidence_score: number;
        false_positive_probability: number;
    };

    // Response Information
    response_details: {
        response_initiated_at?: Date;
        response_completed_at?: Date;
        response_actions: string[];
        mitigation_steps: string[];
        recovery_actions: string[];
        lessons_learned?: string;
    };

    // Notification Information
    notification_details: {
        internal_team_notified: boolean;
        school_notified: boolean;
        regulatory_reported: boolean;
        notification_sent_at?: Date;
        escalation_level: number;
    };

    meta_data: object;
    created_at: Date;
    updated_at: Date;
}

// ========================= DATABASE SCHEMAS =========================

const PaymentSettlementSchema = new Schema({
    campus_id: { type: String, required: true },
    settlement_batch_id: { type: String, required: true },

    settlement_date: { type: Date, required: true },
    settlement_period_start: { type: Date, required: true },
    settlement_period_end: { type: Date, required: true },
    settlement_status: {
        type: String,
        required: true,
        enum: ["pending", "processing", "completed", "failed", "cancelled"],
        default: "pending",
    },

    total_transaction_amount: { type: Number, required: true },
    total_gateway_fees: { type: Number, required: true },
    total_platform_fees: { type: Number, required: true },
    total_taxes: { type: Number, required: true },
    net_settlement_amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR" },

    gateway_provider: {
        type: String,
        required: true,
        enum: ["razorpay", "payu", "cashfree"],
    },
    gateway_settlement_id: { type: String, required: false },
    gateway_settlement_reference: { type: String, required: false },

    school_bank_details: {
        type: Object,
        required: true,
    },

    transaction_summary: {
        type: Object,
        required: true,
    },

    processing_details: {
        type: Object,
        required: true,
    },

    compliance_details: {
        type: Object,
        required: true,
        default: {},
    },

    security_metadata: {
        type: Object,
        required: true,
        default: {},
    },

    notification_status: {
        type: Object,
        required: true,
        default: {
            school_notified: false,
            email_notification_status: "pending",
            sms_notification_status: "pending",
            webhook_notification_status: "pending",
        },
    },

    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

const PaymentGatewayConfigurationSchema = new Schema({
    campus_id: { type: String, required: true },
    gateway_provider: {
        type: String,
        required: true,
        enum: ["razorpay", "payu", "cashfree"],
    },
    gateway_mode: {
        type: String,
        required: true,
        enum: ["test", "live"],
        default: "test",
    },
    status: {
        type: String,
        required: true,
        enum: ["active", "inactive", "suspended", "under_review"],
        default: "inactive",
    },
    is_primary: { type: Boolean, required: true, default: false },

    configuration_details: {
        type: Object,
        required: true,
    },

    gateway_settings: {
        type: Object,
        required: true,
    },

    fee_structure: {
        type: Object,
        required: true,
    },

    security_configuration: {
        type: Object,
        required: true,
    },

    testing_details: {
        type: Object,
        required: true,
        default: {
            last_test_status: "not_tested",
            connectivity_status: "disconnected",
            health_check_status: "unhealthy",
            last_health_check: new Date(),
        },
    },

    compliance_settings: {
        type: Object,
        required: true,
    },

    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

const PaymentAuditLogSchema = new Schema({
    campus_id: { type: String, required: true },
    event_type: {
        type: String,
        required: true,
        enum: [
            "payment_initiated",
            "payment_completed",
            "payment_failed",
            "settlement_initiated",
            "settlement_completed",
            "settlement_failed",
            "gateway_configured",
            "credentials_updated",
            "webhook_received",
            "refund_initiated",
            "refund_completed",
            "security_event",
            "compliance_check",
            "audit_review",
        ],
    },
    event_category: {
        type: String,
        required: true,
        enum: [
            "payment",
            "settlement",
            "security",
            "compliance",
            "configuration",
        ],
    },
    severity: {
        type: String,
        required: true,
        enum: ["low", "medium", "high", "critical"],
    },

    event_details: {
        type: Object,
        required: true,
    },

    security_context: {
        type: Object,
        required: true,
    },

    system_context: {
        type: Object,
        required: true,
    },

    data_changes: {
        type: Object,
        required: false,
    },

    compliance_tags: { type: [String], required: true, default: [] },
    retention_period_days: { type: Number, required: true, default: 2555 }, // 7 years
    is_sensitive_data: { type: Boolean, required: true, default: false },
    data_classification: {
        type: String,
        required: true,
        enum: ["public", "internal", "confidential", "restricted"],
        default: "internal",
    },

    created_at: { type: Date, default: () => new Date() },
});

const PaymentSecurityEventSchema = new Schema({
    campus_id: { type: String, required: true },
    event_type: {
        type: String,
        required: true,
        enum: [
            "suspicious_activity",
            "credential_breach",
            "unauthorized_access",
            "fraud_attempt",
            "data_leak",
            "system_intrusion",
            "compliance_violation",
            "encryption_failure",
            "webhook_tampering",
            "api_abuse",
        ],
    },
    severity: {
        type: String,
        required: true,
        enum: ["low", "medium", "high", "critical"],
    },
    status: {
        type: String,
        required: true,
        enum: ["detected", "investigating", "resolved", "false_positive"],
        default: "detected",
    },

    threat_details: {
        type: Object,
        required: true,
    },

    detection_details: {
        type: Object,
        required: true,
    },

    response_details: {
        type: Object,
        required: false,
    },

    notification_details: {
        type: Object,
        required: true,
        default: {
            internal_team_notified: false,
            school_notified: false,
            regulatory_reported: false,
            escalation_level: 0,
        },
    },

    meta_data: { type: Object, required: true, default: {} },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// ========================= INDEXES =========================

// Payment Settlement Indexes
PaymentSettlementSchema.index.findByCampusId = { by: "campus_id" };
PaymentSettlementSchema.index.findBySettlementDate = { by: "settlement_date" };
PaymentSettlementSchema.index.findByStatus = { by: "settlement_status" };
PaymentSettlementSchema.index.findByGateway = { by: "gateway_provider" };
PaymentSettlementSchema.index.findByBatchId = { by: "settlement_batch_id" };

// Gateway Configuration Indexes
PaymentGatewayConfigurationSchema.index.findByCampusId = { by: "campus_id" };
PaymentGatewayConfigurationSchema.index.findByGateway = {
    by: "gateway_provider",
};
PaymentGatewayConfigurationSchema.index.findByStatus = { by: "status" };
PaymentGatewayConfigurationSchema.index.findByPrimary = { by: "is_primary" };

// Audit Log Indexes
PaymentAuditLogSchema.index.findByCampusId = { by: "campus_id" };
PaymentAuditLogSchema.index.findByEventType = { by: "event_type" };
PaymentAuditLogSchema.index.findByCategory = { by: "event_category" };
PaymentAuditLogSchema.index.findBySeverity = { by: "severity" };
PaymentAuditLogSchema.index.findByDate = { by: "created_at" };

// Security Event Indexes
PaymentSecurityEventSchema.index.findByCampusId = { by: "campus_id" };
PaymentSecurityEventSchema.index.findByEventType = { by: "event_type" };
PaymentSecurityEventSchema.index.findBySeverity = { by: "severity" };
PaymentSecurityEventSchema.index.findByStatus = { by: "status" };
PaymentSecurityEventSchema.index.findByDate = { by: "created_at" };

// ========================= MODELS =========================

const PaymentSettlement = ottoman.model<IPaymentSettlement>(
    "payment_settlements",
    PaymentSettlementSchema
);

const PaymentGatewayConfiguration = ottoman.model<IPaymentGatewayConfiguration>(
    "payment_gateway_configurations",
    PaymentGatewayConfigurationSchema
);

const PaymentAuditLog = ottoman.model<IPaymentAuditLog>(
    "payment_audit_logs",
    PaymentAuditLogSchema
);

const PaymentSecurityEvent = ottoman.model<IPaymentSecurityEvent>(
    "payment_security_events",
    PaymentSecurityEventSchema
);

export {
    type IPaymentAuditLog,
    type IPaymentGatewayConfiguration,
    type IPaymentSecurityEvent,
    type IPaymentSettlement,
    PaymentAuditLog,
    PaymentGatewayConfiguration,
    PaymentSecurityEvent,
    PaymentSettlement,
};
