# Payment System Deployment & Configuration Guide

## Overview

This guide provides step-by-step instructions for deploying and configuring the SaaS School Payment System. It covers environment setup, security configuration, payment gateway integration, and production deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Payment Gateway Setup](#payment-gateway-setup)
5. [Security Configuration](#security-configuration)
6. [Infrastructure Deployment](#infrastructure-deployment)
7. [Monitoring & Logging](#monitoring--logging)
8. [Production Checklist](#production-checklist)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- Network: 1Gbps

**Recommended Requirements:**
- CPU: 8 cores
- RAM: 16GB
- Storage: 500GB SSD
- Network: 10Gbps

### Software Dependencies

```bash
# Node.js and npm
Node.js: v18.17.0 or higher
npm: v9.0.0 or higher

# Database
Couchbase Server: v7.0 or higher

# Containerization
Docker: v20.0 or higher
Docker Compose: v2.0 or higher

# Optional: Kubernetes
Kubernetes: v1.25 or higher
Helm: v3.10 or higher
```

### External Services

- **Payment Gateways**: Razorpay, Stripe, PayU accounts
- **Email Service**: SMTP or AWS SES
- **SMS Service**: Twilio or AWS SNS
- **Storage**: AWS S3 or compatible
- **CDN**: CloudFlare or AWS CloudFront
- **Monitoring**: DataDog, New Relic, or Prometheus

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/kcs-backend.git
cd kcs-backend
```

### 2. Environment Configuration

Create environment files for different stages:

#### Development Environment (.env.development)

```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1
BASE_URL=http://localhost:3000

# Database
COUCHBASE_CONNECTION_STRING=couchbase://localhost
COUCHBASE_USERNAME=Administrator
COUCHBASE_PASSWORD=password
COUCHBASE_BUCKET=kcs_development
COUCHBASE_SCOPE=_default
COUCHBASE_COLLECTION=_default

# Redis Cache
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# Security
JWT_SECRET=your-super-secret-jwt-key-development
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key!
BCRYPT_ROUNDS=12

# Payment Gateways - Test Keys
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=test_secret_key_here
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret

STRIPE_PUBLISHABLE_KEY=pk_test_1234567890
STRIPE_SECRET_KEY=sk_test_1234567890
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890

PAYU_MERCHANT_KEY=test_merchant_key
PAYU_MERCHANT_SALT=test_merchant_salt
PAYU_BASE_URL=https://test.payu.in

# Email Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@schoolsaas.com

# File Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-west-2
AWS_BUCKET=schoolsaas-dev-files

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty
LOG_FILE_ENABLED=true
LOG_FILE_PATH=./logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# Feature Flags
ENABLE_PAYMENT_WEBHOOKS=true
ENABLE_AUTO_SETTLEMENT=false
ENABLE_FRAUD_DETECTION=false
```

#### Production Environment (.env.production)

```bash
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1
BASE_URL=https://api.yourschoolsaas.com

# Database
COUCHBASE_CONNECTION_STRING=couchbase://prod-cluster.example.com
COUCHBASE_USERNAME=prod_user
COUCHBASE_PASSWORD=${COUCHBASE_PASSWORD}
COUCHBASE_BUCKET=kcs_production
COUCHBASE_SCOPE=payment
COUCHBASE_COLLECTION=transactions

# Redis Cache Cluster
REDIS_URL=redis://prod-redis-cluster.example.com:6379
REDIS_TTL=7200
REDIS_PASSWORD=${REDIS_PASSWORD}

# Security - Use secrets management
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
ENCRYPTION_KEY=${ENCRYPTION_KEY}
BCRYPT_ROUNDS=14

# Payment Gateways - Production Keys
RAZORPAY_KEY_ID=${RAZORPAY_PROD_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_PROD_KEY_SECRET}
RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_PROD_WEBHOOK_SECRET}

STRIPE_PUBLISHABLE_KEY=${STRIPE_PROD_PUBLISHABLE_KEY}
STRIPE_SECRET_KEY=${STRIPE_PROD_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_PROD_WEBHOOK_SECRET}

PAYU_MERCHANT_KEY=${PAYU_PROD_MERCHANT_KEY}
PAYU_MERCHANT_SALT=${PAYU_PROD_MERCHANT_SALT}
PAYU_BASE_URL=https://secure.payu.in

# Email Configuration
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=587
SMTP_USER=${AWS_SES_USER}
SMTP_PASS=${AWS_SES_PASSWORD}
SMTP_FROM=noreply@yourschoolsaas.com

# File Storage
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=us-west-2
AWS_BUCKET=schoolsaas-prod-files

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/var/log/app/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# CORS
CORS_ORIGIN=https://yourschoolsaas.com,https://app.yourschoolsaas.com
CORS_CREDENTIALS=true

# Monitoring
DATADOG_API_KEY=${DATADOG_API_KEY}
NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}

# Feature Flags
ENABLE_PAYMENT_WEBHOOKS=true
ENABLE_AUTO_SETTLEMENT=true
ENABLE_FRAUD_DETECTION=true
```

### 3. Secrets Management

Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault:

```bash
# AWS Secrets Manager example
aws secretsmanager create-secret \
    --name "schoolsaas/payment/razorpay" \
    --description "Razorpay production credentials" \
    --secret-string '{
        "key_id": "rzp_live_...",
        "key_secret": "...",
        "webhook_secret": "..."
    }'
```

## Database Configuration

### 1. Couchbase Cluster Setup

#### Single Node Development Setup

```bash
# Start Couchbase using Docker
docker run -d --name couchbase \
    -p 8091-8096:8091-8096 \
    -p 11210:11210 \
    -e CLUSTER_USERNAME=Administrator \
    -e CLUSTER_PASSWORD=password \
    couchbase:latest
```

#### Production Cluster Setup

```yaml
# docker-compose.yml for Couchbase cluster
version: '3.8'
services:
  couchbase1:
    image: couchbase:latest
    ports:
      - "8091-8096:8091-8096"
      - "11210:11210"
    environment:
      - CLUSTER_USERNAME=Administrator
      - CLUSTER_PASSWORD=${COUCHBASE_PASSWORD}
    volumes:
      - couchbase1_data:/opt/couchbase/var
    
  couchbase2:
    image: couchbase:latest
    environment:
      - CLUSTER_USERNAME=Administrator
      - CLUSTER_PASSWORD=${COUCHBASE_PASSWORD}
    volumes:
      - couchbase2_data:/opt/couchbase/var
    depends_on:
      - couchbase1

volumes:
  couchbase1_data:
  couchbase2_data:
```

### 2. Database Initialization

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Create indexes
npm run db:create-indexes
```

### 3. Database Indexes Creation

```javascript
// scripts/create-indexes.js
const { ottoman } = require('./src/libs/db');

async function createIndexes() {
    const bucket = ottoman.bucket;
    
    // Payment transactions indexes
    await bucket.query(`
        CREATE INDEX idx_payment_campus_id 
        ON kcs_production.payment._default.payment_transaction(campus_id)
    `);
    
    await bucket.query(`
        CREATE INDEX idx_payment_student_id 
        ON kcs_production.payment._default.payment_transaction(student_id)
    `);
    
    await bucket.query(`
        CREATE INDEX idx_payment_status 
        ON kcs_production.payment._default.payment_transaction(status)
    `);
    
    await bucket.query(`
        CREATE INDEX idx_payment_date 
        ON kcs_production.payment._default.payment_transaction(payment_date)
    `);
    
    await bucket.query(`
        CREATE INDEX idx_payment_gateway 
        ON kcs_production.payment._default.payment_transaction(gateway_name)
    `);
    
    // School payment config indexes
    await bucket.query(`
        CREATE INDEX idx_school_config_campus 
        ON kcs_production.payment._default.school_payment_config(campus_id)
    `);
    
    // Fee structure indexes
    await bucket.query(`
        CREATE INDEX idx_fee_structure_campus_year 
        ON kcs_production.payment._default.fee_structure(campus_id, academic_year)
    `);
    
    console.log('All indexes created successfully');
}

createIndexes().catch(console.error);
```

## Payment Gateway Setup

### 1. Razorpay Configuration

#### Account Setup
1. Create Razorpay account at https://razorpay.com
2. Complete KYC verification
3. Add bank account details
4. Generate API keys

#### Configuration
```javascript
// Razorpay webhook configuration
const razorpayWebhookConfig = {
    url: 'https://api.yourschoolsaas.com/v1/payment/webhook/razorpay',
    events: [
        'payment.captured',
        'payment.failed',
        'order.paid',
        'settlement.processed'
    ],
    secret: process.env.RAZORPAY_WEBHOOK_SECRET
};
```

#### Test Configuration
```bash
# Test webhook endpoint
curl -X POST https://api.yourschoolsaas.com/v1/payment/webhook/razorpay \
    -H "Content-Type: application/json" \
    -H "X-Razorpay-Signature: test_signature" \
    -d '{
        "entity": "event",
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_123",
                    "status": "captured"
                }
            }
        }
    }'
```

### 2. Stripe Configuration

#### Account Setup
1. Create Stripe account at https://stripe.com
2. Complete business verification
3. Add bank account for payouts
4. Configure webhook endpoints

#### Connected Accounts Setup
```javascript
// Create connected account for school
const account = await stripe.accounts.create({
    type: 'express',
    country: 'IN',
    email: 'admin@school.com',
    capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
    }
});
```

### 3. PayU Configuration

#### Account Setup
1. Create PayU merchant account
2. Complete documentation and verification
3. Obtain merchant credentials
4. Configure payment methods

#### Integration Test
```javascript
// Test PayU integration
const payuTest = {
    key: process.env.PAYU_MERCHANT_KEY,
    txnid: 'test_txn_' + Date.now(),
    amount: '100.00',
    productinfo: 'Test Payment',
    firstname: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    surl: 'https://api.yourschoolsaas.com/payment/success',
    furl: 'https://api.yourschoolsaas.com/payment/failure'
};
```

## Security Configuration

### 1. SSL/TLS Setup

#### Let's Encrypt Configuration
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.yourschoolsaas.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/schoolsaas-api
server {
    listen 443 ssl http2;
    server_name api.yourschoolsaas.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourschoolsaas.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourschoolsaas.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout configuration
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Webhook endpoints - higher rate limits
    location /v1/payment/webhook/ {
        limit_req_zone $binary_remote_addr zone=webhook:10m rate=100r/s;
        limit_req zone=webhook burst=200 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourschoolsaas.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. Firewall Configuration

```bash
# UFW Configuration
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific database access (if needed)
sudo ufw allow from 10.0.0.0/8 to any port 8091

# Check status
sudo ufw status verbose
```

### 3. Application Security

#### Security Middleware Setup
```javascript
// src/middlewares/security.middleware.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

export const securityMiddleware = {
    // Helmet for security headers
    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://api.razorpay.com"]
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }),
    
    // Rate limiting
    rateLimit: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false
    }),
    
    // Speed limiting
    speedLimit: slowDown({
        windowMs: 15 * 60 * 1000, // 15 minutes
        delayAfter: 50, // allow 50 requests per 15 minutes at full speed
        delayMs: 500 // slow down subsequent requests by 500ms
    })
};
```

## Infrastructure Deployment

### 1. Docker Configuration

#### Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

# Build application
RUN npm run build

# Set user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose for Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - redis
      - couchbase
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  couchbase:
    image: couchbase:latest
    ports:
      - "8091-8096:8091-8096"
      - "11210:11210"
    environment:
      - CLUSTER_USERNAME=Administrator
      - CLUSTER_PASSWORD=${COUCHBASE_PASSWORD}
    volumes:
      - couchbase_data:/opt/couchbase/var
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  redis_data:
  couchbase_data:

networks:
  app-network:
    driver: bridge
```

### 2. Kubernetes Deployment

#### Namespace and ConfigMap
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: schoolsaas-payment

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: payment-config
  namespace: schoolsaas-payment
data:
  NODE_ENV: "production"
  API_VERSION: "v1"
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"
```

#### Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: payment-secrets
  namespace: schoolsaas-payment
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  encryption-key: <base64-encoded-key>
  couchbase-password: <base64-encoded-password>
  redis-password: <base64-encoded-password>
  razorpay-key-secret: <base64-encoded-secret>
  stripe-secret-key: <base64-encoded-key>
```

#### Deployment
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  namespace: schoolsaas-payment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-api
  template:
    metadata:
      labels:
        app: payment-api
    spec:
      containers:
      - name: payment-api
        image: schoolsaas/payment-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: payment-config
              key: NODE_ENV
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: payment-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: payment-api-service
  namespace: schoolsaas-payment
spec:
  selector:
    app: payment-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payment-api-ingress
  namespace: schoolsaas-payment
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.yourschoolsaas.com
    secretName: payment-api-tls
  rules:
  - host: api.yourschoolsaas.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: payment-api-service
            port:
              number: 80
```

### 3. CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      couchbase:
        image: couchbase:latest
        env:
          CLUSTER_USERNAME: Administrator
          CLUSTER_PASSWORD: password
        ports:
          - 8091:8091
      
      redis:
        image: redis:6
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm test
      env:
        NODE_ENV: test
        COUCHBASE_CONNECTION_STRING: couchbase://localhost
        REDIS_URL: redis://localhost:6379
    
    - name: Run security audit
      run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ secrets.DOCKER_REGISTRY }}
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          ${{ secrets.DOCKER_REGISTRY }}/schoolsaas/payment-api:latest
          ${{ secrets.DOCKER_REGISTRY }}/schoolsaas/payment-api:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.25.0'
    
    - name: Configure kubeconfig
      run: |
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/payment-api payment-api=${{ secrets.DOCKER_REGISTRY }}/schoolsaas/payment-api:${{ github.sha }} -n schoolsaas-payment
        kubectl rollout status deployment/payment-api -n schoolsaas-payment
```

## Monitoring & Logging

### 1. Application Monitoring

#### Health Check Endpoints
```javascript
// src/routes/health.route.ts
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', async (ctx) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version,
        environment: process.env.NODE_ENV,
        checks: {
            database: await checkDatabase(),
            redis: await checkRedis(),
            payment_gateways: await checkPaymentGateways()
        }
    };

    const isHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
    return ctx.json(health, isHealthy ? 200 : 503);
});

