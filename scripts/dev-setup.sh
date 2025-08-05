#!/bin/bash

# Development Environment Setup Script
# This script sets up the KCS Backend development environment

set -e

echo "🚀 Setting up KCS Backend Development Environment"
echo "=================================================="

# Check if required tools are installed
echo "🔍 Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
else
    echo "✅ Bun is installed"
fi

# Create environment file if it doesn't exist
if [ ! -f .env.development ]; then
    echo "📄 Creating .env.development file..."
    cp .env.development.example .env.development
    echo "⚠️  Please update .env.development with your configuration"
else
    echo "✅ .env.development already exists"
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p logs uploads recordings nginx/dev

# Create nginx development configuration
if [ ! -f nginx/dev.conf ]; then
    echo "🌐 Creating nginx development configuration..."
    cat > nginx/dev.conf << 'EOF'
server {
    listen 80;
    server_name localhost;

    # Increase client max body size for file uploads
    client_max_body_size 50M;

    # Proxy to API server
    location /api {
        proxy_pass http://api-dev:4500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    # WebSocket proxy for Socket.IO
    location /socket.io {
        proxy_pass http://api-dev:4501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static files (if any)
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "Development server is running\n";
        add_header Content-Type text/plain;
    }
}
EOF
else
    echo "✅ nginx/dev.conf already exists"
fi

# Create Redis development configuration
if [ ! -f redis/redis-dev.conf ]; then
    echo "📊 Creating Redis development configuration..."
    mkdir -p redis
    cat > redis/redis-dev.conf << 'EOF'
# Redis Development Configuration
port 6379
bind 0.0.0.0
protected-mode no

# Memory settings
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
appendonly yes
appendfsync everysec

# Logging
loglevel notice
logfile ""

# Development settings
timeout 0
tcp-keepalive 300
EOF
else
    echo "✅ redis/redis-dev.conf already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Create development scripts in package.json if they don't exist
echo "🔧 Checking development scripts..."

# Add development scripts to package.json
node << 'EOF'
const fs = require('fs');
const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const devScripts = {
    "dev:docker": "docker-compose -f docker-compose.dev.yml up --build",
    "dev:docker:down": "docker-compose -f docker-compose.dev.yml down",
    "dev:docker:logs": "docker-compose -f docker-compose.dev.yml logs -f",
    "dev:setup": "./scripts/dev-setup.sh",
    "dev:clean": "docker-compose -f docker-compose.dev.yml down -v --remove-orphans",
    "lint:fix": "eslint . --ext .ts --fix"
};

let updated = false;
Object.entries(devScripts).forEach(([key, value]) => {
    if (!package.scripts[key]) {
        package.scripts[key] = value;
        updated = true;
    }
});

if (updated) {
    fs.writeFileSync('package.json', JSON.stringify(package, null, 4));
    console.log('✅ Added development scripts to package.json');
} else {
    console.log('✅ Development scripts already exist');
}
EOF

# Run initial linting fix
echo "🔧 Running initial lint fix..."
bun run lint:fix || echo "⚠️ Some linting issues need manual fixing"

# Build the application to check for compilation errors
echo "🏗️ Building application..."
bun run build

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update .env.development with your configuration"
echo "2. Start development environment: bun run dev:docker"
echo "3. View logs: bun run dev:docker:logs"
echo "4. Stop environment: bun run dev:docker:down"
echo ""
echo "🌐 Development URLs:"
echo "   - API: http://localhost:4500/api"
echo "   - Health: http://localhost:4500/api/health"
echo "   - Socket.IO: http://localhost:4501"
echo ""
echo "🔧 Useful commands:"
echo "   - View container logs: docker-compose -f docker-compose.dev.yml logs -f api-dev"
echo "   - Restart API only: docker-compose -f docker-compose.dev.yml restart api-dev"
echo "   - Clean everything: bun run dev:clean"
