# Payment System Implementation Guide

## Overview

This document provides detailed technical specifications and implementation guidelines for the SaaS School Payment System. It complements the main design document with specific code examples, API specifications, and development standards.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Database Models Implementation](#database-models-implementation)
3. [API Endpoints Specification](#api-endpoints-specification)
4. [Payment Gateway Integration Details](#payment-gateway-integration-details)
5. [Security Implementation](#security-implementation)
6. [Error Handling & Logging](#error-handling--logging)
7. [Testing Guidelines](#testing-guidelines)
8. [Deployment Checklist](#deployment-checklist)

## Development Environment Setup

### Prerequisites
- Node.js 18+ with TypeScript
- Docker and Docker Compose
- Couchbase Server 7.0+
- Redis for caching
- Git for version control

### Environment Variables
```bash
# Database
COUCHBASE_CONNECTION_STRING=couchbase://localhost
COUCHBASE_USERNAME=Administrator
COUCHBASE_PASSWORD=password
COUCHBASE_BUCKET=kcs_payment

# Payment Gateways
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
PAYU_MERCHANT_KEY=...
PAYU_MERCHANT_SALT=...

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-char-encryption-key
WEBHOOK_SECRET=your-webhook-secret

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Project Structure
```
src/
├── models/
│   ├── school_payment_config.model.ts
│   ├── fee_structure.model.ts
│   ├── payment_transaction.model.ts
│   └── payment_gateway_config.model.ts
├── services/
│   ├── payment_config.service.ts
│   ├── fee_management.service.ts
│   ├── payment_processing.service.ts
│   └── gateway/
│       ├── base_gateway.ts
│       ├── razorpay.gateway.ts
│       ├── stripe.gateway.ts
│       └── payu.gateway.ts
├── controllers/
│   ├── payment_config.controller.ts
│   ├── fee_management.controller.ts
│   └── payment_processing.controller.ts
├── routes/
│   ├── payment_config.route.ts
│   ├── fee_management.route.ts
│   └── payment_processing.route.ts
├── schema/
│   ├── payment_config.schema.ts
│   ├── fee_management.schema.ts
│   └── payment_processing.schema.ts
├── middlewares/
│   ├── payment_auth.middleware.ts
│   ├── rate_limit.middleware.ts
│   └── validation.middleware.ts
└── utils/
    ├── encryption.util.ts
    ├── payment_calculator.util.ts
    └── webhook_validator.util.ts
```

## Database Models Implementation

### 1. School Payment Configuration Model

```typescript
// src/models/school_payment_config.model.ts
import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

interface IBankDetails {
    account_holder_name: string;
    account_number: string;
    bank_name: string;
    branch_name: string;
    ifsc_code: string;
    account_type: "savings" | "current";
    swift_code?: string;
}

interface IPaymentGatewaySetup {
    gateway_name: "razorpay" | "stripe" | "payu";
    is_enabled: boolean;
    priority: number; // 1 = highest priority
    config: Record<string, any>; // Encrypted gateway credentials
    transaction_fees: {
        percentage: number;
        fixed_amount: number;
    };
}

interface ISchoolPaymentConfig {
    id: string;
    campus_id: string;
    bank_details: IBankDetails;
    payment_gateways: IPaymentGatewaySetup[];
    saas_charges: {
        is_enabled: boolean; // Always false
        percentage: number;  // Always 0
        fixed_amount: number; // Always 0
    };
    supported_payment_methods: string[];
    settlement_config: {
        auto_settlement: boolean;
        settlement_frequency: "daily" | "weekly" | "monthly";
    };
    notification_settings: {
        payment_success_email: boolean;
        payment_failure_email: boolean;
        daily_summary_email: boolean;
        webhook_url?: string;
    };
    business_settings: {
        currency: string;
        timezone: string;
        business_hours: {
            start: string;
            end: string;
        };
    };
    compliance_settings: {
        enable_gst: boolean;
        gst_number?: string;
        terms_and_conditions_url?: string;
        privacy_policy_url?: string;
    };
    meta_data: Record<string, any>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

const SchoolPaymentConfigSchema = new Schema({
    campus_id: { type: String, required: true },
    bank_details: {
        account_holder_name: { type: String, required: true },
        account_number: { type: String, required: true },
        bank_name: { type: String, required: true },
        branch_name: { type: String, required: true },
        ifsc_code: { type: String, required: true },
        account_type: { type: String, required: true },
        swift_code: { type: String, required: false },
    },
    payment_gateways: [{
        gateway_name: { type: String, required: true },
        is_enabled: { type: Boolean, required: true },
        priority: { type: Number, required: true },
        config: { type: Object, required: true },
        transaction_fees: {
            percentage: { type: Number, required: true },
            fixed_amount: { type: Number, required: true },
        },
    }],
    saas_charges: {
        is_enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0 },
        fixed_amount: { type: Number, default: 0 },
    },
    supported_payment_methods: [{ type: String }],
    settlement_config: {
        auto_settlement: { type: Boolean, default: true },
        settlement_frequency: { type: String, default: "daily" },
    },
    notification_settings: {
        payment_success_email: { type: Boolean, default: true },
        payment_failure_email: { type: Boolean, default: true },
        daily_summary_email: { type: Boolean, default: false },
        webhook_url: { type: String, required: false },
    },
    business_settings: {
        currency: { type: String, default: "INR" },
        timezone: { type: String, default: "Asia/Kolkata" },
        business_hours: {
            start: { type: String, default: "09:00" },
            end: { type: String, default: "17:00" },
        },
    },
    compliance_settings: {
        enable_gst: { type: Boolean, default: false },
        gst_number: { type: String, required: false },
        terms_and_conditions_url: { type: String, required: false },
        privacy_policy_url: { type: String, required: false },
    },
    meta_data: { type: Object, default: {} },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for efficient querying
SchoolPaymentConfigSchema.index.findByCampusId = { by: "campus_id" };
SchoolPaymentConfigSchema.index.findByActiveStatus = { by: "is_active" };

const SchoolPaymentConfig = ottoman.model<ISchoolPaymentConfig>(
    "school_payment_config",
    SchoolPaymentConfigSchema
);

export { SchoolPaymentConfig, type ISchoolPaymentConfig, type IBankDetails, type IPaymentGatewaySetup };
```

### 2. Fee Structure Model

```typescript
// src/models/fee_structure.model.ts
import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

interface IFeeCategory {
    category_id: string;
    category_name: string;
    amount: number;
    is_mandatory: boolean;
    due_date: Date;
    late_fee_config: {
        enabled: boolean;
        amount: number;
        grace_period_days: number;
    };
    description?: string;
    is_refundable: boolean;
}

interface IPaymentSchedule {
    installment_number: number;
    due_date: Date;
    amount: number;
    categories_included: string[];
    description?: string;
}

interface IDiscount {
    discount_id: string;
    discount_name: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    applicable_categories: string[];
    eligibility_criteria: {
        min_amount?: number;
        student_type?: string[];
        early_payment_days?: number;
        sibling_discount?: boolean;
    };
    valid_from: Date;
    valid_to: Date;
    max_usage?: number;
    current_usage: number;
}

interface IFeeStructure {
    id: string;
    campus_id: string;
    academic_year: string;
    class_id?: string;
    structure_name: string;
    fee_categories: IFeeCategory[];
    payment_schedule: IPaymentSchedule[];
    discounts: IDiscount[];
    total_amount: number;
    minimum_payment_amount: number;
    partial_payment_allowed: boolean;
    auto_late_fee: boolean;
    grace_period_days: number;
    is_active: boolean;
    effective_from: Date;
    effective_to: Date;
    created_at: Date;
    updated_at: Date;
}

const FeeStructureSchema = new Schema({
    campus_id: { type: String, required: true },
    academic_year: { type: String, required: true },
    class_id: { type: String, required: false },
    structure_name: { type: String, required: true },
    fee_categories: [{
        category_id: { type: String, required: true },
        category_name: { type: String, required: true },
        amount: { type: Number, required: true },
        is_mandatory: { type: Boolean, default: true },
        due_date: { type: Date, required: true },
        late_fee_config: {
            enabled: { type: Boolean, default: false },
            amount: { type: Number, default: 0 },
            grace_period_days: { type: Number, default: 0 },
        },
        description: { type: String, required: false },
        is_refundable: { type: Boolean, default: false },
    }],
    payment_schedule: [{
        installment_number: { type: Number, required: true },
        due_date: { type: Date, required: true },
        amount: { type: Number, required: true },
        categories_included: [{ type: String }],
        description: { type: String, required: false },
    }],
    discounts: [{
        discount_id: { type: String, required: true },
        discount_name: { type: String, required: true },
        discount_type: { type: String, required: true },
        discount_value: { type: Number, required: true },
        applicable_categories: [{ type: String }],
        eligibility_criteria: { type: Object, default: {} },
        valid_from: { type: Date, required: true },
        valid_to: { type: Date, required: true },
        max_usage: { type: Number, required: false },
        current_usage: { type: Number, default: 0 },
    }],
    total_amount: { type: Number, required: true },
    minimum_payment_amount: { type: Number, default: 0 },
    partial_payment_allowed: { type: Boolean, default: true },
    auto_late_fee: { type: Boolean, default: false },
    grace_period_days: { type: Number, default: 7 },
    is_active: { type: Boolean, default: true },
    effective_from: { type: Date, required: true },
    effective_to: { type: Date, required: true },
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes
FeeStructureSchema.index.findByCampusId = { by: "campus_id" };
FeeStructureSchema.index.findByAcademicYear = { by: "academic_year" };
FeeStructureSchema.index.findByClassId = { by: "class_id" };

const FeeStructure = ottoman.model<IFeeStructure>("fee_structure", FeeStructureSchema);

export { FeeStructure, type IFeeStructure, type IFeeCategory, type IPaymentSchedule, type IDiscount };
```

### 3. Payment Transaction Model

```typescript
// src/models/payment_transaction.model.ts
import { Schema } from "ottoman";
import { ottoman } from "../libs/db";

interface IAmountDetails {
    total_amount: number;
    fee_amount: number;
    gateway_charges: number;
    taxes: number;
    discount_applied: number;
    late_fee: number;
}

interface ISettlementDetails {
    settlement_id?: string;
    settlement_date?: Date;
    settlement_amount?: number;
    settlement_status?: "pending" | "settled" | "failed";
    settlement_reference?: string;
}

interface IRefundDetails {
    refund_id: string;
    refund_amount: number;
    refund_date: Date;
    refund_reason: string;
    refund_status: "initiated" | "processed" | "failed";
    gateway_refund_id?: string;
}

interface IPaymentTransaction {
    id: string;
    campus_id: string;
    student_id: string;
    fee_structure_id: string;
    transaction_reference: string; // Our unique transaction ID
    gateway_transaction_id?: string; // Gateway's transaction ID
    gateway_order_id?: string; // For gateways that use order concept
    gateway_name: string;
    payment_method: string;
    amount_details: IAmountDetails;
    currency: string;
    status: "initiated" | "processing" | "success" | "failed" | "refunded" | "partially_refunded" | "expired";
    payment_date?: Date;
    settlement_details?: ISettlementDetails;
    gateway_response: Record<string, any>; // Raw gateway response
    failure_reason?: string;
    failure_code?: string;
    refund_details?: IRefundDetails[];
    customer_details: {
        name: string;
        email: string;
        phone: string;
        address?: string;
    };
    device_info: {
        ip_address: string;
        user_agent: string;
        device_fingerprint?: string;
    };
    risk_score?: number;
    notes?: string;
    metadata: Record<string, any>;
    webhook_attempts: {
        attempt_number: number;
        attempted_at: Date;
        status: "success" | "failed";
        response_code?: number;
        error_message?: string;
    }[];
    created_at: Date;
    updated_at: Date;
}

const PaymentTransactionSchema = new Schema({
    campus_id: { type: String, required: true },
    student_id: { type: String, required: true },
    fee_structure_id: { type: String, required: true },
    transaction_reference: { type: String, required: true },
    gateway_transaction_id: { type: String, required: false },
    gateway_order_id: { type: String, required: false },
    gateway_name: { type: String, required: true },
    payment_method: { type: String, required: true },
    amount_details: {
        total_amount: { type: Number, required: true },
        fee_amount: { type: Number, required: true },
        gateway_charges: { type: Number, default: 0 },
        taxes: { type: Number, default: 0 },
        discount_applied: { type: Number, default: 0 },
        late_fee: { type: Number, default: 0 },
    },
    currency: { type: String, default: "INR" },
    status: { type: String, required: true },
    payment_date: { type: Date, required: false },
    settlement_details: {
        settlement_id: { type: String, required: false },
        settlement_date: { type: Date, required: false },
        settlement_amount: { type: Number, required: false },
        settlement_status: { type: String, required: false },
        settlement_reference: { type: String, required: false },
    },
    gateway_response: { type: Object, default: {} },
    failure_reason: { type: String, required: false },
    failure_code: { type: String, required: false },
    refund_details: [{
        refund_id: { type: String, required: true },
        refund_amount: { type: Number, required: true },
        refund_date: { type: Date, required: true },
        refund_reason: { type: String, required: true },
        refund_status: { type: String, required: true },
        gateway_refund_id: { type: String, required: false },
    }],
    customer_details: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: false },
    },
    device_info: {
        ip_address: { type: String, required: true },
        user_agent: { type: String, required: true },
        device_fingerprint: { type: String, required: false },
    },
    risk_score: { type: Number, required: false },
    notes: { type: String, required: false },
    metadata: { type: Object, default: {} },
    webhook_attempts: [{
        attempt_number: { type: Number, required: true },
        attempted_at: { type: Date, required: true },
        status: { type: String, required: true },
        response_code: { type: Number, required: false },
        error_message: { type: String, required: false },
    }],
    created_at: { type: Date, default: () => new Date() },
    updated_at: { type: Date, default: () => new Date() },
});

// Indexes for efficient querying
PaymentTransactionSchema.index.findByCampusId = { by: "campus_id" };
PaymentTransactionSchema.index.findByStudentId = { by: "student_id" };
PaymentTransactionSchema.index.findByStatus = { by: "status" };
PaymentTransactionSchema.index.findByGateway = { by: "gateway_name" };
PaymentTransactionSchema.index.findByTransactionRef = { by: "transaction_reference" };
PaymentTransactionSchema.index.findByGatewayTransactionId = { by: "gateway_transaction_id" };
PaymentTransactionSchema.index.findByPaymentDate = { by: "payment_date" };

const PaymentTransaction = ottoman.model<IPaymentTransaction>(
    "payment_transaction",
    PaymentTransactionSchema
);

export { 
    PaymentTransaction, 
    type IPaymentTransaction, 
    type IAmountDetails, 
    type ISettlementDetails, 
    type IRefundDetails 
};
```

## API Endpoints Specification

### Payment Configuration APIs

```typescript
// src/routes/payment_config.route.ts
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { PaymentConfigController } from "@/controllers/payment_config.controller";
import { 
    createPaymentConfigSchema,
    updatePaymentConfigSchema,
    paymentConfigResponseSchema 
} from "@/schema/payment_config.schema";

const app = new Hono();

// Create payment configuration
app.post(
    "/",
    describeRoute({
        operationId: "createPaymentConfig",
        summary: "Create school payment configuration",
        description: "Sets up payment gateways and bank details for a school",
        tags: ["Payment Configuration"],
        responses: {
            201: {
                description: "Payment configuration created successfully",
                content: {
                    "application/json": {
                        schema: resolver(paymentConfigResponseSchema),
                    },
                },
            },
            400: {
                description: "Invalid request data",
            },
            409: {
                description: "Configuration already exists for this campus",
            },
        },
    }),
    zValidator("json", createPaymentConfigSchema),
    PaymentConfigController.createConfig
);

// Get payment configuration
app.get(
    "/:campus_id",
    describeRoute({
        operationId: "getPaymentConfig",
        summary: "Get school payment configuration",
        description: "Retrieves payment setup for a specific school",
        tags: ["Payment Configuration"],
        parameters: [
            {
                name: "campus_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Campus ID",
            },
        ],
        responses: {
            200: {
                description: "Payment configuration retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(paymentConfigResponseSchema),
                    },
                },
            },
            404: {
                description: "Configuration not found",
            },
        },
    }),
    PaymentConfigController.getConfig
);

// Update payment configuration
app.put(
    "/:campus_id",
    describeRoute({
        operationId: "updatePaymentConfig",
        summary: "Update school payment configuration", 
        description: "Updates payment gateways and settings for a school",
        tags: ["Payment Configuration"],
        parameters: [
            {
                name: "campus_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Campus ID",
            },
        ],
        responses: {
            200: {
                description: "Payment configuration updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(paymentConfigResponseSchema),
                    },
                },
            },
            404: {
                description: "Configuration not found",
            },
        },
    }),
    zValidator("json", updatePaymentConfigSchema),
    PaymentConfigController.updateConfig
);

// Test gateway connection
app.post(
    "/:campus_id/test-gateway",
    describeRoute({
        operationId: "testGatewayConnection",
        summary: "Test payment gateway connection",
        description: "Validates gateway credentials and connectivity",
        tags: ["Payment Configuration"],
        parameters: [
            {
                name: "campus_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Campus ID",
            },
        ],
        responses: {
            200: {
                description: "Gateway connection test results",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                gateway_name: { type: "string" },
                                status: { type: "string" },
                                response_time: { type: "number" },
                                error_message: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    PaymentConfigController.testGateway
);

export default app;
```

### Payment Processing APIs

```typescript
// src/routes/payment_processing.route.ts
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import { PaymentProcessingController } from "@/controllers/payment_processing.controller";
import {
    initiatePaymentSchema,
    verifyPaymentSchema,
    paymentResponseSchema
} from "@/schema/payment_processing.schema";

const app = new Hono();

// Get student fee details
app.get(
    "/student/:student_id/fees",
    describeRoute({
        operationId: "getStudentFees",
        summary: "Get student fee information",
        description: "Retrieves fee structure and payment status for a student",
        tags: ["Payment Processing"],
        parameters: [
            {
                name: "student_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Student ID",
            },
        ],
        responses: {
            200: {
                description: "Student fee information",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                student_info: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        name: { type: "string" },
                                        class: { type: "string" },
                                        academic_year: { type: "string" },
                                    },
                                },
                                fee_summary: {
                                    type: "object",
                                    properties: {
                                        total_amount: { type: "number" },
                                        paid_amount: { type: "number" },
                                        due_amount: { type: "number" },
                                        overdue_amount: { type: "number" },
                                    },
                                },
                                fee_breakdown: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            category_name: { type: "string" },
                                            amount: { type: "number" },
                                            due_date: { type: "string" },
                                            is_paid: { type: "boolean" },
                                            is_overdue: { type: "boolean" },
                                            late_fee: { type: "number" },
                                        },
                                    },
                                },
                                payment_history: { type: "array" },
                                available_payment_methods: {
                                    type: "array",
                                    items: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
            404: {
                description: "Student not found",
            },
        },
    }),
    PaymentProcessingController.getStudentFees
);

// Initiate payment
app.post(
    "/initiate",
    describeRoute({
        operationId: "initiatePayment",
        summary: "Initiate payment process",
        description: "Creates payment session and returns gateway URL",
        tags: ["Payment Processing"],
        responses: {
            200: {
                description: "Payment initiated successfully",
                content: {
                    "application/json": {
                        schema: resolver(paymentResponseSchema),
                    },
                },
            },
            400: {
                description: "Invalid payment request",
            },
        },
    }),
    zValidator("json", initiatePaymentSchema),
    PaymentProcessingController.initiatePayment
);

// Verify payment
app.post(
    "/verify",
    describeRoute({
        operationId: "verifyPayment",
        summary: "Verify payment status",
        description: "Verifies payment with gateway and updates status",
        tags: ["Payment Processing"],
        responses: {
            200: {
                description: "Payment verification result",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                status: { type: "string" },
                                transaction: { type: "object" },
                                receipt_url: { type: "string" },
                            },
                        },
                    },
                },
            },
        },
    }),
    zValidator("json", verifyPaymentSchema),
    PaymentProcessingController.verifyPayment
);

// Handle gateway webhooks
app.post(
    "/webhook/:gateway_name",
    describeRoute({
        operationId: "handleWebhook",
        summary: "Handle payment gateway webhooks",
        description: "Processes webhook notifications from payment gateways",
        tags: ["Payment Processing"],
        parameters: [
            {
                name: "gateway_name",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Payment gateway name",
            },
        ],
        responses: {
            200: {
                description: "Webhook processed successfully",
            },
            400: {
                description: "Invalid webhook data",
            },
        },
    }),
    PaymentProcessingController.handleWebhook
);

// Get payment status
app.get(
    "/status/:transaction_id",
    describeRoute({
        operationId: "getPaymentStatus",
        summary: "Get payment transaction status",
        description: "Retrieves current status of a payment transaction",
        tags: ["Payment Processing"],
        parameters: [
            {
                name: "transaction_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Transaction ID",
            },
        ],
        responses: {
            200: {
                description: "Payment status retrieved",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                transaction_id: { type: "string" },
                                status: { type: "string" },
                                amount: { type: "number" },
                                gateway_name: { type: "string" },
                                payment_date: { type: "string" },
                                failure_reason: { type: "string" },
                            },
                        },
                    },
                },
            },
            404: {
                description: "Transaction not found",
            },
        },
    }),
    PaymentProcessingController.getPaymentStatus
);

