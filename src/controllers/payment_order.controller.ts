/**
 * Payment Order Controller
 * Students create payment orders with automatic vendor splits
 */

import { Context } from "hono";
import { PaymentOrder } from "../models/payment_order.model";
import { ClassFeeStructure } from "../models/class_fee_structure.model";
import { CampusVendor } from "../models/campus_vendor.model";
import { cashfreeService } from "../services/cashfree.service";
import { CashfreeWebhookEvent, PaymentMode } from "../types/payment-gateway.types";

export class PaymentOrderController {
    /**
     * Create payment order (student initiates payment)
     * POST /api/payments/create-order
     */
    static async createOrder(c: Context) {
        try {
            const student_id = c.get("user_id");
            const user_type = c.get("user_type");

            if (user_type?.toLowerCase() !== "student") {
                return c.json({ success: false, message: "Only students can create payment orders" }, 403);
            }

            const body = await c.req.json();
            const {
                fee_structure_id,
                payment_type, // "ONE_TIME" or "INSTALLMENT"
                installment_number, // Required if payment_type is INSTALLMENT
                student_name,
                student_email,
                student_phone,
                return_url,
            } = body;

            // Validation
            if (!fee_structure_id || !payment_type || !student_name || !student_email || !student_phone) {
                return c.json({ 
                    success: false, 
                    message: "Missing required fields: fee_structure_id, payment_type, student_name, student_email, student_phone" 
                }, 400);
            }

            if (payment_type === PaymentMode.INSTALLMENT && !installment_number) {
                return c.json({ success: false, message: "installment_number is required for installment payments" }, 400);
            }

            // Get fee structure
            const feeStructureResult = await ClassFeeStructure.find({ 
                id: fee_structure_id 
            });
            const feeStructure = feeStructureResult && feeStructureResult.rows.length > 0 ? feeStructureResult.rows[0] : null;
            
            if (!feeStructure) {
                return c.json({ success: false, message: "Fee structure not found" }, 404);
            }

            // Check if payment type is enabled
            if (payment_type === PaymentMode.ONE_TIME && !feeStructure.one_time_enabled) {
                return c.json({ success: false, message: "One-time payment is not enabled for this class" }, 400);
            }

            if (payment_type === PaymentMode.INSTALLMENT && !feeStructure.installments_enabled) {
                return c.json({ success: false, message: "Installment payment is not enabled for this class" }, 400);
            }

            // Get vendor
            const vendorResult = await CampusVendor.find({ campus_id: feeStructure.campus_id });
            const vendor = vendorResult && vendorResult.rows.length > 0 ? vendorResult.rows[0] : null;
            
            if (!vendor) {
                return c.json({ success: false, message: "Campus vendor not configured" }, 500);
            }

            if (vendor.vendor_status !== "ACTIVE") {
                // Allow BANK_VALIDATION_FAILED for testing
                if (vendor.vendor_status === "DELETED" || vendor.vendor_status === "INACTIVE") {
                    return c.json({ success: false, message: "Campus vendor is not active" }, 500);
                }
            }

            // Calculate order amount
            let order_amount = 0;
            let installment_description = "";
            
            if (payment_type === PaymentMode.ONE_TIME) {
                order_amount = feeStructure.one_time_amount;
            } else if (payment_type === PaymentMode.INSTALLMENT) {
                const installment = feeStructure.installments.find(
                    (inst) => inst.installment_number === installment_number
                );
                if (!installment) {
                    return c.json({ success: false, message: "Installment not found" }, 404);
                }
                order_amount = installment.amount;
                installment_description = installment.description || `Installment ${installment_number}`;
            }

            if (order_amount <= 0) {
                return c.json({ success: false, message: "Invalid order amount" }, 400);
            }

            // Calculate vendor split amount
            const vendor_split_amount = Math.round((order_amount * feeStructure.vendor_split_percentage) / 100);

            // Generate unique order ID
            const timestamp = Date.now();
            const order_id = `ORD_${feeStructure.campus_id}_${student_id}_${timestamp}`;

            // Create order in database first
            const paymentOrder = new PaymentOrder({
                order_id,
                cf_order_id: "", // Will be updated after Cashfree order creation
                student_id,
                customer_id: student_id,
                customer_name: student_name,
                customer_email: student_email,
                customer_phone: student_phone,
                campus_id: feeStructure.campus_id,
                class_id: feeStructure.class_id,
                fee_structure_id,
                payment_type,
                installment_number: payment_type === PaymentMode.INSTALLMENT ? installment_number : undefined,
                order_amount,
                order_currency: "INR",
                vendor_id: vendor.cashfree_vendor_id,
                vendor_split_percentage: feeStructure.vendor_split_percentage,
                vendor_split_amount,
                payment_status: "PENDING",
                order_status: "ACTIVE",
                settlement_status: "PENDING",
                created_at: new Date(),
                updated_at: new Date(),
            });

            await paymentOrder.save();

            // Create order in Cashfree with splits
            try {
                const cashfreeOrderData = {
                    order_id,
                    order_amount,
                    order_currency: "INR",
                    customer_details: {
                        customer_id: student_id,
                        customer_name: student_name,
                        customer_email: student_email,
                        customer_phone: student_phone,
                    },
                    order_note: payment_type === PaymentMode.ONE_TIME 
                        ? `${feeStructure.class_name} - ${feeStructure.academic_year} - One Time Payment`
                        : `${feeStructure.class_name} - ${feeStructure.academic_year} - ${installment_description}`,
                    order_meta: {
                        return_url: (return_url && return_url.startsWith('http')) ? return_url : `http://localhost:3000/payment/success`,
                        notify_url: `http://localhost:4500/api/cashfree-payments/webhook`,
                    },
                    order_splits: [
                        {
                            vendor_id: vendor.cashfree_vendor_id,
                            amount: vendor_split_amount,
                            tags: {
                                campus_id: feeStructure.campus_id,
                                class_id: feeStructure.class_id,
                                academic_year: feeStructure.academic_year,
                                payment_type: payment_type.toString(),
                            },
                        },
                    ],
                };

                // eslint-disable-next-line no-console
                console.log("Creating Cashfree order with data:", JSON.stringify(cashfreeOrderData, null, 2));

                const cashfreeOrder = await cashfreeService.createOrder(cashfreeOrderData);

                // Update payment order with Cashfree order ID and payment session
                paymentOrder.cf_order_id = cashfreeOrder.cf_order_id;
                paymentOrder.payment_session_id = cashfreeOrder.payment_session_id;
                paymentOrder.order_status = cashfreeOrder.order_status;
                await paymentOrder.save();

                return c.json({
                    success: true,
                    message: "Payment order created successfully",
                    data: {
                        order_id: paymentOrder.order_id,
                        cf_order_id: cashfreeOrder.cf_order_id,
                        payment_session_id: cashfreeOrder.payment_session_id,
                        order_amount,
                        order_currency: "INR",
                        payment_link: `https://sandbox.cashfree.com/pg/orders/${cashfreeOrder.cf_order_id}`,
                        order_status: cashfreeOrder.order_status,
                    },
                }, 201);
            } catch (cashfreeError) {
                // Mark order as failed
                paymentOrder.order_status = "FAILED";
                paymentOrder.payment_status = "FAILED";
                await paymentOrder.save();

                // eslint-disable-next-line no-console
                console.error("Cashfree Order Creation Error:", cashfreeError);
                return c.json({
                    success: false,
                    message: "Failed to create payment order in Cashfree",
                    error: cashfreeError instanceof Error ? cashfreeError.message : "Unknown error",
                }, 500);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Create Payment Order Error:", error);
            return c.json({
                success: false,
                message: "Failed to create payment order",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Get payment order status
     * GET /api/payments/:order_id
     */
    static async getOrderStatus(c: Context) {
        try {
            const student_id = c.get("user_id");
            const { order_id } = c.req.param();

            const paymentOrder = await PaymentOrder.findOne({ order_id });

            if (!paymentOrder) {
                return c.json({ success: false, message: "Payment order not found" }, 404);
            }

            // Verify ownership (students can only see their own orders)
            if (paymentOrder.student_id !== student_id) {
                return c.json({ success: false, message: "Unauthorized access to payment order" }, 403);
            }

            // Fetch latest status from Cashfree
            if (paymentOrder.cf_order_id) {
                try {
                    const cashfreePayment = await cashfreeService.getPayment(paymentOrder.cf_order_id);
                    
                    // Update payment status if changed
                    if (cashfreePayment.payment_status !== paymentOrder.payment_status) {
                        paymentOrder.payment_status = cashfreePayment.payment_status;
                        paymentOrder.cf_payment_id = cashfreePayment.cf_payment_id;
                        paymentOrder.payment_method = cashfreePayment.payment_method;
                        paymentOrder.payment_time = cashfreePayment.payment_time;
                        paymentOrder.updated_at = new Date();
                        await paymentOrder.save();
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error("Failed to fetch Cashfree payment status:", error);
                }
            }

            return c.json({
                success: true,
                data: paymentOrder,
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Get Order Status Error:", error);
            return c.json({
                success: false,
                message: "Failed to fetch order status",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Get all payment orders for student
     * GET /api/payments
     */
    static async getAllOrders(c: Context) {
        try {
            const student_id = c.get("user_id");
            const user_type = c.get("user_type");

            if (user_type?.toLowerCase() !== "student") {
                return c.json({ success: false, message: "Only students can view payment orders" }, 403);
            }

            const paymentOrders = await PaymentOrder.find({ student_id });

            return c.json({
                success: true,
                count: paymentOrders.length,
                data: paymentOrders,
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Get All Orders Error:", error);
            return c.json({
                success: false,
                message: "Failed to fetch payment orders",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Manually verify and update payment status from Cashfree
     * GET /api/cashfree-payments/verify/:order_id
     */
    static async verifyPayment(c: Context) {
        try {
            const student_id = c.get("user_id");
            const { order_id } = c.req.param();

            // eslint-disable-next-line no-console
            console.log(`🔍 Verifying payment for Order ID: ${order_id}`);

            // Find the payment order in database
            const result = await PaymentOrder.find({ order_id });
            const paymentOrder = result && result.rows.length > 0 ? result.rows[0] : null;

            if (!paymentOrder) {
                return c.json({ 
                    success: false, 
                    message: "Payment order not found in database"
                }, 404);
            }

            // Verify ownership
            if (paymentOrder.student_id !== student_id) {
                return c.json({ success: false, message: "Unauthorized access" }, 403);
            }

            if (!paymentOrder.cf_order_id) {
                return c.json({ 
                    success: false, 
                    message: "Cashfree order ID not found. Order may not have been created in Cashfree."
                }, 400);
            }

            // Get order details from Cashfree using our custom order_id (not cf_order_id)
            const cashfreeOrder = await cashfreeService.getOrder(order_id);
            
            // eslint-disable-next-line no-console
            console.log("📦 Cashfree Order Response:", JSON.stringify(cashfreeOrder, null, 2));

            // Update payment order based on Cashfree status
            let updated = false;
            
            if (cashfreeOrder.order_status === "PAID") {
                paymentOrder.payment_status = "SUCCESS";
                paymentOrder.order_status = "PAID";
                updated = true;

                // Get payment details if available
                if (cashfreeOrder.payments && cashfreeOrder.payments.length > 0) {
                    const payment = cashfreeOrder.payments[0];
                    paymentOrder.cf_payment_id = payment.cf_payment_id || "";
                    paymentOrder.payment_method = payment.payment_method || "";
                    paymentOrder.payment_time = payment.payment_time || new Date().toISOString();
                    paymentOrder.payment_amount = payment.payment_amount || paymentOrder.order_amount;
                }
            } else if (cashfreeOrder.order_status === "ACTIVE") {
                // Payment still pending
                paymentOrder.order_status = "ACTIVE";
            } else {
                // Payment failed or other status
                paymentOrder.order_status = cashfreeOrder.order_status;
                if (cashfreeOrder.order_status !== "ACTIVE") {
                    paymentOrder.payment_status = "FAILED";
                    updated = true;
                }
            }

            if (updated) {
                paymentOrder.updated_at = new Date();
                await paymentOrder.save();
                // eslint-disable-next-line no-console
                console.log(`✅ Payment order updated: ${paymentOrder.order_id} - Status: ${paymentOrder.payment_status}`);
            }

            return c.json({
                success: true,
                message: updated ? "Payment status updated successfully" : "No update needed",
                data: {
                    payment_order: paymentOrder,
                    cashfree_order: cashfreeOrder
                }
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("❌ Verify Payment Error:", error);
            return c.json({
                success: false,
                message: "Failed to verify payment",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Check split and settlement details from Cashfree
     * GET /api/cashfree-payments/check-split/:order_id
     */
    static async checkSplitDetails(c: Context) {
        try {
            const { order_id } = c.req.param();

            if (!order_id) {
                return c.json({ success: false, message: "order_id is required" }, 400);
            }

            // eslint-disable-next-line no-console
            console.log(`💰 Checking split details for Order ID: ${order_id}`);

            // Get split and settlement details from Cashfree
            const splitDetails = await cashfreeService.getSplitDetails([order_id]);
            
            // eslint-disable-next-line no-console
            console.log("📊 Split Details from Cashfree:", JSON.stringify(splitDetails, null, 2));

            return c.json({
                success: true,
                message: "Split details retrieved successfully",
                data: splitDetails
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("❌ Check Split Details Error:", error);
            return c.json({
                success: false,
                message: "Failed to retrieve split details",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Handle Cashfree webhook
     * POST /api/cashfree-payments/webhook
     */
    static async handleWebhook(c: Context) {
        try {
            const webhookData = await c.req.json();
            
            // eslint-disable-next-line no-console
            console.log("📥 Received Cashfree webhook:", JSON.stringify(webhookData, null, 2));

            const { type, data } = webhookData;

            // Handle payment success webhook
            if (type === "PAYMENT_SUCCESS_WEBHOOK" || type === CashfreeWebhookEvent.PAYMENT_SUCCESS) {
                const orderId = data.order?.order_id || data.order_id;
                
                if (!orderId) {
                    // eslint-disable-next-line no-console
                    console.error("❌ Webhook missing order_id");
                    return c.json({ success: false, message: "Missing order_id" }, 400);
                }

                // Find payment order
                const result = await PaymentOrder.find({ order_id: orderId });
                const paymentOrder = result && result.rows.length > 0 ? result.rows[0] : null;
                
                if (!paymentOrder) {
                    // eslint-disable-next-line no-console
                    console.error("❌ Payment order not found for webhook:", orderId);
                    return c.json({ success: false, message: "Order not found" }, 404);
                }

                // Verify payment status from Cashfree API (recommended approach)
                try {
                    const cfOrderId = paymentOrder.cf_order_id;
                    const cashfreeOrder = await cashfreeService.getOrder(cfOrderId);
                    
                    // eslint-disable-next-line no-console
                    console.log("✅ Verified payment from Cashfree API:", cashfreeOrder.order_status);

                    // Update payment order based on verified status
                    if (cashfreeOrder.order_status === "PAID") {
                        paymentOrder.payment_status = "SUCCESS";
                        paymentOrder.order_status = "PAID";
                        
                        // Get payment details if available
                        if (cashfreeOrder.payments && cashfreeOrder.payments.length > 0) {
                            const payment = cashfreeOrder.payments[0];
                            paymentOrder.cf_payment_id = payment.cf_payment_id || "";
                            paymentOrder.payment_method = payment.payment_method || "";
                            paymentOrder.payment_time = payment.payment_time || new Date().toISOString();
                            paymentOrder.payment_amount = payment.payment_amount || paymentOrder.order_amount;
                        }
                        
                        paymentOrder.updated_at = new Date();
                        await paymentOrder.save();

                        // eslint-disable-next-line no-console
                        console.log("✅ Payment success webhook processed:", paymentOrder.order_id);
                    }
                } catch (verifyError) {
                    // eslint-disable-next-line no-console
                    console.error("❌ Failed to verify payment from Cashfree:", verifyError);
                    // Continue processing even if verification fails
                    
                    // Fallback: Update based on webhook data
                    paymentOrder.payment_status = "SUCCESS";
                    paymentOrder.order_status = "PAID";
                    paymentOrder.updated_at = new Date();
                    await paymentOrder.save();
                }

                return c.json({ success: true, message: "Webhook processed successfully" });
            }

            // Handle payment failed webhook
            if (type === "PAYMENT_FAILED_WEBHOOK" || type === CashfreeWebhookEvent.PAYMENT_FAILED) {
                const orderId = data.order?.order_id || data.order_id;
                
                const result = await PaymentOrder.find({ order_id: orderId });
                const paymentOrder = result && result.rows.length > 0 ? result.rows[0] : null;
                
                if (paymentOrder) {
                    paymentOrder.payment_status = "FAILED";
                    paymentOrder.order_status = "FAILED";
                    paymentOrder.updated_at = new Date();
                    await paymentOrder.save();

                    // eslint-disable-next-line no-console
                    console.log("❌ Payment failed webhook processed:", paymentOrder.order_id);
                }

                return c.json({ success: true, message: "Webhook processed successfully" });
            }

            // Handle settlement webhook
            if (type === "SETTLEMENT_WEBHOOK" || type === CashfreeWebhookEvent.SETTLEMENT_WEBHOOK) {
                const settlement = data.settlement;

                // Update settlement status for all orders in this settlement
                if (settlement && settlement.order_ids && settlement.order_ids.length > 0) {
                    for (const orderId of settlement.order_ids) {
                        const result = await PaymentOrder.find({ order_id: orderId });
                        const paymentOrder = result && result.rows.length > 0 ? result.rows[0] : null;
                        
                        if (paymentOrder) {
                            paymentOrder.settlement_status = "SETTLED";
                            paymentOrder.settlement_id = settlement.settlement_id;
                            paymentOrder.settlement_date = settlement.settlement_date;
                            paymentOrder.updated_at = new Date();
                            await paymentOrder.save();
                        }
                    }

                    // eslint-disable-next-line no-console
                    console.log("💰 Settlement webhook processed:", settlement.settlement_id);
                }

                return c.json({ success: true, message: "Webhook processed successfully" });
            }

            // eslint-disable-next-line no-console
            console.log("ℹ️ Unknown webhook type:", type);
            return c.json({ success: true, message: "Webhook received" });
            
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("❌ Webhook Handler Error:", error);
            return c.json({
                success: false,
                message: "Failed to process webhook",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }
}
