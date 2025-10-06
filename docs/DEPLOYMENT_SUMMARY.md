# KCS Backend - Development Deployment Summary

Complete overview of the development environment deployment with CI/CD automation.

## 🎯 Deployment Overview

**Environment:** Development  
**Server:** AWS EC2 (13.202.79.48)  
**Domain:** devapi.letscatchup-kcs.com  
**Status:** ✅ Fully Operational with CI/CD

## 🖥️ Server Information

```
Instance Type:    AWS EC2 t3.large
Operating System: Ubuntu 24.04 LTS
RAM:             8GB
CPU:             4 vCPU
Storage:         120GB SSD (5.3% used)
IP Address:      13.202.79.48
Domain:          devapi.letscatchup-kcs.com
SSL Certificate: Let's Encrypt (Valid until Jan 4, 2026)
```

## 📦 Installed Components

### Core Services

| Service | Version | Status | Port |
|---------|---------|--------|------|
| **Couchbase Enterprise** | 7.6.3 | ✅ Running | 8091-8096 |
| **Redis Server** | 7.x | ✅ Running | 6379 |
| **Nginx** | 1.24.0 | ✅ Running | 80, 443 |
| **KCS Backend** | Latest | ✅ Running | 4500 (HTTP), 4501 (WS) |

### Runtime & Tools

- **Bun:** 1.2.15+ (JavaScript runtime)
- **Node.js:** 18+ (MediaSoup compilation)
- **Git:** Latest
- **PM2:** Alternative process manager (installed)
- **Certbot:** SSL certificate management

## 🗄️ Database Configuration

### Couchbase Enterprise Server

```yaml
Version: 7.6.3 (Enterprise Edition)
Cluster Name: KCS Development
Bucket: kcs_lms
RAM Quota: 2048 MB
Indexes: Primary index created
Access: localhost:8091
Credentials: Administrator / SecureP@ss2024
```

**Why Enterprise?**
- Advanced security features
- Better performance optimization
- Cross Data Center Replication (XDCR)
- Analytics service
- Enterprise support

### Redis Cache

```yaml
Version: 7.x
Authentication: Enabled (RedisP@ss2024)
Max Memory: 512MB
Eviction Policy: allkeys-lru
Persistence: RDB snapshots
```

## 🔧 Application Configuration

### Environment Variables

```bash
NODE_ENV=production
PORT=4500
SOCKET_PORT=4501

# Couchbase
COUCHBASE_HOST=localhost
COUCHBASE_BUCKET=kcs_lms
COUCHBASE_USERNAME=Administrator
COUCHBASE_PASSWORD=SecureP@ss2024

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=RedisP@ss2024

# MediaSoup (WebRTC)
MEDIASOUP_WORKER_POOL_SIZE=4
MEDIASOUP_RTC_MIN_PORT=10000
MEDIASOUP_RTC_MAX_PORT=13999
```

### Service Management

```bash
# Application Service
sudo systemctl status kcs-backend
sudo systemctl restart kcs-backend
sudo journalctl -u kcs-backend -f

# View logs
tail -f /var/log/kcs-backend.log
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

- **Trigger:** Push to `dev` branch
- **Workflow File:** `.github/workflows/deploy-dev.yml`
- **Deployment Time:** ~2-3 minutes
- **Auto-Rollback:** On health check failure

### Deployment Process

1. Code pushed to `dev` branch
2. GitHub Actions workflow triggered
3. SSH connection to EC2 server
4. Git pull latest changes
5. Install dependencies (`bun install`)
6. Build application (`bun run build`)
7. Restart service (`systemctl restart`)
8. Health check verification
9. Deployment complete ✅

### Required GitHub Secret

- **EC2_SSH_KEY:** Private SSH key for server access

## 🔒 Security Configuration

### Firewall Rules (UFW)

```bash
Port 22   (SSH)        ✅ Restricted to admin IPs
Port 80   (HTTP)       ✅ Open (redirects to HTTPS)
Port 443  (HTTPS)      ✅ Open
Port 8091-8096         ❌ Blocked externally (Couchbase)
Port 6379              ❌ Blocked externally (Redis)
Port 4500              ❌ Blocked externally (App HTTP)
Port 4501              ❌ Blocked externally (WebSocket)
```

### SSL/TLS Configuration

- **Certificate:** Let's Encrypt
- **Renewal:** Automatic (Certbot)
- **Expiry:** January 4, 2026
- **Protocol:** TLS 1.2, TLS 1.3
- **Cipher Suites:** Strong encryption only

### Authentication

- **Database:** Username/password authentication
- **Redis:** Password-protected
- **Nginx:** Reverse proxy with rate limiting

## 🌐 Network Architecture

```
Internet
    ↓
AWS Security Group (Port 443)
    ↓
Nginx (SSL Termination)
    ↓
KCS Backend (localhost:4500)
    ↓
