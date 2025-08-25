#!/bin/bash

# 🌐 Setup External API Access for DigitalOcean App Platform
# This creates an external HTTP endpoint that your dashboard can use

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌐 Setting up External API Access${NC}"
echo "=================================="

# Step 1: Create a simple nginx config for external access
echo -e "${YELLOW}📝 Creating nginx config for external API...${NC}"
mkdir -p docker
cat > docker/nginx-external.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
    
    # Upstream backend
    upstream backend {
        server backend:3001;
    }
    
    # HTTP Server for external API access
    server {
        listen 80;
        server_name api.memexbot.xyz;
        
        # Enable CORS for dashboard
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
        
        location / {
            limit_req zone=api burst=10 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Health check endpoint
        location /health {
            proxy_pass http://backend/api/health;
            proxy_set_header Host $host;
        }
    }
}
EOF

# Step 2: Update docker-compose to use the new nginx config
echo -e "${YELLOW}📝 Updating nginx service...${NC}"
sed -i 's|./docker/nginx.conf:/etc/nginx/nginx.conf:ro|./docker/nginx-external.conf:/etc/nginx/nginx.conf:ro|g' docker-compose.yml

# Step 3: Restart nginx with new config
echo -e "${YELLOW}🔄 Restarting nginx...${NC}"
docker-compose stop nginx
docker-compose up -d nginx

# Step 4: Wait and test
echo -e "${YELLOW}⏳ Waiting 10 seconds for nginx to start...${NC}"
sleep 10

echo -e "${YELLOW}🧪 Testing external API access...${NC}"
if curl -s http://localhost/api/health > /dev/null; then
    echo -e "${GREEN}✅ External API accessible via HTTP${NC}"
    echo -e "${YELLOW}🔗 API endpoint: http://api.memexbot.xyz/api/health${NC}"
    curl -s http://localhost/api/health | head -n 3
else
    echo -e "${RED}❌ External API not accessible${NC}"
    echo -e "${YELLOW}📝 Nginx logs:${NC}"
    docker-compose logs --tail=10 nginx
fi

echo -e "\n${GREEN}🎯 External API setup complete!${NC}"
echo -e "${YELLOW}📝 For your DigitalOcean App Platform dashboard:${NC}"
echo -e "${BLUE}BACKEND_URL=http://api.memexbot.xyz${NC}"
echo ""
echo -e "${YELLOW}📝 Test the API:${NC}"
echo "curl http://api.memexbot.xyz/api/health"
echo "curl http://api.memexbot.xyz/api/market"
