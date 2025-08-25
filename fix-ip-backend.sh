#!/bin/bash

# 🔧 Fix IP Backend Access
# This script fixes the backend container to ensure it's accessible via IP

set -e

echo "🔧 Fixing IP backend access..."

# Check current containers
echo "📋 Current container status:"
docker ps -a | grep memex || echo "No memex containers found"

# Stop any existing backend containers
echo "🛑 Stopping any existing backend containers..."
docker stop memex-backend-ultimate-v3 2>/dev/null || true
docker rm memex-backend-ultimate-v3 2>/dev/null || true

# Ensure network exists
echo "🌐 Ensuring network exists..."
docker network create memex-network-ultimate-v3 2>/dev/null || true

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Creating minimal .env..."
    cat > .env << EOF
BOT_TOKEN=${BOT_TOKEN:-}
CLIENT_ID=${CLIENT_ID:-}
BACKEND_URL=http://memex-backend-ultimate-v3:3001
EOF
fi

# Start backend with better error handling
echo "🚀 Starting backend container with IP access..."
docker run -d \
    --name memex-backend-ultimate-v3 \
    --network memex-network-ultimate-v3 \
    -p 0.0.0.0:3001:3001 \
    -v $(pwd):/app \
    -w /app \
    --env-file .env \
    --restart unless-stopped \
    node:20-alpine sh -c "
        echo '🔍 Starting backend setup...'
        cd backend || { echo '❌ backend directory not found'; ls -la; exit 1; }
        echo '📦 Installing dependencies...'
        npm install --production || { echo '❌ npm install failed'; exit 1; }
        echo '🚀 Starting server...'
        node server.js || { echo '❌ server start failed'; exit 1; }
    "

echo "⏳ Waiting for backend to start..."
sleep 15

# Check container logs
echo "📋 Container logs:"
docker logs memex-backend-ultimate-v3 --tail 10

# Test local connection first
echo "🧪 Testing local connection..."
curl -s http://localhost:3001/api/health || echo "❌ Local test failed"

# Get server IP and test external connection
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "157.245.190.204")
echo "🧪 Testing external connection..."
curl -s http://$SERVER_IP:3001/api/health || echo "❌ External test failed"

echo ""
echo "✅ Fix script complete!"
echo ""
echo "🎯 Configuration:"
echo "   📊 Dashboard: memexbot.xyz (App Platform)"
echo "   🔧 Backend API: http://$SERVER_IP:3001"
echo ""
echo "📋 For your DigitalOcean App Platform dashboard:"
echo "   Environment Variable: BACKEND_URL=http://$SERVER_IP:3001"
echo ""
echo "🧪 Test commands:"
echo "   curl http://$SERVER_IP:3001/api/health"
echo "   curl http://$SERVER_IP:3001/api/market"
echo "   curl http://$SERVER_IP:3001/api/leaderboard"
