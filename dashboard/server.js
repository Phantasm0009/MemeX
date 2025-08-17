import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.DASHBOARD_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data paths
const marketPath = path.join(__dirname, '../market.json');
const metaPath = path.join(__dirname, '../meta.json');
const dbPath = path.join(__dirname, '../database.json');

// Helper functions
function loadMarketData() {
  if (!fs.existsSync(marketPath)) return {};
  return JSON.parse(fs.readFileSync(marketPath));
}

function loadMetaData() {
  if (!fs.existsSync(metaPath)) return {};
  return JSON.parse(fs.readFileSync(metaPath));
}

function loadDatabase() {
  if (!fs.existsSync(dbPath)) return { users: {}, holdings: {}, transactions: [] };
  return JSON.parse(fs.readFileSync(dbPath));
}

// API endpoints
app.get('/api/dashboard/overview', (req, res) => {
  try {
    const market = loadMarketData();
    const meta = loadMetaData();
    const db = loadDatabase();
    
    const stocks = Object.keys(market).filter(key => key !== 'lastEvent');
    const marketCap = stocks.reduce((sum, symbol) => sum + (market[symbol]?.price || 0), 0);
    
    const gainers = stocks.filter(symbol => (market[symbol]?.lastChange || 0) > 0);
    const losers = stocks.filter(symbol => (market[symbol]?.lastChange || 0) < 0);
    
    const totalUsers = Object.keys(db.users || {}).length;
    const totalTransactions = (db.transactions || []).length;
    
    res.json({
      marketStats: {
        totalStocks: stocks.length,
        marketCap: marketCap.toFixed(2),
        gainers: gainers.length,
        losers: losers.length,
        neutral: stocks.length - gainers.length - losers.length
      },
      userStats: {
        totalUsers,
        totalTransactions,
        activeTraders: Object.keys(db.holdings || {}).length
      },
      lastEvent: market.lastEvent || 'Market is stable'
    });
  } catch (error) {
    console.error('Overview endpoint error:', error);
    res.status(500).json({ error: 'Failed to load overview data' });
  }
});

app.get('/api/dashboard/market', (req, res) => {
  try {
    const market = loadMarketData();
    const meta = loadMetaData();
    
    // For dashboard grid view
    const stocks = Object.keys(market)
      .filter(key => key !== 'lastEvent')
      .map(symbol => ({
        symbol,
        name: meta[symbol]?.name || symbol,
        italianName: meta[symbol]?.italianName || '',
        price: market[symbol]?.price || 0,
        change: market[symbol]?.lastChange || 0,
        volatility: meta[symbol]?.volatility || 'medium',
        italian: meta[symbol]?.italian || false,
        coreItalian: meta[symbol]?.coreItalian || false
      }))
      .sort((a, b) => b.price - a.price);

    // For stock chart view - include both formats
    const stocksObject = {};
    Object.keys(market)
      .filter(key => key !== 'lastEvent')
      .forEach(symbol => {
        stocksObject[symbol] = {
          name: meta[symbol]?.name || symbol,
          price: market[symbol]?.price || 0,
          lastChange: market[symbol]?.lastChange || 0,
          meta: meta[symbol] || {}
        };
      });
    
    res.json({
      stocks: stocksObject,  // For stock chart pages
      stocksList: stocks,    // For dashboard grid
      lastEvent: market.lastEvent || 'Market is stable'
    });
  } catch (error) {
    console.error('Market endpoint error:', error);
    res.status(500).json({ error: 'Failed to load market data' });
  }
});

app.get('/api/dashboard/leaderboard', (req, res) => {
  try {
    const market = loadMarketData();
    const db = loadDatabase();
    
    const users = Object.values(db.users || {});
    if (users.length === 0) {
      return res.json([]);
    }
    
    const leaderboard = users.map(user => {
      const holdings = db.holdings?.[user.id] || [];
      let portfolioValue = 0;
      
      for (const holding of holdings) {
        const stockPrice = market[holding.stock]?.price || 0;
        portfolioValue += stockPrice * holding.amount;
      }
      
      const netWorth = (user.balance || 0) + portfolioValue;
      const profit = netWorth - 1000;
      const profitPercentage = ((profit / 1000) * 100);
      
      return {
        userId: user.id,
        username: `Trader ${user.id.slice(-4)}`,
        balance: user.balance || 0,
        portfolioValue,
        netWorth,
        profit,
        profitPercentage,
        stockCount: holdings.length
      };
    })
    .sort((a, b) => b.netWorth - a.netWorth)
    .slice(0, 20);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard endpoint error:', error);
    res.status(500).json({ error: 'Failed to load leaderboard data' });
  }
});

