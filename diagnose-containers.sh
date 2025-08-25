#!/bin/bash

# 🔍 Quick Diagnostic Script for Container Status
# This script checks if containers are actually running the Node.js apps

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔍 Container Diagnostic Check${NC}"
echo "=============================="

# Check container status
echo -e "\n${BLUE}📦 Container Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "memex-.*-v3\|NAME"

# Check backend logs (last 20 lines)
echo -e "\n${BLUE}🏗️ Backend Container Logs (last 20 lines):${NC}"
docker logs --tail 20 memex-backend-ultimate-v3

# Check if backend process is actually running inside container
echo -e "\n${BLUE}🔍 Backend Process Check:${NC}"
if docker exec memex-backend-ultimate-v3 ps aux | grep -E "(node|npm)" | grep -v grep; then
    echo -e "${GREEN}✅ Node.js process found in backend container${NC}"
else
    echo -e "${RED}❌ No Node.js process found in backend container${NC}"
fi

# Check Discord bot logs (last 20 lines)
echo -e "\n${BLUE}🤖 Discord Bot Container Logs (last 20 lines):${NC}"
docker logs --tail 20 memex-discord-bot-ultimate-v3

# Check if Discord bot process is running
echo -e "\n${BLUE}🔍 Discord Bot Process Check:${NC}"
if docker exec memex-discord-bot-ultimate-v3 ps aux | grep -E "(node|npm)" | grep -v grep; then
    echo -e "${GREEN}✅ Node.js process found in Discord bot container${NC}"
else
    echo -e "${RED}❌ No Node.js process found in Discord bot container${NC}"
fi

# Test internal network connectivity
echo -e "\n${BLUE}🌐 Network Connectivity Test:${NC}"
if docker exec memex-nginx-ultimate-v3 nc -z memex-backend-ultimate-v3 3001 2>/dev/null; then
    echo -e "${GREEN}✅ Nginx can reach backend container${NC}"
else
    echo -e "${RED}❌ Nginx cannot reach backend container${NC}"
fi

# Check if backend is listening on port 3001
echo -e "\n${BLUE}🔌 Backend Port Check:${NC}"
if docker exec memex-backend-ultimate-v3 netstat -ln 2>/dev/null | grep ":3001"; then
    echo -e "${GREEN}✅ Backend is listening on port 3001${NC}"
else
    echo -e "${RED}❌ Backend is not listening on port 3001${NC}"
fi

echo -e "\n${BLUE}💡 Recommendation:${NC}"
echo -e "${YELLOW}   If Node.js processes are not running, containers are still installing dependencies.${NC}"
echo -e "${YELLOW}   Wait a few more minutes and run this script again.${NC}"

echo -e "\n${BLUE}🔍 To monitor live:${NC}"
echo -e "${YELLOW}   docker logs -f memex-backend-ultimate-v3${NC}"
echo -e "${YELLOW}   docker logs -f memex-discord-bot-ultimate-v3${NC}"
