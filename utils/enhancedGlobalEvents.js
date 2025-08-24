// Enhanced global events system with all requested events
export class EnhancedGlobalEvents {
  constructor() {
    this.lastEventTime = 0;
    this.eventCooldown = 30000; // 30 seconds minimum between events
    this.frozenStocks = new Map();
    this.mergedStocks = new Map();
    this.weekendEffectActive = false;
    
    // Event tracking properties for dashboard display
    this.lastEventName = null;
    this.lastEventDescription = null;
    this.lastEventDuration = null;
    this.lastEventRarity = null;
    this.lastEventType = null;
  }

  // Main event checker - called every minute
  async checkForGlobalEvents() {
    const now = Date.now();
    if (now - this.lastEventTime < this.eventCooldown) {
      return null;
    }

    // Check each event type with their specific chances
    const eventChecks = [
      { fn: () => this.checkMemeMarketBoom(), chance: 0.10 },
      { fn: () => this.checkMemeCrash(), chance: 0.05 },
      { fn: () => this.checkViralTikTokChallenge(), chance: 0.15 },
      { fn: () => this.checkRedditMemeHype(), chance: 0.15 },
      { fn: () => this.checkHeatwaveMeltdown(), chance: 0.07 },
      { fn: () => this.checkGlobalPizzaDay(), chance: 0.20 },
      { fn: () => this.checkInternetOutage(), chance: 0.05 },
      { fn: () => this.checkStockFreezeHour(), chance: 0.10 },
      { fn: () => this.checkMarketRomance(), chance: 0.15 },
      { fn: () => this.checkTrendSurge(), chance: 0.10 },
      { fn: () => this.checkPastaParty(), chance: 0.20 },
      { fn: () => this.checkStockPanic(), chance: 0.10 },
      { fn: () => this.checkWeekendChill(), chance: this.isWeekend() ? 1.0 : 0 },
      { fn: () => this.checkMemeMutation(), chance: 0.05 },
      { fn: () => this.checkGlobalJackpot(), chance: 0.02 },
      { fn: () => this.checkChaosHour(), chance: 0.10 }
    ];

    // Check each event
    for (const { fn, chance } of eventChecks) {
      if (Math.random() < chance) {
        const event = await fn();
        if (event) {
          this.lastEventTime = now;
          // Store event information for dashboard display
          this.lastEventName = event.name;
          this.lastEventDescription = event.description;
          this.lastEventDuration = event.duration || 60000;
          this.lastEventRarity = event.rarity || 'Common';
          this.lastEventType = event.type;
          
          console.log(`🌍 Global event triggered: ${event.name}`);
          return event;
        }
      }
    }

    return null;
  }

  // 1. Meme Market Boom (10% chance)
  async checkMemeMarketBoom() {
    const boost = 0.10 + Math.random() * 0.10; // 10-20%
    const allStocks = this.getAllStocks();
    
    const triggers = {};
    allStocks.forEach(stock => {
      triggers[stock] = boost;
    });

    return {
      type: 'meme_market_boom',
      name: 'Global Meme Market Boom',
      description: 'Worldwide meme surge detected! All stocks pumping!',
      triggers,
      lastEvent: `🚀 GLOBAL MEME BOOM! All stocks +${(boost * 100).toFixed(1)}%! Internet going crazy!`,
      globalImpact: true,
      rarity: 'common',
      duration: 60000 // 1 minute effect
    };
  }

  // 2. Meme Crash (5% chance)
  async checkMemeCrash() {
    const crash = -(0.15 + Math.random() * 0.15); // -15% to -30%
    const allStocks = this.getAllStocks();
    
    const triggers = {};
    allStocks.forEach(stock => {
      triggers[stock] = crash;
    });

    return {
      type: 'meme_crash',
      name: 'Global Meme Crash',
      description: 'Market-wide meme fatigue detected! Mass sell-off!',
      triggers,
      lastEvent: `💥 GLOBAL MEME CRASH! All stocks ${(crash * 100).toFixed(1)}%! Paper hands everywhere!`,
      globalImpact: true,
      rarity: 'uncommon',
      duration: 120000 // 2 minute effect
    };
  }

