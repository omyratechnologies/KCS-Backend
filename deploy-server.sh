#!/bin/bash

echo "🚀 KCS Backend Server Deployment Script"
echo "======================================="

# Server connection details
SERVER_KEY="~/Downloads/KCS-key.pem"
SERVER_USER="ec2-user"
SERVER_IP="3.6.186.159"
PROJECT_PATH="kcs-backend/KCS-Backend"

echo "📡 Connecting to server: $SERVER_IP"
echo "📁 Project path: $PROJECT_PATH"
echo ""

# Check if key file exists
if [ ! -f "$SERVER_KEY" ]; then
    echo "❌ SSH key not found at $SERVER_KEY"
    echo "Please ensure the KCS-key.pem file is in your Downloads folder"
    exit 1
fi

echo "✅ SSH key found"

# Connect to server and deploy
echo "🔄 Deploying latest changes..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" << 'EOF'
    set -e
    
    echo "📍 Current directory: $(pwd)"
    echo "🔄 Navigating to project directory..."
    cd kcs-backend/KCS-Backend/
    
    echo "📥 Pulling latest changes from git..."
    git fetch origin
    git status
    git pull origin main
    
    echo "🛑 Stopping containers..."
    docker compose down
    
    echo "🔨 Building containers with latest changes..."
    docker compose build --no-cache
    
    echo "🚀 Starting containers..."
    docker compose up -d
    
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    echo "🔍 Checking container status..."
    docker compose ps
    
    echo "📊 Checking service health..."
    echo "Testing API health endpoint..."
    curl -s http://localhost:4500/health || echo "API not ready yet"
    
    echo "Testing Socket.IO server..."
    curl -s http://localhost:4501/socket.io/ || echo "Socket.IO not ready yet"
    
    echo ""
    echo "✅ Deployment completed!"
    echo "🌐 Your backend should now be running with CORS fixes"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test your frontend connection"
    echo "2. Check logs if needed: docker compose logs -f"
    echo "3. Monitor with: docker compose ps"
EOF

echo ""
echo "🎉 Server deployment completed!"
echo ""
echo "💡 To check logs remotely:"
echo "ssh -i $SERVER_KEY $SERVER_USER@$SERVER_IP 'cd $PROJECT_PATH && docker compose logs -f'"
echo ""
echo "💡 To check container status:"
echo "ssh -i $SERVER_KEY $SERVER_USER@$SERVER_IP 'cd $PROJECT_PATH && docker compose ps'"
