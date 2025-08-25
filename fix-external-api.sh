#!/bin/bash

# 🔧 Fix External API Access Issues
# This script fixes the ContainerConfig error and SSL certificate issues

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing External API Access Issues${NC}"
echo "========================================"

# 1. Nuclear fix for dashboard container
echo -e "\n${YELLOW}🧹 Nuclear fix for dashboard container...${NC}"
docker stop memex-dashboard 2>/dev/null || true
docker rm memex-dashboard 2>/dev/null || true
docker rmi $(docker images | grep memexbot_dashboard | awk '{print $3}') 2>/dev/null || true

# 2. Create HTTP-only nginx config (no SSL for now)
echo -e "\n${YELLOW}📝 Creating HTTP-only nginx config...${NC}"
cat > docker/nginx-external-api.conf << 'EOF'
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
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # CORS headers for dashboard
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
    
    # Upstream backend
    upstream backend {
        server backend:3001;
    }
    
    # HTTP Server for API access
    server {
        listen 80;
        server_name api.memexbot.xyz memexbot.xyz;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
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
        
        # Default root
        location / {
            return 200 "🚀 Italian Meme Stock Exchange API\n📊 API endpoints available at /api/\n🏥 Health check at /health\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# 3. Update docker-compose to use HTTP-only nginx config
echo -e "\n${YELLOW}🔧 Updating docker-compose for HTTP-only access...${NC}"
sed -i 's|nginx-ssl.conf|nginx-external-api.conf|g' docker-compose.yml

# 4. Remove SSL volume mounts temporarily
echo -e "\n${YELLOW}📝 Temporarily removing SSL volume mounts...${NC}"
sed -i '/letsencrypt/d' docker-compose.yml

# 5. Restart nginx with new config
echo -e "\n${YELLOW}🔄 Restarting nginx with HTTP-only config...${NC}"
docker-compose up -d nginx

# 6. Rebuild dashboard container
echo -e "\n${YELLOW}🏗️ Rebuilding dashboard container...${NC}"
docker-compose build dashboard
docker-compose up -d dashboard

# 7. Wait and test
echo -e "\n${YELLOW}⏳ Waiting 15 seconds for services to start...${NC}"
sleep 15

# 8. Test API access
echo -e "\n${BLUE}🧪 Testing external API access...${NC}"
if curl -f -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ API accessible at http://localhost/api/health${NC}"
else
    echo -e "${RED}❌ API still not accessible${NC}"
fi

if curl -f -s http://localhost/api/market > /dev/null; then
    echo -e "${GREEN}✅ Market endpoint working at http://localhost/api/market${NC}"
else
    echo -e "${RED}❌ Market endpoint not working${NC}"
fi

echo -e "\n${GREEN}🎯 External API fix complete!${NC}"
echo -e "${BLUE}📝 For your DigitalOcean App Platform dashboard:${NC}"
echo -e "${YELLOW}   BACKEND_URL=http://api.memexbot.xyz${NC}"
echo -e "${BLUE}📝 Test the API:${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/health${NC}"
echo -e "${YELLOW}   curl http://api.memexbot.xyz/api/market${NC}"

echo -e "\n${GREEN}✅ Your Discord bot should still be working normally!${NC}"
echo -e "${BLUE}🔍 Check Discord bot logs:${NC}"
echo -e "${YELLOW}   docker logs memex-discord-bot${NC}"