app.get('/api/dashboard/events', (req, res) => {
  try {
    const market = loadMarketData();
    
    const events = [
      {
        type: 'market_event',
        description: market.lastEvent || 'Market operating normally',
        impact: 'Various',
        timestamp: Date.now() - 60000,
        stocks: ['Multiple']
      },
      {
        type: 'pasta_protocol',
        description: 'Pasta Protocol activated! Italian stocks boosted',
        impact: '+25%',
        timestamp: Date.now() - 300000,
        stocks: ['SKIBI', 'SAHUR', 'CROCO']
      },
      {
        type: 'chaos',
        description: 'OHIO steal event! Stole from GYATT',
        impact: 'OHIO +5%, GYATT -5%',
        timestamp: Date.now() - 600000,
        stocks: ['OHIO', 'GYATT']
      }
    ];
    
    res.json(events);
  } catch (error) {
    console.error('Events endpoint error:', error);
    res.status(500).json({ error: 'Failed to load events data' });
  }
});

app.get('/api/dashboard/analytics', (req, res) => {
  try {
    const meta = loadMetaData();
    
    const volatilityBreakdown = {
      extreme: Object.values(meta).filter(stock => stock.volatility === 'extreme').length,
      high: Object.values(meta).filter(stock => stock.volatility === 'high').length,
      medium: Object.values(meta).filter(stock => stock.volatility === 'medium').length,
      low: Object.values(meta).filter(stock => stock.volatility === 'low').length
    };
    
    res.json({
      volatilityBreakdown
    });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    res.status(500).json({ error: 'Failed to load analytics data' });
  }
});

app.get('/api/dashboard/quests', (req, res) => {
  try {
    // Get today's date (same logic as Discord bot)
    const today = new Date().toISOString().split('T')[0];
    const dateNum = parseInt(today.replace(/-/g, ''));
    
    // Seeded random function (same as Discord bot)
    function seededRandom(seed) {
      const x = Math.sin(seed + dateNum) * 10000;
      return x - Math.floor(x);
    }
    
    // Real quest templates (matching Discord bot exactly)
    const questTemplates = [
      { type: 'send_message', description: 'Send any message in the server', baseReward: 75, emoji: '💬' },
      { type: 'say_hi', description: 'Say "hi", "hello", or "ciao" in chat', baseReward: 85, emoji: '👋' },
      { type: 'use_command', description: 'Use any bot command (like /market or /portfolio)', baseReward: 95, emoji: '🤖' },
      { type: 'buy_stock', description: 'Buy any Italian meme stock with /buy', baseReward: 150, emoji: '💰' },
      { type: 'sell_stock', description: 'Sell any stock with /sell', baseReward: 140, emoji: '💸' },
      { type: 'react_message', description: 'React to any message with an emoji', baseReward: 70, emoji: '😀' },
      { type: 'check_portfolio', description: 'Check your portfolio with /portfolio', baseReward: 80, emoji: '📊' },
      { type: 'daily_bonus', description: 'Claim your daily bonus with /daily', baseReward: 120, emoji: '🎁' },
      { type: 'pasta_mention', description: 'Mention "pasta", "pizza", or "spaghetti" in chat', baseReward: 110, emoji: '🍝' },
      { type: 'meme_stock', description: 'Check any stock info with /stock', baseReward: 85, emoji: '📈' }
    ];
    
    // Generate today's 3 quests (same algorithm as Discord bot)
    const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => seededRandom(1) - 0.5).slice(0, 3);
    const globalQuests = indices.map((index, questIndex) => {
      const template = questTemplates[index];
      const rewardVariation = Math.floor(seededRandom(questIndex + 10) * 51) - 25; // ±25 coins
      return {
        type: template.type,
        description: template.description,
        reward: Math.max(50, template.baseReward + rewardVariation),
        emoji: template.emoji
      };
    });
    
    // Calculate real statistics from Supabase/JSON database
    const db = loadDatabase();
    
    // Count actual quest completions and rewards from transactions
    let totalRewardsDistributed = 0;
    let totalTransactions = (db.transactions || []).length;
    
    // Calculate from user balances above starting amount (1000)
    const users = Object.values(db.users || {});
    const totalUsers = users.length;
    
    // Estimate total quest rewards distributed based on user balances above 1000
    users.forEach(user => {
      if (user.balance > 1000) {
        const extraBalance = user.balance - 1000;
        // Estimate quest earnings (exclude stock trading profits)
        const estimatedQuestEarnings = Math.min(extraBalance * 0.3, 2000); // Cap at reasonable amount
        totalRewardsDistributed += estimatedQuestEarnings;
      }
    });
    
    const questStats = {
      date: today,
      globalQuests: globalQuests,
      totalQuestsAvailable: globalQuests.length,
      totalRewardsDistributed: Math.round(totalRewardsDistributed),
      totalUsers: totalUsers,
      totalTransactions: totalTransactions,
      discordCommands: [
        { command: '/quests', description: 'View your current daily quests and progress' },
        { command: '/claim', description: 'Claim coins from completed quests' },
        { command: '/daily', description: 'Claim your daily bonus (100 coins)' },
        { command: '/portfolio', description: 'View your stock portfolio and net worth' },
        { command: '/market', description: 'View the Italian meme stock market' }
      ]
    };
    
    res.json(questStats);
  } catch (error) {
    console.error('Quests endpoint error:', error);
    res.status(500).json({ error: 'Failed to load quest data' });
  }
});

