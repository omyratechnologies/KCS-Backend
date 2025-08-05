# 🚀 Jenkins CI/CD Setup for KCS Backend

This directory contains all Jenkins configuration files and setup scripts for the KCS Backend CI/CD pipeline.

## 📋 Quick Setup Checklist

### 1. Jenkins Server Setup

- [ ] Install Jenkins on your server
- [ ] Configure necessary plugins
- [ ] Set up credentials
- [ ] Create pipeline job

### 2. Required Jenkins Plugins

- [ ] Git Plugin
- [ ] GitHub Plugin
- [ ] Docker Pipeline Plugin
- [ ] SSH Agent Plugin
- [ ] Blue Ocean (optional, for better UI)
- [ ] Build Timeout Plugin
- [ ] Timestamper Plugin

### 3. Credentials Setup

Configure these credentials in Jenkins:

#### GitHub Access Token

- **ID**: `github-access-token`
- **Type**: Secret text
- **Value**: `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN`

#### EC2 SSH Key

- **ID**: `ec2-ssh-key`
- **Type**: SSH Username with private key
- **Username**: `ubuntu` (or your EC2 user)
- **Private Key**: Your EC2 instance private key

#### Microsoft Teams Webhook

- **ID**: `teams-webhook-url`
- **Type**: Secret text
- **Value**: Your Teams channel webhook URL

#### Docker Registry (if using private registry)

- **ID**: `docker-registry-credentials`
- **Type**: Username with password
- **Username**: Your Docker Hub username
- **Password**: Your Docker Hub password/token

### 4. Environment Variables

Set these in Jenkins global environment:

- `NODE_ENV=production`
- `DOCKER_BUILDKIT=1`

## 🔧 Setup Instructions

### Step 1: Install Jenkins

```bash
# Run the setup script
./setup-jenkins.sh
```

### Step 2: Configure Pipeline

1. Open Jenkins web interface
2. Create new Pipeline job
3. Configure GitHub webhook
4. Set up branch sources

### Step 3: Test Integration

```bash
# Test Teams integration
./test-teams-integration.sh
```

## 📂 File Structure

```
.jenkins/
├── README.md                 # This file
├── setup-jenkins.sh         # Jenkins installation script
├── test-teams-integration.sh # Teams integration test
├── env-staging.example      # Staging environment variables
├── env-production.example   # Production environment variables
└── webhooks/
    └── teams-webhook.json   # Teams webhook payload example
```

## 🚀 Pipeline Features

### Automated CI/CD Pipeline

- ✅ Automated builds on push to main branch
- ✅ Comprehensive testing (unit, integration, security)
- ✅ Docker image building and pushing
- ✅ Automated deployment to production
- ✅ Health checks and rollback capabilities
- ✅ Microsoft Teams notifications

### Quality Gates

- ✅ Code linting and formatting
- ✅ TypeScript type checking
- ✅ Unit test coverage requirements
- ✅ Security vulnerability scanning
- ✅ Docker image vulnerability scanning

### Deployment Strategy

- ✅ Blue-green deployment support
- ✅ Rolling updates with health checks
- ✅ Automatic rollback on failure
- ✅ Environment-specific configurations

## 🔗 Integration Points

### GitHub Integration

- Webhook triggers on push/PR
- Status checks on pull requests
- Automatic artifact publishing

### Microsoft Teams Integration

- Build start/success/failure notifications
- Deployment status updates
- Test results summaries
- Quick access links to logs and artifacts

### Production Server Integration

- Automated SSH deployment
- Docker Compose orchestration
- Nginx configuration updates
- SSL certificate management

## 🎯 Next Steps

1. **Run Setup Script**: Execute `./setup-jenkins.sh`
2. **Configure Credentials**: Add all required credentials in Jenkins
3. **Create Pipeline Job**: Set up the pipeline in Jenkins UI
4. **Test Pipeline**: Push a commit to trigger the first build
5. **Monitor & Optimize**: Review build times and optimize as needed

## 🛟 Troubleshooting

### Common Issues

#### Build Timeout

- Increase timeout in Jenkinsfile
- Optimize Docker build with multi-stage builds
- Use BuildKit for faster builds

#### SSH Connection Issues

- Verify SSH key permissions
- Check security group settings
- Ensure SSH agent is running

#### Teams Notification Failures

- Verify webhook URL is correct
- Check Teams channel permissions
- Validate JSON payload format

### Support Contacts

- **DevOps Team**: Contact for Jenkins server issues
- **Development Team**: Contact for build/test issues
- **Infrastructure Team**: Contact for deployment issues

---

**Created**: August 5, 2025  
**Version**: 1.0  
**Maintainer**: KCS DevOps Team
