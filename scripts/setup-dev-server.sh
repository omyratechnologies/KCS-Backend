#!/bin/bash

# KCS Backend Development Server Setup Script
# Run this on your development server (65.2.31.97) to prepare for Jenkins CI/CD

set -e

echo "🚀 Setting up KCS Backend Development Server for Jenkins CI/CD"

# Update system packages first
echo "📦 Updating system packages..."
sudo apt-get update

# Check and install essential tools
echo "🔧 Installing essential tools..."

# Install curl if not present
if ! command -v curl &> /dev/null; then
    echo "📦 Installing curl..."
    sudo apt-get install -y curl
else
    echo "✅ curl already installed"
fi

# Install wget if not present
if ! command -v wget &> /dev/null; then
    echo "📦 Installing wget..."
    sudo apt-get install -y wget
else
    echo "✅ wget already installed"
fi

# Install unzip if not present
if ! command -v unzip &> /dev/null; then
    echo "📦 Installing unzip..."
    sudo apt-get install -y unzip
else
    echo "✅ unzip already installed"
fi

# Install git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo apt-get install -y git
else
    echo "✅ Git already installed: $(git --version)"
fi

# Check Docker installation
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and log back in to apply group changes."
    
    # Start and enable Docker service
    sudo systemctl start docker
    sudo systemctl enable docker
    echo "✅ Docker service started and enabled"
else
    echo "✅ Docker already installed: $(docker --version)"
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "🔄 Starting Docker daemon..."
    sudo systemctl start docker
    sudo systemctl enable docker
    sleep 5
    
    # Verify Docker is working
    if docker info &> /dev/null; then
        echo "✅ Docker daemon is running"
    else
        echo "❌ Failed to start Docker daemon"
        exit 1
    fi
else
    echo "✅ Docker daemon is already running"
fi

# Install Node.js (useful for some build processes)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installed: $(node --version)"
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Install nginx if not present (for reverse proxy)
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    echo "✅ Nginx installed and enabled"
else
    echo "✅ Nginx already installed"
fi

# Ensure we're in the right directory
cd ~/KCS-Backend

# Check if git repository is properly set up
echo "📂 Checking Git repository..."
if [ ! -d ".git" ]; then
    echo "❌ This doesn't appear to be a git repository"
    echo "Please clone the repository first:"
    echo "git clone https://github.com/omyratechnologies/KCS-Backend.git"
    exit 1
fi

# Set up git to pull updates
echo "🔧 Configuring Git for automated pulls..."
git config pull.rebase false  # Use merge strategy for pulls
git remote -v

# Ensure we're on the dev branch
echo "🌿 Switching to dev branch..."
git checkout dev
git pull origin dev

# Check Docker installation
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and log back in to apply group changes."
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "🔄 Starting Docker daemon..."
    sudo systemctl start docker
    sudo systemctl enable docker
fi

# Create environment file if it doesn't exist
echo "📝 Setting up environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        cat > .env << EOF
# KCS Backend Environment Configuration
NODE_ENV=development
PORT=4500
# Add your other environment variables here
EOF
        echo "✅ Created basic .env file"
    fi
else
    echo "✅ .env file already exists"
fi

# Check current container status
echo "📊 Checking current container status..."
if docker ps -a | grep -q kcs-backend; then
    echo "📦 Found existing kcs-backend container"
    docker ps -a | grep kcs-backend
else
    echo "📦 No existing kcs-backend container found"
fi

# Test build (optional - comment out if you want to skip)
echo "🏗️ Testing Docker build..."
docker build -t kcs-backend:test . || {
    echo "⚠️ Docker build failed. Please check your Dockerfile"
    exit 1
}

echo "✅ Build test successful"

# Clean up test image
docker rmi kcs-backend:test 2>/dev/null || true

# Set up log rotation for container logs
echo "📋 Setting up log rotation..."
sudo tee /etc/logrotate.d/docker-kcs-backend > /dev/null << EOF
/var/lib/docker/containers/*/*-json.log {
    rotate 7
    daily
    compress
    missingok
    delaycompress
    copytruncate
}
EOF

# Create monitoring script update
echo "📊 Updating monitoring script..."
cat > ~/monitor-backend.sh << 'EOF'
#!/bin/bash

echo "=== KCS Backend Status ==="
echo "Date: $(date)"
echo

echo "=== Docker Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|kcs-backend)"
echo

echo "=== Container Logs (last 20 lines) ==="
docker logs --tail 20 kcs-backend 2>/dev/null || echo "Container not running"
echo

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager
echo

echo "=== Health Check ==="
echo "HTTP -> HTTPS redirect:"
curl -I http://localhost:4500/api/health 2>/dev/null | head -1 || echo "HTTP endpoint not accessible"
echo "HTTPS health endpoint:"
curl -s https://devapi.letscatchup-kcs.com/api/health 2>/dev/null || echo "HTTPS endpoint not accessible"
echo

echo "=== System Resources ==="
echo "Memory usage:"
free -h
echo "Disk usage:"
df -h /
echo "CPU load:"
uptime
echo

echo "=== Recent Git Activity ==="
cd ~/KCS-Backend && git log --oneline -5
EOF

chmod +x ~/monitor-backend.sh

echo
echo "🎉 Development server setup completed!"
echo
echo "📋 Next Steps:"
echo "1. ✅ Git repository configured for automated pulls"
echo "2. ✅ Docker is ready for container management"
echo "3. ✅ Environment file is set up"
echo "4. ✅ Monitoring script updated"
echo
echo "🔐 Jenkins Setup Required:"
echo "1. Add SSH key 'kcs-dev.pem' to Jenkins credentials as 'ec2-ssh-key'"
echo "2. Ensure Jenkins can SSH to ubuntu@65.2.31.97"
echo "3. Test deployment by triggering a Jenkins build on dev branch"
echo
echo "🔍 Monitor deployments with: ./monitor-backend.sh"
echo "📊 Check logs with: docker logs -f kcs-backend"
echo
echo "✅ Server ready for Jenkins CI/CD deployments!"