export default app;
```

## Payment Gateway Integration Details

### Base Gateway Class

```typescript
// src/services/gateway/base_gateway.ts
export interface IPaymentRequest {
    amount: number;
    currency: string;
    customer: {
        name: string;
        email: string;
        phone: string;
    };
    order_id: string;
    description: string;
    return_url: string;
    cancel_url: string;
    webhook_url: string;
    metadata?: Record<string, any>;
}

export interface IPaymentResponse {
    gateway_order_id: string;
    payment_url: string;
    status: "created" | "failed";
    expires_at: Date;
    gateway_response: Record<string, any>;
}

export interface IVerificationRequest {
    gateway_payment_id: string;
    gateway_order_id: string;
    gateway_signature: string;
    amount: number;
}

export interface IVerificationResponse {
    is_valid: boolean;
    status: "success" | "failed" | "pending";
    gateway_transaction_id: string;
    amount: number;
    payment_date: Date;
    gateway_response: Record<string, any>;
}

export abstract class BasePaymentGateway {
    protected config: Record<string, any>;
    protected isProduction: boolean;

    constructor(config: Record<string, any>, isProduction: boolean = false) {
        this.config = config;
        this.isProduction = isProduction;
    }

    abstract getName(): string;
    abstract createPayment(request: IPaymentRequest): Promise<IPaymentResponse>;
    abstract verifyPayment(request: IVerificationRequest): Promise<IVerificationResponse>;
    abstract getPaymentStatus(gatewayOrderId: string): Promise<IVerificationResponse>;
    abstract processWebhook(payload: any, signature: string): Promise<{
        event_type: string;
        transaction_id: string;
        status: string;
        data: Record<string, any>;
    }>;
    abstract calculateFees(amount: number): { percentage: number; fixed: number; total: number };

