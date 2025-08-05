#!/bin/bash

# Quick System Health Check for KCS Backend Server
# Verifies all required tools are installed and working

echo "🔍 KCS Backend Server Health Check"
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command availability
check_command() {
    local cmd=$1
    local name=$2
    local version_flag=${3:-"--version"}
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd $version_flag 2>/dev/null | head -1)
        echo -e "✅ ${GREEN}$name${NC}: $version"
        return 0
    else
        echo -e "❌ ${RED}$name not found${NC}"
        return 1
    fi
}

# Function to check service status
check_service() {
    local service=$1
    local name=$2
    
    if systemctl is-active --quiet "$service"; then
        echo -e "✅ ${GREEN}$name service is running${NC}"
        return 0
    else
        echo -e "❌ ${RED}$name service is not running${NC}"
        return 1
    fi
}

echo "📦 Essential Tools"
echo "------------------"
check_command "git" "Git"
check_command "curl" "curl"
check_command "wget" "wget"
check_command "unzip" "unzip"
check_command "docker" "Docker"
check_command "node" "Node.js"
check_command "npm" "npm"

echo
echo "🐳 Docker Status"
echo "----------------"
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        echo -e "✅ ${GREEN}Docker daemon is running${NC}"
        echo "Docker version: $(docker --version)"
        
        # Check if user is in docker group
        if groups $USER | grep -q docker; then
            echo -e "✅ ${GREEN}User is in docker group${NC}"
        else
            echo -e "⚠️ ${YELLOW}User not in docker group - may need sudo for docker commands${NC}"
        fi
        
        # Check for existing KCS container
        if docker ps -a | grep -q kcs-backend; then
            echo "📦 KCS Backend containers:"
            docker ps -a | grep kcs-backend
        else
            echo "📦 No KCS Backend containers found"
        fi
    else
        echo -e "❌ ${RED}Docker daemon not running${NC}"
    fi
else
    echo -e "❌ ${RED}Docker not installed${NC}"
fi

echo
echo "🌐 Web Services"
echo "---------------"
check_service "nginx" "Nginx"

# Check nginx configuration if running
if systemctl is-active --quiet nginx; then
    echo "Nginx status: $(systemctl show -p SubState nginx --value)"
    if [ -f "/etc/nginx/sites-available/default" ] || [ -f "/etc/nginx/nginx.conf" ]; then
        echo -e "✅ ${GREEN}Nginx configuration files found${NC}"
    fi
fi

echo
echo "📂 Project Status"
echo "-----------------"
if [ -d "$HOME/KCS-Backend" ]; then
    echo -e "✅ ${GREEN}KCS-Backend directory exists${NC}"
    cd "$HOME/KCS-Backend"
    
    if [ -d ".git" ]; then
        echo -e "✅ ${GREEN}Git repository initialized${NC}"
        echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
        echo "Latest commit: $(git log --oneline -1 2>/dev/null || echo 'No commits')"
    else
        echo -e "❌ ${RED}Not a git repository${NC}"
    fi
    
    if [ -f ".env" ]; then
        echo -e "✅ ${GREEN}.env file exists${NC}"
        echo "Environment variables: $(grep -c '^[^#]' .env 2>/dev/null || echo 0)"
    else
        echo -e "⚠️ ${YELLOW}.env file not found${NC}"
    fi
    
    if [ -f "package.json" ]; then
        echo -e "✅ ${GREEN}package.json exists${NC}"
    else
        echo -e "❌ ${RED}package.json not found${NC}"
    fi
    
    if [ -f "Dockerfile" ]; then
        echo -e "✅ ${GREEN}Dockerfile exists${NC}"
    else
        echo -e "❌ ${RED}Dockerfile not found${NC}"
    fi
else
    echo -e "❌ ${RED}KCS-Backend directory not found${NC}"
    echo "Please clone the repository first:"
    echo "git clone https://github.com/omyratechnologies/KCS-Backend.git ~/KCS-Backend"
fi

echo
echo "🖥️ System Resources"
echo "-------------------"
echo "CPU cores: $(nproc)"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}') total, $(free -h | grep '^Mem:' | awk '{print $7}') available"
echo "Disk space: $(df -h / | tail -1 | awk '{print $4}') available on /"
echo "Load average: $(uptime | awk -F'load average:' '{print $2}')"

echo
echo "🔌 Network & Ports"
echo "------------------"
if command -v netstat &> /dev/null; then
    echo "Listening ports:"
    netstat -tlnp 2>/dev/null | grep ':4500\|:80\|:443' || echo "No web services detected on standard ports"
else
    echo "netstat not available - install net-tools for port checking"
fi

echo
echo "🔐 Security & Access"
echo "--------------------"
echo "Current user: $(whoami)"
echo "User groups: $(groups)"
echo "SSH key permissions:"
if [ -d "$HOME/.ssh" ]; then
    ls -la "$HOME/.ssh/" | grep -E "(id_|authorized_keys)" 2>/dev/null || echo "No SSH keys found"
else
    echo "No .ssh directory found"
fi

echo
echo "📋 Summary"
echo "----------"

# Count issues
issues=0
if ! command -v docker &> /dev/null; then ((issues++)); fi
if ! command -v git &> /dev/null; then ((issues++)); fi
if ! docker info &> /dev/null 2>&1; then ((issues++)); fi
if [ ! -d "$HOME/KCS-Backend" ]; then ((issues++)); fi

if [ $issues -eq 0 ]; then
    echo -e "🎉 ${GREEN}All systems ready for Jenkins deployment!${NC}"
    echo
    echo "Next steps:"
    echo "1. Ensure Jenkins has SSH access to this server"
    echo "2. Configure Jenkins credentials with SSH key"
    echo "3. Test deployment pipeline"
else
    echo -e "⚠️ ${YELLOW}Found $issues issue(s) that need attention${NC}"
    echo
    echo "Common fixes:"
    echo "• Run: sudo ./setup-dev-server.sh"
    echo "• Restart Docker: sudo systemctl restart docker"
    echo "• Clone repository: git clone https://github.com/omyratechnologies/KCS-Backend.git ~/KCS-Backend"
fi

echo
echo "🔍 For detailed setup, run: ./setup-dev-server.sh"
echo "📊 For deployment verification, run: ./verify-deployment.sh"
