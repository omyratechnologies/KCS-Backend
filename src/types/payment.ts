export enum SettlementStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum GatewayProvider {
  RAZORPAY = 'razorpay',
  PAYU = 'payu',
  CASHFREE = 'cashfree'
}

export enum PaymentSecurityEventType {
  SUSPICIOUS_TRANSACTION = 'suspicious_transaction',
  DUPLICATE_PAYMENT = 'duplicate_payment',
  FAILED_ENCRYPTION = 'failed_encryption',
  MULTIPLE_FAILED_ATTEMPTS = 'multiple_failed_attempts',
  GATEWAY_TIMEOUT = 'gateway_timeout',
  API_KEY_EXPOSED = 'api_key_exposed',
  SETTLEMENT_DISCREPANCY = 'settlement_discrepancy',
  WEBHOOK_VERIFICATION_FAILED = 'webhook_verification_failed'
}

export enum PaymentGatewayMode {
  TEST = 'test',
  LIVE = 'live'
}

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SettlementRequestPayload {
  gateway_provider: GatewayProvider;
  transaction_ids: string[];
  amount: number;
  settlement_date?: Date;
}

export interface PaymentGatewayConfigPayload {
  gateway_provider: GatewayProvider;
  is_primary: boolean;
  gateway_mode: string;
  api_key: string;
  api_secret: string;
  webhook_url?: string;
  additional_config?: Record<string, any>;
}

export interface SecurityEventPayload {
  event_type: PaymentSecurityEventType;
  severity: string;
  description: string;
  metadata?: Record<string, any>;
  related_transaction_id?: string;
}

export interface WebhookPayload {
  settlement_id: string;
  status: string;
  gateway_reference: string;
  additional_data?: Record<string, any>;
}

export interface ComplianceReportResponse {
  total_settlements: number;
  total_amount: number;
  settlements_by_status: Record<string, number>;
  audit_logs: any[];
  security_events: any[];
  report_generated_at: Date;
  reporting_period: {
    start_date: Date;
    end_date: Date;
  };
}

export interface SystemStatusResponse {
  system_status: string;
  gateway_status: {
    razorpay: string;
    payu: string;
    cashfree: string;
  };
  database_status: string;
  security_status: string;
  compliance_status: string;
  last_settlement?: {
    date: string;
    status: string;
    amount: number;
  };
  uptime_seconds: number;
  version: string;
}