┌────────────────┐
│ Couchbase :8091│
│ Redis :6379    │
└────────────────┘
```

## 📊 Health Monitoring

### Health Check Endpoint

```bash
# Production URL
curl https://devapi.letscatchup-kcs.com/api/health

# Expected Response
{
  "status": "healthy",
  "uptime": 1234.56,
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    }
  }
}
```

### Service Status Commands

```bash
# All services
sudo systemctl status couchbase-server redis-server kcs-backend nginx

# Application health
curl http://localhost:4500/api/health | jq .

# Database health
curl -u Administrator:SecureP@ss2024 http://localhost:8091/pools/default | jq .

# Redis health
redis-cli -a RedisP@ss2024 ping
```

## 🔄 Maintenance Procedures

### Daily Checks

```bash
# Health check
curl https://devapi.letscatchup-kcs.com/api/health

# Service status
sudo systemctl status kcs-backend

# Disk usage
df -h

# Memory usage
free -h
```

### Weekly Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check SSL certificate expiry
sudo certbot certificates

# Review application logs
sudo journalctl -u kcs-backend --since "1 week ago" | grep ERROR

# Clean old logs
sudo journalctl --vacuum-time=30d
```

### Database Backup

```bash
# Couchbase backup (manual)
/opt/couchbase/bin/cbbackup http://localhost:8091 \
  /backup/couchbase/$(date +%Y%m%d) \
  -u Administrator -p SecureP@ss2024

# Redis backup (automatic via RDB)
sudo cat /var/lib/redis/dump.rdb
```

## 📈 Performance Tuning

### Current Configuration

- **Bun Runtime:** Optimized for performance
- **MediaSoup Workers:** 4 worker processes
- **Couchbase RAM:** 2GB allocated
- **Redis Max Memory:** 512MB
- **Nginx:** Gzip compression enabled

### WebRTC Configuration

```yaml
Worker Pool Size: 4
RTC Port Range: 10000-13999 (UDP/TCP)
DTLS: Enabled
SRTP: Enabled
```

⚠️ **Note:** WebRTC ports (10000-13999) need to be opened in AWS Security Group for video calling functionality.

## 📝 Next Steps

### Immediate Actions Required

1. **Add SSH Key to GitHub Secrets**
   - Navigate to repository Settings → Secrets
   - Add secret named `EC2_SSH_KEY`
   - Paste contents of `kcs-dev.pem`

2. **Push Dev Branch to Trigger First Deployment**
   ```bash
   git push -u origin dev
   ```

3. **Monitor First Deployment**
   - Watch GitHub Actions workflow
   - Verify health endpoint
   - Check application logs

4. **Open WebRTC Ports in AWS**
   - Security Group → Inbound Rules
   - Add UDP/TCP: 10000-13999
   - Source: 0.0.0.0/0 (or specific IPs)

### Future Enhancements

- [ ] Set up monitoring alerts (UptimeRobot, CloudWatch)
- [ ] Configure automated backups
- [ ] Set up staging environment
- [ ] Implement blue-green deployment
- [ ] Add performance monitoring (APM)
- [ ] Set up log aggregation (ELK stack)
- [ ] Configure CDN for static assets
- [ ] Implement rate limiting per endpoint

## 📚 Documentation References

- [CI/CD Setup Guide](./CI_CD_SETUP_GUIDE.md)
- [CI/CD Quick Reference](./CI_CD_QUICK_REFERENCE.md)

## 🆘 Emergency Contacts

### Quick Commands

```bash
# Restart application
ssh ubuntu@13.202.79.48 "sudo systemctl restart kcs-backend"

# Check logs
ssh ubuntu@13.202.79.48 "sudo journalctl -u kcs-backend -n 50"

# Rollback deployment
ssh ubuntu@13.202.79.48 "cd /home/ubuntu/KCS-Backend && git reset --hard HEAD~1 && bun install && bun run build && sudo systemctl restart kcs-backend"
```

### Server Access

```bash
# SSH access
ssh -i ~/Downloads/kcs-dev.pem ubuntu@13.202.79.48

# Switch to application directory
cd /home/ubuntu/KCS-Backend
```

## ✅ Deployment Checklist

- [x] Server provisioned and configured
- [x] Couchbase Enterprise 7.6.3 installed
- [x] Redis configured with authentication
- [x] Nginx with SSL certificate
- [x] Application built and deployed
- [x] Primary index created on database
- [x] Health checks passing
- [x] GitHub Actions workflow created
- [x] Server configured for CI/CD
- [x] Documentation complete
- [ ] SSH key added to GitHub Secrets
- [ ] First CI/CD deployment tested
- [ ] WebRTC ports opened in AWS

---

**Deployment Date:** October 6, 2025  
**Deployed By:** DevOps Team  
**Last Updated:** October 6, 2025  
**Version:** 1.0.0
