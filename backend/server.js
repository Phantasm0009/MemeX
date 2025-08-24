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
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for transactions
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || '';

let supabase = null;
let useSupabaseTransactions = false;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.length > 10 && SUPABASE_ANON_KEY.length > 10) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    useSupabaseTransactions = true;
    console.log('✅ Supabase configured for transactions');
  } catch (error) {
    console.log('⚠️ Supabase connection failed:', error.message);
    useSupabaseTransactions = false;
  }
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

// Enhanced market data with holder statistics
app.get('/api/market/enhanced', async (req, res) => {
  try {
    if (!fs.existsSync(marketPath)) {
      return res.status(404).json({ error: 'Market data not found' });
    }
    
    const market = JSON.parse(fs.readFileSync(marketPath));
    const stats = getMarketStats();
    const users = await getAllUsers();
    
    // Calculate holder statistics for each stock
    const stockHolders = {};
    const stockVolume = {};
    
    for (const user of users) {
      try {
        const holdings = await getHoldings(user.id);
        for (const holding of holdings) {
          const stock = holding.stock;
          if (!stockHolders[stock]) {
            stockHolders[stock] = new Set();
            stockVolume[stock] = 0;
          }
          stockHolders[stock].add(user.id);
          stockVolume[stock] += holding.amount;
        }
      } catch (error) {
        console.error(`Error getting holdings for user ${user.id}:`, error);
      }
    }
    
    // Convert Sets to counts and add metadata
    const enhancedMarket = {};
    for (const [symbol, data] of Object.entries(market)) {
      // Skip lastEvent and other non-stock entries
      if (symbol === 'lastEvent' || !data || typeof data !== 'object' || typeof data.price !== 'number') {
        continue;
      }
      
      enhancedMarket[symbol] = {
        ...data,
        holders: stockHolders[symbol] ? stockHolders[symbol].size : 0,
        totalVolume: stockVolume[symbol] || 0,
        marketCap: data.price ? (data.price * (stockVolume[symbol] || 0)) : 0
      };
    }
    
    res.json({
      market: enhancedMarket,
      stats: {
        ...stats,
        totalUsers: users.length,
        totalHolders: Object.values(stockHolders).reduce((sum, holders) => sum + holders.size, 0)
      },
      lastUpdate: new Date().toISOString(),
      globalEvents: {
        frozenStocks: Array.from(enhancedGlobalEvents.frozenStocks.keys()),
        activeMerges: enhancedGlobalEvents.getActiveMerges()
      }
    });
  } catch (error) {
    console.error('Error fetching enhanced market data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const market = JSON.parse(fs.readFileSync(marketPath));
    const meta = JSON.parse(fs.readFileSync(metaPath));
    
    if (!market[symbol.toUpperCase()]) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    // Get holder statistics for this specific stock
    const users = await getAllUsers();
    const holders = new Set();
    let totalVolume = 0;
    
    for (const user of users) {
      try {
        const holdings = await getHoldings(user.id);
        const stockHolding = holdings.find(h => h.stock === symbol.toUpperCase());
        if (stockHolding) {
          holders.add(user.id);
          totalVolume += stockHolding.amount;
        }
      } catch (error) {
        console.error(`Error getting holdings for user ${user.id}:`, error);
      }
    }
    
    const stockData = market[symbol.toUpperCase()];
    const marketCap = stockData.price ? (stockData.price * totalVolume) : 0;
    
    res.json({
      symbol: symbol.toUpperCase(),
      data: {
        ...stockData,
        holders: holders.size,
        totalVolume,
        marketCap
      },
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

// Trigger event endpoint - manually trigger global events
app.post('/api/trigger-event', async (req, res) => {
  try {
    console.log('🎭 API request: Manual event trigger...');
    const { eventType, duration } = req.body;
    
    if (!eventType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event type is required' 
      });
    }

    // Create event object based on type
    let event = null;
    
    switch (eventType) {
      case 'meme_market_boom':
        event = await enhancedGlobalEvents.checkMemeMarketBoom();
        break;
      case 'meme_crash':
        event = await enhancedGlobalEvents.checkMemeCrash();
        break;
      case 'viral_tiktok_challenge':
        event = await enhancedGlobalEvents.checkViralTikTokChallenge();
        break;
      case 'reddit_meme_hype':
        event = await enhancedGlobalEvents.checkRedditMemeHype();
        break;
      case 'heatwave_meltdown':
        event = await enhancedGlobalEvents.checkHeatwaveMeltdown();
        break;
      case 'global_pizza_day':
        event = await enhancedGlobalEvents.checkGlobalPizzaDay();
        break;
      case 'internet_outage_panic':
        event = await enhancedGlobalEvents.checkInternetOutage();
        break;
      case 'stock_freeze_hour':
        event = await enhancedGlobalEvents.checkStockFreezeHour();
        break;
      case 'market_romance':
        event = await enhancedGlobalEvents.checkMarketRomance();
        break;
      case 'trend_surge':
        event = await enhancedGlobalEvents.checkTrendSurge();
        break;
      case 'pasta_party':
        event = await enhancedGlobalEvents.checkPastaParty();
        break;
      case 'stock_panic':
        event = await enhancedGlobalEvents.checkStockPanic();
        break;
      case 'weekend_chill':
        event = await enhancedGlobalEvents.checkWeekendChill();
        break;
      case 'meme_mutation':
        event = await enhancedGlobalEvents.checkMemeMutation();
        break;
      case 'global_jackpot':
        event = await enhancedGlobalEvents.checkGlobalJackpot();
        break;
      case 'chaos_hour':
        event = await enhancedGlobalEvents.checkChaosHour();
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Unknown event type' 
        });
    }

    if (!event) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create event' 
      });
    }

    // Override duration if provided
    if (duration) {
      event.duration = duration;
    }

    // Force trigger the event
    enhancedGlobalEvents.lastEventTime = Date.now();
    enhancedGlobalEvents.lastEventName = event.name;
    enhancedGlobalEvents.lastEventDescription = event.description;
    enhancedGlobalEvents.lastEventDuration = event.duration || 60000;
    enhancedGlobalEvents.lastEventRarity = event.rarity || 'Common';
    
    // Apply the event triggers immediately (FAST MODE - no trend fetching)
    console.log('⚡ FAST MODE: Applying manual event without trend fetching...');
    const updatedMarket = await applyEventTriggersOnly(event.triggers || {});
    
    console.log('🎉 MANUALLY TRIGGERED EVENT:', event.name.toUpperCase());
    console.log('📝 Description:', event.description);
    console.log('🎯 Rarity:', event.rarity);
    
    res.json({
      success: true,
      event: {
        type: eventType,
        name: event.name,
        description: event.description,
        rarity: event.rarity,
        duration: event.duration
      },
      affectedStocks: Object.keys(event.triggers || {}),
      market: updatedMarket,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error triggering event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to trigger event',
      message: error.message 
    });
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
    
    // Get information about recent events
    let activeEventInfo = null;
    const timeSinceLastEvent = Date.now() - enhancedGlobalEvents.lastEventTime;
    
    // If an event happened in the last 5 minutes, show it as active
    if (enhancedGlobalEvents.lastEventTime > 0 && timeSinceLastEvent < 300000) { // 5 minutes
      activeEventInfo = {
        name: enhancedGlobalEvents.lastEventName || 'Unknown Event',
        description: enhancedGlobalEvents.lastEventDescription || 'A market event occurred',
        timeAgo: timeSinceLastEvent,
        duration: enhancedGlobalEvents.lastEventDuration || 60000,
        rarity: enhancedGlobalEvents.lastEventRarity || 'Common'
      };
    }
    
    res.json({
      globalEvents: {
        frozenStocks,
        activeMerges,
        lastEventTime: enhancedGlobalEvents.lastEventTime,
        eventCooldown: enhancedGlobalEvents.eventCooldown,
        weekendMode: enhancedGlobalEvents.isWeekend(),
        activeEvent: activeEventInfo
      },
      frozenStocks, // Legacy compatibility
      activeMerges, // Legacy compatibility  
      lastEventTime: enhancedGlobalEvents.lastEventTime, // Legacy compatibility
      eventCooldown: enhancedGlobalEvents.eventCooldown, // Legacy compatibility
      weekendMode: enhancedGlobalEvents.isWeekend() // Legacy compatibility
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

// Update Discord user info endpoint - Called by bot to sync Discord usernames
app.post('/api/user/:userId/discord-info', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { username, globalName, displayName, discriminator } = req.body;
    
    console.log(`📝 API request: Updating Discord info for user ${userId}...`);
    console.log(`   Username: ${username}`);
    console.log(`   Global Name: ${globalName}`);
    console.log(`   Display Name: ${displayName}`);
    
    // For now, we'll store Discord info in memory/cache since the Supabase table
    // doesn't have the Discord username columns yet
    if (!global.discordUserCache) {
      global.discordUserCache = new Map();
    }
    
    global.discordUserCache.set(userId, {
      username: username || null,
      globalName: globalName || null,
      displayName: displayName || null,
      discriminator: discriminator || null,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Discord user info cached in memory');
    
    res.json({
      success: true,
      message: 'Discord user info updated (cached)',
      userId,
      username,
      globalName,
      displayName,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error updating Discord user info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Discord user info',
      message: error.message
    });
  }
});

// Leaderboard API endpoint - Get top users with Discord usernames and balances
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('🏆 API request: Fetching leaderboard...');
    
    const limit = parseInt(req.query.limit) || 10;
    const includeHoldings = req.query.includeHoldings !== 'false'; // Default to true
    
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
    if (fs.existsSync(marketPath)) {
      market = JSON.parse(fs.readFileSync(marketPath));
    }
    
    // Calculate total wealth for each user (balance + portfolio value)
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      try {
        let balance = parseFloat(user.balance) || 1000; // Default starting balance
        let portfolioValue = 0;
        let holdings = [];
        let totalInvested = 0; // Track how much user has invested in stocks
        
        // Always get holdings to calculate portfolio value
        holdings = await getHoldings(user.id);
        
        if (holdings && holdings.length > 0) {
          for (const holding of holdings) {
            const currentPrice = market[holding.stock]?.price || 0;
            const holdingValue = holding.amount * currentPrice;
            portfolioValue += holdingValue;
            
            // Calculate original investment (for profit calculation)
            // We'll use average cost basis - could be enhanced with actual purchase prices
            const avgPrice = currentPrice * 0.8; // Assume bought at 80% of current price on average
            totalInvested += Math.abs(holding.amount) * avgPrice;
          }
        }
        
        const totalValue = balance + portfolioValue;
        
        // Calculate profit percentage (total value vs starting amount + invested)
        const startingValue = 1000; // Default starting balance
        const totalInput = startingValue + totalInvested;
        const profit = totalValue - totalInput;
        const profitPercentage = totalInput > 0 ? ((profit / totalInput) * 100) : 0;
        
        // Get Discord info from cache (if available)
        const cachedDiscordInfo = global.discordUserCache?.get(user.id);
        
        // Get the best available username - priority: cached globalName > cached displayName > cached username > database username > fallback
        let username, displayName, globalName;
        
        if (cachedDiscordInfo) {
          // Use cached Discord info
          globalName = cachedDiscordInfo.globalName;
          displayName = cachedDiscordInfo.displayName || cachedDiscordInfo.globalName || cachedDiscordInfo.username;
          username = cachedDiscordInfo.username || displayName;
          console.log(`📋 Using cached Discord info for ${user.id}: ${username}`);
        } else {
          // Fallback to database or generic username
          displayName = user.global_name || user.display_name || user.username || `User#${user.id.slice(-4)}`;
          username = user.username || displayName;
          globalName = user.global_name || null;
        }
        
        return {
          id: user.id,
          username: username,
          discriminator: cachedDiscordInfo?.discriminator || user.discriminator || null,
          displayName: displayName,
          globalName: globalName,
          balance: Math.round(balance * 100) / 100,
          portfolioValue: Math.round(portfolioValue * 100) / 100,
          totalValue: Math.round(totalValue * 100) / 100,
          profit: Math.round(profit * 100) / 100,
          profitPercentage: Math.round(profitPercentage * 100) / 100,
          totalInvested: Math.round(totalInvested * 100) / 100,
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
          balance: parseFloat(user.balance) || 1000,
          portfolioValue: 0,
          totalValue: parseFloat(user.balance) || 1000,
          profit: 0,
          profitPercentage: 0,
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

// Recent transactions API endpoint - Get recent trading activity
app.get('/api/transactions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  
  try {
    console.log(`💰 API request: Fetching recent transactions (limit: ${limit})...`);
    
    if (useSupabaseTransactions) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Supabase query error:', error.message);
        throw error;
      }
      
      console.log(`✅ Found ${data.length} transactions from Supabase`);
      
      const transactions = data.map(tx => ({
        userId: tx.user_id,
        username: 'Unknown', // We'll fetch usernames separately if needed
        stock: tx.stock,
        amount: tx.amount,
        price: tx.price,
        timestamp: tx.timestamp,
        type: tx.amount > 0 ? 'buy' : 'sell',
        value: Math.abs(tx.amount) * tx.price
      }));
      
      res.json({
        success: true,
        transactions,
        total: transactions.length,
        limit,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fallback: return empty array if no Supabase
      console.log('⚠️ No Supabase connection - returning empty transactions');
      res.json({
        success: true,
        transactions: [],
        total: 0,
        limit,
        timestamp: new Date().toISOString(),
        note: 'Supabase not configured'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching transactions:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions',
      message: error.message,
      timestamp: new Date().toISOString()
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

// Full price updates every 5 minutes for optimal market timing
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  console.log(`⏰ Full market update (5min) - ${now.toLocaleTimeString()}`);
  try {
    await performEnhancedPriceUpdate();
  } catch (error) {
    console.error('❌ 5-minute full update failed:', error);
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

// Discord user sync endpoint - Update Discord user cache with real data from bot
app.post('/api/sync-discord-user', express.json(), (req, res) => {
  try {
    const { userId, username, globalName, displayName, discriminator } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Initialize cache if it doesn't exist
    if (!global.discordUserCache) {
      global.discordUserCache = new Map();
    }
    
    // Update cache with real Discord info
    const userInfo = {
      username: username || null,
      globalName: globalName || null,
      displayName: displayName || globalName || username || null,
      discriminator: discriminator || null,
      lastUpdated: Date.now()
    };
    
    global.discordUserCache.set(userId, userInfo);
    console.log(`✅ Synced Discord info for ${userId}: ${userInfo.displayName || userInfo.username}`);
    
    res.json({ 
      success: true, 
      message: 'Discord user info synced successfully',
      userInfo 
    });
    
  } catch (error) {
    console.error('Error syncing Discord user info:', error);
    res.status(500).json({ error: 'Failed to sync Discord user info' });
  }
});

// Bulk sync endpoint for multiple users
app.post('/api/sync-discord-users', express.json(), (req, res) => {
  try {
    const { users } = req.body;
    
    if (!Array.isArray(users)) {
      return res.status(400).json({ error: 'users array is required' });
    }
    
    // Initialize cache if it doesn't exist
    if (!global.discordUserCache) {
      global.discordUserCache = new Map();
    }
    
    let syncedCount = 0;
    
    for (const user of users) {
      if (user.id) {
        const userInfo = {
          username: user.username || null,
          globalName: user.globalName || null,
          displayName: user.displayName || user.globalName || user.username || null,
          discriminator: user.discriminator || null,
          lastUpdated: Date.now()
        };
        
        global.discordUserCache.set(user.id, userInfo);
        syncedCount++;
      }
    }
    
    console.log(`✅ Bulk synced ${syncedCount} Discord users`);
    
    res.json({ 
      success: true, 
      message: `Synced ${syncedCount} Discord users`,
      syncedCount 
    });
    
  } catch (error) {
    console.error('Error bulk syncing Discord users:', error);
    res.status(500).json({ error: 'Failed to bulk sync Discord users' });
  }
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

// Initialize Discord user cache with default user info
async function initializeDiscordUserCache() {
  try {
    console.log('🔄 Initializing Discord user cache...');
    
    if (!global.discordUserCache) {
      global.discordUserCache = new Map();
    }
    
    // Get all users and populate with default Discord info if cache is empty
    const users = await getAllUsers();
    
    for (const user of users) {
      if (!global.discordUserCache.has(user.id)) {
        // Set default Discord info for known users
        const defaultInfo = {
          username: user.username || `User#${user.id.slice(-4)}`,
          globalName: user.global_name || null,
          displayName: user.display_name || user.username || `User#${user.id.slice(-4)}`,
          discriminator: user.discriminator || null,
          updatedAt: new Date().toISOString()
        };
        
        global.discordUserCache.set(user.id, defaultInfo);
        console.log(`📋 Cached default info for user ${user.id}: ${defaultInfo.username}`);
      }
    }
    
    console.log(`✅ Discord user cache initialized with ${global.discordUserCache.size} users`);
  } catch (error) {
    console.error('❌ Failed to initialize Discord user cache:', error);
  }
}

// Initialize cache on startup
setTimeout(async () => {
  await initializeDiscordUserCache();
}, 2000); // Wait 2 seconds after server start

// Fast event trigger function - skips trend fetching for manual events
async function applyEventTriggersOnly(eventTriggers = {}) {
  console.log('⚡ Applying event triggers directly without trend fetching...');
  const startTime = Date.now();
  
  try {
    const market = JSON.parse(fs.readFileSync(marketPath));
    
    // Apply event triggers directly to market prices
    for (const [stock, trigger] of Object.entries(eventTriggers)) {
      if (stock === 'lastEvent' || stock === 'FREEZE_STOCKS') continue;
      
      if (market[stock] && typeof trigger === 'number') {
        const oldPrice = market[stock].price || 0;
        const newPrice = Math.max(0.01, oldPrice * (1 + trigger));
        const percentChange = ((newPrice - oldPrice) / oldPrice * 100);
        
        market[stock].price = newPrice;
        market[stock].lastChange = percentChange;
        market[stock].timestamp = Date.now();
        
        // Update 24h high/low
        if (newPrice > (market[stock].high24h || 0)) {
          market[stock].high24h = newPrice;
        }
        if (newPrice < (market[stock].low24h || Infinity)) {
          market[stock].low24h = newPrice;
        }
        
        console.log(`📈 ${stock}: ${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`);
      }
    }
    
    // Handle frozen stocks
    if (eventTriggers.FREEZE_STOCKS) {
      const stocksToFreeze = eventTriggers.FREEZE_STOCKS;
      const freezeTime = Date.now() + (3 * 60 * 1000);
      stocksToFreeze.forEach(stock => {
        enhancedGlobalEvents.frozenStocks.set(stock, freezeTime);
        console.log(`🧊 ${stock} frozen for 3 minutes`);
      });
    }
    
    // Save updated market
    fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
    
    const duration = Date.now() - startTime;
    console.log(`⚡ Fast event application completed in ${duration}ms`);
    
    return market;
    
  } catch (error) {
    console.error('❌ Fast event trigger failed:', error);
    throw error;
  }
}
