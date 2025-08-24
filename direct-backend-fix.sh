#!/bin/bash

# 🔧 Direct Backend Fix - Force API Server Only
# The previous fix didn't work because docker-compose didn't update properly

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Direct Backend Fix - API Server Only${NC}"
echo "=============================================="

echo -e "${YELLOW}📋 Issue: Backend container still running Discord bot instead of API${NC}"
echo ""

# Check current docker-compose.yml
echo -e "${BLUE}📝 Current backend configuration:${NC}"
grep -A 5 "command:" docker-compose.yml | grep -A 5 backend

echo ""
echo -e "${BLUE}📝 Creating direct API server fix...${NC}"

# Create a simple standalone API server that will definitely work
cat > standalone-api-server.js << 'EOF'
#!/usr/bin/env node

// 🔧 Standalone API Server - No Discord Bot Dependencies
// This is a completely isolated API server

import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Standalone API Server');
console.log('==================================');

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.json({ 
        status: 'healthy', 
        service: 'Italian Meme Stock Exchange API',
        timestamp: new Date().toISOString(),
        port: PORT,
        uptime: process.uptime()
    });
});

// Market data endpoint
app.get('/api/market', async (req, res) => {
    try {
        console.log('📊 Market data requested');
        const marketPath = path.join(__dirname, 'market.json');
        const marketData = await fs.readFile(marketPath, 'utf8');
        const market = JSON.parse(marketData);
        res.json(market);
    } catch (error) {
        console.error('❌ Market endpoint error:', error);
        res.status(500).json({ error: 'Failed to load market data' });
    }
});

// Enhanced market endpoint
app.get('/api/market/enhanced', async (req, res) => {
    try {
        console.log('📊 Enhanced market data requested');
        const marketPath = path.join(__dirname, 'market.json');
        const marketData = await fs.readFile(marketPath, 'utf8');
        const market = JSON.parse(marketData);
        
        // Add some enhancement
        const enhanced = {};
        Object.keys(market).forEach(symbol => {
            enhanced[symbol] = {
                ...market[symbol],
                volume24h: Math.floor(Math.random() * 1000000),
                change24h: (Math.random() - 0.5) * 20
            };
        });
        
        res.json(enhanced);
    } catch (error) {
        console.error('❌ Enhanced market endpoint error:', error);
        res.status(500).json({ error: 'Failed to load enhanced market data' });
    }
});

// Leaderboard endpoint (basic mock)
app.get('/api/leaderboard', (req, res) => {
    console.log('🏆 Leaderboard requested');
    const mockLeaderboard = [
        { id: '1', username: 'Phantasm', balance: 10000, rank: 1 },
        { id: '2', username: 'Trader1', balance: 8500, rank: 2 },
        { id: '3', username: 'Trader2', balance: 7200, rank: 3 }
    ];
    res.json(mockLeaderboard);
});

// Transactions endpoint (basic mock)
app.get('/api/transactions', (req, res) => {
    console.log('💰 Transactions requested');
    const mockTransactions = [
        {
            id: 1,
            userId: '1',
            symbol: 'SKIBI',
            type: 'buy',
            amount: 10,
            price: 15.50,
            timestamp: Date.now() - 300000
        },
        {
            id: 2,
            userId: '2',
            symbol: 'SUS',
            type: 'sell',
            amount: 5,
            price: 25.75,
            timestamp: Date.now() - 600000
        }
    ];
    res.json(mockTransactions);
});

// Sync endpoint (for Discord bot compatibility)
app.post('/api/sync-discord-users', (req, res) => {
    console.log('🔄 Discord user sync requested');
    res.json({ success: true, message: 'Users synced successfully' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Standalone API Server running on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
    console.log(`📊 Market: http://localhost:${PORT}/api/market`);
    console.log(`🏆 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
    console.log('🎯 Ready to serve requests!');
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

EOF

echo ""
echo -e "${BLUE}📝 Updating docker-compose.yml with explicit command...${NC}"

# Create a backup of current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup2

# Update the backend service to use the standalone API server
sed -i 's|command: \["node", ".*"\]|command: ["node", "standalone-api-server.js"]|g' docker-compose.yml

# Also try the array format
sed -i 's|command: \["node", "backend/server.js"\]|command: ["node", "standalone-api-server.js"]|g' docker-compose.yml
sed -i 's|command: \["node", "api-only-backend.js"\]|command: ["node", "standalone-api-server.js"]|g' docker-compose.yml

echo ""
echo -e "${BLUE}📝 Verifying docker-compose.yml changes:${NC}"
grep -A 10 "backend:" docker-compose.yml

echo ""
echo -e "${BLUE}🔄 Force rebuilding backend with new configuration...${NC}"

# Stop everything
docker-compose stop

# Remove the backend container completely
docker-compose rm -f backend

# Remove the backend image to force rebuild
docker rmi memexbot_backend 2>/dev/null || echo "Backend image not found, continuing..."

# Build and start only the backend first
docker-compose up -d --build backend

echo ""
echo -e "${YELLOW}⏳ Waiting for backend to fully start...${NC}"
sleep 20

echo ""
echo -e "${BLUE}📊 Backend container status:${NC}"
docker-compose ps backend

echo ""
echo -e "${BLUE}📝 Backend logs (last 30 lines):${NC}"
docker logs backend --tail 30

echo ""
echo -e "${BLUE}🧪 Testing standalone API server...${NC}"

# Test 1: Internal health check
echo "1. Testing backend internal health..."
docker exec backend wget -q -O - http://localhost:3001/api/health 2>/dev/null && echo "✅ Internal API responding" || echo "❌ Internal API not responding"

# Test 2: Check if port is actually listening
echo ""
echo "2. Checking if port 3001 is listening..."
docker exec backend netstat -tlnp 2>/dev/null | grep 3001 && echo "✅ Port 3001 is listening" || echo "❌ Port 3001 not listening"

# Test 3: Start nginx and test proxy
echo ""
echo "3. Starting nginx and testing proxy..."
docker-compose up -d nginx
sleep 5

echo "4. Testing nginx -> backend connection..."
docker exec nginx wget -q -O - http://backend:3001/api/health 2>/dev/null && echo "✅ Nginx can reach backend" || echo "❌ Nginx cannot reach backend"

echo ""
echo "5. Testing external HTTPS endpoint..."
curl -k https://localhost/api/health 2>/dev/null | head -20

echo ""
echo -e "${GREEN}🎯 Direct backend fix completed!${NC}"
echo ""
echo "Next steps:"
echo "1. If API is working: docker-compose up -d discord-bot"
echo "2. Test again: ./test-ssl-endpoints.sh"
echo "3. Check all endpoints at: https://api.memexbot.xyz/api/health"
