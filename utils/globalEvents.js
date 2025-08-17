import { getTrendScore } from './realTrendFetcher.js';
import fetch from 'node-fetch';

// Global event system with dynamic chances and effects
export class GlobalMarketEvents {
  constructor() {
    this.lastEventTime = 0;
    this.eventCooldown = 60000; // 1 minute minimum between events
    this.frozenStocks = new Map(); // Track frozen stocks
    this.mergedStocks = new Map(); // Track temporarily merged stocks
  }

  // Main event checker - called every minute
  async checkForGlobalEvents() {
    const now = Date.now();
    if (now - this.lastEventTime < this.eventCooldown) {
      return null;
    }

    // Check each event type
    const events = await Promise.all([
      this.checkMemeMarketBoom(),
      this.checkMemeCrash(),
      this.checkViralTikTokChallenge(),
      this.checkRedditMemeHype(),
      this.checkHeatwaveMeltdown(),
      this.checkGlobalPizzaDay(),
      this.checkInternetOutage(),
      this.checkStockFreezeHour(),
      this.checkMarketRomance(),
      this.checkTrendSurge(),
      this.checkPastaParty(),
      this.checkStockPanic(),
      this.checkWeekendChill(),
      this.checkMemeMutation(),
      this.checkGlobalJackpot(),
      this.checkChaosHour()
    ]);

    // Find triggered events
    const triggeredEvents = events.filter(event => event !== null);
    
    if (triggeredEvents.length > 0) {
      this.lastEventTime = now;
      // Return the first triggered event (events are checked in priority order)
      return triggeredEvents[0];
    }

    return null;
  }

  // 1. Meme Market Boom (10% chance)
  async checkMemeMarketBoom() {
    if (Math.random() > 0.10) return null;

    const boost = 0.10 + Math.random() * 0.10; // 10-20%
    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    
    const triggers = {};
    allStocks.forEach(stock => {
      triggers[stock] = boost + (Math.random() * 0.05 - 0.025); // Add variance
    });

    return {
      type: 'meme_market_boom',
      name: 'Global Meme Market Boom',
      description: 'Worldwide meme surge detected! All stocks pumping!',
      triggers,
      lastEvent: `🚀 GLOBAL MEME BOOM! All stocks +${(boost * 100).toFixed(1)}%! Internet going crazy!`,
      globalImpact: true,
      rarity: 'common'
    };
  }

  // 2. Meme Crash (5% chance)
  async checkMemeCrash() {
    if (Math.random() > 0.05) return null;

    const crash = -(0.15 + Math.random() * 0.15); // -15% to -30%
    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    
    const triggers = {};
    allStocks.forEach(stock => {
      triggers[stock] = crash + (Math.random() * 0.05 - 0.025);
    });

    return {
      type: 'meme_crash',
      name: 'Global Meme Crash',
      description: 'Market-wide meme fatigue detected! Mass sell-off!',
      triggers,
      lastEvent: `💥 GLOBAL MEME CRASH! All stocks ${(crash * 100).toFixed(1)}%! Paper hands everywhere!`,
      globalImpact: true,
      rarity: 'uncommon'
    };
  }

  // 3. Viral TikTok Challenge (15% chance)
  async checkViralTikTokChallenge() {
    if (Math.random() > 0.15) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    const affectedStocks = this.getRandomStocks(allStocks, 2 + Math.floor(Math.random() * 2)); // 2-3 stocks
    
    const triggers = {};
    const challengeNames = ['dance', 'transition', 'food', 'comedy', 'viral', 'trend', 'challenge'];
    const challengeName = challengeNames[Math.floor(Math.random() * challengeNames.length)];
    
    for (const stock of affectedStocks) {
      const boost = 0.20 + Math.random() * 0.30; // 20-50%
      triggers[stock] = boost;
    }

    return {
      type: 'viral_tiktok_challenge',
      name: 'Viral TikTok Challenge',
      description: `#${challengeName}Challenge going viral! Boosting related memes!`,
      triggers,
      lastEvent: `🎵 VIRAL TIKTOK CHALLENGE! #${challengeName}Challenge boosts ${affectedStocks.join(', ')} by +20-50%!`,
      globalImpact: false,
      rarity: 'common'
    };
  }

