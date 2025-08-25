#!/bin/bash

# 🔄 Manual Backend Update Script
# This script manually updates the backend container with leaderboard support

set -e

echo "🔄 Manually updating backend container with leaderboard support..."

# Stop current backend container
echo "🛑 Stopping current backend container..."
docker stop memex-backend-ultimate-v3 2>/dev/null || true
docker rm memex-backend-ultimate-v3 2>/dev/null || true

# Create updated enhanced-backend-server.js with leaderboard endpoints
echo "📝 Creating updated backend server..."
cat > /tmp/enhanced-backend-server.js << 'EOF'
#!/usr/bin/env node

// Enhanced backend server with all global events and faster updates

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

// Import utilities - FIXED PATH RESOLUTION
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log(`🔧 Loading .env from: ${envPath}`);
console.log(`🔍 .env exists: ${fs.existsSync(envPath)}`);

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Italian Meme Stock Exchange Backend',
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Enhanced health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    api: 'Italian Meme Stock Exchange Enhanced API',
    timestamp: new Date().toISOString(),
    port: PORT,
    uptime: process.uptime(),
    endpoints: [
      '/health',
      '/api/health', 
      '/api/market',
      '/api/stocks', 
      '/api/stock/:symbol',
      '/api/trends/:symbol',
      '/api/scrape/tiktok/:symbol',
      '/api/global-events',
      '/api/update-prices',
      '/api/leaderboard',
      '/api/users/:userId'
    ],
    stockCount: Object.keys(stockDatabase).length,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      backendPort: PORT,
      hasSupabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
      hasTwitterToken: !!process.env.TWITTER_BEARER_TOKEN,
      hasYouTubeKey: !!process.env.YOUTUBE_API_KEY,
      hasRedditCreds: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET)
    },
    globalEvents: {
      lastEventTime: enhancedGlobalEvents.lastEventTime,
      frozenStocks: Array.from(enhancedGlobalEvents.frozenStocks.keys()),
      activeMerges: enhancedGlobalEvents.getActiveMerges()
    }
  });
});

const marketPath = path.join(__dirname, 'market.json');

// Enhanced stock database with all Italian meme stocks
const stockDatabase = {
  'SKIBI': { 
    symbol: 'SKIBI', 
    italianName: 'Skibidi Toilet', 
    price: 25.50, 
    change: 0.12, 
    volume: 1000, 
    lastUpdate: Date.now(),
    description: 'The ultimate brainrot investment',
    volatility: 'high'
  },
  'RIZZL': { 
    symbol: 'RIZZL', 
    italianName: 'Rizz Lord', 
    price: 42.75, 
    change: -0.08, 
    volume: 800, 
    lastUpdate: Date.now(),
    description: 'Charismatic gains for true alphas',
    volatility: 'medium'
  },
  'GYATT': { 
    symbol: 'GYATT', 
    italianName: 'Gyatt Damn', 
    price: 15.30, 
    change: 0.25, 
    volume: 1200, 
    lastUpdate: Date.now(),
    description: 'Explosive growth potential',
    volatility: 'very-high'
  },
  'SUS': { 
    symbol: 'SUS', 
    italianName: 'Among Us', 
    price: 18.90, 
    change: -0.15, 
    volume: 950, 
    lastUpdate: Date.now(),
    description: 'Imposters among the gains',
    volatility: 'medium'
  },
  'SAHUR': { 
    symbol: 'SAHUR', 
    italianName: 'Tun Tun Sahur', 
    price: 33.20, 
    change: 0.18, 
    volume: 600, 
    lastUpdate: Date.now(),
    description: 'Dawn trading opportunities',
    volatility: 'high'
  },
  'LABUB': { 
    symbol: 'LABUB', 
    italianName: 'Labubu', 
    price: 67.80, 
    change: -0.22, 
    volume: 1100, 
    lastUpdate: Date.now(),
    description: 'Cute chaos in the markets',
    volatility: 'high'
  },
  'OHIO': { 
    symbol: 'OHIO', 
    italianName: 'Only in Ohio', 
    price: 29.45, 
    change: 0.30, 
    volume: 750, 
    lastUpdate: Date.now(),
    description: 'Wild and unpredictable',
    volatility: 'very-high'
  },
  'FRIED': { 
    symbol: 'FRIED', 
    italianName: 'Brain Fried', 
    price: 12.60, 
    change: -0.05, 
    volume: 900, 
    lastUpdate: Date.now(),
    description: 'Overloaded with potential',
    volatility: 'medium'
  },
  'SIGMA': { 
    symbol: 'SIGMA', 
    italianName: 'Sigma Male', 
    price: 51.25, 
    change: 0.40, 
    volume: 1300, 
    lastUpdate: Date.now(),
    description: 'Lone wolf trading strategy',
    volatility: 'low'
  },
  'TRALA': { 
    symbol: 'TRALA', 
    italianName: 'Tra La La', 
    price: 22.15, 
    change: -0.12, 
    volume: 700, 
    lastUpdate: Date.now(),
    description: 'Musical market movements',
    volatility: 'medium'
  },
  'CROCO': { 
    symbol: 'CROCO', 
    italianName: 'Crocop', 
    price: 38.90, 
    change: 0.15, 
    volume: 850, 
    lastUpdate: Date.now(),
    description: 'Snap up the profits',
    volatility: 'high'
  },
  'BIMBO': { 
    symbol: 'BIMBO', 
    italianName: 'Bimbo Core', 
    price: 74, 
    change: 0, 
    volume: 650, 
    lastUpdate: Date.now(),
    description: 'Pretty profits guaranteed'
  },
  'NONNA': { 
    symbol: 'NONNA', 
    italianName: 'Nonna Vibes', 
    price: 125, 
    change: 0, 
    volume: 1000, 
    lastUpdate: Date.now(),
    description: 'Traditional Italian gains'
  },
  'PASTA': { 
    symbol: 'PASTA', 
    italianName: 'Pasta La Vista', 
    price: 103, 
    change: 0, 
    volume: 800, 
    lastUpdate: Date.now(),
    description: 'Carb-loaded investments'
  },
  'GELAT': { 
    symbol: 'GELAT', 
    italianName: 'Gelato Dreams', 
    price: 89, 
    change: 0, 
    volume: 750, 
    lastUpdate: Date.now(),
    description: 'Sweet frozen assets'
  },
  'MOZZA': { 
    symbol: 'MOZZA', 
    italianName: 'Mozzarella Madness', 
    price: 97, 
    change: 0, 
    volume: 900, 
    lastUpdate: Date.now(),
    description: 'Stretchy profit margins'
  }
};

