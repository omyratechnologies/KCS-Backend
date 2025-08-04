#!/bin/bash

# 🚀 Complete CI/CD Setup Script for Fresh EC2 Instance
# This script sets up Jenkins, Docker, and all dependencies for KCS Backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Server IP
NEW_SERVER_IP="13.204.105.220"
TEAMS_WEBHOOK_URL="https://default24d1b36297254281bb1a4a5ad10bc3.7a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9e08851778ad4c7495cc5b2dedb91529/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ua4DPx31fCtSd7cewcojadeVqxB4nW81jHVLU2RXt6Q"

echo -e "${BLUE}"
echo "🚀 KCS Backend CI/CD Complete Setup"
echo "===================================="
echo "Server IP: $NEW_SERVER_IP"
echo "Date: $(date)"
echo -e "${NC}"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Step 1: Copy setup files to server
log "📁 Step 1: Copying setup files to the new server..."

# Copy the Jenkins setup script to the server
scp -i ~/Downloads/kcs-dev.pem -o StrictHostKeyChecking=no \
    .jenkins/setup-jenkins.sh \
    ubuntu@$NEW_SERVER_IP:~/

# Copy other necessary files
scp -i ~/Downloads/kcs-dev.pem -o StrictHostKeyChecking=no \
    docker-compose.production.yml \
    nginx.conf \
    .jenkins/env-production.example \
    ubuntu@$NEW_SERVER_IP:~/

log "✅ Files copied successfully"

# Step 2: Execute setup on server
log "🔧 Step 2: Setting up Jenkins and dependencies on the server..."

ssh -i ~/Downloads/kcs-dev.pem -o StrictHostKeyChecking=no ubuntu@$NEW_SERVER_IP << 'REMOTE_SCRIPT'

    # Colors for remote script
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    RED='\033[0;31m'
    NC='\033[0m'

    log() {
        echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    }

    log "🚀 Starting setup on fresh EC2 instance..."

    # Update system
    log "📦 Updating system packages..."
    sudo apt update && sudo apt upgrade -y

    # Install essential tools
    log "🛠️ Installing essential tools..."
    sudo apt install -y curl wget git unzip jq build-essential

    # Install Java 17 (required for Jenkins)
    log "☕ Installing Java 17..."
    sudo apt install -y openjdk-17-jdk
    java -version

    # Add Jenkins repository and install
    log "🔧 Installing Jenkins..."
    curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
    echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
    sudo apt update
    sudo apt install -y jenkins

    # Start and enable Jenkins
    sudo systemctl start jenkins
    sudo systemctl enable jenkins

    # Install Docker
    log "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    sudo usermod -aG docker jenkins

    # Install Docker Compose
    log "🐙 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Install Node.js and Bun
    log "🟢 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs

    log "🥖 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"

    # Configure firewall
    log "🔥 Configuring firewall..."
    sudo ufw allow 22/tcp
    sudo ufw allow 8080/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 4500/tcp
    sudo ufw allow 4501/tcp
    sudo ufw --force enable

    # Create application directory
    log "📁 Creating application directories..."
    sudo mkdir -p /opt/kcs-backend
    sudo chown ubuntu:ubuntu /opt/kcs-backend
    
    # Move files to proper location
    mv ~/docker-compose.production.yml /opt/kcs-backend/
    mv ~/nginx.conf /opt/kcs-backend/
    mv ~/env-production.example /opt/kcs-backend/.env.production

    # Wait for Jenkins to start
    log "⏳ Waiting for Jenkins to start..."
    sleep 60

    # Get Jenkins initial password
    if [ -f /var/lib/jenkins/secrets/initialAdminPassword ]; then
        JENKINS_PASSWORD=$(sudo cat /var/lib/jenkins/secrets/initialAdminPassword)
        log "🔑 Jenkins initial admin password: $JENKINS_PASSWORD"
        echo "$JENKINS_PASSWORD" > ~/jenkins-password.txt
    else
        log "⚠️ Jenkins password file not found, might still be starting"
    fi

    # Install Jenkins CLI
    log "🖥️ Installing Jenkins CLI..."
    wget -O jenkins-cli.jar http://localhost:8080/jnlpJars/jenkins-cli.jar || log "Jenkins CLI download failed (Jenkins might still be starting)"

    log "✅ Server setup completed successfully!"
    
    # Show status
    echo ""
    echo "📊 Installation Summary:"
    echo "========================"
    echo "✅ System updated"
    echo "✅ Java $(java -version 2>&1 | head -n1)"
    echo "✅ Jenkins $(systemctl is-active jenkins)"
    echo "✅ Docker $(docker --version)"
    echo "✅ Docker Compose $(docker-compose --version)"
    echo "✅ Node.js $(node --version)"
    echo "✅ Bun installed"
    echo "✅ Firewall configured"
    echo "✅ Application directory created"
    
REMOTE_SCRIPT

log "✅ Server setup completed!"

# Step 3: Test Teams webhook
log "📢 Step 3: Testing Teams webhook integration..."

