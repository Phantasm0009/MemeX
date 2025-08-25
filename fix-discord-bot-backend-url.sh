#!/bin/bash

# 🔧 Quick Fix for Discord Bot Backend URL
# The bot is trying localhost:3001 instead of the container network

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Discord Bot Backend URL${NC}"
echo "================================="

# Update the Discord bot to use the correct backend URL
echo -e "${YELLOW}📝 Updating Discord bot environment...${NC}"

# Restart Discord bot with correct backend URL
docker exec memex-discord-bot-ultimate-v3 sh -c '
    echo "🔧 Updating backend URL in Discord bot..."
    cd /app
    
    # Update .env file to use container network name
    sed -i "s|BACKEND_URL=.*|BACKEND_URL=http://memex-backend-ultimate-v3:3001|g" .env
    
    echo "📋 Updated .env contents:"
    grep "BACKEND_URL" .env
    
    echo "🔄 Restarting Discord bot process..."
    pkill -f "node index.js" || true
    sleep 2
    nohup node index.js > /dev/null 2>&1 &
    
    echo "✅ Discord bot restarted with correct backend URL"
'

# Wait a moment for the bot to restart
echo -e "${YELLOW}⏳ Waiting 30 seconds for Discord bot to restart...${NC}"
sleep 30

# Check if Discord bot is now connecting properly
echo -e "\n${BLUE}🔍 Checking Discord bot status...${NC}"
if docker logs --tail 10 memex-discord-bot-ultimate-v3 2>&1 | grep -q "Ready!"; then
    echo -e "${GREEN}✅ Discord bot is now ready and online!${NC}"
elif docker logs --tail 10 memex-discord-bot-ultimate-v3 2>&1 | grep -q "Backend.*online\|✅.*Backend"; then
    echo -e "${GREEN}✅ Discord bot is connecting to backend properly!${NC}"
else
    echo -e "${YELLOW}⚠️ Discord bot still starting up...${NC}"
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    docker logs --tail 5 memex-discord-bot-ultimate-v3
fi

echo -e "\n${GREEN}🎉 Quick fix complete!${NC}"
echo -e "${BLUE}🌐 Your API is working at: http://api.memexbot.xyz/api/health${NC}"
echo -e "${BLUE}🤖 Discord bot should now connect to backend properly${NC}"

echo -e "\n${BLUE}📊 Final status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "memex-.*-v3\|NAME"