    // Common utility methods
    protected validateConfig(): void {
        const requiredFields = this.getRequiredConfigFields();
        for (const field of requiredFields) {
            if (!this.config[field]) {
                throw new Error(`Missing required configuration: ${field}`);
            }
        }
    }

    protected abstract getRequiredConfigFields(): string[];

    protected getBaseUrl(): string {
        return this.isProduction ? this.getProductionUrl() : this.getSandboxUrl();
    }

    protected abstract getProductionUrl(): string;
    protected abstract getSandboxUrl(): string;
}
```

### Razorpay Integration

```typescript
// src/services/gateway/razorpay.gateway.ts
import Razorpay from "razorpay";
import crypto from "crypto";
import { BasePaymentGateway, IPaymentRequest, IPaymentResponse, IVerificationRequest, IVerificationResponse } from "./base_gateway";

export class RazorpayGateway extends BasePaymentGateway {
    private razorpay: Razorpay;

    constructor(config: Record<string, any>, isProduction: boolean = false) {
        super(config, isProduction);
        this.validateConfig();
        
        this.razorpay = new Razorpay({
            key_id: this.config.key_id,
            key_secret: this.config.key_secret,
        });
    }

    getName(): string {
        return "razorpay";
    }

    async createPayment(request: IPaymentRequest): Promise<IPaymentResponse> {
        try {
            const options = {
                amount: Math.round(request.amount * 100), // Convert to paise
                currency: request.currency,
                receipt: request.order_id,
                notes: {
                    student_name: request.customer.name,
                    student_email: request.customer.email,
                    ...request.metadata,
                },
            };

            const order = await this.razorpay.orders.create(options);

            return {
                gateway_order_id: order.id,
                payment_url: this.generatePaymentUrl(order.id, request),
                status: "created",
                expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
                gateway_response: order,
            };
        } catch (error) {
            console.error("Razorpay payment creation failed:", error);
            return {
                gateway_order_id: "",
                payment_url: "",
                status: "failed",
                expires_at: new Date(),
                gateway_response: { error: error.message },
            };
        }
    }

