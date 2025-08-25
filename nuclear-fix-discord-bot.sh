#!/bin/bash

# 🚨 Nuclear Fix - Completely Rebuild Discord Bot
# This completely removes and rebuilds the Discord bot container

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚨 Nuclear Fix - Completely Rebuild Discord Bot${NC}"
echo "================================================"

# Step 1: Stop and remove everything Discord bot related
echo -e "${YELLOW}🛑 Stopping and removing Discord bot container...${NC}"
docker-compose stop discord-bot || true
docker-compose rm -f discord-bot || true

# Step 2: Remove Discord bot image completely
echo -e "${YELLOW}🗑️ Removing Discord bot image...${NC}"
docker image rm -f memexbot_discord-bot || true
docker image rm -f memexbot-discord-bot || true

# Step 3: Clean up any orphaned containers
echo -e "${YELLOW}🧹 Cleaning up orphaned containers...${NC}"
docker container prune -f

# Step 4: Verify backend URL in docker-compose.yml
echo -e "${YELLOW}📝 Ensuring correct backend URL...${NC}"
sed -i 's|BACKEND_URL=https://api.memexbot.xyz|BACKEND_URL=http://backend:3001|g' docker-compose.yml

echo -e "${YELLOW}✅ Current backend URL:${NC}"
grep "BACKEND_URL" docker-compose.yml | head -2

# Step 5: Build Discord bot from scratch
echo -e "${YELLOW}🔨 Building Discord bot from scratch...${NC}"
docker-compose build --no-cache discord-bot

# Step 6: Start only the Discord bot
echo -e "${YELLOW}🚀 Starting Discord bot...${NC}"
docker-compose up -d discord-bot

# Step 7: Wait and check logs
echo -e "${YELLOW}⏳ Waiting 15 seconds for bot to initialize...${NC}"
sleep 15

echo -e "${YELLOW}🔍 Fresh Discord bot logs:${NC}"
docker-compose logs --tail=25 discord-bot

echo -e "\n${YELLOW}📊 Container status:${NC}"
docker-compose ps discord-bot

# Step 8: Test internal connection
echo -e "\n${YELLOW}🧪 Testing internal Docker network connection...${NC}"
if docker exec memex-discord-bot ping -c 1 backend > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Discord bot can ping backend container${NC}"
else
    echo -e "${RED}❌ Discord bot CANNOT ping backend container${NC}"
fi

echo -e "\n${GREEN}🎯 Nuclear fix complete!${NC}"
echo -e "${YELLOW}📝 The Discord bot has been completely rebuilt.${NC}"
echo -e "${YELLOW}📝 Check the logs above for 'http://backend:3001' instead of 'https://api.memexbot.xyz'${NC}"
