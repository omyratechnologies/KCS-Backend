#!/bin/bash

# Simple deployment script for KCS Backend
# Usage: ./deploy-simple.sh

set -e

echo "🚀 Starting KCS Backend Deployment..."

# Configuration
DEPLOY_HOST="65.0.98.183"
DEPLOY_USER="ubuntu"
SSH_KEY="/Users/avinashgantala/Development/KCS-Project/KCS-Backend-1/kcs-dev.pem"
PROJECT_DIR="~/KCS-Backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Function to execute commands on remote server
remote_exec() {
    ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${DEPLOY_USER}@${DEPLOY_HOST} "$1"
}

# Function to copy files to remote server
remote_copy() {
    scp -i ${SSH_KEY} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$1" ${DEPLOY_USER}@${DEPLOY_HOST}:"$2"
}

log "Checking server connectivity..."
if ! remote_exec "echo 'Server connected successfully'"; then
    error "Cannot connect to deployment server"
    exit 1
fi

log "Pulling latest code from repository..."
remote_exec "cd ${PROJECT_DIR} && git pull origin main"

log "Stopping existing containers..."
remote_exec "cd ${PROJECT_DIR} && docker compose down || true"

log "Cleaning up old images..."
remote_exec "cd ${PROJECT_DIR} && docker image prune -f"

log "Building Docker images..."
remote_exec "cd ${PROJECT_DIR} && docker compose build --no-cache"

log "Starting services..."
remote_exec "cd ${PROJECT_DIR} && docker compose up -d"

log "Waiting for services to start..."
sleep 15

log "Checking service health..."
if remote_exec "cd ${PROJECT_DIR} && docker compose exec -T api curl -f http://localhost:4500/api/health"; then
    log "✅ Health check passed!"
else
    warn "Health check failed, showing container status..."
    remote_exec "cd ${PROJECT_DIR} && docker compose ps"
    remote_exec "cd ${PROJECT_DIR} && docker compose logs api | tail -20"
fi

log "Deployment Status:"
remote_exec "cd ${PROJECT_DIR} && docker compose ps"

log "🎉 Deployment completed! Services should be available at:"
echo "   - API: http://${DEPLOY_HOST}"
echo "   - Health: http://${DEPLOY_HOST}/api/health"

log "To check logs, run:"
echo "   ssh -i ${SSH_KEY} ${DEPLOY_USER}@${DEPLOY_HOST} 'cd ${PROJECT_DIR} && docker compose logs -f'"
