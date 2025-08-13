#!/bin/bash

# KCS Backend Deployment Script with Disk Cleanup
# This script connects to the server and handles deployment issues

set -e

SERVER="ubuntu@65.2.31.97"
KEY_PATH="~/Downloads/kcs-dev.pem"

echo "🚀 Starting KCS Backend deployment process..."

# Function to execute commands on remote server
execute_remote() {
    ssh -i "$KEY_PATH" "$SERVER" "$1"
}

echo "📡 Connecting to server and checking disk space..."
execute_remote "df -h"

echo "🧹 Cleaning up Docker resources..."
execute_remote "
    echo 'Stopping all containers...'
    docker stop \$(docker ps -aq) 2>/dev/null || echo 'No containers to stop'
    
    echo 'Removing all containers...'
    docker rm \$(docker ps -aq) 2>/dev/null || echo 'No containers to remove'
    
    echo 'Removing unused Docker resources...'
    docker system prune -af --volumes
    
    echo 'Cleaning Docker build cache...'
    docker builder prune -af
"

echo "🧹 Cleaning system packages..."
execute_remote "
    echo 'Cleaning apt cache...'
    sudo apt clean
    sudo apt autoclean
    sudo apt autoremove -y
    
    echo 'Cleaning journal logs...'
    sudo journalctl --vacuum-time=3d
    
    echo 'Removing temporary files...'
    sudo rm -rf /tmp/*
    sudo rm -rf /var/tmp/*
"

echo "📊 Checking disk space after cleanup..."
execute_remote "df -h"

echo "🔄 Pulling latest code..."
execute_remote "
    cd ~/KCS-Backend
    git fetch origin
    git reset --hard origin/main
    git pull origin main
"

echo "📦 Installing dependencies..."
execute_remote "
    cd ~/KCS-Backend
    bun install --production
"

echo "🐳 Building and deploying with Docker..."
execute_remote "
    cd ~/KCS-Backend
    docker compose down || true
    docker compose build --no-cache
    docker compose up -d
"

echo "✅ Deployment completed successfully!"
echo "🔍 Checking service status..."
execute_remote "
    cd ~/KCS-Backend
    docker compose ps
    docker compose logs --tail=50
"

echo "🌐 Service should be available at: http://65.2.31.97:4500"
