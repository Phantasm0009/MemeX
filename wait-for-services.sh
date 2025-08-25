#!/bin/bash

# 🕐 Wait for Services Ready Script
# This script waits for the containers to finish installing and start services

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🕐 Waiting for services to be ready...${NC}"
echo "======================================"

# Function to check if backend is ready
check_backend() {
    if docker exec memex-backend-ultimate-v3 netstat -ln 2>/dev/null | grep -q ":3001"; then
        return 0
    else
        return 1
    fi
}

# Function to check if Discord bot is ready
check_discord_bot() {
    if docker logs memex-discord-bot-ultimate-v3 2>&1 | grep -q "Ready!"; then
        return 0
    else
        return 1
    fi
}

# Wait for backend (max 10 minutes)
echo -e "${YELLOW}⏳ Waiting for backend to start listening on port 3001...${NC}"
backend_ready=false
for i in {1..60}; do
    if check_backend; then
        echo -e "${GREEN}✅ Backend is ready! (${i}/60)${NC}"
        backend_ready=true
        break
    fi
    echo -n "."
    sleep 10
done

if [ "$backend_ready" = false ]; then
    echo -e "\n${RED}❌ Backend not ready after 10 minutes${NC}"
    echo -e "${YELLOW}📋 Backend logs (last 10 lines):${NC}"
    docker logs --tail 10 memex-backend-ultimate-v3
fi

# Wait for Discord bot (max 5 minutes) 
echo -e "\n${YELLOW}⏳ Waiting for Discord bot to be ready...${NC}"
bot_ready=false
for i in {1..30}; do
    if check_discord_bot; then
        echo -e "${GREEN}✅ Discord bot is ready! (${i}/30)${NC}"
        bot_ready=true
        break
    fi
    echo -n "."
    sleep 10
done

if [ "$bot_ready" = false ]; then
    echo -e "\n${RED}❌ Discord bot not ready after 5 minutes${NC}"
    echo -e "${YELLOW}📋 Discord bot logs (last 10 lines):${NC}"
    docker logs --tail 10 memex-discord-bot-ultimate-v3
fi

# Final test
echo -e "\n${BLUE}🧪 Final connectivity test...${NC}"
if curl -f -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ API health check working!${NC}"
    echo -e "${GREEN}🎉 All services are ready!${NC}"
    
    echo -e "\n${BLUE}🌐 Your API endpoints:${NC}"
    echo -e "   • Health: http://api.memexbot.xyz/api/health"
    echo -e "   • Market: http://api.memexbot.xyz/api/market"
    echo -e "   • Leaderboard: http://api.memexbot.xyz/api/leaderboard"
    
elif [ "$backend_ready" = true ]; then
    echo -e "${YELLOW}⚠️ Backend ready but nginx proxy has issues${NC}"
    echo -e "${YELLOW}📋 Nginx logs (last 5 lines):${NC}"
    docker logs --tail 5 memex-nginx-ultimate-v3
else
    echo -e "${RED}❌ Services not ready yet${NC}"
fi

echo -e "\n${BLUE}📊 Current container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "memex-.*-v3\|NAME"
