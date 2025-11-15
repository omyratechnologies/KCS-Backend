/**
 * Cashfree Payment Order Routes
 * Students create payment orders with automatic vendor splits
 */

import { Hono } from "hono";
import { PaymentOrderController } from "../controllers/payment_order.controller";

const cashfreePaymentRouter = new Hono();

// Create payment order (student only)
cashfreePaymentRouter.post("/create-order", PaymentOrderController.createOrder);

// Get all payment orders for student
cashfreePaymentRouter.get("/", PaymentOrderController.getAllOrders);

// Manually verify payment status from Cashfree (for testing without webhooks)
cashfreePaymentRouter.get("/verify/:order_id", PaymentOrderController.verifyPayment);

// Check split and settlement details from Cashfree
cashfreePaymentRouter.get("/check-split/:order_id", PaymentOrderController.checkSplitDetails);

// Get payment order status by order_id
cashfreePaymentRouter.get("/:order_id", PaymentOrderController.getOrderStatus);

// Webhook endpoint (no auth required - verified via signature)
cashfreePaymentRouter.post("/webhook", PaymentOrderController.handleWebhook);

export default cashfreePaymentRouter;
