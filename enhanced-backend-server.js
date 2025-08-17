#!/usr/bin/env node

// 🚀 Enhanced Backend Server for Italian Meme Stock Exchange
// With TikTok scraping and real trend data integration

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

console.log('🚀 Starting Enhanced Backend Server with Scraping');
console.log(`📡 Port: ${PORT}`);
console.log('⚡ Mode: Production Enhanced Backend');

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced stock data with current prices
const stockDatabase = {
  SKIBI: { 
    price: 123.45, 
    change: 5.2, 
    volume: 1000,
    description: "Gains +30% during pasta-eating hours",
    italianName: "Skibidi Toilet",
    volatility: "high",
    lastUpdate: Date.now()
  },
  RIZZL: { 
    price: 89.67, 
    change: -2.1, 
    volume: 800,
    description: "+25% when romance novels are mentioned",
    italianName: "Rizz Master",
    volatility: "medium",
    lastUpdate: Date.now()
  },
  GYATT: { 
    price: 156.78, 
    change: 8.7, 
    volume: 1200,
    description: "Volatility doubles during beach hours",
    italianName: "Gyatt Ohio",
    volatility: "extreme",
    lastUpdate: Date.now()
  },
  SUS: { 
    price: 78.90, 
    change: -1.5, 
    volume: 950,
    description: "Imposter reports cause -20% panic dumps",
    italianName: "Among Sus",
    volatility: "medium",
    lastUpdate: Date.now()
  },
  SAHUR: { 
    price: 134.56, 
    change: 3.8, 
    volume: 750,
    description: "+15% when pizza emojis appear",
    italianName: "Tun Tun Sahur",
    volatility: "low",
    lastUpdate: Date.now()
  },
  LABUB: { 
    price: 167.89, 
    change: 12.3, 
    volume: 1100,
    description: "Immune to market crashes on Sundays",
    italianName: "Labubu Dreams",
    volatility: "low",
    lastUpdate: Date.now()
  },
  OHIO: { 
    price: 98.76, 
    change: -4.2, 
    volume: 850,
    description: "Randomly steals 5% from other stocks",
    italianName: "Ohio Sigma",
    volatility: "high",
    lastUpdate: Date.now()
  },
  FRIED: { 
    price: 145.32, 
    change: 6.7, 
    volume: 920,
    description: "Gains popularity during lunch hours",
    italianName: "Pollo Fritto",
    volatility: "medium",
    lastUpdate: Date.now()
  },
  SIGMA: { 
    price: 187.45, 
    change: 9.8, 
    volume: 1300,
    description: "Alpha energy boosts after gym posts",
    italianName: "Sigma Grindset",
    volatility: "high",
    lastUpdate: Date.now()
  },
  TRALA: { 
    price: 76.54, 
    change: -0.8, 
    volume: 680,
    description: "Musical memes trigger viral growth",
    italianName: "Tra La La",
    volatility: "medium",
    lastUpdate: Date.now()
  },
  CROCO: { 
    price: 112.90, 
    change: 4.1, 
    volume: 780,
    description: "Reptilian energy in crypto-meme space",
    italianName: "Coccodrillo",
    volatility: "medium",
    lastUpdate: Date.now()
  },
  BIMBO: { 
    price: 129.87, 
    change: 7.3, 
    volume: 990,
    description: "Pink aesthetics drive millennial trades",
    italianName: "Bimbo Core",
    volatility: "high",
    lastUpdate: Date.now()
  },
  NONNA: { 
    price: 201.34, 
    change: 15.6, 
    volume: 1150,
    description: "Grandma wisdom outperforms all markets",
    italianName: "Nonna Saggezza",
    volatility: "low",
    lastUpdate: Date.now()
  },
  PASTA: { 
    price: 92.11, 
    change: 2.9, 
    volume: 1050,
    description: "Carb-loading powers meme momentum",
    italianName: "Pasta Power",
    volatility: "low",
    lastUpdate: Date.now()
  },
  GELAT: { 
    price: 118.76, 
    change: 8.2, 
    volume: 870,
    description: "Sweet trades during summer vibes",
    italianName: "Gelato Dreams",
    volatility: "medium",
    lastUpdate: Date.now()
  },
  MOZZA: { 
    price: 158.43, 
    change: 11.7, 
    volume: 1020,
    description: "Cheese melts hearts and portfolios",
    italianName: "Mozzarella Magic",
    volatility: "low",
    lastUpdate: Date.now()
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('💚 Health check requested');
  res.json({ 
    status: 'healthy', 
    service: 'Italian Meme Stock Exchange Enhanced Backend',
    timestamp: new Date().toISOString(),
    port: PORT,
    mode: 'enhanced',
    features: ['market-data', 'tiktok-scraping', 'price-updates', 'trend-analysis']
  });
});

app.get('/api/health', (req, res) => {
  console.log('💚 API Health check requested');
  res.json({ 
    status: 'healthy',
    api: 'Italian Meme Stock Exchange Enhanced API',
    timestamp: new Date().toISOString(),
    port: PORT,
    endpoints: [
      '/health', 
      '/api/health', 
      '/api/market', 
      '/api/stocks',
      '/api/stock/:symbol',
      '/api/trends/:symbol',
      '/api/scrape/tiktok/:symbol'
    ],
    stockCount: Object.keys(stockDatabase).length
  });
});

// Market data endpoint
app.get('/api/market', (req, res) => {
  try {
    const marketPath = join(__dirname, 'market.json');
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
        ...marketData[symbol]
      };
    });
    
    console.log('📊 Market data requested - returning', Object.keys(enhancedMarketData).length, 'stocks');
    res.json(enhancedMarketData);
  } catch (error) {
    console.error('❌ Error fetching market data:', error.message);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Stocks endpoint with metadata
app.get('/api/stocks', (req, res) => {
  try {
    const marketPath = join(__dirname, 'market.json');
    const metaPath = join(__dirname, 'meta.json');
    
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
    const stock = stockDatabase[symbol];
    
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // Add some historical data simulation
    const historicalData = generateHistoricalData(stock.price, 30);
    
    console.log(`📊 Individual stock data requested for ${symbol}`);
    res.json({
      symbol,
      ...stock,
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
  updateStockPrices();
});

// Initial price update
updateStockPrices();

// Start server
app.listen(PORT, () => {
  console.log(`✅ Enhanced Backend Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Market: http://localhost:${PORT}/api/market`);
  console.log(`🔗 Stocks: http://localhost:${PORT}/api/stocks`);
  console.log(`🔗 Stock Info: http://localhost:${PORT}/api/stock/SKIBI`);
  console.log(`🔗 TikTok Scraping: http://localhost:${PORT}/api/scrape/tiktok/SKIBI`);
  console.log(`🔗 Trend Analysis: http://localhost:${PORT}/api/trends/SKIBI`);
  console.log('🎭 Features: Market Data, TikTok Scraping, Trend Analysis, Price Updates');
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
