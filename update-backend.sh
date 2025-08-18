#!/bin/bash

# 🔄 Update Backend Script for DigitalOcean Droplet
# Run this script on your DigitalOcean droplet to update the backend

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Updating Italian Meme Stock Exchange Backend...${NC}"

# Change to app directory
cd /var/www/italian-meme-exchange

echo -e "${YELLOW}📥 Fetching latest changes from GitHub...${NC}"
git pull origin main

echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"
npm install --production

echo -e "${YELLOW}🔄 Restarting backend services with PM2...${NC}"
pm2 restart backend || pm2 start ecosystem.config.cjs

echo -e "${YELLOW}🔄 Restarting Discord bot...${NC}"
pm2 restart discord-bot || echo "Discord bot not running or already restarted"

echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

echo -e "${YELLOW}🏥 Checking service health...${NC}"
pm2 list

echo -e "${GREEN}✅ Backend update completed!${NC}"
echo -e "${BLUE}📊 Test the new endpoints:${NC}"
echo -e "   Health: curl http://$(curl -s ifconfig.me):3001/api/health"
echo -e "   Quests: curl http://$(curl -s ifconfig.me):3001/api/quests"  
echo -e "   Leaderboard: curl http://$(curl -s ifconfig.me):3001/api/leaderboard"
echo -e "   Market: curl http://$(curl -s ifconfig.me):3001/api/market"
echo -e "   Global Events: curl http://$(curl -s ifconfig.me):3001/api/global-events"