    async verifyPayment(request: IVerificationRequest): Promise<IVerificationResponse> {
        try {
            // Verify signature
            const isValid = this.verifySignature(
                request.gateway_order_id,
                request.gateway_payment_id,
                request.gateway_signature
            );

            if (!isValid) {
                return {
                    is_valid: false,
                    status: "failed",
                    gateway_transaction_id: request.gateway_payment_id,
                    amount: request.amount,
                    payment_date: new Date(),
                    gateway_response: { error: "Invalid signature" },
                };
            }

            // Fetch payment details
            const payment = await this.razorpay.payments.fetch(request.gateway_payment_id);

            return {
                is_valid: true,
                status: payment.status === "captured" ? "success" : "failed",
                gateway_transaction_id: payment.id,
                amount: payment.amount / 100, // Convert from paise
                payment_date: new Date(payment.created_at * 1000),
                gateway_response: payment,
            };
        } catch (error) {
            console.error("Razorpay payment verification failed:", error);
            return {
                is_valid: false,
                status: "failed",
                gateway_transaction_id: request.gateway_payment_id,
                amount: request.amount,
                payment_date: new Date(),
                gateway_response: { error: error.message },
            };
        }
    }

    async getPaymentStatus(gatewayOrderId: string): Promise<IVerificationResponse> {
        try {
            const order = await this.razorpay.orders.fetch(gatewayOrderId);
            const payments = await this.razorpay.orders.fetchPayments(gatewayOrderId);

            const latestPayment = payments.items[0];

            return {
                is_valid: true,
                status: latestPayment?.status === "captured" ? "success" : "pending",
                gateway_transaction_id: latestPayment?.id || "",
                amount: order.amount / 100,
                payment_date: latestPayment ? new Date(latestPayment.created_at * 1000) : new Date(),
                gateway_response: { order, payments: payments.items },
            };
        } catch (error) {
            console.error("Razorpay status check failed:", error);
            throw error;
        }
    }