app.get('/ready', async (ctx) => {
    // Readiness check for Kubernetes
    const ready = await checkReadiness();
    return ctx.json({ status: ready ? 'ready' : 'not ready' }, ready ? 200 : 503);
});

export default app;
```

#### Prometheus Metrics
```javascript
// src/utils/metrics.util.ts
import prometheus from 'prom-client';

// Create custom metrics
const paymentCounter = new prometheus.Counter({
    name: 'payment_transactions_total',
    help: 'Total number of payment transactions',
    labelNames: ['gateway', 'status', 'payment_method']
});

const paymentDuration = new prometheus.Histogram({
    name: 'payment_duration_seconds',
    help: 'Payment processing duration',
    labelNames: ['gateway', 'payment_method']
});

const gatewayHealth = new prometheus.Gauge({
    name: 'payment_gateway_health',
    help: 'Payment gateway health status',
    labelNames: ['gateway']
});

export { paymentCounter, paymentDuration, gatewayHealth };
```

### 2. Structured Logging

#### Winston Configuration
```javascript
// src/utils/logger.util.ts
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: {
        service: 'payment-api',
        version: process.env.npm_package_version,
        environment: process.env.NODE_ENV
    },
    transports: [
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }),
        new winston.transports.File({
            filename: 'logs/combined.log'
        })
    ]
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

