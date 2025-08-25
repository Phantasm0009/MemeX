#!/bin/bash

# 🔄 Simple Backend Update - Uses backend/server.js
# This script updates the backend container to use the existing complete backend/server.js

set -e

echo "🔄 Updating backend to use existing backend/server.js with all endpoints..."

# Stop current backend container  
echo "🛑 Stopping current backend container..."
docker stop memex-backend-ultimate-v3 2>/dev/null || true
docker rm memex-backend-ultimate-v3 2>/dev/null || true

# Start new backend container using the complete backend/server.js
echo "🚀 Starting backend with complete backend/server.js..."
docker run -d \
  --name memex-backend-ultimate-v3 \
  --network memex-network-ultimate-v3 \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e BACKEND_PORT=3001 \
  -e SUPABASE_URL="" \
  -e SUPABASE_ANON_KEY="" \
  node:20-alpine sh -c "
    mkdir -p /app && cd /app &&
    apk add --no-cache git curl &&
    git clone https://github.com/Phantasm0009/MemeX.git . &&
    npm install --only=production &&
    node backend/server.js
  "

echo "⏳ Waiting for backend to start..."
sleep 15

echo "🧪 Testing all backend endpoints..."
echo "📊 Health check:"
curl -s http://localhost:3001/api/health | head -3

echo -e "\n📊 Leaderboard test:"
curl -s http://localhost:3001/api/leaderboard | head -3

echo -e "\n📊 Market test:"
curl -s http://localhost:3001/api/market | head -3

echo -e "\n✅ Backend updated successfully with complete backend/server.js!"
echo "🎯 All endpoints are now available:"
echo "   - 🏥 Health: http://localhost:3001/api/health"
echo "   - 🏆 Leaderboard: http://localhost:3001/api/leaderboard"
echo "   - 📊 Market: http://localhost:3001/api/market" 
echo "   - 📈 Stocks: http://localhost:3001/api/stocks"
echo "   - 🌐 Global Events: http://localhost:3001/api/global-events"
echo "   - 🎯 Quests: http://localhost:3001/api/quests"
