# Payment Gateway Configuration Guide

## Overview

This guide explains how to configure and manage payment gateways in the SaaS school payment system. Each school can configure multiple payment gateways and enable/disable them as needed.

## Supported Payment Gateways

1. **Razorpay** - Popular Indian payment gateway
2. **PayU** - Widely used payment solution
3. **Cashfree** - Modern payment platform

## Configuration Process

### Step 1: Setup School Bank Details

Before configuring payment gateways, schools must first setup their bank account details:

```bash
POST /payment/school-bank-details
```

```json
{
  "bank_name": "State Bank of India",
  "account_number": "1234567890123456",
  "account_holder_name": "ABC School Trust",
  "ifsc_code": "SBIN0001234",
  "branch_name": "Education City Branch",
  "account_type": "current",
  "upi_id": "school@paytm"
}
```

### Step 2: Configure Payment Gateway Credentials

#### Option A: Configure All Gateways at Once

```bash
POST /payment/school-bank-details
```

```json
{
  "payment_gateway_credentials": {
    "razorpay": {
      "key_id": "rzp_test_1234567890",
      "key_secret": "your_razorpay_secret",
      "webhook_secret": "webhook_secret_key",
      "enabled": true
    },
    "payu": {
      "merchant_key": "your_payu_merchant_key",
      "merchant_salt": "your_payu_salt",
      "enabled": false
    },
    "cashfree": {
      "app_id": "your_cashfree_app_id",
      "secret_key": "your_cashfree_secret",
      "enabled": false
    }
  }
}
```

#### Option B: Configure Individual Gateways

```bash
POST /payment/configure-gateway
```

```json
{
  "gateway": "razorpay",
  "credentials": {
    "key_id": "rzp_test_1234567890",
    "key_secret": "your_razorpay_secret",
    "webhook_secret": "webhook_secret_key"
  },
  "enabled": true
}
```

## Gateway-Specific Configuration

### 1. Razorpay Configuration

#### Required Credentials:
- **key_id**: Your Razorpay Key ID (starts with `rzp_`)
- **key_secret**: Your Razorpay Secret Key
- **webhook_secret**: Webhook secret for payment verification

#### How to Get Credentials:
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate or copy your Key ID and Secret
4. For webhooks: Go to Settings → Webhooks → Create webhook
5. Set webhook URL: `https://yourschool.com/payment/webhook/razorpay`

#### Test vs Live Mode:
```json
{
  "razorpay": {
    "key_id": "rzp_test_1234567890",      // Test mode
    "key_secret": "test_secret_key",
    "webhook_secret": "test_webhook_secret",
    "enabled": true,
    "mode": "test"
  }
}
```

For live mode, replace `test` with `live` in key_id and use live credentials.

### 2. PayU Configuration

#### Required Credentials:
- **merchant_key**: Your PayU Merchant Key
- **merchant_salt**: Your PayU Salt

