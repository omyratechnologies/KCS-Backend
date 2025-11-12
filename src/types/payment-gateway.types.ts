/**
 * Payment Gateway Types and Interfaces
 * Supports multiple payment gateways: Cashfree (primary), Razorpay (secondary)
 */

export enum PaymentGateway {
    CASHFREE = "cashfree",
    RAZORPAY = "razorpay",
}

export enum PaymentMode {
    ONE_TIME = "one_time",
    INSTALLMENT = "installment",
}

export enum VendorSettlementSchedule {
    INSTANT = 1,           // Instant settlement (Cashfree Schedule Option 1)
    DAILY = 2,             // Daily settlement (Cashfree Schedule Option 2)
    WEEKLY = 3,            // Weekly settlement (Cashfree Schedule Option 3)
    MONTHLY = 4,           // Monthly settlement (Cashfree Schedule Option 4)
    ON_DEMAND = 5,         // On-demand settlement (Cashfree Schedule Option 5)
}

// Fee Structure Item Interface
export interface IFeeStructureItem {
    item_name: string;          // e.g., "Tuition Fee", "Lab Fee", "Library Fee"
    item_description?: string;
    amount: number;
    is_mandatory: boolean;
    category: string;           // tuition, transport, library, hostel, exam, sports, other
}

// Cashfree Vendor Interface
export interface ICashfreeVendor {
    vendor_id: string;
    status: "ACTIVE" | "INACTIVE" | "DELETED";
    name: string;
    email: string;
    phone: string;
    verify_account: boolean;
    dashboard_access: boolean;
    schedule_option: VendorSettlementSchedule;
    bank?: {
        account_number: string;
        account_holder: string;
        ifsc: string;
    };
    upi?: {
        vpa: string;
        account_holder: string;
    };
    kyc_details?: {
        account_type: string;
        business_type: string;
        uidai?: string;
        gst?: string;
        cin?: string;
        pan?: string;
        passport_number?: string;
    };
}

// Cashfree Split Configuration
export interface ICashfreeSplit {
    vendor_id: string;
    percentage?: number;      // Either percentage or amount
    amount?: number;
    tags?: {
        [key: string]: string;
    };
}

// Razorpay Transfer Configuration
export interface IRazorpayTransfer {
    account_id: string;
    amount: number;
    currency: string;
    notes?: {
        [key: string]: string;
    };
}

// Gateway Order Response Types
export interface ICashfreeOrderResponse {
    cf_order_id: string;
    order_id: string;
    entity: string;
    order_currency: string;
    order_amount: number;
    order_status: string;
    payment_session_id: string;
    order_expiry_time: string;
    order_note?: string;
    order_splits?: ICashfreeSplit[];
}

export interface IRazorpayOrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt?: string;
    status: string;
    attempts: number;
    notes?: Record<string, unknown>;
    created_at: number;
}

// Gateway Payment Response Types
export interface ICashfreePaymentResponse {
    cf_payment_id: string;
    order_id: string;
    entity: string;
    payment_status: string;
    payment_amount: number;
    payment_currency: string;
    payment_method?: string;
    payment_time?: string;
}

export interface IRazorpayPaymentResponse {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string;
    method?: string;
    captured: boolean;
    created_at: number;
}

// Gateway Configuration
export interface IGatewayConfig {
    gateway: PaymentGateway;
    is_enabled: boolean;
    is_default: boolean;
    priority: number;           // 1 = highest priority
    split_enabled: boolean;
    split_percentage?: number;  // Platform fee percentage
}

// Webhook Event Types
export enum CashfreeWebhookEvent {
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS_WEBHOOK",
    PAYMENT_FAILED = "PAYMENT_FAILED_WEBHOOK",
    PAYMENT_USER_DROPPED = "PAYMENT_USER_DROPPED_WEBHOOK",
    REFUND_STATUS = "REFUND_STATUS_WEBHOOK",
    SETTLEMENT_WEBHOOK = "SETTLEMENT_WEBHOOK",
}

export enum RazorpayWebhookEvent {
    PAYMENT_AUTHORIZED = "payment.authorized",
    PAYMENT_CAPTURED = "payment.captured",
    PAYMENT_FAILED = "payment.failed",
    TRANSFER_PROCESSED = "transfer.processed",
    TRANSFER_FAILED = "transfer.failed",
    REFUND_PROCESSED = "refund.processed",
}
