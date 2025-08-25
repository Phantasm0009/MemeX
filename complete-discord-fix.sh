#!/bin/bash

# 🔧 Complete Discord Bot Backend URL Fix
# This script ensures the bot uses the correct container network backend URL

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Complete Discord Bot Backend URL Fix${NC}"
echo "========================================="

# Stop the Discord bot container completely
echo -e "${YELLOW}🛑 Stopping Discord bot container...${NC}"
docker stop memex-discord-bot-ultimate-v3

# Remove the container to start fresh
echo -e "${YELLOW}🗑️ Removing Discord bot container...${NC}"
docker rm memex-discord-bot-ultimate-v3

# Start a new Discord bot container with correct backend URL
echo -e "${YELLOW}🚀 Starting fresh Discord bot container...${NC}"
docker run -d \
  --name memex-discord-bot-ultimate-v3 \
  --network memex-network-ultimate-v3 \
  -e BACKEND_URL=http://memex-backend-ultimate-v3:3001 \
  node:20-alpine \
  sh -c "
    mkdir -p /app && cd /app
    echo '🔧 Installing git...'
    apk add --no-cache git curl
    echo '📥 Cloning repository...'
    git clone https://github.com/Phantasm0009/MemeX.git .
    echo '📦 Installing dependencies...'
    npm install --only=production
    echo '🔧 Setting environment variables...'
    cat > .env << 'ENV_EOF'
# Discord Bot Configuration
BOT_TOKEN=MTM5OTc4OTA4NTk2MjUzOTA1Ng.Gl7tsx.OnxIG-uIxSBLMktl4yu3TZPjwowOTESOeYHgOQ
CLIENT_ID=1399789085962539056
GUILD_ID=1409262971485552853
MARKET_CHANNEL_ID=1409263219322781726

# Server Configuration
NODE_ENV=production
BACKEND_PORT=3001
DASHBOARD_PORT=3002
BACKEND_URL=http://memex-backend-ultimate-v3:3001

# Database (Supabase - recommended for production)
SUPABASE_URL=https://noxrbccikhdlnbbgfqlr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5veHJiY2Npa2hkbG5iYmdmcWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTg5ODQsImV4cCI6MjA3MDQzNDk4NH0.OiZOHe4QVmI1wb68JjmOxYJEshXHGnCe1y3yuyH1614

# API Keys for Real Trend Data
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAANU73QEAAAAAwbIOVaGxcBEsWJHfkiZwq9zzb2o%3DtFfvb1sqU44pxxSfUqV89v10NOIWGeObmXUOwukebpDjIDtfvT
YOUTUBE_API_KEY=AIzaSyBAQdStbgrC-FGdmTdRr1buA94VQE2zhoQ
REDDIT_CLIENT_ID=StiTSNBJZf5y70OCPtf8Yw
REDDIT_CLIENT_SECRET=s5GoimiecycgJVLnOraWY0D1aBQA0w
REDDIT_ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzU1Mjc2MDg4LjU1MjgyLCJpYXQiOjE3NTUxODk2ODguNTUyODE5LCJqdGkiOiJ0TlJJcWx4UXpDV2NLaGpFTzRiWkRhQnpSUVFIdnciLCJjaWQiOiJTdGlUU05CSlpmNXk3ME9DUHRmOFl3IiwibGlkIjoidDJfcGJlcnc4ZDUiLCJhaWQiOiJ0Ml9wYmVydzhkNSIsImxjYSI6MTY1NjQzMTM1NzAwMCwic2NwIjoiZUp5S1Z0SlNpZ1VFQUFEX193TnpBU2MiLCJmbG8iOjl9.XmAWNbl2W-cCHYPCsa2yWET4yyX1fBXe6VRjPNsXEPJqr-z1T0ksVZYAhNkpZ5PKy399kug9XAKmCNB-sboVDG9Edj-oCBzsgBRfNWzQqcbcCqB2r7YE2VCwaavSPHovkqklEeSpuY7u2plsQPvEmvB2w8imzCKJfqbVyItXGaAqFjdgTwqOlcCpAr5KuBaVuRvlpuTc_abf486G0SEpfbq8Dd1HH7aSWE-qHollk_N4c0lIQnZ0D2HiZJ_MXpT

# Bot Developer IDs (comma-separated list of Discord user IDs)
BOT_DEVELOPERS=1225485426349969518
ENV_EOF
    echo '🚀 Starting Discord bot...'
    node index.js
  "

echo -e "${YELLOW}⏳ Waiting 60 seconds for Discord bot to install and start...${NC}"
sleep 60

# Check if the Discord bot started successfully
echo -e "\n${BLUE}🔍 Checking Discord bot status...${NC}"
if docker logs --tail 10 memex-discord-bot-ultimate-v3 2>&1 | grep -q "Ready!"; then
    echo -e "${GREEN}✅ Discord bot is ready and online!${NC}"
elif docker logs --tail 10 memex-discord-bot-ultimate-v3 2>&1 | grep -q "Bot.*online\|✅.*Bot"; then
    echo -e "${GREEN}✅ Discord bot is connecting properly!${NC}"
else
    echo -e "${YELLOW}⚠️ Discord bot still starting up...${NC}"
    echo -e "${YELLOW}📋 Recent logs:${NC}"
    docker logs --tail 5 memex-discord-bot-ultimate-v3
fi

# Test the backend connectivity from inside the Discord bot container
echo -e "\n${BLUE}🌐 Testing backend connectivity from Discord bot...${NC}"
if docker exec memex-discord-bot-ultimate-v3 curl -f -s http://memex-backend-ultimate-v3:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Discord bot can reach backend!${NC}"
else
    echo -e "${RED}❌ Discord bot cannot reach backend${NC}"
fi

echo -e "\n${GREEN}🎉 Complete fix finished!${NC}"
echo -e "${BLUE}🌐 Your API is working at: http://api.memexbot.xyz/api/health${NC}"
echo -e "${BLUE}🤖 Discord bot should now work with all backend commands${NC}"

echo -e "\n${BLUE}📊 Final container status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "memex-.*-v3\|NAME"

echo -e "\n${BLUE}💡 Next steps:${NC}"
echo -e "${YELLOW}   1. Test /market command in Discord${NC}"
echo -e "${YELLOW}   2. Test /leaderboard command in Discord${NC}"
echo -e "${YELLOW}   3. Try other commands like /portfolio, /buy, /sell${NC}"
