# Payment System API Reference

## Overview

This document provides complete API specifications for the SaaS School Payment System. All endpoints use RESTful conventions and return JSON responses.

## Base URL
```
Production: https://api.yourschoolsaas.com/v1
Staging: https://staging-api.yourschoolsaas.com/v1
```

## Authentication

All API requests require authentication using JWT tokens in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

### Authentication Flow
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@school.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": "user123",
    "name": "School Admin",
    "email": "admin@school.com",
    "campus_id": "campus123",
    "user_type": "admin"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "PAYMENT_GATEWAY_ERROR",
    "message": "Payment gateway is temporarily unavailable",
    "details": {
      "gateway": "razorpay",
      "error_code": "BAD_REQUEST_ERROR"
    },
    "timestamp": "2025-06-23T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Invalid request data
- `AUTHENTICATION_ERROR` - Invalid or expired token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `PAYMENT_GATEWAY_ERROR` - Gateway-related errors
- `INSUFFICIENT_FUNDS` - Insufficient balance
- `TRANSACTION_NOT_FOUND` - Transaction not found
- `DUPLICATE_TRANSACTION` - Duplicate transaction attempt
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Payment Configuration APIs

### Create Payment Configuration

Creates payment gateway and bank account configuration for a school.

```http
POST /payment/config
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "campus_id": "campus123",
  "bank_details": {
    "account_holder_name": "ABC School Trust",
    "account_number": "1234567890",
    "bank_name": "State Bank of India",
    "branch_name": "Main Branch",
    "ifsc_code": "SBIN0001234",
    "account_type": "current",
    "swift_code": "SBININBB123"
  },
  "payment_gateways": [
    {
      "gateway_name": "razorpay",
      "is_enabled": true,
      "priority": 1,
      "config": {
        "key_id": "rzp_test_1234567890",
        "key_secret": "secret_key_here",
        "webhook_secret": "webhook_secret_here",
        "account_id": "acc_1234567890"
      },
      "transaction_fees": {
        "percentage": 2.0,
        "fixed_amount": 0
      }
    },
    {
      "gateway_name": "stripe",
      "is_enabled": true,
      "priority": 2,
      "config": {
        "publishable_key": "pk_test_1234567890",
        "secret_key": "sk_test_1234567890",
        "webhook_secret": "whsec_1234567890",
        "connected_account_id": "acct_1234567890"
      },
      "transaction_fees": {
        "percentage": 2.9,
        "fixed_amount": 30
      }
    }
  ],
  "supported_payment_methods": [
    "credit_card",
    "debit_card",
    "upi",
    "net_banking",
    "wallet"
  ],
  "settlement_config": {
    "auto_settlement": true,
    "settlement_frequency": "daily"
  },
  "notification_settings": {
    "payment_success_email": true,
    "payment_failure_email": true,
    "daily_summary_email": true,
    "webhook_url": "https://school.com/payment-webhook"
  },
  "business_settings": {
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "business_hours": {
      "start": "09:00",
      "end": "17:00"
    }
  },
  "compliance_settings": {
    "enable_gst": true,
    "gst_number": "29GGGGG1314R9Z6",
    "terms_and_conditions_url": "https://school.com/terms",
    "privacy_policy_url": "https://school.com/privacy"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "config_abc123",
    "campus_id": "campus123",
    "bank_details": {
      "account_holder_name": "ABC School Trust",
      "account_number": "****7890",
      "bank_name": "State Bank of India",
      "branch_name": "Main Branch",
      "ifsc_code": "SBIN0001234",
      "account_type": "current"
    },
    "payment_gateways": [
      {
        "gateway_name": "razorpay",
        "is_enabled": true,
        "priority": 1,
        "config": {
          "key_id": "rzp_test_****7890",
          "masked": true
        },
        "transaction_fees": {
          "percentage": 2.0,
          "fixed_amount": 0
        }
      }
    ],
    "status": "active",
    "created_at": "2025-06-23T10:30:00Z",
    "updated_at": "2025-06-23T10:30:00Z"
  }
}
```