  // 3. Viral TikTok Challenge (15% chance)
  async checkViralTikTokChallenge() {
    const allStocks = this.getAllStocks();
    const affectedStocks = this.getRandomStocks(allStocks, 2 + Math.floor(Math.random() * 2)); // 2-3 stocks
    
    const triggers = {};
    const challengeNames = ['dance', 'transition', 'food', 'comedy', 'viral', 'trend', 'challenge', 'brainrot'];
    const challengeName = challengeNames[Math.floor(Math.random() * challengeNames.length)];
    
    for (const stock of affectedStocks) {
      triggers[stock] = 0.20 + Math.random() * 0.30; // +20-50%
    }

    return {
      type: 'viral_tiktok_challenge',
      name: 'Viral TikTok Challenge',
      description: `#${challengeName}Challenge going viral! Boosting related memes!`,
      triggers,
      lastEvent: `🎵 VIRAL TIKTOK CHALLENGE! #${challengeName}Challenge boosts ${affectedStocks.join(', ')} by +20-50%!`,
      globalImpact: false,
      rarity: 'common',
      duration: 180000 // 3 minute effect
    };
  }

  // 5. Reddit Meme Hype (15% chance)
  async checkRedditMemeHype() {
    const allStocks = this.getAllStocks();
    const affectedStocks = this.getRandomStocks(allStocks, 1 + Math.floor(Math.random() * 4)); // 1-5 stocks
    
    const triggers = {};
    for (const stock of affectedStocks) {
      triggers[stock] = 0.10; // +10%
    }

    const subreddit = ['r/memes', 'r/dankmemes', 'r/wholesomememes', 'r/memeeconomy'][Math.floor(Math.random() * 4)];

    return {
      type: 'reddit_meme_hype',
      name: 'Reddit Meme Hype',
      description: `Trending on ${subreddit}! Meme stonks rising!`,
      triggers,
      lastEvent: `🔴 REDDIT HYPE! ${subreddit} trending boosts ${affectedStocks.join(', ')} +10%!`,
      globalImpact: false,
      rarity: 'common',
      duration: 120000
    };
  }

  // 6. Heatwave Meme Meltdown (5-10% chance)
  async checkHeatwaveMeltdown() {
    const allStocks = this.getAllStocks();
    const meltdownStocks = this.getRandomStocks(allStocks, 1 + Math.floor(Math.random() * 2)); // 1-2 stocks
    
    const triggers = {};
    for (const stock of meltdownStocks) {
      triggers[stock] = -(0.20 + Math.random() * 0.20); // -20% to -40%
    }

    return {
      type: 'heatwave_meltdown',
      name: 'Heatwave Meme Meltdown',
      description: 'Extreme heat causing server meltdowns! Stocks crashing!',
      triggers,
      lastEvent: `🔥 HEATWAVE MELTDOWN! Servers overheating! ${meltdownStocks.join(', ')} crash -20-40%!`,
      globalImpact: false,
      rarity: 'uncommon',
      duration: 300000 // 5 minute effect
    };
  }

  // 7. Global Pizza Day (20% chance)
  async checkGlobalPizzaDay() {
    const italianStocks = this.getItalianStocks();
    
    const triggers = {
      'SAHUR': 0.15 // +15% special bonus
    };
    
    // Other Italian stocks get smaller boost
    italianStocks.forEach(stock => {
      if (stock !== 'SAHUR') {
        triggers[stock] = 0.10; // +10%
      }
    });

    return {
      type: 'global_pizza_day',
      name: 'Global Pizza Day',
      description: 'Pizza emojis flooding the internet! Italian stocks rising!',
      triggers,
      lastEvent: `🍕 GLOBAL PIZZA DAY! SAHUR +15%, all Italian stocks +10%! Mamma mia!`,
      globalImpact: true,
      rarity: 'common',
      duration: 600000 // 10 minute effect
    };
  }

