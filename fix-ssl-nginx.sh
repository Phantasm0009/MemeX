#!/bin/bash

# 🔧 Quick Fix for SSL nginx container issue

echo "🔧 Fixing SSL nginx container issue..."

# Stop and remove existing container
echo "🛑 Stopping existing container..."
docker stop memex-nginx 2>/dev/null || true
docker rm memex-nginx 2>/dev/null || true

# Check if backend is running
echo "🔍 Checking backend status..."
if ! curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "❌ Backend not responding. Starting backend first..."
    cd /var/www/memexbot
    docker-compose up -d backend
    sleep 5
fi

# Verify SSL certificates exist
echo "🔐 Checking SSL certificates..."
if [ ! -f "/etc/letsencrypt/live/api.memexbot.xyz/fullchain.pem" ]; then
    echo "❌ SSL certificates missing. Please regenerate them."
    exit 1
fi

# Create nginx container with proper error handling
echo "🚀 Starting SSL nginx container..."
docker run -d \
  --name memex-nginx \
  --network memexbot_memex-network \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/docker/nginx-ssl.conf:/etc/nginx/nginx.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /var/www/certbot:/var/www/certbot:ro \
  --restart unless-stopped \
  nginx:alpine

# Wait for container to start
sleep 3

# Check if container is running
if docker ps | grep -q memex-nginx; then
    echo "✅ SSL nginx container started successfully"
    
    # Test nginx configuration
    echo "🧪 Testing nginx configuration..."
    docker exec memex-nginx nginx -t
    
    # Test endpoints
    echo "🌐 Testing endpoints..."
    sleep 2
    curl -I http://api.memexbot.xyz/api/health || echo "HTTP test failed"
    curl -I https://api.memexbot.xyz/api/health || echo "HTTPS test failed"
else
    echo "❌ Container failed to start. Checking logs..."
    docker logs memex-nginx
fi
