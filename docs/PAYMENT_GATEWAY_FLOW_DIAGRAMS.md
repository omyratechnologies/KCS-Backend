# SaaS Payment Gateway Flow Diagram - Complete Architecture

## System Architecture Overview

```mermaid
graph TB
    subgraph "KCS Platform Core"
        A[School Management] --> B[User Authentication]
        B --> C[Payment Gateway Integration]
        C --> D[Settlement Processing]
        D --> E[Compliance & Reporting]
    end
    
    subgraph "External Payment Gateways"
        F[Razorpay API]
        G[PayU API]
        H[Cashfree API]
    end
    
    subgraph "School Banking System"
        I[School Bank Account]
        J[Settlement Webhooks]
    end
    
    C --> F
    C --> G
    C --> H
    F --> I
    G --> I
    H --> I
    F --> J
    G --> J
    H --> J
    J --> D
```

## Detailed Payment Flow

### 1. School Onboarding and Setup Flow

```mermaid
sequenceDiagram
    participant SA as School Admin
    participant KCS as KCS Platform
    participant DB as Database
    participant Encrypt as Encryption Service
    
    SA->>KCS: 1. Register School & Campus
    KCS->>DB: Create school record
    
    SA->>KCS: 2. Add Bank Account Details
    Note over SA,KCS: Bank Name, Account Number, IFSC, etc.
    KCS->>DB: Store bank details
    
    SA->>KCS: 3. Configure Payment Gateway Credentials
    Note over SA,KCS: Razorpay/PayU/Cashfree API keys
    KCS->>Encrypt: Encrypt credentials (AES-256)
    Encrypt->>DB: Store encrypted credentials
    
    SA->>KCS: 4. Set Fee Structures
    Note over SA,KCS: Categories, Templates, Due dates
    KCS->>DB: Store fee configuration
    
    SA->>KCS: 5. Test Gateway Configuration
    KCS->>External: Test API calls to gateways
    External->>KCS: Validation response
    KCS->>SA: Configuration status
```

### 2. Fee Management and Generation Flow

```mermaid
flowchart TD
    A[Admin Creates Fee Categories] --> B[Create Fee Templates]
    B --> C[Define Student Classes & Sections]
    C --> D[Generate Individual Fee Records]
    D --> E[Fee Records Created for Students]
    E --> F[Parent/Student Login]
    F --> G[View Pending Fees]
    
    G --> H{Fee Status?}
    H -->|Pending| I[Show Payment Options]
    H -->|Overdue| J[Show Late Fee + Payment Options]
    H -->|Paid| K[Show Payment History]
    
    I --> L[Select Payment Gateway]
    J --> L
    L --> M[Initiate Payment]
```

### 3. Complete Payment Processing Flow

```mermaid
sequenceDiagram
    participant P as Parent/Student
    participant KCS as KCS Platform
    participant Auth as Auth Service
    participant Payment as Payment Service
    participant Gateway as Payment Gateway
    participant Security as Security Monitor
    participant Bank as School Bank
    participant Webhook as Webhook Handler
    
    P->>KCS: 1. Login to view fees
    KCS->>Auth: Validate credentials
    Auth->>KCS: User authenticated
    
    P->>KCS: 2. Request pending fees
    KCS->>Payment: Get student fees
    Payment->>KCS: Return fee details + available gateways
    KCS->>P: Display fees and payment options
    
    P->>KCS: 3. Initiate payment (fee_id, gateway, amount)
    KCS->>Security: Log payment initiation attempt
    KCS->>Payment: Create payment transaction record
    Payment->>Gateway: Create payment order
    Gateway->>Payment: Return order details (order_id, checkout_url)
    Payment->>KCS: Payment order created
    KCS->>P: Redirect to gateway checkout
    
    P->>Gateway: 4. Complete payment on gateway
    Gateway->>P: Payment success/failure page
    
    Gateway->>Webhook: 5. Send payment webhook
    Webhook->>Security: Verify webhook signature
    Webhook->>Payment: Update transaction status
    Payment->>KCS: Transaction updated
    
    Gateway->>Bank: 6. Settlement (T+1 or as configured)
    Gateway->>Webhook: Settlement webhook
    Webhook->>Payment: Update settlement status
    
    KCS->>P: 7. Send payment confirmation
    Payment->>Security: Log successful payment
```

### 4. Security and Monitoring Flow

```mermaid
graph TD
    A[Payment Request] --> B[Payment Monitoring Middleware]
    B --> C{Security Checks}
    C -->|Rate Limiting| D[Check Request Rate]
    C -->|IP Validation| E[Validate IP Address]
    C -->|Fraud Detection| F[Analyze Transaction Pattern]
    
    D --> G{Rate Exceeded?}
    E --> H{IP Whitelisted?}
    F --> I{Suspicious Activity?}
    
    G -->|Yes| J[Block Request]
    G -->|No| K[Continue Processing]
    H -->|No| J
    H -->|Yes| K
    I -->|Yes| L[Flag for Review]
    I -->|No| K
    
    K --> M[Process Payment]
    J --> N[Log Security Event]
    L --> O[Log Security Alert]
    
    M --> P[Audit Log Entry]
    N --> P
    O --> P
```

### 5. Settlement and Reconciliation Flow