### Get Payment Configuration

Retrieves payment configuration for a school.

```http
GET /payment/config/{campus_id}
Authorization: Bearer <token>
```

**Path Parameters:**
- `campus_id` (string, required) - Campus identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "config_abc123",
    "campus_id": "campus123",
    "bank_details": {
      "account_holder_name": "ABC School Trust",
      "account_number": "****7890",
      "bank_name": "State Bank of India",
      "branch_name": "Main Branch",
      "ifsc_code": "SBIN0001234",
      "account_type": "current"
    },
    "payment_gateways": [
      {
        "gateway_name": "razorpay",
        "is_enabled": true,
        "priority": 1,
        "status": "connected",
        "last_health_check": "2025-06-23T10:25:00Z"
      },
      {
        "gateway_name": "stripe",
        "is_enabled": true,
        "priority": 2,
        "status": "connected",
        "last_health_check": "2025-06-23T10:25:00Z"
      }
    ],
    "supported_payment_methods": [
      "credit_card",
      "debit_card",
      "upi",
      "net_banking",
      "wallet"
    ],
    "statistics": {
      "total_transactions": 1250,
      "total_amount": 12500000,
      "success_rate": 98.5,
      "last_transaction": "2025-06-23T09:15:00Z"
    },
    "is_active": true,
    "created_at": "2025-06-23T08:00:00Z",
    "updated_at": "2025-06-23T10:30:00Z"
  }
}
```

### Update Payment Configuration

Updates existing payment configuration.

```http
PUT /payment/config/{campus_id}
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body (Partial updates allowed):**
```json
{
  "payment_gateways": [
    {
      "gateway_name": "razorpay",
      "is_enabled": false,
      "priority": 2
    },
    {
      "gateway_name": "payu",
      "is_enabled": true,
      "priority": 1,
      "config": {
        "merchant_key": "new_merchant_key",
        "merchant_salt": "new_merchant_salt"
      },
      "transaction_fees": {
        "percentage": 1.8,
        "fixed_amount": 0
      }
    }
  ],
  "notification_settings": {
    "daily_summary_email": false
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "config_abc123",
    "message": "Payment configuration updated successfully",
    "changes": [
      "Disabled Razorpay gateway",
      "Added PayU gateway",
      "Updated notification settings"
    ],
    "updated_at": "2025-06-23T10:35:00Z"
  }
}
```

### Test Gateway Connection

Tests connectivity and credentials for a payment gateway.

```http
POST /payment/config/{campus_id}/test-gateway
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "gateway_name": "razorpay"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gateway_name": "razorpay",
    "status": "connected",
    "response_time_ms": 245,
    "test_results": {
      "authentication": "passed",
      "api_connectivity": "passed",
      "webhook_configuration": "passed"
    },
    "tested_at": "2025-06-23T10:30:00Z"
  }
}
```

## Fee Management APIs

### Create Fee Structure

Creates a fee structure for an academic year and class.

