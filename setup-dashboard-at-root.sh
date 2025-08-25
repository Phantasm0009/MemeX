#!/bin/bash

# 🌐 Setup memexbot.xyz with Dashboard + API
# This script configures nginx to serve dashboard at memexbot.xyz and API at api.memexbot.xyz

set -e

echo "🌐 Setting up memexbot.xyz with dashboard and API..."

# Stop current nginx container
echo "🛑 Stopping current nginx container..."
docker stop memex-nginx-ultimate 2>/dev/null || true
docker rm memex-nginx-ultimate 2>/dev/null || true

# Start dashboard container (if not running)
if ! docker ps | grep -q memex-dashboard; then
    echo "📊 Starting dashboard container..."
    docker run -d \
        --name memex-dashboard \
        --network memex-network-ultimate-v3 \
        -v $(pwd)/dashboard:/app \
        -w /app \
        --restart unless-stopped \
        node:20-alpine sh -c "npm install && npm start"
    
    echo "⏳ Waiting for dashboard to start..."
    sleep 10
fi

# Create nginx container with dashboard + API configuration
echo "📦 Creating nginx container with dashboard support..."
docker run -d \
    --name memex-nginx-ultimate \
    --network memex-network-ultimate-v3 \
    -p 80:80 \
    -v $(pwd)/docker/nginx-with-dashboard.conf:/etc/nginx/nginx.conf:ro \
    --restart unless-stopped \
    nginx:alpine
    
echo "✅ Nginx container created and running with dashboard support"

echo ""
echo "🎯 Services should now be accessible at:"
echo "   📊 Dashboard: http://memexbot.xyz"
echo "   🔧 API: http://api.memexbot.xyz/api/health"
echo "   📈 Market: http://api.memexbot.xyz/api/market"
echo ""
echo "🔗 Architecture:"
echo "   memexbot.xyz → Dashboard (port 3002)"
echo "   api.memexbot.xyz → Backend API (port 3001)"
