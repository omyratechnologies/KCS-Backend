#!/bin/bash

# 🚀 Jenkins Setup Script for KCS Backend CI/CD
# This script installs and configures Jenkins on Ubuntu/Debian systems

set -e

echo "🚀 Setting up Jenkins for KCS Backend CI/CD Pipeline..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Update system
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Java (OpenJDK 17)
log "Installing Java OpenJDK 17..."
sudo apt install -y openjdk-17-jdk

# Verify Java installation
java -version || error "Java installation failed"

# Add Jenkins repository key
log "Adding Jenkins repository..."
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

# Add Jenkins repository
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Update package index
sudo apt update

# Install Jenkins
log "Installing Jenkins..."
sudo apt install -y jenkins

# Start and enable Jenkins
log "Starting Jenkins service..."
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Install Docker (required for our pipeline)
log "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Install Docker Compose
log "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js and Bun (for our application)
log "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

log "Installing Bun..."
curl -fsSL https://bun.sh/install | bash

# Install additional tools
log "Installing additional tools..."
sudo apt install -y git curl wget jq unzip

# Configure firewall (if ufw is enabled)
if sudo ufw status | grep -q "Status: active"; then
    log "Configuring firewall for Jenkins..."
    sudo ufw allow 8080/tcp
    sudo ufw allow OpenSSH
fi

# Create Jenkins workspace directory
log "Creating Jenkins workspace..."
sudo mkdir -p /var/lib/jenkins/workspace
sudo chown -R jenkins:jenkins /var/lib/jenkins

# Wait for Jenkins to start
log "Waiting for Jenkins to start..."
sleep 30

# Get initial admin password
if [ -f /var/lib/jenkins/secrets/initialAdminPassword ]; then
    JENKINS_PASSWORD=$(sudo cat /var/lib/jenkins/secrets/initialAdminPassword)
    log "Jenkins initial admin password: ${JENKINS_PASSWORD}"
else
    warn "Could not find Jenkins initial admin password file"
fi

# Check Jenkins status
if sudo systemctl is-active --quiet jenkins; then
    log "✅ Jenkins is running successfully!"
else
    error "Jenkins failed to start"
fi

# Install Jenkins CLI (for automation)
log "Installing Jenkins CLI..."
wget -O jenkins-cli.jar http://localhost:8080/jnlpJars/jenkins-cli.jar || warn "Could not download Jenkins CLI (Jenkins might still be starting)"

# Create Jenkins configuration directory
sudo mkdir -p /etc/jenkins
sudo chown jenkins:jenkins /etc/jenkins

# Create systemd override for Jenkins (increase memory)
log "Configuring Jenkins JVM options..."
sudo mkdir -p /etc/systemd/system/jenkins.service.d
sudo tee /etc/systemd/system/jenkins.service.d/override.conf > /dev/null << EOF
[Service]
Environment="JAVA_OPTS=-Djava.awt.headless=true -Xmx2g -Xms1g -server"
Environment="JENKINS_OPTS=--httpPort=8080 --ajp13Port=-1"
EOF

# Reload systemd and restart Jenkins
sudo systemctl daemon-reload
sudo systemctl restart jenkins

# Wait for restart
sleep 30

log "📋 Jenkins Setup Summary:"
echo "================================"
echo "🌐 Jenkins URL: http://$(curl -s ifconfig.me):8080"
echo "🔑 Initial Admin Password: ${JENKINS_PASSWORD:-'Check /var/lib/jenkins/secrets/initialAdminPassword'}"
echo "📁 Jenkins Home: /var/lib/jenkins"
echo "📋 Service Status: $(sudo systemctl is-active jenkins)"
echo "================================"

log "🔧 Required Manual Steps:"
echo "1. Open Jenkins web interface: http://$(curl -s ifconfig.me):8080"
echo "2. Use the initial admin password shown above"
echo "3. Install suggested plugins"
echo "4. Create an admin user"
echo "5. Install additional plugins:"
echo "   - Git Plugin"
echo "   - GitHub Plugin"
echo "   - Docker Pipeline Plugin"
echo "   - SSH Agent Plugin"
echo "   - Blue Ocean (optional)"
echo "6. Configure credentials (GitHub token, SSH keys, Teams webhook)"
echo "7. Create a new Pipeline job pointing to your GitHub repository"

log "📚 Next Steps:"
echo "1. Configure credentials in Jenkins"
echo "2. Create pipeline job"
echo "3. Test Teams integration: ./test-teams-integration.sh"
echo "4. Push code to trigger first build"

log "✅ Jenkins setup completed successfully!"
log "🔗 Access Jenkins at: http://$(curl -s ifconfig.me):8080"

# Create a quick status check script
cat > check-jenkins.sh << 'EOF'
#!/bin/bash
echo "🔍 Jenkins Status Check"
echo "======================="
echo "Service Status: $(sudo systemctl is-active jenkins)"
echo "Port 8080: $(sudo netstat -tlnp | grep :8080 || echo 'Not listening')"
echo "Java Version: $(java -version 2>&1 | head -n1)"
echo "Docker Status: $(sudo systemctl is-active docker)"
echo "Jenkins Logs (last 5 lines):"
sudo journalctl -u jenkins -n 5 --no-pager
EOF

chmod +x check-jenkins.sh
log "💡 Created check-jenkins.sh for status monitoring"