```http
POST /payment/fee-structure
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "campus_id": "campus123",
  "academic_year": "2025-2026",
  "class_id": "class123",
  "structure_name": "Grade 10 Annual Fees",
  "fee_categories": [
    {
      "category_id": "tuition",
      "category_name": "Tuition Fee",
      "amount": 50000,
      "is_mandatory": true,
      "due_date": "2025-07-31T23:59:59Z",
      "late_fee_config": {
        "enabled": true,
        "amount": 500,
        "grace_period_days": 7
      },
      "description": "Annual tuition fee for Grade 10",
      "is_refundable": false
    },
    {
      "category_id": "library",
      "category_name": "Library Fee",
      "amount": 2000,
      "is_mandatory": true,
      "due_date": "2025-07-31T23:59:59Z",
      "late_fee_config": {
        "enabled": false,
        "amount": 0,
        "grace_period_days": 0
      },
      "description": "Annual library access fee",
      "is_refundable": true
    }
  ],
  "payment_schedule": [
    {
      "installment_number": 1,
      "due_date": "2025-07-31T23:59:59Z",
      "amount": 26000,
      "categories_included": ["tuition", "library"],
      "description": "First installment"
    },
    {
      "installment_number": 2,
      "due_date": "2025-12-31T23:59:59Z",
      "amount": 26000,
      "categories_included": ["tuition"],
      "description": "Second installment"
    }
  ],
  "discounts": [
    {
      "discount_id": "early_bird",
      "discount_name": "Early Bird Discount",
      "discount_type": "percentage",
      "discount_value": 5,
      "applicable_categories": ["tuition"],
      "eligibility_criteria": {
        "early_payment_days": 30
      },
      "valid_from": "2025-06-01T00:00:00Z",
      "valid_to": "2025-07-01T23:59:59Z",
      "max_usage": 100
    }
  ],
  "partial_payment_allowed": true,
  "minimum_payment_amount": 5000,
  "auto_late_fee": true,
  "grace_period_days": 7,
  "effective_from": "2025-06-01T00:00:00Z",
  "effective_to": "2026-05-31T23:59:59Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "fee_structure_abc123",
    "campus_id": "campus123",
    "academic_year": "2025-2026",
    "class_id": "class123",
    "structure_name": "Grade 10 Annual Fees",
    "total_amount": 52000,
    "fee_categories": [
      {
        "category_id": "tuition",
        "category_name": "Tuition Fee",
        "amount": 50000,
        "is_mandatory": true,
        "due_date": "2025-07-31T23:59:59Z"
      },
      {
        "category_id": "library",
        "category_name": "Library Fee",
        "amount": 2000,
        "is_mandatory": true,
        "due_date": "2025-07-31T23:59:59Z"
      }
    ],
    "payment_schedule": [
      {
        "installment_number": 1,
        "due_date": "2025-07-31T23:59:59Z",
        "amount": 26000,
        "categories_included": ["tuition", "library"]
      },
      {
        "installment_number": 2,
        "due_date": "2025-12-31T23:59:59Z",
        "amount": 26000,
        "categories_included": ["tuition"]
      }
    ],
    "discounts": [
      {
        "discount_id": "early_bird",
        "discount_name": "Early Bird Discount",
        "discount_type": "percentage",
        "discount_value": 5,
        "applicable_categories": ["tuition"],
        "current_usage": 0,
        "max_usage": 100
      }
    ],
    "is_active": true,
    "created_at": "2025-06-23T10:30:00Z"
  }
}
```

### Get Fee Structures

Retrieves fee structures for a campus.

```http
GET /payment/fee-structure/{campus_id}
Authorization: Bearer <token>
```

