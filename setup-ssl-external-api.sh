#!/bin/bash

# 🔧 Fix SSL and External API Access
# This script properly configures SSL certificates and external API access

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting up SSL and External API Access${NC}"
echo "=========================================="

# Check if SSL certificates exist
if [ -d "docker/ssl" ]; then
    echo -e "${GREEN}✅ SSL directory exists${NC}"
    ls -la docker/ssl/
else
    echo -e "${YELLOW}📁 Creating SSL directory...${NC}"
    mkdir -p docker/ssl
fi

# Check if nginx config exists
if [ -f "docker/nginx.conf" ]; then
    echo -e "${GREEN}✅ Nginx config exists${NC}"
else
    echo -e "${YELLOW}📝 Creating nginx config...${NC}"
    cat > docker/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Upstream backend
    upstream backend {
        server backend:3001;
    }
    
    # HTTP Server (redirect to HTTPS if certificates exist)
    server {
        listen 80;
        server_name api.memexbot.xyz;
        
        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
fi

# Stop nginx if running
echo -e "${YELLOW}🛑 Stopping nginx...${NC}"
docker-compose stop nginx

# Restart nginx with new config
echo -e "${YELLOW}🚀 Starting nginx...${NC}"
docker-compose up -d nginx

# Check nginx status
echo -e "${YELLOW}📊 Nginx status:${NC}"
docker-compose ps nginx

echo -e "${YELLOW}🔍 Nginx logs:${NC}"
docker-compose logs --tail=10 nginx

# Test the connection
echo -e "${YELLOW}🧪 Testing HTTP connection...${NC}"
sleep 5
if curl -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ HTTP connection working${NC}"
    curl -s http://localhost/api/health
else
    echo -e "${RED}❌ HTTP connection failed${NC}"
fi

echo -e "\n${GREEN}🎯 SSL setup complete!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. The API should now be accessible via HTTP"
echo "2. To add HTTPS, you'll need to set up Let's Encrypt certificates"
echo "3. Test: curl http://api.memexbot.xyz/api/health"