  // 4. Reddit Meme Hype (15% chance)
  async checkRedditMemeHype() {
    if (Math.random() > 0.15) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    const affectedStocks = this.getRandomStocks(allStocks, 1 + Math.floor(Math.random() * 4)); // 1-5 stocks
    
    const triggers = {};
    for (const stock of affectedStocks) {
      triggers[stock] = 0.10 + Math.random() * 0.05; // 10-15%
    }

    const subreddit = ['r/memes', 'r/dankmemes', 'r/wholesomememes', 'r/memeeconomy'][Math.floor(Math.random() * 4)];

    return {
      type: 'reddit_meme_hype',
      name: 'Reddit Meme Hype',
      description: `Trending on ${subreddit}! Meme stonks rising!`,
      triggers,
      lastEvent: `🔴 REDDIT HYPE! ${subreddit} trending boosts ${affectedStocks.join(', ')} +10%!`,
      globalImpact: false,
      rarity: 'common'
    };
  }

  // 5. Heatwave Meme Meltdown (5-10% chance)
  async checkHeatwaveMeltdown() {
    const chance = 0.05 + Math.random() * 0.05; // 5-10%
    if (Math.random() > chance) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    const meltdownStocks = this.getRandomStocks(allStocks, 1 + Math.floor(Math.random() * 2)); // 1-2 stocks
    
    const triggers = {};
    for (const stock of meltdownStocks) {
      const crash = -(0.20 + Math.random() * 0.20); // -20% to -40%
      triggers[stock] = crash;
    }

    return {
      type: 'heatwave_meltdown',
      name: 'Heatwave Meme Meltdown',
      description: 'Extreme heat causing server meltdowns! Stocks crashing!',
      triggers,
      lastEvent: `🔥 HEATWAVE MELTDOWN! Servers overheating! ${meltdownStocks.join(', ')} crash -20-40%!`,
      globalImpact: false,
      rarity: 'uncommon'
    };
  }

  // 6. Global Pizza Day (20% chance)
  async checkGlobalPizzaDay() {
    if (Math.random() > 0.20) return null;

    const italianStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    
    const triggers = {
      'SAHUR': 0.15 // SAHUR gets special pizza boost
    };
    
    // Other Italian stocks get smaller boost
    italianStocks.forEach(stock => {
      if (stock !== 'SAHUR') {
        triggers[stock] = 0.10;
      }
    });

    return {
      type: 'global_pizza_day',
      name: 'Global Pizza Day',
      description: 'Pizza emojis flooding the internet! Italian stocks rising!',
      triggers,
      lastEvent: `🍕 GLOBAL PIZZA DAY! SAHUR +15%, all Italian stocks +10%! Mamma mia!`,
      globalImpact: true,
      rarity: 'common'
    };
  }

  // 7. Internet Outage Panic (5% chance)
  async checkInternetOutage() {
    if (Math.random() > 0.05) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    
    const triggers = {};
    allStocks.forEach(stock => {
      const drop = -(0.05 + Math.random() * 0.10); // -5% to -15%
      triggers[stock] = drop;
    });

    const region = ['Global', 'US East Coast', 'Europe', 'Asia'][Math.floor(Math.random() * 4)];

    return {
      type: 'internet_outage_panic',
      name: 'Internet Outage Panic',
      description: `${region} internet outages causing panic selling!`,
      triggers,
      lastEvent: `📡💔 INTERNET OUTAGE! ${region} connection issues! All stocks -5-15%!`,
      globalImpact: true,
      rarity: 'uncommon'
    };
  }

  // 8. Stock Freeze Hour (10% chance)
  async checkStockFreezeHour() {
    if (Math.random() > 0.10) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    const frozenStocks = this.getRandomStocks(allStocks, 1 + Math.floor(Math.random() * 2)); // 1-2 stocks
    
    // Mark stocks as frozen for next few updates
    const freezeTime = Date.now() + (3 * 60 * 1000); // 3 minutes
    frozenStocks.forEach(stock => {
      this.frozenStocks.set(stock, freezeTime);
    });

    return {
      type: 'stock_freeze_hour',
      name: 'Stock Freeze Hour',
      description: 'Market manipulation detected! Some stocks frozen!',
      triggers: { FREEZE_STOCKS: frozenStocks },
      lastEvent: `🧊 STOCK FREEZE! ${frozenStocks.join(', ')} frozen for 3 minutes! Market manipulation!`,
      globalImpact: false,
      rarity: 'common'
    };
  }

