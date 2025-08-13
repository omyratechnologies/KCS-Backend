#!/bin/bash

# Local Docker build and test script
# This script builds and runs the application locally for testing

set -e

echo "🏗️  Building KCS Backend locally for testing..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

log "Stopping existing containers..."
docker compose down || true

log "Cleaning up old images..."
docker image prune -f

log "Building Docker images..."
docker compose build --no-cache

log "Starting services..."
docker compose up -d

log "Waiting for services to start..."
sleep 15

log "Checking service health..."
if curl -f http://localhost/api/health 2>/dev/null; then
    log "✅ Health check passed!"
else
    warn "Health check failed, showing container status..."
    docker compose ps
    echo ""
    log "API container logs:"
    docker compose logs api | tail -20
    echo ""
    log "Nginx container logs:"
    docker compose logs nginx | tail -10
fi

log "Deployment Status:"
docker compose ps

log "🎉 Local deployment completed! Services should be available at:"
echo "   - API: http://localhost"
echo "   - Health: http://localhost/api/health"
echo "   - Direct API: http://localhost:4500/api/health"

log "To check logs, run:"
echo "   docker compose logs -f"
