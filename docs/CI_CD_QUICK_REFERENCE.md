# CI/CD Quick Reference Guide

Quick commands and procedures for managing the CI/CD deployment pipeline.

## 🚀 Common Deployment Tasks

### Trigger Deployment

```bash
# Push to dev branch (automatic deployment)
git checkout dev
git add .
git commit -m "your commit message"
git push origin dev
```

### Monitor Deployment

```bash
# Using GitHub CLI
gh run watch

# List recent deployments
gh run list --workflow=deploy-dev.yml --limit 10

# View specific deployment
gh run view <run-id>

# Download deployment logs
gh run download <run-id>
```

### Manual Deployment Check

```bash
# Check workflow status in browser
# https://github.com/omyratechnologies/KCS-Backend/actions
```

## 🔍 Server Health Checks

### Quick Health Check

```bash
# Public endpoint (HTTPS)
curl https://devapi.letscatchup-kcs.com/api/health | jq .

# From server (local)
ssh ubuntu@13.202.79.48 "curl -s http://localhost:4500/api/health | jq ."
```

### Detailed Service Status

```bash
# SSH into server
ssh ubuntu@13.202.79.48

# Check all services
sudo systemctl status kcs-backend couchbase-server redis-server nginx

# Check specific service
sudo systemctl status kcs-backend

# View logs
sudo journalctl -u kcs-backend -n 50
sudo journalctl -u kcs-backend -f  # Follow logs
```

## 🔄 Rollback Procedures

### Quick Rollback (Last Commit)

```bash
# On dev branch
git revert HEAD
git push origin dev  # Triggers auto-deployment
```

### Manual Rollback on Server

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
cd /home/ubuntu/KCS-Backend
git reset --hard HEAD~1
bun install
bun run build
sudo systemctl restart kcs-backend
curl http://localhost:4500/api/health
EOF
```

### Rollback to Specific Commit

```bash
# Find commit hash
git log --oneline -10

# Rollback locally
git reset --hard <commit-hash>
git push -f origin dev  # Force push triggers deployment

# Or manually on server
ssh ubuntu@13.202.79.48 << EOF
cd /home/ubuntu/KCS-Backend
git fetch origin
git reset --hard <commit-hash>
bun install
bun run build
sudo systemctl restart kcs-backend
EOF
```

## 🛠️ Service Management

### Restart Application

```bash
# From local machine
ssh ubuntu@13.202.79.48 "sudo systemctl restart kcs-backend"

# On server
sudo systemctl restart kcs-backend
```

### View Application Logs

```bash
# Real-time logs
ssh ubuntu@13.202.79.48 "sudo journalctl -u kcs-backend -f"

# Last 100 lines
ssh ubuntu@13.202.79.48 "sudo journalctl -u kcs-backend -n 100"

# Logs from last hour
ssh ubuntu@13.202.79.48 "sudo journalctl -u kcs-backend --since '1 hour ago'"

# Error logs only
ssh ubuntu@13.202.79.48 "sudo journalctl -u kcs-backend | grep ERROR"
```

### Stop/Start Application

```bash
# Stop application
ssh ubuntu@13.202.79.48 "sudo systemctl stop kcs-backend"

# Start application
ssh ubuntu@13.202.79.48 "sudo systemctl start kcs-backend"

# Check status
ssh ubuntu@13.202.79.48 "sudo systemctl status kcs-backend"
```

## 🗄️ Database Management

### Couchbase Health Check

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Service status
sudo systemctl status couchbase-server

# Cluster info
curl -s -u Administrator:SecureP@ss2024 http://localhost:8091/pools/default | jq .

# Bucket info
curl -s -u Administrator:SecureP@ss2024 http://localhost:8091/pools/default/buckets/kcs_lms | jq .

# Check indexes
curl -s -u Administrator:SecureP@ss2024 http://localhost:8093/query/service \
  -d 'statement=SELECT * FROM system:indexes WHERE keyspace_id="kcs_lms"' | jq .
EOF
```

### Redis Health Check

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Service status
sudo systemctl status redis-server

# Ping test
redis-cli -a RedisP@ss2024 ping

# Info
redis-cli -a RedisP@ss2024 info | head -20

# Memory usage
redis-cli -a RedisP@ss2024 info memory | grep used_memory_human
EOF
```

## 🔍 Troubleshooting Commands

### Check Server Resources

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# CPU and memory
htop -n 1

# Disk usage
df -h

# Memory usage
free -h

# Process list
ps aux | grep -E "bun|couchbase|redis|nginx"
EOF
```

### Network Connectivity

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Check listening ports
sudo netstat -tlnp | grep -E "4500|4501|8091|6379|80|443"

# Test local endpoints
curl -s http://localhost:4500/api/health
curl -s http://localhost:8091/ui/index.html

