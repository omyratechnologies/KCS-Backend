# CI/CD Setup Guide - GitHub Actions Deployment

Complete guide for setting up continuous deployment to the development server using GitHub Actions.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Workflow Details](#workflow-details)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring](#monitoring)

## 🎯 Overview

This CI/CD pipeline automatically deploys the KCS Backend application to the development server whenever code is pushed to the `dev` branch.

**Server Details:**
- **IP:** 13.202.79.48
- **Domain:** devapi.letscatchup-kcs.com
- **OS:** Ubuntu 24.04 LTS
- **Runtime:** Bun 1.2.15+
- **User:** ubuntu

**Deployment Flow:**
1. Code pushed to `dev` branch
2. GitHub Actions triggers deployment workflow
3. SSH connection to EC2 server
4. Pull latest code from GitHub
5. Install dependencies with Bun
6. Build application
7. Restart systemd service
8. Health check verification

## ✅ Prerequisites

Before setting up the CI/CD pipeline, ensure:

1. ✅ Server is fully deployed and running
2. ✅ Application is working correctly
3. ✅ SSH access is configured
4. ✅ Sudoers file is configured for passwordless restart
5. ✅ Git repository is cloned on server at `/home/ubuntu/KCS-Backend`

## 🚀 Setup Instructions

### Step 1: Add SSH Key to GitHub Secrets

1. **Copy your SSH private key:**
   ```bash
   # On your local machine
   cat ~/Downloads/kcs-dev.pem | pbcopy
   ```

2. **Add to GitHub:**
   - Go to your repository: `https://github.com/omyratechnologies/KCS-Backend`
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `EC2_SSH_KEY`
   - Value: Paste the SSH private key content
   - Click **Add secret**

### Step 2: Verify Server Configuration

SSH into the server and verify the setup:

```bash
ssh ubuntu@13.202.79.48

# Check git repository
cd /home/ubuntu/KCS-Backend
git status
git remote -v

# Verify sudoers configuration
sudo cat /etc/sudoers.d/kcs-backend
# Should show: ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart kcs-backend

# Check service status
sudo systemctl status kcs-backend
```

### Step 3: Push Dev Branch

The dev branch is now clean and ready. Simply push to trigger deployment:

```bash
git push -u origin dev
```

### Step 4: Monitor First Deployment

1. **Watch GitHub Actions:**
   ```bash
   # Using GitHub CLI
   gh run watch
   
   # Or visit in browser
   # https://github.com/omyratechnologies/KCS-Backend/actions
   ```

2. **Check deployment logs** in the Actions tab

3. **Verify health endpoint:**
   ```bash
   curl https://devapi.letscatchup-kcs.com/api/health
   ```

## 📝 Workflow Details

### Trigger Conditions

The workflow runs when:
- Code is pushed to the `dev` branch
- Manually triggered via GitHub Actions UI (workflow_dispatch)

### Deployment Steps

1. **Checkout Code**: Gets the latest code from the repository
2. **SSH Connection**: Connects to EC2 server using stored SSH key
3. **Pull Changes**: Fetches and resets to latest `dev` branch code
4. **Install Dependencies**: Runs `bun install` to update packages
5. **Build Application**: Compiles TypeScript and prepares production build
6. **Restart Service**: Restarts the systemd service with zero-downtime
7. **Health Check**: Verifies the application is running correctly

### Environment Variables

The workflow uses these secrets:
- `EC2_SSH_KEY`: Private SSH key for server access

Hardcoded values (can be moved to secrets if needed):
- Server IP: `13.202.79.48`
- Username: `ubuntu`
- Project path: `/home/ubuntu/KCS-Backend`

## 🔧 Troubleshooting

### Deployment Fails with SSH Connection Error

**Symptom:** `Permission denied (publickey)` or connection timeout

**Solution:**
1. Verify SSH key is correctly added to GitHub Secrets
2. Ensure key has no extra whitespace or newlines
3. Check server security group allows SSH from GitHub IPs
4. Test SSH connection manually:
   ```bash
   ssh -i ~/Downloads/kcs-dev.pem ubuntu@13.202.79.48
   ```

### Deployment Fails at Git Pull

**Symptom:** `fatal: not a git repository` or merge conflicts

**Solution:**
1. SSH into server and check git status:
   ```bash
   ssh ubuntu@13.202.79.48
   cd /home/ubuntu/KCS-Backend
   git status
   git remote -v
   ```

2. If detached HEAD or conflicts:
   ```bash
   git fetch origin
   git reset --hard origin/dev
   ```

### Build Fails with Dependency Errors

**Symptom:** `error: package not found` or compilation errors

**Solution:**
1. Clear Bun cache on server:
   ```bash
   ssh ubuntu@13.202.79.48
   cd /home/ubuntu/KCS-Backend
   rm -rf node_modules
   rm -f bun.lockb
   bun install
   bun run build
   ```

2. Check if `package.json` has all required dependencies

### Service Restart Fails

**Symptom:** `Failed to restart kcs-backend.service`

**Solution:**
1. Check sudoers configuration:
   ```bash
   sudo cat /etc/sudoers.d/kcs-backend
   sudo visudo -c  # Validate syntax
   ```

2. Check service logs:
   ```bash
   sudo journalctl -u kcs-backend -n 50 --no-pager
   ```

3. Manually restart service:
   ```bash
   sudo systemctl restart kcs-backend
   sudo systemctl status kcs-backend
   ```

### Health Check Fails

**Symptom:** Application deployed but health check returns unhealthy

**Solution:**
1. Check application logs:
   ```bash
   sudo journalctl -u kcs-backend -f
   ```

2. Verify Couchbase is running:
   ```bash
   sudo systemctl status couchbase-server
   curl -u Administrator:SecureP@ss2024 http://localhost:8091/pools/default
   ```

3. Verify Redis is running:
   ```bash
   sudo systemctl status redis-server
   redis-cli -a RedisP@ss2024 ping
   ```

4. Check if primary index exists:
   ```bash
   curl -u Administrator:SecureP@ss2024 http://localhost:8093/query/service \
     -d 'statement=SELECT * FROM system:indexes WHERE keyspace_id="kcs_lms"'
   ```

## 🔄 Rollback Procedures

### Rollback to Previous Version

If a deployment causes issues, rollback to the last working version:

**Option 1: Revert on GitHub**
```bash
# On your local machine
git log --oneline  # Find the commit hash to rollback to
git revert <commit-hash>
git push origin dev  # This triggers automatic deployment
```

**Option 2: Manual Rollback on Server**
```bash
# SSH into server
ssh ubuntu@13.202.79.48
cd /home/ubuntu/KCS-Backend

# Find the commit to rollback to
git log --oneline -10

# Reset to that commit
git reset --hard <commit-hash>

# Rebuild and restart
bun install
bun run build
sudo systemctl restart kcs-backend

# Verify health
curl http://localhost:4500/api/health
```

**Option 3: Emergency Rollback**
```bash
# SSH into server
ssh ubuntu@13.202.79.48
cd /home/ubuntu/KCS-Backend

# Rollback to previous commit
git reset --hard HEAD~1

# Quick restart
bun install
bun run build
sudo systemctl restart kcs-backend
```

### Disable Auto-Deployment Temporarily

To prevent automatic deployments while debugging:

1. Go to repository **Settings** → **Actions** → **General**
2. Select **Disable actions** temporarily
3. Or rename the workflow file:
   ```bash
   mv .github/workflows/deploy-dev.yml .github/workflows/deploy-dev.yml.disabled
   ```

## 📊 Monitoring

### Check Deployment History

```bash
# Using GitHub CLI
gh run list --workflow=deploy-dev.yml --limit 10

# View specific run details
gh run view <run-id>

# Download logs
gh run download <run-id>
```

### Real-time Server Monitoring

```bash
# SSH into server
ssh ubuntu@13.202.79.48

# Watch service status
watch -n 2 'sudo systemctl status kcs-backend'

# Follow application logs
sudo journalctl -u kcs-backend -f

# Monitor system resources
htop

# Check health endpoint
watch -n 5 'curl -s http://localhost:4500/api/health | jq .'
```

### Set Up Monitoring Alerts (Optional)

Consider setting up monitoring using:
- **UptimeRobot**: Free uptime monitoring
- **Better Stack (formerly Logtail)**: Log aggregation
- **AWS CloudWatch**: Native AWS monitoring
- **GitHub Actions notifications**: Email/Slack on deployment failures

## 🔐 Security Considerations

### SSH Key Security

- ✅ SSH key stored as encrypted secret in GitHub
- ✅ Key only accessible during workflow execution
- ✅ No key exposure in logs or outputs
- ⚠️ Rotate SSH key every 90 days

### Sudoers Configuration

Current configuration:
```
ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart kcs-backend
```

This allows **only** restarting the specific service without password. It does **not** grant full sudo access.

### Network Security

- ✅ Port 22 restricted to necessary IPs only
- ✅ Application runs on localhost:4500
- ✅ Nginx handles external HTTPS traffic
- ✅ SSL certificate auto-renewed by Certbot

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Action Repository](https://github.com/appleboy/ssh-action)
- [Bun Documentation](https://bun.sh/docs)
- [Systemd Service Management](https://www.freedesktop.org/software/systemd/man/systemctl.html)

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check GitHub Actions logs for detailed error messages
2. Review server logs: `sudo journalctl -u kcs-backend -n 100`
3. Verify all prerequisites are met
4. Contact the DevOps team with:
   - Deployment run ID
   - Error messages
   - Server logs
   - Steps already attempted

---

**Last Updated:** October 6, 2025  
**Version:** 1.0.0
