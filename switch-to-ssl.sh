#!/bin/bash

# 🔒 Switch from System nginx to Docker nginx with SSL
# Run this script after SSL certificates are generated

set -e

echo "🔄 Switching to Docker nginx with SSL configuration..."

# Stop system nginx
echo "🛑 Stopping system nginx..."
sudo systemctl stop nginx
sudo systemctl disable nginx

# Update repository to get latest SSL config
echo "📥 Updating repository..."
git pull origin main

# Stop and remove existing Docker nginx container if it exists
echo "🧹 Cleaning up existing nginx container..."
docker stop memex-nginx 2>/dev/null || true
docker rm memex-nginx 2>/dev/null || true

# Start Docker nginx with SSL
echo "🐳 Starting Docker nginx with SSL..."
docker run -d \
  --name memex-nginx \
  --network memexbot_memex-network \
  -p 80:80 \
  -p 443:443 \
  -v $(pwd)/docker/nginx-ssl.conf:/etc/nginx/nginx.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /var/www/certbot:/var/www/certbot:ro \
  nginx:alpine

# Wait a moment for nginx to start
sleep 3

# Check nginx logs
echo "📋 Checking nginx logs..."
docker logs memex-nginx

# Test endpoints
echo "🧪 Testing HTTPS endpoint..."
curl -I https://api.memexbot.xyz/api/health

echo "🧪 Testing HTTP redirect..."
curl -I http://api.memexbot.xyz/api/health

echo "✅ SSL setup complete! Your API is now available at:"
echo "   🔒 https://api.memexbot.xyz"
echo "   📊 Backend health: https://api.memexbot.xyz/api/health"
echo "   📈 Market data: https://api.memexbot.xyz/api/market"
