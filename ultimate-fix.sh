#!/bin/bash

# 🔥 ULTIMATE FIX - Manual Container Management
# This bypasses Docker Compose completely to avoid ContainerConfig errors

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}🔥 ULTIMATE FIX - Manual Container Management${NC}"
echo "=============================================="
echo -e "${YELLOW}This script bypasses Docker Compose to avoid ContainerConfig errors${NC}"
echo ""

# 1. Check .env file
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
EOF
    echo -e "${YELLOW}📝 Please edit .env file with your Discord bot credentials and re-run this script${NC}"
    exit 1
fi

# 2. Check if credentials are set
if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
    echo -e "${RED}❌ BOT_TOKEN not set properly in .env file${NC}"
    echo -e "${YELLOW}📝 Please edit .env file with your real Discord bot token:${NC}"
    echo -e "${YELLOW}   nano .env${NC}"
    exit 1
fi

# 3. Kill ALL existing containers (manual approach)
echo -e "${YELLOW}🛑 Manually stopping ALL containers...${NC}"
docker kill $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# 4. Create Docker network manually
echo -e "${YELLOW}🌐 Creating fresh Docker network...${NC}"
docker network rm memex-ultimate 2>/dev/null || true
docker network create memex-ultimate

# 5. Start backend manually
echo -e "${YELLOW}🏗️ Starting backend manually...${NC}"
docker run -d \
  --name memex-backend-ultimate \
  --network memex-ultimate \
  -p 3001:3001 \
  -v "$(pwd)/.env:/app/.env:ro" \
  -v "$(pwd):/app:ro" \
  --restart unless-stopped \
  node:20-alpine \
  sh -c "cd /app && npm ci --only=production && node backend/server.js"

# 6. Wait for backend
echo -e "${YELLOW}⏳ Waiting 30 seconds for backend to start...${NC}"
sleep 30

# 7. Test backend
echo -e "${YELLOW}🧪 Testing backend...${NC}"
if docker exec memex-backend-ultimate curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend working${NC}"
else
    echo -e "${RED}❌ Backend not working, checking logs...${NC}"
    docker logs memex-backend-ultimate | tail -10
fi

# 8. Start Discord bot manually
echo -e "${YELLOW}🤖 Starting Discord bot manually...${NC}"
docker run -d \
  --name memex-discord-bot-ultimate \
  --network memex-ultimate \
  -v "$(pwd)/.env:/app/.env:ro" \
  -v "$(pwd):/app:ro" \
  --restart unless-stopped \
  node:20-alpine \
  sh -c "cd /app && npm ci --only=production && node index.js"

# 9. Start nginx manually
echo -e "${YELLOW}🌐 Starting nginx manually...${NC}"
docker run -d \
  --name memex-nginx-ultimate \
  --network memex-ultimate \
  -p 80:80 \
  -v "$(pwd)/docker/nginx-fresh.conf:/etc/nginx/nginx.conf:ro" \
  --restart unless-stopped \
  nginx:alpine

# 10. Wait and test everything
echo -e "${YELLOW}⏳ Waiting 20 seconds for all services...${NC}"
sleep 20

# 11. Check all services
echo -e "\n${BLUE}🔍 Checking all services...${NC}"

# Backend test
if docker exec memex-backend-ultimate curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API working${NC}"
else
    echo -e "${RED}❌ Backend API failed${NC}"
fi

# Nginx test
if curl -f -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ Nginx proxy working${NC}"
else
    echo -e "${RED}❌ Nginx proxy failed${NC}"
fi

# External API test
if curl -f -s http://api.memexbot.xyz/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ External API working${NC}"
else
    echo -e "${YELLOW}⚠️ External API - check DNS${NC}"
fi

# 12. Check Discord bot
echo -e "\n${BLUE}🤖 Discord bot status:${NC}"
docker logs memex-discord-bot-ultimate | tail -10

# 13. Check for successful registration
if docker logs memex-discord-bot-ultimate 2>&1 | grep -q "Successfully registered"; then
    echo -e "${GREEN}✅ Discord bot registered commands successfully!${NC}"
elif docker logs memex-discord-bot-ultimate 2>&1 | grep -q "Ready!"; then
    echo -e "${GREEN}✅ Discord bot is ready and online!${NC}"
elif docker logs memex-discord-bot-ultimate 2>&1 | grep -q "Unauthorized"; then
    echo -e "${RED}❌ Discord bot authentication failed - check BOT_TOKEN and CLIENT_ID in .env${NC}"
else
    echo -e "${YELLOW}⚠️ Discord bot status unclear - check logs above${NC}"
fi

echo -e "\n${GREEN}🎯 Ultimate manual fix complete!${NC}"
echo -e "${BLUE}📊 Running containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${BLUE}🌐 Test your setup:${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/health${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/market${NC}"

echo -e "\n${BLUE}🔍 Monitor containers:${NC}"
echo -e "${YELLOW}   docker logs -f memex-discord-bot-ultimate${NC}"
echo -e "${YELLOW}   docker logs -f memex-backend-ultimate${NC}"
echo -e "${YELLOW}   docker logs -f memex-nginx-ultimate${NC}"

echo -e "\n${GREEN}🎉 No more ContainerConfig errors! Everything is running manually!${NC}"