# DNS resolution
nslookup devapi.letscatchup-kcs.com
EOF
```

### SSL Certificate Status

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Check certificate expiry
sudo certbot certificates

# Test SSL configuration
echo | openssl s_client -servername devapi.letscatchup-kcs.com -connect devapi.letscatchup-kcs.com:443 2>/dev/null | openssl x509 -noout -dates
EOF
```

## 🔐 Security Checks

### Firewall Status

```bash
ssh ubuntu@13.202.79.48 "sudo ufw status numbered"
```

### Check Failed Login Attempts

```bash
ssh ubuntu@13.202.79.48 "sudo grep 'Failed password' /var/log/auth.log | tail -20"
```

### Review sudo Usage

```bash
ssh ubuntu@13.202.79.48 "sudo grep sudo /var/log/auth.log | tail -20"
```

## 📊 Performance Monitoring

### Real-time Monitoring

```bash
# Watch service status
ssh ubuntu@13.202.79.48 "watch -n 2 'sudo systemctl status kcs-backend'"

# Watch health endpoint
watch -n 5 "curl -s https://devapi.letscatchup-kcs.com/api/health | jq ."

# Monitor logs
ssh ubuntu@13.202.79.48 "sudo journalctl -u kcs-backend -f"
```

### Application Metrics

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Check uptime from health endpoint
curl -s http://localhost:4500/api/health | jq '.uptime'

# Count errors in logs
sudo journalctl -u kcs-backend --since today | grep -c ERROR

# Check restart count
sudo systemctl show kcs-backend | grep RestartCount
EOF
```

## 🔧 Maintenance Tasks

### Update Dependencies

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
cd /home/ubuntu/KCS-Backend
bun update
bun install
bun run build
sudo systemctl restart kcs-backend
EOF
```

### Clean Old Logs

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Clean journald logs older than 30 days
sudo journalctl --vacuum-time=30d

# Clean old system logs
sudo apt clean
sudo apt autoremove -y
EOF
```

### Backup Database

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Create backup directory
mkdir -p ~/backups/$(date +%Y%m%d)

# Backup Couchbase
/opt/couchbase/bin/cbbackup http://localhost:8091 \
  ~/backups/$(date +%Y%m%d)/couchbase \
  -u Administrator -p SecureP@ss2024

# Backup Redis
sudo cp /var/lib/redis/dump.rdb ~/backups/$(date +%Y%m%d)/redis-dump.rdb
EOF
```

## 🚨 Emergency Procedures

### Application Not Responding

```bash
# Quick restart
ssh ubuntu@13.202.79.48 "sudo systemctl restart kcs-backend"

# If still not responding, force restart
ssh ubuntu@13.202.79.48 << 'EOF'
sudo systemctl stop kcs-backend
sleep 5
sudo systemctl start kcs-backend
sudo systemctl status kcs-backend
EOF
```

### Database Connection Issues

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Restart Couchbase
sudo systemctl restart couchbase-server
sleep 30

# Restart application
sudo systemctl restart kcs-backend
sleep 10

# Check health
curl http://localhost:4500/api/health
EOF
```

### Out of Memory

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Check memory usage
free -h

# Clear Redis cache if needed
redis-cli -a RedisP@ss2024 FLUSHALL

# Restart services
sudo systemctl restart redis-server
sudo systemctl restart kcs-backend
EOF
```

### Disk Space Full

```bash
ssh ubuntu@13.202.79.48 << 'EOF'
# Check disk usage
df -h

# Clean logs
sudo journalctl --vacuum-size=1G

# Clean package cache
sudo apt clean
sudo apt autoremove -y

# Clean old backups
rm -rf ~/backups/old/*
EOF
```

## 📱 GitHub CLI Setup

### Install GitHub CLI

```bash
# macOS
brew install gh

# Ubuntu (on server)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y
```

### Authenticate

```bash
gh auth login
```

## 📋 Quick Checklist

### Before Deployment
- [ ] Code reviewed and tested locally
- [ ] All tests passing
- [ ] Dependencies updated
- [ ] Environment variables checked
- [ ] Breaking changes documented

### After Deployment
- [ ] Health endpoint returns healthy
- [ ] Application logs show no errors
- [ ] Database connection successful
- [ ] All services running
- [ ] Performance metrics normal

### Weekly Maintenance
- [ ] Check SSL certificate expiry
- [ ] Review application logs
- [ ] Update system packages
- [ ] Check disk usage
- [ ] Review security logs

---

**Quick Access URLs:**
- Health: https://devapi.letscatchup-kcs.com/api/health
- GitHub Actions: https://github.com/omyratechnologies/KCS-Backend/actions
- Server: `ssh ubuntu@13.202.79.48`

**Emergency Contact:**
- DevOps Team: [contact info]
- Server IP: 13.202.79.48
- Domain: devapi.letscatchup-kcs.com
