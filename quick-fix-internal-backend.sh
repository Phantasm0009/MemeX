#!/bin/bash

# 🚀 Quick Fix - Use Internal Backend Connection
# This makes the Discord bot connect to the backend via Docker's internal network

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Fix - Internal Backend Connection${NC}"
echo "============================================="

# Step 1: Update docker-compose.yml to use internal backend URL
echo -e "${YELLOW}📝 Updating Discord bot to use internal backend...${NC}"
sed -i 's|BACKEND_URL=https://api.memexbot.xyz|BACKEND_URL=http://backend:3001|g' docker-compose.yml

# Verify the change
echo -e "${YELLOW}✅ Verifying change:${NC}"
grep "BACKEND_URL" docker-compose.yml

# Step 2: Restart only the Discord bot
echo -e "${YELLOW}🔄 Restarting Discord bot...${NC}"
docker-compose stop discord-bot
docker-compose up -d discord-bot

# Step 3: Check if it's working
echo -e "${YELLOW}⏳ Waiting 10 seconds for bot to start...${NC}"
sleep 10

echo -e "${YELLOW}🔍 Discord bot logs:${NC}"
docker-compose logs --tail=15 discord-bot

echo -e "\n${GREEN}🎯 Quick fix complete!${NC}"
echo -e "${YELLOW}📝 The Discord bot now uses the internal Docker backend.${NC}"
echo -e "${YELLOW}📝 Test the /market command in Discord now.${NC}"

echo -e "\n${BLUE}💡 What this did:${NC}"
echo "- Changed BACKEND_URL from https://api.memexbot.xyz to http://backend:3001"
echo "- This uses Docker's internal network (faster and more reliable)"
echo "- The external API will still work for web dashboard"