**Query Parameters:**
- `academic_year` (string, optional) - Filter by academic year
- `class_id` (string, optional) - Filter by class
- `is_active` (boolean, optional) - Filter by active status

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "fee_structures": [
      {
        "id": "fee_structure_abc123",
        "academic_year": "2025-2026",
        "class_id": "class123",
        "structure_name": "Grade 10 Annual Fees",
        "total_amount": 52000,
        "categories_count": 2,
        "installments_count": 2,
        "discounts_count": 1,
        "is_active": true,
        "effective_from": "2025-06-01T00:00:00Z",
        "effective_to": "2026-05-31T23:59:59Z",
        "created_at": "2025-06-23T10:30:00Z"
      }
    ],
    "total_count": 1,
    "current_academic_year": "2025-2026"
  }
}
```

### Get Fee Structure Details

Retrieves detailed information for a specific fee structure.

```http
GET /payment/fee-structure/{campus_id}/{structure_id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "fee_structure_abc123",
    "campus_id": "campus123",
    "academic_year": "2025-2026",
    "class_id": "class123",
    "structure_name": "Grade 10 Annual Fees",
    "total_amount": 52000,
    "fee_categories": [
      {
        "category_id": "tuition",
        "category_name": "Tuition Fee",
        "amount": 50000,
        "is_mandatory": true,
        "due_date": "2025-07-31T23:59:59Z",
        "late_fee_config": {
          "enabled": true,
          "amount": 500,
          "grace_period_days": 7
        },
        "description": "Annual tuition fee for Grade 10",
        "is_refundable": false
      }
    ],
    "payment_schedule": [
      {
        "installment_number": 1,
        "due_date": "2025-07-31T23:59:59Z",
        "amount": 26000,
        "categories_included": ["tuition", "library"],
        "description": "First installment"
      }
    ],
    "discounts": [
      {
        "discount_id": "early_bird",
        "discount_name": "Early Bird Discount",
        "discount_type": "percentage",
        "discount_value": 5,
        "applicable_categories": ["tuition"],
        "eligibility_criteria": {
          "early_payment_days": 30
        },
        "valid_from": "2025-06-01T00:00:00Z",
        "valid_to": "2025-07-01T23:59:59Z",
        "max_usage": 100,
        "current_usage": 15
      }
    ],
    "statistics": {
      "total_students": 150,
      "students_paid": 45,
      "total_collected": 1170000,
      "pending_amount": 1230000,
      "overdue_amount": 52000
    },
    "is_active": true,
    "created_at": "2025-06-23T10:30:00Z",
    "updated_at": "2025-06-23T10:30:00Z"
  }
}
```

## Student Payment APIs

### Get Student Fee Information

Retrieves comprehensive fee information for a student.

```http
GET /payment/student/{student_id}/fees
Authorization: Bearer <token>
```

**Query Parameters:**
- `academic_year` (string, optional) - Specific academic year
- `include_history` (boolean, optional) - Include payment history

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "student_info": {
      "id": "student123",
      "name": "John Doe",
      "email": "john.doe@email.com",
      "phone": "+91-9876543210",
      "class": "Grade 10A",
      "roll_number": "10A-025",
      "academic_year": "2025-2026"
    },
    "fee_summary": {
      "total_amount": 52000,
      "paid_amount": 26000,
      "due_amount": 26000,
      "overdue_amount": 0,
      "discount_applied": 2600,
      "late_fee": 0,
      "next_due_date": "2025-12-31T23:59:59Z"
    },
    "fee_breakdown": [
      {
        "category_id": "tuition",
        "category_name": "Tuition Fee",
        "total_amount": 50000,
        "paid_amount": 25000,
        "due_amount": 25000,
        "due_date": "2025-12-31T23:59:59Z",
        "is_paid": false,
        "is_overdue": false,
        "late_fee": 0,
        "installments": [
          {
            "installment_number": 1,
            "amount": 25000,
            "due_date": "2025-07-31T23:59:59Z",
            "is_paid": true,
            "paid_date": "2025-07-15T14:30:00Z",
            "discount_applied": 1250
          },
          {
            "installment_number": 2,
            "amount": 25000,
            "due_date": "2025-12-31T23:59:59Z",
            "is_paid": false,
            "days_remaining": 191
          }
        ]
      },
      {
        "category_id": "library",
        "category_name": "Library Fee",
        "total_amount": 2000,
        "paid_amount": 2000,
        "due_amount": 0,
        "due_date": "2025-07-31T23:59:59Z",
        "is_paid": true,
        "paid_date": "2025-07-15T14:30:00Z",
        "is_overdue": false,
        "late_fee": 0
      }
    ],
    "available_payment_methods": [
      "credit_card",
      "debit_card",
      "upi",
      "net_banking"
    ],
    "applicable_discounts": [
      {
        "discount_id": "sibling_discount",
        "discount_name": "Sibling Discount",
        "discount_type": "percentage",
        "discount_value": 10,
        "applicable_amount": 25000,
        "savings": 2500,
        "eligibility": "Student has sibling in school"
      }
    ],
    "payment_history": [
      {
        "transaction_id": "txn_abc123",
        "amount": 26000,
        "payment_date": "2025-07-15T14:30:00Z",
        "payment_method": "upi",
        "gateway": "razorpay",
        "status": "success",
        "receipt_url": "https://receipts.example.com/txn_abc123.pdf"
      }
    ]
  }
}
```

### Calculate Payment Amount

Calculates the total amount for selected fee categories including applicable discounts and charges.