    async processWebhook(payload: any, signature: string): Promise<{
        event_type: string;
        transaction_id: string;
        status: string;
        data: Record<string, any>;
    }> {
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac("sha256", this.config.webhook_secret)
            .update(JSON.stringify(payload))
            .digest("hex");

        if (signature !== expectedSignature) {
            throw new Error("Invalid webhook signature");
        }

        const event = payload.event;
        const paymentData = payload.payload.payment.entity;

        return {
            event_type: event,
            transaction_id: paymentData.id,
            status: paymentData.status,
            data: paymentData,
        };
    }

    calculateFees(amount: number): { percentage: number; fixed: number; total: number } {
        // Standard Razorpay fees (can be configured per school)
        const percentage = 2; // 2%
        const fixed = 0; // No fixed fee for cards
        const total = (amount * percentage) / 100 + fixed;

        return { percentage, fixed, total };
    }

    protected getRequiredConfigFields(): string[] {
        return ["key_id", "key_secret", "webhook_secret"];
    }

    protected getProductionUrl(): string {
        return "https://api.razorpay.com/v1";
    }

    protected getSandboxUrl(): string {
        return "https://api.razorpay.com/v1"; // Razorpay uses same URL with test keys
    }

    private verifySignature(orderId: string, paymentId: string, signature: string): boolean {
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac("sha256", this.config.key_secret)
            .update(body)
            .digest("hex");

        return expectedSignature === signature;
    }

