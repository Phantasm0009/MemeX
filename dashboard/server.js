import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

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

const PORT = process.env.DASHBOARD_PORT || process.env.PORT || 3002;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

console.log('🚀 Starting Italian Meme Dashboard');
console.log(`📊 Dashboard Port: ${PORT}`);
console.log(`🔗 Backend URL: ${BACKEND_URL}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve CSS and JS files from public directory
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// API client for backend
async function fetchFromBackend(endpoint) {
  try {
    const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Italian-Meme-Dashboard/1.0'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Backend API Error (${endpoint}):`, error.message);
    return null;
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const backendHealth = await fetchFromBackend('/api/health');
    res.json({
      status: 'healthy',
      dashboard: 'online',
      backend: backendHealth ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      dashboard: 'online',
      backend: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Proxy endpoints to backend
app.get('/api/dashboard/overview', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/market');
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/market', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/market');
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enhanced market endpoint with real holder statistics
app.get('/api/market/enhanced', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/market/enhanced');
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Individual stock endpoint with enhanced data
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await fetchFromBackend(`/api/stock/${symbol}`);
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: 'Stock not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leaderboard endpoint proxy
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const data = await fetchFromBackend(`/api/leaderboard?limit=${limit}`);
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transactions endpoint proxy
app.get('/api/transactions', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const data = await fetchFromBackend(`/api/transactions?limit=${limit}`);
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stock detail endpoint
app.get('/api/dashboard/stock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    // Try to get stock data from backend
    const marketData = await fetchFromBackend('/api/market');
    if (marketData && marketData.market && marketData.market[symbol]) {
      const stock = marketData.market[symbol];
      
      // Enhance stock data with additional details
      const stockDetail = {
        symbol: symbol,
        name: stock.italianName || stock.name || symbol,
        price: stock.price || 0,
        change: stock.change || 0,
        changePercent: stock.changePercent || 0,
        volume: stock.volume || 0,
        marketCap: stock.marketCap || (stock.price * 1000000),
        high24h: stock.high24h || stock.price,
        low24h: stock.low24h || stock.price,
        open: stock.open || stock.price,
        previousClose: stock.previousClose || stock.price,
        weekHigh: stock.weekHigh || stock.price * 1.2,
        weekLow: stock.weekLow || stock.price * 0.8,
        avgVolume: stock.avgVolume || stock.volume,
        volatility: Math.abs(stock.changePercent || 0)
      };
      
      res.json(stockDetail);
    } else {
      res.status(404).json({ error: 'Stock not found' });
    }
  } catch (error) {
    console.error('Stock detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leaderboard endpoint (placeholder since we removed the page)
app.get('/api/dashboard/leaderboard', async (req, res) => {
  try {
    // Return empty array since we don't use this endpoint anymore
    res.json([]);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Analytics endpoint (placeholder since we removed the page)
app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    // Return empty object since we don't use this endpoint anymore
    res.json({});
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stock activity endpoint
app.get('/api/dashboard/stock/:symbol/activity', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    // Fetch real transaction data from backend
    const data = await fetchFromBackend('/api/transactions?limit=100');
    
    if (data && data.transactions) {
      // Filter transactions for this specific stock
      const stockActivities = data.transactions
        .filter(tx => tx.stock === symbol)
        .slice(0, 20) // Limit to 20 most recent activities
        .map(tx => ({
          type: tx.type,
          username: tx.username,
          amount: Math.abs(tx.amount),
          price: tx.price,
          timestamp: tx.timestamp,
          value: tx.value
        }));
      
      res.json(stockActivities);
    } else {
      // Fallback to mock data if backend is unavailable
      const activities = [
        {
          type: 'buy',
          username: 'MemeTrader',
          amount: 100,
          price: 45.67,
          timestamp: Date.now() - 300000,
          value: 4567
        },
        {
          type: 'sell',
          username: 'DiamondHands',
          amount: 50,
          price: 45.32,
          timestamp: Date.now() - 600000,
          value: 2266
        },
        {
          type: 'buy',
          username: 'StockNinja',
          amount: 200,
          price: 44.89,
          timestamp: Date.now() - 900000,
          value: 8978
        }
      ];
      
      res.json(activities);
    }
  } catch (error) {
    console.error('Stock activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/quests', async (req, res) => {
  try {
    // Try backend first, fallback to generated quests
    const backendQuests = await fetchFromBackend('/api/quests');
    
    if (backendQuests && Array.isArray(backendQuests)) {
      res.json({
        date: new Date().toISOString(),
        totalRewardsDistributed: 12500,
        totalUsers: 47,
        completedQuests: 156,
        globalQuests: backendQuests,
        discordCommands: [
          {
            command: '/quests',
            description: 'View your current quest progress and available quests'
          },
          {
            command: '/claim',
            description: 'Claim rewards from completed quests'
          },
          {
            command: '/daily',
            description: 'Claim your daily bonus (once per 24 hours)'
          },
          {
            command: '/portfolio',
            description: 'View your current stock holdings and portfolio value'
          },
          {
            command: '/buy <stock> <amount>',
            description: 'Purchase shares of a specific stock (e.g., /buy SKIBI 5)'
          },
          {
            command: '/sell <stock> <amount>',
            description: 'Sell shares of a specific stock (e.g., /sell RIZZL 3)'
          },
          {
            command: '/market',
            description: 'View current stock prices and market overview'
          },
          {
            command: '/leaderboard',
            description: 'View top traders in the Italian Meme Stock Exchange'
          }
        ]
      });
    } else {
      // Generate realistic quest data matching the Discord bot quests
      const quests = [
        {
          id: 1,
          title: 'Send Message',
          description: 'Send any message in the server',
          progress: Math.floor(Math.random() * 2),
          target: 1,
          reward: 85,
          completed: false,
          type: 'social',
          emoji: '💬'
        },
        {
          id: 2,
          title: 'Greet the Community',
          description: 'Say "hi", "hello", or "ciao" in chat',
          progress: Math.floor(Math.random() * 2),
          target: 1,
          reward: 82,
          completed: false,
          type: 'social',
          emoji: '👋'
        },
        {
          id: 3,
          title: 'Use Bot Command',
          description: 'Use any bot command (like /market or /portfolio)',
          progress: Math.floor(Math.random() * 2),
          target: 1,
          reward: 81,
          completed: false,
          type: 'interaction',
          emoji: '🤖'
        },
        {
          id: 4,
          title: 'Make Your First Trade',
          description: 'Buy or sell any Italian meme stock using /buy or /sell',
          progress: 0,
          target: 1,
          reward: 150,
          completed: false,
          type: 'trading',
          emoji: '📈'
        }
      ];
      
      res.json({
        date: new Date().toISOString(),
        totalRewardsDistributed: 12500,
        totalUsers: 47,
        completedQuests: 156,
        globalQuests: quests,
        discordCommands: [
          {
            command: '/quests',
            description: 'View your current quest progress and available quests'
          },
          {
            command: '/claim',
            description: 'Claim rewards from completed quests'
          },
          {
            command: '/daily',
            description: 'Claim your daily bonus (once per 24 hours)'
          },
          {
            command: '/portfolio',
            description: 'View your current stock holdings and portfolio value'
          },
          {
            command: '/buy <stock> <amount>',
            description: 'Purchase shares of a specific stock (e.g., /buy SKIBI 5)'
          },
          {
            command: '/sell <stock> <amount>',
            description: 'Sell shares of a specific stock (e.g., /sell RIZZL 3)'
          },
          {
            command: '/market',
            description: 'View current stock prices and market overview'
          },
          {
            command: '/leaderboard',
            description: 'View top traders in the Italian Meme Stock Exchange'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Quests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trading activity endpoint - shows recent bot trading activity
app.get('/api/dashboard/activity', async (req, res) => {
  try {
    // Fetch real transaction data from backend
    const data = await fetchFromBackend('/api/transactions?limit=30');
    
    if (data && data.transactions) {
      // Format real transaction data for the dashboard
      const activity = data.transactions.map(tx => ({
        type: tx.type,
        username: tx.username,
        stock: tx.stock,
        amount: Math.abs(tx.amount),
        price: tx.price,
        timestamp: tx.timestamp,
        value: tx.value
      }));
      
      res.json({ activity: activity.slice(0, 15) });
    } else {
      // Fallback activity data if backend is unavailable
      res.json({
        activity: [
          {
            type: 'buy',
            username: 'MemeTrader',
            stock: 'SKIBI',
            amount: 5,
            price: 32.45,
            timestamp: Date.now() - 120000,
            value: 162.25
          },
          {
            type: 'sell',
            username: 'StockMaster',
            stock: 'RIZZL',
            amount: 3,
            price: 18.20,
            timestamp: Date.now() - 180000,
            value: 54.60
          },
          {
            type: 'buy',
            username: 'DiamondHands',
            stock: 'SIGMA',
            amount: 10,
            price: 25.80,
            timestamp: Date.now() - 240000,
            value: 258.00
          }
        ]
      });
    }
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Additional proxy endpoints
app.get('/api/market', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/market');
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stocks', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/market');
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await fetchFromBackend(`/api/stock/${symbol}`);
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add missing API proxy endpoints
app.get('/api/leaderboard', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/leaderboard');
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const data = await fetchFromBackend(`/api/transactions?limit=${limit}`);
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/quests', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/quests');
    if (data) {
      res.json(data);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Page routes
app.get('/simple', (req, res) => {
  res.sendFile(path.join(__dirname, 'simple-dashboard.html'));
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

app.get('/', (req, res) => {
  // Add cache-busting headers to force reload of updated HTML
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  // Add cache-busting headers to force reload of updated HTML  
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.sendFile(path.join(__dirname, 'pages', 'dashboard.html'));
});

app.get('/stock', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'stock.html'));
});

// Stock detail page with symbol parameter
app.get('/stock/:symbol', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'stock.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected to dashboard');
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected from dashboard');
  });
});

// Periodically update clients with market data from backend
setInterval(async () => {
  try {
    const market = await fetchFromBackend('/api/market');
    if (market) {
      io.emit('market-update', market);
    }
  } catch (error) {
    console.error('Failed to fetch market updates from backend:', error.message);
  }
}, 30000); // Update every 30 seconds

server.listen(PORT, () => {
  console.log(`🎛️ Dashboard server running on port ${PORT}`);
  console.log(`📊 Dashboard URLs:`);
  console.log(`   - Root (redirects): http://localhost:${PORT}/`);
  console.log(`   - Main Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   - Stock Details: http://localhost:${PORT}/stock/:symbol`);
});
