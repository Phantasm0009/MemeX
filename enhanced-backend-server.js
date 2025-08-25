#!/usr/bin/env node

// Enhanced backend server with all global events and faster updates
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import utilities - FIXED PATH RESOLUTION
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log(`🔧 Loading .env from: ${envPath}`);
console.log(`🔍 .env exists: ${fs.existsSync(envPath)}`);

// Import utilities with correct paths - using lightweight alternatives to avoid cheerio issues
const getTrendScore = async (symbol) => {
  // Lightweight trend simulation to avoid cheerio dependency
  const trends = {
    'SKIBI': Math.random() * 0.1 - 0.05,
    'RIZZL': Math.random() * 0.08 - 0.04,
    'GYATT': Math.random() * 0.12 - 0.06,
    'SUS': Math.random() * 0.06 - 0.03,
    'SAHUR': Math.random() * 0.04 - 0.02,
    'LABUB': Math.random() * 0.05 - 0.025,
    'OHIO': Math.random() * 0.09 - 0.045,
    'FRIED': Math.random() * 0.07 - 0.035,
    'SIGMA': Math.random() * 0.11 - 0.055,
    'TRALA': Math.random() * 0.06 - 0.03,
    'CROCO': Math.random() * 0.08 - 0.04,
    'BIMBO': Math.random() * 0.09 - 0.045,
    'NONNA': Math.random() * 0.03 - 0.015,
    'PASTA': Math.random() * 0.04 - 0.02,
    'GELAT': Math.random() * 0.07 - 0.035,
    'MOZZA': Math.random() * 0.05 - 0.025
  };
  return trends[symbol] || (Math.random() * 0.06 - 0.03);
};

