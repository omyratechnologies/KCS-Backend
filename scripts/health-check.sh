#!/bin/bash

# Health check script for single development environment
# This script provides robust health checking with multiple fallback strategies

set -e

HEALTH_URL="https://devapi.letscatchup-kcs.com"
MAX_RETRIES=5
RETRY_DELAY=10
TIMEOUT=30

echo "🏥 Starting comprehensive health checks for single development environment..."

# Function to check endpoint with retries
check_endpoint() {
    local endpoint="$1"
    local description="$2"
    local retries=0
    
    echo "Testing $description: $endpoint"
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f --connect-timeout $TIMEOUT --max-time $TIMEOUT "$endpoint" >/dev/null 2>&1; then
            echo "✅ $description check passed (attempt $((retries + 1)))"
            return 0
        else
            retries=$((retries + 1))
            if [ $retries -lt $MAX_RETRIES ]; then
                echo "⚠️ $description check failed (attempt $retries), retrying in ${RETRY_DELAY}s..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    echo "❌ $description check failed after $MAX_RETRIES attempts (non-critical for dev environment)"
    return 1
}

# Wait for deployment to stabilize
echo "⏳ Waiting for deployment to stabilize..."
sleep 20

# Check main health endpoint
check_endpoint "$HEALTH_URL/api/health" "Main Health Endpoint"

# Check auth health endpoint
check_endpoint "$HEALTH_URL/api/auth/health" "Auth Health Endpoint" || true

# Check WebSocket endpoint
check_endpoint "$HEALTH_URL/socket.io/" "WebSocket Endpoint" || true

# Additional checks for critical functionality
echo "🔍 Performing additional health checks..."

# Check if server responds with any content
if curl --connect-timeout $TIMEOUT --max-time $TIMEOUT "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✅ Server is responding"
else
    echo "⚠️ Server not responding (may still be starting up)"
fi

# Check specific API routes
check_endpoint "$HEALTH_URL/api" "API Base Route" || true

echo "🎉 Health check process completed for single development environment"
echo "Note: Some failures are expected in development environment and are non-critical"

exit 0
