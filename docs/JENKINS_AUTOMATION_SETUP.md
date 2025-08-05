# 🤖 Jenkins Automated Deployment Setup Guide

This guide shows you how to set up fully automated deployment using Jenkins for the KCS Backend project.

## 🎯 Overview

Your Jenkins pipeline automatically:
1. **Detects** when you push to `dev` or `main` branches
2. **Tests** your code (linting, unit tests, security scans)
3. **Builds** Docker images
4. **Deploys** to the appropriate environment
5. **Notifies** your team via Microsoft Teams

## 🔧 Step-by-Step Jenkins Setup

### 1. 📋 Prerequisites

Ensure you have:
- Jenkins server running (2.400+ recommended)
- Docker installed on Jenkins server
- Bun runtime available on Jenkins agents
- Access to your development and production servers

### 2. 🔌 Install Required Jenkins Plugins

Go to **Manage Jenkins → Plugins** and install:

```bash
# Essential plugins
- Pipeline: Stage View Plugin
- Git Plugin
- GitHub Integration Plugin
- Docker Pipeline Plugin
- SSH Pipeline Steps Plugin
- Pipeline: Groovy Plugin

# Notification plugins
- Office 365 Connector Plugin (for Teams)
- Build Timestamp Plugin

# Optional but recommended
- Blue Ocean Plugin (better UI)
- Pipeline Graph Analysis Plugin
- Workspace Cleanup Plugin
```

### 3. 🔑 Configure Jenkins Credentials

Go to **Manage Jenkins → Credentials → System → Global credentials**:

#### GitHub Access Token
```bash
Kind: Secret text
ID: github-access-token
Secret: ghp_your_github_personal_access_token
Description: GitHub access token for KCS Backend
```

#### EC2 SSH Key
```bash
Kind: SSH Username with private key
ID: ec2-ssh-key
Username: ubuntu (or your server username)
Private Key: [Paste your EC2 private key]
Description: SSH key for server deployment
```

#### Teams Webhook
```bash
Kind: Secret text
ID: teams-webhook-url
Secret: https://outlook.office.com/webhook/your-webhook-url
Description: Microsoft Teams webhook for notifications
```

#### Docker Registry (Optional)
```bash
Kind: Username with password
ID: docker-registry-credentials
Username: your-docker-username
Password: your-docker-password
Description: Docker Hub credentials
```

### 4. 🏗️ Create Jenkins Pipeline Job

#### Option A: Pipeline from SCM (Recommended)
1. **New Item** → **Pipeline** → Name: `KCS-Backend-Pipeline`
2. **Pipeline Definition**: Pipeline script from SCM
3. **SCM**: Git
4. **Repository URL**: `https://github.com/omyratechnologies/KCS-Backend.git`
5. **Credentials**: Select your GitHub token
6. **Branches**: `*/main` and `*/dev`
7. **Script Path**: `Jenkinsfile`

#### Option B: Multibranch Pipeline (Advanced)
1. **New Item** → **Multibranch Pipeline** → Name: `KCS-Backend-Multibranch`
2. **Branch Sources** → **Git**
3. **Project Repository**: `https://github.com/omyratechnologies/KCS-Backend.git`
4. **Credentials**: Select your GitHub token
5. **Discover branches**: All branches
6. **Build Configuration**: Jenkinsfile

### 5. ⚙️ Configure Build Triggers

#### Webhook Trigger (Automatic on Git Push)
1. In your Jenkins job → **Configure**
2. **Build Triggers** → Check **GitHub hook trigger for GITScm polling**
3. In GitHub repository → **Settings → Webhooks**
4. **Add webhook**:
   ```
   Payload URL: http://your-jenkins-server:8080/github-webhook/
   Content type: application/json
   Events: Just the push event
   ```

#### Polling (Fallback option)
```groovy
triggers {
    // Poll SCM every 5 minutes
    pollSCM('H/5 * * * *')
}
```

### 6. 🌐 Server Configuration

Update the Jenkinsfile with your actual server IPs:

```groovy
environment {
    // Update these with your actual server IPs
    PROD_SERVER = '13.204.105.220'        // Your production server IP
    DEV_SERVER = '13.204.105.221'         // Your development server IP (change this)
    
    // These are automatically set based on branch
    NODE_ENV = "${env.BRANCH_NAME == 'main' ? 'production' : 'development'}"
    DEPLOY_URL = "${env.BRANCH_NAME == 'main' ? 'api.letscatchup-kcs.com' : 'devapi.letscatchup-kcs.com'}"
}
```

### 7. 🖥️ Prepare Target Servers

#### Development Server Setup
```bash
# SSH to your development server
ssh ubuntu@your-dev-server-ip

# Create deployment directory
sudo mkdir -p /opt/kcs-backend-dev
sudo chown ubuntu:ubuntu /opt/kcs-backend-dev

# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Create environment file
cd /opt/kcs-backend-dev
touch .env.development
```

