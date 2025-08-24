import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTrendScore } from './realTrendFetcher.js';
import { getRandomChaosEvent } from './triggers.js';
import { addPriceHistory } from './supabaseDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const marketPath = path.join(__dirname, '../market.json');
const metaPath = path.join(__dirname, '../meta.json');

function getRandomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function getVolatility(level) {
  switch (level) {
    case 'low': return 0.08;      // 8% max change (much more exciting!)
    case 'medium': return 0.15;   // 15% max change (was 3%)
    case 'high': return 0.25;     // 25% max change (was 7%)
    case 'extreme': return 0.45;  // 45% max change (was 15%)
    default: return 0.15;         // Default to medium volatility
  }
}

export async function updatePrices(triggers = {}, enableChaos = true) {
  try {
    if (!fs.existsSync(marketPath) || !fs.existsSync(metaPath)) {
      console.log('⚠️ Market or meta data not found, initializing...');
      initializeMarket();
      return await updatePrices(triggers, enableChaos);
    }
    
    let market, meta;
    try {
      market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (error) {
      console.error('❌ Error reading market data:', error);
      initializeMarket();
      market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
    
    let lastEvent = market.lastEvent || '';
    
    // Skip corrupted entries
    const validStocks = Object.keys(market).filter(stock => {
      const stockData = market[stock];
      return stockData && 
             typeof stockData === 'object' && 
             typeof stockData.price === 'number' && 
             stockData.price > 0 &&
             stock !== 'lastEvent';
    });
    
    if (validStocks.length === 0) {
      console.log('⚠️ No valid stocks found, reinitializing market...');
      initializeMarket();
      return await updatePrices(triggers, enableChaos);
    }
    
    // Add random chaos events (30% chance for much more excitement!)
    if (enableChaos && Math.random() < 0.30) {
      const chaosEvent = getRandomChaosEvent();
      if (chaosEvent.lastEvent) {
        Object.assign(triggers, chaosEvent);
        console.log('🎲 Chaos event triggered:', chaosEvent.lastEvent);
        lastEvent = chaosEvent.lastEvent;
      }
    }
    
    // Check for time freeze effect
    const timeFreeze = triggers.TIME_FREEZE;
    const freezeMultiplier = timeFreeze ? 0.2 : 1.0; // Reduce volatility during freeze
    
    console.log(`📈 Updating prices for ${validStocks.length} stocks...`);
    
    // Update each valid stock price
  for (const symbol in market) {
    if (symbol === 'lastEvent') continue;
    
    const oldPrice = market[symbol].price;
    const stockMeta = meta[symbol] || { volatility: 'medium' };
    let volatility = getVolatility(stockMeta.volatility) * freezeMultiplier;
    
    // Special GYATT beach hours volatility doubling
    if (symbol === 'GYATT' && triggers.GYATT && triggers.GYATT > 0) {
      const currentHour = new Date().getHours();
      const isBeachHours = currentHour >= 10 && currentHour <= 16;
      if (isBeachHours) {
        volatility *= 2; // Double volatility during beach hours
      }
    }
    
    // Base random change
    const randomChange = getRandomInRange(-volatility, volatility);
    
    // Event bonus from triggers
    let eventBonus = triggers[symbol] || 0;
    
    // Special Sunday immunity for LABUB
    if (symbol === 'LABUB' && triggers.LABUB_SUNDAY_IMMUNITY && eventBonus < 0) {
      eventBonus = 0; // Immune to crashes on Sunday
      console.log('LABUB Mostriciattolo Sunday immunity activated!');
    }
    
    // Trend boost from real-world data
    let trendBoost = 0;
    try {
      trendBoost = await getTrendScore(symbol);
    } catch (error) {
      console.log(`Trend fetch error for ${symbol}:`, error.message);
    }
    
    // Calculate new price
    const priceMultiplier = 1 + randomChange + eventBonus + trendBoost;
    let newPrice = oldPrice * priceMultiplier;
    
    // Apply minimum price for BANANI (Chimpanzini Bananini cannot drop below $0.20)
    if (symbol === 'BANANI' && stockMeta.minimumPrice) {
      newPrice = Math.max(stockMeta.minimumPrice, newPrice);
    }
    
    // General minimum price of $0.01
    newPrice = Math.max(0.01, newPrice);
    
    // Update market data
    market[symbol].price = newPrice;
    market[symbol].lastChange = ((newPrice - oldPrice) / oldPrice) * 100;
    
    // 🔧 Add price history entry for chart functionality
    try {
      await addPriceHistory(symbol, newPrice, trendBoost);
    } catch (historyError) {
      console.log(`⚠️ Failed to save price history for ${symbol}:`, historyError.message);
    }
    
    // Log significant changes (lowered threshold for more excitement)
    const totalChange = (eventBonus + trendBoost) * 100;
    if (Math.abs(totalChange) > 1) { // Was 3, now 1 for more logging
      const stockName = stockMeta.name || symbol;
      const italianName = stockMeta.italianName || stockName;
      console.log(`${symbol} (${italianName}): ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}% (Event: ${(eventBonus * 100).toFixed(1)}%, Trend: ${(trendBoost * 100).toFixed(1)}%)`);
    }
    
    // Special price protection log for BANANI
    if (symbol === 'BANANI' && newPrice === stockMeta.minimumPrice && oldPrice * priceMultiplier < stockMeta.minimumPrice) {
      console.log('BANANI Chimpanzini Bananini invincibility activated! Price floor protected.');
    }
  }
  
  // Update last event
  if (triggers.lastEvent) {
    market.lastEvent = triggers.lastEvent;
  }
  
  // Save updated market data
  fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
  console.log('📊 Market prices updated at', new Date().toLocaleTimeString());
  
  return market;
  
  } catch (error) {
    console.error('❌ Error updating prices:', error);
    
    // If there's an error, try to reinitialize the market
    try {
      console.log('🔄 Attempting to reinitialize market due to error...');
      initializeMarket();
      return null;
    } catch (initError) {
      console.error('❌ Failed to reinitialize market:', initError);
      return null;
    }
  }
}

// Initialize market with default stocks if not exists
export function initializeMarket() {
  if (!fs.existsSync(marketPath)) {
    const defaultMarket = {
      "SKIBI": { "price": 0.75, "lastChange": 0 },
      "SUS": { "price": 0.20, "lastChange": 0 },
      "SAHUR": { "price": 1.10, "lastChange": 0 },
      "LABUB": { "price": 4.50, "lastChange": 0 },
      "OHIO": { "price": 1.25, "lastChange": 0 },
      "RIZZL": { "price": 0.35, "lastChange": 0 },
      "GYATT": { "price": 0.15, "lastChange": 0 },
      "FRIED": { "price": 0.10, "lastChange": 0 },
      "SIGMA": { "price": 5.00, "lastChange": 0 },
      "TRALA": { "price": 0.65, "lastChange": 0 },
      "CROCO": { "price": 0.45, "lastChange": 0 },
      "FANUM": { "price": 0.30, "lastChange": 0 },
      "CAPPU": { "price": 2.75, "lastChange": 0 },
      "BANANI": { "price": 0.40, "lastChange": 0 },
      "LARILA": { "price": 3.25, "lastChange": 0 },
      "lastEvent": "🚀 Italian Meme Stock Exchange launched! 15 premium brainrot stocks now trading!"
    };
    fs.writeFileSync(marketPath, JSON.stringify(defaultMarket, null, 2));
    console.log('Market initialized with 15 Italian meme stocks');
  }
  
  if (!fs.existsSync(metaPath)) {
    const defaultMeta = {
      "SKIBI": { 
        "volatility": "extreme", 
        "italian": true,
        "name": "Skibidi Toilet",
        "italianName": "Gabibbi Toiletto",
        "specialPower": "pasta_hours",
        "description": "Gains +30% during pasta-eating hours"
      },
      "SUS": { 
        "volatility": "high", 
        "italian": true,
        "name": "Among Us",
        "italianName": "Tra-I-Nostri", 
        "specialPower": "imposter_panic",
        "description": "Imposter reports cause -20% panic dumps"
      },
      "SAHUR": { 
        "volatility": "extreme", 
        "italian": true,
        "name": "Tun Tun Sahur",
        "italianName": "Tamburello Mistico",
        "specialPower": "pizza_emoji",
        "description": "+15% when pizza emojis appear"
      },
      "LABUB": { 
        "volatility": "low", 
        "italian": true,
        "name": "Labubu",
        "italianName": "Mostriciattolo",
        "specialPower": "sunday_immunity",
        "description": "Immune to market crashes on Sundays"
      },
      "OHIO": { 
        "volatility": "high", 
        "italian": true,
        "name": "Ohio Final Boss",
        "italianName": "Caporetto Finale",
        "specialPower": "random_steal",
        "description": "Randomly steals 5% from other stocks"
      },
      "RIZZL": { 
        "volatility": "medium", 
        "italian": true,
        "name": "Rizzler",
        "italianName": "Casanova",
        "specialPower": "romance_boost",
        "description": "+25% when romance novels are mentioned"
      },
      "GYATT": { 
        "volatility": "extreme", 
        "italian": true,
        "name": "Gyatt",
        "italianName": "Culone",
        "specialPower": "beach_hours",
        "description": "Volatility doubles during beach hours"
      },
      "FRIED": { 
        "volatility": "high", 
        "italian": true,
        "name": "Deep Fryer",
        "italianName": "Friggitrice",
        "specialPower": "oil_shortage",
        "description": "+40% during olive oil shortage events"
      },
      "SIGMA": { 
        "volatility": "low", 
        "italian": true,
        "name": "Sigma Male",
        "italianName": "Machio",
        "specialPower": "bear_flex",
        "description": "Flexes on bears during market dips"
      },
      "TRALA": { 
        "volatility": "medium", 
        "italian": true,
        "name": "Tralalero Tralala",
        "italianName": "Tralalero Tralala",
        "specialPower": "sharknado",
        "description": "3-legged shark in Nike sneakers - +50% during sharknado events",
        "coreItalian": true
      },
      "CROCO": { 
        "volatility": "extreme", 
        "italian": true,
        "name": "Bombardiro Crocodilo",
        "italianName": "Bombardiro Crocodilo",
        "specialPower": "random_nuke",
        "description": "Explosive reptile - Randomly nukes another stock (-100%)",
        "coreItalian": true
      },
      "FANUM": { 
        "volatility": "medium", 
        "italian": true,
        "name": "Fanum Tax",
        "italianName": "Tassa Nonna",
        "specialPower": "weekly_tax",
        "description": "Steals 10% from portfolios weekly"
      },
      "CAPPU": { 
        "volatility": "medium", 
        "italian": true,
        "name": "Ballerina Cappuccina",
        "italianName": "Ballerina Cappuccina",
        "specialPower": "espresso_shortage",
        "description": "Coffee-headed dancer - +20% during espresso shortages",
        "coreItalian": true
      },
      "BANANI": { 
        "volatility": "low", 
        "italian": true,
        "name": "Chimpanzini Bananini",
        "italianName": "Chimpanzini Bananini",
        "specialPower": "price_floor",
        "description": "Invincible ape - Cannot drop below $0.20",
        "coreItalian": true,
        "minimumPrice": 0.20
      },
      "LARILA": { 
        "volatility": "high", 
        "italian": true,
        "name": "Lirili Larila",
        "italianName": "Lirili Larila",
        "specialPower": "time_freeze",
        "description": "Time-controlling cactus-elephant - Freezes other stocks hourly",
        "coreItalian": true
      }
    };
    fs.writeFileSync(metaPath, JSON.stringify(defaultMeta, null, 2));
    console.log('Market metadata initialized with Italian brainrot personalities');
  }
}

// Get market statistics
export function getMarketStats() {
  if (!fs.existsSync(marketPath)) return null;
  
  const market = JSON.parse(fs.readFileSync(marketPath));
  let totalValue = 0;
  let positiveStocks = 0;
  let negativeStocks = 0;
  let stockCount = 0;
  
  for (const [symbol, data] of Object.entries(market)) {
    if (symbol === 'lastEvent') continue;
    totalValue += data.price;
    stockCount++;
    
    if (data.lastChange > 0) positiveStocks++;
    else if (data.lastChange < 0) negativeStocks++;
  }
  
  return {
    totalValue,
    averagePrice: totalValue / stockCount,
    positiveStocks,
    negativeStocks,
    neutralStocks: stockCount - positiveStocks - negativeStocks,
    stockCount
  };
}
