# 🚀 Complete CI/CD Setup Guide for KCS Backend

This guide provides step-by-step instructions to set up a complete CI/CD pipeline with Jenkins and
Microsoft Teams integration for the KCS Backend project.

## 📋 Overview

Your CI/CD pipeline includes:

- ✅ Jenkins automated builds and deployments
- ✅ Microsoft Teams notifications
- ✅ Docker containerization
- ✅ GitHub integration with your existing access token
- ✅ Production deployment to your EC2 server (65.2.31.97)
- ✅ GitHub Actions as backup CI/CD

## 🎯 Quick Start

### Step 1: Install Jenkins on Your Server

```bash
# SSH to your server
ssh ubuntu@65.2.31.97

# Run the Jenkins setup script
cd /path/to/your/kcs-backend
./.jenkins/setup-jenkins.sh
```

### Step 2: Configure Microsoft Teams Webhook

1. **Create Teams Webhook:**
    - Go to your Microsoft Teams channel
    - Click "..." → "Connectors"
    - Search for "Incoming Webhook"
    - Configure and copy the webhook URL

2. **Test Teams Integration:**
    ```bash
    export TEAMS_WEBHOOK_URL="your_webhook_url_here_from_teams"
    ./.jenkins/test-teams-integration.sh
    ```

### Step 3: Configure Jenkins Credentials

Access Jenkins at `http://65.2.31.97:8080` and add these credentials:

#### Required Credentials:

| ID                    | Type                          | Value                               |
| --------------------- | ----------------------------- | ----------------------------------- |
| `github-access-token` | Secret text                   | `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN` |
| `ec2-ssh-key`         | SSH Username with private key | Your EC2 private key                |
| `teams-webhook-url`   | Secret text                   | Your Teams webhook URL              |

### Step 4: Create Jenkins Pipeline Job

1. **New Item** → **Pipeline**
2. **Pipeline script from SCM**
3. **Git** → Repository URL: `https://github.com/omyratechnologies/KCS-Backend.git`
4. **Credentials**: Select your GitHub access token
5. **Script Path**: `Jenkinsfile`
6. **Save**

### Step 5: Configure GitHub Webhook (Optional)

1. Go to your GitHub repository settings
2. **Webhooks** → **Add webhook**
3. **Payload URL**: `http://65.2.31.97:8080/github-webhook/`
4. **Content type**: `application/json`
5. **Events**: Push, Pull requests

## 🔧 Detailed Configuration

### Jenkins Credentials Setup

#### 1. GitHub Access Token

```
Manage Jenkins → Manage Credentials → Global → Add Credentials
- Kind: Secret text
- Scope: Global
- Secret: YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
- ID: github-access-token
- Description: GitHub Access Token for KCS Backend
```

#### 2. EC2 SSH Key

```
Manage Jenkins → Manage Credentials → Global → Add Credentials
- Kind: SSH Username with private key
- Scope: Global
- ID: ec2-ssh-key
- Description: EC2 SSH Key for Production Deployment
- Username: ubuntu
- Private Key: [Enter your EC2 private key content]
```

#### 3. Teams Webhook URL

```
Manage Jenkins → Manage Credentials → Global → Add Credentials
- Kind: Secret text
- Scope: Global
- Secret: [Your Teams webhook URL]
- ID: teams-webhook-url
- Description: Microsoft Teams Webhook for Notifications
```

### Environment Variables

Set these in Jenkins global environment (Manage Jenkins → Configure System):

```
NODE_ENV=production
DOCKER_BUILDKIT=1
DOCKER_REGISTRY=docker.io
DOCKER_REPO=omyratechnologies/kcs-backend
PROD_SERVER=65.2.31.97
```

### Required Jenkins Plugins

Install these plugins:

- Git Plugin
- GitHub Plugin
- Docker Pipeline Plugin
- SSH Agent Plugin
- Build Timeout Plugin
- Timestamper Plugin
- Blue Ocean (optional for better UI)

## 🐳 Docker Configuration

