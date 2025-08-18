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
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log(`🔧 Loading .env from: ${envPath}`);
console.log(`🔍 .env exists: ${fs.existsSync(envPath)}`);

// Import utilities with correct paths
import { getTrendScore } from '../utils/enhancedTrendFetcher.js';
import { updatePrices, initializeMarket, getMarketStats } from '../utils/priceUpdater.js';
import { getEventBonuses, getRandomChaosEvent } from '../utils/triggers.js';
import { enhancedGlobalEvents } from '../utils/enhancedGlobalEvents.js';
import { lightweightTikTokScraper } from '../utils/lightweightTikTokScraper.js';
import { getGlobalDailyQuests, getAllUsers, getHoldings, getAllStocks } from '../utils/supabaseDb.js';

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
const marketPath = path.join(__dirname, '../market.json');
const metaPath = path.join(__dirname, '../meta.json');

console.log(`📊 Market file: ${marketPath} (exists: ${fs.existsSync(marketPath)})`);
console.log(`📋 Meta file: ${metaPath} (exists: ${fs.existsSync(metaPath)})`);

// Initialize market on startup
initializeMarket();

// API Endpoints
app.get('/api/health', async (req, res) => {
  const market = fs.existsSync(marketPath) ? JSON.parse(fs.readFileSync(marketPath)) : {};
  const stockCount = Object.keys(market).length;
  
  res.json({
    status: 'healthy',
    api: 'Italian Meme Stock Exchange Enhanced API',
    timestamp: new Date().toISOString(),
    port: PORT.toString(),
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
      '/api/quests',
      '/api/leaderboard',
      '/api/update-prices'
    ],
    stockCount,
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
});app.get('/api/market', (req, res) => {
  try {
    if (!fs.existsSync(marketPath)) {
      return res.status(404).json({ error: 'Market data not found' });
    }
    
    const market = JSON.parse(fs.readFileSync(marketPath));
    const stats = getMarketStats();
    
    res.json({
      market,
      stats,
      lastUpdate: new Date().toISOString(),
      globalEvents: {
        frozenStocks: Array.from(enhancedGlobalEvents.frozenStocks.keys()),
        activeMerges: enhancedGlobalEvents.getActiveMerges()
      }
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stock/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const market = JSON.parse(fs.readFileSync(marketPath));
    const meta = JSON.parse(fs.readFileSync(metaPath));
    
    if (!market[symbol.toUpperCase()]) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    res.json({
      symbol: symbol.toUpperCase(),
      data: market[symbol.toUpperCase()],
      meta: meta[symbol.toUpperCase()] || {},
      frozen: enhancedGlobalEvents.isStockFrozen(symbol.toUpperCase()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/trends/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🔍 API request: Fetching trend data for ${symbol}...`);
    
    const trendScore = await getTrendScore(symbol.toUpperCase());
    
    res.json({
      symbol: symbol.toUpperCase(),
      trendScore,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

app.post('/api/update-prices', async (req, res) => {
  try {
    console.log('🔄 API request: Manual price update...');
    const triggers = req.body.triggers || {};
    const enableChaos = req.body.enableChaos !== false;
    
    const updatedMarket = await performEnhancedPriceUpdate(triggers, enableChaos);
    
    res.json({
      success: true,
      market: updatedMarket,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ error: 'Failed to update prices' });
  }
});

// Enhanced market update with all global events
async function performEnhancedPriceUpdate(customTriggers = {}, enableChaos = true) {
  console.log('\n🔄 === Starting Enhanced Market Update ===');
  const startTime = Date.now();
  
  try {
    const market = JSON.parse(fs.readFileSync(marketPath));
    const meta = JSON.parse(fs.readFileSync(metaPath));
    
    // Check for enhanced global events first
    let globalEvent = null;
    if (enableChaos) {
      globalEvent = await enhancedGlobalEvents.checkForGlobalEvents();
      if (globalEvent) {
        console.log('🌍 Global event triggered:', globalEvent.name);
        console.log('🎉 ENHANCED GLOBAL EVENT TRIGGERED:', globalEvent.name.toUpperCase());
        console.log('📝 Description:', globalEvent.description);
        console.log('🎯 Rarity:', globalEvent.rarity);
      }
    }
    
    // Get all stock symbols
    const stocks = Object.keys(market).filter(key => key !== 'lastEvent');
    
    // Enhanced trend fetching - update more stocks more frequently
    const trendsToFetch = globalEvent && globalEvent.globalImpact ? 
      Math.min(8, stocks.length) : Math.min(10, stocks.length);
    const randomStocks = stocks.sort(() => 0.5 - Math.random()).slice(0, trendsToFetch);
    
    console.log(`📊 Fetching enhanced trends for ${trendsToFetch} stocks: ${randomStocks.join(', ')}`);
    
    const trendPromises = randomStocks.map(async (stock) => {
      try {
        const score = await getTrendScore(stock);
        const frozen = enhancedGlobalEvents.isStockFrozen(stock);
        console.log(`📈 ${stock}: ${score >= 0 ? '+' : ''}${(score * 100).toFixed(1)}% trend impact`);
        return { stock, score, frozen };
      } catch (error) {
        console.log(`❌ Trend fetch failed for ${stock}:`, error.message);
        return { stock, score: 0, frozen: false };
      }
    });
    
    const trendResults = await Promise.all(trendPromises);
    
    // Apply trend-based price adjustments
    const triggers = { ...customTriggers };
    for (const { stock, score, frozen } of trendResults) {
      if (!frozen && Math.abs(score) > 0.005) { // Only apply significant trends
        triggers[stock] = (triggers[stock] || 0) + score;
      }
    }
    
    // Apply global event triggers
    if (globalEvent && globalEvent.triggers) {
      Object.assign(triggers, globalEvent.triggers);
    }
    
    // Handle frozen stocks
    const frozenStocks = stocks.filter(stock => enhancedGlobalEvents.isStockFrozen(stock));
    if (frozenStocks.length > 0) {
      console.log(`🧊 Frozen stocks: ${frozenStocks.join(', ')}`);
    }
    
    // Handle merged stocks
    const activeMerges = enhancedGlobalEvents.getActiveMerges();
    if (activeMerges.length > 0) {
      console.log(`🔄 Active merges: ${activeMerges.length}`);
    }
    
    // Update prices with enhanced triggers
    const updatedMarket = await updatePrices(triggers, enableChaos);
    
    // Log global event impact
    if (globalEvent) {
      console.log(`🌍 Global event "${globalEvent.name}" applied to market`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Enhanced market update completed in ${duration}ms`);
    console.log('🔄 === Enhanced Market Update Complete ===\n');
    
    return updatedMarket;
    
  } catch (error) {
    console.error('❌ Enhanced market update failed:', error);
    throw error;
  }
}

// New API endpoint for enhanced global events
app.get('/api/global-events', (req, res) => {
  try {
    const frozenStocks = Array.from(enhancedGlobalEvents.frozenStocks.keys());
    const activeMerges = enhancedGlobalEvents.getActiveMerges();
    
    res.json({
      frozenStocks,
      activeMerges,
      lastEventTime: enhancedGlobalEvents.lastEventTime,
      eventCooldown: enhancedGlobalEvents.eventCooldown,
      weekendMode: enhancedGlobalEvents.isWeekend()
    });
  } catch (error) {
    console.error('Error fetching global events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quests API endpoint - Get today's global quests
app.get('/api/quests', async (req, res) => {
  try {
    console.log('🎯 API request: Fetching global daily quests...');
    
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const quests = await getGlobalDailyQuests(date);
    
    res.json({
      date,
      quests,
      timestamp: new Date().toISOString(),
      success: true
    });
  } catch (error) {
    console.error('Error fetching quests:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// Leaderboard API endpoint - Get top users with Discord usernames and balances
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('🏆 API request: Fetching leaderboard...');
    
    const limit = parseInt(req.query.limit) || 10;
    const includeHoldings = req.query.includeHoldings === 'true';
    
    // Get all users from database
    const users = await getAllUsers();
    
    if (!users || users.length === 0) {
      return res.json({
        leaderboard: [],
        totalUsers: 0,
        timestamp: new Date().toISOString(),
        success: true
      });
    }
    
    // Load current market data for portfolio calculations
    let market = {};
    if (includeHoldings && fs.existsSync(marketPath)) {
      market = JSON.parse(fs.readFileSync(marketPath));
    }
    
    // Calculate total wealth for each user (balance + portfolio value)
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      try {
        let totalValue = user.balance || 0;
        let portfolioValue = 0;
        let holdings = [];
        
        if (includeHoldings) {
          holdings = await getHoldings(user.id);
          
          if (holdings && holdings.length > 0) {
            portfolioValue = holdings.reduce((sum, holding) => {
              const currentPrice = market[holding.stock]?.price || 0;
              return sum + (holding.amount * currentPrice);
            }, 0);
          }
        }
        
        totalValue += portfolioValue;
        
        return {
          id: user.id,
          username: user.username || `User#${user.id.slice(-4)}`, // Discord username or fallback
          discriminator: user.discriminator || null,
          displayName: user.username ? 
            (user.discriminator ? `${user.username}#${user.discriminator}` : user.username) : 
            `User#${user.id.slice(-4)}`,
          balance: user.balance || 0,
          portfolioValue: Math.round(portfolioValue * 100) / 100,
          totalValue: Math.round(totalValue * 100) / 100,
          lastDaily: user.lastDaily || null,
          lastMessage: user.lastMessage || null,
          holdings: includeHoldings ? holdings : undefined,
          joinedAt: user.createdAt || user.joined_at || null
        };
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        return {
          id: user.id,
          username: `User#${user.id.slice(-4)}`,
          displayName: `User#${user.id.slice(-4)}`,
          balance: user.balance || 0,
          portfolioValue: 0,
          totalValue: user.balance || 0,
          error: 'Failed to load user data'
        };
      }
    }));
    
    // Sort by total value (balance + portfolio) descending
    const sortedUsers = enrichedUsers
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, Math.min(limit, 50)); // Cap at 50 users max
    
    // Add ranking
    const leaderboard = sortedUsers.map((user, index) => ({
      rank: index + 1,
      ...user
    }));
    
    res.json({
      leaderboard,
      totalUsers: users.length,
      limit,
      includeHoldings,
      timestamp: new Date().toISOString(),
      success: true
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: error.message 
    });
  }
});

// TikTok-only price update function for high-frequency updates
async function performTikTokOnlyUpdate() {
  console.log('\n🎵 === Starting TikTok-Only Update ===');
  const startTime = Date.now();
  
  try {
    const market = JSON.parse(fs.readFileSync(marketPath));
    const meta = JSON.parse(fs.readFileSync(metaPath));
    
    // Get all stock symbols (exclude lastEvent)
    const stockSymbols = Object.keys(market).filter(key => key !== 'lastEvent');
    console.log(`📊 Processing ${stockSymbols.length} stocks for TikTok updates...`);
    
    let updatedCount = 0;
    
    for (const symbol of stockSymbols) {
      try {
        // Skip if not a valid stock object
        if (!market[symbol] || typeof market[symbol] !== 'object' || typeof market[symbol].price !== 'number') {
          continue;
        }
        
        // Get TikTok trend score only
        const tiktokScore = await lightweightTikTokScraper.getTikTokTrendScore(symbol);
        
        if (Math.abs(tiktokScore) > 0.005) { // Only update if significant change
          const currentPrice = market[symbol].price || 50;
          const volatility = getVolatility(meta[symbol]?.volatility || 'medium');
          
          // Apply TikTok-driven price change (smaller impact than full updates)
          const priceChange = tiktokScore * 0.5; // Reduced impact for TikTok-only updates
          const newPrice = Math.max(0.01, currentPrice * (1 + priceChange));
          
          market[symbol].price = newPrice;
          market[symbol].lastChange = ((newPrice - currentPrice) / currentPrice) * 100;
          market[symbol].lastTikTokUpdate = Date.now();
          
          updatedCount++;
          console.log(`🎵 ${symbol}: $${currentPrice.toFixed(2)} → $${newPrice.toFixed(2)} (${market[symbol].lastChange.toFixed(2)}%)`);
        }
        
        // Rate limiting between stocks
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ TikTok update failed for ${symbol}:`, error.message);
      }
    }
    
    // Save updated market data
    fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
    
    const duration = Date.now() - startTime;
    console.log(`✅ TikTok update completed: ${updatedCount}/${stockSymbols.length} stocks updated in ${duration}ms`);
    
    return market;
    
  } catch (error) {
    console.error('❌ TikTok-only update failed:', error);
    throw error;
  }
}

// Helper function for volatility (if not imported)
function getVolatility(level) {
  switch (level) {
    case 'extreme': return 0.15;
    case 'high': return 0.10;
    case 'medium': return 0.05;
    case 'low': return 0.02;
    default: return 0.05;
  }
}

// Enhanced price updates every 15 minutes for faster market timing
cron.schedule('*/15 * * * *', async () => {
  const now = new Date();
  console.log(`⏰ Full market update (15min) - ${now.toLocaleTimeString()}`);
  try {
    await performEnhancedPriceUpdate();
  } catch (error) {
    console.error('❌ 15-minute full update failed:', error);
  }
});

// TikTok-only updates every 5 minutes for high-frequency trend tracking
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  console.log(`🎵 TikTok-only update (5min) - ${now.toLocaleTimeString()}`);
  try {
    await performTikTokOnlyUpdate();
  } catch (error) {
    console.error('❌ 5-minute TikTok update failed:', error);
  }
});

// Market opening/closing events with enhanced effects
cron.schedule('0 9 * * *', async () => {
  console.log('🌅 Enhanced Market Opening - Boost to all Italian stocks!');
  const italianBoost = { lastEvent: '🌅 Market Open! Italian stocks +5% morning pasta power!' };
  const italianStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
  italianStocks.forEach(stock => italianBoost[stock] = 0.05);
  await performEnhancedPriceUpdate(italianBoost);
});

cron.schedule('0 17 * * *', () => {
  console.log('🌆 Enhanced Market Closing - Preparing for after-hours volatility!');
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Backend error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced Italian Meme Stock Exchange Backend running on port ${PORT}`);
  console.log(`📈 Market updates every 15 minutes with enhanced global events`);
  console.log(`🎵 TikTok updates every 5 minutes for high-frequency tracking`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏪 Market data: http://localhost:${PORT}/api/market`);
  console.log(`🎯 Daily quests: http://localhost:${PORT}/api/quests`);
  console.log(`🏆 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  console.log(`🌍 Global events: http://localhost:${PORT}/api/global-events`);
  console.log(`🔧 Environment loaded from: ${envPath}`);
  
  // Show loaded environment variables (without exposing secrets)
  console.log('📋 Environment Status:');
  console.log(`   - Twitter API: ${process.env.TWITTER_BEARER_TOKEN ? '✅' : '❌'}`);
  console.log(`   - YouTube API: ${process.env.YOUTUBE_API_KEY ? '✅' : '❌'}`);
  console.log(`   - Reddit API: ${process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET ? '✅' : '❌'}`);
  console.log(`   - Supabase: ${SUPABASE_URL && SUPABASE_ANON_KEY ? '✅' : '❌'}`);
  
  // Initialize TikTok scraper (lightweight HTTP version)
  console.log('🎵 Initializing lightweight TikTok scraper...');
  
  // Perform initial price update
  setTimeout(async () => {
    console.log('🔄 Performing initial enhanced market update...');
    try {
      await performEnhancedPriceUpdate();
    } catch (error) {
      console.error('❌ Initial market update failed:', error);
    }
  }, 5000); // Wait 5 seconds for startup
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down enhanced backend server...');
  await lightweightTikTokScraper.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down enhanced backend server...');
  await lightweightTikTokScraper.close();
  process.exit(0);
});
