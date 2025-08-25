#!/bin/bash

# 🔄 Update Backend with Leaderboard Support
# This script updates the running backend container with the new leaderboard endpoints

set -e

echo "🔄 Updating backend container with leaderboard support..."

# Stop the current backend container
echo "🛑 Stopping current backend container..."
docker stop memex-backend-ultimate-v3 || true
docker rm memex-backend-ultimate-v3 || true

# Start new backend container with updated code
echo "🚀 Starting updated backend container..."
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
    node enhanced-backend-server.js
  "

echo "⏳ Waiting for backend to start..."
sleep 15

echo "🧪 Testing backend endpoints..."
echo "📊 Health check:"
curl -s http://localhost:3001/api/health | head -3

echo -e "\n📊 Leaderboard test:"
curl -s http://localhost:3001/api/leaderboard

echo -e "\n✅ Backend container updated successfully!"
echo "🔗 Backend running at: http://localhost:3001"
echo "🔗 Leaderboard: http://localhost:3001/api/leaderboard"