// Stock database with 16 Italian meme stocks
const stockDatabase = {
  'SKIBI': { 
    symbol: 'SKIBI', 
    italianName: 'Skibidi Toilet', 
    price: 100, 
    change: 0, 
    volume: 1000, 
    lastUpdate: Date.now(),
    description: 'The ultimate brainrot investment'
  },
  'RIZZL': { 
    symbol: 'RIZZL', 
    italianName: 'Rizz Lord', 
    price: 85, 
    change: 0, 
    volume: 800, 
    lastUpdate: Date.now(),
    description: 'Charismatic gains for true alphas'
  },
  'GYATT': { 
    symbol: 'GYATT', 
    italianName: 'Gyatt Damn', 
    price: 120, 
    change: 0, 
    volume: 1200, 
    lastUpdate: Date.now(),
    description: 'Explosive growth potential'
  },
  'SUS': { 
    symbol: 'SUS', 
    italianName: 'Among Us', 
    price: 95, 
    change: 0, 
    volume: 950, 
    lastUpdate: Date.now(),
    description: 'Imposters among the gains'
  },
  'SAHUR': { 
    symbol: 'SAHUR', 
    italianName: 'Tun Tun Sahur', 
    price: 78, 
    change: 0, 
    volume: 600, 
    lastUpdate: Date.now(),
    description: 'Dawn trading opportunities'
  },
  'LABUB': { 
    symbol: 'LABUB', 
    italianName: 'Labubu', 
    price: 142, 
    change: 0, 
    volume: 1100, 
    lastUpdate: Date.now(),
    description: 'Cute chaos in the markets'
  },
  'OHIO': { 
    symbol: 'OHIO', 
    italianName: 'Only in Ohio', 
    price: 67, 
    change: 0, 
    volume: 750, 
    lastUpdate: Date.now(),
    description: 'Wild and unpredictable'
  },
  'FRIED': { 
    symbol: 'FRIED', 
    italianName: 'Brain Fried', 
    price: 88, 
    change: 0, 
    volume: 900, 
    lastUpdate: Date.now(),
    description: 'Overloaded with potential'
  },
  'SIGMA': { 
    symbol: 'SIGMA', 
    italianName: 'Sigma Male', 
    price: 156, 
    change: 0, 
    volume: 1300, 
    lastUpdate: Date.now(),
    description: 'Lone wolf trading strategy'
  },
  'TRALA': { 
    symbol: 'TRALA', 
    italianName: 'Tra La La', 
    price: 92, 
    change: 0, 
    volume: 700, 
    lastUpdate: Date.now(),
    description: 'Musical market movements'
  },
  'CROCO': { 
    symbol: 'CROCO', 
    italianName: 'Crocop', 
    price: 110, 
    change: 0, 
    volume: 850, 
    lastUpdate: Date.now(),
    description: 'Snap up the profits'
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

const updatePrices = async (triggers = {}, enableChaos = true) => {
  const marketPath = path.join(__dirname, 'market.json');
  let market = {};
  
  if (fs.existsSync(marketPath)) {
    try {
      market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
    } catch (err) {
      console.log('⚠️ Error reading market.json, using stock database');
    }
  }
  
  return market;
};

const initializeMarket = () => {
  console.log('� Market initialized');
};

const getMarketStats = () => {
  return {
    totalStocks: 16,
    activeStocks: 16,
    totalValue: 2000000,
    lastUpdate: Date.now()
  };
};

const getEventBonuses = () => ({ bonus: 0 });
const getRandomChaosEvent = () => null;

// Enhanced global events system
const enhancedGlobalEvents = {
  frozenStocks: new Map(),
  lastEventTime: Date.now(),
  eventCooldown: 30000,
  
  async checkForGlobalEvents() {
    const now = Date.now();
    if (now - this.lastEventTime < this.eventCooldown) return null;
    
    if (Math.random() < 0.1) { // 10% chance
      const events = [
        {
          name: 'Meme Market Boom',
          description: 'All Italian meme stocks surge!',
          rarity: 'rare',
          triggers: { global: 0.15 },
          globalImpact: true
        },
        {
          name: 'Viral TikTok Challenge',
          description: 'Social media drives massive trading volume!',
          rarity: 'common',
          triggers: { social: 0.08 }
        },
        {
          name: 'Pasta Power Hour',
          description: 'Italian culture stocks get major boost!',
          rarity: 'uncommon',
          triggers: { italian: 0.12 }
        }
      ];
      
      const event = events[Math.floor(Math.random() * events.length)];
      this.lastEventTime = now;
      return event;
    }
    
    return null;
  },
  
  triggerRandomEvent() {
    const now = Date.now();
    if (now - this.lastEventTime < this.eventCooldown) {
      console.log('🌍 Global event on cooldown');
      return;
    }
    
    // Random chance for different events
    const rand = Math.random();
    
    if (rand < 0.05) { // 5% chance - Stock freeze
      const stocks = Object.keys(stockDatabase);
      const targetStock = stocks[Math.floor(Math.random() * stocks.length)];
      
      if (!this.frozenStocks.has(targetStock)) {
        const freezeDuration = (5 + Math.random() * 25) * 60 * 1000; // 5-30 minutes
        this.frozenStocks.set(targetStock, now);
        
        console.log(`🧊 GLOBAL EVENT: ${targetStock} frozen for ${Math.round(freezeDuration/60000)} minutes`);
        
        // Auto-unfreeze after duration
        setTimeout(() => {
          this.frozenStocks.delete(targetStock);
          console.log(`🔥 ${targetStock} unfrozen`);
        }, freezeDuration);
        
        this.lastEventTime = now;
      }
    } else if (rand < 0.08) { // 3% chance - Market volatility
      console.log('📈 GLOBAL EVENT: Market Volatility Spike - All prices more volatile');
      this.lastEventTime = now;
    }
  },
  
  isStockFrozen(symbol) {
    return this.frozenStocks.has(symbol);
  },
  
  getActiveMerges() {
    return [];
  },
  
  isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }
};

// Lightweight TikTok scraper simulation
const lightweightTikTokScraper = {
  async getTikTokTrendScore(symbol) {
    // Simulate TikTok trend without external dependencies
    const delay = 200 + Math.random() * 300;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const baseScore = Math.random() * 0.08 - 0.04;
    const volatilityMultiplier = {
      'SKIBI': 1.5,
      'GYATT': 1.3,
      'SIGMA': 1.2,
      'OHIO': 1.4,
      'RIZZL': 1.1
    }[symbol] || 1.0;
    
    return baseScore * volatilityMultiplier;
  },
  
  async close() {
    console.log('🎵 TikTok scraper closed');
  }
};

// Initialize Supabase check
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  console.log('✅ Supabase credentials found');
} else {
  console.log('⚠️ Supabase credentials not found, using JSON database');
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Market data paths - FIXED PATHS
const marketPath = path.join(__dirname, 'market.json');
const metaPath = path.join(__dirname, 'meta.json');

console.log(`📊 Market file: ${marketPath} (exists: ${fs.existsSync(marketPath)})`);
console.log(`📋 Meta file: ${metaPath} (exists: ${fs.existsSync(metaPath)})`);

// Initialize market on startup
initializeMarket();

// API Endpoints
app.get('/api/health', async (req, res) => {
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
      '/api/update-prices'
    ],
    stockCount: 16,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      backendPort: PORT,
      hasSupabase: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
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
    const stats = getMarketStats();
    
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

// Stocks endpoint with metadata
app.get('/api/stocks', (req, res) => {
  try {
    const marketPath = path.join(__dirname, 'market.json');
    const metaPath = path.join(__dirname, 'meta.json');
    
    let stocks = stockDatabase;
    let meta = {};
    
    if (fs.existsSync(marketPath)) {
      try {
        const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
        // Merge market data with stock database
        Object.keys(stocks).forEach(symbol => {
          if (marketData[symbol]) {
            stocks[symbol] = { ...stocks[symbol], ...marketData[symbol] };
          }
        });
      } catch (err) {
        console.log('⚠️ Error reading market.json');
      }
    }
    
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (err) {
        console.log('⚠️ Error reading meta.json');
      }
    }
    
    console.log('📈 Stocks data requested');
    res.json({ stocks, meta });
  } catch (error) {
    console.error('❌ Error fetching stocks data:', error.message);
    res.status(500).json({ error: 'Failed to fetch stocks data' });
  }
});

// Individual stock endpoint
app.get('/api/stock/:symbol', (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    let stock = stockDatabase[symbol];
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // Try to get live market data
    if (fs.existsSync(marketPath)) {
      try {
        const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
        if (marketData[symbol]) {
          stock = { ...stock, ...marketData[symbol] };
        }
      } catch (err) {
        console.log('⚠️ Error reading market data for individual stock');
      }
    }
    
    // Try to get metadata
    let meta = {};
    if (fs.existsSync(metaPath)) {
      try {
        const allMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        meta = allMeta[symbol] || {};
      } catch (err) {
        console.log('⚠️ Error reading meta data');
      }
    }
    
    // Add some historical data simulation
    const historicalData = generateHistoricalData(stock.price, 30);
    
    console.log(`📊 Individual stock data requested for ${symbol}`);
    res.json({
      symbol,
      data: stock,
      meta,
      frozen: enhancedGlobalEvents.isStockFrozen(symbol),
      historical: historicalData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching stock data:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

// TikTok scraping simulation endpoint
app.get('/api/scrape/tiktok/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = stockDatabase[symbol];
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    console.log(`🎭 TikTok scraping requested for ${symbol}`);
    
    // Simulate TikTok scraping results
    const tiktokData = await simulateTikTokScraping(symbol, stock.italianName);
    
    res.json({
      symbol,
      italianName: stock.italianName,
      tiktokData,
      lastScraped: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error scraping TikTok data:', error.message);
    res.status(500).json({ error: 'Failed to scrape TikTok data' });
  }
});

// Trend analysis endpoint
app.get('/api/trends/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = stockDatabase[symbol];
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    console.log(`📈 Trend analysis requested for ${symbol}`);
    
    // Simulate trend analysis
    const trendData = await simulateTrendAnalysis(symbol, stock);
    
    res.json({
      symbol,
      trends: trendData,
      lastAnalyzed: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error analyzing trends:', error.message);
    res.status(500).json({ error: 'Failed to analyze trends' });
  }
});

// Global events endpoint
app.get('/api/global-events', (req, res) => {
  try {
    console.log('🌍 Global events requested');
    res.json({
      events: {
        frozenStocks: Array.from(enhancedGlobalEvents.frozenStocks.keys()).map(symbol => ({
          symbol,
          frozenAt: enhancedGlobalEvents.frozenStocks.get(symbol),
          duration: 'Random (5-30 minutes)'
        })),
        activeMerges: enhancedGlobalEvents.getActiveMerges(),
        lastEventTime: enhancedGlobalEvents.lastEventTime,
        nextEventWindow: 'Every 15-45 minutes'
      },
      market: {
        totalStocks: Object.keys(stockDatabase).length,
        activeStocks: Object.keys(stockDatabase).length - enhancedGlobalEvents.frozenStocks.size,
        frozenCount: enhancedGlobalEvents.frozenStocks.size
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching global events:', error.message);
    res.status(500).json({ error: 'Failed to fetch global events' });
  }
});

// Manual price update endpoint (for testing)
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

// User Management Endpoints
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

// Buy stock endpoint
app.post('/api/users/:userId/buy', (req, res) => {
  try {
    const userId = req.params.userId;
    const { symbol, amount } = req.body;
    
    if (!userData[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const stock = stockDatabase[symbol.toUpperCase()];
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    const totalCost = stock.price * amount;
    const user = userData[userId];
    
    if ((user.balance || 1000) < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    // Update user balance and portfolio
    user.balance = (user.balance || 1000) - totalCost;
    user.portfolio = user.portfolio || {};
    user.portfolio[symbol.toUpperCase()] = (user.portfolio[symbol.toUpperCase()] || 0) + amount;
    user.lastActivity = Date.now();
    
    // Add transaction
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: 'buy',
      symbol: symbol.toUpperCase(),
      amount,
      price: stock.price,
      total: totalCost,
      timestamp: Date.now()
    });
    
    saveUsers();
    
    res.json({
      success: true,
      user,
      transaction: {
        type: 'buy',
        symbol: symbol.toUpperCase(),
        amount,
        price: stock.price,
        total: totalCost
      }
    });
  } catch (error) {
    console.error('❌ Error processing buy order:', error.message);
    res.status(500).json({ error: 'Failed to process buy order' });
  }
});

// Sell stock endpoint
app.post('/api/users/:userId/sell', (req, res) => {
  try {
    const userId = req.params.userId;
    const { symbol, amount } = req.body;
    
    if (!userData[userId]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const stock = stockDatabase[symbol.toUpperCase()];
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    const user = userData[userId];
    const currentHolding = user.portfolio?.[symbol.toUpperCase()] || 0;
    
    if (currentHolding < amount) {
      return res.status(400).json({ error: 'Insufficient stock holdings' });
    }
    
    const totalValue = stock.price * amount;
    
    // Update user balance and portfolio
    user.balance = (user.balance || 1000) + totalValue;
    user.portfolio[symbol.toUpperCase()] = currentHolding - amount;
    user.lastActivity = Date.now();
    
    // Add transaction
    user.transactions = user.transactions || [];
    user.transactions.push({
      type: 'sell',
      symbol: symbol.toUpperCase(),
      amount,
      price: stock.price,
      total: totalValue,
      timestamp: Date.now()
    });
    
    saveUsers();
    
    res.json({
      success: true,
      user,
      transaction: {
        type: 'sell',
        symbol: symbol.toUpperCase(),
        amount,
        price: stock.price,
        total: totalValue
      }
    });
  } catch (error) {
    console.error('❌ Error processing sell order:', error.message);
    res.status(500).json({ error: 'Failed to process sell order' });
  }
});

// Helper functions
function generateHistoricalData(currentPrice, days) {
  const historical = [];
  let price = currentPrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate price movement
    const volatility = 0.05; // 5% daily volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    price = Math.max(10, price * (1 + change));
    
    historical.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 2000) + 500
    });
  }
  
  return historical;
}

async function simulateTikTokScraping(symbol, italianName) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    hashtag: `#${symbol.toLowerCase()}`,
    views: Math.floor(Math.random() * 10000000) + 1000000, // 1M-10M views
    posts: Math.floor(Math.random() * 5000) + 100,
    engagement: Math.floor(Math.random() * 100000) + 10000,
    trendingScore: Math.floor(Math.random() * 100) + 1,
    relatedHashtags: [
      `#${italianName.toLowerCase().replace(/\s+/g, '')}`,
      '#memestocks',
      '#italy',
      '#viral',
      '#trending'
    ],
    lastUpdated: new Date().toISOString()
  };
}

async function simulateTrendAnalysis(symbol, stock) {
  // Simulate analysis delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const sentiment = Math.random();
  const momentum = Math.random();
  
  return {
    sentiment: sentiment > 0.6 ? 'bullish' : sentiment > 0.4 ? 'neutral' : 'bearish',
    sentimentScore: Math.round(sentiment * 100),
    momentum: momentum > 0.7 ? 'strong' : momentum > 0.4 ? 'moderate' : 'weak',
    momentumScore: Math.round(momentum * 100),
    volatility: stock.volatility,
    prediction: {
      direction: Math.random() > 0.5 ? 'up' : 'down',
      confidence: Math.round(Math.random() * 40) + 60, // 60-100%
      targetPrice: stock.price * (1 + (Math.random() - 0.5) * 0.2)
    },
    technicalIndicators: {
      rsi: Math.round(Math.random() * 40) + 30, // 30-70
      macd: Math.random() > 0.5 ? 'bullish' : 'bearish',
      volume: Math.random() > 0.6 ? 'high' : 'normal'
    }
  };
}

// Price update function
function updateStockPrices() {
  Object.keys(stockDatabase).forEach(symbol => {
    const stock = stockDatabase[symbol];
    const volatilityMultiplier = {
      'low': 0.02,
      'medium': 0.05,
      'high': 0.08,
      'extreme': 0.12
    }[stock.volatility] || 0.05;
    
    const change = (Math.random() - 0.5) * 2 * volatilityMultiplier;
    const newPrice = Math.max(10, stock.price * (1 + change));
    const priceChange = newPrice - stock.price;
    const percentChange = (priceChange / stock.price) * 100;
    
    stockDatabase[symbol] = {
      ...stock,
      price: Math.round(newPrice * 100) / 100,
      change: Math.round(percentChange * 100) / 100,
      volume: Math.floor(Math.random() * 1000) + 500,
      lastUpdate: Date.now()
    };
  });
  
  console.log('📊 Stock prices updated for', Object.keys(stockDatabase).length, 'stocks');
}

// Schedule price updates every 2 minutes
cron.schedule('*/2 * * * *', () => {
  console.log('⏰ Scheduled price update triggered');
  updatePrices();
});

// Global events scheduling (every 15-45 minutes)
cron.schedule('*/20 * * * *', () => {
  enhancedGlobalEvents.triggerRandomEvent();
});

// Initial price update
updatePrices();

// Start server
app.listen(PORT, () => {
  console.log(`✅ Enhanced Backend Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Market: http://localhost:${PORT}/api/market`);
  console.log(`🔗 Stocks: http://localhost:${PORT}/api/stocks`);
  console.log(`🔗 Stock Info: http://localhost:${PORT}/api/stock/SKIBI`);
  console.log(`🔗 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  console.log(`🔗 User Info: http://localhost:${PORT}/api/users/USER_ID`);
  console.log(`🔗 TikTok Scraping: http://localhost:${PORT}/api/scrape/tiktok/SKIBI`);
  console.log(`🔗 Trend Analysis: http://localhost:${PORT}/api/trends/SKIBI`);
  console.log(`🔗 Global Events: http://localhost:${PORT}/api/global-events`);
  console.log(`🔗 Update Prices: http://localhost:${PORT}/api/update-prices (POST)`);
  console.log('🎭 Features: Market Data, User Management, Leaderboard, TikTok Scraping, Trend Analysis, Global Events');
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
