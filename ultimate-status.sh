#!/bin/bash

# 🔍 Ultimate Status Check
# Verify all services after ultimate fix

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Ultimate Status Check${NC}"
echo "========================"

# Check running containers
echo -e "\n${BLUE}📦 Running containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "memex\|NAME"

# Check backend API
echo -e "\n${BLUE}🏗️ Backend API status:${NC}"
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend API: WORKING${NC}"
    echo -e "   Response: $(curl -s http://localhost:3001/api/health)"
else
    echo -e "${RED}❌ Backend API: FAILED${NC}"
fi

# Check nginx proxy
echo -e "\n${BLUE}🌐 Nginx proxy status:${NC}"
if curl -f -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ Nginx proxy: WORKING${NC}"
    echo -e "   Response: $(curl -s http://localhost/api/health)"
else
    echo -e "${RED}❌ Nginx proxy: FAILED${NC}"
fi

# Check external API
echo -e "\n${BLUE}🌍 External API status:${NC}"
if curl -f -s http://api.memexbot.xyz/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ External API: WORKING${NC}"
    echo -e "   Response: $(curl -s http://api.memexbot.xyz/api/health 2>/dev/null)"
else
    echo -e "${YELLOW}⚠️ External API: Check DNS configuration${NC}"
fi

# Check Discord bot authentication
echo -e "\n${BLUE}🤖 Discord bot status:${NC}"
if docker logs memex-discord-bot-ultimate 2>&1 | grep -q "Ready!"; then
    echo -e "${GREEN}✅ Discord bot: ONLINE & READY${NC}"
elif docker logs memex-discord-bot-ultimate 2>&1 | grep -q "Successfully registered"; then
    echo -e "${GREEN}✅ Discord bot: COMMANDS REGISTERED${NC}"
elif docker logs memex-discord-bot-ultimate 2>&1 | grep -q "Unauthorized"; then
    echo -e "${RED}❌ Discord bot: AUTHENTICATION FAILED${NC}"
    echo -e "${YELLOW}   Fix: Check BOT_TOKEN and CLIENT_ID in .env file${NC}"
else
    echo -e "${YELLOW}⚠️ Discord bot: Status unclear${NC}"
fi

# Show recent Discord bot logs
echo -e "\n${BLUE}📝 Recent Discord bot logs:${NC}"
docker logs memex-discord-bot-ultimate 2>&1 | tail -5

# Show recent backend logs
echo -e "\n${BLUE}📝 Recent backend logs:${NC}"
docker logs memex-backend-ultimate 2>&1 | tail -5

# Market data test
echo -e "\n${BLUE}📊 Market data test:${NC}"
if curl -f -s http://localhost:3001/api/market > /dev/null; then
    echo -e "${GREEN}✅ Market data: AVAILABLE${NC}"
    echo -e "   Stocks: $(curl -s http://localhost:3001/api/market | jq -r 'keys | length') available"
else
    echo -e "${RED}❌ Market data: FAILED${NC}"
fi

echo -e "\n${GREEN}🎯 Status check complete!${NC}"
