#!/bin/bash

# 🚨 Emergency Docker Fix - Handle ContainerConfig Error
# Quick fix for the immediate Docker Compose issue

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚨 Emergency Docker Fix${NC}"

# Stop everything
echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
docker-compose down --remove-orphans || true

# Remove problematic backend container and image
echo -e "${YELLOW}🗑️ Removing problematic backend container...${NC}"
docker container rm -f backend memexbot_backend memex-backend || true
docker image rm -f memexbot_backend memexbot-backend || true

# Clean up orphaned resources
echo -e "${YELLOW}🧹 Cleaning up...${NC}"
docker container prune -f
docker image prune -f

# Start only the services that work
echo -e "${YELLOW}🚀 Starting Discord bot only (standalone mode)...${NC}"
docker-compose up -d discord-bot

# Check if bot started successfully
sleep 5
if docker-compose ps discord-bot | grep -q "Up"; then
    echo -e "${GREEN}✅ Discord bot is running${NC}"
    echo -e "${YELLOW}📋 Bot logs:${NC}"
    docker-compose logs --tail=10 discord-bot
else
    echo -e "${RED}❌ Discord bot failed to start${NC}"
    docker-compose logs discord-bot
fi

echo -e "${GREEN}🎯 Emergency fix complete!${NC}"
echo -e "${YELLOW}📝 The Discord bot is now running in standalone mode.${NC}"
echo -e "${YELLOW}📝 It should connect to https://api.memexbot.xyz for backend data.${NC}"