    private generatePaymentUrl(orderId: string, request: IPaymentRequest): string {
        // For Razorpay, we typically use their Checkout.js
        // This would be the URL to redirect to the payment page
        const params = new URLSearchParams({
            order_id: orderId,
            amount: (request.amount * 100).toString(),
            currency: request.currency,
            name: request.customer.name,
            email: request.customer.email,
            contact: request.customer.phone,
            description: request.description,
            callback_url: request.return_url,
            cancel_url: request.cancel_url,
        });

        return `${this.getBaseUrl()}/checkout?${params.toString()}`;
    }
}
```

## Security Implementation

### Encryption Utilities

```typescript
// src/utils/encryption.util.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class EncryptionUtil {
    private static getKey(password: string, salt: Buffer): Buffer {
        return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256");
    }

    static encrypt(text: string, password: string): string {
        try {
            const salt = crypto.randomBytes(SALT_LENGTH);
            const iv = crypto.randomBytes(IV_LENGTH);
            const key = this.getKey(password, salt);

            const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
            let encrypted = cipher.update(text, "utf8", "hex");
            encrypted += cipher.final("hex");

            const tag = cipher.getAuthTag();

            // Combine salt + iv + tag + encrypted
            const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, "hex")]);
            return result.toString("base64");
        } catch (error) {
            console.error("Encryption failed:", error);
            throw new Error("Encryption failed");
        }
    }

    static decrypt(encryptedData: string, password: string): string {
        try {
            const buffer = Buffer.from(encryptedData, "base64");

            const salt = buffer.slice(0, SALT_LENGTH);
            const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
            const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
            const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

            const key = this.getKey(password, salt);

            const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encrypted, null, "utf8");
            decrypted += decipher.final("utf8");

            return decrypted;
        } catch (error) {
            console.error("Decryption failed:", error);
            throw new Error("Decryption failed");
        }
    }

    static hash(text: string): string {
        return crypto.createHash("sha256").update(text).digest("hex");
    }

    static generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString("hex");
    }

    static verifyHash(text: string, hash: string): boolean {
        const textHash = this.hash(text);
        return crypto.timingSafeEqual(Buffer.from(textHash), Buffer.from(hash));
    }
}
```

### Authentication Middleware

```typescript
// src/middlewares/payment_auth.middleware.ts
import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { UserService } from "@/services/user.service";