```http
POST /payment/calculate
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "student_id": "student123",
  "fee_categories": [
    {
      "category_id": "tuition",
      "amount": 25000
    }
  ],
  "payment_method": "credit_card",
  "gateway_preference": "razorpay",
  "apply_discounts": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "calculation": {
      "subtotal": 25000,
      "discounts": [
        {
          "discount_id": "sibling_discount",
          "discount_name": "Sibling Discount",
          "discount_amount": 2500,
          "discount_type": "percentage",
          "discount_value": 10
        }
      ],
      "total_discount": 2500,
      "amount_after_discount": 22500,
      "gateway_charges": 450,
      "taxes": 81,
      "total_amount": 23031,
      "currency": "INR"
    },
    "gateway_info": {
      "selected_gateway": "razorpay",
      "gateway_fees": {
        "percentage": 2.0,
        "fixed_amount": 0,
        "total_charges": 450
      },
      "estimated_settlement": 22581
    },
    "breakdown": {
      "student_pays": 23031,
      "school_receives": 22581,
      "gateway_commission": 450,
      "taxes": 81
    }
  }
}
```

### Initiate Payment

Creates a payment session and returns the payment URL.

```http
POST /payment/initiate
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "student_id": "student123",
  "fee_items": [
    {
      "category_id": "tuition",
      "amount": 25000
    }
  ],
  "payment_method": "credit_card",
  "gateway_preference": "razorpay",
  "customer_details": {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+91-9876543210",
    "address": "123 School Street, City, State 123456"
  },
  "return_url": "https://school.com/payment/success",
  "cancel_url": "https://school.com/payment/cancel",
  "webhook_url": "https://school.com/payment/webhook"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn_def456",
    "gateway_order_id": "order_razorpay_123456",
    "payment_url": "https://checkout.razorpay.com/v1/checkout.js?order_id=order_razorpay_123456",
    "amount": 23031,
    "currency": "INR",
    "gateway_name": "razorpay",
    "payment_method": "credit_card",
    "expires_at": "2025-06-23T11:00:00Z",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwA...",
    "status": "initiated",
    "created_at": "2025-06-23T10:30:00Z"
  }
}
```

### Verify Payment

Verifies payment status with the gateway and updates transaction status.

```http
POST /payment/verify
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "transaction_id": "txn_def456",
  "gateway_payment_id": "pay_razorpay_123456",
  "gateway_order_id": "order_razorpay_123456",
  "gateway_signature": "da5ca6e498d7bf6e988bfb11b12ad3ac8c68fedb2b1a9ef3f7a0c3e0c8f7d5b4"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn_def456",
    "status": "success",
    "gateway_transaction_id": "pay_razorpay_123456",
    "amount": 23031,
    "currency": "INR",
    "payment_date": "2025-06-23T10:35:00Z",
    "gateway_name": "razorpay",
    "payment_method": "credit_card",
    "receipt": {
      "receipt_number": "RCP-2025-001234",
      "receipt_url": "https://receipts.example.com/RCP-2025-001234.pdf",
      "download_url": "https://api.example.com/receipts/RCP-2025-001234/download"
    },
    "settlement": {
      "settlement_amount": 22581,
      "expected_settlement_date": "2025-06-24T00:00:00Z",
      "settlement_status": "pending"
    },
    "fee_allocation": [
      {
        "category_id": "tuition",
        "category_name": "Tuition Fee",
        "allocated_amount": 22500,
        "remaining_amount": 2500
      }
    ]
  }
}
```

### Get Payment Status

Retrieves current status of a payment transaction.

