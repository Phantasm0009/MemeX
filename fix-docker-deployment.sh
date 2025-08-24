#!/bin/bash

# 🔧 Complete Docker Deployment Fix Script for memexbot.xyz
# This script fixes all the identified issues and rebuilds the containers

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Docker Deployment Issues for memexbot.xyz${NC}"
echo "============================================================"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Stopping and cleaning up existing containers${NC}"
docker compose down || true
docker rmi memexbot-backend memexbot-dashboard memexbot-discord-bot 2>/dev/null || true

echo -e "${YELLOW}📋 Step 2: Updating Dockerfiles to Node.js 20${NC}"

# Update main Dockerfile
if grep -q "FROM node:18-alpine" Dockerfile; then
    sed -i 's/FROM node:18-alpine AS base/FROM node:20-alpine AS base/g' Dockerfile
    echo -e "${GREEN}✅ Updated main Dockerfile to Node.js 20${NC}"
else
    echo -e "${GREEN}✅ Main Dockerfile already using correct Node.js version${NC}"
fi

# Update dashboard Dockerfile
if [ -f "dashboard/Dockerfile" ] && grep -q "FROM node:18-alpine" dashboard/Dockerfile; then
    sed -i 's/FROM node:18-alpine/FROM node:20-alpine/g' dashboard/Dockerfile
    echo -e "${GREEN}✅ Updated dashboard Dockerfile to Node.js 20${NC}"
else
    echo -e "${GREEN}✅ Dashboard Dockerfile already using correct Node.js version${NC}"
fi

echo -e "${YELLOW}📋 Step 3: Fixing docker-compose.yml format${NC}"

# Remove version field if it exists
if grep -q "^version:" docker-compose.yml; then
    sed -i '/^version:/d' docker-compose.yml
    echo -e "${GREEN}✅ Removed deprecated version field from docker-compose.yml${NC}"
fi

# Fix certbot command syntax if needed
if grep -q 'command: echo "Certbot container ready for SSL certificate generation"' docker-compose.yml; then
    sed -i 's/command: echo "Certbot container ready for SSL certificate generation"/command: ["sh", "-c", "echo '\''Certbot ready'\'' \&\& sleep infinity"]/g' docker-compose.yml
    echo -e "${GREEN}✅ Fixed certbot command syntax in docker-compose.yml${NC}"
fi

echo -e "${YELLOW}📋 Step 4: Validating docker-compose.yml syntax${NC}"
if docker compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✅ docker-compose.yml syntax is valid${NC}"
else
    echo -e "${RED}❌ docker-compose.yml syntax error detected${NC}"
    docker compose config
    exit 1
fi

echo -e "${YELLOW}📋 Step 5: Building containers with Node.js 20${NC}"
docker compose build --no-cache

echo -e "${YELLOW}📋 Step 6: Starting services${NC}"
docker compose up -d

echo -e "${YELLOW}📋 Step 7: Waiting for services to start (30 seconds)${NC}"
sleep 30

echo -e "${YELLOW}📋 Step 8: Checking service status${NC}"
docker compose ps

echo -e "${YELLOW}📋 Step 9: Checking service logs for errors${NC}"

echo -e "${BLUE}Backend logs:${NC}"
docker logs memex-backend --tail 10

echo -e "${BLUE}Discord bot logs:${NC}"
docker logs memex-discord-bot --tail 10

echo -e "${BLUE}Dashboard logs:${NC}"
docker logs memex-dashboard --tail 10

echo -e "${BLUE}Nginx logs:${NC}"
docker logs memex-nginx --tail 10

echo ""
echo -e "${GREEN}🎉 Docker deployment fix completed!${NC}"
echo ""
echo -e "${BLUE}📊 Next steps:${NC}"
echo "1. Check if all services are running: docker compose ps"
echo "2. Monitor logs: docker compose logs -f"
echo "3. Test the API: curl http://localhost:3001/api/health"
echo "4. Test the dashboard: curl http://localhost:3002"
echo "5. Generate SSL certificates once services are stable:"
echo "   docker compose exec certbot certbot certonly --webroot --webroot-path=/var/www/certbot --email your-email@domain.com --agree-tos --no-eff-email -d memexbot.xyz -d www.memexbot.xyz"
echo ""
echo -e "${YELLOW}🔧 If you still see issues, check individual service logs:${NC}"
echo "   docker logs memex-backend"
echo "   docker logs memex-discord-bot"
echo "   docker logs memex-dashboard"
echo "   docker logs memex-nginx"
