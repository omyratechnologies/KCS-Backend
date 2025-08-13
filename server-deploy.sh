#!/bin/bash

# Server-side deployment script
# Run this script directly on the backend server (65.0.98.183)

set -e

echo "🚀 KCS Backend Server Deployment"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running on the server
if [ "$HOSTNAME" != "ip-10-0-1-19" ]; then
    warn "This script should be run on the backend server (65.0.98.183)"
    echo "Current hostname: $HOSTNAME"
    echo "Expected: ip-10-0-1-19"
    echo ""
    echo "To run on the server, copy this script and execute:"
    echo "scp server-deploy.sh ubuntu@65.0.98.183:~/"
    echo "ssh ubuntu@65.0.98.183 'chmod +x ~/server-deploy.sh && ~/server-deploy.sh'"
    exit 1
fi

PROJECT_DIR="$HOME/KCS-Backend"

log "Starting deployment process..."

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    log "Cloning repository..."
    git clone https://github.com/omyratechnologies/KCS-Backend.git "$PROJECT_DIR"
else
    log "Repository exists, pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull origin main
fi

cd "$PROJECT_DIR"

log "Current directory: $(pwd)"
log "Git status:"
git status --short || true
git log --oneline -5

log "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    error "Docker is not installed!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose is not installed!"
    exit 1
fi

log "Docker version: $(docker --version)"
log "Docker Compose version: $(docker compose version || docker-compose --version)"

log "Stopping existing containers..."
docker compose down || docker-compose down || true

log "Cleaning up old resources..."
docker image prune -f
docker volume prune -f

log "Building Docker images..."
# Try with simple Dockerfile first, fall back to main Dockerfile
if [ -f "Dockerfile.simple" ]; then
    log "Using simplified Dockerfile for faster build..."
    if docker compose -f docker-compose.yaml build --build-arg DOCKERFILE=Dockerfile.simple --no-cache; then
        log "✅ Build successful with simple Dockerfile!"
    else
        warn "Simple Dockerfile failed, trying main Dockerfile..."
        if docker compose build --no-cache; then
            log "✅ Build successful with main Dockerfile!"
        else
            error "❌ Build failed with both Dockerfiles!"
            log "Showing build logs..."
            docker compose logs api || true
            exit 1
        fi
    fi
else
    if docker compose build --no-cache; then
        log "✅ Build successful!"
    else
        error "❌ Build failed!"
        log "Showing build logs..."
        docker compose logs api || true
        exit 1
    fi
fi

log "Starting services in detached mode..."
if docker compose up -d; then
    log "✅ Services started successfully!"
else
    error "❌ Failed to start services!"
    exit 1
fi

log "Waiting for services to initialize..."
sleep 15

log "Checking container status..."
docker compose ps

log "Testing health endpoint..."
for i in {1..10}; do
    if curl -s -f http://localhost/api/health > /dev/null 2>&1; then
        log "✅ Health check passed!"
        break
    elif curl -s -f http://localhost:4500/api/health > /dev/null 2>&1; then
        log "✅ Direct API health check passed!"
        break
    else
        warn "Health check attempt $i/10 failed, retrying in 5 seconds..."
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        error "❌ Health check failed after 10 attempts"
        log "Container logs:"
        docker compose logs api | tail -20
    fi
done

log "Final deployment status:"
echo "=========================="
docker compose ps
echo ""

log "Service endpoints:"
echo "🌐 Main API: http://$(curl -s ifconfig.me)/api/health"
echo "🔍 Direct API: http://$(curl -s ifconfig.me):4500/api/health"
echo "📊 Local health: http://localhost/api/health"

log "🎉 Deployment completed!"
echo ""
info "To monitor logs: docker compose logs -f"
info "To check status: docker compose ps"
info "To restart: docker compose restart"
