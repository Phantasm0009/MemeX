#!/bin/bash

# 🌐 Setup Direct IP Backend Access for App Platform Dashboard
# This script configures the server to allow direct IP access to backend
# while keeping memexbot.xyz free for your App Platform dashboard

set -e

echo "🌐 Setting up direct IP backend access for App Platform..."

# Stop current nginx container (since we don't need it for this setup)
echo "🛑 Stopping nginx container to free up memexbot.xyz..."
docker stop memex-nginx-ultimate 2>/dev/null || true
docker rm memex-nginx-ultimate 2>/dev/null || true

# Expose backend directly on port 3001
echo "📦 Exposing backend container on port 3001..."

# Stop current backend container
docker stop memex-backend-ultimate-v3 2>/dev/null || true
docker rm memex-backend-ultimate-v3 2>/dev/null || true

# Start backend with port exposed
echo "🚀 Starting backend with direct IP access..."
docker run -d \
    --name memex-backend-ultimate-v3 \
    --network memex-network-ultimate-v3 \
    -p 3001:3001 \
    -v $(pwd):/app \
    -w /app \
    --env-file .env \
    --restart unless-stopped \
    node:20-alpine sh -c "cd backend && npm install && node server.js"

echo "⏳ Waiting for backend to start..."
sleep 10

# Test the direct IP access
SERVER_IP=$(curl -s ifconfig.me)
echo ""
echo "✅ Backend setup complete!"
echo ""
echo "🎯 Configuration:"
echo "   📊 Dashboard: memexbot.xyz (App Platform)"
echo "   🔧 Backend API: http://$SERVER_IP:3001"
echo ""
echo "📋 For your DigitalOcean App Platform dashboard:"
echo "   Environment Variable: BACKEND_URL=http://$SERVER_IP:3001"
echo ""
echo "🧪 Test endpoints:"
echo "   curl http://$SERVER_IP:3001/api/health"
echo "   curl http://$SERVER_IP:3001/api/market"
echo "   curl http://$SERVER_IP:3001/api/leaderboard"
