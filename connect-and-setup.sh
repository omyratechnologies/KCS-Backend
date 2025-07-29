#!/bin/bash

# 🚀 Quick Server Connection and Setup Script
# Usage: ./connect-and-setup.sh

echo "🎪 Connecting to KCS Production Server..."
echo "📍 Server: 3.6.186.159"
echo "🔑 Using key: KCS-key.pem"
echo ""

# SSH connection with automatic script execution
ssh -i ~/Downloads/KCS-key.pem ec2-user@3.6.186.159 << 'ENDSSH'

# Banner
echo "🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪"
echo "🎪     Connected to KCS Production Server                 🎪"
echo "🎪     Setting up WebRTC Video Conferencing System       🎪"
echo "🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪🎪"
echo ""

# Update system first
echo "🔄 Updating system..."
sudo yum update -y

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo yum install -y git
fi

# Clone or update repository
if [ -d "KCS-Backend" ]; then
    echo "🔄 Repository exists, pulling latest changes..."
    cd KCS-Backend
    git pull origin main
else
    echo "📥 Cloning KCS Backend repository..."
    git clone https://github.com/omyratechnologies/KCS-Backend.git
    cd KCS-Backend
fi

# Make setup script executable and run it
chmod +x server-setup.sh
echo "🚀 Running WebRTC Video Conferencing setup..."
./server-setup.sh

echo ""
echo "🎉 Setup completed! Keeping connection open for management..."
echo "💡 Type 'exit' to disconnect, or use these commands:"
echo "   📊 sudo docker-compose ps      - View service status"
echo "   📝 sudo docker-compose logs -f - View live logs"
echo "   🔄 sudo docker-compose restart - Restart services"
echo ""

# Keep connection open for management
bash

ENDSSH
