#!/bin/bash

# WebRTC Video Conferencing Backend Deployment Script
# This script sets up the production environment for the KCS Backend with WebRTC support

set -e

echo "🚀 Starting WebRTC Video Conferencing Backend Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.production template..."
    if [ -f .env.production ]; then
        cp .env.production .env
        print_warning "Please edit .env file with your production values before continuing."
        print_warning "Press Enter to continue after editing .env file..."
        read
    else
        print_error ".env.production template not found. Please create .env file manually."
        exit 1
    fi
fi

# Create necessary directories
print_status "Creating required directories..."
mkdir -p logs uploads recordings ssl

# Generate self-signed SSL certificates if they don't exist
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    print_status "Generating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    print_success "SSL certificates generated"
else
    print_success "SSL certificates already exist"
fi

# Set appropriate permissions
print_status "Setting file permissions..."
chmod 755 logs uploads recordings
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Remove old images (optional)
if [ "$1" = "--clean" ]; then
    print_status "Cleaning old Docker images..."
    docker system prune -f
    docker-compose build --no-cache
else
    # Build the application
    print_status "Building Docker images..."
    docker-compose build
fi

# Start the services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check API health
if curl -f http://localhost:4500/api/health >/dev/null 2>&1; then
    print_success "API service is healthy"
else
    print_error "API service health check failed"
    docker-compose logs api
    exit 1
fi

# Check Redis health
if docker-compose exec redis redis-cli ping >/dev/null 2>&1; then
    print_success "Redis service is healthy"
else
    print_error "Redis service health check failed"
    docker-compose logs redis
    exit 1
fi

# Check WebRTC health
if curl -f http://localhost:4500/api/meeting/system/webrtc-health >/dev/null 2>&1; then
    print_success "WebRTC service is healthy"
else
    print_warning "WebRTC service health check failed - may need configuration"
fi

# Display service status
print_status "Service Status:"
docker-compose ps

# Display access information
echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service Information:"
echo "   🌐 API Server: http://localhost:4500"
echo "   🔒 HTTPS API: https://localhost:443"
echo "   🔌 Socket.IO: http://localhost:4501"
echo "   📊 Health Check: http://localhost:4500/api/health"
echo "   🎥 WebRTC Health: http://localhost:4500/api/meeting/system/webrtc-health"
echo ""
echo "📁 Important Directories:"
echo "   📝 Logs: ./logs/"
echo "   📤 Uploads: ./uploads/"
echo "   🎬 Recordings: ./recordings/"
echo "   🔐 SSL Certs: ./ssl/"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update images: docker-compose pull && docker-compose up -d"
echo ""
echo "⚠️  Production Checklist:"
echo "   ✅ Update .env with production values"
echo "   ✅ Replace self-signed SSL certificates with real ones"
echo "   ✅ Configure firewall to allow ports 80, 443, 4500, 4501, 40000-40100"
echo "   ✅ Set up monitoring and alerting"
echo "   ✅ Configure backup for uploads and recordings"
echo "   ✅ Set up log rotation"
echo ""
print_success "Your WebRTC Video Conferencing Backend is now running! 🎪"