interface JWTPayload {
    user_id: string;
    campus_id: string;
    user_type: string;
    iat: number;
    exp: number;
}

export class PaymentAuthMiddleware {
    static async authenticate(ctx: Context, next: Next) {
        try {
            const authHeader = ctx.req.header("Authorization");
            
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return ctx.json({ error: "Authorization token required" }, 401);
            }

            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

            // Verify user still exists and is active
            const user = await UserService.getUser(decoded.user_id);
            if (!user || !user.is_active) {
                return ctx.json({ error: "Invalid or inactive user" }, 401);
            }

            // Add user context to request
            ctx.set("user", {
                id: decoded.user_id,
                campus_id: decoded.campus_id,
                user_type: decoded.user_type,
            });

            await next();
        } catch (error) {
            console.error("Authentication failed:", error);
            return ctx.json({ error: "Invalid or expired token" }, 401);
        }
    }

    static requireRole(allowedRoles: string[]) {
        return async (ctx: Context, next: Next) => {
            const user = ctx.get("user");
            
            if (!user || !allowedRoles.includes(user.user_type)) {
                return ctx.json({ error: "Insufficient permissions" }, 403);
            }

            await next();
        };
    }

    static requireCampusAccess() {
        return async (ctx: Context, next: Next) => {
            const user = ctx.get("user");
            const campusId = ctx.req.param("campus_id") || ctx.req.query("campus_id");

            if (!campusId) {
                return ctx.json({ error: "Campus ID required" }, 400);
            }

            // Admin users can access any campus
            if (user.user_type === "admin") {
                await next();
                return;
            }

            // Other users can only access their own campus
            if (user.campus_id !== campusId) {
                return ctx.json({ error: "Access denied to this campus" }, 403);
            }

            await next();
        };
    }
}
```

## Testing Guidelines

### Unit Tests Example

```typescript
// src/tests/services/payment_processing.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PaymentProcessingService } from "@/services/payment_processing.service";
import { RazorpayGateway } from "@/services/gateway/razorpay.gateway";

