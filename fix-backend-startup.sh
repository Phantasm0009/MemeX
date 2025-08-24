#!/bin/bash

# 🔧 Fix Backend Startup Issues
# This script fixes the backend container so the API server starts properly

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Backend API Server Startup${NC}"
echo "================================================="

# Check which backend file is being used in docker-compose
echo -e "${YELLOW}📋 Current backend configuration:${NC}"
grep -A 10 "backend:" docker-compose.yml

echo ""
echo -e "${YELLOW}🔍 Checking backend files available:${NC}"
ls -la backend/
ls -la enhanced-backend-server.js 2>/dev/null || echo "enhanced-backend-server.js not found"
ls -la simple-backend.js 2>/dev/null || echo "simple-backend.js not found"

# The issue is likely that only the Discord bot is starting, not the Express server
# Let's update the backend to use a combined service that starts both

echo ""
echo -e "${BLUE}📝 Creating combined backend service...${NC}"

# Create a new backend service that starts both Discord bot AND Express API
cat > combined-backend.js << 'EOF'
#!/usr/bin/env node

// 🎯 Combined Backend Service - Discord Bot + Express API
// This ensures both the Discord bot AND the API server start together

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🚀 Starting Combined Backend Service (Discord Bot + API)');
console.log('=====================================================');

// Start Express API Server
console.log('📊 Starting Express API Server...');
import('./backend/server.js').then(() => {
    console.log('✅ Express API Server started');
}).catch(error => {
    console.error('❌ Failed to start Express API Server:', error);
    process.exit(1);
});

// Start Discord Bot
console.log('🤖 Starting Discord Bot...');
import('./index.js').then(() => {
    console.log('✅ Discord Bot started');
}).catch(error => {
    console.error('❌ Failed to start Discord Bot:', error);
    process.exit(1);
});

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    process.exit(0);
});

console.log('🔄 Combined service started, both Discord bot and API should be running...');
EOF

# Update docker-compose.yml to use the combined backend
echo ""
echo -e "${BLUE}📝 Updating docker-compose.yml...${NC}"

# Backup current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Update the backend service command
sed -i 's|command: node index\.js|command: node combined-backend.js|g' docker-compose.yml

echo ""
echo -e "${BLUE}🔄 Rebuilding and restarting backend container...${NC}"

# Stop the current backend
docker-compose stop backend

# Remove the old container
docker-compose rm -f backend

# Rebuild and start the backend
docker-compose up -d --build backend

echo ""
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 10

echo ""
echo -e "${BLUE}📊 Checking backend status...${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}📝 Backend logs (last 20 lines):${NC}"
docker logs backend --tail 20

echo ""
echo -e "${BLUE}🧪 Testing backend API endpoint...${NC}"
sleep 5

# Test the API endpoint
echo "Testing internal backend connection..."
docker exec nginx wget -q -O - http://backend:3001/api/health 2>/dev/null && echo "✅ Backend API responding" || echo "❌ Backend API still not responding"

echo ""
echo -e "${BLUE}🧪 Testing external SSL endpoint...${NC}"
curl -k https://localhost/api/health 2>/dev/null && echo "✅ SSL endpoint working" || echo "❌ SSL endpoint still failing"

echo ""
echo -e "${GREEN}🎯 Backend startup fix completed!${NC}"
echo ""
echo "If the API is still not working, check:"
echo "1. docker logs backend"
echo "2. docker exec backend netstat -tlnp"
echo "3. ./test-ssl-endpoints.sh"
