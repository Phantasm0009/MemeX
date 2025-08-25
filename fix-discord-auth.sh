#!/bin/bash

# 🔧 Fix Discord Bot Authentication Issues
# This script fixes Discord bot token and authentication problems

set -e

echo "🔧 Fixing Discord bot authentication..."

# Check current container status
echo "📋 Current Discord bot container status:"
docker ps -a | grep discord-bot || echo "No Discord bot container found"

# Stop current Discord bot container
echo "🛑 Stopping Discord bot container..."
docker stop memex-discord-bot-ultimate-v3 2>/dev/null || true
docker rm memex-discord-bot-ultimate-v3 2>/dev/null || true

# Check if .env file exists and show relevant values (masked)
echo "🔍 Checking environment variables..."
if [ -f .env ]; then
    echo "✅ .env file exists"
    # Show masked versions for verification
    if grep -q "BOT_TOKEN=" .env; then
        TOKEN_LENGTH=$(grep "BOT_TOKEN=" .env | cut -d'=' -f2 | wc -c)
        echo "   - BOT_TOKEN: Found (length: $TOKEN_LENGTH)"
    else
        echo "   - BOT_TOKEN: ❌ Missing"
    fi
    
    if grep -q "CLIENT_ID=" .env; then
        CLIENT_LENGTH=$(grep "CLIENT_ID=" .env | cut -d'=' -f2 | wc -c)
        echo "   - CLIENT_ID: Found (length: $CLIENT_LENGTH)"
    else
        echo "   - CLIENT_ID: ❌ Missing"
    fi
else
    echo "❌ .env file not found!"
    exit 1
fi

# Ensure network exists
echo "🌐 Ensuring Docker network exists..."
docker network create memex-network-ultimate-v3 2>/dev/null || true

# Start Discord bot with fresh container and explicit environment loading
echo "🚀 Starting Discord bot with fresh authentication..."
docker run -d \
    --name memex-discord-bot-ultimate-v3 \
    --network memex-network-ultimate-v3 \
    -v $(pwd):/app \
    -w /app \
    --env-file .env \
    -e BACKEND_URL=http://memex-backend-ultimate-v3:3001 \
    --restart unless-stopped \
    node:20-alpine sh -c "
        echo '🔍 Starting Discord bot setup...'
        echo '🔍 Checking environment variables...'
        if [ -z \"\$BOT_TOKEN\" ]; then
            echo '❌ BOT_TOKEN not found in environment'
            exit 1
        fi
        if [ -z \"\$CLIENT_ID\" ]; then
            echo '❌ CLIENT_ID not found in environment'
            exit 1
        fi
        echo '✅ Discord credentials found'
        echo '📦 Installing dependencies...'
        npm install --production || { echo '❌ npm install failed'; exit 1; }
        echo '🚀 Starting Discord bot...'
        node index.js || { echo '❌ Discord bot start failed'; exit 1; }
    "

echo "⏳ Waiting for Discord bot to start..."
sleep 10

# Check container logs
echo "📋 Discord bot container logs:"
docker logs memex-discord-bot-ultimate-v3 --tail 15

echo ""
echo "✅ Discord bot restart complete!"
echo ""
echo "🧪 If bot still fails to authenticate:"
echo "   1. Check Discord Developer Portal for your application"
echo "   2. Verify BOT_TOKEN and CLIENT_ID match"
echo "   3. Regenerate bot token if needed"
echo "   4. Ensure bot has proper permissions in server"