#### How to Get Credentials:
1. Login to [PayU Dashboard](https://www.payu.in/)
2. Go to Settings → Account Settings
3. Copy your Merchant Key and Salt

#### Configuration Example:
```json
{
  "payu": {
    "merchant_key": "your_merchant_key",
    "merchant_salt": "your_merchant_salt",
    "enabled": true,
    "mode": "test"  // or "live"
  }
}
```

### 3. Cashfree Configuration

#### Required Credentials:
- **app_id**: Your Cashfree App ID
- **secret_key**: Your Cashfree Secret Key

#### How to Get Credentials:
1. Login to [Cashfree Dashboard](https://merchant.cashfree.com/)
2. Go to Developers → API Keys
3. Copy your App ID and Secret Key

#### Configuration Example:
```json
{
  "cashfree": {
    "app_id": "your_app_id",
    "secret_key": "your_secret_key",
    "enabled": true,
    "mode": "test"  // or "live"
  }
}
```

## Management APIs

### Test Gateway Configuration

Test if gateway credentials are working:

```bash
POST /payment/test-gateway
```

```json
{
  "gateway": "razorpay"
}
```

Response:
```json
{
  "success": true,
  "message": "Razorpay connection successful",
  "details": {
    "gateway": "razorpay",
    "tested_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get Available Gateways

Check which gateways are configured and enabled:

```bash
GET /payment/available-gateways
```

Response:
```json
{
  "available": ["razorpay", "payu", "cashfree"],
  "enabled": ["razorpay"],
  "configurations": {
    "razorpay": {
      "enabled": true,
      "configured": true,
      "last_tested": "2024-01-15T10:30:00Z",
      "test_status": "success"
    },
    "payu": {
      "enabled": false,
      "configured": true,
      "last_tested": null,
      "test_status": "untested"
    },
    "cashfree": {
      "enabled": false,
      "configured": false,
      "last_tested": null,
      "test_status": "untested"
    }
  }
}
```

### Enable/Disable Gateway

Toggle gateway availability:

```bash
POST /payment/toggle-gateway
```

```json
{
  "gateway": "razorpay",
  "enabled": false
}
```

## Security Best Practices

### 1. Credential Management
- **Never expose secrets in frontend code**
- **Use encrypted storage for all payment credentials**
- **Rotate keys regularly (every 90 days recommended)**
- **Use different keys for test and production**
- **Generate strong encryption keys (256-bit minimum)**

### 2. Encrypted Credential Storage
The system now uses **AES-256-GCM encryption** to securely store payment gateway credentials.

#### Setup Encryption Key:
```bash
# Generate a secure 256-bit encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Environment Configuration:
```bash
# .env file
PAYMENT_CREDENTIAL_ENCRYPTION_KEY=your_generated_base64_key_here
```

#### Migration from Legacy Storage:
```bash
POST /payment/migrate-credentials
```

Response:
```json
{
  "success": true,
  "message": "Credentials successfully migrated to encrypted storage",
  "migrated_gateways": ["razorpay", "payu"]
}
```

### 3. Webhook Security
- **Always verify webhook signatures**
- **Use HTTPS for webhook endpoints**
- **Implement idempotency for webhook processing**
- **Log all webhook events for audit**

### 4. Testing
- **Always test in sandbox/test mode first**
- **Verify all payment flows before going live**
- **Test webhook endpoints thoroughly**
- **Monitor payment success rates**

## Secure Configuration Process

### Step 1: Environment Setup

1. **Generate Encryption Key**
   ```bash
   # Generate strong encryption key
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Set Environment Variables**
   ```bash
   export PAYMENT_CREDENTIAL_ENCRYPTION_KEY="your_generated_key"
   ```

3. **Validate Encryption Setup**
   ```bash
   POST /payment/validate-encryption
   ```

### Step 2: Secure Credential Storage

#### Store Encrypted Credentials:
```bash
POST /payment/secure-credentials
```

```json
{
  "gateway": "razorpay",
  "credentials": {
    "key_id": "rzp_test_1234567890",
    "key_secret": "your_secret_key",
    "webhook_secret": "webhook_secret",
    "mode": "test"
  },
  "enabled": true
}
```

#### Retrieve Credentials (Masked):
```bash
GET /payment/credentials/masked
```

Response:
```json
{
  "razorpay": {
    "key_id": "rzp_***67890",
    "key_secret": "***",
    "webhook_secret": "***",
    "enabled": true,
    "configured": true
  }
}
```

### Step 3: Security Validation

#### Check Credential Security:
```bash
GET /payment/security-status
```

Response:
```json
{
  "valid": true,
  "issues": [],
  "recommendations": [
    "Consider updating to latest encryption version"
  ],
  "encryption_status": {
    "version": "v1",
    "algorithm": "aes-256-gcm",
    "last_rotated": "2024-01-15T10:30:00Z"
  }
}
```

## Environment Configuration

### Development Environment
```json
{
  "razorpay": {
    "key_id": "rzp_test_1234567890",
    "key_secret": "test_secret_key",
    "webhook_secret": "test_webhook_secret",
    "enabled": true,
    "mode": "test"
  }
}
```

### Production Environment
```json
{
  "razorpay": {
    "key_id": "rzp_live_1234567890",
    "key_secret": "live_secret_key",
    "webhook_secret": "live_webhook_secret",
    "enabled": true,
    "mode": "live"
  }
}
```

## Webhook Configuration

### Webhook URLs
Set these URLs in your payment gateway dashboards:

- **Razorpay**: `https://yourschool.com/payment/webhook/razorpay`
- **PayU**: `https://yourschool.com/payment/webhook/payu`
- **Cashfree**: `https://yourschool.com/payment/webhook/cashfree`

### Webhook Events to Subscribe
- **payment.captured** - Payment successful
- **payment.failed** - Payment failed
- **payment.authorized** - Payment authorized (for manual capture)
- **refund.created** - Refund processed

## Security Management APIs

### Migrate Legacy Credentials

Migrate unencrypted credentials to secure encrypted storage:

```bash
POST /payment/migrate-credentials
```

Response:
```json
{
  "success": true,
  "message": "Credentials successfully migrated to encrypted storage",
  "migrated_gateways": ["razorpay", "payu", "cashfree"]
}
```

### Rotate Encryption

Rotate encryption with a new key:

```bash
POST /payment/rotate-encryption
```

```json
{
  "old_encryption_key": "previous_base64_key"
}
```

Response:
```json
{
  "success": true,
  "message": "Encryption rotated successfully"
}
```

### Validate Security

Check the security status of stored credentials:

```bash
GET /payment/security-status
```

Response:
```json
{
  "valid": true,
  "issues": [],
  "recommendations": [
    "Consider rotating credentials (>90 days old)"
  ],
  "encryption_status": {
    "version": "v2",
    "algorithm": "aes-256-gcm",
    "key_strength": "256-bit",
    "last_rotated": "2024-01-15T10:30:00Z"
  },
  "credential_age": {
    "razorpay": "45 days",
    "payu": "not configured",
    "cashfree": "12 days"
  }
}
```

### Get Masked Credentials

Retrieve credentials with sensitive data masked for display:

```bash
GET /payment/credentials/masked
```

Response:
```json
{
  "razorpay": {
    "key_id": "rzp_test_***67890",
    "key_secret": "***",
    "webhook_secret": "***",
    "enabled": true,
    "configured": true,
    "last_tested": "2024-01-15T09:30:00Z",
    "test_status": "success"
  },
  "payu": {
    "merchant_key": "merchant_***",
    "merchant_salt": "***",
    "enabled": false,
    "configured": true,
    "last_tested": null,
    "test_status": "untested"
  }
}
```

## Error Handling

### Common Configuration Errors

1. **Invalid Credentials**
   ```json
   {
     "error": "PAYMENT_001",
     "message": "Invalid payment gateway credentials",
     "details": "Razorpay key_id format is invalid"
   }
   ```

2. **Gateway Test Failed**
   ```json
   {
     "error": "PAYMENT_005",
     "message": "Payment gateway timeout",
     "details": "Unable to connect to Razorpay API"
   }
   ```

3. **Missing Configuration**
   ```json
   {
     "error": "PAYMENT_002",
     "message": "Insufficient bank details",
     "details": "Payment gateway credentials not configured"
   }
   ```

4. **Encryption Errors**
   ```json
   {
     "error": "PAYMENT_007",
     "message": "Credential decryption failed",
     "details": "Invalid encryption key or corrupted data"
   }
   ```

5. **Security Validation Errors**
   ```json
   {
     "error": "PAYMENT_008",
     "message": "Security validation failed",
     "details": "Encryption key validation failed - key must be 256 bits"
   }
   ```

### Security Error Codes

- `PAYMENT_007`: Credential decryption failed
- `PAYMENT_008`: Security validation failed
- `PAYMENT_009`: Encryption key not configured
- `PAYMENT_010`: Legacy credential migration required
- `PAYMENT_011`: Credential rotation required

## Monitoring and Analytics

### Gateway Performance Tracking
Monitor these metrics for each gateway:

- **Success Rate**: Percentage of successful payments
- **Response Time**: Average API response time
- **Error Rate**: Frequency of gateway errors
- **Revenue**: Total amount processed per gateway

### Recommended Monitoring
```javascript
// Track gateway performance
const gatewayMetrics = {
  razorpay: {
    success_rate: 98.5,
    avg_response_time: 1200, // milliseconds
    total_transactions: 1500,
    total_revenue: 750000
  },
  payu: {
    success_rate: 96.2,
    avg_response_time: 1800,
    total_transactions: 800,
    total_revenue: 400000
  }
};
```

## Migration and Backup

### Before Changing Gateway Configuration
1. **Backup existing configuration**
2. **Test new configuration in staging**
3. **Notify users about maintenance window**
4. **Monitor payment flows after changes**

### Configuration Backup Example
```json
{
  "backup_date": "2024-01-15T10:30:00Z",
  "campus_id": "school_123",
  "payment_gateway_credentials": {
    "razorpay": {
      "key_id": "rzp_test_***",
      "enabled": true,
      "last_tested": "2024-01-15T09:00:00Z"
    }
  }
}
```

## Support and Troubleshooting

### Testing Checklist
- [ ] Gateway credentials validated
- [ ] Test payment successful
- [ ] Webhook endpoint responding
- [ ] Signature verification working
- [ ] Error handling tested
- [ ] Refund process verified

### Contact Information
- **Razorpay Support**: support@razorpay.com
- **PayU Support**: support@payu.in
- **Cashfree Support**: support@cashfree.com

### Logs to Check
1. **Payment initiation logs**
2. **Gateway API response logs**
3. **Webhook processing logs**
4. **Error and exception logs**

---

This configuration guide ensures secure, reliable payment gateway setup for schools in the SaaS platform while maintaining complete campus isolation and flexibility.
