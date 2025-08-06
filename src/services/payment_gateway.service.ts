import crypto from "node:crypto";

export interface PaymentGatewayConfig {
    razorpay?: {
        key_id: string;
        key_secret: string;
        webhook_secret: string;
        enabled: boolean;
    };
    payu?: {
        merchant_key: string;
        merchant_salt: string;
        enabled: boolean;
    };
    cashfree?: {
        app_id: string;
        secret_key: string;
        enabled: boolean;
    };
}

export interface PaymentOrderRequest {
    amount: number;
    currency: string;
    receipt: string;
    student_id: string;
    parent_id?: string;
    fee_id: string;
    campus_id: string;
    callback_url: string;
    cancel_url: string;
}

export interface PaymentOrderResponse {
    order_id: string;
    payment_url?: string;
    payment_form_data?: object;
    gateway_order_id: string;
    status: string;
}

export interface PaymentVerificationRequest {
    gateway: string;
    payment_id: string;
    order_id: string;
    signature: string;
    amount: number;
}

export const PaymentGatewayService = {
    /**
     * Create payment order with Razorpay
     */
    async createRazorpayOrder(
        config: PaymentGatewayConfig["razorpay"],
        orderRequest: PaymentOrderRequest
    ): Promise<PaymentOrderResponse> {
        if (!config || !config.enabled) {
            throw new Error("Razorpay is not enabled");
        }

        try {
            // For production, install razorpay package: npm install razorpay
            // For now, we'll simulate the API call
            const simulatedOrder = {
                id: `rzp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
                status: "created",
                amount: orderRequest.amount * 100,
                currency: orderRequest.currency,
                receipt: orderRequest.receipt,
            };

            return {
                order_id: simulatedOrder.id,
                gateway_order_id: simulatedOrder.id,
                status: simulatedOrder.status,
            };
        } catch (error: any) {
            console.error("Razorpay order creation failed:", error);
            throw new Error(`Razorpay order creation failed: ${error?.message || "Unknown error"}`);
        }
    },

    /**
     * Create payment order with PayU
     */
    async createPayUOrder(
        config: PaymentGatewayConfig["payu"],
        orderRequest: PaymentOrderRequest
    ): Promise<PaymentOrderResponse> {
        if (!config || !config.enabled) {
            throw new Error("PayU is not enabled");
        }

        try {
            const txnid = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
            const productinfo = `Fee Payment - ${orderRequest.fee_id}`;
            const firstname = `Student_${orderRequest.student_id}`;
            const email = "payment@school.com"; // This should come from student details
            const phone = "9999999999"; // This should come from student details

            // Create hash
            const hashString = `${config.merchant_key}|${txnid}|${orderRequest.amount}|${productinfo}|${firstname}|${email}|||||||||||${config.merchant_salt}`;
            const hash = crypto.createHash("sha512").update(hashString).digest("hex");

            const formData = {
                key: config.merchant_key,
                txnid: txnid,
                amount: orderRequest.amount,
                productinfo: productinfo,
                firstname: firstname,
                email: email,
                phone: phone,
                surl: orderRequest.callback_url,
                furl: orderRequest.cancel_url,
                hash: hash,
                udf1: orderRequest.student_id,
                udf2: orderRequest.parent_id,
                udf3: orderRequest.fee_id,
                udf4: orderRequest.campus_id,
            };

            return {
                order_id: txnid,
                gateway_order_id: txnid,
                payment_form_data: formData,
                payment_url: "https://secure.payu.in/_payment", // Use test URL for sandbox
                status: "created",
            };
        } catch (error: any) {
            console.error("PayU order creation failed:", error);
            throw new Error(`PayU order creation failed: ${error?.message || "Unknown error"}`);
        }
    },

    /**
     * Create payment order with Cashfree
     */
    async createCashfreeOrder(
        config: PaymentGatewayConfig["cashfree"],
        orderRequest: PaymentOrderRequest
    ): Promise<PaymentOrderResponse> {
        if (!config || !config.enabled) {
            throw new Error("Cashfree is not enabled");
        }

        try {
            const orderId = `CF_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

            const orderData = {
                order_id: orderId,
                order_amount: orderRequest.amount,
                order_currency: orderRequest.currency,
                customer_details: {
                    customer_id: orderRequest.student_id,
                    customer_phone: "9999999999", // This should come from student details
                    customer_email: "payment@school.com", // This should come from student details
                },
                order_meta: {
                    return_url: orderRequest.callback_url,
                    notify_url: `${orderRequest.callback_url}/webhook`,
                },
                order_note: `Fee Payment - ${orderRequest.fee_id}`,
            };

            // Here you would make API call to Cashfree
            // For now, we'll simulate the response
            return {
                order_id: orderId,
                gateway_order_id: orderId,
                payment_url: `https://sandbox.cashfree.com/pg/orders/${orderId}/pay`,
                status: "ACTIVE",
            };
        } catch (error: any) {
            console.error("Cashfree order creation failed:", error);
            throw new Error(`Cashfree order creation failed: ${error?.message || "Unknown error"}`);
        }
    },

    /**
     * Verify Razorpay payment
     */
    verifyRazorpayPayment(config: PaymentGatewayConfig["razorpay"], verification: PaymentVerificationRequest): boolean {
        if (!config || !config.enabled) {
            throw new Error("Razorpay is not enabled");
        }

        try {
            const body = verification.order_id + "|" + verification.payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", config.key_secret)
                .update(body.toString())
                .digest("hex");

            return expectedSignature === verification.signature;
        } catch (error) {
            console.error("Razorpay payment verification failed:", error);
            return false;
        }
    },

    /**
     * Verify PayU payment
     */
    verifyPayUPayment(
        config: PaymentGatewayConfig["payu"],
        verification: PaymentVerificationRequest & {
            status: string;
            txnid: string;
            amount: string;
            productinfo: string;
            firstname: string;
            email: string;
        }
    ): boolean {
        if (!config || !config.enabled) {
            throw new Error("PayU is not enabled");
        }

        try {
            const hashString = `${config.merchant_salt}|${verification.status}|||||||||||${verification.email}|${verification.firstname}|${verification.productinfo}|${verification.amount}|${verification.txnid}|${config.merchant_key}`;
            const hash = crypto.createHash("sha512").update(hashString).digest("hex");

            return hash === verification.signature;
        } catch (error) {
            console.error("PayU payment verification failed:", error);
            return false;
        }
    },

    /**
     * Verify Cashfree payment
     */
    verifyCashfreePayment(config: PaymentGatewayConfig["cashfree"], verification: PaymentVerificationRequest): boolean {
        if (!config || !config.enabled) {
            throw new Error("Cashfree is not enabled");
        }

        try {
            // Cashfree verification logic would go here
            // For now, we'll simulate verification
            return true;
        } catch (error) {
            console.error("Cashfree payment verification failed:", error);
            return false;
        }
    },

    /**
     * Get available payment gateways for a campus
     */
    getAvailableGateways(config: PaymentGatewayConfig): string[] {
        const gateways: string[] = [];

        if (config.razorpay?.enabled) {
            gateways.push("razorpay");
        }
        if (config.payu?.enabled) {
            gateways.push("payu");
        }
        if (config.cashfree?.enabled) {
            gateways.push("cashfree");
        }

        return gateways;
    },
};
