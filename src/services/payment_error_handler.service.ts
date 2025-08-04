export interface PaymentError {
    code: string;
    message: string;
    details?: Record<string, any>;
    user_friendly_message?: string;
    recovery_suggestions?: string[];
}

export class PaymentErrorHandler {
    private static errorCodes = {
        // Authentication & Authorization Errors
        "AUTH_001": "Invalid or expired authentication token",
        "AUTH_002": "Insufficient permissions for this operation",
        "AUTH_003": "User account is disabled or suspended",
        "AUTH_004": "Session has expired, please login again",
        
        // Payment Gateway Errors
        "GATEWAY_001": "Payment gateway configuration is missing or invalid",
        "GATEWAY_002": "Payment gateway is temporarily unavailable",
        "GATEWAY_003": "Payment gateway credentials are invalid or expired",
        "GATEWAY_004": "Payment amount exceeds gateway limits",
        "GATEWAY_005": "Payment gateway signature verification failed",
        "GATEWAY_006": "Unsupported payment method for selected gateway",
        
        // Transaction Errors
        "TRANS_001": "Transaction not found or invalid transaction ID",
        "TRANS_002": "Transaction has already been processed",
        "TRANS_003": "Transaction amount mismatch",
        "TRANS_004": "Transaction has expired",
        "TRANS_005": "Insufficient balance or payment failed",
        "TRANS_006": "Transaction was cancelled by user",
        "TRANS_007": "Transaction declined by bank or payment provider",
        
        // Credential & Security Errors
        "CRED_001": "Encryption key is missing or invalid",
        "CRED_002": "Failed to encrypt or decrypt payment credentials",
        "CRED_003": "Payment credentials format is invalid",
        "CRED_004": "Credential rotation failed",
        "CRED_005": "Legacy credentials migration required",
        
        // Validation Errors
        "VAL_001": "Required fields are missing from request",
        "VAL_002": "Invalid data format or type",
        "VAL_003": "Amount must be greater than zero",
        "VAL_004": "Invalid email address format",
        "VAL_005": "Invalid phone number format",
        "VAL_006": "Invalid date or date range",
        
        // Business Logic Errors
        "BIZ_001": "Fee has already been paid",
        "BIZ_002": "Student is not enrolled in the specified class",
        "BIZ_003": "Payment deadline has passed",
        "BIZ_004": "Discount or scholarship not applicable",
        "BIZ_005": "Campus bank details are not configured",
        "BIZ_006": "Fee category is not active or available",
        
        // System Errors
        "SYS_001": "Database connection failed",
        "SYS_002": "External service is unavailable",
        "SYS_003": "Internal server error occurred",
        "SYS_004": "Service timeout exceeded",
        "SYS_005": "Memory or resource limit exceeded",
        
        // Rate Limiting & Abuse
        "RATE_001": "Too many requests, please try again later",
        "RATE_002": "Maximum transaction attempts exceeded",
        "RATE_003": "Suspicious activity detected, account temporarily locked",
        
        // Data Integrity Errors
        "DATA_001": "Data corruption detected",
        "DATA_002": "Concurrent modification conflict",
        "DATA_003": "Referenced entity not found",
        "DATA_004": "Data validation failed"
    } as const;

    /**
     * Create standardized payment error
     */
    static createError(
        code: keyof typeof PaymentErrorHandler.errorCodes,
        details?: Record<string, any>,
        userFriendlyMessage?: string,
        recoverySuggestions?: string[]
    ): PaymentError {
        return {
            code,
            message: this.errorCodes[code],
            details,
            user_friendly_message: userFriendlyMessage || this.getUserFriendlyMessage(code),
            recovery_suggestions: recoverySuggestions || this.getRecoverySuggestions(code)
        };
    }

    /**
     * Handle and format payment errors for API responses
     */
    static handleError(error: unknown, context?: Record<string, any>): {
        error: PaymentError;
        httpStatus: number;
        shouldLog: boolean;
    } {
        // Handle known PaymentError instances
        if (this.isPaymentError(error)) {
            return {
                error: error as PaymentError,
                httpStatus: this.getHttpStatusFromErrorCode((error as PaymentError).code),
                shouldLog: this.shouldLogError((error as PaymentError).code)
            };
        }

        // Handle standard JavaScript errors
        if (error instanceof Error) {
            const paymentError = this.categorizeStandardError(error, context);
            return {
                error: paymentError,
                httpStatus: this.getHttpStatusFromErrorCode(paymentError.code),
                shouldLog: true
            };
        }

        // Handle unknown error types
        const unknownError = this.createError("SYS_003", {
            original_error: String(error),
            context
        });

        return {
            error: unknownError,
            httpStatus: 500,
            shouldLog: true
        };
    }

