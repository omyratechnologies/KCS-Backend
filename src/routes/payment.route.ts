import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { PaymentController } from "@/controllers/payment.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";
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
    roleMiddleware("create_payment_template"),
    zValidator("json", CreatePaymentTemplateSchema),
    PaymentController.createPaymentTemplate
);

/**
 * @route   GET /api/payments/templates
 * @desc    Get all payment templates with filters
 * @access  Admin and Accountant
 */
paymentRoute.get(
    "/templates",
    authMiddleware,
    roleMiddleware("view_payment_templates"),
    zValidator("query", GetPaymentTemplatesQuerySchema),
    PaymentController.getPaymentTemplates
);

/**
 * @route   GET /api/payments/templates/:id
 * @desc    Get payment template by ID
 * @access  Admin and Accountant
 */
paymentRoute.get(
    "/templates/:id",
    authMiddleware,
    roleMiddleware("view_payment_templates"),
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
    roleMiddleware("update_payment_template"),
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
    roleMiddleware("delete_payment_template"),
    PaymentController.deletePaymentTemplate
);

// ============= STUDENT/PARENT ROUTES - Payment Operations =============

/**
 * @route   POST /api/payments/orders
 * @desc    Create a Razorpay order for payment
 * @access  Admin only (can create orders for students)
 */
paymentRoute.post(
    "/orders",
    authMiddleware,
    roleMiddleware("create_payment_order"),
    zValidator("json", CreatePaymentOrderSchema),
    PaymentController.createPaymentOrder
);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment and create route transfer
 * @access  Admin only
 */
paymentRoute.post(
    "/verify",
    authMiddleware,
    roleMiddleware("verify_payment"),
    zValidator("json", VerifyPaymentSchema),
    PaymentController.verifyPayment
);

// ============= TRANSACTION ROUTES =============

/**
 * @route   GET /api/payments/transactions
 * @desc    Get payment transactions with filters
 * @access  Admin and Accountant (view all), Students (view own)
 */
paymentRoute.get(
    "/transactions",
    authMiddleware,
    roleMiddleware("view_payment_transactions"),
    zValidator("query", GetPaymentTransactionsQuerySchema),
    PaymentController.getPaymentTransactions
);

/**
 * @route   GET /api/payments/transactions/:id
 * @desc    Get transaction by ID
 * @access  Admin and Accountant (view all), Students (view own)
 */
paymentRoute.get(
    "/transactions/:id",
    authMiddleware,
    roleMiddleware("view_payment_transactions"),
    PaymentController.getTransactionById
);

// ============= INVOICE ROUTES =============

/**
 * @route   GET /api/payments/invoices
 * @desc    Get invoices with filters
 * @access  Admin and Accountant (view all), Students (view own)
 */
paymentRoute.get(
    "/invoices",
    authMiddleware,
    roleMiddleware("view_payment_invoices"),
    zValidator("query", GetInvoicesQuerySchema),
    PaymentController.getInvoices
);

/**
 * @route   GET /api/payments/invoices/:id
 * @desc    Get invoice by ID
 * @access  Admin and Accountant (view all), Students (view own)
 */
paymentRoute.get(
    "/invoices/:id",
    authMiddleware,
    roleMiddleware("view_payment_invoices"),
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
    roleMiddleware("create_payment_refund"),
    zValidator("json", CreateRefundSchema),
    PaymentController.createRefund
);

// ============= ANALYTICS ROUTES =============

/**
 * @route   GET /api/payments/analytics
 * @desc    Get payment analytics and statistics
 * @access  Admin and Accountant
 */
paymentRoute.get(
    "/analytics",
    authMiddleware,
    roleMiddleware("view_payment_analytics"),
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
