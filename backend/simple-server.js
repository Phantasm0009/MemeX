// Simplified backend server with quests and leaderboard endpoints
// Removes problematic dependencies that cause module loading errors

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Basic imports only - no complex dependencies
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('🚀 Starting Simple Italian Meme Stock Exchange Backend');
console.log(`🔧 Loading .env from: ${envPath}`);
console.log(`🔍 .env exists: ${fs.existsSync(envPath)}`);

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Market data paths
const marketPath = path.join(__dirname, '../market.json');
const metaPath = path.join(__dirname, '../meta.json');
const databasePath = path.join(__dirname, '../database.json');

console.log(`📊 Market file: ${marketPath} (exists: ${fs.existsSync(marketPath)})`);
console.log(`📋 Meta file: ${metaPath} (exists: ${fs.existsSync(metaPath)})`);
console.log(`💾 Database file: ${databasePath} (exists: ${fs.existsSync(databasePath)})`);

// Initialize market and database if they don't exist
function initializeFiles() {
  if (!fs.existsSync(marketPath)) {
    const defaultMarket = {
      "SKIBI": { price: 12.50, change: 0, lastUpdate: Date.now(), volatility: "high" },
      "SUS": { price: 15.30, change: 0, lastUpdate: Date.now(), volatility: "medium" },
      "SAHUR": { price: 8.90, change: 0, lastUpdate: Date.now(), volatility: "low" },
      "LABUB": { price: 22.15, change: 0, lastUpdate: Date.now(), volatility: "extreme" },
      "OHIO": { price: 5.75, change: 0, lastUpdate: Date.now(), volatility: "high" },
      "RIZZL": { price: 18.40, change: 0, lastUpdate: Date.now(), volatility: "medium" },
      "GYATT": { price: 11.20, change: 0, lastUpdate: Date.now(), volatility: "high" },
      "FRIED": { price: 25.80, change: 0, lastUpdate: Date.now(), volatility: "extreme" }
    };
    fs.writeFileSync(marketPath, JSON.stringify(defaultMarket, null, 2));
    console.log('✅ Initialized default market data');
  }

  if (!fs.existsSync(databasePath)) {
    const defaultDb = { users: {}, holdings: {}, transactions: [] };
    fs.writeFileSync(databasePath, JSON.stringify(defaultDb, null, 2));
    console.log('✅ Initialized default database');
  }
}

// Basic database functions
function loadDatabase() {
  try {
    return JSON.parse(fs.readFileSync(databasePath, 'utf8'));
  } catch (error) {
    console.error('Error loading database:', error);
    return { users: {}, holdings: {}, transactions: [] };
  }
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Generate simple daily quests
function generateDailyQuests(date = null) {
  const questDate = date || new Date().toISOString().split('T')[0];
  
  return [
    {
      id: 'daily_login',
      title: '🇮🇹 Daily Check-in',
      description: 'Visit the Italian Meme Stock Exchange',
      target: 1,
      progress: 0,
      reward: 50,
      type: 'login',
      completed: false
    },
    {
      id: 'send_messages',
      title: '💬 Chat Participation',
      description: 'Send 5 messages in any channel',
      target: 5,
      progress: 0,
      reward: 75,
      type: 'message',
      completed: false
    },
    {
      id: 'make_trade',
      title: '📈 Execute Trade',
      description: 'Buy or sell any stock',
      target: 1,
      progress: 0,
      reward: 100,
      type: 'trade',
      completed: false
    },
    {
      id: 'react_messages',
      title: '😀 Show Reactions',
      description: 'React to 3 messages with any emoji',
      target: 3,
      progress: 0,
      reward: 30,
      type: 'reaction',
      completed: false
    }
  ];
}

// API Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    api: 'Italian Meme Stock Exchange Simple API',
    timestamp: new Date().toISOString(),
    port: PORT.toString(),
    uptime: process.uptime(),
    endpoints: [
      '/health',
      '/api/health',
      '/api/market',
      '/api/stocks',
      '/api/stock/:symbol',
      '/api/global-events',
      '/api/quests',
      '/api/leaderboard',
      '/api/update-prices'
    ]
  });
});

app.get('/api/health', (req, res) => {
  const market = fs.existsSync(marketPath) ? JSON.parse(fs.readFileSync(marketPath)) : {};
  const stockCount = Object.keys(market).length;
  
  res.json({
    status: 'healthy',
    api: 'Italian Meme Stock Exchange Simple API',
    timestamp: new Date().toISOString(),
    port: PORT.toString(),
    uptime: process.uptime(),
    endpoints: [
      '/health',
      '/api/health',
      '/api/market',
      '/api/stocks', 
      '/api/stock/:symbol',
      '/api/global-events',
      '/api/quests',
      '/api/leaderboard',
      '/api/update-prices'
    ],
    stockCount,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      backendPort: PORT
    }
  });
});