export default logger;
```

### 3. Error Tracking

#### Sentry Configuration
```javascript
// src/utils/sentry.util.ts
import * as Sentry from '@sentry/node';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app })
    ],
    tracesSampleRate: 0.1
});

export default Sentry;
```

## Production Checklist

### Pre-Deployment Checklist

- [ ] **Environment Configuration**
  - [ ] Production environment variables configured
  - [ ] Secrets properly managed (not in code)
  - [ ] Database connection strings updated
  - [ ] Payment gateway credentials verified

- [ ] **Security**
  - [ ] SSL certificates installed and verified
  - [ ] Security headers configured
  - [ ] Rate limiting implemented
  - [ ] CORS properly configured
  - [ ] Input validation in place
  - [ ] SQL injection protection enabled

- [ ] **Database**
  - [ ] Production database cluster setup
  - [ ] Indexes created for performance
  - [ ] Backup strategy implemented
  - [ ] Connection pooling configured

- [ ] **Payment Gateways**
  - [ ] Production API keys configured
  - [ ] Webhook endpoints tested
  - [ ] Settlement accounts verified
  - [ ] Test transactions completed

- [ ] **Infrastructure**
  - [ ] Load balancer configured
  - [ ] Auto-scaling rules set
  - [ ] Health checks implemented
  - [ ] Monitoring and alerting active

- [ ] **Testing**
  - [ ] Unit tests passing
  - [ ] Integration tests passing
  - [ ] Security tests completed
  - [ ] Load testing performed
  - [ ] Penetration testing done

### Post-Deployment Checklist

- [ ] **Verification**
  - [ ] Health endpoints responding
  - [ ] Payment flows working
  - [ ] Webhooks receiving events
  - [ ] Database queries performing well

- [ ] **Monitoring**
  - [ ] Application metrics collecting
  - [ ] Error tracking active
  - [ ] Log aggregation working
  - [ ] Alerts configured

- [ ] **Documentation**
  - [ ] API documentation updated
  - [ ] Deployment notes documented
  - [ ] Troubleshooting guide updated
  - [ ] Team notified of deployment

## Troubleshooting

### Common Issues

#### 1. Payment Gateway Connection Issues

**Problem**: Gateway API calls failing
```bash
# Check gateway connectivity
curl -v https://api.razorpay.com/v1/orders \
    -H "Authorization: Basic $(echo -n 'key_id:key_secret' | base64)"
