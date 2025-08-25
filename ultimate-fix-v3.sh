#!/bin/bash

# 🔧 ULTIMATE FIX v3 - Skip Local npm Install
# This version skips local npm install and only uses containers

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}🔥 ULTIMATE FIX v3 - Container Only${NC}"
echo "=============================================="
echo -e "${YELLOW}This version skips local npm install (Node.js v12 issue)${NC}"
echo ""

# 1. Check .env file
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Creating .env template...${NC}"
    cat > .env << 'EOF'
# Discord Bot Configuration
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
CLIENT_ID=YOUR_CLIENT_ID_HERE
GUILD_ID=
MARKET_CHANNEL_ID=

# Bot Developer IDs
BOT_DEVELOPERS=1225485426349969518

# Backend Configuration
BACKEND_URL=http://backend:3001

# Supabase Configuration (Optional)
SUPABASE_URL=
SUPABASE_ANON_KEY=
EOF
    echo -e "${YELLOW}📝 Please edit .env file with your Discord bot credentials and re-run this script${NC}"
    exit 1
fi

# 2. Check if credentials are set
if grep -q "YOUR_BOT_TOKEN_HERE" .env; then
    echo -e "${RED}❌ BOT_TOKEN not set properly in .env file${NC}"
    echo -e "${YELLOW}📝 Please edit .env file with your real Discord bot token:${NC}"
    echo -e "${YELLOW}   nano .env${NC}"
    exit 1
fi

# 3. Kill ALL existing containers
echo -e "${YELLOW}🛑 Stopping all containers...${NC}"
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# 4. Create Docker network
echo -e "${YELLOW}🌐 Creating Docker network...${NC}"
docker network rm memex-ultimate-v3 2>/dev/null || true
docker network create memex-ultimate-v3

# 5. Start backend directly (NO local npm install)
echo -e "${YELLOW}🏗️ Starting backend container...${NC}"
docker run -d \
  --name memex-backend-ultimate-v3 \
  --network memex-ultimate-v3 \
  -p 3001:3001 \
  --restart unless-stopped \
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
$(cat .env)
ENV_EOF
    echo '🚀 Starting backend server...'
    node backend/server.js
  "

# 6. Wait for backend
echo -e "${YELLOW}⏳ Waiting 60 seconds for backend to install and start...${NC}"
sleep 60

# 7. Test backend
echo -e "${YELLOW}🧪 Testing backend...${NC}"
if docker exec memex-backend-ultimate-v3 curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend working${NC}"
else
    echo -e "${RED}❌ Backend not working, checking logs...${NC}"
    docker logs memex-backend-ultimate-v3 | tail -20
fi

# 8. Start Discord bot
echo -e "${YELLOW}🤖 Starting Discord bot container...${NC}"
docker run -d \
  --name memex-discord-bot-ultimate-v3 \
  --network memex-ultimate-v3 \
  --restart unless-stopped \
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
$(cat .env)
ENV_EOF
    echo '🤖 Starting Discord bot...'
    node index.js
  "

# 9. Start nginx
echo -e "${YELLOW}🌐 Starting nginx container...${NC}"
docker run -d \
  --name memex-nginx-ultimate-v3 \
  --network memex-ultimate-v3 \
  -p 80:80 \
  --restart unless-stopped \
  nginx:alpine \
  sh -c "
    cat > /etc/nginx/nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    
    # Security headers
    add_header X-Frame-Options 'SAMEORIGIN' always;
    add_header X-Content-Type-Options 'nosniff' always;
    add_header X-XSS-Protection '1; mode=block' always;
    
    # CORS support
    add_header Access-Control-Allow-Origin '*' always;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization' always;
    
    # Upstream backend
    upstream backend {
        server memex-backend-ultimate-v3:3001;
    }
    
    server {
        listen 80;
        server_name api.memexbot.xyz localhost;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        # API routes
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            
            # CORS for preflight requests
            if (\$request_method = 'OPTIONS') {
                add_header Access-Control-Allow-Origin '*';
                add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
                add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
                add_header Content-Length 0;
                add_header Content-Type text/plain;
                return 204;
            }
        }
        
        # Health check
        location /health {
            proxy_pass http://backend/api/health;
            proxy_set_header Host \$host;
        }
        
        # Root redirect
        location / {
            return 200 'Italian Meme Stock Exchange API - Use /api/ endpoints';
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF
    nginx -g 'daemon off;'
  "

# 10. Wait and test everything
echo -e "${YELLOW}⏳ Waiting 30 seconds for all services...${NC}"
sleep 30

# 11. Check all services
echo -e "\n${BLUE}🔍 Final status check...${NC}"

# Backend test
if docker exec memex-backend-ultimate-v3 curl -f -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API working${NC}"
else
    echo -e "${RED}❌ Backend API failed${NC}"
fi

# Nginx test
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx proxy working${NC}"
else
    echo -e "${RED}❌ Nginx proxy failed${NC}"
fi

# External API test
if curl -f -s http://api.memexbot.xyz/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ External API working${NC}"
else
    echo -e "${YELLOW}⚠️ External API - check DNS${NC}"
fi

# 12. Check Discord bot
echo -e "\n${BLUE}🤖 Discord bot status:${NC}"
if docker logs memex-discord-bot-ultimate-v3 2>&1 | grep -q "Ready!"; then
    echo -e "${GREEN}✅ Discord bot is ready and online!${NC}"
elif docker logs memex-discord-bot-ultimate-v3 2>&1 | grep -q "Successfully registered"; then
    echo -e "${GREEN}✅ Discord bot registered commands successfully!${NC}"
elif docker logs memex-discord-bot-ultimate-v3 2>&1 | grep -q "Unauthorized"; then
    echo -e "${RED}❌ Discord bot authentication failed - check BOT_TOKEN and CLIENT_ID in .env${NC}"
else
    echo -e "${YELLOW}⚠️ Discord bot status unclear${NC}"
    echo -e "${BLUE}Recent logs:${NC}"
    docker logs memex-discord-bot-ultimate-v3 2>&1 | tail -10
fi

echo -e "\n${GREEN}🎯 Ultimate fix v3 complete!${NC}"
echo -e "${BLUE}📊 Running containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${BLUE}🌐 Test your setup:${NC}"
echo -e "${YELLOW}   curl http://localhost/api/health${NC}"
echo -e "${YELLOW}   curl http://localhost/api/market${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/health${NC}"

echo -e "\n${BLUE}🔍 Monitor containers:${NC}"
echo -e "${YELLOW}   docker logs -f memex-discord-bot-ultimate-v3${NC}"
echo -e "${YELLOW}   docker logs -f memex-backend-ultimate-v3${NC}"
echo -e "${YELLOW}   docker logs -f memex-nginx-ultimate-v3${NC}"

echo -e "\n${GREEN}🎉 Success: Everything runs in containers with Node.js 20!${NC}"
