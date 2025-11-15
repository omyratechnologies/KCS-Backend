/**
 * Cashfree Payment Gateway Service
 * Implements Cashfree Easy Split for vendor management and split payments
 */

import crypto from "crypto";
import { ICashfreeVendor, ICashfreeSplit, ICashfreeOrderResponse, ICashfreePaymentResponse } from "../types/payment-gateway.types";

class CashfreeService {
    private clientId: string;
    private clientSecret: string;
    private baseUrl: string;
    private apiVersion: string;

    constructor() {
        this.clientId = process.env.CASHFREE_CLIENT_ID || "";
        this.clientSecret = process.env.CASHFREE_CLIENT_SECRET || "";
        this.baseUrl = process.env.CASHFREE_ENV === "production" 
            ? "https://api.cashfree.com" 
            : "https://sandbox.cashfree.com";
        this.apiVersion = "2022-09-01";
    }

    /**
     * Get authorization headers for Cashfree API
     */
    private getHeaders(): Record<string, string> {
        return {
            "x-client-id": this.clientId,
            "x-client-secret": this.clientSecret,
            "x-api-version": this.apiVersion,
            "Content-Type": "application/json",
        };
    }

    /**
     * Create a vendor (school account) in Cashfree Easy Split
     */
    async createVendor(vendorData: ICashfreeVendor): Promise<ICashfreeVendor> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/vendors`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(vendorData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Vendor Creation Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Get vendor details by vendor_id
     */
    async getVendor(vendorId: string): Promise<ICashfreeVendor> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/vendors/${vendorId}`, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Get Vendor Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Update vendor details
     */
    async updateVendor(vendorId: string, vendorData: Partial<ICashfreeVendor>): Promise<ICashfreeVendor> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/vendors/${vendorId}`, {
            method: "PATCH",
            headers: this.getHeaders(),
            body: JSON.stringify(vendorData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Update Vendor Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Upload vendor KYC documents
     */
    async uploadVendorDocument(vendorId: string, formData: FormData): Promise<{ message: string; doc_name: string }> {
        const headers = {
            "x-client-id": this.clientId,
            "x-client-secret": this.clientSecret,
            "x-api-version": this.apiVersion,
            // Don't set Content-Type for multipart/form-data - browser/fetch will set it with boundary
        };

        const response = await fetch(`${this.baseUrl}/pg/easy-split/vendor-docs/${vendorId}`, {
            method: "POST",
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Upload Document Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Get all vendor documents status
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getVendorDocuments(vendorId: string): Promise<any[]> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/vendor-docs/${vendorId}`, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Get Vendor Documents Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Create an order with optional split configuration
     */
    async createOrder(orderData: {
        order_id: string;
        order_amount: number;
        order_currency: string;
        customer_details: {
            customer_id: string;
            customer_email: string;
            customer_phone: string;
            customer_name: string;
        };
        order_note?: string;
        order_meta?: {
            return_url?: string;
            notify_url?: string;
            payment_methods?: string;
        };
        order_splits?: ICashfreeSplit[];
    }): Promise<ICashfreeOrderResponse> {
        const response = await fetch(`${this.baseUrl}/pg/orders`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Create Order Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Get order details by order ID
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getOrder(orderId: string): Promise<any> {
        const response = await fetch(`${this.baseUrl}/pg/orders/${orderId}`, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Get Order Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Create split after payment (split after payment feature)
     */
    async createSplitAfterPayment(orderId: string, splitData: {
        split: ICashfreeSplit[];
        disable_split?: boolean;
    }): Promise<{ message: string }> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/orders/${orderId}/split`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(splitData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Create Split Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * End split for an order (disable future splits)
     */
    async endSplit(orderId: string): Promise<{ message: string }> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/orders/${orderId}/split`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({ disable_split: true }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree End Split Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Get split and settlement details by order ID
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getSplitDetails(orderIds: string[]): Promise<any> {
        const response = await fetch(`${this.baseUrl}/pg/split/order/vendor/recon`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({
                filters: {
                    start_date: null,
                    end_date: null,
                    order_ids: orderIds,
                },
                pagination: {
                    limit: 10,
                    cursor: null,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Get Split Details Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Create refund with split refund configuration
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async createRefund(orderId: string, refundData: {
        refund_amount: number;
        refund_id: string;
        refund_note?: string;
        refund_splits?: Array<{
            vendor_id: string;
            amount: number;
            tags?: Record<string, string>;
        }>;
        refund_speed?: "STANDARD" | "INSTANT";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }): Promise<any> {
        const response = await fetch(`${this.baseUrl}/pg/orders/${orderId}/refunds`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(refundData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Create Refund Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Get vendor on-demand balance
     */
    async getVendorBalance(vendorId: string): Promise<{
        vendor_id: string;
        available_balance: number;
        pending_balance: number;
        currency: string;
    }> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/vendors/${vendorId}/balances`, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Get Vendor Balance Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Get on-demand settlement charges
     */
    async getSettlementCharges(amount: number): Promise<{
        amount: number;
        charges: number;
        net_amount: number;
        gst: number;
    }> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/amount/${amount}/charges?rateType=VENDOR_OD`, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Get Charges Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Create on-demand transfer to vendor
     */
    async createOnDemandTransfer(vendorId: string, transferData: {
        transfer_from: "VENDOR" | "MERCHANT";
        transfer_type: "ON_DEMAND" | "ADJUSTMENT";
        transfer_amount: number;
        remark?: string;
        tags?: Record<string, string>;
    }): Promise<{
        transfer_id: string;
        status: string;
        message: string;
    }> {
        const response = await fetch(`${this.baseUrl}/pg/easy-split/vendors/${vendorId}/transfer`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify(transferData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Create Transfer Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Vendor reconciliation
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getVendorRecon(filters: {
        merchant_vendor_id?: string;
        settlement_id?: number;
        start_date?: string;
        end_date?: string;
    }, pagination?: {
        limit?: number;
        cursor?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }): Promise<any> {
        const response = await fetch(`${this.baseUrl}/pg/recon/vendor`, {
            method: "POST",
            headers: this.getHeaders(),
            body: JSON.stringify({
                filters,
                pagination: pagination || { limit: 25, cursor: null },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Vendor Recon Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(webhookBody: string, signature: string, timestamp: string): boolean {
        try {
            const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || "";
            const signedPayload = `${timestamp}${webhookBody}`;
            const expectedSignature = crypto
                .createHmac("sha256", webhookSecret)
                .update(signedPayload)
                .digest("base64");

            return expectedSignature === signature;
        } catch {
            return false;
        }
    }

    /**
     * Get payment details
     */
    async getPayment(orderId: string): Promise<ICashfreePaymentResponse> {
        const response = await fetch(`${this.baseUrl}/pg/orders/${orderId}/payments`, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Cashfree Get Payment Failed: ${JSON.stringify(error)}`);
        }

        return await response.json();
    }
}

export const cashfreeService = new CashfreeService();
export default CashfreeService;