```

**Solution**:
- Verify API credentials
- Check network connectivity
- Validate webhook configurations
- Review rate limiting

#### 2. Database Performance Issues

**Problem**: Slow query performance
```sql
-- Check query performance
EXPLAIN SELECT * FROM payment_transaction 
WHERE campus_id = 'campus123' 
AND payment_date BETWEEN '2025-06-01' AND '2025-06-30';
```

**Solution**:
- Create appropriate indexes
- Optimize query patterns
- Implement connection pooling
- Monitor database metrics

#### 3. High Memory Usage

**Problem**: Application consuming excessive memory
```bash
# Monitor memory usage
docker stats payment-api
```

**Solution**:
- Profile memory usage
- Implement garbage collection tuning
- Check for memory leaks
- Optimize data structures

#### 4. SSL Certificate Issues

**Problem**: SSL certificate expired or invalid
```bash
# Check certificate validity
openssl s_client -connect api.yourschoolsaas.com:443 -servername api.yourschoolsaas.com
```

**Solution**:
- Renew SSL certificates
- Update certificate paths
- Restart web server
- Verify certificate chain

### Debugging Commands

```bash
# Application logs
docker logs payment-api -f

# Database status
docker exec -it couchbase cbstats localhost:11210 all

# Redis status
docker exec -it redis redis-cli info

# Network connectivity
telnet api.razorpay.com 443

# Process monitoring
htop

# Disk usage
df -h

# Memory usage
free -m
```

### Support Contacts

- **Infrastructure**: infrastructure@yourcompany.com
- **Security**: security@yourcompany.com  
- **Payment Gateways**: payments@yourcompany.com
- **Database**: database@yourcompany.com

---

**Document Version**: 1.0  
**Last Updated**: June 23, 2025  
**Next Review**: July 23, 2025
