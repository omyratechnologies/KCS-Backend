/**
 * Payment Order Controller
 * Students create payment orders with automatic vendor splits
 */

import { Context } from "hono";
import { PaymentOrder } from "../models/payment_order.model";
import { ClassFeeStructure } from "../models/class_fee_structure.model";
import { CampusVendor } from "../models/campus_vendor.model";
import { User } from "../models/user.model";
import { cashfreeService } from "../services/cashfree.service";
import { CashfreeWebhookEvent, PaymentMode } from "../types/payment-gateway.types";
// role middleware "../middlewares/role.middleware"
import { roleMiddleware } from "../middlewares/role.middleware";


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
                return_url,
            } = body;

            // Validation
            if (!fee_structure_id || !payment_type) {
                return c.json({ 
                    success: false, 
                    message: "Missing required fields: fee_structure_id, payment_type" 
                }, 400);
            }

            if (payment_type === PaymentMode.INSTALLMENT && !installment_number) {
                return c.json({ success: false, message: "installment_number is required for installment payments" }, 400);
            }

            // Auto-fetch student details from User model
            const student = await User.findById(student_id);
            if (!student) {
                return c.json({ success: false, message: "Student not found" }, 404);
            }

            const customer_name = `${student.first_name} ${student.last_name}`.trim();
            const customer_email = student.email;
            const customer_phone = student.phone;

            if (!customer_name || !customer_email || !customer_phone) {
                return c.json({ 
                    success: false, 
                    message: "Student profile incomplete. Please update your name, email, and phone number." 
                }, 400);
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

            // ===== PAYMENT VALIDATION: Check payment history =====
            
            // Get all successful payments for this student and fee structure
            const existingPaymentsQuery = await PaymentOrder.find({
                student_id,
                fee_structure_id,
                payment_status: "SUCCESS",
            });
            const existingPayments = existingPaymentsQuery && existingPaymentsQuery.rows ? existingPaymentsQuery.rows : [];
            
            // Calculate total already paid
            const total_already_paid = existingPayments.reduce((sum, payment) => sum + payment.order_amount, 0);
            
            // Check if student has already paid the full amount
            if (total_already_paid >= feeStructure.total_amount) {
                return c.json({ 
                    success: false, 
                    message: `Payment limit reached. You have already paid ₹${total_already_paid} out of ₹${feeStructure.total_amount}. No further payments allowed.`,
                    total_paid: total_already_paid,
                    total_due: feeStructure.total_amount,
                }, 400);
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
            
            // eslint-disable-next-line no-console
            console.log("Payment request:", { payment_type, installment_number, PaymentModeEnum: PaymentMode });
            
            if (payment_type === PaymentMode.ONE_TIME) {
                order_amount = feeStructure.one_time_amount;
                
                // Check if one-time payment would exceed total
                if (total_already_paid + order_amount > feeStructure.total_amount) {
                    return c.json({ 
                        success: false, 
                        message: `Cannot process one-time payment. You have already paid ₹${total_already_paid}. Paying ₹${order_amount} would exceed the total fee of ₹${feeStructure.total_amount}.`,
                        total_paid: total_already_paid,
                        total_due: feeStructure.total_amount,
                    }, 400);
                }
                
            } else if (payment_type === PaymentMode.INSTALLMENT) {
                const installment = feeStructure.installments.find(
                    (inst) => inst.installment_number === installment_number
                );
                if (!installment) {
                    return c.json({ success: false, message: "Installment not found" }, 404);
                }
                
                // Check if this installment is already paid
                const installmentAlreadyPaid = existingPayments.some(
                    payment => payment.payment_type === PaymentMode.INSTALLMENT && 
                               payment.installment_number === installment_number
                );
                
                if (installmentAlreadyPaid) {
                    return c.json({ 
                        success: false, 
                        message: `Installment ${installment_number} has already been paid.`,
                    }, 400);
                }
                
                // STRICT: Must pay EXACT installment amount
                order_amount = installment.amount;
                installment_description = installment.description || `Installment ${installment_number}`;
                
                // eslint-disable-next-line no-console
                console.log("Installment payment:", { installment_number, order_amount, installment });
                
                // Check if this payment would exceed total
                if (total_already_paid + order_amount > feeStructure.total_amount) {
                    return c.json({ 
                        success: false, 
                        message: `Cannot process installment ${installment_number}. You have already paid ₹${total_already_paid}. Paying ₹${order_amount} would exceed the total fee of ₹${feeStructure.total_amount}.`,
                        total_paid: total_already_paid,
                        total_due: feeStructure.total_amount,
                        remaining: feeStructure.total_amount - total_already_paid,
                    }, 400);
                }
            }

            if (order_amount <= 0) {
                return c.json({ success: false, message: "Invalid order amount" }, 400);
            }

            // Calculate vendor split amount (100% to vendor)
            const vendor_split_amount = order_amount;

            // Generate unique order ID
            const timestamp = Date.now();
            const order_id = `ORD_${feeStructure.campus_id}_${student_id}_${timestamp}`;

            // Create order in database first
            const paymentOrder = new PaymentOrder({
                order_id,
                cf_order_id: "", // Will be updated after Cashfree order creation
                student_id,
                campus_id: feeStructure.campus_id,
                class_id: feeStructure.class_id,
                fee_structure_id,
                payment_type,
                installment_number: payment_type === PaymentMode.INSTALLMENT ? installment_number : undefined,
                order_amount,
                order_currency: "INR",
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
                        customer_name,
                        customer_email,
                        customer_phone,
                    },
                    order_note: payment_type === PaymentMode.ONE_TIME 
                        ? `${feeStructure.class_name} - ${feeStructure.academic_year} - One Time Payment`
                        : `${feeStructure.class_name} - ${feeStructure.academic_year} - ${installment_description}`,
                    order_meta: {
                        return_url: (return_url && return_url.startsWith('http')) ? return_url : `http://localhost:3000/payment/success`,
                        notify_url: process.env.CASHFREE_WEBHOOK_URL || `http://localhost:4500/api/cashfree-payments/webhook`,
                    },
                    order_expiry_time: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 minutes from now (Cashfree requires >15 min)
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
                    // Use our order_id (not cf_order_id) to query Cashfree
                    const cashfreeOrder = await cashfreeService.getOrder(orderId);
                    
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

    /**
     * Get student's payment history
     * GET /api/cashfree-payments/my-payments
     */
    /**
     * Sync all pending payments with Cashfree
     * GET /api/cashfree-payments/sync-payments
     */
    static async syncPaymentsWithCashfree(c: Context) {
        try {
            const user_id = c.get("user_id");
            const user_type = c.get("user_type");

            // Only students and admins can sync
            if (!user_id) {
                return c.json({ success: false, message: "Unauthorized" }, 401);
            }

            // Get student_id based on user type
            let student_id = user_id;
            let syncAll = false;

            if (user_type?.toLowerCase() === "admin") {
                // Admin can sync all payments or specific student
                const queryStudentId = c.req.query("student_id");
                if (queryStudentId) {
                    student_id = queryStudentId;
                } else {
                    syncAll = true;
                }
            }

            // eslint-disable-next-line no-console
            console.log(`🔄 Starting payment sync... ${syncAll ? 'ALL STUDENTS' : `Student: ${student_id}`}`);

            // Fetch pending/active payments
            const query = syncAll 
                ? { order_status: "ACTIVE" }
                : { student_id, order_status: "ACTIVE" };

            const result = await PaymentOrder.find(query);
            const pendingPayments = result && result.rows ? result.rows : [];

            // eslint-disable-next-line no-console
            console.log(`📋 Found ${pendingPayments.length} pending payments to sync`);

            let updatedCount = 0;
            let paidCount = 0;
            let failedCount = 0;
            const errors: string[] = [];

            // Sync each payment with Cashfree
            for (const payment of pendingPayments) {
                try {
                    // Get order status from Cashfree using our order_id
                    const cashfreeOrder = await cashfreeService.getOrder(payment.order_id);
                    
                    // eslint-disable-next-line no-console
                    console.log(`📡 Cashfree status for ${payment.order_id}: ${cashfreeOrder.order_status}`);

                    // Update based on Cashfree status
                    if (cashfreeOrder.order_status === "PAID") {
                        payment.payment_status = "SUCCESS";
                        payment.order_status = "PAID";
                        
                        // Get payment details
                        if (cashfreeOrder.payments && cashfreeOrder.payments.length > 0) {
                            const cfPayment = cashfreeOrder.payments[0];
                            payment.cf_payment_id = cfPayment.cf_payment_id || payment.cf_payment_id;
                            payment.payment_method = cfPayment.payment_method || payment.payment_method;
                            payment.payment_time = cfPayment.payment_time || payment.payment_time;
                        }
                        
                        payment.updated_at = new Date();
                        await payment.save();
                        
                        updatedCount++;
                        paidCount++;
                        
                        // eslint-disable-next-line no-console
                        console.log(`✅ Updated ${payment.order_id} to PAID`);
                        
                    } else if (cashfreeOrder.order_status === "EXPIRED") {
                        payment.payment_status = "FAILED";
                        payment.order_status = "EXPIRED";
                        payment.updated_at = new Date();
                        await payment.save();
                        
                        updatedCount++;
                        failedCount++;
                        
                        // eslint-disable-next-line no-console
                        console.log(`⏰ Updated ${payment.order_id} to EXPIRED`);
                        
                    } else if (cashfreeOrder.order_status === "ACTIVE") {
                        // Still active, no update needed
                        // eslint-disable-next-line no-console
                        console.log(`⏳ ${payment.order_id} still ACTIVE/PENDING`);
                    }
                    
                } catch (error) {
                    const errorMsg = `Failed to sync ${payment.order_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMsg);
                    // eslint-disable-next-line no-console
                    console.error(`❌ ${errorMsg}`);
                }
            }

            // eslint-disable-next-line no-console
            console.log(`✅ Sync complete: ${updatedCount} updated (${paidCount} paid, ${failedCount} expired/failed)`);

            return c.json({
                success: true,
                message: "Payment sync completed",
                data: {
                    total_checked: pendingPayments.length,
                    total_updated: updatedCount,
                    paid_count: paidCount,
                    expired_failed_count: failedCount,
                    errors: errors.length > 0 ? errors : undefined,
                },
            });

        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("❌ Payment Sync Error:", error);
            return c.json({
                success: false,
                message: "Failed to sync payments",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    static async getMyPayments(c: Context) {
        try {
            const student_id = c.get("user_id");
            const user_type = c.get("user_type");

            // Check if user is a student
            if (!user_type || user_type !== "Student") {
                return c.json({ 
                    success: false, 
                    message: "Unauthorized - Only students can view their payment history" 
                }, 403);
            }

            // Fetch all payments for this student
            const result = await PaymentOrder.find({ student_id });
            const payments = result && result.rows ? result.rows : [];

            // Sort by created_at descending (newest first)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payments.sort((a: any, b: any) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA;
            });

            // Fetch fee structure details for each payment
            const paymentsWithDetails = await Promise.all(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                payments.map(async (payment: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let feeStructure: any = null;
                    if (payment.fee_structure_id) {
                        try {
                            const feeResult = await ClassFeeStructure.find({ id: payment.fee_structure_id });
                            feeStructure = feeResult && feeResult.rows.length > 0 ? feeResult.rows[0] : null;
                        } catch (err) {
                            // eslint-disable-next-line no-console
                            console.error("Error fetching fee structure:", err);
                        }
                    }

                    return {
                        order_id: payment.order_id,
                        cf_order_id: payment.cf_order_id,
                        order_amount: payment.order_amount,
                        payment_type: payment.payment_type,
                        installment_number: payment.installment_number,
                        payment_status: payment.payment_status,
                        order_status: payment.order_status,
                        payment_method: payment.payment_method,
                        payment_time: payment.payment_time,
                        created_at: payment.created_at,
                        settlement_status: payment.settlement_status,
                        fee_structure: feeStructure ? {
                            class_name: feeStructure.class_name,
                            academic_year: feeStructure.academic_year,
                            total_amount: feeStructure.total_amount,
                            fee_description: feeStructure.fee_description,
                        } : null,
                    };
                })
            );

            return c.json({
                success: true,
                data: {
                    student_id,
                    total_payments: paymentsWithDetails.length,
                    payments: paymentsWithDetails,
                },
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("❌ Get My Payments Error:", error);
            return c.json({
                success: false,
                message: "Failed to fetch payments",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }

    /**
     * Get student payment history by student ID (admin only)
     * GET /api/cashfree-payments/student/:student_id/payments
     */
    static async getStudentPayments(c: Context) {
        try {
            const user_type = c.get("user_type");
            if (!user_type || user_type !== "Admin") {
                return c.json({ success: false, message: "Unauthorized - Admin access required" }, 403);
            }

            const student_id = c.req.param("student_id");
            if (!student_id) {
                return c.json({ success: false, message: "Student ID is required" }, 400);
            }

            // Fetch all payments for this student
            const result = await PaymentOrder.find({ student_id });
            const payments = result && result.rows ? result.rows : [];

            // Sort by created_at descending (newest first)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            payments.sort((a: any, b: any) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return dateB - dateA;
            });

            // Fetch fee structure details for each payment
            const paymentsWithDetails = await Promise.all(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                payments.map(async (payment: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let feeStructure: any = null;
                    if (payment.fee_structure_id) {
                        try {
                            const feeResult = await ClassFeeStructure.find({ id: payment.fee_structure_id });
                            feeStructure = feeResult && feeResult.rows.length > 0 ? feeResult.rows[0] : null;
                        } catch (err) {
                            // eslint-disable-next-line no-console
                            console.error("Error fetching fee structure:", err);
                        }
                    }

                    return {
                        order_id: payment.order_id,
                        cf_order_id: payment.cf_order_id,
                        order_amount: payment.order_amount,
                        payment_type: payment.payment_type,
                        installment_number: payment.installment_number,
                        payment_status: payment.payment_status,
                        order_status: payment.order_status,
                        payment_method: payment.payment_method,
                        payment_time: payment.payment_time,
                        created_at: payment.created_at,
                        settlement_status: payment.settlement_status,
                        fee_structure: feeStructure ? {
                            class_name: feeStructure.class_name,
                            academic_year: feeStructure.academic_year,
                            total_amount: feeStructure.total_amount,
                            fee_description: feeStructure.fee_description,
                        } : null,
                    };
                })
            );

            return c.json({
                success: true,
                data: {
                    student_id,
                    total_payments: paymentsWithDetails.length,
                    payments: paymentsWithDetails,
                },
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("❌ Get Student Payments Error:", error);
            return c.json({
                success: false,
                message: "Failed to fetch student payments",
                error: error instanceof Error ? error.message : "Unknown error",
            }, 500);
        }
    }
}