app.get('/api/market', (req, res) => {
  try {
    if (!fs.existsSync(marketPath)) {
      return res.status(404).json({ error: 'Market data not found' });
    }
    
    const market = JSON.parse(fs.readFileSync(marketPath));
    
    res.json({
      market,
      lastUpdate: new Date().toISOString(),
      totalStocks: Object.keys(market).length
    });
    
    console.log(`📊 Market data requested - returning ${Object.keys(market).length} stocks`);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stocks', (req, res) => {
  try {
    if (!fs.existsSync(marketPath)) {
      return res.status(404).json({ error: 'Market data not found' });
    }
    
    const market = JSON.parse(fs.readFileSync(marketPath));
    
    res.json({
      stocks: market,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stock/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const market = JSON.parse(fs.readFileSync(marketPath));
    const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath)) : {};
    
    if (!market[symbol.toUpperCase()]) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    res.json({
      symbol: symbol.toUpperCase(),
      data: market[symbol.toUpperCase()],
      meta: meta[symbol.toUpperCase()] || {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/global-events', (req, res) => {
  try {
    res.json({
      events: [],
      lastEventTime: null,
      frozenStocks: [],
      activeMerges: [],
      timestamp: new Date().toISOString(),
      message: 'Global events system simplified'
    });
  } catch (error) {
    console.error('Error fetching global events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW: Quests API endpoint
app.get('/api/quests', async (req, res) => {
  try {
    console.log('🎯 API request: Fetching global daily quests...');
    
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const quests = generateDailyQuests(date);
    
    res.json({
      date,
      quests,
      timestamp: new Date().toISOString(),
      success: true,
      message: 'Daily quests generated successfully'
    });
    
    console.log(`✅ Returned ${quests.length} daily quests for ${date}`);
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// NEW: Leaderboard API endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('🏆 API request: Fetching leaderboard...');
    
    const limit = parseInt(req.query.limit) || 10;
    const database = loadDatabase();
    
    if (!database.users || Object.keys(database.users).length === 0) {
      return res.json({
        leaderboard: [],
        totalUsers: 0,
        timestamp: new Date().toISOString(),
        success: true,
        message: 'No users found in database'
      });
    }
    
    // Convert users object to array and calculate total wealth
    const users = Object.entries(database.users).map(([id, user]) => {
      const holdings = database.holdings[id] || {};
      let portfolioValue = 0;
      
      // Calculate portfolio value if market data exists
      if (fs.existsSync(marketPath)) {
        const market = JSON.parse(fs.readFileSync(marketPath));
        portfolioValue = Object.entries(holdings).reduce((total, [stock, amount]) => {
          const stockPrice = market[stock]?.price || 0;
          return total + (stockPrice * amount);
        }, 0);
      }
      
      const totalValue = (user.balance || 0) + portfolioValue;
      
      return {
        id,
        username: user.username || `User#${id.slice(-4)}`,
        displayName: user.username || `User#${id.slice(-4)}`,
        balance: user.balance || 0,
        portfolioValue: Math.round(portfolioValue * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        lastDaily: user.lastDaily || null,
        lastMessage: user.lastMessage || null
      };
    });
    
    // Sort by total value descending
    const sortedUsers = users
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, Math.min(limit, 20));
    
    // Add ranking
    const leaderboard = sortedUsers.map((user, index) => ({
      rank: index + 1,
      ...user
    }));
    
    res.json({
      leaderboard,
      totalUsers: Object.keys(database.users).length,
      limit,
      timestamp: new Date().toISOString(),
      success: true
    });
    
    console.log(`✅ Returned leaderboard with ${leaderboard.length} users`);
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: error.message 
    });
  }
});

app.post('/api/update-prices', (req, res) => {
  try {
    console.log('🔄 API request: Manual price update...');
    
    const market = JSON.parse(fs.readFileSync(marketPath));
    
    // Simple price update - random changes
    Object.keys(market).forEach(symbol => {
      const change = (Math.random() - 0.5) * 0.1; // ±5% change
      const newPrice = market[symbol].price * (1 + change);
      market[symbol].price = Math.max(0.1, Math.round(newPrice * 100) / 100);
      market[symbol].change = change * 100;
      market[symbol].lastUpdate = Date.now();
    });
    
    fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
    
    res.json({
      success: true,
      message: 'Prices updated successfully',
      updatedStocks: Object.keys(market).length,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✅ Updated prices for ${Object.keys(market).length} stocks`);
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ error: 'Failed to update prices' });
  }
});

// Initialize files
initializeFiles();

// Simple price update scheduler (every 15 minutes)
cron.schedule('*/15 * * * *', () => {
  console.log('⏰ Scheduled price update triggered');
  try {
    const market = JSON.parse(fs.readFileSync(marketPath));
    
    Object.keys(market).forEach(symbol => {
      const change = (Math.random() - 0.5) * 0.08; // ±4% change
      const newPrice = market[symbol].price * (1 + change);
      market[symbol].price = Math.max(0.1, Math.round(newPrice * 100) / 100);
      market[symbol].change = change * 100;
      market[symbol].lastUpdate = Date.now();
    });
    
    fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
    console.log(`📈 Auto-updated prices for ${Object.keys(market).length} stocks`);
  } catch (error) {
    console.error('Error in scheduled price update:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n🎉 ===== SIMPLE BACKEND SERVER STARTED =====');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('\n📡 Available Endpoints:');
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Market: http://localhost:${PORT}/api/market`);
  console.log(`🔗 Stocks: http://localhost:${PORT}/api/stocks`);
  console.log(`🔗 Stock Info: http://localhost:${PORT}/api/stock/SKIBI`);
  console.log(`🔗 Global Events: http://localhost:${PORT}/api/global-events`);
  console.log(`🎯 Daily Quests: http://localhost:${PORT}/api/quests`);
  console.log(`🏆 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  console.log(`🔗 Update Prices: http://localhost:${PORT}/api/update-prices (POST)`);
  console.log('\n🎭 Features: Simple Market Data, Daily Quests, Leaderboard, Scheduled Updates');
  console.log('✅ No complex dependencies - should work reliably!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  process.exit(0);
});