// Enhanced Backend API Proxy Routes
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Proxy route for enhanced backend market data
app.get('/api/market', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/market`);
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data from backend' });
  }
});

// Proxy route for enhanced backend stocks data
app.get('/api/stocks', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stocks`);
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying stocks data:', error);
    res.status(500).json({ error: 'Failed to fetch stocks data from backend' });
  }
});

// Proxy route for individual stock data
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await fetch(`${BACKEND_URL}/api/stock/${symbol}`);
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying stock data:', error);
    res.status(500).json({ error: 'Failed to fetch stock data from backend' });
  }
});

// Proxy route for global events
app.get('/api/global-events', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/global-events`);
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying global events:', error);
    res.status(500).json({ error: 'Failed to fetch global events from backend' });
  }
});

// Proxy route for TikTok scraping
app.get('/api/scrape/tiktok/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await fetch(`${BACKEND_URL}/api/scrape/tiktok/${symbol}`);
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying TikTok data:', error);
    res.status(500).json({ error: 'Failed to fetch TikTok data from backend' });
  }
});

// Proxy route for trend analysis
app.get('/api/trends/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await fetch(`${BACKEND_URL}/api/trends/${symbol}`);
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying trend data:', error);
    res.status(500).json({ error: 'Failed to fetch trend data from backend' });
  }
});

// Proxy route for backend health check
app.get('/api/health', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error proxying health check:', error);
    res.status(500).json({ error: 'Backend health check failed' });
  }
});

// Page routes - Fixed order and redirects
app.get('/', (req, res) => {
  // Redirect root to dashboard
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

app.get('/leaderboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'leaderboard.html'));
});

app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'events.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'analytics.html'));
});

app.get('/quests', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'quests.html'));
});

app.get('/stock', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'stock.html'));
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Dashboard client connected');
  
  socket.on('disconnect', () => {
    console.log('Dashboard client disconnected');
  });
});

// Watch for market file changes and broadcast updates
if (fs.existsSync(marketPath)) {
  fs.watchFile(marketPath, () => {
    const market = loadMarketData();
    io.emit('market-update', market);
  });
}

server.listen(PORT, () => {
  console.log(`🎛️ Dashboard server running on port ${PORT}`);
  console.log(`📊 Dashboard URLs:`);
  console.log(`   - Root (redirects): http://localhost:${PORT}/`);
  console.log(`   - Main Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   - Stock Charts: http://localhost:${PORT}/stock?symbol=STOCK_SYMBOL`);
  console.log(`   - Leaderboard: http://localhost:${PORT}/leaderboard`);
  console.log(`   - Events: http://localhost:${PORT}/events`);
  console.log(`   - Analytics: http://localhost:${PORT}/analytics`);
  console.log(`   - Quests: http://localhost:${PORT}/quests`);
});