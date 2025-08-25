#!/bin/bash

# 🌐 Setup api.memexbot.xyz domain for backend access
# This script configures nginx to expose the backend at api.memexbot.xyz

set -e

echo "🌐 Setting up api.memexbot.xyz domain access..."

# Check if nginx container exists, if not create it
if ! docker ps -a | grep -q memex-nginx-ultimate; then
    echo "📦 Creating nginx container for api.memexbot.xyz..."
    
    # Create nginx container with the API configuration
    docker run -d \
        --name memex-nginx-ultimate \
        --network memex-network-ultimate-v3 \
        -p 80:80 \
        -v $(pwd)/docker/nginx-api-domain.conf:/etc/nginx/nginx.conf:ro \
        --restart unless-stopped \
        nginx:alpine
        
    echo "✅ Nginx container created and running"
else
    echo "♻️ Restarting existing nginx container..."
    docker restart memex-nginx-ultimate
fi

echo ""
echo "🎯 Backend API should now be accessible at:"
echo "   http://api.memexbot.xyz/api/health"
echo "   http://api.memexbot.xyz/api/market"
echo "   http://api.memexbot.xyz/api/leaderboard"
echo ""
echo "📊 For DigitalOcean App Platform Dashboard, use:"
echo "   BACKEND_URL=http://api.memexbot.xyz"
