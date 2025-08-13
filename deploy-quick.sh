#!/bin/bash

# Quick deployment script without MediaSoup build
# Use this if the main build is failing due to MediaSoup compilation

set -e

echo "🚀 KCS Backend Quick Deployment (No MediaSoup)"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

PROJECT_DIR="$HOME/KCS-Backend"
cd "$PROJECT_DIR"

log "Creating minimal Dockerfile for quick deployment..."
cat > Dockerfile.minimal << 'EOF'
FROM oven/bun:1.2.15-alpine

USER root
RUN apk add --no-cache curl ca-certificates && \
    addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001 -G bunuser

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (skip MediaSoup for now)
RUN bun install --production || bun install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads recordings dist && \
    chown -R bunuser:bunuser /app

USER bunuser

# Expose ports
EXPOSE 4500 4501

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4500/api/health || exit 1

CMD ["bun", "src/index.ts"]
EOF

log "Stopping existing containers..."
docker compose down || true

log "Building with minimal Dockerfile..."
DOCKERFILE=Dockerfile.minimal docker compose build --no-cache

log "Starting services..."
docker compose up -d

log "Waiting for services..."
sleep 10

log "Checking status..."
docker compose ps

log "Testing health..."
for i in {1..5}; do
    if curl -s -f http://localhost:4500/api/health > /dev/null 2>&1; then
        log "✅ Health check passed!"
        break
    else
        warn "Health check attempt $i/5 failed, retrying..."
        sleep 3
    fi
done

log "🎉 Quick deployment completed!"
log "Note: MediaSoup features may not work without proper build"