### Environment Files

Copy and configure these files:

```bash
# For staging
cp .jenkins/env-staging.example .env.staging

# For production
cp .jenkins/env-production.example .env.production
```

### Production Environment Setup

Update `.env.production` with your actual values:

```env
# Database
COUCHBASE_CONNECTION_STRING=your_couchbase_connection
COUCHBASE_USERNAME=your_username
COUCHBASE_PASSWORD=your_password

# Redis
REDIS_URI=rediss://your_redis_host:6380
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret

# Email
SENDGRID_API_KEY=your_sendgrid_key

# AWS S3
S3_BUCKET_NAME=your_s3_bucket
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key

# Teams Webhook
TEAMS_WEBHOOK_URL=your_teams_webhook_url
```

## 🎯 Pipeline Features

### Automated CI/CD Pipeline

- ✅ **Build Triggers**: Automatic builds on push to main branch
- ✅ **Quality Gates**: Linting, testing, security scans
- ✅ **Docker Build**: Optimized multi-stage builds with caching
- ✅ **Deployment**: Automated production deployment
- ✅ **Health Checks**: Post-deployment verification
- ✅ **Notifications**: Teams notifications for all build events

### Pipeline Stages

1. **🔍 Checkout & Validate**: Code checkout and environment validation
2. **📦 Install Dependencies**: Bun dependency installation with frozen lockfile
3. **🧪 Test & Quality Checks**:
    - Unit tests with coverage reporting
    - ESLint code quality checks (CI mode with expanded warning tolerance)
    - Prettier format validation
    - TypeScript compilation verification
4. **🛡️ Security Scan**:
    - Dependency vulnerability scanning with npm audit
    - Outdated package detection
    - Security anti-pattern detection
    - Handles dependency conflicts gracefully with fallback options
5. **🏗️ Build Application**: Application build and compilation
6. **🐳 Docker Build & Push**: Container image creation with BuildKit optimization
7. **🚀 Deploy to Production**: Automated production deployment with zero downtime
8. **🧪 Post-Deployment Tests**: Health and API endpoint verification

### Teams Notifications

You'll receive notifications for:

- 🚀 Build started
- ✅ Build successful with deployment details
- ❌ Build failed with error information
- ⚠️ Build unstable with test failures

## 🔄 Alternative: GitHub Actions

If you prefer GitHub Actions over Jenkins, the repository includes a complete GitHub Actions
workflow:

### Recent Improvements (Latest Update)

**Enhanced Jenkins Pipeline Security & Reliability:**

- ✅ **Fixed dependency conflicts**: Resolved npm/Bun dependency resolution issues using
  `--legacy-peer-deps`
- ✅ **Improved security scanning**: Enhanced vulnerability detection with graceful fallback options
- ✅ **Better error handling**: Pipeline now handles dependency conflicts without failing
- ✅ **Comprehensive quality gates**: Expanded ESLint checks with configurable warning thresholds
- ✅ **TypeScript validation**: Full type checking without build output
- ✅ **Format validation**: Prettier code style enforcement
- ✅ **Test coverage**: Complete unit test suite with coverage reporting

**Security Scan Improvements:**

- Creates temporary package-lock.json for npm audit compatibility
- Falls back to Bun-native security checks if npm audit fails
- Scans for sensitive patterns and security anti-patterns
- Detects outdated packages with potential vulnerabilities
- Provides detailed vulnerability reports with severity levels

### GitHub Secrets Setup

Add these secrets in your GitHub repository settings:

| Secret Name            | Value                          |
| ---------------------- | ------------------------------ |
| `DOCKER_USERNAME`      | Your Docker Hub username       |
| `DOCKER_PASSWORD`      | Your Docker Hub password/token |
| `EC2_SSH_PRIVATE_KEY`  | Your EC2 private key           |
| `PRODUCTION_SERVER_IP` | `65.2.31.97`                   |
| `PRODUCTION_USER`      | `ubuntu`                       |
| `TEAMS_WEBHOOK_URL`    | Your Teams webhook URL         |

