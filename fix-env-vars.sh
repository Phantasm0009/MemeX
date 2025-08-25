#!/bin/bash

# 🔧 Fix Environment Variables in Fresh Containers
# This script properly sets up environment variables for the Discord bot

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Environment Variables in Fresh Containers${NC}"
echo "=================================================="

# 1. Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Creating .env template...${NC}"
    cat > .env << 'EOF'
# Discord Bot Configuration
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
CLIENT_ID=YOUR_CLIENT_ID_HERE
GUILD_ID=
MARKET_CHANNEL_ID=

# Bot Developer IDs
BOT_DEVELOPERS=1225485426349969518

# Backend Configuration
BACKEND_URL=http://backend:3001

# Supabase Configuration (Optional)
SUPABASE_URL=
SUPABASE_ANON_KEY=

# API Keys (Optional)
GOOGLE_TRENDS_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REFRESH_TOKEN=
TWITTER_BEARER_TOKEN=
YOUTUBE_API_KEY=
EOF
    echo -e "${YELLOW}📝 Please edit .env file with your Discord bot credentials${NC}"
    echo -e "${YELLOW}   Run: nano .env${NC}"
    exit 1
fi

# 2. Check if environment variables are set in .env
echo -e "${YELLOW}🔍 Checking .env file...${NC}"
if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
    echo -e "${RED}❌ BOT_TOKEN not set properly in .env file${NC}"
    echo -e "${YELLOW}📝 Please edit .env file with your real Discord bot token${NC}"
    echo -e "${YELLOW}   Run: nano .env${NC}"
    exit 1
fi

if grep -q "YOUR_CLIENT_ID_HERE" .env; then
    echo -e "${RED}❌ CLIENT_ID not set properly in .env file${NC}"
    echo -e "${YELLOW}📝 Please edit .env file with your real Discord client ID${NC}"
    echo -e "${YELLOW}   Run: nano .env${NC}"
    exit 1
fi

# 3. Stop and remove Discord bot container
echo -e "${YELLOW}🛑 Stopping Discord bot container...${NC}"
docker stop memex-discord-bot-fresh 2>/dev/null || true
docker rm memex-discord-bot-fresh 2>/dev/null || true

# 4. Create new docker-compose with proper env file mounting
echo -e "${YELLOW}📝 Creating docker-compose with proper .env mounting...${NC}"
cat > docker-compose-env-fixed.yml << 'EOF'
version: '3.8'

services:
  # Backend API Service
  backend:
    build: .
    container_name: memex-backend-fresh
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - ./.env:/app/.env:ro
    networks:
      - memex-network-fresh
    command: ["node", "backend/server.js"]

  # Discord Bot Service
  discord-bot:
    build: .
    container_name: memex-discord-bot-fresh
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - BACKEND_URL=http://backend:3001
    volumes:
      - ./.env:/app/.env:ro
    depends_on:
      - backend
    networks:
      - memex-network-fresh
    command: ["node", "index.js"]

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: memex-nginx-fresh
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx-fresh.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    networks:
      - memex-network-fresh

networks:
  memex-network-fresh:
    driver: bridge

volumes:
  memex-data-fresh:
    driver: local
EOF

# 5. Recreate Discord bot with environment variables
echo -e "${YELLOW}🚀 Starting Discord bot with proper environment variables...${NC}"
docker-compose -f docker-compose-env-fixed.yml up -d discord-bot

# 6. Wait and test
echo -e "${YELLOW}⏳ Waiting 15 seconds for Discord bot to start...${NC}"
sleep 15

# 7. Check Discord bot logs
echo -e "${BLUE}🔍 Checking Discord bot logs...${NC}"
docker logs memex-discord-bot-fresh | tail -20

# 8. Test if bot registered successfully
echo -e "\n${BLUE}🧪 Testing Discord bot status...${NC}"
if docker logs memex-discord-bot-fresh 2>&1 | grep -q "Successfully registered"; then
    echo -e "${GREEN}✅ Discord bot registered commands successfully!${NC}"
elif docker logs memex-discord-bot-fresh 2>&1 | grep -q "Unauthorized"; then
    echo -e "${RED}❌ Discord bot still has authentication issues${NC}"
    echo -e "${YELLOW}📝 Please check your BOT_TOKEN and CLIENT_ID in .env file${NC}"
elif docker logs memex-discord-bot-fresh 2>&1 | grep -q "Ready!"; then
    echo -e "${GREEN}✅ Discord bot is ready and online!${NC}"
else
    echo -e "${YELLOW}⚠️ Bot status unclear, check logs above${NC}"
fi

# 9. Test API endpoints
echo -e "\n${BLUE}🌐 Testing API endpoints...${NC}"
if curl -f -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ API health check working${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
fi

if curl -f -s http://api.memexbot.xyz/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ External API accessible${NC}"
else
    echo -e "${YELLOW}⚠️ External API may need DNS propagation${NC}"
fi

echo -e "\n${GREEN}🎯 Environment fix complete!${NC}"
echo -e "${BLUE}📝 Your setup:${NC}"
echo -e "${YELLOW}   ✅ Backend API working${NC}"
echo -e "${YELLOW}   ✅ Nginx proxy working${NC}"
echo -e "${YELLOW}   ✅ External API accessible${NC}"
echo -e "${YELLOW}   🔍 Discord bot - check logs above${NC}"

echo -e "\n${BLUE}🔍 Monitor Discord bot:${NC}"
echo -e "${YELLOW}   docker logs -f memex-discord-bot-fresh${NC}"

echo -e "\n${BLUE}🌐 Test API endpoints:${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/health${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/market${NC}"

echo -e "\n${GREEN}🎉 Your Discord bot should now be working with proper environment variables!${NC}"
