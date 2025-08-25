#!/bin/bash

# 🔧 Complete Docker Environment Fix for memexbot.xyz
# This script completely cleans and rebuilds the Docker environment

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Complete Docker Environment Fix${NC}"
echo "=================================="

# Step 1: Stop and remove all containers
echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
docker-compose down --remove-orphans || true
docker container prune -f || true

# Step 2: Remove problematic images
echo -e "${YELLOW}🗑️ Cleaning Docker images...${NC}"
docker image prune -f || true
docker system prune -f || true

# Step 3: Remove any orphaned volumes
echo -e "${YELLOW}📦 Cleaning volumes...${NC}"
docker volume prune -f || true

# Step 4: Verify backend URL in docker-compose.yml
echo -e "${YELLOW}📝 Verifying docker-compose.yml backend URLs...${NC}"
if grep -q "BACKEND_URL=https://api.memexbot.xyz" docker-compose.yml; then
    echo -e "${GREEN}✅ Backend URLs are correct${NC}"
else
    echo -e "${RED}❌ Fixing backend URLs...${NC}"
    sed -i 's|BACKEND_URL=http://backend:3001|BACKEND_URL=https://api.memexbot.xyz|g' docker-compose.yml
    echo -e "${GREEN}✅ Backend URLs fixed${NC}"
fi

# Step 5: Rebuild everything from scratch
echo -e "${YELLOW}🔄 Rebuilding all containers from scratch...${NC}"
docker-compose build --no-cache

# Step 6: Start containers one by one
echo -e "${YELLOW}🚀 Starting backend container...${NC}"
docker-compose up -d backend

echo -e "${YELLOW}⏳ Waiting for backend to be healthy...${NC}"
sleep 10

echo -e "${YELLOW}🤖 Starting Discord bot...${NC}"
docker-compose up -d discord-bot

echo -e "${YELLOW}🌐 Starting nginx...${NC}"
docker-compose up -d nginx

# Step 7: Check container status
echo -e "${BLUE}📊 Container Status:${NC}"
docker-compose ps

# Step 8: Check Discord bot logs
echo -e "${BLUE}🔍 Discord Bot Logs (last 20 lines):${NC}"
docker-compose logs --tail=20 discord-bot

# Step 9: Test backend API
echo -e "${BLUE}🧪 Testing Backend API...${NC}"
if curl -s https://api.memexbot.xyz/api/health | grep -q "success"; then
    echo -e "${GREEN}✅ Backend API is responding correctly${NC}"
else
    echo -e "${RED}❌ Backend API test failed${NC}"
fi

echo -e "${GREEN}🎉 Docker environment fix complete!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test /market command in Discord"
echo "2. Check Discord bot logs: docker-compose logs discord-bot"
echo "3. Monitor container health: docker-compose ps"