  // 9. Market-wide Romance (15% chance)
  async checkMarketRomance() {
    if (Math.random() > 0.15) return null;

    const romanticBoost = 0.25;
    const generalBoost = 0.10;
    
    const triggers = {
      'RIZZL': romanticBoost
    };
    
    // Other stocks get smaller romance boost
    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    allStocks.forEach(stock => {
      if (stock !== 'RIZZL') {
        triggers[stock] = generalBoost;
      }
    });

    return {
      type: 'market_romance',
      name: 'Market-wide Romance',
      description: 'Love is in the air! Romance trending globally!',
      triggers,
      lastEvent: `💕 MARKET ROMANCE! Love trending! RIZZL +25%, all stocks +10%! Amore everywhere!`,
      globalImpact: true,
      rarity: 'common'
    };
  }

  // 10. Trend Surge (10% chance)
  async checkTrendSurge() {
    if (Math.random() > 0.10) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    const trendingStocks = this.getRandomStocks(allStocks, 3); // Top 3 trending
    
    const triggers = {};
    for (const stock of trendingStocks) {
      const boost = 0.10 + Math.random() * 0.10; // 10-20%
      triggers[stock] = boost;
    }

    return {
      type: 'trend_surge',
      name: 'Global Trend Surge',
      description: 'Google Trends spike detected! Top memes surging!',
      triggers,
      lastEvent: `📊 TREND SURGE! Google Trends spike! ${trendingStocks.join(', ')} +10-20%!`,
      globalImpact: false,
      rarity: 'common'
    };
  }

  // 11. Pasta Party (20% chance)
  async checkPastaParty() {
    if (Math.random() > 0.20) return null;

    const italianStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    
    const triggers = {};
    italianStocks.forEach(stock => {
      triggers[stock] = 0.25; // All Italian stocks +25%
    });

    return {
      type: 'pasta_party',
      name: 'Global Pasta Party',
      description: 'Pasta emojis trending worldwide! Italian dominance!',
      triggers,
      lastEvent: `🍝 PASTA PARTY! Global pasta surge! All Italian stocks +25%! Andiamo!`,
      globalImpact: true,
      rarity: 'common'
    };
  }

  // 12. Stock Panic (10% chance)
  async checkStockPanic() {
    if (Math.random() > 0.10) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    const panicStocks = this.getRandomStocks(allStocks, 2 + Math.floor(Math.random() * 2)); // 2-3 stocks
    
    const triggers = {};
    for (const stock of panicStocks) {
      const drop = -(0.10 + Math.random() * 0.20); // -10% to -30%
      triggers[stock] = drop;
    }

    const panicReasons = ['FUD spreading', 'Whale selling', 'Bot manipulation', 'Market makers dumping'];
    const reason = panicReasons[Math.floor(Math.random() * panicReasons.length)];

    return {
      type: 'stock_panic',
      name: 'Stock Panic Event',
      description: `${reason} causing panic in select stocks!`,
      triggers,
      lastEvent: `😰 STOCK PANIC! ${reason}! ${panicStocks.join(', ')} crash -10-30%!`,
      globalImpact: false,
      rarity: 'common'
    };
  }

  // 13. Weekend Chill (100% chance on weekends)
  async checkWeekendChill() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (day !== 0 && day !== 6) return null; // Only weekends

    const chillStocks = ['LABUB', 'SIGMA', 'BANANI']; // Low volatility stocks
    
    const triggers = {};
    chillStocks.forEach(stock => {
      triggers[stock] = 0.05 + Math.random() * 0.05; // 5-10%
    });

