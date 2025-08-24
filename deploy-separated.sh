#!/bin/bash

# 🚀 Deploy Separated Architecture to DigitalOcean
# This script deploys the simplified droplet setup (bot + API only)

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Separated Architecture Setup${NC}"
echo "=============================================="
echo ""
echo "This will:"
echo "✅ Update Docker setup to remove dashboard from droplet"
echo "✅ Configure nginx for API-only access"
echo "✅ Prepare for App Platform dashboard deployment"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found. Are you in the project directory?${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Backing up current configuration...${NC}"
cp docker-compose.yml docker-compose-old-$(date +%Y%m%d-%H%M%S).yml
echo "✅ Backup created"

echo -e "${YELLOW}📋 Step 2: Updating to simplified Docker setup...${NC}"
if [ -f "docker-compose-simplified.yml" ]; then
    cp docker-compose-simplified.yml docker-compose.yml
    echo "✅ Updated docker-compose.yml"
else
    echo -e "${RED}❌ docker-compose-simplified.yml not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 3: Creating nginx API-only configuration...${NC}"
mkdir -p docker
if [ -f "docker/nginx-api-only.conf" ]; then
    echo "✅ API-only nginx config ready"
else
    echo -e "${RED}❌ nginx-api-only.conf not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 4: Stopping current containers...${NC}"
docker compose down 2>/dev/null || true
echo "✅ Containers stopped"

echo -e "${YELLOW}📋 Step 5: Rebuilding containers...${NC}"
docker compose build --no-cache
echo "✅ Containers rebuilt"

echo -e "${YELLOW}📋 Step 6: Starting simplified stack...${NC}"
docker compose up -d
echo "✅ Containers started"

echo -e "${YELLOW}📋 Step 7: Checking service health...${NC}"
sleep 10

# Check container status
echo "Container Status:"
docker compose ps

echo ""
echo -e "${GREEN}✅ Droplet setup complete!${NC}"
echo ""
echo "🎯 Next Steps:"
echo "1. Deploy dashboard to App Platform using app-platform-dashboard.yaml"
echo "2. Set up SSL certificates with:"
echo "   docker compose exec certbot certbot certonly \\"
echo "     --webroot --webroot-path=/var/www/certbot \\"
echo "     --email atiwar0414@gmail.com --agree-tos --no-eff-email \\"
echo "     -d memexbot.xyz"
echo "3. Test API endpoints:"
echo "   curl http://$(curl -s ifconfig.me)/api/market"
echo ""
echo "📖 Full guide: SEPARATED_ARCHITECTURE_GUIDE.md"