# Create a test payload
cat > teams-test-payload.json << EOF
{
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "themeColor": "0078D4",
    "summary": "🎉 KCS Backend CI/CD Setup Complete",
    "sections": [
        {
            "activityTitle": "🎉 KCS Backend CI/CD Setup Complete",
            "activitySubtitle": "Fresh EC2 Instance Setup",
            "activityImage": "https://jenkins.io/images/logos/jenkins/jenkins.png",
            "facts": [
                {
                    "name": "Server IP",
                    "value": "$NEW_SERVER_IP"
                },
                {
                    "name": "Status",
                    "value": "Jenkins Installed ✅"
                },
                {
                    "name": "Docker",
                    "value": "Ready ✅"
                },
                {
                    "name": "Next Step",
                    "value": "Configure Jenkins Pipeline"
                }
            ],
            "markdown": true,
            "text": "**Your KCS Backend CI/CD infrastructure is ready!**\\n\\n**What's been set up:**\\n- ✅ Jenkins CI/CD server\\n- ✅ Docker containerization\\n- ✅ Application directories\\n- ✅ Security (firewall, users)\\n\\n**Next steps:**\\n1. Access Jenkins at http://$NEW_SERVER_IP:8080\\n2. Complete Jenkins setup wizard\\n3. Configure pipeline credentials\\n4. Run your first build!"
        }
    ],
    "potentialAction": [
        {
            "@type": "OpenUri",
            "name": "Open Jenkins",
            "targets": [
                {
                    "os": "default",
                    "uri": "http://$NEW_SERVER_IP:8080"
                }
            ]
        }
    ]
}
EOF

# Send Teams notification
curl -X POST -H 'Content-Type: application/json' \
     -d @teams-test-payload.json \
     "$TEAMS_WEBHOOK_URL"

if [ $? -eq 0 ]; then
    log "✅ Teams notification sent successfully!"
else
    warn "⚠️ Teams notification failed, but setup is complete"
fi

# Step 4: Get Jenkins password from server
log "🔑 Step 4: Retrieving Jenkins admin password..."

JENKINS_PASSWORD=$(ssh -i ~/Downloads/kcs-dev.pem -o StrictHostKeyChecking=no ubuntu@$NEW_SERVER_IP "cat ~/jenkins-password.txt 2>/dev/null || sudo cat /var/lib/jenkins/secrets/initialAdminPassword 2>/dev/null || echo 'Password not found'")

# Step 5: Display final information
echo ""
echo -e "${GREEN}🎉 SETUP COMPLETED SUCCESSFULLY! 🎉${NC}"
echo "============================================="
echo ""
echo -e "${BLUE}📋 Your Jenkins Server Details:${NC}"
echo "🌐 Jenkins URL: http://$NEW_SERVER_IP:8080"
echo "🔑 Admin Password: $JENKINS_PASSWORD"
echo "👤 Admin Username: admin (you'll set this up)"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. 🌐 Open Jenkins: http://$NEW_SERVER_IP:8080"
echo "2. 🔑 Use the admin password above"
echo "3. 📦 Install suggested plugins"
echo "4. 👤 Create your admin user"
echo "5. 🔧 Add these credentials in Jenkins:"
echo ""
echo -e "${YELLOW}Required Jenkins Credentials:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔹 ID: github-access-token"
echo "   Type: Secret text"
echo "   Value: YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
echo ""
echo "🔹 ID: ec2-ssh-key"
echo "   Type: SSH Username with private key"
echo "   Username: ubuntu"
echo "   Private Key: [Content of your kcs-dev.pem file]"
echo ""
echo "🔹 ID: teams-webhook-url"
echo "   Type: Secret text"
echo "   Value: $TEAMS_WEBHOOK_URL"
echo ""
echo -e "${BLUE}🚀 Pipeline Setup:${NC}"
echo "1. Create new Pipeline job in Jenkins"
echo "2. Configure GitHub repository: https://github.com/omyratechnologies/KCS-Backend.git"
echo "3. Set Script Path: Jenkinsfile"
echo "4. Save and run first build"
echo ""
echo -e "${GREEN}✨ Your CI/CD pipeline will then automatically:${NC}"
echo "• Build and test your code"
echo "• Create Docker images"
echo "• Deploy to production"
echo "• Send Teams notifications"
echo ""
echo -e "${PURPLE}🔗 Useful Links:${NC}"
echo "• Jenkins: http://$NEW_SERVER_IP:8080"
echo "• GitHub Repo: https://github.com/omyratechnologies/KCS-Backend"
echo "• Teams Notifications: Configured ✅"
echo ""
echo -e "${GREEN}🎊 Happy CI/CD! Your infrastructure is ready! 🎊${NC}"

# Clean up
rm -f teams-test-payload.json

# Save important info for later
cat > ci-cd-setup-info.txt << EOF
KCS Backend CI/CD Setup Information
==================================
Date: $(date)
Server IP: $NEW_SERVER_IP
Jenkins URL: http://$NEW_SERVER_IP:8080
Jenkins Admin Password: $JENKINS_PASSWORD

Credentials to add in Jenkins:
1. github-access-token (Secret text): YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
2. ec2-ssh-key (SSH Username with private key): ubuntu + kcs-dev.pem content
3. teams-webhook-url (Secret text): $TEAMS_WEBHOOK_URL

Next Steps:
1. Access Jenkins web interface
2. Complete setup wizard
3. Add credentials
4. Create pipeline job
5. Run first build

Files on server:
- /opt/kcs-backend/ (application directory)
- Jenkins installed and running
- Docker and Docker Compose ready
- Firewall configured for ports 22, 80, 443, 4500, 4501, 8080
EOF

log "💾 Setup information saved to ci-cd-setup-info.txt"
