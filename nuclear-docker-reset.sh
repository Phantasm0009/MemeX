#!/bin/bash

# 🔥 NUCLEAR Docker Reset for memexbot.xyz
# This script completely resets Docker to fix persistent ContainerConfig errors

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}🔥 NUCLEAR Docker Reset for memexbot.xyz${NC}"
echo "=========================================="
echo -e "${YELLOW}⚠️  This will completely reset Docker and rebuild everything${NC}"
echo -e "${YELLOW}⚠️  Your Discord bot may be temporarily offline during this process${NC}"
echo ""

# 1. Stop ALL containers
echo -e "${YELLOW}🛑 Stopping ALL Docker containers...${NC}"
docker stop $(docker ps -q) 2>/dev/null || true

# 2. Remove ALL containers
echo -e "${YELLOW}🗑️ Removing ALL Docker containers...${NC}"
docker rm $(docker ps -aq) 2>/dev/null || true

# 3. Remove ALL images (nuclear option)
echo -e "${YELLOW}💣 Removing ALL Docker images...${NC}"
docker rmi $(docker images -q) 2>/dev/null || true

# 4. Remove ALL volumes
echo -e "${YELLOW}🗑️ Removing ALL Docker volumes...${NC}"
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# 5. Remove ALL networks (except defaults)
echo -e "${YELLOW}🗑️ Removing custom Docker networks...${NC}"
docker network rm $(docker network ls --filter type=custom -q) 2>/dev/null || true

# 6. Clean Docker system completely
echo -e "${YELLOW}🧹 Deep cleaning Docker system...${NC}"
docker system prune -af --volumes

# 7. Restart Docker service
echo -e "${YELLOW}🔄 Restarting Docker service...${NC}"
systemctl restart docker
sleep 5

# 8. Verify Docker is working
echo -e "${BLUE}🧪 Testing Docker...${NC}"
docker run --rm hello-world

# 9. Create fresh HTTP-only nginx config
echo -e "${YELLOW}📝 Creating fresh nginx config...${NC}"
mkdir -p docker
cat > docker/nginx-fresh.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;
    
    # CORS for dashboard
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
    
    # Upstream backend
    upstream backend {
        server backend:3001;
    }
    
    # HTTP Server
    server {
        listen 80;
        server_name api.memexbot.xyz memexbot.xyz localhost;
        
        # API endpoints
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS for preflight requests
            if ($request_method = 'OPTIONS') {
                add_header Access-Control-Allow-Origin "*" always;
                add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
                add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
                add_header Access-Control-Max-Age 86400;
                add_header Content-Length 0;
                add_header Content-Type text/plain;
                return 204;
            }
        }
        
        # Health check
        location /health {
            proxy_pass http://backend/api/health;
            proxy_set_header Host $host;
        }
        
        # Root
        location / {
            return 200 "🚀 Italian Meme Stock Exchange API Ready\n📊 API: /api/\n🏥 Health: /health\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# 10. Create minimal docker-compose.yml
echo -e "${YELLOW}📝 Creating minimal docker-compose.yml...${NC}"
cat > docker-compose-fresh.yml << 'EOF'
version: '3.8'

services:
  # Backend API Service
  backend:
    build: .
    container_name: memex-backend-fresh
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    networks:
      - memex-network-fresh
    command: ["node", "backend/server.js"]

  # Discord Bot Service
  discord-bot:
    build: .
    container_name: memex-discord-bot-fresh
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - BACKEND_URL=http://backend:3001
    depends_on:
      - backend
    networks:
      - memex-network-fresh
    command: ["node", "index.js"]

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: memex-nginx-fresh
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx-fresh.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    networks:
      - memex-network-fresh

networks:
  memex-network-fresh:
    driver: bridge

volumes:
  memex-data-fresh:
    driver: local
EOF

# 11. Build fresh containers
echo -e "${BLUE}🏗️ Building fresh containers...${NC}"
docker-compose -f docker-compose-fresh.yml build --no-cache

# 12. Start services
echo -e "${BLUE}🚀 Starting fresh services...${NC}"
docker-compose -f docker-compose-fresh.yml up -d

# 13. Wait for services
echo -e "${YELLOW}⏳ Waiting 20 seconds for services to start...${NC}"
sleep 20

# 14. Test everything
echo -e "\n${BLUE}🧪 Testing fresh deployment...${NC}"

# Test backend directly
echo -e "${YELLOW}Testing backend container...${NC}"
if docker exec memex-backend-fresh curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend working${NC}"
else
    echo -e "${RED}❌ Backend not working${NC}"
    docker logs memex-backend-fresh
fi

# Test nginx
echo -e "${YELLOW}Testing nginx proxy...${NC}"
if curl -f -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ Nginx proxy working${NC}"
else
    echo -e "${RED}❌ Nginx proxy not working${NC}"
    docker logs memex-nginx-fresh
fi

# Test Discord bot
echo -e "${YELLOW}Testing Discord bot...${NC}"
sleep 5
docker logs memex-discord-bot-fresh | tail -10

echo -e "\n${GREEN}🎯 Nuclear reset complete!${NC}"
echo -e "${BLUE}📝 Fresh containers:${NC}"
echo -e "${YELLOW}   - memex-backend-fresh${NC}"
echo -e "${YELLOW}   - memex-discord-bot-fresh${NC}"
echo -e "${YELLOW}   - memex-nginx-fresh${NC}"

echo -e "\n${BLUE}🌐 Test your API:${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/health${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/market${NC}"

echo -e "\n${GREEN}✅ Your bot should be working again!${NC}"
echo -e "${BLUE}🔍 Monitor Discord bot logs:${NC}"
echo -e "${YELLOW}   docker logs -f memex-discord-bot-fresh${NC}"
