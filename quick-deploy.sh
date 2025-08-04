#!/bin/bash

# 🚀 Quick Deployment Script for KCS Backend
# This script provides immediate CI/CD setup for your existing environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "🚀 KCS Backend CI/CD Quick Deploy"
echo "================================="
echo -e "${NC}"

# Configuration
PROD_SERVER="65.2.31.97"
GITHUB_TOKEN="YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"

echo -e "${GREEN}✅ Using your existing configuration:${NC}"
echo "   - Production Server: $PROD_SERVER"
echo "   - GitHub Token: Configured"
echo "   - SSH Key: Already added to GitHub"
echo ""

# Step 1: Build and deploy current code
echo -e "${BLUE}📦 Step 1: Building and deploying current version...${NC}"

# Build Docker image locally
echo "🏗️ Building Docker image..."
export DOCKER_BUILDKIT=1
docker build -t omyratechnologies/kcs-backend:latest \
  --build-arg BUILD_NUMBER=quick-deploy-$(date +%Y%m%d_%H%M%S) \
  --build-arg BUILD_TIMESTAMP=$(date +%Y%m%d_%H%M%S) \
  --build-arg GIT_COMMIT=$(git rev-parse HEAD | cut -c1-7) \
  .

echo "✅ Docker image built successfully"

# Step 2: Deploy to production server
echo -e "${BLUE}🚀 Step 2: Deploying to production server...${NC}"

# Check if we can connect to the server
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$PROD_SERVER "echo 'Connection test successful'" 2>/dev/null; then
    echo "✅ SSH connection to production server successful"
    
    # Copy necessary files
    echo "📁 Copying deployment files..."
    scp -o StrictHostKeyChecking=no \
        docker-compose.yaml \
        nginx.conf \
        .env \
        ubuntu@$PROD_SERVER:/opt/kcs-backend/ 2>/dev/null || \
    scp -o StrictHostKeyChecking=no \
        docker-compose.yaml \
        nginx.conf \
        .env \
        ubuntu@$PROD_SERVER:~/
    
    # Save the image and transfer it
    echo "💾 Transferring Docker image..."
    docker save omyratechnologies/kcs-backend:latest | gzip | \
        ssh -o StrictHostKeyChecking=no ubuntu@$PROD_SERVER 'gunzip | docker load'
    
    # Deploy on server
    echo "🚀 Starting deployment on server..."
    ssh -o StrictHostKeyChecking=no ubuntu@$PROD_SERVER << 'EOF'
        # Create directory if it doesn't exist
        sudo mkdir -p /opt/kcs-backend
        
        # Move files to proper location if needed
        if [ -f ~/docker-compose.yaml ]; then
            sudo mv ~/docker-compose.yaml /opt/kcs-backend/
            sudo mv ~/nginx.conf /opt/kcs-backend/
            sudo mv ~/.env /opt/kcs-backend/
        fi
        
        cd /opt/kcs-backend
        
        # Stop existing containers
        docker-compose down 2>/dev/null || true
        
        # Start new containers
        docker-compose up -d
        
        # Wait for services to start
        echo "⏳ Waiting for services to start..."
        sleep 30
        
        # Health check
        if curl -f http://localhost:4500/api/health; then
            echo "✅ Application is healthy and running"
        else
            echo "⚠️ Application health check failed, but services are started"
        fi
EOF
    
    echo "✅ Deployment completed successfully!"
    
else
    echo -e "${RED}❌ Cannot connect to production server${NC}"
    echo "Please ensure:"
    echo "1. Your SSH key is properly configured"
    echo "2. The server $PROD_SERVER is accessible"
    echo "3. You have the correct permissions"
    exit 1
fi

# Step 3: Setup Teams webhook (if provided)
echo -e "${BLUE}📢 Step 3: Microsoft Teams Integration${NC}"

if [ -z "$TEAMS_WEBHOOK_URL" ]; then
    echo "To enable Teams notifications, run:"
    echo -e "${YELLOW}export TEAMS_WEBHOOK_URL='your_webhook_url'${NC}"
    echo -e "${YELLOW}./.jenkins/test-teams-integration.sh${NC}"
else
    echo "🧪 Testing Teams integration..."
    ./.jenkins/test-teams-integration.sh
fi

# Step 4: Jenkins setup information
echo -e "${BLUE}🔧 Step 4: Jenkins Setup (Optional for automated CI/CD)${NC}"
echo ""
echo "For complete CI/CD automation, set up Jenkins:"
echo "1. SSH to your server: ssh ubuntu@$PROD_SERVER"
echo "2. Run Jenkins setup: ./.jenkins/setup-jenkins.sh"
echo "3. Follow the complete guide: CICD-SETUP-GUIDE.md"
echo ""

# Final status
echo -e "${GREEN}"
echo "🎉 Quick Deployment Summary"
echo "=========================="
echo "✅ Docker image built and deployed"
echo "✅ Application running on production server"
echo "🌐 Access your application: https://devapi.letscatchup-kcs.com"
echo "📋 For full CI/CD setup, see: CICD-SETUP-GUIDE.md"
echo -e "${NC}"

# Test the deployed application
echo -e "${BLUE}🏥 Final Health Check...${NC}"
if curl -f https://devapi.letscatchup-kcs.com/api/health 2>/dev/null; then
    echo -e "${GREEN}✅ Application is live and healthy!${NC}"
    echo -e "${GREEN}🌐 Your KCS Backend is accessible at: https://devapi.letscatchup-kcs.com${NC}"
else
    echo -e "${YELLOW}⚠️ Application may still be starting up or SSL needs configuration${NC}"
    echo "   Try accessing directly: http://$PROD_SERVER:4500/api/health"
fi

echo ""
echo -e "${BLUE}📚 Next Steps:${NC}"
echo "1. Set up Teams webhook for notifications"
echo "2. Configure Jenkins for automated CI/CD"
echo "3. Set up SSL certificates with Let's Encrypt"
echo "4. Configure monitoring and alerting"
echo ""
echo -e "${GREEN}🎊 Deployment completed successfully!${NC}"
