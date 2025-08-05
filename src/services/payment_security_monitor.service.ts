import crypto from "node:crypto";

export interface SecurityEvent {
    event_type:
        | "payment_initiated"
        | "payment_verified"
        | "credential_access"
        | "credential_modified"
        | "gateway_test"
        | "encryption_validation"
        | "authentication_failure"
        | "authorization_failure"
        | "suspicious_activity"
        | "rate_limit_exceeded"
        | "data_breach_attempt"
        | "bank_details_operation";
    timestamp: Date;
    user_id?: string;
    user_type?: string;
    campus_id?: string;
    ip_address?: string;
    user_agent?: string;
    request_id: string;
    details: Record<string, any>;
    severity: "low" | "medium" | "high" | "critical";
    success: boolean;
    error_message?: string;
    stack_trace?: string;
}

export interface PaymentAuditLog {
    log_id: string;
    event_type: string;
    timestamp: Date;
    user_id?: string;
    campus_id?: string;
    transaction_id?: string;
    gateway?: string;
    amount?: number;
    details: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    success: boolean;
    error_code?: string;
    error_message?: string;
    execution_time_ms?: number;
}

export class PaymentSecurityMonitor {
    private static auditLogs: PaymentAuditLog[] = [];
    private static securityEvents: SecurityEvent[] = [];
    private static maxLogSize = 10_000; // Keep last 10k logs in memory

    /**
     * Log payment security event
     */
    static logSecurityEvent(
        event: Omit<SecurityEvent, "timestamp" | "request_id">
    ): void {
        const securityEvent: SecurityEvent = {
            ...event,
            timestamp: new Date(),
            request_id: crypto.randomUUID(),
        };

        this.securityEvents.push(securityEvent);

        // Trim array if too large
        if (this.securityEvents.length > this.maxLogSize) {
            this.securityEvents = this.securityEvents.slice(-this.maxLogSize);
        }

        // Log to console for immediate visibility
        const logLevel = this.getLogLevel(securityEvent.severity);
        console[logLevel](`[PAYMENT_SECURITY] ${securityEvent.event_type}:`, {
            user_id: securityEvent.user_id,
            campus_id: securityEvent.campus_id,
            success: securityEvent.success,
            severity: securityEvent.severity,
            details: securityEvent.details,
            error: securityEvent.error_message,
        });

        // Alert on critical events
        if (securityEvent.severity === "critical") {
            this.triggerSecurityAlert(securityEvent);
        }
    }

    /**
     * Log payment audit event
     */
    static logAuditEvent(
        event: Omit<PaymentAuditLog, "log_id" | "timestamp">
    ): void {
        const auditLog: PaymentAuditLog = {
            ...event,
            log_id: crypto.randomUUID(),
            timestamp: new Date(),
        };

        this.auditLogs.push(auditLog);

        // Trim array if too large
        if (this.auditLogs.length > this.maxLogSize) {
            this.auditLogs = this.auditLogs.slice(-this.maxLogSize);
        }

        console.info(`[PAYMENT_AUDIT] ${auditLog.event_type}:`, {
            user_id: auditLog.user_id,
            campus_id: auditLog.campus_id,
            transaction_id: auditLog.transaction_id,
            gateway: auditLog.gateway,
            amount: auditLog.amount,
            success: auditLog.success,
            execution_time: auditLog.execution_time_ms,
            error: auditLog.error_message,
        });
    }

    /**
     * Get recent security events
     */
    static getSecurityEvents(
        limit: number = 100,
        severity?: SecurityEvent["severity"]
    ): SecurityEvent[] {
        let events = this.securityEvents;

        if (severity) {
            events = events.filter((event) => event.severity === severity);
        }

        return events
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get recent audit logs
     */
    static getAuditLogs(
        campus_id?: string,
        limit: number = 100
    ): PaymentAuditLog[] {
        let logs = this.auditLogs;

        if (campus_id) {
            logs = logs.filter((log) => log.campus_id === campus_id);
        }

        return logs
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get security metrics for a specific campus
     */
    static getSecurityMetrics(campus_id?: string): {
        total_events: number;
        critical_events: number;
        failed_authentications: number;
        successful_payments: number;
        failed_payments: number;
        last_24h_events: number;
        campus_specific?: boolean;
    } {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        let events = this.securityEvents;
        let logs = this.auditLogs;

        if (campus_id) {
            events = events.filter((e) => e.campus_id === campus_id);
            logs = logs.filter((l) => l.campus_id === campus_id);
        }

        return {
            total_events: events.length,
            critical_events: events.filter((e) => e.severity === "critical")
                .length,
            failed_authentications: events.filter(
                (e) =>
                    e.event_type === "authentication_failure" ||
                    e.event_type === "authorization_failure"
            ).length,
            successful_payments: logs.filter(
                (l) => l.event_type === "payment_verified" && l.success
            ).length,
            failed_payments: logs.filter(
                (l) => l.event_type === "payment_verified" && !l.success
            ).length,
            last_24h_events: events.filter((e) => e.timestamp > last24h).length,
            campus_specific: !!campus_id,
        };
    }

    /**
     * Get recent security events for a specific campus
     */
    static getRecentSecurityEvents(
        campus_id?: string,
        limit: number = 100
    ): SecurityEvent[] {
        let events = this.securityEvents;

        if (campus_id) {
            events = events.filter((event) => event.campus_id === campus_id);
        }

        return events
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get security event by ID
     */
    static getSecurityEventById(request_id: string): SecurityEvent | null {
        return (
            this.securityEvents.find(
                (event) => event.request_id === request_id
            ) || null
        );
    }

    /**
     * Clear old logs (for maintenance)
     */
    static clearOldLogs(olderThanDays: number = 30): void {
        const cutoffDate = new Date(
            Date.now() - olderThanDays * 24 * 60 * 60 * 1000
        );

        this.securityEvents = this.securityEvents.filter(
            (event) => event.timestamp > cutoffDate
        );

        this.auditLogs = this.auditLogs.filter(
            (log) => log.timestamp > cutoffDate
        );

        console.info(
            `[PAYMENT_MONITOR] Cleared logs older than ${olderThanDays} days`
        );
    }

    private static getLogLevel(
        severity: SecurityEvent["severity"]
    ): "info" | "warn" | "error" {
        switch (severity) {
            case "low": {
                return "info";
            }
            case "medium": {
                return "info";
            }
            case "high": {
                return "warn";
            }
            case "critical": {
                return "error";
            }
            default: {
                return "info";
            }
        }
    }

    private static triggerSecurityAlert(event: SecurityEvent): void {
        // In production, this would integrate with alerting systems
        console.error("🚨 CRITICAL SECURITY EVENT DETECTED 🚨", {
            event_type: event.event_type,
            user_id: event.user_id,
            campus_id: event.campus_id,
            timestamp: event.timestamp,
            details: event.details,
            error: event.error_message,
        });

        // TODO: Integrate with:
        // - Email/SMS alerts
        // - Slack/Teams notifications
        // - External monitoring services
        // - Incident management systems
    }
}

export default PaymentSecurityMonitor;
