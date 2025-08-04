import crypto from "node:crypto";

import { Context, Next } from "hono";

import PaymentErrorHandler from "@/services/payment_error_handler.service";
import PaymentSecurityMonitor from "@/services/payment_security_monitor.service";

interface RequestContext {
    request_id: string;
    start_time: number;
    user_id?: string;
    user_type?: string;
    campus_id?: string;
    ip_address?: string;
    user_agent?: string;
    endpoint: string;
    method: string;
}

const getErrorSeverity = (errorCode: string): "low" | "medium" | "high" | "critical" => {
    const prefix = errorCode.split("_")[0];
    
    switch (prefix) {
        case "AUTH": { return "high";
        }
        case "CRED": { return "critical";
        }
        case "RATE": { return "medium";
        }
        case "SYS": { return "high";
        }
        case "GATEWAY": { return "medium";
        }
        case "TRANS": { return "low";
        }
        case "VAL": { return "low";
        }
        case "BIZ": { return "low";
        }
        case "DATA": { return "high";
        }
        default: { return "medium";
        }
    }
};

export const paymentMonitoringMiddleware = () => {
    return async (ctx: Context, next: Next) => {
        const requestContext: RequestContext = {
            request_id: crypto.randomUUID(),
            start_time: Date.now(),
            user_id: ctx.get("user_id"),
            user_type: ctx.get("user_type"),
            campus_id: ctx.get("campus_id"),
            ip_address: ctx.req.header("x-forwarded-for") || ctx.req.header("x-real-ip") || "unknown",
            user_agent: ctx.req.header("user-agent") || "unknown",
            endpoint: ctx.req.path,
            method: ctx.req.method
        };

        // Add request context to the Hono context
        ctx.set("request_context", requestContext);

        // Log the incoming request
        console.info(`[PAYMENT_REQUEST] ${requestContext.method} ${requestContext.endpoint}`, {
            request_id: requestContext.request_id,
            user_id: requestContext.user_id,
            user_type: requestContext.user_type,
            campus_id: requestContext.campus_id,
            ip_address: requestContext.ip_address
        });

        try {
            await next();

            // Log successful request completion
            const executionTime = Date.now() - requestContext.start_time;
            
            PaymentSecurityMonitor.logAuditEvent({
                event_type: `${requestContext.method.toLowerCase()}_${requestContext.endpoint.split("/").pop() || "unknown"}`,
                user_id: requestContext.user_id,
                campus_id: requestContext.campus_id,
                details: {
                    endpoint: requestContext.endpoint,
                    method: requestContext.method,
                    request_id: requestContext.request_id
                },
                ip_address: requestContext.ip_address,
                user_agent: requestContext.user_agent,
                success: true,
                execution_time_ms: executionTime
            });

            console.info(`[PAYMENT_RESPONSE] ${requestContext.method} ${requestContext.endpoint} - SUCCESS`, {
                request_id: requestContext.request_id,
                execution_time_ms: executionTime,
                status: ctx.res.status
            });

        } catch (error) {
            // Enhanced error handling
            const executionTime = Date.now() - requestContext.start_time;
            const { error: paymentError, httpStatus, shouldLog } = PaymentErrorHandler.handleError(error, {
                request_id: requestContext.request_id,
                endpoint: requestContext.endpoint,
                method: requestContext.method,
                user_id: requestContext.user_id,
                campus_id: requestContext.campus_id
            });

            // Log error if needed
            if (shouldLog) {
                PaymentSecurityMonitor.logSecurityEvent({
                    event_type: "suspicious_activity",
                    user_id: requestContext.user_id,
                    user_type: requestContext.user_type,
                    campus_id: requestContext.campus_id,
                    ip_address: requestContext.ip_address,
                    user_agent: requestContext.user_agent,
                    details: {
                        endpoint: requestContext.endpoint,
                        method: requestContext.method,
                        error_code: paymentError.code,
                        request_id: requestContext.request_id
                    },
                    severity: getErrorSeverity(paymentError.code),
                    success: false,
                    error_message: paymentError.message,
                    stack_trace: error instanceof Error ? error.stack : undefined
                });
            }

            // Log audit event
            PaymentSecurityMonitor.logAuditEvent({
                event_type: `${requestContext.method.toLowerCase()}_${requestContext.endpoint.split("/").pop() || "unknown"}`,
                user_id: requestContext.user_id,
                campus_id: requestContext.campus_id,
                details: {
                    endpoint: requestContext.endpoint,
                    method: requestContext.method,
                    request_id: requestContext.request_id
                },
                ip_address: requestContext.ip_address,
                user_agent: requestContext.user_agent,
                success: false,
                error_code: paymentError.code,
                error_message: paymentError.message,
                execution_time_ms: executionTime
            });

            console.error(`[PAYMENT_ERROR] ${requestContext.method} ${requestContext.endpoint}`, {
                request_id: requestContext.request_id,
                error_code: paymentError.code,
                error_message: paymentError.message,
                execution_time_ms: executionTime,
                user_id: requestContext.user_id,
                campus_id: requestContext.campus_id
            });

            // Return standardized error response
            const errorResponse = PaymentErrorHandler.formatErrorResponse(
                paymentError,
                process.env.NODE_ENV === "development" // Include details only in development
            );

            return ctx.json(errorResponse, httpStatus as any);
        }
    };
};

/**
 * Enhanced error handler for payment controllers
 * Provides consistent error handling and monitoring
 */
export const handlePaymentError = (
    error: unknown,
    context: {
        controller: string;
        method: string;
        user_id?: string;
        campus_id?: string;
        request_id?: string;
    }
) => {
    const { error: paymentError, httpStatus } = PaymentErrorHandler.handleError(error, context);
    
    // Log security event for critical errors
    if (["CRED", "AUTH", "SYS"].some(prefix => paymentError.code.startsWith(prefix))) {
        PaymentSecurityMonitor.logSecurityEvent({
            event_type: "suspicious_activity",
            user_id: context.user_id,
            campus_id: context.campus_id,
            details: {
                controller: context.controller,
                method: context.method,
                error_code: paymentError.code,
                request_id: context.request_id
            },
            severity: paymentError.code.startsWith("CRED") ? "critical" : "high",
            success: false,
            error_message: paymentError.message
        });
    }

    return {
        error: PaymentErrorHandler.formatErrorResponse(
            paymentError,
            process.env.NODE_ENV === "development"
        ),
        httpStatus
    };
};

export default paymentMonitoringMiddleware;