    /**
     * Format error for API response
     */
    static formatErrorResponse(paymentError: PaymentError, includeDetails: boolean = false): {
        success: false;
        error: {
            code: string;
            message: string;
            user_message?: string;
            suggestions?: string[];
            details?: Record<string, any>;
        };
    } {
        const response: any = {
            success: false,
            error: {
                code: paymentError.code,
                message: paymentError.message
            }
        };

        if (paymentError.user_friendly_message) {
            response.error.user_message = paymentError.user_friendly_message;
        }

        if (paymentError.recovery_suggestions?.length) {
            response.error.suggestions = paymentError.recovery_suggestions;
        }

        if (includeDetails && paymentError.details) {
            response.error.details = paymentError.details;
        }

        return response;
    }

    private static isPaymentError(error: unknown): boolean {
        return typeof error === "object" && error !== null && "code" in error && "message" in error;
    }

    private static categorizeStandardError(error: Error, context?: Record<string, any>): PaymentError {
        const message = error.message.toLowerCase();

        // Database errors
        if (message.includes("connection") || message.includes("database") || message.includes("timeout")) {
            return this.createError("SYS_001", { original_message: error.message, context });
        }

        // Validation errors
        if (message.includes("validation") || message.includes("invalid") || message.includes("required")) {
            return this.createError("VAL_002", { original_message: error.message, context });
        }

        // Authentication errors
        if (message.includes("unauthorized") || message.includes("token") || message.includes("auth")) {
            return this.createError("AUTH_001", { original_message: error.message, context });
        }

        // Payment gateway errors
        if (message.includes("gateway") || message.includes("payment") || message.includes("signature")) {
            return this.createError("GATEWAY_002", { original_message: error.message, context });
        }

        // Generic system error
        return this.createError("SYS_003", { original_message: error.message, context });
    }

    private static getHttpStatusFromErrorCode(code: string): number {
        const prefix = code.split("_")[0];
        
        switch (prefix) {
            case "AUTH": { return 401;
            }
            case "VAL": { return 400;
            }
            case "BIZ": { return 422;
            }
            case "RATE": { return 429;
            }
            case "DATA": { return 409;
            }
            case "TRANS": { return 400;
            }
            case "CRED": { return 500;
            }
            case "GATEWAY": { return 502;
            }
            case "SYS": { return 500;
            }
            default: { return 500;
            }
        }
    }

    private static shouldLogError(code: string): boolean {
        const prefix = code.split("_")[0];
        return !["VAL", "BIZ"].includes(prefix); // Don't log validation and business logic errors
    }

    private static getUserFriendlyMessage(code: keyof typeof PaymentErrorHandler.errorCodes): string {
        const friendlyMessages: Record<string, string> = {
            "AUTH_001": "Please log in again to continue",
            "AUTH_002": "You don't have permission to perform this action",
            "GATEWAY_001": "Payment gateway is not configured properly",
            "GATEWAY_002": "Payment service is temporarily unavailable",
            "TRANS_001": "The payment transaction could not be found",
            "TRANS_005": "Payment was declined by your bank",
            "VAL_003": "Please enter a valid amount greater than zero",
            "BIZ_001": "This fee has already been paid",
            "BIZ_005": "Payment system is being set up for your school",
            "RATE_001": "Too many attempts, please wait a moment and try again",
            "SYS_003": "Something went wrong, please try again later"
        };

        return friendlyMessages[code] || "An error occurred, please contact support if the problem persists";
    }

    private static getRecoverySuggestions(code: keyof typeof PaymentErrorHandler.errorCodes): string[] {
        const suggestions: Record<string, string[]> = {
            "AUTH_001": ["Log out and log back in", "Clear browser cache and cookies", "Contact support if issue persists"],
            "AUTH_002": ["Contact your administrator for access", "Verify you have the correct role assigned"],
            "GATEWAY_002": ["Try again in a few minutes", "Use a different payment method", "Contact support"],
            "TRANS_005": ["Check your bank balance", "Try a different payment method", "Contact your bank"],
            "VAL_003": ["Enter an amount greater than ₹1", "Check for decimal places or special characters"],
            "BIZ_001": ["Check your payment history", "Contact the fee office if payment is missing"],
            "RATE_001": ["Wait 5-10 minutes before trying again", "Clear browser cache"],
            "SYS_003": ["Refresh the page and try again", "Check your internet connection", "Contact support"]
        };

        return suggestions[code] || ["Try again later", "Contact support if the problem continues"];
    }
}

export default PaymentErrorHandler;
