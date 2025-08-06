# 🌿 Development Branch CI/CD Setup Guide

This guide explains how the CI/CD pipeline handles the `dev` branch for development environment
deployment.

## 🎯 Branch Strategy

| Branch | Environment | Deployment Target  | URL                                  |
| ------ | ----------- | ------------------ | ------------------------------------ |
| `dev`  | Development | Development Server | `https://devapi.letscatchup-kcs.com` |
| `main` | Production  | Production Server  | `https://api.letscatchup-kcs.com`    |

## 🔧 CI/CD Configuration

### Jenkins Pipeline (Jenkinsfile) - Primary CI/CD Tool

- ✅ **Automatically detects branch**: `dev` vs `main`
- ✅ **Environment-aware**: Sets `NODE_ENV` and `DEPLOY_URL` based on branch
- ✅ **Separate deployment stages**: Different deployment logic for dev vs prod
- ✅ **Different linting rules**: More relaxed rules for development
- ✅ **Automated deployment**: Triggers on Git push via webhooks
- ✅ **Teams notifications**: Real-time build and deployment status

## 🔑 Required Credentials (Jenkins Configuration)

Configure these credentials in Jenkins (Manage Jenkins → Credentials):

### Jenkins Credentials Setup

```bash
# GitHub access (Username with password or Secret text)
github-access-token = your-github-personal-access-token

# SSH key for server deployment (SSH Username with private key)
ec2-ssh-key = your-ec2-ssh-private-key

# Teams webhook for notifications (Secret text)
teams-webhook-url = your-microsoft-teams-webhook-url

# Docker registry (optional - Username with password)
docker-registry-credentials = username:password
```

## 🚀 Development Workflow

### 1. Working on Features

```bash
# Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push feature branch (no deployment)
git push origin feature/your-feature
```

### 2. Deploying to Development

```bash
# Merge to dev branch (triggers development deployment)
git checkout dev
git merge feature/your-feature
git push origin dev

# This triggers:
# 1. Testing and quality checks
# 2. Docker build with dev configuration
# 3. Deployment to development server
# 4. Health checks on devapi.letscatchup-kcs.com
```

### 3. Promoting to Production

```bash
# Create PR from dev to main
git checkout main
git pull origin main
git merge dev
git push origin main

# This triggers:
# 1. Full testing and security scans
# 2. Production Docker build
# 3. Deployment to production server
# 4. Health checks on api.letscatchup-kcs.com
```

## 🔍 Pipeline Differences by Branch

### Development Branch (`dev`)

- **Linting**: More relaxed rules (`--max-warnings 1000`)
- **Docker**: Uses `Dockerfile.dev` (if available)
- **Environment**: `NODE_ENV=development`
- **Server**: Development server with hot reload
- **Files deployed**: `docker-compose.dev.yml`, `.env.development.example`

### Production Branch (`main`)

- **Linting**: Strict rules (no warnings allowed)
- **Docker**: Uses production `Dockerfile`
- **Environment**: `NODE_ENV=production`
- **Server**: Production server with optimizations
- **Files deployed**: `docker-compose.yaml`, `.env.production`

## 📊 Monitoring & Notifications

Jenkins sends Microsoft Teams notifications for:

### Development Deployment

- 🟡 **Started**: "Build started for dev branch"
- ✅ **Success**: "Deployed to development environment"
- ❌ **Failed**: "Development deployment failed"

### Production Deployment

- 🟡 **Started**: "Build started for main branch"
- ✅ **Success**: "Deployed to production environment"
- ❌ **Failed**: "Production deployment failed"

## 🛠️ Troubleshooting

### Common Issues

1. **Dev deployment not triggering**
    - Check if webhook is configured in GitHub → Jenkins
    - Verify Jenkins pipeline is monitoring correct branches
    - Check Jenkins credentials and GitHub access

2. **Docker build fails**
    - Ensure `docker-compose.dev.yml` exists
    - Check Dockerfile.dev configuration
    - Verify Docker is running on Jenkins server

3. **Health checks fail**
    - Wait longer for services to start (adjust sleep time)
    - Check server accessibility from Jenkins
    - Verify API endpoints are correct

### Debug Commands

```bash
# Check current branch
git branch

# View recent commits
git log --oneline -5

# Check Jenkins build status
curl -u user:token http://jenkins-server:8080/job/KCS-Backend-Pipeline/api/json

# Check Docker containers on dev server
ssh ubuntu@dev-server "docker ps"
```

## 📝 Next Steps

1. **Configure Jenkins Credentials**: Add all required credentials in Jenkins
2. **Set up Webhooks**: Configure GitHub → Jenkins webhook trigger
3. **Test Dev Deployment**: Push to dev branch and verify deployment works
4. **Update Server IPs**: Replace placeholder IPs with actual server addresses
5. **Monitor First Deployment**: Watch the Jenkins pipeline execution

## 🔗 Related Documentation

- [Jenkins Automation Setup](./JENKINS_AUTOMATION_SETUP.md) ← **Complete setup guide**
- [Development Environment Setup](./DEVELOPMENT_SETUP.md)
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md)