describe("PaymentProcessingService", () => {
    let paymentService: PaymentProcessingService;
    let mockRazorpayGateway: any;

    beforeEach(() => {
        mockRazorpayGateway = {
            getName: vi.fn().mockReturnValue("razorpay"),
            createPayment: vi.fn(),
            verifyPayment: vi.fn(),
            calculateFees: vi.fn(),
        };

        paymentService = new PaymentProcessingService();
        paymentService.registerGateway(mockRazorpayGateway);
    });

    describe("initiatePayment", () => {
        it("should create payment successfully", async () => {
            const paymentRequest = {
                student_id: "student123",
                campus_id: "campus123",
                amount: 1000,
                currency: "INR",
                payment_method: "card",
                return_url: "https://example.com/success",
                cancel_url: "https://example.com/cancel",
            };

            mockRazorpayGateway.createPayment.mockResolvedValue({
                gateway_order_id: "order_123",
                payment_url: "https://razorpay.com/payment",
                status: "created",
                expires_at: new Date(),
                gateway_response: {},
            });

            const result = await paymentService.initiatePayment(paymentRequest);

            expect(result.status).toBe("initiated");
            expect(result.gateway_order_id).toBe("order_123");
            expect(mockRazorpayGateway.createPayment).toHaveBeenCalled();
        });

        it("should handle gateway failure", async () => {
            const paymentRequest = {
                student_id: "student123",
                campus_id: "campus123",
                amount: 1000,
                currency: "INR",
                payment_method: "card",
                return_url: "https://example.com/success",
                cancel_url: "https://example.com/cancel",
            };

            mockRazorpayGateway.createPayment.mockResolvedValue({
                gateway_order_id: "",
                payment_url: "",
                status: "failed",
                expires_at: new Date(),
                gateway_response: { error: "Gateway error" },
            });

            const result = await paymentService.initiatePayment(paymentRequest);

            expect(result.status).toBe("failed");
            expect(result.failure_reason).toContain("Gateway error");
        });
    });

    describe("verifyPayment", () => {
        it("should verify payment successfully", async () => {
            const verificationRequest = {
                transaction_id: "txn_123",
                gateway_payment_id: "pay_123",
                gateway_signature: "signature_123",
            };

            mockRazorpayGateway.verifyPayment.mockResolvedValue({
                is_valid: true,
                status: "success",
                gateway_transaction_id: "pay_123",
                amount: 1000,
                payment_date: new Date(),
                gateway_response: {},
            });

            const result = await paymentService.verifyPayment(verificationRequest);

            expect(result.status).toBe("success");
            expect(result.is_verified).toBe(true);
        });
    });
});
```

### Integration Tests Example

```typescript
// src/tests/integration/payment_flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testClient } from "hono/testing";
import app from "@/app";

describe("Payment Flow Integration", () => {
    let authToken: string;
    let campusId: string;
    let studentId: string;

    beforeAll(async () => {
        // Setup test data
        authToken = "test-token";
        campusId = "test-campus";
        studentId = "test-student";
    });

    it("should complete full payment flow", async () => {
        const client = testClient(app);

        // 1. Get student fees
        const feesResponse = await client.payment.student[studentId].fees.$get(
            {},
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            }
        );

        expect(feesResponse.status).toBe(200);
        const feesData = await feesResponse.json();
        expect(feesData.fee_summary.due_amount).toBeGreaterThan(0);

        // 2. Initiate payment
        const paymentRequest = {
            student_id: studentId,
            amount: 1000,
            currency: "INR",
            payment_method: "card",
            return_url: "https://example.com/success",
            cancel_url: "https://example.com/cancel",
        };

        const initiateResponse = await client.payment.initiate.$post(
            { json: paymentRequest },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        expect(initiateResponse.status).toBe(200);
        const initiateData = await initiateResponse.json();
        expect(initiateData.transaction_id).toBeDefined();
        expect(initiateData.payment_url).toBeDefined();

        // 3. Verify payment (simulate successful payment)
        const verifyRequest = {
            transaction_id: initiateData.transaction_id,
            gateway_payment_id: "pay_test_123",
            gateway_signature: "test_signature",
        };

        const verifyResponse = await client.payment.verify.$post(
            { json: verifyRequest },
            {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        expect(verifyResponse.status).toBe(200);
        const verifyData = await verifyResponse.json();
        expect(verifyData.status).toBe("success");
    });
});
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] SSL certificates installed
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] Monitoring tools setup
- [ ] Backup systems configured

### Payment Gateway Setup
- [ ] Razorpay account and API keys
- [ ] Stripe account and webhooks
- [ ] PayU merchant account setup
- [ ] Webhook endpoints tested
- [ ] Gateway configurations encrypted
- [ ] Test transactions verified

### Security Checklist
- [ ] PCI DSS compliance verified
- [ ] Sensitive data encryption enabled
- [ ] API authentication working
- [ ] HTTPS enforced
- [ ] Input validation implemented
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] CSRF protection configured

### Performance & Monitoring
- [ ] Load balancer configured
- [ ] Auto-scaling rules set
- [ ] Database performance optimized
- [ ] Caching layer configured
- [ ] Application monitoring active
- [ ] Error tracking configured
- [ ] Log aggregation working

### Documentation
- [ ] API documentation updated
- [ ] Deployment guide created
- [ ] Troubleshooting guide prepared
- [ ] User guides completed
- [ ] Admin guides completed

---

This implementation guide provides the detailed technical specifications needed to build the payment system. Each section includes specific code examples, configurations, and best practices to ensure a robust and secure implementation.

**Document Version**: 1.0  
**Last Updated**: June 23, 2025  
**Next Review**: July 23, 2025