```mermaid
sequenceDiagram
    participant Gateway as Payment Gateway
    participant Settlement as Settlement Service
    participant Bank as School Bank
    participant Audit as Audit Service
    participant School as School Admin
    
    Note over Gateway: Daily settlement processing
    Gateway->>Settlement: Settlement batch created
    Settlement->>Audit: Log settlement initiation
    
    Gateway->>Bank: Transfer funds to school account
    Bank->>Gateway: Transfer confirmation
    
    Gateway->>Settlement: Settlement webhook
    Settlement->>Audit: Log settlement completion
    Settlement->>Settlement: Update settlement records
    
    Settlement->>School: Settlement notification
    School->>Settlement: Request settlement report
    Settlement->>School: Provide detailed report
    
    Note over Audit: Compliance reporting
    Audit->>Audit: Generate monthly compliance report
```

### 6. Error Handling and Recovery Flow

```mermaid
flowchart TD
    A[Payment Processing] --> B{Error Occurred?}
    B -->|No| C[Success Path]
    B -->|Yes| D[Identify Error Type]
    
    D --> E{Error Type}
    E -->|Gateway Error| F[Retry with Backup Gateway]
    E -->|Network Error| G[Retry After Delay]
    E -->|Validation Error| H[Return Error to User]
    E -->|System Error| I[Log Critical Alert]
    
    F --> J{Retry Successful?}
    G --> J
    J -->|Yes| C
    J -->|No| K[Mark Transaction Failed]
    
    H --> L[User Corrects Input]
    I --> M[Admin Investigation]
    K --> N[Refund Process]
    L --> A
    M --> O[System Recovery]
    N --> P[Settlement Reconciliation]
```

## Data Flow Diagrams

### 1. Credential Management Data Flow

```mermaid
graph LR
    A[Admin Input: Gateway Credentials] --> B[Validation Service]
    B --> C[Encryption Service]
    C --> D[Encrypted Storage]
    
    E[Payment Request] --> F[Credential Retrieval]
    F --> G[Decryption Service]
    G --> H[Gateway API Call]
    
    D --> F
```

### 2. Transaction Lifecycle Data Flow

```mermaid
stateDiagram-v2
    [*] --> Initiated: Payment request
    Initiated --> Pending: Gateway order created
    Pending --> Processing: User redirected to gateway
    Processing --> Completed: Payment successful
    Processing --> Failed: Payment failed
    Processing --> Cancelled: User cancelled
    
    Completed --> Settled: Gateway settlement
    Failed --> Refund_Pending: Refund initiated
    Refund_Pending --> Refunded: Refund completed
    
    Settled --> [*]
    Refunded --> [*]
    Cancelled --> [*]
```

### 3. Security Event Flow

```mermaid
graph TD
    A[Security Event Detected] --> B[Event Classification]
    B --> C{Severity Level}
    
    C -->|Low| D[Log Event]
    C -->|Medium| E[Log + Alert]
    C -->|High| F[Log + Alert + Block User]
    C -->|Critical| G[Log + Alert + System Lockdown]
    
    D --> H[Audit Database]
    E --> H
    F --> H
    G --> H
    
    E --> I[Email Alert]
    F --> I
    G --> I
    
    F --> J[Temporary User Block]
    G --> K[System Protection Mode]
```

## API Flow Diagrams

### 1. Payment Initiation API Flow

```
POST /payment/initiate-payment

1. Request Validation
   ├── User Authentication Check
   ├── Fee ID Validation
   ├── Amount Validation
   └── Gateway Availability Check

2. Security Monitoring
   ├── Rate Limiting Check
   ├── IP Validation
   ├── Fraud Detection
   └── Audit Logging

3. Payment Processing
   ├── Create Transaction Record
   ├── Generate Gateway Order
   ├── Update Transaction with Order Details
   └── Return Checkout URL

4. Response Generation
   ├── Format Success Response
   ├── Include Payment Details
   └── Return to Client
```

### 2. Webhook Processing API Flow

```
POST /payment-settlement/webhook/:provider

1. Webhook Verification
   ├── Signature Validation
   ├── Provider Verification
   ├── Payload Structure Check
   └── Replay Attack Prevention

2. Transaction Processing
   ├── Find Transaction by Gateway Order ID
   ├── Validate Amount and Status
   ├── Update Transaction Status
   └── Generate Invoice (if payment successful)

3. Settlement Processing
   ├── Mark for Settlement Batch
   ├── Update Settlement Records
   ├── Log Settlement Event
   └── Trigger Notifications

4. Audit and Compliance
   ├── Security Event Logging
   ├── Audit Trail Update
   ├── Compliance Check
   └── Generate Response
```

## System Integration Points

### 1. External Gateway Integration

```mermaid
graph LR
    subgraph "KCS Platform"
        A[Payment Service]
        B[Gateway Adapter]
        C[Webhook Handler]
    end
    
    subgraph "Razorpay"
        D[Orders API]
        E[Payments API]
        F[Settlements API]
        G[Webhooks]
    end
    
    subgraph "PayU"
        H[Payment API]
        I[Verification API]
        J[Settlement API]
        K[Notifications]
    end
    
    subgraph "Cashfree"
        L[Orders API]
        M[Payments API]
        N[Settlements API]
        O[Webhooks]
    end
    
    A --> B
    B --> D
    B --> H
    B --> L
    
    G --> C
    K --> C
    O --> C
```

### 2. Internal Service Communication

```mermaid
graph TB
    A[API Gateway] --> B[Auth Service]
    A --> C[Payment Service]
    A --> D[Settlement Service]
    
    C --> E[Security Monitor]
    C --> F[Audit Service]
    C --> G[Notification Service]
    
    D --> F
    D --> G
    D --> H[Compliance Service]
    
    E --> I[Alert Service]
    F --> J[Reporting Service]
```

This comprehensive flow documentation provides a complete picture of how the SaaS payment gateway system operates, from school setup through payment processing to settlement and compliance reporting. The system is designed to be secure, scalable, and compliant with financial regulations while providing an excellent user experience for schools, parents, and students.