  // 8. Internet Outage Panic (5% chance)
  async checkInternetOutage() {
    const allStocks = this.getAllStocks();
    const drop = -(0.05 + Math.random() * 0.10); // -5% to -15%
    
    const triggers = {};
    allStocks.forEach(stock => {
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
      rarity: 'uncommon',
      duration: 180000
    };
  }

  // 10. Stock Freeze Hour (10% chance)
  async checkStockFreezeHour() {
    const allStocks = this.getAllStocks();
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
      rarity: 'common',
      duration: 180000
    };
  }

  // 12. Market-wide Romance (15% chance)
  async checkMarketRomance() {
    const triggers = {
      'RIZZL': 0.25, // +25% special bonus
    };
    
    // Other stocks get smaller romance boost
    const allStocks = this.getAllStocks();
    allStocks.forEach(stock => {
      if (stock !== 'RIZZL') {
        triggers[stock] = 0.10; // +10%
      }
    });

    return {
      type: 'market_romance',
      name: 'Market-wide Romance',
      description: 'Love is in the air! Romance mentions boosting market!',
      triggers,
      lastEvent: `💕 MARKET ROMANCE! RIZZL +25%, all stocks feeling the love +10%!`,
      globalImpact: true,
      rarity: 'common',
      duration: 300000
    };
  }

  // 14. Trend Surge (10% chance)
  async checkTrendSurge() {
    const allStocks = this.getAllStocks();
    const trendingStocks = this.getRandomStocks(allStocks, 3); // Top 3 trending
    
    const triggers = {};
    trendingStocks.forEach(stock => {
      triggers[stock] = 0.10 + Math.random() * 0.10; // +10-20%
    });

    return {
      type: 'trend_surge',
      name: 'Global Trend Surge',
      description: 'Massive trend spike detected across platforms!',
      triggers,
      lastEvent: `📈 TREND SURGE! ${trendingStocks.join(', ')} surge +10-20% from global trends!`,
      globalImpact: false,
      rarity: 'common',
      duration: 240000
    };
  }

  // 15. Pasta Party (20% chance)
  async checkPastaParty() {
    const italianStocks = this.getItalianStocks();
    
    const triggers = {};
    italianStocks.forEach(stock => {
      triggers[stock] = 0.25; // +25%
    });

    return {
      type: 'pasta_party',
      name: 'Global Pasta Party',
      description: 'Pasta emojis trending worldwide! Italian power activated!',
      triggers,
      lastEvent: `🍝 PASTA PARTY! All Italian stocks +25%! Andiamo!`,
      globalImpact: true,
      rarity: 'common',
      duration: 360000 // 6 minutes
    };
  }

  // 16. Stock Panic (10% chance)
  async checkStockPanic() {
    const allStocks = this.getAllStocks();
    const panicStocks = this.getRandomStocks(allStocks, 2 + Math.floor(Math.random() * 2)); // 2-3 stocks
    
    const triggers = {};
    for (const stock of panicStocks) {
      triggers[stock] = -(0.10 + Math.random() * 0.20); // -10% to -30%
    }

    return {
      type: 'stock_panic',
      name: 'Stock Panic',
      description: 'Panic selling detected! Random stocks crashing!',
      triggers,
      lastEvent: `😱 STOCK PANIC! ${panicStocks.join(', ')} panic dump -10-30%!`,
      globalImpact: false,
      rarity: 'common',
      duration: 180000
    };
  }

  // 17. Weekend Chill (100% chance on weekends)
  async checkWeekendChill() {
    if (!this.isWeekend()) return null;

    const stableStocks = ['LABUB', 'SIGMA', 'BANANI']; // Low volatility stocks
    
    const triggers = {};
    stableStocks.forEach(stock => {
      triggers[stock] = 0.05 + Math.random() * 0.05; // +5-10%
    });

    return {
      type: 'weekend_chill',
      name: 'Weekend Chill Mode',
      description: 'Weekend vibes stabilizing low-volatility stocks!',
      triggers,
      lastEvent: `😎 WEEKEND CHILL! ${stableStocks.join(', ')} stabilize +5-10%!`,
      globalImpact: false,
      rarity: 'guaranteed',
      duration: 1800000 // 30 minutes
    };
  }

