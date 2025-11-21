/**
 * Cashfree Payment Order Routes
 * Students and Parents can create payment orders with automatic vendor splits
 */

import { Hono } from "hono";
import { PaymentOrderController } from "../controllers/payment_order.controller";
import { roleMiddleware } from "@/middlewares/role.middleware";

const cashfreePaymentRouter = new Hono();

// Create payment order (Student and Parent only)
cashfreePaymentRouter.post(
    "/create-order",
    roleMiddleware("create_payment_order"),
    PaymentOrderController.createOrder
);

// Get student's own payment history (Student only)
cashfreePaymentRouter.get(
    "/my-payments",
    roleMiddleware("view_student_own_payments"),
    PaymentOrderController.getMyPayments
);

// Get student payment history by student ID (Parent only - for their children) or admin
cashfreePaymentRouter.get(
    "/student/:student_id/payments",
    roleMiddleware("view_student_payments"),
    PaymentOrderController.getStudentPayments
);

// Sync payment statuses with Cashfree (Admin and Accountant only)
cashfreePaymentRouter.get(
    "/sync-payments",
    roleMiddleware("view_specific_order"),
    PaymentOrderController.syncPaymentsWithCashfree
);

// Get all payment orders (Admin and Accountant only)
cashfreePaymentRouter.get(
    "/all-orders",
    roleMiddleware("view_payment_transactions"),
    PaymentOrderController.getAllOrders
);

// Manually verify payment status from Cashfree (Admin only)
cashfreePaymentRouter.get(
    "/verify/:order_id",
    roleMiddleware("verify_payment"),
    PaymentOrderController.verifyPayment
);

// Check split and settlement details from Cashfree (Admin and Accountant)
cashfreePaymentRouter.get(
    "/check-split/:order_id",
    roleMiddleware("verify_payment"),
    PaymentOrderController.checkSplitDetails
);

// Get payment order status by order_id (Admin, Accountant, Student, Parent)
cashfreePaymentRouter.get(
    "/:order_id",
    roleMiddleware("view_specific_order"),
    PaymentOrderController.getOrderStatus
);

// Webhook endpoint (no auth required - verified via signature)
cashfreePaymentRouter.post("/webhook", PaymentOrderController.handleWebhook);

export default cashfreePaymentRouter;
