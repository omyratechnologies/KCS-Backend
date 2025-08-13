# KCS Backend CI/CD Setup Guide

This guide will help you set up CI/CD for the KCS Backend using Jenkins and Docker.

## Prerequisites

1. ✅ Jenkins server running (IP: 43.203.115.64:8080)
2. ✅ Backend server running (IP: 65.0.98.183)
3. ✅ GitHub repository: https://github.com/omyratechnologies/KCS-Backend
4. ✅ Docker and Docker Compose installed on backend server

## Setup Steps

### 1. Jenkins Configuration

#### Step 1.1: Add SSH Credentials
1. Go to Jenkins Dashboard → Manage Jenkins → Manage Credentials
2. Click on "Global" domain
3. Click "Add Credentials"
4. Select "SSH Username with private key"
5. Configure:
   - **ID**: `kcs-deploy-key`
   - **Username**: `ubuntu`
   - **Private Key**: Enter directly (paste the content of kcs-dev.pem)
   - **Description**: `KCS DEV Server SSH Key`

#### Step 1.2: Create Pipeline Job
1. Go to Jenkins Dashboard → New Item
2. Enter name: `kcs-backend-deploy`
3. Select "Pipeline" and click OK
4. Configure the job:
   - **Description**: `KCS Backend CI/CD Pipeline - Automated deployment to DEV environment`
   - **Build Triggers**: Check "GitHub hook trigger for GITScm polling"
   - **Pipeline Definition**: Select "Pipeline script from SCM"
   - **SCM**: Git
   - **Repository URL**: `https://github.com/omyratechnologies/KCS-Backend.git`
   - **Branch**: `*/main`
   - **Script Path**: `Jenkinsfile`

### 2. Server Setup

#### Step 2.1: Prepare Backend Server
Connect to your backend server and run:

```bash
# Connect to server
ssh -i kcs-dev.pem ubuntu@65.0.98.183

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker if not already installed
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository if not already done
git clone https://github.com/omyratechnologies/KCS-Backend.git
cd KCS-Backend
```

#### Step 2.2: Environment Configuration
Create environment file:

```bash
# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=4500
SOCKET_IO_PORT=4501

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=8091
DB_USERNAME=kcs_cb
DB_PASSWORD=kcs_cb_dev
DB_BUCKET=kcs-dev

# Redis Configuration
REDIS_URL=redis://redis:6379

# MediaSoup Configuration
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=65.0.98.183

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# S3 Configuration (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=kcs-uploads
EOF
```

### 3. Manual Deployment Test

Test the deployment manually first:

```bash
# On the backend server
cd ~/KCS-Backend

# Build and run
docker compose build
docker compose up -d

# Check status
docker compose ps
docker compose logs api

# Test health endpoint
curl http://localhost/api/health
```

### 4. GitHub Webhook (Optional)

To enable automatic deployments on push:

1. Go to GitHub repository → Settings → Webhooks
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `http://43.203.115.64:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Select "Just the push event"
   - **Active**: Checked

### 5. Jenkins Pipeline Features

The Jenkinsfile includes:

- ✅ **Automatic builds** on code push
- ✅ **Docker image building** with proper tagging
- ✅ **Zero-downtime deployments** using Docker Compose
- ✅ **Health checks** after deployment
- ✅ **Rollback capabilities** (keeping previous images)
- ✅ **Deployment logs** and status reporting

### 6. Monitoring and Logs

#### View Application Logs
```bash
# All services
docker compose logs -f

# API only
docker compose logs -f api

# Nginx only
docker compose logs -f nginx
```

#### Check Service Status
```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Health check
curl http://localhost/api/health
```

### 7. Troubleshooting

#### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   docker compose logs api
   
   # Rebuild without cache
   docker compose build --no-cache
   ```

2. **Port Conflicts**
   ```bash
   # Check what's using ports
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :4500
   ```

3. **Permission Issues**
   ```bash
   # Fix Docker permissions
   sudo chown -R ubuntu:ubuntu ~/KCS-Backend
   ```

4. **Health Check Failures**
   ```bash
   # Check if API is responding
   docker compose exec api curl http://localhost:4500/api/health
   
   # Check container logs
   docker compose logs api | tail -50
   ```

### 8. Deployment Commands

#### Manual Deployment
```bash
./deploy-simple.sh
```

#### Local Testing
```bash
./deploy-local.sh
```

#### Health Check
```bash
./health-check.sh
```

## Security Considerations

1. **SSH Key Management**: Keep SSH keys secure and rotate regularly
2. **Environment Variables**: Never commit sensitive data to repository
3. **Docker Images**: Regularly update base images for security patches
4. **Network Security**: Ensure proper firewall rules are in place

## Next Steps

1. Set up monitoring with Prometheus/Grafana
2. Implement blue-green deployments
3. Add automated testing to pipeline
4. Set up log aggregation
5. Implement backup strategies

## Support

For issues or questions, check:
- Jenkins logs: `http://43.203.115.64:8080/job/kcs-backend-deploy/lastBuild/console`
- Application logs: `docker compose logs -f`
- Server status: `./health-check.sh`
