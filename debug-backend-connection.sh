#!/bin/bash

# 🔍 Debug Backend Connection Issues
# This script helps diagnose why the Discord bot can't connect to the backend

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Debugging Backend Connection Issues${NC}"
echo "======================================"

# Check container status
echo -e "${YELLOW}📊 Container Status:${NC}"
docker-compose ps

echo -e "\n${YELLOW}🔍 Backend Container Logs:${NC}"
docker-compose logs --tail=20 backend

echo -e "\n${YELLOW}🌐 Nginx Container Status:${NC}"
docker-compose logs --tail=10 nginx

echo -e "\n${YELLOW}🧪 Testing Direct Backend Connection (port 3001):${NC}"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend responding on localhost:3001${NC}"
    curl -s http://localhost:3001/api/health | jq '.' || curl -s http://localhost:3001/api/health
else
    echo -e "${RED}❌ Backend NOT responding on localhost:3001${NC}"
fi

echo -e "\n${YELLOW}🧪 Testing HTTPS Connection (port 443):${NC}"
if curl -k -s https://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ HTTPS responding on localhost:443${NC}"
    curl -k -s https://localhost/api/health | jq '.' || curl -k -s https://localhost/api/health
else
    echo -e "${RED}❌ HTTPS NOT responding on localhost:443${NC}"
fi

echo -e "\n${YELLOW}🧪 Testing External Domain:${NC}"
if curl -s https://api.memexbot.xyz/api/health > /dev/null; then
    echo -e "${GREEN}✅ External domain responding${NC}"
    curl -s https://api.memexbot.xyz/api/health | jq '.' || curl -s https://api.memexbot.xyz/api/health
else
    echo -e "${RED}❌ External domain NOT responding${NC}"
fi

echo -e "\n${YELLOW}🔧 Network Connectivity Check:${NC}"
echo "Checking if containers can reach each other..."
docker exec memex-discord-bot curl -s http://backend:3001/api/health > /dev/null && echo -e "${GREEN}✅ Discord bot can reach backend container${NC}" || echo -e "${RED}❌ Discord bot CANNOT reach backend container${NC}"

echo -e "\n${YELLOW}🔍 Port Usage:${NC}"
netstat -tulpn | grep ":3001\|:443\|:80" || echo "No ports found"

echo -e "\n${YELLOW}💡 Quick Fix Options:${NC}"
echo "1. Restart containers: docker-compose restart"
echo "2. Use internal backend: Update BACKEND_URL to http://backend:3001"
echo "3. Fix SSL/nginx configuration"
echo "4. Use direct connection: http://localhost:3001"
