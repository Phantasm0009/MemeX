#!/bin/bash

# 🔧 Simple Backend API Fix
# The issue is that the backend container is running Discord bot code instead of just the API

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Backend Container - API Only${NC}"
echo "=============================================="

echo -e "${YELLOW}📋 Current issue: Backend container running Discord bot instead of API server${NC}"
echo ""

# Create a dedicated API-only backend script
echo -e "${BLUE}📝 Creating API-only backend server...${NC}"

cat > api-only-backend.js << 'EOF'
#!/usr/bin/env node

// 🔧 API-Only Backend Server
// This ONLY starts the Express API server, not the Discord bot

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🚀 Starting API-Only Backend Server');
console.log('====================================');

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase connected');
} else {
    console.log('⚠️  Supabase not configured, using local data');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'Italian Meme Stock Exchange API',
        timestamp: new Date().toISOString(),
        port: PORT 
    });
});

// Basic market endpoint
app.get('/api/market', async (req, res) => {
    try {
        // Load market data from file
        const fs = await import('fs/promises');
        const path = await import('path');
        const marketPath = path.join(__dirname, 'market.json');
        
        const marketData = await fs.readFile(marketPath, 'utf8');
        const market = JSON.parse(marketData);
        
        res.json(market);
    } catch (error) {
        console.error('Market endpoint error:', error);
        res.status(500).json({ error: 'Failed to load market data' });
    }
});

// Basic leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('balance', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            res.json(data || []);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Leaderboard endpoint error:', error);
        res.json([]);
    }
});

// Basic transactions endpoint
app.get('/api/transactions', async (req, res) => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            res.json(data || []);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Transactions endpoint error:', error);
        res.json([]);
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ API Server listening on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Market data: http://localhost:${PORT}/api/market`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

EOF

echo ""
echo -e "${BLUE}📝 Updating docker-compose.yml for API-only backend...${NC}"

# Backup current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Update the backend service command to use API-only script
sed -i 's|command: \["node", "backend/server.js"\]|command: ["node", "api-only-backend.js"]|g' docker-compose.yml

echo ""
echo -e "${BLUE}🔄 Rebuilding backend container...${NC}"

# Stop and remove the backend container
docker-compose stop backend
docker-compose rm -f backend

# Rebuild and start with new configuration
docker-compose up -d --build backend

echo ""
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 15

echo ""
echo -e "${BLUE}📊 Container status:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}📝 Backend logs:${NC}"
docker logs backend --tail 15

echo ""
echo -e "${BLUE}🧪 Testing backend API...${NC}"
sleep 5

# Test direct backend connection
echo "1. Testing backend health endpoint..."
docker exec backend wget -q -O - http://localhost:3001/api/health 2>/dev/null && echo "✅ Backend responding internally" || echo "❌ Backend not responding internally"

echo ""
echo "2. Testing nginx -> backend connection..."
docker exec nginx wget -q -O - http://backend:3001/api/health 2>/dev/null && echo "✅ Nginx can reach backend" || echo "❌ Nginx cannot reach backend"

echo ""
echo "3. Testing external HTTPS endpoint..."
curl -k https://localhost/api/health 2>/dev/null && echo "✅ HTTPS endpoint working" || echo "❌ HTTPS endpoint still failing"

echo ""
echo -e "${GREEN}🎯 API-only backend fix completed!${NC}"
