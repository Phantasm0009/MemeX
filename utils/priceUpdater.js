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
    case 'low': return 0.02;      // 2% max change (reduced from 8%)
    case 'medium': return 0.04;   // 4% max change (reduced from 15%)
    case 'high': return 0.06;     // 6% max change (reduced from 25%)
    case 'extreme': return 0.08;  // 8% max change (reduced from 45%)
    default: return 0.04;         // Default to medium volatility
  }
}

// Helper function to calculate resistance zone
function getResistanceZone(price, maxPrice) {
  const ratio = price / maxPrice;
  if (ratio >= 0.95) return 'strong';
  if (ratio >= 0.80) return 'medium';
  return 'none';
}

// Helper function to get resistance multiplier and drift
function getResistanceEffects(resistanceZone) {
  switch (resistanceZone) {
    case 'strong':
      return {
        volatilityMultiplier: 0.25,
        drift: -0.005 - (Math.random() * 0.015) // -0.5% to -2%
      };
    case 'medium':
      return {
        volatilityMultiplier: 0.5,
        drift: -0.001 - (Math.random() * 0.004) // -0.1% to -0.5%
      };
    default:
      return {
        volatilityMultiplier: 1.0,
        drift: 0
      };
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
    
    // Add random chaos events (10% chance for more stability)
    if (enableChaos && Math.random() < 0.10) {
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
    
    // 🚀 SOFT RESISTANCE MECHANIC
    const maxPrice = stockMeta.maxPrice || 1000;
    const resistanceZone = getResistanceZone(oldPrice, maxPrice);
    const { volatilityMultiplier, drift: resistanceDrift } = getResistanceEffects(resistanceZone);
    
    let adjustedVolatility = volatility * volatilityMultiplier;
    
    // Log resistance zone activity
    if (resistanceZone !== 'none') {
      const priceRatio = oldPrice / maxPrice;
      console.log(`� ${symbol} in ${resistanceZone} resistance zone (${(priceRatio * 100).toFixed(1)}% of $${maxPrice} max)`);
    }
    
    // Calculate price change with adjusted volatility and resistance
    const adjustedRandomChange = getRandomInRange(-adjustedVolatility, adjustedVolatility);
    const totalPriceChange = adjustedRandomChange + eventBonus + trendBoost + resistanceDrift;
    const priceMultiplier = 1 + totalPriceChange;
    let newPrice = oldPrice * priceMultiplier;
    
    // Hard cap at maxPrice (final safety net)
    if (newPrice > maxPrice) {
      newPrice = maxPrice;
      console.log(`💰 ${symbol} hit hard price cap at $${maxPrice}`);
    }
    
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
    
    // Log significant changes and resistance mechanics
    const eventTrendChange = (eventBonus + trendBoost) * 100;
    const actualChange = ((newPrice - oldPrice) / oldPrice) * 100;
    
    if (Math.abs(eventTrendChange) > 1 || Math.abs(resistanceDrift * 100) > 0.1) {
      const stockName = stockMeta.name || symbol;
      const italianName = stockMeta.italianName || stockName;
      let logMessage = `${symbol} (${italianName}): ${actualChange > 0 ? '+' : ''}${actualChange.toFixed(1)}%`;
      
      if (Math.abs(eventTrendChange) > 0.1) {
        logMessage += ` (Event: ${(eventBonus * 100).toFixed(1)}%, Trend: ${(trendBoost * 100).toFixed(1)}%)`;
      }
      
      if (Math.abs(resistanceDrift * 100) > 0.1) {
        logMessage += ` [Resistance: ${(resistanceDrift * 100).toFixed(1)}%]`;
      }
      
      console.log(logMessage);
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
        "description": "Gains +30% during pasta-eating hours",
        "maxPrice": 750  // Ultra-meme trending stock
      },
      "SUS": { 
        "volatility": "high", 
        "italian": true,
        "name": "Among Us",
        "italianName": "Tra-I-Nostri", 
        "specialPower": "imposter_panic",
        "description": "Imposter reports cause -20% panic dumps",
        "maxPrice": 350  // Mid-tier classic meme
      },
      "SAHUR": { 
        "volatility": "extreme", 
        "italian": true,
        "name": "Tun Tun Sahur",
        "italianName": "Tamburello Mistico",
        "specialPower": "pizza_emoji",
        "description": "+15% when pizza emojis appear",
        "maxPrice": 200  // Niche Italian meme
      },
      "LABUB": { 
        "volatility": "low", 
        "italian": true,
        "name": "Labubu",
        "italianName": "Mostriciattolo",
        "specialPower": "sunday_immunity",
        "description": "Immune to market crashes on Sundays",
        "maxPrice": 600  // Premium collectible meme
      },
      "OHIO": { 
        "volatility": "high", 
        "italian": true,
        "name": "Ohio Final Boss",
        "italianName": "Caporetto Finale",
        "specialPower": "random_steal",
        "description": "Randomly steals 5% from other stocks",
        "maxPrice": 800  // Ultra-meme trending stock
      },
      "RIZZL": { 
        "volatility": "medium", 
        "italian": true,
        "name": "Rizzler",
        "italianName": "Casanova",
        "specialPower": "romance_boost",
        "description": "+25% when romance novels are mentioned",
        "maxPrice": 400  // Mid-tier classic meme
      },
      "GYATT": { 
        "volatility": "extreme", 
        "italian": true,
        "name": "Gyatt",
        "italianName": "Culone",
        "specialPower": "beach_hours",
        "description": "Volatility doubles during beach hours",
        "maxPrice": 150  // Niche/dead meme
      },
      "FRIED": { 
        "volatility": "high", 
        "italian": true,
        "name": "Deep Fryer",
        "italianName": "Friggitrice",
        "specialPower": "oil_shortage",
        "description": "+40% during olive oil shortage events",
        "maxPrice": 100  // Niche/dead meme
      },
      "SIGMA": { 
        "volatility": "low", 
        "italian": true,
        "name": "Sigma Male",
        "italianName": "Machio",
        "specialPower": "bear_flex",
        "description": "Flexes on bears during market dips",
        "maxPrice": 900  // Ultra-meme trending stock
      },
      "TRALA": { 
        "volatility": "medium", 
        "italian": true,
        "name": "Tralalero Tralala",
        "italianName": "Tralalero Tralala",
        "specialPower": "sharknado",
        "description": "3-legged shark in Nike sneakers - +50% during sharknado events",
        "coreItalian": true,
        "maxPrice": 180  // Niche/dead meme
      },
      "CROCO": { 
        "volatility": "extreme", 
        "italian": true,
        "name": "Bombardiro Crocodilo",
        "italianName": "Bombardiro Crocodilo",
        "specialPower": "random_nuke",
        "description": "Explosive reptile - Randomly nukes another stock (-100%)",
        "coreItalian": true,
        "maxPrice": 220  // Niche/dead meme
      },
      "FANUM": { 
        "volatility": "medium", 
        "italian": true,
        "name": "Fanum Tax",
        "italianName": "Tassa Nonna",
        "specialPower": "weekly_tax",
        "description": "Steals 10% from portfolios weekly",
        "maxPrice": 300  // Mid-tier classic meme
      },
      "CAPPU": { 
        "volatility": "medium", 
        "italian": true,
        "name": "Ballerina Cappuccina",
        "italianName": "Ballerina Cappuccina",
        "specialPower": "espresso_shortage",
        "description": "Coffee-headed dancer - +20% during espresso shortages",
        "coreItalian": true,
        "maxPrice": 450  // Mid-tier classic meme
      },
      "BANANI": { 
        "volatility": "low", 
        "italian": true,
        "name": "Chimpanzini Bananini",
        "italianName": "Chimpanzini Bananini",
        "specialPower": "price_floor",
        "description": "Invincible ape - Cannot drop below $0.20",
        "coreItalian": true,
        "minimumPrice": 0.20,
        "maxPrice": 65   // Joke/penny stock
      },
      "LARILA": { 
        "volatility": "high", 
        "italian": true,
        "name": "Lirili Larila",
        "italianName": "Lirili Larila",
        "specialPower": "time_freeze",
        "description": "Time-controlling cactus-elephant - Freezes other stocks hourly",
        "coreItalian": true,
        "maxPrice": 550  // Premium collectible meme
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

// Reset all prices to default values
export function resetPrices() {
  try {
    console.log('🔄 Resetting all stock prices to default values...');
    
    // Load current market data
    let market = {};
    if (fs.existsSync(marketPath)) {
      market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
    }
    
    // Default prices for all stocks
    const defaultPrices = {
      "SKIBI": 0.75,
      "SUS": 0.20,
      "SAHUR": 1.10,
      "LABUB": 4.50,
      "OHIO": 1.25,
      "RIZZL": 0.35,
      "GYATT": 0.15,
      "FRIED": 0.10,
      "SIGMA": 5.00,
      "TRALA": 0.65,
      "CROCO": 0.45,
      "FANUM": 0.30,
      "CAPPU": 2.75,
      "BANANI": 0.40,
      "LARILA": 3.25
    };
    
    // Reset each stock price
    let resetCount = 0;
    for (const [symbol, defaultPrice] of Object.entries(defaultPrices)) {
      if (market[symbol]) {
        const oldPrice = market[symbol].price;
        market[symbol].price = defaultPrice;
        market[symbol].lastChange = 0;
        market[symbol].high24h = defaultPrice;
        market[symbol].low24h = defaultPrice;
        console.log(`  ${symbol}: $${oldPrice.toFixed(2)} → $${defaultPrice}`);
        resetCount++;
      }
    }
    
    // Add reset event message
    market.lastEvent = `🔄 Market reset completed! ${resetCount} stocks returned to baseline prices.`;
    
    // Save the reset market
    fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
    
    console.log(`✅ Price reset complete! ${resetCount} stocks reset to default values.`);
    return { success: true, resetCount, message: market.lastEvent };
    
  } catch (error) {
    console.error('❌ Error resetting prices:', error);
    return { success: false, error: error.message };
  }
}
