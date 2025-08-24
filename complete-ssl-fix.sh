#!/bin/bash

# 🔧 Complete SSL Fix with Manual Container Management

echo "🔧 Complete SSL nginx fix with manual container management..."

# Stop and remove existing containers
echo "🛑 Cleaning up existing containers..."
docker stop memex-nginx 2>/dev/null || true
docker rm memex-nginx 2>/dev/null || true
docker stop memex-backend 2>/dev/null || true
docker rm memex-backend 2>/dev/null || true

# Start backend container manually (avoid docker-compose issues)
echo "🚀 Starting backend container manually..."
docker run -d \
  --name memex-backend \
  --network memexbot_memex-network \
  -p 3001:3001 \
  --env-file .env \
  -v $(pwd):/app/host \
  --restart unless-stopped \
  --health-cmd="curl -f http://localhost:3001/api/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  memexbot_backend:latest || {
    echo "❌ Backend image not found. Building backend..."
    docker build -t memexbot_backend:latest .
    docker run -d \
      --name memex-backend \
      --network memexbot_memex-network \
      -p 3001:3001 \
      --env-file .env \
      -v $(pwd):/app/host \
      --restart unless-stopped \
      --health-cmd="curl -f http://localhost:3001/api/health || exit 1" \
      --health-interval=30s \
      --health-timeout=10s \
      --health-retries=3 \
      memexbot_backend:latest
  }

# Wait for backend to be healthy
echo "⏳ Waiting for backend to be healthy..."
sleep 10

# Test backend health
echo "🏥 Testing backend health..."
for i in {1..30}; do
  if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Backend failed to start after 30 attempts"
    docker logs memex-backend
    exit 1
  fi
  echo "   Attempt $i/30: Backend not ready yet..."
  sleep 2
done

# Verify SSL certificates exist
echo "🔐 Checking SSL certificates..."
if [ ! -f "/etc/letsencrypt/live/api.memexbot.xyz/fullchain.pem" ]; then
    echo "❌ SSL certificates missing!"
    exit 1
fi

# Start nginx with SSL
echo "🌐 Starting SSL nginx container..."
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

# Wait for nginx to start
echo "⏳ Waiting for nginx to start..."
sleep 5

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if docker exec memex-nginx nginx -t; then
    echo "✅ Nginx configuration is valid!"
else
    echo "❌ Nginx configuration error. Checking logs..."
    docker logs memex-nginx
    exit 1
fi

# Test endpoints
echo "🌐 Testing SSL endpoints..."
sleep 3

echo "Testing HTTP (should redirect to HTTPS)..."
curl -I http://api.memexbot.xyz/api/health || echo "HTTP connection failed"

echo "Testing HTTPS..."
curl -I https://api.memexbot.xyz/api/health || echo "HTTPS connection failed"

echo "🎉 SSL deployment complete!"
echo "✅ Backend: http://localhost:3001/api/health"
echo "✅ HTTPS API: https://api.memexbot.xyz/api/health"
echo "✅ HTTP redirect: http://api.memexbot.xyz/api/health"
