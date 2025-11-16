import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { PaymentController } from "@/controllers/payment.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import {
    CreatePaymentTemplateSchema,
    UpdatePaymentTemplateSchema,
    CreatePaymentOrderSchema,
    VerifyPaymentSchema,
    CreateRefundSchema,
    GetPaymentTemplatesQuerySchema,
    GetPaymentTransactionsQuerySchema,
    GetInvoicesQuerySchema,
    GetPaymentAnalyticsQuerySchema,
} from "@/schema/payment.schema";

const paymentRoute = new Hono();

// ============= ADMIN ROUTES - Payment Template Management =============

/**
 * @route   POST /api/payments/templates
 * @desc    Create a new payment template
 * @access  Admin only
 */
paymentRoute.post(
    "/templates",
    authMiddleware,
    zValidator("json", CreatePaymentTemplateSchema),
    PaymentController.createPaymentTemplate
);

/**
 * @route   GET /api/payments/templates
 * @desc    Get all payment templates with filters
 * @access  Authenticated users
 */
paymentRoute.get(
    "/templates",
    authMiddleware,
    zValidator("query", GetPaymentTemplatesQuerySchema),
    PaymentController.getPaymentTemplates
);

/**
 * @route   GET /api/payments/templates/:id
 * @desc    Get payment template by ID
 * @access  Authenticated users
 */
paymentRoute.get(
    "/templates/:id",
    authMiddleware,
    PaymentController.getPaymentTemplateById
);

/**
 * @route   PUT /api/payments/templates/:id
 * @desc    Update payment template
 * @access  Admin only
 */
paymentRoute.put(
    "/templates/:id",
    authMiddleware,
    zValidator("json", UpdatePaymentTemplateSchema),
    PaymentController.updatePaymentTemplate
);

/**
 * @route   DELETE /api/payments/templates/:id
 * @desc    Delete payment template (soft delete)
 * @access  Admin only
 */
paymentRoute.delete(
    "/templates/:id",
    authMiddleware,
    PaymentController.deletePaymentTemplate
);

// ============= STUDENT/PARENT ROUTES - Payment Operations =============

/**
 * @route   POST /api/payments/orders
 * @desc    Create a Razorpay order for payment
 * @access  Students and Parents
 */
paymentRoute.post(
    "/orders",
    authMiddleware,
    zValidator("json", CreatePaymentOrderSchema),
    PaymentController.createPaymentOrder
);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment and create route transfer
 * @access  Authenticated users
 */
paymentRoute.post(
    "/verify",
    authMiddleware,
    zValidator("json", VerifyPaymentSchema),
    PaymentController.verifyPayment
);

// ============= TRANSACTION ROUTES =============

/**
 * @route   GET /api/payments/transactions
 * @desc    Get payment transactions with filters
 * @access  Authenticated users (students see their own, admins see all)
 */
paymentRoute.get(
    "/transactions",
    authMiddleware,
    zValidator("query", GetPaymentTransactionsQuerySchema),
    PaymentController.getPaymentTransactions
);

/**
 * @route   GET /api/payments/transactions/:id
 * @desc    Get transaction by ID
 * @access  Authenticated users (students can only view their own)
 */
paymentRoute.get(
    "/transactions/:id",
    authMiddleware,
    PaymentController.getTransactionById
);

// ============= INVOICE ROUTES =============

/**
 * @route   GET /api/payments/invoices
 * @desc    Get invoices with filters
 * @access  Authenticated users (students see their own, admins see all)
 */
paymentRoute.get(
    "/invoices",
    authMiddleware,
    zValidator("query", GetInvoicesQuerySchema),
    PaymentController.getInvoices
);

/**
 * @route   GET /api/payments/invoices/:id
 * @desc    Get invoice by ID
 * @access  Authenticated users (students can only view their own)
 */
paymentRoute.get(
    "/invoices/:id",
    authMiddleware,
    PaymentController.getInvoiceById
);

// ============= REFUND ROUTES =============

/**
 * @route   POST /api/payments/refunds
 * @desc    Create a refund for a transaction
 * @access  Admin only
 */
paymentRoute.post(
    "/refunds",
    authMiddleware,
    zValidator("json", CreateRefundSchema),
    PaymentController.createRefund
);

// ============= ANALYTICS ROUTES =============

/**
 * @route   GET /api/payments/analytics
 * @desc    Get payment analytics and statistics
 * @access  Admin only
 */
paymentRoute.get(
    "/analytics",
    authMiddleware,
    zValidator("query", GetPaymentAnalyticsQuerySchema),
    PaymentController.getPaymentAnalytics
);

// ============= WEBHOOK ROUTES =============

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhooks
 * @access  Public (signature verified)
 */
paymentRoute.post(
    "/webhook",
    PaymentController.handleWebhook
);

export default paymentRoute;