// Enhanced global events system
const enhancedGlobalEvents = {
  frozenStocks: new Map(),
  lastEventTime: Date.now(),
  eventCooldown: 30000,
  
  isStockFrozen(symbol) {
    const frozen = this.frozenStocks.get(symbol);
    if (!frozen) return false;
    
    // Check if freeze has expired
    if (Date.now() - frozen.timestamp > frozen.duration) {
      this.frozenStocks.delete(symbol);
      return false;
    }
    return true;
  },
  
  getActiveMerges() {
    return [];
  }
};

// User data management
let userData = {};
const usersPath = path.join(__dirname, 'database.json');

// Load user data
function loadUsers() {
  if (fs.existsSync(usersPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      userData = data.users || {};
    } catch (err) {
      console.log('⚠️ Error reading database.json, starting with empty users');
      userData = {};
    }
  }
}

// Save user data
function saveUsers() {
  try {
    const data = { users: userData };
    fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ Error saving users:', err.message);
  }
}

// Initialize user data
loadUsers();

// Market data endpoint
app.get('/api/market', (req, res) => {
  try {
    let marketData = {};
    
    if (fs.existsSync(marketPath)) {
      try {
        marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
      } catch (err) {
        console.log('⚠️ Error reading market.json, using stock database');
      }
    }
    
    // Merge with stock database for complete data
    const enhancedMarketData = {};
    Object.keys(stockDatabase).forEach(symbol => {
      enhancedMarketData[symbol] = {
        ...stockDatabase[symbol],
        ...marketData[symbol],
        frozen: enhancedGlobalEvents.isStockFrozen(symbol)
      };
    });
    
    // Calculate market statistics
    const stats = {
      totalStocks: Object.keys(enhancedMarketData).length,
      activeStocks: Object.keys(enhancedMarketData).length,
      totalValue: 2000000,
      lastUpdate: Date.now()
    };
    
    console.log('📊 Market data requested - returning', Object.keys(enhancedMarketData).length, 'stocks');
    res.json({
      market: enhancedMarketData,
      stats,
      lastUpdate: new Date().toISOString(),
      globalEvents: {
        frozenStocks: Array.from(enhancedGlobalEvents.frozenStocks.keys()),
        activeMerges: enhancedGlobalEvents.getActiveMerges(),
        lastEventTime: enhancedGlobalEvents.lastEventTime
      }
    });
  } catch (error) {
    console.error('❌ Error fetching market data:', error.message);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res) => {
  try {
    const users = Object.values(userData);
    
    // Calculate total value for each user (balance + portfolio value)
    const leaderboard = users.map(user => {
      let portfolioValue = 0;
      
      if (user.portfolio) {
        Object.entries(user.portfolio).forEach(([symbol, amount]) => {
          const stock = stockDatabase[symbol];
          if (stock && amount > 0) {
            portfolioValue += stock.price * amount;
          }
        });
      }
      
      const totalValue = (user.balance || 1000) + portfolioValue;
      
      return {
        id: user.id,
        username: user.username || user.displayName || user.globalName || `User_${user.id}`,
        displayName: user.displayName || user.globalName || user.username,
        balance: user.balance || 1000,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        lastActivity: user.lastActivity || Date.now()
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
    
    console.log(`📊 Leaderboard requested - returning ${leaderboard.length} users`);
    
    res.json({
      leaderboard,
      totalUsers: leaderboard.length,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error.message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Sync Discord user info
app.post('/api/users/discord-sync', (req, res) => {
  try {
    const { id, username, globalName, displayName, discriminator } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Initialize user if doesn't exist
    if (!userData[id]) {
      userData[id] = {
        id,
        balance: 1000,
        portfolio: {},
        totalValue: 1000,
        transactions: [],
        lastActivity: Date.now(),
        quests: {},
        achievements: []
      };
    }
    
    // Update Discord info
    userData[id].username = username;
    userData[id].globalName = globalName;
    userData[id].displayName = displayName;
    userData[id].discriminator = discriminator;
    userData[id].lastSync = Date.now();
    
    saveUsers();
    console.log(`✅ Discord user synced: ${username} (${id})`);
    
    res.json({
      success: true,
      user: userData[id]
    });
  } catch (error) {
    console.error('❌ Error syncing Discord user:', error.message);
    res.status(500).json({ error: 'Failed to sync Discord user' });
  }
});

// Get user info
app.get('/api/users/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const user = userData[userId];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('❌ Error fetching user:', error.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Simple price update function
const updatePrices = async () => {
  Object.keys(stockDatabase).forEach(symbol => {
    const stock = stockDatabase[symbol];
    const volatilityMap = {
      'low': 0.01,
      'medium': 0.03,
      'high': 0.05,
      'very-high': 0.08
    };
    
    const volatility = volatilityMap[stock.volatility] || 0.03;
    const change = (Math.random() - 0.5) * 2 * volatility;
    const newPrice = stock.price * (1 + change);
    const percentChange = change * 100;
    
    stockDatabase[symbol] = {
      ...stock,
      price: Math.round(newPrice * 100) / 100,
      change: Math.round(percentChange * 100) / 100,
      volume: Math.floor(Math.random() * 1000) + 500,
      lastUpdate: Date.now()
    };
  });
  
  console.log('📊 Stock prices updated for', Object.keys(stockDatabase).length, 'stocks');
};

// Manual price update endpoint
app.post('/api/update-prices', (req, res) => {
  try {
    console.log('🔄 Manual price update requested');
    updatePrices();
    res.json({
      success: true,
      message: 'Prices updated successfully',
      timestamp: new Date().toISOString(),
      stockCount: Object.keys(stockDatabase).length
    });
  } catch (error) {
    console.error('❌ Error updating prices:', error.message);
    res.status(500).json({ error: 'Failed to update prices' });
  }
});

// Schedule price updates every 2 minutes
cron.schedule('*/2 * * * *', () => {
  console.log('⏰ Scheduled price update triggered');
  updatePrices();
});

// Initial price update
updatePrices();

// Start server
app.listen(PORT, () => {
  console.log(`✅ Enhanced Backend Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Market: http://localhost:${PORT}/api/market`);
  console.log(`🔗 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  console.log(`🔗 User Sync: http://localhost:${PORT}/api/users/discord-sync`);
  console.log('🎭 Features: Market Data, User Management, Leaderboard, Real-time Updates');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
EOF

# Start new backend container with updated code
echo "🚀 Starting updated backend container..."
docker run -d \
  --name memex-backend-ultimate-v3 \
  --network memex-network-ultimate-v3 \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e BACKEND_PORT=3001 \
  -v /tmp/enhanced-backend-server.js:/app/enhanced-backend-server.js \
  node:20-alpine sh -c "
    mkdir -p /app && cd /app &&
    apk add --no-cache git curl &&
    npm init -y &&
    npm install express cors dotenv node-cron &&
    node enhanced-backend-server.js
  "

echo "⏳ Waiting for backend to start..."
sleep 15

echo "🧪 Testing backend endpoints..."
echo "📊 Health check:"
curl -s http://localhost:3001/api/health | jq '.status'

echo -e "\n📊 Leaderboard test:"
curl -s http://localhost:3001/api/leaderboard | jq '.totalUsers'

echo -e "\n✅ Backend container updated successfully!"
echo "🔗 Backend running at: http://localhost:3001"
echo "🔗 Leaderboard: http://localhost:3001/api/leaderboard"
