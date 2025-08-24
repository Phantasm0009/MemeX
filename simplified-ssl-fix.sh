#!/bin/bash

# 🔧 Simplified SSL Fix with Environment Variables Fix

echo "🔧 Simplified SSL fix with proper backend configuration..."

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker stop memex-nginx memex-backend 2>/dev/null || true
docker rm memex-nginx memex-backend 2>/dev/null || true

# Check if .env file exists and has the right backend URL
echo "🔍 Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Creating basic .env..."
    cat > .env << EOF
NODE_ENV=production
BACKEND_PORT=3001
BACKEND_URL=http://localhost:3001
EOF
fi

# Make sure backend URL points to localhost for health checks
echo "🔧 Ensuring proper backend URL configuration..."
if ! grep -q "BACKEND_URL.*localhost" .env; then
    echo "BACKEND_URL=http://localhost:3001" >> .env
fi

# Build backend image if not exists
echo "🏗️ Ensuring backend image exists..."
if ! docker images | grep -q "memexbot.*backend"; then
    echo "📦 Building backend image..."
    docker build -t memexbot_backend .
fi

# Start backend with simplified configuration
echo "🚀 Starting backend container..."
docker run -d \
  --name memex-backend \
  --network memexbot_memex-network \
  -p 3001:3001 \
  --env NODE_ENV=production \
  --env BACKEND_PORT=3001 \
  --env BACKEND_URL=http://localhost:3001 \
  --env-file .env \
  --restart unless-stopped \
  memexbot_backend:latest

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 15

# Test backend health multiple ways
echo "🏥 Testing backend health..."
for i in {1..10}; do
  echo "   Testing attempt $i/10..."
  
  # Test from inside container
  if docker exec memex-backend curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend responding inside container!"
    break
  fi
  
  # Test from host
  if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ Backend responding from host!"
    break
  fi
  
  if [ $i -eq 10 ]; then
    echo "❌ Backend health check failed. Checking logs..."
    docker logs memex-backend --tail 20
    echo "❌ Trying to continue anyway..."
  fi
  
  sleep 3
done

# Verify SSL certificates
echo "🔐 Checking SSL certificates..."
if [ ! -f "/etc/letsencrypt/live/api.memexbot.xyz/fullchain.pem" ]; then
    echo "❌ SSL certificates missing!"
    exit 1
fi

# Start nginx with fixed SSL config
echo "🌐 Starting SSL nginx..."
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
    echo "✅ Nginx configuration valid!"
else
    echo "❌ Nginx configuration error:"
    docker logs memex-nginx
fi

# Test endpoints
echo "🌐 Testing endpoints..."
sleep 3

echo "Testing local backend directly:"
curl -I http://localhost:3001/api/health || echo "Direct backend failed"

echo "Testing HTTP (should redirect to HTTPS):"
curl -I http://api.memexbot.xyz/api/health || echo "HTTP failed"

echo "Testing HTTPS:"
curl -I https://api.memexbot.xyz/api/health || echo "HTTPS failed"

echo "🎉 Deployment complete!"
echo "🔍 Check container status:"
docker ps | grep memex
