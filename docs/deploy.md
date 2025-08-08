# 🚀 KCS Backend - Development Environment Deployment Solution

## 🎯 Overview

This comprehensive deployment solution provides **automation** for deploying CI/CD pipelines of the **KCS Backend** application with **Couchbase Enterprise Server** on AWS across **DEV** environment. It integrates infrastructure provisioning, configuration management, CI/CD automation, monitoring, and secure DNS setup using Cloudflare.

---

## 🏗️ Architecture Overview

```

──────────────────────────────────────────────┐
│        AWS Infrastructure                   │
├─────────────────────────────┬───────────────┤
│         DEV Environment     │               
│  devapi-letscatchup-kcs.com │
├─────────────────────────────┼
│                             │
│  ┌─────────────────────┐   │
│  │                     │   │
│  │  (SSL Termination)  │   │
│  └─────────────────────┘   │
│            │               │
│  ┌─────────────────────┐   │
│  │      NGINX          │   │
│  │   (Reverse Proxy)   │   │
│  └─────────────────────┘   │
│            │               │
│  ┌─────────────────────┐   │
│  │   Backend API       │   │
│  │  (Auto Scaling)     │   │
│  └─────────────────────┘   │
│            │               │
│  ┌─────────────────────┐   │
│  │   Couchbase         │   │
│  │  (3-Node Cluster)   │   │
│  └─────────────────────┘   │
│                            │
└────────────────────────────┴
              │
┌─────────────┼─────────────┐
│                           │
┌─────────────────┐   ┌─────────────────┐
│   Monitoring    │   │     CI/CD       │
│         Tools   │   │    Jenkins      │
│  CloudWatch     │   │                 │
└─────────────────┘   └─────────────────┘

```

---

## 🔄 Deployment Phases

### Phase 1: Infrastructure Provisioning

- AWS VPC
- EC2 instances for:
  - NGINX reverse proxy
  - Backend API (Bun runtime)
  - Couchbase Enterprise Server
- Couchbase cluster setup
- CloudWatch integration

### Phase 2: Configuration Management (Ansible)

- Install and configure Couchbase Enterprise Server
- Install and configure NGINX with SSL
- Configure Bun + backend runtime
- Set up databog for monitoring
- Deploy backend containers (Docker)
- Set up Certbot for Let's Encrypt auto-renewal
- Harden system (firewall, SSH, fail2ban)

### Phase 3: CI/CD Pipeline with Jenkins

- Hosted Jenkins server + agents
- GitHub integration (webhooks enabled)
- Jenkins Pipeline stages:
  - Checkout, build, and test using Bun + Jest
  - Lint, security scans (`ESLint`, `gitleaks`, `snyk`)
  - Docker image build and push to Amazon ECR
  - Blue-Green deployments using Ansible
  - Health check verification before switch
  - Rollback mechanism
  - Promotion from DEV

### Phase 4: Monitoring & Observability

- **CloudWatch Logs and Metrics** for system-level monitoring
- **Cloudflare Analytics** for API usage and DDoS protection
- Health-check endpoints (`/health`, `/uptime`)
- SSL certificate expiry monitoring

---

## 🌐 Cloudflare DNS Configuration

| Environment | Subdomain                    | Purpose                            |
|-------------|------------------------------|------------------------------------|
| DEV         | `devapi-letscatchup-kcs.com` | Maps to DEV environment            |

- **DNS Mode:** Full Strict  
- **Wildcard SSL:** Issued by Let's Encrypt (`devapi.letscatchup-kcs.com`)  
- **Auto-Renewal:** Handled by Certbot via cron + Ansible  
- **Cloudflare Features Used:**
  - DDoS protection
  - WAF (Web Application Firewall)
  - Rate limiting
  - HTTP/3 + Brotli compression
  - Optional: Cloudflare Workers (A/B testing, geo redirects)

---

## 📋 Environment Specs

### DEV

- **Domain:** `devapi-letscatchup-kcs.com`
- **SSL:** Let’s Encrypt
- **EC2:** 2x `t3.large`
- **Couchbase:** 3x `t3.medium`
- **Cache:** Upstash Redis
- **File Storage:** S3
- **Monitoring:** New Relic, CloudWatch



## 📦 Key Features

- ✅ **Zero-downtime deployments** via blue-green strategy  
- ✅ **CI/CD automation** with rollback capabilities  
- ✅ **SSL auto-renewal** with Let's Encrypt  
- ✅ **Observability with New Relic & CloudWatch**  
- ✅ **Secure, monitored DNS** via Cloudflare  
- ✅ **Ansible vault & SSH hardening**  
- ✅ **Automated backups & snapshot scheduling**

We already two ec2 instances for the backend API and Couchbase cluster, with NGINX handling SSL termination and reverse proxying requests to the backend. The Couchbase cluster is set up and configured with the necessary buckets and indexes. The Redis cache is provisioned via Upstash, and the Cloudflare DNS is configured to point to the NGINX instance.

Couchbase server IP: 15.206.158.52 only accessible from the backend server
Backend server IP: 65.2.31.97 also pointed to the domain `devapi-letscatchup-kcs.com`
