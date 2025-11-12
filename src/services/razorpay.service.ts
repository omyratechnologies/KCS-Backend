import Razorpay from "razorpay";
import crypto from "crypto";

interface RazorpayConfig {
    key_id: string;
    key_secret: string;
}

interface CreateOrderOptions {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string | number | boolean>;
}

interface CreateTransferOptions {
    account: string;
    amount: number;
    currency: string;
    notes?: Record<string, string | number | boolean>;
    linked_account_notes?: string[];
    on_hold?: boolean;
}

interface VerifyPaymentSignature {
    order_id: string;
    payment_id: string;
    signature: string;
}

interface WebhookVerification {
    webhook_signature: string;
    webhook_body: string;
    webhook_secret: string;
}

class RazorpayService {
    private razorpayInstance: Razorpay | null = null;

    /**
     * Initialize Razorpay instance with credentials
     */
    initialize(config: RazorpayConfig): void {
        this.razorpayInstance = new Razorpay({
            key_id: config.key_id,
            key_secret: config.key_secret,
        });
    }

    /**
     * Get the Razorpay instance
     */
    private getInstance(): Razorpay {
        if (!this.razorpayInstance) {
            throw new Error("Razorpay is not initialized. Please call initialize() first.");
        }
        return this.razorpayInstance;
    }

    /**
     * Create a Razorpay order
     */
    async createOrder(options: CreateOrderOptions): Promise<unknown> {
        const instance = this.getInstance();
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderOptions: any = {
            amount: options.amount * 100, // Convert to paise
            currency: options.currency,
            receipt: options.receipt,
            notes: options.notes || {},
        };

        try {
            const order = await instance.orders.create(orderOptions);
            return order;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to create order: ${errorMessage}`);
        }
    }

    /**
     * Fetch order details
     */
    async fetchOrder(orderId: string): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const order = await instance.orders.fetch(orderId);
            return order;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch order: ${errorMessage}`);
        }
    }

    /**
     * Fetch payment details
     */
    async fetchPayment(paymentId: string): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const payment = await instance.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch payment: ${errorMessage}`);
        }
    }

    /**
     * Capture a payment
     */
    async capturePayment(paymentId: string, amount: number, currency: string = "INR"): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const payment = await instance.payments.capture(paymentId, amount * 100, currency);
            return payment;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to capture payment: ${errorMessage}`);
        }
    }

    /**
     * Create a route transfer (split payment at capture)
     * This transfers money to the linked account (school)
     */
    async createTransfer(paymentId: string, options: CreateTransferOptions): Promise<unknown> {
        const instance = this.getInstance();
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transferOptions: any = {
            account: options.account, // Linked account ID
            amount: options.amount * 100, // Convert to paise
            currency: options.currency,
            notes: options.notes || {},
            linked_account_notes: options.linked_account_notes || [],
            on_hold: options.on_hold || false, // If true, transfer is on hold
        };

        try {
            const transfer = await instance.payments.transfer(paymentId, transferOptions);
            return transfer;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to create transfer: ${errorMessage}`);
        }
    }

    /**
     * Fetch transfer details
     */
    async fetchTransfer(transferId: string): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const transfer = await instance.transfers.fetch(transferId);
            return transfer;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch transfer: ${errorMessage}`);
        }
    }

    /**
     * Fetch all transfers for a payment
     */
    async fetchPaymentTransfers(paymentId: string): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const transfers = await instance.payments.fetchTransfer(paymentId);
            return transfers;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch payment transfers: ${errorMessage}`);
        }
    }

    /**
     * Reverse a transfer (refund to platform account)
     */
    async reverseTransfer(transferId: string, amount?: number): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const reversal = amount 
                ? await instance.transfers.reverse(transferId, { amount: amount * 100 })
                : await instance.transfers.reverse(transferId);
            return reversal;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to reverse transfer: ${errorMessage}`);
        }
    }

    /**
     * Create a refund
     */
    async createRefund(paymentId: string, amount?: number, notes?: Record<string, unknown>): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const refundOptions: Record<string, unknown> = {
                notes: notes || {},
            };
            
            if (amount) {
                refundOptions.amount = amount * 100;
            }
            
            const refund = await instance.payments.refund(paymentId, refundOptions);
            return refund;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to create refund: ${errorMessage}`);
        }
    }

    /**
     * Fetch refund details
     */
    async fetchRefund(refundId: string): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const refund = await instance.refunds.fetch(refundId);
            return refund;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch refund: ${errorMessage}`);
        }
    }

    /**
     * Verify payment signature
     */
    verifyPaymentSignature(data: VerifyPaymentSignature, keySecret: string): boolean {
        try {
            const text = `${data.order_id}|${data.payment_id}`;
            const generated_signature = crypto
                .createHmac("sha256", keySecret)
                .update(text)
                .digest("hex");
            
            return generated_signature === data.signature;
        } catch {
            return false;
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(data: WebhookVerification): boolean {
        try {
            const generated_signature = crypto
                .createHmac("sha256", data.webhook_secret)
                .update(data.webhook_body)
                .digest("hex");
            
            return generated_signature === data.webhook_signature;
        } catch {
            return false;
        }
    }

    /**
     * Fetch all payments with filters
     */
    async fetchAllPayments(options: {
        from?: number;
        to?: number;
        count?: number;
        skip?: number;
    } = {}): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const payments = await instance.payments.all(options);
            return payments;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch payments: ${errorMessage}`);
        }
    }

    /**
     * Fetch all orders with filters
     */
    async fetchAllOrders(options: {
        from?: number;
        to?: number;
        count?: number;
        skip?: number;
        authorized?: boolean;
        receipt?: string;
    } = {}): Promise<unknown> {
        const instance = this.getInstance();
        
        try {
            const orders = await instance.orders.all(options);
            return orders;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new Error(`Failed to fetch orders: ${errorMessage}`);
        }
    }
}

// Export a singleton instance
export const razorpayService = new RazorpayService();
export { RazorpayService };
