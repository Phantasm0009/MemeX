import puppeteer from 'puppeteer';

export class OptimizedTikTokScraper {
  constructor() {
    this.lastRequest = 0;
    this.requestDelay = 2000; // 2 seconds between requests
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🎵 Initializing optimized TikTok scraper (simulation mode)...');
    this.isInitialized = true;
    console.log('✅ TikTok scraper initialized with intelligent simulation');
  }

  async getTikTokTrendScore(stockSymbol) {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastRequest < this.requestDelay) {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay - (now - this.lastRequest)));
    }
    this.lastRequest = Date.now();

    try {
      const searchTerms = this.getSearchTerms(stockSymbol);
      const primaryTerm = searchTerms[0];
      
      console.log(`🎵 Simulating TikTok trends for ${stockSymbol} (${primaryTerm})...`);

      // Use intelligent simulation instead of browser scraping
      const trendScore = this.getIntelligentSimulation(primaryTerm);
      
      console.log(`🎵 TikTok trend score for ${stockSymbol}: ${(trendScore * 100).toFixed(2)}%`);
      return trendScore;

    } catch (error) {
      console.error(`TikTok simulation error for ${stockSymbol}:`, error.message);
      return this.getFallbackScore();
    }
  }

  getIntelligentSimulation(hashtag) {
    // Enhanced simulation based on keyword popularity and current trends
    const trendingKeywords = {
      // High popularity keywords (2-4% boost potential)
      'skibidi': 0.035,
      'toilet': 0.025,
      'sigma': 0.030,
      'rizz': 0.040,
      'ohio': 0.035,
      'gyatt': 0.045,
      'fanum': 0.025,
      
      // Medium popularity keywords (1-2% boost potential)
      'among': 0.015,
      'us': 0.010,
      'sus': 0.020,
      'labubu': 0.015,
      'meme': 0.012,
      'viral': 0.018,
      'brainrot': 0.022,
      
      // Italian/Cultural keywords (variable boost)
      'pasta': 0.010,
      'pizza': 0.008,
      'italian': 0.012,
      'cappuccino': 0.008,
      'tamburello': 0.006,
      'crocodilo': 0.015,
      'bombardiro': 0.020,
      'chimpanzini': 0.010,
      'bananini': 0.008
    };

    let popularityScore = 0;
    const lowerHashtag = hashtag.toLowerCase();
    
    // Check for trending keywords
    for (const [keyword, boost] of Object.entries(trendingKeywords)) {
      if (lowerHashtag.includes(keyword)) {
        popularityScore += boost * (0.7 + Math.random() * 0.6); // 70-130% of keyword value
      }
    }

    // Add time-based variations (some keywords trend at different times)
    const hour = new Date().getHours();
    if (hour >= 15 && hour <= 21) { // Peak TikTok hours (3-9 PM)
      popularityScore *= 1.2;
    } else if (hour >= 0 && hour <= 6) { // Late night hours
      popularityScore *= 0.8;
    }

    // Add day-of-week variations
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekends
      popularityScore *= 1.15;
    }

    // Add some controlled randomness
    const randomVariation = (Math.random() - 0.5) * 0.015; // ±0.75%
    
    const finalScore = popularityScore + randomVariation;
    
    // Cap the score to reasonable bounds
    return Math.max(-0.02, Math.min(0.05, finalScore));
  }

  getFallbackScore() {
    // Weighted random that favors small positive movements (TikTok trends generally push up)
    const baseRandom = Math.random();
    
    if (baseRandom < 0.6) {
      // 60% chance of small positive trend (0% to +2%)
      return Math.random() * 0.02;
    } else if (baseRandom < 0.85) {
      // 25% chance of small negative trend (-1% to 0%)
      return -Math.random() * 0.01;
    } else {
      // 15% chance of larger movement (-2% to +3%)
      return (Math.random() - 0.4) * 0.05;
    }
  }

  getSearchTerms(stockSymbol) {
    const stockNameMappings = {
      'SKIBI': ['skibidi toilet', 'skibidi', 'toilet meme', 'gen alpha'],
      'SUS': ['among us', 'sus', 'imposter', 'crewmate', 'emergency meeting'],
      'SAHUR': ['tun tun sahur', 'sahur', 'tamburello', 'drumming meme'],
      'LABUB': ['labubu', 'pop mart', 'labubu doll', 'cute monster'],
      'OHIO': ['ohio meme', 'ohio final boss', 'only in ohio', 'ohio skibidi'],
      'RIZZL': ['rizzler', 'rizz', 'charisma', 'ohio rizzler'],
      'GYATT': ['gyatt', 'gyat meme', 'thick', 'kai cenat gyatt'],
      'FRIED': ['deep fryer meme', 'fried', 'cooking', 'deep fried'],
      'SIGMA': ['sigma male', 'sigma grindset', 'alpha male', 'patrick bateman'],
      'TRALA': ['tralalero tralala', 'shark nike', 'three legged shark', 'italian meme'],
      'CROCO': ['bombardiro crocodilo', 'crocodile meme', 'croco', 'italian crocodile'],
      'FANUM': ['fanum tax', 'fanum', 'kai cenat', 'fanum meme'],
      'CAPPU': ['ballerina cappuccina', 'coffee dance', 'cappuccino', 'italian coffee'],
      'BANANI': ['chimpanzini bananini', 'monkey banana', 'ape meme', 'banana ape'],
      'LARILA': ['lirili larila', 'cactus elephant', 'time control', 'italian sound']
    };

    return stockNameMappings[stockSymbol] || [stockSymbol.toLowerCase()];
  }

  async close() {
    console.log('🎵 TikTok scraper closed (simulation mode)');
    this.isInitialized = false;
  }
}

// Create global instance
export const optimizedTikTokScraper = new OptimizedTikTokScraper();