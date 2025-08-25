#!/bin/bash

# 🔧 Complete Discord Bot Backend URL Fix
# This script ensures the bot uses the correct container network backend URL

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Complete Discord Bot Backend URL Fix${NC}"
echo "========================================="

# Stop the Discord bot container completely
echo -e "${YELLOW}🛑 Stopping Discord bot container...${NC}"
docker stop memex-discord-bot-ultimate-v3

# Remove the container to start fresh
echo -e "${YELLOW}🗑️ Removing Discord bot container...${NC}"
docker rm memex-discord-bot-ultimate-v3

# Start a new Discord bot container with correct backend URL
echo -e "${YELLOW}🚀 Starting fresh Discord bot container...${NC}"

# Copy environment variables from host .env file
if [ -f ".env" ]; then
    echo -e "${BLUE}📋 Loading environment variables from host .env file...${NC}"
    source .env
else
    echo -e "${RED}❌ No .env file found on host! Please create one first.${NC}"
    exit 1
fi

docker run -d \
  --name memex-discord-bot-ultimate-v3 \
  --network memex-network-ultimate-v3 \
  -e BOT_TOKEN="$BOT_TOKEN" \
  -e CLIENT_ID="$CLIENT_ID" \
  -e GUILD_ID="$GUILD_ID" \
  -e MARKET_CHANNEL_ID="$MARKET_CHANNEL_ID" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  -e TWITTER_BEARER_TOKEN="$TWITTER_BEARER_TOKEN" \
  -e YOUTUBE_API_KEY="$YOUTUBE_API_KEY" \
  -e REDDIT_CLIENT_ID="$REDDIT_CLIENT_ID" \
  -e REDDIT_CLIENT_SECRET="$REDDIT_CLIENT_SECRET" \
  -e REDDIT_ACCESS_TOKEN="$REDDIT_ACCESS_TOKEN" \
  -e BOT_DEVELOPERS="$BOT_DEVELOPERS" \
  -e BACKEND_URL=http://memex-backend-ultimate-v3:3001 \
  node:20-alpine \
  sh -c "
    mkdir -p /app && cd /app
    echo '🔧 Installing git...'
    apk add --no-cache git curl
    echo '📥 Cloning repository...'
    git clone https://github.com/Phantasm0009/MemeX.git .
    echo '📦 Installing dependencies...'
    npm install --only=production
    echo '🔧 Setting environment variables...'
    cat > .env << 'ENV_EOF'
# Discord Bot Configuration - loaded from environment
BOT_TOKEN=\$BOT_TOKEN
CLIENT_ID=\$CLIENT_ID
GUILD_ID=\$GUILD_ID
MARKET_CHANNEL_ID=\$MARKET_CHANNEL_ID

# Server Configuration
NODE_ENV=production
BACKEND_PORT=3001
DASHBOARD_PORT=3002
BACKEND_URL=http://memex-backend-ultimate-v3:3001

# Database (Supabase - loaded from environment)
SUPABASE_URL=\$SUPABASE_URL
SUPABASE_ANON_KEY=\$SUPABASE_ANON_KEY

# API Keys for Real Trend Data - loaded from environment
TWITTER_BEARER_TOKEN=\$TWITTER_BEARER_TOKEN
YOUTUBE_API_KEY=\$YOUTUBE_API_KEY
REDDIT_CLIENT_ID=\$REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET=\$REDDIT_CLIENT_SECRET
REDDIT_ACCESS_TOKEN=\$REDDIT_ACCESS_TOKEN

# Bot Developer IDs - loaded from environment
BOT_DEVELOPERS=\$BOT_DEVELOPERS
ENV_EOF
    echo '🚀 Starting Discord bot...'
    node index.js
  "

echo -e "${YELLOW}⏳ Waiting 60 seconds for Discord bot to install and start...${NC}"
sleep 60

# Check if the Discord bot started successfully
echo -e "\n${BLUE}🔍 Checking Discord bot status...${NC}"
if docker logs --tail 10 memex-discord-bot-ultimate-v3 2>&1 | grep -q "Ready!"; then
    echo -e "${GREEN}✅ Discord bot is ready and online!${NC}"
elif docker logs --tail 10 memex-discord-bot-ultimate-v3 2>&1 | grep -q "Bot.*online\|✅.*Bot"; then
    echo -e "${GREEN}✅ Discord bot is connecting properly!${NC}"
else
    echo -e "${YELLOW}⚠️ Discord bot still starting up...${NC}"
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    docker logs --tail 5 memex-discord-bot-ultimate-v3
fi

# Test the backend connectivity from inside the Discord bot container
echo -e "\n${BLUE}🌐 Testing backend connectivity from Discord bot...${NC}"
if docker exec memex-discord-bot-ultimate-v3 curl -f -s http://memex-backend-ultimate-v3:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Discord bot can reach backend!${NC}"
else
    echo -e "${RED}❌ Discord bot cannot reach backend${NC}"
fi

echo -e "\n${GREEN}🎉 Complete fix finished!${NC}"
echo -e "${BLUE}🌐 Your API is working at: http://api.memexbot.xyz/api/health${NC}"
echo -e "${BLUE}🤖 Discord bot should now work with all backend commands${NC}"

echo -e "\n${BLUE}📊 Final container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "memex-.*-v3\|NAME"

echo -e "\n${BLUE}💡 Next steps:${NC}"
echo -e "${YELLOW}   1. Test /market command in Discord${NC}"
echo -e "${YELLOW}   2. Test /leaderboard command in Discord${NC}"
echo -e "${YELLOW}   3. Try other commands like /portfolio, /buy, /sell${NC}"
