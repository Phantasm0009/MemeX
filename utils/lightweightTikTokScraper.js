import axios from 'axios';
import * as cheerio from 'cheerio';

export class LightweightTikTokScraper {
  constructor() {
    this.lastRequest = 0;
    this.requestDelay = 1000; // 1 second between requests for faster updates
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
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
      let bestScore = 0;
      let totalViews = 0;
      let successfulFetches = 0;

      console.log(`🎵 Fetching TikTok data for ${stockSymbol}: ${searchTerms.join(', ')}`);

      for (const term of searchTerms) {
        try {
          const views = await this.getHashtagViews(term);
          if (views > 0) {
            totalViews += views;
            successfulFetches++;
            console.log(`   - #${term}: ${this.formatViews(views)} views`);
          }
        } catch (error) {
          console.log(`   - #${term}: Failed (${error.message.substring(0, 30)})`);
        }
      }

      if (successfulFetches > 0) {
        // Calculate trend score based on total views and growth patterns
        const avgViews = totalViews / successfulFetches;
        bestScore = this.calculateTrendScore(avgViews, stockSymbol);
        console.log(`🎵 TikTok ${stockSymbol}: ${this.formatViews(totalViews)} total views → ${(bestScore * 100).toFixed(1)}% trend`);
      } else {
        // Fallback to intelligent simulation if all requests fail
        bestScore = this.getIntelligentSimulation(stockSymbol);
        console.log(`🎵 TikTok ${stockSymbol}: Using simulation → ${(bestScore * 100).toFixed(1)}% trend`);
      }

      return bestScore;
    } catch (error) {
      console.error(`TikTok scraping error for ${stockSymbol}:`, error.message);
      return this.getIntelligentSimulation(stockSymbol);
    }
  }

  async getHashtagViews(tag) {
    const url = `https://www.tiktok.com/tag/${tag}`;
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": userAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      },
      timeout: 5000
    });

    const $ = cheerio.load(data);
    
    // Try multiple selectors for view count
    const selectors = [
      "strong[data-e2e='challenge-views-count']",
      "[data-e2e='challenge-views-count']",
      ".challenge-views-count",
      ".views-count",
      "strong:contains('views')",
      "span:contains('views')"
    ];

    for (const selector of selectors) {
      const viewsText = $(selector).text();
      if (viewsText) {
        const views = this.parseViewCount(viewsText);
        if (views > 0) {
          return views;
        }
      }
    }

    // If no view count found, try to extract from script tags (JSON data)
    $('script').each((i, elem) => {
      const content = $(elem).html();
      if (content && content.includes('challengeInfo')) {
        try {
          const match = content.match(/"viewCount":"?(\d+)"?/);
          if (match) {
            return parseInt(match[1]);
          }
        } catch (e) {
          // Continue searching
        }
      }
    });

    return 0; // No views found
  }

  parseViewCount(viewsText) {
    if (!viewsText) return 0;
    
    // Remove non-numeric characters except K, M, B
    const cleanText = viewsText.replace(/[^\d.KMB]/gi, '').toUpperCase();
    
    let multiplier = 1;
    let numberPart = cleanText;
    
    if (cleanText.includes('K')) {
      multiplier = 1000;
      numberPart = cleanText.replace('K', '');
    } else if (cleanText.includes('M')) {
      multiplier = 1000000;
      numberPart = cleanText.replace('M', '');
    } else if (cleanText.includes('B')) {
      multiplier = 1000000000;
      numberPart = cleanText.replace('B', '');
    }
    
    const number = parseFloat(numberPart);
    return isNaN(number) ? 0 : Math.floor(number * multiplier);
  }

  calculateTrendScore(views, stockSymbol) {
    // Convert view count to trend score (-0.08 to +0.08)
    const baselineViews = {
      'SKIBI': 50000000,  // Skibidi is very popular
      'SUS': 30000000,    // Among Us still trending
      'OHIO': 20000000,   // Ohio meme popular
      'GYATT': 15000000,  // Gyatt trending
      'RIZZL': 25000000,  // Rizz very popular
      'LABUB': 5000000,   // Labubu niche but growing
      'SIGMA': 10000000,  // Sigma mindset content
      'SAHUR': 3000000,   // More niche
      'FRIED': 8000000,   // Food content popular
      'TRALA': 2000000,   // Italian specific
      'CROCO': 4000000,   // Italian specific
      'FANUM': 12000000,  // Fanum tax popular
      'CAPPU': 3000000,   // Italian coffee culture
      'BANANI': 1000000,  // Very niche
      'LARILA': 1500000   // Very niche
    };

    const baseline = baselineViews[stockSymbol] || 5000000;
    const ratio = views / baseline;
    
    // Convert ratio to trend score
    let score = 0;
    if (ratio > 1) {
      // Views above baseline = positive trend
      score = Math.min(0.08, (ratio - 1) * 0.1);
    } else {
      // Views below baseline = negative trend
      score = Math.max(-0.08, (ratio - 1) * 0.1);
    }

    // Add some randomness for market volatility
    const volatility = (Math.random() - 0.5) * 0.02;
    return score + volatility;
  }

  getIntelligentSimulation(stockSymbol) {
    // Intelligent simulation based on stock characteristics
    const stockProfiles = {
      'SKIBI': { base: 0.03, volatility: 0.04 },    // High positive trend
      'SUS': { base: 0.02, volatility: 0.03 },      // Moderate positive
      'OHIO': { base: 0.015, volatility: 0.025 },   // Moderate positive
      'GYATT': { base: 0.02, volatility: 0.04 },    // High volatility
      'RIZZL': { base: 0.025, volatility: 0.03 },   // Strong positive
      'LABUB': { base: 0.01, volatility: 0.02 },    // Moderate growth
      'SIGMA': { base: 0.015, volatility: 0.02 },   // Steady positive
      'SAHUR': { base: 0.005, volatility: 0.015 },  // Small positive
      'FRIED': { base: 0.01, volatility: 0.02 },    // Food content stable
      'TRALA': { base: 0.008, volatility: 0.015 },  // Italian niche
      'CROCO': { base: 0.01, volatility: 0.02 },    // Italian moderate
      'FANUM': { base: 0.02, volatility: 0.03 },    // Meme popular
      'CAPPU': { base: 0.005, volatility: 0.01 },   // Niche but stable
      'BANANI': { base: 0.002, volatility: 0.008 }, // Very niche
      'LARILA': { base: 0.003, volatility: 0.01 }   // Very niche
    };

    const profile = stockProfiles[stockSymbol] || { base: 0.01, volatility: 0.02 };
    const randomFactor = (Math.random() - 0.5) * profile.volatility;
    return profile.base + randomFactor;
  }

  getSearchTerms(stockSymbol) {
    const mappings = {
      'SKIBI': ['skibidi', 'skibiditoilet', 'skibidibop'],
      'SUS': ['sus', 'amongus', 'imposter', 'suspicious'],
      'OHIO': ['ohio', 'onlyinohio', 'ohiomeme'],
      'GYATT': ['gyatt', 'gyat', 'damnnnn'],
      'RIZZL': ['rizz', 'rizzler', 'charisma', 'rizup'],
      'LABUB': ['labubu', 'popmart', 'labubumania'],
      'SIGMA': ['sigma', 'sigmamale', 'sigmamindset', 'sigmagrindset'],
      'SAHUR': ['tamburello', 'italian', 'pasta'],
      'FRIED': ['fried', 'food', 'cooking'],
      'TRALA': ['tralala', 'italian', 'italia'],
      'CROCO': ['crocodile', 'croco', 'reptile'],
      'FANUM': ['fanum', 'fanumtax', 'tax'],
      'CAPPU': ['cappuccino', 'coffee', 'espresso'],
      'BANANI': ['banana', 'fruit', 'yellow'],
      'LARILA': ['larila', 'italian', 'rare']
    };
    
    return mappings[stockSymbol] || [stockSymbol.toLowerCase()];
  }

  formatViews(views) {
    if (views >= 1000000000) {
      return (views / 1000000000).toFixed(1) + 'B';
    } else if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  async close() {
    // Nothing to clean up for HTTP-based scraping
    console.log('🎵 Lightweight TikTok scraper closed');
  }
}

// Create global instance
export const lightweightTikTokScraper = new LightweightTikTokScraper();