  // 18. Meme Mutation (5% chance)
  async checkMemeMutation() {
    const allStocks = this.getAllStocks();
    const stock1 = allStocks[Math.floor(Math.random() * allStocks.length)];
    const stock2 = allStocks[Math.floor(Math.random() * allStocks.length)];
    
    if (stock1 === stock2) return null;

    // Temporarily merge effects
    const mergeTime = Date.now() + (5 * 60 * 1000); // 5 minutes
    this.mergedStocks.set(`${stock1}_${stock2}`, mergeTime);

    const combinedEffect = 0.15 + Math.random() * 0.10; // +15-25%
    const triggers = {
      [stock1]: combinedEffect,
      [stock2]: combinedEffect
    };

    return {
      type: 'meme_mutation',
      name: 'Meme Mutation Event',
      description: 'Two memes have temporarily merged! Combined power!',
      triggers,
      lastEvent: `🧬 MEME MUTATION! ${stock1} + ${stock2} merge for +${(combinedEffect * 100).toFixed(1)}% combined power!`,
      globalImpact: false,
      rarity: 'rare',
      duration: 300000
    };
  }

  // 19. Global Jackpot (1-2% chance)
  async checkGlobalJackpot() {
    const allStocks = this.getAllStocks();
    const jackpotStocks = this.getRandomStocks(allStocks, 1 + Math.floor(Math.random() * 2)); // 1-3 stocks
    
    const triggers = {};
    for (const stock of jackpotStocks) {
      triggers[stock] = 0.50 + Math.random() * 0.25; // +50-75%
    }

    return {
      type: 'global_jackpot',
      name: 'GLOBAL JACKPOT EVENT',
      description: 'Ultra rare jackpot event! Astronomical gains!',
      triggers,
      lastEvent: `💎🚀 GLOBAL JACKPOT! ${jackpotStocks.join(', ')} MOON +50-75%! LEGENDARY EVENT!`,
      globalImpact: false,
      rarity: 'legendary',
      duration: 600000 // 10 minutes
    };
  }

  // 20. Chaos Hour (10% chance)
  async checkChaosHour() {
    const allStocks = this.getAllStocks();
    const triggers = {};
    
    // Random effects on all stocks
    allStocks.forEach(stock => {
      const chaos = (Math.random() - 0.5) * 0.4; // -20% to +20%
      triggers[stock] = chaos;
    });

    return {
      type: 'chaos_hour',
      name: 'CHAOS HOUR ACTIVATED',
      description: 'Total market chaos! Random effects on all stocks!',
      triggers,
      lastEvent: `🌪️ CHAOS HOUR! Total market madness! All stocks randomized!`,
      globalImpact: true,
      rarity: 'uncommon',
      duration: 300000
    };
  }

  // Helper functions
  getAllStocks() {
    return ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
  }

  getItalianStocks() {
    return ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
  }

  getRandomStocks(stockArray, count) {
    const shuffled = [...stockArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  isStockFrozen(stockSymbol) {
    const freezeTime = this.frozenStocks.get(stockSymbol);
    if (!freezeTime) return false;
    
    if (Date.now() > freezeTime) {
      this.frozenStocks.delete(stockSymbol);
      return false;
    }
    return true;
  }

  getActiveMerges() {
    const now = Date.now();
    const activeMerges = [];
    
    for (const [merge, expireTime] of this.mergedStocks.entries()) {
      if (now < expireTime) {
        const [stock1, stock2] = merge.split('_');
        activeMerges.push({ stock1, stock2, expires: expireTime });
      } else {
        this.mergedStocks.delete(merge);
      }
    }
    
    return activeMerges;
  }
}

// Create global instance
export const enhancedGlobalEvents = new EnhancedGlobalEvents();