## 🚀 Deployment Process

### Production Deployment

The pipeline automatically:

1. **Builds Docker image** with your latest code
2. **Pushes to registry** (Docker Hub)
3. **Connects to your EC2 server** via SSH
4. **Pulls latest image** on the server
5. **Restarts services** with zero downtime
6. **Performs health checks** to verify deployment
7. **Sends Teams notification** with results

### Manual Deployment

If needed, you can deploy manually:

```bash
# On your production server (65.2.31.97)
cd /opt/kcs-backend
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d

# Health check
curl -f http://localhost:4500/api/health
```

## 🔒 Security Considerations

### Production Security

- ✅ SSL/TLS encryption with Let's Encrypt
- ✅ Rate limiting on API endpoints
- ✅ Security headers configuration
- ✅ Firewall rules and access controls
- ✅ Container security scanning
- ✅ Secret management via Jenkins credentials

### Access Control

- ✅ SSH key-based authentication
- ✅ GitHub token with minimal required permissions
- ✅ Docker registry access control
- ✅ Teams webhook URL protection

## 📊 Monitoring & Logging

### Built-in Monitoring

- ✅ Application health checks
- ✅ Container health monitoring
- ✅ Nginx access/error logs
- ✅ Automated log rotation
- ✅ Prometheus metrics (optional)

### Log Locations

```
/opt/kcs-backend/logs/          # Application logs
/opt/kcs-backend/logs/nginx/    # Nginx logs
/var/log/docker/               # Docker logs
```

## 🛠️ Troubleshooting

### Common Issues

#### Build Timeouts

```bash
# Increase timeout in Jenkinsfile
timeout(time: 45, unit: 'MINUTES')
```

#### Docker Build Failures

```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
```

#### SSH Connection Issues

```bash
# Test SSH connection
ssh -i ~/.ssh/your_key ubuntu@65.2.31.97

# Check security groups
# Ensure port 22 is open for your IP
```

#### Teams Notification Failures

```bash
# Test webhook manually
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text":"Test message"}' \
  'your_teams_webhook_url'
```

### Log Analysis

```bash
# Jenkins logs
sudo journalctl -u jenkins -f

# Docker logs
docker-compose logs -f

# Application logs
tail -f /opt/kcs-backend/logs/application.log

# Nginx logs
tail -f /opt/kcs-backend/logs/nginx/access.log
```

## 📞 Support

### Getting Help

1. **Jenkins Issues**: Check Jenkins logs and build console output
2. **Deployment Issues**: Review production server logs
3. **Teams Integration**: Test webhook URL and permissions
4. **GitHub Issues**: Verify access token permissions

### Quick Commands

```bash
# Check Jenkins status
sudo systemctl status jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# Check application status
docker-compose ps

# View recent builds
docker-compose logs --tail=50 kcs-backend

# Test API health
curl https://devapi.letscatchup-kcs.com/api/health
```

## 🎉 Success Checklist

- [ ] Jenkins installed and running
- [ ] All credentials configured in Jenkins
- [ ] Teams webhook tested and working
- [ ] Pipeline job created and configured
- [ ] GitHub webhook configured (optional)
- [ ] Production environment variables set
- [ ] SSL certificates configured
- [ ] First build triggered and successful
- [ ] Teams notifications received
- [ ] Application accessible at https://devapi.letscatchup-kcs.com

---

🎊 **Congratulations!** You now have a complete CI/CD pipeline with Jenkins and Teams integration
for your KCS Backend project. Every push to the main branch will automatically build, test, and
deploy your application with full notifications to your Teams channel.

## 📚 Next Steps

1. **Monitor your first few builds** to ensure everything works smoothly
2. **Set up branch protection rules** in GitHub for quality gates
3. **Configure additional monitoring** with Prometheus/Grafana if needed
4. **Add integration tests** for more comprehensive testing
5. **Set up staging environment** for testing before production

Happy deploying! 🚀
