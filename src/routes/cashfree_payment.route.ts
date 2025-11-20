/**
 * Cashfree Payment Order Routes
 * Students create payment orders with automatic vendor splits
 */

import { Hono } from "hono";
import { PaymentOrderController } from "../controllers/payment_order.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { roleMiddleware } from "@/middlewares/role.middleware";

const cashfreePaymentRouter = new Hono();

// Create payment order (admin only)
cashfreePaymentRouter.post(
    "/create-order",
    authMiddleware,
    roleMiddleware("create_payment_order"),
    PaymentOrderController.createOrder
);

// Sync payment statuses with Cashfree (admin only)
cashfreePaymentRouter.get(
    "/sync-payments",
    authMiddleware,
    roleMiddleware("verify_payment"),
    PaymentOrderController.syncPaymentsWithCashfree
);

// Get student's payment history (admin and accountant)
cashfreePaymentRouter.get(
    "/my-payments",
    authMiddleware,
    roleMiddleware("view_payment_transactions"),
    PaymentOrderController.getMyPayments
);

// Get student payment history by ID (admin and accountant)
cashfreePaymentRouter.get(
    "/student/:student_id/payments",
    authMiddleware,
    roleMiddleware("view_payment_transactions"),
    PaymentOrderController.getStudentPayments
);

// Get all payment orders (admin and accountant)
cashfreePaymentRouter.get(
    "/",
    authMiddleware,
    roleMiddleware("view_payment_transactions"),
    PaymentOrderController.getAllOrders
);

// Manually verify payment status from Cashfree (admin only)
cashfreePaymentRouter.get(
    "/verify/:order_id",
    authMiddleware,
    roleMiddleware("verify_payment"),
    PaymentOrderController.verifyPayment
);

// Check split and settlement details from Cashfree (admin and accountant)
cashfreePaymentRouter.get(
    "/check-split/:order_id",
    authMiddleware,
    roleMiddleware("view_payment_transactions"),
    PaymentOrderController.checkSplitDetails
);

// Get payment order status by order_id (admin and accountant)
cashfreePaymentRouter.get(
    "/:order_id",
    authMiddleware,
    roleMiddleware("view_payment_transactions"),
    PaymentOrderController.getOrderStatus
);

// Webhook endpoint (no auth required - verified via signature)
cashfreePaymentRouter.post("/webhook", PaymentOrderController.handleWebhook);

export default cashfreePaymentRouter;