```http
GET /payment/status/{transaction_id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn_def456",
    "gateway_transaction_id": "pay_razorpay_123456",
    "gateway_order_id": "order_razorpay_123456",
    "status": "success",
    "amount": 23031,
    "currency": "INR",
    "gateway_name": "razorpay",
    "payment_method": "credit_card",
    "payment_date": "2025-06-23T10:35:00Z",
    "customer_details": {
      "name": "John Doe",
      "email": "john.doe@email.com",
      "phone": "+91-9876543210"
    },
    "settlement_details": {
      "settlement_id": "setl_123456",
      "settlement_amount": 22581,
      "settlement_date": "2025-06-24T06:00:00Z",
      "settlement_status": "settled",
      "settlement_reference": "NEFT202506240001234"
    },
    "receipt": {
      "receipt_number": "RCP-2025-001234",
      "receipt_url": "https://receipts.example.com/RCP-2025-001234.pdf"
    },
    "created_at": "2025-06-23T10:30:00Z",
    "updated_at": "2025-06-23T10:35:00Z"
  }
}
```

## Transaction Management APIs

### Get Transactions

Retrieves transaction history with filtering and pagination.

```http
GET /payment/transactions
Authorization: Bearer <token>
```

**Query Parameters:**
- `campus_id` (string, required) - Campus identifier
- `date_from` (string, optional) - Start date (ISO 8601)
- `date_to` (string, optional) - End date (ISO 8601)
- `status` (string, optional) - Transaction status filter
- `gateway` (string, optional) - Payment gateway filter
- `student_id` (string, optional) - Student identifier
- `amount_min` (number, optional) - Minimum amount filter
- `amount_max` (number, optional) - Maximum amount filter
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 50, max: 100)
- `sort_by` (string, optional) - Sort field (default: created_at)
- `sort_order` (string, optional) - Sort order (asc/desc, default: desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "transaction_id": "txn_def456",
        "student_name": "John Doe",
        "student_id": "student123",
        "amount": 23031,
        "currency": "INR",
        "status": "success",
        "gateway_name": "razorpay",
        "payment_method": "credit_card",
        "payment_date": "2025-06-23T10:35:00Z",
        "receipt_number": "RCP-2025-001234",
        "gateway_charges": 450,
        "settlement_amount": 22581,
        "settlement_status": "settled",
        "created_at": "2025-06-23T10:30:00Z"
      },
      {
        "transaction_id": "txn_abc123",
        "student_name": "Jane Smith",
        "student_id": "student456",
        "amount": 26000,
        "currency": "INR",
        "status": "success",
        "gateway_name": "stripe",
        "payment_method": "upi",
        "payment_date": "2025-06-22T15:20:00Z",
        "receipt_number": "RCP-2025-001233",
        "gateway_charges": 520,
        "settlement_amount": 25480,
        "settlement_status": "settled",
        "created_at": "2025-06-22T15:15:00Z"
      }
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "limit": 50,
      "total_pages": 25,
      "has_next": true,
      "has_prev": false
    },
    "summary": {
      "total_amount": 2875000,
      "total_transactions": 1250,
      "successful_transactions": 1225,
      "failed_transactions": 15,
      "pending_transactions": 10,
      "success_rate": 98.0,
      "total_gateway_charges": 57500,
      "net_settlement": 2817500
    },
    "filters_applied": {
      "date_from": "2025-06-01T00:00:00Z",
      "date_to": "2025-06-23T23:59:59Z",
      "status": "all",
      "gateway": "all"
    }
  }
}
```

### Get Transaction Details

Retrieves detailed information for a specific transaction.

```http
GET /payment/transactions/{transaction_id}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn_def456",
    "campus_id": "campus123",
    "student_info": {
      "student_id": "student123",
      "name": "John Doe",
      "email": "john.doe@email.com",
      "phone": "+91-9876543210",
      "class": "Grade 10A",
      "roll_number": "10A-025"
    },
    "amount_details": {
      "total_amount": 23031,
      "fee_amount": 22500,
      "discount_applied": 2500,
      "gateway_charges": 450,
      "taxes": 81,
      "currency": "INR"
    },
    "payment_details": {
      "gateway_name": "razorpay",
      "gateway_transaction_id": "pay_razorpay_123456",
      "gateway_order_id": "order_razorpay_123456",
      "payment_method": "credit_card",
      "card_details": {
        "card_type": "credit",
        "card_network": "visa",
        "last4": "1234",
        "issuer_bank": "HDFC Bank"
      },
      "payment_date": "2025-06-23T10:35:00Z"
    },
    "status_history": [
      {
        "status": "initiated",
        "timestamp": "2025-06-23T10:30:00Z",
        "description": "Payment session created"
      },
      {
        "status": "processing",
        "timestamp": "2025-06-23T10:32:00Z",
        "description": "Payment being processed by gateway"
      },
      {
        "status": "success",
        "timestamp": "2025-06-23T10:35:00Z",
        "description": "Payment completed successfully"
      }
    ],
    "settlement_details": {
      "settlement_id": "setl_123456",
      "settlement_amount": 22581,
      "settlement_date": "2025-06-24T06:00:00Z",
      "settlement_status": "settled",
      "settlement_reference": "NEFT202506240001234",
      "bank_reference": "UTR123456789"
    },
    "fee_allocation": [
      {
        "category_id": "tuition",
        "category_name": "Tuition Fee",
        "allocated_amount": 22500,
        "installment_number": 2
      }
    ],
    "receipt": {
      "receipt_number": "RCP-2025-001234",
      "receipt_url": "https://receipts.example.com/RCP-2025-001234.pdf",
      "download_url": "https://api.example.com/receipts/RCP-2025-001234/download"
    },
    "gateway_response": {
      "acquirer_data": {
        "bank_transaction_id": "12345678"
      },
      "risk_score": 25
    },
    "device_info": {
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "device_fingerprint": "fp_1234567890abcdef"
    },
    "webhook_attempts": [
      {
        "attempt_number": 1,
        "attempted_at": "2025-06-23T10:35:30Z",
        "status": "success",
        "response_code": 200
      }
    ],
    "created_at": "2025-06-23T10:30:00Z",
    "updated_at": "2025-06-23T10:35:00Z"
  }
}
```

## Webhook Handling

### Payment Gateway Webhooks

Handles webhook notifications from payment gateways.

```http
POST /payment/webhook/{gateway_name}
Content-Type: application/json
X-Razorpay-Signature: <signature>
```

**Request Body (Razorpay Example):**
```json
{
  "entity": "event",
  "account_id": "acc_BFQ7uQEaa3Ox1Z",
  "event": "payment.captured",
  "contains": ["payment"],
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_razorpay_123456",
        "entity": "payment",
        "amount": 2303100,
        "currency": "INR",
        "status": "captured",
        "order_id": "order_razorpay_123456",
        "method": "card",
        "captured": true,
        "created_at": 1687507500
      }
    }
  },
  "created_at": 1687507530
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### School Webhook Notifications

