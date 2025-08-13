#!/bin/bash

# Health check script for KCS Backend
# Tests if the application is running correctly

set -e

DEPLOY_HOST="65.0.98.183"
API_PORT="80"
MAX_RETRIES=10
RETRY_INTERVAL=5

echo "🔍 Running health checks for KCS Backend..."

# Function to check endpoint
check_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    echo -n "Checking ${description}... "
    
    if curl -s -f "http://${DEPLOY_HOST}:${API_PORT}${endpoint}" > /dev/null; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local endpoint="$1"
    local retries=0
    
    echo "Waiting for service to be ready..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s -f "http://${DEPLOY_HOST}:${API_PORT}${endpoint}" > /dev/null; then
            echo "✅ Service is ready!"
            return 0
        fi
        
        retries=$((retries + 1))
        echo "Attempt ${retries}/${MAX_RETRIES} failed, waiting ${RETRY_INTERVAL}s..."
        sleep $RETRY_INTERVAL
    done
    
    echo "❌ Service failed to become ready after ${MAX_RETRIES} attempts"
    return 1
}

echo "🚀 Starting health checks..."

# Wait for main service
wait_for_service "/api/health"

echo ""
echo "📊 Running detailed health checks..."

# Check various endpoints
check_endpoint "/api/health" "API Health Endpoint"

echo ""
echo "🐳 Checking Docker containers..."
ssh -i /Users/avinashgantala/Development/KCS-Project/KCS-Backend-1/kcs-dev.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@${DEPLOY_HOST} \
    'cd ~/KCS-Backend && docker compose ps'

echo ""
echo "📈 Service Status Summary:"
echo "  API Server: http://${DEPLOY_HOST}:${API_PORT}"
echo "  Health Check: http://${DEPLOY_HOST}:${API_PORT}/api/health"

echo ""
echo "✅ Health check completed!"
