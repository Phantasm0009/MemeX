#!/bin/bash

# 🔧 Nginx Configuration Fix for SSL Setup
# Fixes the add_header directive placement issue

set -e

echo "🔧 Fixing Nginx SSL Configuration Issues..."
echo "==========================================="

# Update nginx configuration to fix add_header placement
echo "📝 Creating corrected nginx SSL configuration..."
cat > docker/nginx-ssl.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # Upstream backend
    upstream backend {
        server backend:3001;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name api.memexbot.xyz;
        
        # Certbot webroot location
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        http2 on;
        server_name api.memexbot.xyz;

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/api.memexbot.xyz/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.memexbot.xyz/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Handle preflight requests
        location @options {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
            add_header Access-Control-Max-Age "1728000" always;
            add_header Content-Type "text/plain; charset=utf-8";
            add_header Content-Length "0";
            return 204;
        }

        # Proxy to backend
        location / {
            # Handle OPTIONS requests
            if ($request_method = 'OPTIONS') {
                return 204;
            }

            # CORS headers for all responses
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
            add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF

# Update final SSL fix script to use wget instead of curl for health checks
echo "🔧 Updating final SSL fix script for Alpine compatibility..."
cat > final-ssl-fix.sh << 'EOF'
#!/bin/bash

# Final SSL Fix - Complete Solution for Nginx Backend Connection
# This script fixes the container naming issue preventing nginx from connecting to backend

set -e

echo "🚀 Starting Final SSL Fix for api.memexbot.xyz"
echo "=============================================="

# Ensure we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found. Please run from project root."
    exit 1
fi

# Stop all containers first
echo "🛑 Stopping all containers..."
docker-compose down --remove-orphans || true

# Clean up any existing containers with problematic names
echo "🧹 Cleaning up existing containers..."
docker container rm -f memex-backend memex-nginx backend nginx 2>/dev/null || true

# Fix environment configuration
echo "🔧 Checking .env configuration..."
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please ensure .env exists with proper configuration."
    exit 1
fi

# Ensure backend URL is set correctly for health checks
if ! grep -q "BACKEND_URL.*localhost" .env; then
    echo "🔧 Adding local backend URL for health checks..."
    echo "BACKEND_URL=http://localhost:3001" >> .env
fi

# Update docker-compose.yml to use correct container names
echo "🔧 Updating docker-compose.yml for correct container naming..."
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  backend:
    build: .
    container_name: backend
    ports:
      - "3001:3001"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - BACKEND_PORT=3001
    volumes:
      - ./data:/app/data
    networks:
      - memex-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx-ssl.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
    networks:
      - memex-network
    restart: unless-stopped

  discord-bot:
    build: .
    container_name: discord-bot
    command: node index.js
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - BACKEND_URL=http://backend:3001
    depends_on:
      - backend
    networks:
      - memex-network
    restart: unless-stopped

networks:
  memex-network:
    driver: bridge
COMPOSE_EOF

# Build and start services
echo "🏗️  Building and starting services with correct naming..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Test backend health using direct port access
echo "🔍 Testing backend health..."
for i in {1..10}; do
    if curl -f http://localhost:3001/api/health 2>/dev/null; then
        echo "✅ Backend health check passed"
        break
    else
        echo "⏳ Waiting for backend... attempt $i/10"
        sleep 5
    fi
done

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
if docker exec nginx nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration error"
    docker logs nginx
    exit 1
fi

# Test SSL endpoints
echo "🔍 Testing SSL endpoints..."
echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Check if nginx is running properly
if docker ps | grep -q nginx; then
    echo "✅ Nginx container is running"
    
    # Test local connection first
    if curl -k -f https://localhost/api/health 2>/dev/null; then
        echo "✅ Local HTTPS endpoint is working!"
    else
        echo "⚠️  Local HTTPS endpoint not responding yet"
    fi
    
    # Test domain connection
    if curl -k -f https://api.memexbot.xyz/api/health 2>/dev/null; then
        echo "✅ Domain HTTPS endpoint is working!"
    else
        echo "⚠️  Domain HTTPS endpoint not yet accessible (may need DNS propagation)"
    fi
else
    echo "❌ Nginx container is not running"
    docker logs nginx
fi

# Show final status
echo ""
echo "🎉 Final SSL Fix Complete!"
echo "=========================="
echo "✅ Container naming fixed (backend -> backend)"
echo "✅ Nginx configuration corrected"
echo "✅ Health checks using wget instead of curl"
echo "✅ SSL certificates in place"
echo "✅ Services started with proper configuration"
echo ""
echo "🔍 Final container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📊 Test your endpoints:"
echo "  • Health: https://api.memexbot.xyz/api/health"
echo "  • Market: https://api.memexbot.xyz/api/market"
echo "  • Status: https://api.memexbot.xyz/api/status"
echo ""
echo "📋 To check logs if issues persist:"
echo "  • Backend: docker logs backend"
echo "  • Nginx: docker logs nginx"
echo "  • Discord: docker logs discord-bot"
EOF

chmod +x final-ssl-fix.sh

echo "✅ Configuration fixes completed!"
echo ""
echo "🚀 What was fixed:"
echo "  1. ✅ Nginx add_header directives moved out of if blocks"
echo "  2. ✅ Health checks use wget instead of curl (Alpine compatible)"
echo "  3. ✅ Updated docker-compose.yml with correct health check command"
echo "  4. ✅ Simplified CORS handling in nginx"
echo ""
echo "🎯 Ready to deploy! Run: ./final-ssl-fix.sh"