    return {
      type: 'weekend_chill',
      name: 'Weekend Chill Mode',
      description: 'Weekend vibes! Low volatility stocks stabilizing!',
      triggers,
      lastEvent: `😎 WEEKEND CHILL! ${chillStocks.join(', ')} stabilizing +5-10%! Relax mode activated!`,
      globalImpact: false,
      rarity: 'scheduled'
    };
  }

  // 14. Meme Mutation (5% chance)
  async checkMemeMutation() {
    if (Math.random() > 0.05) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    const mutatedStocks = this.getRandomStocks(allStocks, 2); // Always 2 stocks
    
    // Temporarily merge stocks for 10 minutes
    const mergeTime = Date.now() + (10 * 60 * 1000);
    const mergeId = `${mutatedStocks[0]}_${mutatedStocks[1]}`;
    this.mergedStocks.set(mergeId, {
      stocks: mutatedStocks,
      expires: mergeTime,
      combinedBoost: 0.15 + Math.random() * 0.10 // 15-25% combined boost
    });

    const triggers = {};
    mutatedStocks.forEach(stock => {
      triggers[stock] = 0.15 + Math.random() * 0.10;
    });

    return {
      type: 'meme_mutation',
      name: 'Meme Mutation Event',
      description: `${mutatedStocks.join(' + ')} fusion detected! Temporary merge!`,
      triggers,
      lastEvent: `🧬 MEME MUTATION! ${mutatedStocks.join(' + ')} temporarily merged! Combined effects for 10 minutes!`,
      globalImpact: false,
      rarity: 'rare'
    };
  }

  // 15. Global Jackpot (1-2% chance)
  async checkGlobalJackpot() {
    const chance = 0.01 + Math.random() * 0.01; // 1-2%
    if (Math.random() > chance) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    const jackpotStocks = this.getRandomStocks(allStocks, 1 + Math.floor(Math.random() * 3)); // 1-3 stocks
    
    const triggers = {};
    for (const stock of jackpotStocks) {
      triggers[stock] = 0.50 + Math.random() * 0.25; // 50-75% boost!
    }

    return {
      type: 'global_jackpot',
      name: 'GLOBAL JACKPOT EVENT',
      description: 'ULTRA RARE JACKPOT! Massive gains incoming!',
      triggers,
      lastEvent: `🎰 GLOBAL JACKPOT! ULTRA RARE EVENT! ${jackpotStocks.join(', ')} MOON +50-75%! 💎🚀`,
      globalImpact: true,
      rarity: 'legendary'
    };
  }

  // 16. Chaos Hour (10% chance)
  async checkChaosHour() {
    if (Math.random() > 0.10) return null;

    const allStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
    
    const triggers = {};
    allStocks.forEach(stock => {
      // Random chaos: -30% to +30%
      const chaosEffect = (Math.random() - 0.5) * 0.6;
      triggers[stock] = chaosEffect;
    });

    return {
      type: 'chaos_hour',
      name: 'CHAOS HOUR ACTIVATED',
      description: 'Total market chaos! Random effects on all stocks!',
      triggers,
      lastEvent: `🌪️ CHAOS HOUR! Total market madness! Random ±30% on all stocks! Pure chaos!`,
      globalImpact: true,
      rarity: 'uncommon'
    };
  }

  // Helper function to get random stocks
  getRandomStocks(stockArray, count) {
    const shuffled = [...stockArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Check if a stock is currently frozen
  isStockFrozen(stockSymbol) {
    const freezeTime = this.frozenStocks.get(stockSymbol);
    if (freezeTime && Date.now() < freezeTime) {
      return true;
    }
    if (freezeTime) {
      this.frozenStocks.delete(stockSymbol); // Remove expired freeze
    }
    return false;
  }

  // Get active merged stocks info
  getActiveMerges() {
    const now = Date.now();
    const activeMerges = [];
    
    for (const [mergeId, mergeData] of this.mergedStocks.entries()) {
      if (now < mergeData.expires) {
        activeMerges.push(mergeData);
      } else {
        this.mergedStocks.delete(mergeId); // Remove expired merges
      }
    }
    
    return activeMerges;
  }
}

// Create global instance
export const globalMarketEvents = new GlobalMarketEvents();