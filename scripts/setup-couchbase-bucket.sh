#!/bin/bash

# Couchbase Bucket Setup Script
# This script creates the required Couchbase bucket for the KCS Backend application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values (can be overridden by environment variables)
COUCHBASE_HOST="${COUCHBASE_HOST:-localhost}"
COUCHBASE_PORT="${COUCHBASE_PORT:-8091}"
COUCHBASE_USERNAME="${COUCHBASE_USERNAME:-Administrator}"
COUCHBASE_PASSWORD="${COUCHBASE_PASSWORD:-password}"
BUCKET_NAME="${BUCKET_NAME:-kcs_backend}"
BUCKET_RAM="${BUCKET_RAM:-512}"  # RAM quota in MB
BUCKET_REPLICAS="${BUCKET_REPLICAS:-0}"

echo -e "${GREEN}=== Couchbase Bucket Setup ===${NC}"
echo "Host: $COUCHBASE_HOST:$COUCHBASE_PORT"
echo "Bucket: $BUCKET_NAME"
echo "RAM Quota: ${BUCKET_RAM}MB"
echo ""

# Function to check if Couchbase is accessible
check_couchbase() {
    echo -e "${YELLOW}Checking Couchbase connectivity...${NC}"
    if curl -s -f "http://$COUCHBASE_HOST:$COUCHBASE_PORT/pools" > /dev/null; then
        echo -e "${GREEN}✓ Couchbase is accessible${NC}"
        return 0
    else
        echo -e "${RED}✗ Cannot connect to Couchbase at $COUCHBASE_HOST:$COUCHBASE_PORT${NC}"
        echo -e "${RED}Please ensure Couchbase is running and accessible${NC}"
        return 1
    fi
}

# Function to check if bucket exists
check_bucket_exists() {
    local bucket_name=$1
    echo -e "${YELLOW}Checking if bucket '$bucket_name' exists...${NC}"
    
    response=$(curl -s -u "$COUCHBASE_USERNAME:$COUCHBASE_PASSWORD" \
        "http://$COUCHBASE_HOST:$COUCHBASE_PORT/pools/default/buckets/$bucket_name")
    
    if echo "$response" | grep -q '"name"'; then
        echo -e "${GREEN}✓ Bucket '$bucket_name' already exists${NC}"
        return 0
    else
        echo -e "${YELLOW}✗ Bucket '$bucket_name' does not exist${NC}"
        return 1
    fi
}

# Function to create bucket
create_bucket() {
    local bucket_name=$1
    echo -e "${YELLOW}Creating bucket '$bucket_name'...${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -u "$COUCHBASE_USERNAME:$COUCHBASE_PASSWORD" \
        -X POST "http://$COUCHBASE_HOST:$COUCHBASE_PORT/pools/default/buckets" \
        -d "name=$bucket_name" \
        -d "bucketType=couchbase" \
        -d "ramQuota=$BUCKET_RAM" \
        -d "replicaNumber=$BUCKET_REPLICAS" \
        -d "flushEnabled=1" \
        -d "evictionPolicy=valueOnly")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "202" ] || [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Bucket '$bucket_name' created successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to create bucket '$bucket_name'${NC}"
        echo -e "${RED}HTTP Status: $http_code${NC}"
        echo -e "${RED}Response: $response_body${NC}"
        return 1
    fi
}

# Function to wait for bucket to be ready
wait_for_bucket() {
    local bucket_name=$1
    local max_wait=30
    local waited=0
    
    echo -e "${YELLOW}Waiting for bucket to be ready...${NC}"
    
    while [ $waited -lt $max_wait ]; do
        if curl -s -f -u "$COUCHBASE_USERNAME:$COUCHBASE_PASSWORD" \
            "http://$COUCHBASE_HOST:$COUCHBASE_PORT/pools/default/buckets/$bucket_name" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Bucket is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        waited=$((waited + 1))
    done
    
    echo ""
    echo -e "${RED}✗ Timeout waiting for bucket to be ready${NC}"
    return 1
}

# Main execution
main() {
    # Check Couchbase connectivity
    if ! check_couchbase; then
        exit 1
    fi
    
    echo ""
    
    # Check if bucket exists
    if check_bucket_exists "$BUCKET_NAME"; then
        echo ""
        echo -e "${GREEN}Bucket setup is complete. No action needed.${NC}"
        exit 0
    fi
    
    echo ""
    
    # Create bucket
    if create_bucket "$BUCKET_NAME"; then
        wait_for_bucket "$BUCKET_NAME"
        echo ""
        echo -e "${GREEN}=== Bucket Setup Complete ===${NC}"
        echo -e "${GREEN}Bucket '$BUCKET_NAME' is ready for use${NC}"
        echo ""
        echo -e "${YELLOW}Next steps:${NC}"
        echo "1. Ensure your .env file has the correct bucket name: OTTOMAN_BUCKET_NAME=$BUCKET_NAME"
        echo "2. Restart your application to connect to the bucket"
        echo "3. The application will automatically create indexes and collections"
    else
        echo ""
        echo -e "${RED}=== Bucket Setup Failed ===${NC}"
        echo -e "${RED}Please check the error messages above and try again${NC}"
        exit 1
    fi
}

# Display usage information
usage() {
    echo "Usage: $0"
    echo ""
    echo "Environment variables:"
    echo "  COUCHBASE_HOST       - Couchbase server host (default: localhost)"
    echo "  COUCHBASE_PORT       - Couchbase server port (default: 8091)"
    echo "  COUCHBASE_USERNAME   - Couchbase admin username (default: Administrator)"
    echo "  COUCHBASE_PASSWORD   - Couchbase admin password (default: password)"
    echo "  BUCKET_NAME          - Name of bucket to create (default: kcs_backend)"
    echo "  BUCKET_RAM           - RAM quota in MB (default: 512)"
    echo "  BUCKET_REPLICAS      - Number of replicas (default: 0)"
    echo ""
    echo "Example:"
    echo "  COUCHBASE_HOST=65.0.98.183 COUCHBASE_PASSWORD=yourpass BUCKET_NAME=kcs_backend $0"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

# Run main function
main
