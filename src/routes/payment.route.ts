import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";

import { PaymentController } from "@/controllers/payment.controller";
import { roleMiddleware } from "@/middlewares/role.middleware";
import {
    schoolBankDetailsSchema,
    createBankDetailsRequestSchema,
    feeCategorySchema,
    createFeeCategoryRequestSchema,
    feeTemplateSchema,
    createFeeTemplateRequestSchema,
    generateFeesRequestSchema,
    initiatePaymentRequestSchema,
    verifyPaymentRequestSchema,
    paymentHistoryResponseSchema,
    studentFeesResponseSchema,
    availableGatewaysResponseSchema,
    paymentTransactionSchema,
    successResponseSchema,
    errorResponseSchema
} from "@/schema/payment";

const app = new Hono();

// School Bank Details Management (Admin only)
app.post(
    "/school-bank-details",
    describeRoute({
        tags: ["Payment Management"],
        operationId: "createSchoolBankDetails",
        summary: "Create or update school bank details",
        description: "School admin can add/update bank account details for payment collection",
        responses: {
            200: {
                description: "Bank details saved successfully",
                content: {
                    "application/json": {
                        schema: resolver(schoolBankDetailsSchema),
                    },
                },
            },
            403: {
                description: "Unauthorized - Admin access required",
            },
        },
    }),
    zValidator("json", createBankDetailsRequestSchema),
    PaymentController.createOrUpdateBankDetails
);

app.get(
    "/school-bank-details",
    describeRoute({
        tags: ["Payment Management"],
        operationId: "getSchoolBankDetails",
        summary: "Get school bank details",
        description: "Retrieve current school bank account details",
        responses: {
            200: {
                description: "Bank details retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(schoolBankDetailsSchema),
                    },
                },
            },
        },
    }),
    PaymentController.getBankDetails
);

