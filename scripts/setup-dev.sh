#!/bin/bash

# Local Docker Development Setup for KCS Backend
# This script sets up the development environment locally

set -e

echo "🚀 Setting up KCS Backend for local development..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Create development environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating local environment file..."
    cat > .env.local << 'EOF'
NODE_ENV=development
PORT=4500

# JWT Configuration
JWT_SECRET=dev-jwt-secret-change-in-production

# Local Couchbase Configuration (Docker)
OTTOMAN_BUCKET_NAME=kcs_lms_dev
OTTOMAN_USERNAME=Administrator
OTTOMAN_PASSWORD=password
OTTOMAN_CONNECTION_STRING=couchbase://localhost:8091

# Local Redis Configuration
REDIS_URI=redis://localhost:6379

# AWS Configuration (for S3/SES - use your actual credentials)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_ACCESS_SECRET_KEY=your-aws-secret-key
AWS_REGION=ap-south-1

# Email Configuration (for development - use your SMTP)
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
EMAIL_USER=test@example.com
EMAIL_PASS=password

# R2/S3 Configuration (optional for development)
R2_BUCKET=kcs-dev-bucket
R2_ENDPOINT=https://your-r2-endpoint
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_URL=https://your-bucket-url

# MediaSoup Configuration
MEDIASOUP_LISTEN_IP=127.0.0.1
MEDIASOUP_ANNOUNCED_IP=127.0.0.1
SOCKET_IO_PORT=4501
EOF

    echo "✅ Created .env.local - Please update with your actual credentials"
fi

# Create development Docker Compose file
if [ ! -f docker-compose.dev.yml ]; then
    echo "🐳 Creating development Docker Compose file..."
    cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  couchbase:
    image: couchbase:enterprise-7.2.4
    container_name: kcs-couchbase-dev
    ports:
      - "8091-8096:8091-8096"
      - "11210:11210"
    environment:
      - CLUSTER_NAME=kcs-dev-cluster
      - COUCHBASE_ADMINISTRATOR_USERNAME=Administrator
      - COUCHBASE_ADMINISTRATOR_PASSWORD=password
      - COUCHBASE_BUCKET=kcs_lms_dev
      - COUCHBASE_BUCKET_RAMSIZE=512
    volumes:
      - couchbase_dev_data:/opt/couchbase/var
      - ./scripts/init-couchbase-dev.sh:/docker-entrypoint-initdb.d/init-couchbase.sh:ro
    networks:
      - kcs-dev-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8091/pools/default"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  redis:
    image: redis:7-alpine
    container_name: kcs-redis-dev
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_dev_data:/data
    networks:
      - kcs-dev-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3

  mailhog:
    image: mailhog/mailhog
    container_name: kcs-mailhog-dev
    ports:
      - "1025:1025"  # SMTP server
      - "8025:8025"  # Web UI
    networks:
      - kcs-dev-network

volumes:
  couchbase_dev_data:
    driver: local
  redis_dev_data:
    driver: local

networks:
  kcs-dev-network:
    driver: bridge
EOF

    echo "✅ Created docker-compose.dev.yml"
fi

# Create Couchbase initialization script for development
if [ ! -f scripts/init-couchbase-dev.sh ]; then
    mkdir -p scripts
    echo "📝 Creating Couchbase initialization script..."
    cat > scripts/init-couchbase-dev.sh << 'EOF'
#!/bin/bash
set -e

echo "Waiting for Couchbase to start..."
sleep 30

# Initialize cluster
/opt/couchbase/bin/couchbase-cli cluster-init \
  --cluster localhost:8091 \
  --cluster-username Administrator \
  --cluster-password password \
  --cluster-ramsize 512 \
  --cluster-index-ramsize 256 \
  --services data,index,query

# Create development bucket
/opt/couchbase/bin/couchbase-cli bucket-create \
  --cluster localhost:8091 \
  --username Administrator \
  --password password \
  --bucket kcs_lms_dev \
  --bucket-type couchbase \
  --bucket-ramsize 512

echo "Couchbase development setup complete"
EOF

    chmod +x scripts/init-couchbase-dev.sh
    echo "✅ Created Couchbase initialization script"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Start development services
echo "🐳 Starting development services..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 60

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.dev.yml ps

# Run database migrations/setup
echo "🗄️ Setting up database..."
# Note: You might need to add actual migration commands here
# bun run migrate:dev or similar

echo "✅ Development environment setup complete!"
echo ""
echo "🎉 Your development environment is ready!"
echo ""
echo "Available services:"
echo "- Couchbase Admin: http://localhost:8091 (Administrator/password)"
echo "- Redis: localhost:6379"
echo "- MailHog UI: http://localhost:8025"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your actual AWS credentials"
echo "2. Start the development server: bun run dev"
echo "3. Access your API at: http://localhost:4500"
echo ""
echo "Useful commands:"
echo "- Start dev server: bun run dev"
echo "- Run tests: bun run test"
echo "- View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "- Stop services: docker-compose -f docker-compose.dev.yml down"
echo "- Reset data: docker-compose -f docker-compose.dev.yml down -v"
EOF

    chmod +x scripts/setup-dev.sh
    echo "✅ Created development setup script"
fi

# Make the script executable
chmod +x scripts/setup-dev.sh

echo "🎯 Setup script created successfully!"
echo ""
echo "To set up your development environment, run:"
echo "  ./scripts/setup-dev.sh"
