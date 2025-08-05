#!/bin/bash

# Enhanced health check script for KCS Backend
set -e

# Configuration
API_URL="${API_URL:-http://localhost:4500}"
TIMEOUT="${TIMEOUT:-10}"
RETRIES="${RETRIES:-3}"
RETRY_DELAY="${RETRY_DELAY:-2}"

echo "🏥 Starting KCS Backend Health Check..."
echo "API URL: $API_URL"
echo "Timeout: ${TIMEOUT}s"
echo "Retries: $RETRIES"

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo "🔍 Checking $description..."
    
    for i in $(seq 1 $RETRIES); do
        if response=$(curl -s -w "%{http_code}" -o /tmp/health_response --max-time $TIMEOUT "$API_URL$endpoint" 2>/dev/null); then
            status_code="${response: -3}"
            
            if [ "$status_code" = "$expected_status" ]; then
                echo "✅ $description: OK (HTTP $status_code)"
                return 0
            else
                echo "⚠️ $description: Unexpected status $status_code (attempt $i/$RETRIES)"
                if [ -f /tmp/health_response ]; then
                    echo "Response: $(cat /tmp/health_response)"
                fi
            fi
        else
            echo "❌ $description: Connection failed (attempt $i/$RETRIES)"
        fi
        
        if [ $i -lt $RETRIES ]; then
            echo "⏳ Waiting ${RETRY_DELAY}s before retry..."
            sleep $RETRY_DELAY
        fi
    done
    
    echo "❌ $description: Failed after $RETRIES attempts"
    return 1
}

# Main health checks
health_checks_passed=true

# Basic health endpoint
if ! check_endpoint "/api/health" 200 "Basic Health Check"; then
    health_checks_passed=false
fi

# Database health
if ! check_endpoint "/api/health/database" 200 "Database Health Check"; then
    health_checks_passed=false
fi

# WebRTC service health (may not be critical)
if ! check_endpoint "/api/health/webrtc" 200 "WebRTC Health Check"; then
    echo "⚠️ WebRTC health check failed but continuing (non-critical service)"
fi

# Socket.IO health
if ! check_endpoint "/socket.io/" 200 "Socket.IO Health Check"; then
    echo "⚠️ Socket.IO health check failed but continuing"
fi

# Clean up
rm -f /tmp/health_response

# Final result
if [ "$health_checks_passed" = true ]; then
    echo "🎉 All critical health checks passed!"
    exit 0
else
    echo "💥 Some critical health checks failed!"
    exit 1
fi
