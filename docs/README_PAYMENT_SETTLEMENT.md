# Payment Settlement System

## Overview

The Payment Settlement System is an enterprise-grade solution for managing payment settlements between the KCS application and various payment gateway providers (Razorpay, PayU, and Cashfree). It includes robust security features, compliance reporting, and comprehensive audit logging.

## Key Features

- **Multi-Gateway Settlement Processing**: Unified interface for Razorpay, PayU, and Cashfree
- **Advanced Security**: Encrypted credentials, security monitoring, suspicious transaction detection
- **Audit System**: Detailed logging of all settlement actions for compliance
- **Compliance Reporting**: Date-range based reporting and transaction reconciliation
- **Gateway Management**: Dynamic provider switching, environment configuration

## Getting Started

### Prerequisites

- Node.js 16+
- Bun or Yarn package manager
- Access to Couchbase database

### Installation

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Run in development mode
bun run dev
```

### Configuration

Create or update the environment variables in your `.env` file:

```env
# Payment Gateway API Keys
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
PAYU_KEY=your_payu_key
PAYU_SALT=your_payu_salt
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret

# Encryption Settings
PAYMENT_ENCRYPTION_KEY=your_encryption_key
PAYMENT_ENCRYPTION_IV=your_encryption_iv

# Settlement Configuration
AUTO_SETTLEMENT_ENABLED=true
SETTLEMENT_SCHEDULE="0 0 * * *"  # Daily at midnight (cron format)
```

## API Endpoints

### Settlement Management

- `POST /payment-settlement/manual` - Trigger manual settlement
- `GET /payment-settlement/status` - Check settlement system status
- `GET /payment-settlement/transactions` - List settlement transactions

### Gateway Configuration

- `PUT /payment-settlement/gateway/configure` - Update gateway configuration
- `GET /payment-settlement/gateway/status` - Check gateway status

### Webhooks

- `POST /payment-settlement/webhook/:provider` - Gateway webhook handler

### Compliance and Security

- `GET /payment-settlement/compliance/report` - Generate compliance reports
- `GET /payment-settlement/security/audit` - Access security audit logs

## Development

### Folder Structure

```
src/
  ├── controllers/
  │   └── payment_settlement.controller.ts
  ├── models/
  │   ├── payment_settlement.model.ts
  │   ├── payment_gateway_configuration.model.ts
  │   ├── payment_audit_log.model.ts
  │   └── payment_security_event.model.ts
  ├── routes/
  │   └── payment_settlement.route.ts
  ├── services/
  │   └── payment_settlement.service.ts
  └── types/
      └── payment.ts
```

### Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test --coverage
```

## Documentation

Comprehensive documentation is available in the `docs` folder:

- [Payment Settlement System Documentation](./docs/PAYMENT_SETTLEMENT_SYSTEM_DOCUMENTATION.md)
- [API Documentation](./docs/PAYMENT_API_FRONTEND_GUIDE.md)

## Security Considerations

- All gateway credentials are encrypted at rest
- Webhook signatures are verified for authenticity
- Security events are logged and monitored
- Regular security audits are performed

## Contributors

- Development Team @ KCS-Project

## License

This project is licensed under the MIT License - see the LICENSE file for details.
