#!/bin/bash

# Jenkins Deployment Verification Script
# Run this after Jenkins deployment to ensure everything is working correctly

set -e

echo "🔍 KCS Backend Deployment Verification"
echo "========================================"

# Function to check service status
check_service() {
    local service_name=$1
    local check_command=$2
    local expected_result=$3
    
    echo -n "Checking $service_name... "
    if eval "$check_command" | grep -q "$expected_result"; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local service_name=$1
    local check_command=$2
    local max_attempts=30
    local attempt=1
    
    echo "Waiting for $service_name to be ready..."
    while [ $attempt -le $max_attempts ]; do
        if eval "$check_command" &>/dev/null; then
            echo "✅ $service_name is ready"
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts - waiting..."
        sleep 5
        ((attempt++))
    done
    
    echo "❌ $service_name failed to start within timeout"
    return 1
}

echo "📊 Deployment Information"
echo "Server: 65.2.31.97"
echo "Container: kcs-backend"
echo "Port: 4500"
echo "Date: $(date)"
echo

# Check Git repository status
echo "🌿 Git Repository Status"
echo "------------------------"
cd ~/KCS-Backend
echo "Current branch: $(git branch --show-current)"
echo "Latest commit: $(git log --oneline -1)"
echo "Repository status:"
git status --porcelain
echo

# Check Docker container status
echo "🐳 Docker Container Status"
echo "--------------------------"
if docker ps | grep -q kcs-backend; then
    echo "✅ Container is running"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep kcs-backend
    
    # Container details
    echo
    echo "Container details:"
    docker inspect kcs-backend --format "{{.State.Status}} since {{.State.StartedAt}}"
    docker inspect kcs-backend --format "Image: {{.Config.Image}}"
    
    # Wait for container to be fully ready
    wait_for_service "Backend API" "curl -f http://localhost:4500/api/health"
    
else
    echo "❌ Container is not running"
    echo "Recent containers:"
    docker ps -a | head -3
    exit 1
fi

echo

# Check application health
echo "🏥 Application Health Checks"
echo "----------------------------"

# Internal health check
check_service "Internal Health" "curl -s http://localhost:4500/api/health" "OK"

# External health check through nginx
if command -v nginx &> /dev/null && systemctl is-active nginx &> /dev/null; then
    echo "✅ Nginx is running"
    check_service "External Health" "curl -s https://devapi.letscatchup-kcs.com/api/health" "OK"
else
    echo "⚠️ Nginx not running or not installed"
fi

echo

# Check application logs
echo "📋 Application Logs (Last 10 lines)"
echo "-----------------------------------"
docker logs --tail 10 kcs-backend

echo

# Check system resources
echo "🖥️ System Resources"
echo "-------------------"
echo "Memory usage:"
free -h | grep -E "(total|Mem:)"
echo
echo "Disk usage:"
df -h / | grep -E "(Filesystem|/dev)"
echo
echo "CPU load:"
uptime

echo

# Check ports
echo "🔌 Port Status"
echo "-------------"
if netstat -tlnp 2>/dev/null | grep -q ":4500"; then
    echo "✅ Port 4500 is bound"
    netstat -tlnp 2>/dev/null | grep ":4500"
else
    echo "❌ Port 4500 is not bound"
fi

echo

# API endpoint tests
echo "🧪 API Endpoint Tests"
echo "--------------------"

test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo "✅ OK ($response)"
        else
            echo "⚠️ Unexpected status ($response)"
        fi
    else
        echo "❌ Failed to connect"
    fi
}

test_endpoint "http://localhost:4500/api/health" "Health endpoint"
test_endpoint "http://localhost:4500/api/version" "Version endpoint" "200"

echo

# Check environment configuration
echo "⚙️ Environment Configuration"
echo "----------------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "Environment variables count: $(grep -c "^[^#]" .env 2>/dev/null || echo 0)"
else
    echo "⚠️ .env file not found"
fi

# Check Docker image info
echo
echo "📦 Docker Image Information"
echo "--------------------------"
docker inspect kcs-backend --format "{{.Config.Image}}" | while read image; do
    echo "Image: $image"
    docker images "$image" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}"
done

echo

# Final summary
echo "📝 Deployment Summary"
echo "====================="

if docker ps | grep -q kcs-backend && curl -s http://localhost:4500/api/health | grep -q "OK"; then
    echo "🎉 DEPLOYMENT SUCCESSFUL"
    echo "✅ Container is running"
    echo "✅ API is responding"
    echo "✅ Health checks passed"
    
    echo
    echo "🔗 Access Points:"
    echo "• Internal: http://localhost:4500"
    echo "• External: https://devapi.letscatchup-kcs.com"
    echo
    echo "📊 Monitoring:"
    echo "• Logs: docker logs -f kcs-backend"
    echo "• Status: docker ps | grep kcs-backend"
    echo "• Health: curl http://localhost:4500/api/health"
    
    exit 0
else
    echo "❌ DEPLOYMENT FAILED"
    echo "Please check the logs above for errors"
    echo
    echo "🔧 Troubleshooting:"
    echo "• Check container logs: docker logs kcs-backend"
    echo "• Restart container: docker restart kcs-backend"
    echo "• Rebuild: docker build -t kcs-backend . && docker run -d --name kcs-backend -p 4500:4500 kcs-backend"
    
    exit 1
fi
