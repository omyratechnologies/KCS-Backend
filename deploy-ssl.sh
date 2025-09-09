#!/bin/bash

# KCS Backend SSL Setup and Deployment Script
# This script sets up SSL certificates and deploys the KCS backend with HTTPS support

set -e

echo "🚀 KCS Backend SSL Setup and Deployment"
echo "========================================"

# Create SSL directory
echo "📁 Creating SSL directory..."
mkdir -p ssl/certs ssl/private

# Generate self-signed SSL certificates
echo "🔐 Generating SSL certificates..."
openssl genrsa -out ssl/private/nginx-selfsigned.key 2048

openssl req -new -x509 -key ssl/private/nginx-selfsigned.key \
    -out ssl/certs/nginx-selfsigned.crt \
    -days 365 \
    -subj "/C=US/ST=CA/L=San Francisco/O=KCS/CN=api.letscatchup-kcs.com"

# Set appropriate permissions
chmod 600 ssl/private/nginx-selfsigned.key
chmod 644 ssl/certs/nginx-selfsigned.crt

echo "✅ SSL certificates generated successfully!"
echo "   Certificate: ssl/certs/nginx-selfsigned.crt"
echo "   Private Key: ssl/private/nginx-selfsigned.key"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Build and start with SSL support
echo "🔨 Building and starting containers with SSL support..."
docker compose build --no-cache
docker compose up -d

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check container status
echo "📊 Container Status:"
docker compose ps

# Test the deployment
echo "🧪 Testing deployment..."
echo "Testing HTTP endpoint..."
curl -s -I http://localhost/api/health || echo "HTTP test failed"

echo "Testing HTTPS endpoint..."
curl -s -I -k https://localhost/api/health || echo "HTTPS test failed"

echo "🎉 Deployment complete!"
echo ""
echo "Your KCS Backend is now running with SSL support:"
echo "  - HTTP:  http://api.letscatchup-kcs.com/api/health"
echo "  - HTTPS: https://api.letscatchup-kcs.com/api/health"
echo ""
echo "📋 Next steps for Cloudflare:"
echo "1. Set SSL/TLS mode to 'Full' in Cloudflare dashboard"
echo "2. Ensure your domain points to this server's IP"
echo "3. Configure Cloudflare Origin CA certificates for production"
echo ""
echo "🔍 View logs with: docker compose logs -f"
