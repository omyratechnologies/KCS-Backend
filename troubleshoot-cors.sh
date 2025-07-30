#!/bin/bash

echo "🔧 KCS Backend CORS Troubleshooting Script"
echo "========================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Please copy .env.example to .env and configure it."
    echo "   cp .env.example .env"
    exit 1
fi

echo "✅ .env file found"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running! Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Test CORS configuration
echo ""
echo "🌐 Testing CORS Configuration"
echo "-----------------------------"

# Test with localhost:3000 (common React dev server)
echo "Testing CORS with localhost:3000..."
curl -s -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With,Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:4500/api/health

echo ""

# Test with localhost:5173 (Vite dev server)
echo "Testing CORS with localhost:5173..."
curl -s -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With,Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:4500/api/health

echo ""

# Check if backend is running
echo "🚀 Checking Backend Status"
echo "-------------------------"
response=$(curl -s http://localhost:4500/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running on port 4500"
    echo "Response: $response"
else
    echo "❌ Backend is not responding on port 4500"
    echo "Please run: bun run dev"
fi

# Check Socket.IO server
echo ""
echo "🔌 Checking Socket.IO Server"
echo "---------------------------"
nc -z localhost 4501 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Socket.IO server is running on port 4501"
else
    echo "❌ Socket.IO server is not running on port 4501"
fi

echo ""
echo "📋 Common Issues & Solutions:"
echo "1. CORS Error: Make sure your frontend URL is in the allowed origins list"
echo "2. Connection Refused: Check if backend is running with 'bun run dev'"
echo "3. Socket.IO Issues: Ensure port 4501 is not blocked by firewall"
echo "4. 502 Bad Gateway: Check if nginx is properly configured"
echo ""
echo "💡 Frontend URLs configured for CORS:"
echo "   - http://localhost:3000 (React)"
echo "   - http://localhost:5173 (Vite)"
echo "   - http://localhost:3001 (Alternative React)"
echo "   - https://dev.letscatchup-kcs.com"
echo "   - https://letscatchup-kcs.com"
