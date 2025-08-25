#!/bin/bash

# 🔧 Manual Discord Bot Fix - Run Bot Outside Docker
# This runs the Discord bot directly on the server without Docker

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Manual Discord Bot Fix - Direct Execution${NC}"
echo "============================================="

# Step 1: Stop Docker Discord bot
echo -e "${YELLOW}🛑 Stopping Docker Discord bot...${NC}"
docker-compose stop discord-bot || true

# Step 2: Set environment variables for direct execution
echo -e "${YELLOW}📝 Setting up environment for direct execution...${NC}"

# Create a temporary .env file for manual execution
cat > .env.manual << EOF
NODE_ENV=production
BOT_TOKEN=${BOT_TOKEN}
CLIENT_ID=${CLIENT_ID}
GUILD_ID=${GUILD_ID}
MARKET_CHANNEL_ID=${MARKET_CHANNEL_ID}
BOT_DEVELOPERS=${BOT_DEVELOPERS}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
BACKEND_URL=http://localhost:3001
TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID}
REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET}
REDDIT_REFRESH_TOKEN=${REDDIT_REFRESH_TOKEN}
EOF

echo -e "${GREEN}✅ Environment configured for localhost backend${NC}"

# Step 3: Test if backend is accessible on localhost
echo -e "${YELLOW}🧪 Testing backend on localhost:3001...${NC}"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend accessible on localhost:3001${NC}"
    curl -s http://localhost:3001/api/health | head -n 3
else
    echo -e "${RED}❌ Backend NOT accessible on localhost:3001${NC}"
    echo -e "${YELLOW}📝 Backend container status:${NC}"
    docker-compose ps backend
fi

# Step 4: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo -e "\n${GREEN}🎯 Manual setup complete!${NC}"
echo -e "${YELLOW}📝 To run Discord bot manually:${NC}"
echo "1. source .env.manual"
echo "2. node index.js"
echo ""
echo -e "${YELLOW}📝 Or run this one-liner:${NC}"
echo "export \$(cat .env.manual | xargs) && node index.js"