#### Production Server Setup
```bash
# SSH to your production server
ssh ubuntu@your-prod-server-ip

# Create deployment directory
sudo mkdir -p /opt/kcs-backend
sudo chown ubuntu:ubuntu /opt/kcs-backend

# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Create environment file
cd /opt/kcs-backend
touch .env.production
```

## 🚀 Automated Deployment Workflow

### Development Deployment (dev branch)
```bash
# 1. Push to dev branch
git checkout dev
git add .
git commit -m "feat: new feature"
git push origin dev

# 2. Jenkins automatically:
# ✅ Detects push via webhook
# ✅ Runs tests and quality checks
# ✅ Builds Docker image with dev config
# ✅ Deploys to development server
# ✅ Runs health checks
# ✅ Notifies team via Teams
```

### Production Deployment (main branch)
```bash
# 1. Merge dev to main
git checkout main
git merge dev
git push origin main

# 2. Jenkins automatically:
# ✅ Runs full security scans
# ✅ Builds production Docker image
# ✅ Deploys to production server
# ✅ Runs comprehensive health checks
# ✅ Notifies team via Teams
```

## 📊 Monitoring and Notifications

### Teams Notifications
You'll receive notifications for:
- 🚀 **Build Started**: "Build #123 started for dev branch"
- ✅ **Deployment Success**: "Successfully deployed to development"
- ❌ **Build Failed**: "Build #123 failed at stage X"
- ⚠️ **Build Unstable**: "Tests passed but with warnings"

### Jenkins Dashboard
Monitor builds at:
- **Classic UI**: `http://your-jenkins-server:8080/job/KCS-Backend-Pipeline/`
- **Blue Ocean**: `http://your-jenkins-server:8080/blue/organizations/jenkins/KCS-Backend-Pipeline/`

### Build Artifacts
Jenkins automatically archives:
- Built application (`dist/` folder)
- Test coverage reports
- Build logs and timestamps

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. Webhook Not Triggering
```bash
# Check GitHub webhook delivery
GitHub → Settings → Webhooks → Recent Deliveries

# Verify Jenkins can receive webhooks
curl -X POST http://your-jenkins-server:8080/github-webhook/

# Alternative: Use polling trigger
triggers { pollSCM('H/5 * * * *') }
```

#### 2. SSH Connection Failed
```bash
# Test SSH connection from Jenkins
ssh -i /var/jenkins_home/.ssh/id_rsa ubuntu@your-server-ip

# Check SSH key permissions
chmod 600 /var/jenkins_home/.ssh/id_rsa

# Add server to known_hosts
ssh-keyscan -H your-server-ip >> /var/jenkins_home/.ssh/known_hosts
```

#### 3. Docker Build Failed
```bash
# Check Docker service on Jenkins
sudo systemctl status docker

# Check disk space
df -h

# Clean up old images
docker system prune -f
```

#### 4. Bun Installation Issues
```bash
# Install Bun manually on Jenkins agent
curl -fsSL https://bun.sh/install | bash

# Add to Jenkins PATH
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
```

### Debug Commands
```bash
# Check Jenkins job status
curl -u username:token http://jenkins-server:8080/job/KCS-Backend-Pipeline/api/json

# View last build console output
curl -u username:token http://jenkins-server:8080/job/KCS-Backend-Pipeline/lastBuild/consoleText

# Check server deployment
ssh ubuntu@server-ip "docker ps && docker logs container-name"
```

## 🔒 Security Best Practices

### Jenkins Security
- Enable CSRF protection
- Use Matrix-based security
- Regular plugin updates
- Restrict script execution

### Credential Management
- Use Jenkins credential store
- Rotate keys regularly
- Limit credential scope
- Audit credential usage

### Deployment Security
- Use SSH key authentication
- Implement firewall rules
- Monitor deployment logs
- Regular security updates

## 📈 Performance Optimization

### Build Optimization
```groovy
// Parallel execution
parallel {
    stage('Tests') { /* ... */ }
    stage('Security') { /* ... */ }
    stage('Quality') { /* ... */ }
}

// Build caching
sh 'bun install --frozen-lockfile --cache-dir /var/jenkins_cache/bun'

// Docker layer caching
docker.withRegistry('registry-url') {
    def image = docker.build("app:${BUILD_NUMBER}")
}
```

### Resource Management
- Set build timeouts
- Clean workspaces after builds
- Limit concurrent builds
- Use Jenkins agents for heavy workloads

## 🎯 Next Steps

1. **✅ Complete Jenkins Setup**: Follow steps 1-7 above
2. **🔧 Test Development Deployment**: Push to dev branch
3. **🚀 Test Production Deployment**: Push to main branch
4. **📊 Monitor First Deployments**: Check notifications and logs
5. **🔄 Optimize**: Tune performance based on usage

Your automated deployment pipeline is now ready! Every git push will trigger automatic testing, building, and deployment. 🎉