// Fee Categories Management (Admin only)
app.post(
    "/fee-categories",
    describeRoute({
        tags: ["Payment Management"],
        operationId: "createFeeCategory",
        summary: "Create fee category",
        description: "Create a new fee category (e.g., Tuition, Transportation, etc.)",
        responses: {
            200: {
                description: "Fee category created successfully",
                content: {
                    "application/json": {
                        schema: resolver(feeCategorySchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createFeeCategoryRequestSchema),
    PaymentController.createFeeCategory
);

app.get(
    "/fee-categories",
    describeRoute({
        tags: ["Payment Management"],
        operationId: "getFeeCategories",
        summary: "Get all fee categories",
        description: "Retrieve all fee categories for the school",
        responses: {
            200: {
                description: "Fee categories retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: { $ref: "#/components/schemas/FeeCategory" },
                        },
                    },
                },
            },
        },
    }),
    PaymentController.getFeeCategories
);

app.put(
    "/fee-categories/:id",
    describeRoute({
        tags: ["Payment Management"],
        operationId: "updateFeeCategory",
        summary: "Update fee category",
        description: "Update an existing fee category",
        parameters: [
            {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Fee category ID",
            },
        ],
        responses: {
            200: {
                description: "Fee category updated successfully",
                content: {
                    "application/json": {
                        schema: resolver(feeCategorySchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createFeeCategoryRequestSchema),
    PaymentController.updateFeeCategory
);

// Fee Templates Management (Admin only)
app.post(
    "/fee-templates",
    describeRoute({
        tags: ["Payment Management"],
        operationId: "createFeeTemplate",
        summary: "Create fee template",
        description: "Create a fee template for specific class/academic year",
        responses: {
            200: {
                description: "Fee template created successfully",
                content: {
                    "application/json": {
                        schema: resolver(feeTemplateSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", createFeeTemplateRequestSchema),
    PaymentController.createFeeTemplate
);

app.get(
    "/fee-templates",
    describeRoute({
        tags: ["Payment Management"],
        operationId: "getFeeTemplates",
        summary: "Get fee templates",
        description: "Retrieve fee templates with optional filtering",
        parameters: [
            {
                name: "class_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by class ID",
            },
            {
                name: "academic_year",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Filter by academic year",
            },
        ],
        responses: {
            200: {
                description: "Fee templates retrieved successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "array",
                            items: { $ref: "#/components/schemas/FeeTemplate" },
                        },
                    },
                },
            },
        },
    }),
    PaymentController.getFeeTemplates
);

// Fee Generation (Admin only)
app.post(
    "/generate-fees",
    describeRoute({
        tags: ["Payment Management"],
        operationId: "generateFees",
        summary: "Generate fees from template",
        description: "Generate individual fee records for students based on template",
        responses: {
            200: {
                description: "Fees generated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", generateFeesRequestSchema),
    PaymentController.generateFeesFromTemplate
);

// Payment Initiation (Students/Parents)
app.post(
    "/initiate-payment",
    describeRoute({
        tags: ["Payment Processing"],
        operationId: "initiatePayment",
        summary: "Initiate payment",
        description: "Start payment process for a fee",
        responses: {
            200: {
                description: "Payment initiated successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", initiatePaymentRequestSchema),
    PaymentController.initiatePayment
);

// Payment Verification (Webhook/Callback)
app.post(
    "/verify-payment/:transaction_id",
    describeRoute({
        tags: ["Payment Processing"],
        operationId: "verifyPayment",
        summary: "Verify payment",
        description: "Verify payment completion and update records",
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
                description: "Payment verified successfully",
                content: {
                    "application/json": {
                        schema: resolver(successResponseSchema),
                    },
                },
            },
        },
    }),
    zValidator("json", verifyPaymentRequestSchema),
    PaymentController.verifyPayment
);

// Payment History (Students/Parents/Admin)
app.get(
    "/payment-history",
    describeRoute({
        tags: ["Payment Information"],
        operationId: "getPaymentHistory",
        summary: "Get payment history",
        description: "Retrieve payment history for student/parent",
        parameters: [
            {
                name: "student_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Student ID (for admin/parent viewing)",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["pending", "completed", "failed"] },
                description: "Filter by payment status",
            },
        ],
        responses: {
            200: {
                description: "Payment history retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(paymentHistoryResponseSchema),
                    },
                },
            },
        },
    }),
    PaymentController.getPaymentHistory
);

// Student Fees (Students/Parents/Admin)
app.get(
    "/student-fees",
    describeRoute({
        tags: ["Payment Information"],
        operationId: "getStudentFees",
        summary: "Get student fees",
        description: "Retrieve pending and paid fees for a student",
        parameters: [
            {
                name: "student_id",
                in: "query",
                required: false,
                schema: { type: "string" },
                description: "Student ID (for admin/parent viewing)",
            },
            {
                name: "status",
                in: "query",
                required: false,
                schema: { type: "string", enum: ["unpaid", "partial", "paid", "overdue"] },
                description: "Filter by fee status",
            },
        ],
        responses: {
            200: {
                description: "Student fees retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(studentFeesResponseSchema),
                    },
                },
            },
        },
    }),
    PaymentController.getStudentFees
);

// Payment Gateways (Public)
app.get(
    "/available-gateways",
    describeRoute({
        tags: ["Payment Information"],
        operationId: "getAvailableGateways",
        summary: "Get available payment gateways",
        description: "Retrieve list of available payment gateways for the school",
        responses: {
            200: {
                description: "Available gateways retrieved successfully",
                content: {
                    "application/json": {
                        schema: resolver(availableGatewaysResponseSchema),
                    },
                },
            },
        },
    }),
    PaymentController.getAvailableGateways
);

// Download Invoice (Students/Parents/Admin)
app.get(
    "/invoices/:invoice_id/download",
    describeRoute({
        tags: ["Payment Information"],
        operationId: "downloadInvoice",
        summary: "Download invoice PDF",
        description: "Download payment invoice as PDF",
        parameters: [
            {
                name: "invoice_id",
                in: "path",
                required: true,
                schema: { type: "string" },
                description: "Invoice ID",
            },
        ],
        responses: {
            200: {
                description: "Invoice PDF download",
                content: {
                    "application/pdf": {
                        schema: { type: "string", format: "binary" },
                    },
                },
            },
        },
    }),
    PaymentController.downloadInvoice
);

// Gateway Configuration (Admin only)
app.post(
    "/secure-credentials",
    describeRoute({
        tags: ["Gateway Management"],
        operationId: "configureSecureCredentials",
        summary: "Configure payment gateway credentials",
        description: "Admin can configure secure payment gateway credentials",
        responses: {
            200: {
                description: "Gateway credentials configured successfully",
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
    PaymentController.configureSecureCredentials
);

app.get(
    "/credentials/masked",
    describeRoute({
        tags: ["Gateway Management"],
        operationId: "getMaskedCredentials",
        summary: "Get masked payment gateway credentials",
        description: "Admin can view masked gateway credentials for verification",
        responses: {
            200: {
                description: "Masked credentials retrieved successfully",
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
    PaymentController.getMaskedCredentials
);

app.get(
    "/security-status",
    describeRoute({
        tags: ["Security Management"],
        operationId: "getSecurityStatus",
        summary: "Get security status of payment system",
        description: "Admin can check security status and encryption health",
        responses: {
            200: {
                description: "Security status retrieved successfully",
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
    PaymentController.getSecurityStatus
);

app.get(
    "/validate-encryption",
    describeRoute({
        tags: ["Security Management"],
        operationId: "validateEncryption",
        summary: "Validate encryption setup",
        description: "Admin can validate encryption configuration and health",
        responses: {
            200: {
                description: "Security status retrieved successfully",
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
    PaymentController.validateEncryption
);

app.post(
    "/migrate-credentials",
    describeRoute({
        tags: ["Security Management"],
        operationId: "migrateLegacyCredentials",
        summary: "Migrate legacy credentials",
        description: "Admin can migrate legacy credentials to new encryption format",
        responses: {
            200: {
                description: "Credentials migration completed",
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
    PaymentController.migrateLegacyCredentials
);

export default app;
