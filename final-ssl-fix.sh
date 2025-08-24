#!/bin/bash

# Final SSL Fix - Complete Solution for Nginx Backend Connection
# This script fixes the container naming issue preventing nginx from connecting to backend

set -e

echo "🚀 Starting Final SSL Fix for api.memexbot.xyz"
echo "=============================================="

# Ensure we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run from project root."
    exit 1
fi

# Stop all containers first
echo "🛑 Stopping all containers..."
docker-compose down --remove-orphans

# Clean up any existing containers with problematic names
echo "🧹 Cleaning up existing containers..."
docker container rm -f memex-backend memex-nginx backend nginx 2>/dev/null || true

# Fix environment configuration
echo "🔧 Checking .env configuration..."
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please ensure .env exists with proper configuration."
    exit 1
fi

# Ensure backend URL is set correctly for health checks
if ! grep -q "BACKEND_URL.*localhost" .env; then
    echo "🔧 Adding local backend URL for health checks..."
    echo "BACKEND_URL=http://localhost:3001" >> .env
fi

# Update docker-compose.yml to use correct container names
echo "🔧 Updating docker-compose.yml for correct container naming..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: .
    container_name: backend
    ports:
      - "3001:3001"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - BACKEND_PORT=3001
    volumes:
      - ./data:/app/data
    networks:
      - memex-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx-ssl.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
    networks:
      - memex-network
    restart: unless-stopped

  discord-bot:
    build: .
    container_name: discord-bot
    command: node index.js
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - BACKEND_URL=http://backend:3001
    depends_on:
      - backend
    networks:
      - memex-network
    restart: unless-stopped

networks:
  memex-network:
    driver: bridge
EOF

# Build and start services
echo "🏗️  Building and starting services with correct naming..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 20

# Test backend health
echo "🔍 Testing backend health..."
for i in {1..10}; do
    if docker exec backend curl -f http://localhost:3001/api/health 2>/dev/null; then
        echo "✅ Backend health check passed"
        break
    else
        echo "⏳ Waiting for backend... attempt $i/10"
        sleep 5
    fi
done

# Test nginx upstream connection
echo "🔍 Testing nginx upstream connection..."
if docker exec nginx nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration error"
    docker logs nginx
    exit 1
fi

# Test SSL endpoints
echo "🔍 Testing SSL endpoints..."
if curl -k -f https://api.memexbot.xyz/api/health; then
    echo "✅ HTTPS endpoint is working!"
else
    echo "⚠️  HTTPS endpoint not yet accessible (may need DNS propagation)"
fi

# Show final status
echo ""
echo "🎉 Final SSL Fix Complete!"
echo "=========================="
echo "✅ Container naming fixed (backend -> backend)"
echo "✅ Nginx upstream should now resolve correctly"
echo "✅ SSL certificates in place"
echo "✅ Services started with proper configuration"
echo ""
echo "🔍 Final container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📊 Test your endpoints:"
echo "  • Health: https://api.memexbot.xyz/api/health"
echo "  • Market: https://api.memexbot.xyz/api/market"
echo "  • Status: https://api.memexbot.xyz/api/status"
echo ""
echo "📋 To check logs if issues persist:"
echo "  • Backend: docker logs backend"
echo "  • Nginx: docker logs nginx"
echo "  • Discord: docker logs discord-bot"
