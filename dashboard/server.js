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

app.get('/api/dashboard/leaderboard', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/market');
    if (data) {
      // Transform market data for leaderboard (simplified for now)
      res.json([]);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/events', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/market');
    if (data) {
      // Extract events from market data
      const events = [{
        type: 'market_event',
        description: data.market?.lastEvent || 'Market operating normally',
        impact: 'Various',
        timestamp: Date.now(),
        stocks: ['Multiple']
      }];
      res.json(events);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/analytics', async (req, res) => {
  try {
    const data = await fetchFromBackend('/api/market');
    if (data) {
      // Generate analytics from market data
      const analytics = {
        volatilityBreakdown: { extreme: 3, high: 5, medium: 4, low: 3 },
        marketTrends: ['Bullish Italian Market', 'Pizza Stock Surge']
      };
      res.json(analytics);
    } else {
      res.status(503).json({ error: 'Backend service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard/quests', async (req, res) => {
  try {
    // Generate sample quest data since backend doesn't have this endpoint
    const quests = [
      { id: 1, title: 'Trade 5 stocks', progress: 0, target: 5, reward: 100, completed: false },
      { id: 2, title: 'Buy SKIBI stock', progress: 0, target: 1, reward: 50, completed: false }
    ];
    res.json(quests);
  } catch (error) {
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

// Page routes
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  console.log(`   - Stock Charts: http://localhost:${PORT}/stock?symbol=STOCK_SYMBOL`);
  console.log(`   - Leaderboard: http://localhost:${PORT}/leaderboard`);
  console.log(`   - Events: http://localhost:${PORT}/events`);
  console.log(`   - Analytics: http://localhost:${PORT}/analytics`);
  console.log(`   - Quests: http://localhost:${PORT}/quests`);
});
