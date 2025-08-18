#!/bin/bash

# 🔄 Force Backend Update Script for DigitalOcean Droplet
# This script forces a complete update with the latest backend enhancements

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Force Updating Italian Meme Stock Exchange Backend...${NC}"

# Change to app directory
cd /var/www/italian-meme-exchange

echo -e "${YELLOW}📊 Current git status:${NC}"
git status --porcelain
git log --oneline -3

echo -e "${YELLOW}🔄 Resetting to latest remote state...${NC}"
git fetch origin main
git reset --hard origin/main

echo -e "${YELLOW}📥 Verifying we have the latest changes...${NC}"
git log --oneline -3

echo -e "${YELLOW}📦 Installing/updating dependencies...${NC}"
npm install --production

echo -e "${YELLOW}🛑 Stopping all PM2 processes...${NC}"
pm2 stop all

echo -e "${YELLOW}🔄 Starting backend with enhanced features...${NC}"
pm2 start ecosystem.config.cjs

echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 5

echo -e "${YELLOW}🏥 Checking service health...${NC}"
pm2 list

echo -e "${GREEN}✅ Force update completed!${NC}"
echo -e "${BLUE}📊 Test the NEW enhanced endpoints:${NC}"
echo -e "   Health: curl http://$(curl -s ifconfig.me):3001/api/health"
echo -e "   🎯 Quests: curl http://$(curl -s ifconfig.me):3001/api/quests"  
echo -e "   🏆 Leaderboard: curl http://$(curl -s ifconfig.me):3001/api/leaderboard"
echo -e "   Market: curl http://$(curl -s ifconfig.me):3001/api/market"
echo -e "   Global Events: curl http://$(curl -s ifconfig.me):3001/api/global-events"

echo -e "${GREEN}🚀 Enhanced backend should now be running with:${NC}"
echo -e "   ✅ Market updates every 15 minutes"
echo -e "   ✅ TikTok updates every 5 minutes"  
echo -e "   ✅ Quests API endpoint"
echo -e "   ✅ Leaderboard API endpoint with Discord usernames"
echo -e "   ✅ Enhanced global events"