Sends webhook notifications to schools for payment events.

**Payment Success Webhook:**
```json
{
  "event": "payment.success",
  "transaction_id": "txn_def456",
  "student_id": "student123",
  "amount": 23031,
  "currency": "INR",
  "payment_date": "2025-06-23T10:35:00Z",
  "gateway": "razorpay",
  "settlement_amount": 22581,
  "fee_categories": [
    {
      "category_id": "tuition",
      "amount": 22500
    }
  ],
  "timestamp": "2025-06-23T10:35:00Z",
  "signature": "sha256=<signature>"
}
```

## Financial Reports APIs

### Generate Financial Report

Generates comprehensive financial reports for a school.

```http
POST /payment/reports/financial
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "campus_id": "campus123",
  "report_type": "monthly",
  "date_from": "2025-06-01T00:00:00Z",
  "date_to": "2025-06-30T23:59:59Z",
  "format": "json",
  "include_details": true,
  "group_by": ["gateway", "payment_method", "fee_category"],
  "filters": {
    "student_class": ["Grade 10A", "Grade 10B"],
    "payment_status": ["success"]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report_id": "rpt_abc123",
    "report_type": "monthly",
    "period": {
      "from": "2025-06-01T00:00:00Z",
      "to": "2025-06-30T23:59:59Z",
      "description": "June 2025"
    },
    "summary": {
      "total_revenue": 2875000,
      "total_transactions": 1250,
      "successful_transactions": 1225,
      "failed_transactions": 15,
      "pending_transactions": 10,
      "success_rate": 98.0,
      "average_transaction_value": 2300,
      "total_gateway_charges": 57500,
      "net_settlement": 2817500
    },
    "gateway_breakdown": [
      {
        "gateway_name": "razorpay",
        "transaction_count": 750,
        "total_amount": 1725000,
        "success_rate": 98.5,
        "average_response_time": 2.5,
        "total_charges": 34500,
        "net_amount": 1690500
      },
      {
        "gateway_name": "stripe",
        "transaction_count": 475,
        "total_amount": 1097500,
        "success_rate": 97.2,
        "average_response_time": 3.1,
        "total_charges": 21950,
        "net_amount": 1075550
      }
    ],
    "payment_method_breakdown": [
      {
        "payment_method": "upi",
        "transaction_count": 680,
        "total_amount": 1564000,
        "percentage": 54.4
      },
      {
        "payment_method": "credit_card",
        "transaction_count": 345,
        "total_amount": 793750,
        "percentage": 27.6
      },
      {
        "payment_method": "debit_card",
        "transaction_count": 200,
        "total_amount": 460000,
        "percentage": 16.0
      },
      {
        "payment_method": "net_banking",
        "transaction_count": 25,
        "total_amount": 57250,
        "percentage": 2.0
      }
    ],
    "fee_category_breakdown": [
      {
        "category_id": "tuition",
        "category_name": "Tuition Fee",
        "total_amount": 2300000,
        "transaction_count": 920,
        "percentage": 80.0
      },
      {
        "category_id": "library",
        "category_name": "Library Fee",
        "total_amount": 184000,
        "transaction_count": 92,
        "percentage": 6.4
      },
      {
        "category_id": "lab",
        "category_name": "Laboratory Fee",
        "total_amount": 276000,
        "transaction_count": 138,
        "percentage": 9.6
      },
      {
        "category_id": "transport",
        "category_name": "Transport Fee",
        "total_amount": 115000,
        "transaction_count": 100,
        "percentage": 4.0
      }
    ],
    "daily_trend": [
      {
        "date": "2025-06-01",
        "transaction_count": 45,
        "total_amount": 103500,
        "success_rate": 97.8
      },
      {
        "date": "2025-06-02",
        "transaction_count": 52,
        "total_amount": 119600,
        "success_rate": 98.1
      }
    ],
    "outstanding_fees": {
      "total_outstanding": 3250000,
      "overdue_amount": 325000,
      "students_with_dues": 450,
      "average_outstanding_per_student": 7222
    },
    "refunds": {
      "total_refunded": 23000,
      "refund_count": 10,
      "average_refund_amount": 2300
    },
    "generated_at": "2025-06-23T10:30:00Z",
    "download_url": "https://api.example.com/reports/rpt_abc123/download"
  }
}
```

## Rate Limiting

All APIs are rate-limited to ensure fair usage:

- **Authentication**: 10 requests per minute
- **Payment Configuration**: 30 requests per minute
- **Fee Management**: 100 requests per minute
- **Payment Processing**: 200 requests per minute
- **Transaction Queries**: 300 requests per minute
- **Webhooks**: 1000 requests per minute

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1687507800
```

## Pagination

List endpoints support pagination with these parameters:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)

Pagination response format:

```json
{
  "pagination": {
    "total": 1250,
    "page": 1,
    "limit": 50,
    "total_pages": 25,
    "has_next": true,
    "has_prev": false
  }
}
```

## Versioning

The API uses URL versioning:

- Current version: `v1`
- Base URL: `https://api.yourschoolsaas.com/v1`

Version headers:

```http
API-Version: v1
```

## Webhook Security

All webhooks include signature verification:

**Request Headers:**
```http
X-Webhook-Signature: sha256=<signature>
X-Webhook-Timestamp: 1687507530
X-Webhook-Event: payment.success
```

**Signature Calculation:**
```
signature = HMAC-SHA256(webhook_secret, timestamp + payload)
```

---

**Document Version**: 1.0  
**Last Updated**: June 23, 2025  
**Next Review**: July 23, 2025
