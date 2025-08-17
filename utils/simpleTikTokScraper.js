import fetch from 'node-fetch';

export class SimpleTikTokScraper {
  constructor() {
    this.lastRequest = 0;
    this.requestDelay = 5000; // 5 seconds between requests
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

      // Simulate TikTok trend data based on hashtag popularity
      const trendScore = this.getIntelligentSimulation(primaryTerm);
      
      console.log(`🎵 TikTok trend score for ${stockSymbol}: ${(trendScore * 100).toFixed(2)}%`);
      return trendScore;

    } catch (error) {
      console.error(`TikTok simulation error for ${stockSymbol}:`, error.message);
      return this.getFallbackScore();
    }
  }

  getIntelligentSimulation(hashtag) {
    // Simulate realistic trend scores based on hashtag characteristics
    const popularHashtags = [
      'skibidi', 'toilet', 'among', 'us', 'sus', 'rizz', 'ohio', 'sigma', 'gyatt',
      'fanum', 'tax', 'labubu', 'brainrot', 'gen', 'alpha', 'meme', 'viral'
    ];

    let popularityScore = 0;
    const lowerHashtag = hashtag.toLowerCase();
    
    for (const popular of popularHashtags) {
      if (lowerHashtag.includes(popular)) {
        popularityScore += 0.01; // +1% per popular keyword
      }
    }

    // Add some randomness but weight it towards the popularity
    const randomComponent = (Math.random() - 0.5) * 0.02; // ±1%
    const popularityComponent = popularityScore * (0.5 + Math.random() * 0.5);
    
    const finalScore = popularityComponent + randomComponent;
    return Math.max(-0.02, Math.min(0.04, finalScore));
  }

  getFallbackScore() {
    // Return realistic random score when simulation fails
    const baseScore = (Math.random() - 0.5) * 0.02; // -1% to +1%
    const trendBonus = Math.random() < 0.15 ? Math.random() * 0.03 : 0; // 15% chance of 0-3% bonus
    
    return Math.max(-0.02, Math.min(0.03, baseScore + trendBonus));
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
    // No cleanup needed for simple scraper
    console.log('🎵 Simple TikTok scraper closed');
  }
}

// Create global instance
export const simpleTikTokScraper = new SimpleTikTokScraper();