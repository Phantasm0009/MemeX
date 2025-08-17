// API client for communicating with the backend server
import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

class MarketAPIClient {
  constructor(baseUrl = BACKEND_URL) {
    this.baseUrl = baseUrl;
    this.timeout = 10000; // Increased to 10 seconds
    this.retries = 3; // Add retry logic
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        console.log(`🔗 Attempting to connect to backend: ${url} (attempt ${attempt})`);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Italian-Meme-Stock-Bot/1.0',
            ...options.headers
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Backend connection successful on attempt ${attempt}`);
        return data;
        
      } catch (error) {
        console.log(`❌ Backend connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Get all market data
  async getMarket() {
    try {
      const data = await this.makeRequest('/api/market');
      return data.market;
    } catch (error) {
      console.error('❌ Failed to fetch market data from backend:', error.message);
      console.log('🔄 Falling back to local market data...');
      // Fallback to local file
      return this.getLocalMarketData();
    }
  }

  // Get specific stock data
  async getStock(symbol) {
    try {
      const data = await this.makeRequest(`/api/stock/${symbol}`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch stock ${symbol} from backend:`, error.message);
      return null;
    }
  }

  // Get trend data for a stock
  async getTrends(symbol) {
    try {
      const data = await this.makeRequest(`/api/trends/${symbol}`);
      return data.trendScore;
    } catch (error) {
      console.error(`❌ Failed to fetch trends for ${symbol}:`, error.message);
      return 0;
    }
  }

  // Trigger manual price update
  async updatePrices(triggers = {}, enableChaos = true) {
    try {
      const data = await this.makeRequest('/api/update-prices', {
        method: 'POST',
        body: JSON.stringify({ triggers, enableChaos })
      });
      return data.market;
    } catch (error) {
      console.error('❌ Failed to trigger price update:', error.message);
      throw error;
    }
  }

  // Check backend health with better error handling
  async healthCheck() {
    try {
      console.log('🔍 Checking backend health...');
      const data = await this.makeRequest('/api/health');
      const isHealthy = data.status === 'healthy';
      console.log(isHealthy ? '✅ Backend is healthy' : '⚠️ Backend unhealthy');
      return isHealthy;
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      return false;
    }
  }

  // Fallback method to read local market data
  async getLocalMarketData() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const marketPath = path.join(__dirname, '../market.json');
      
      if (fs.existsSync(marketPath)) {
        const data = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
        console.log('📄 Using local market data as fallback');
        return data;
      }
      
      throw new Error('Local market data not found');
    } catch (error) {
      console.error('❌ Failed to read local market data:', error.message);
      return {};
    }
  }
}

// Create singleton instance
const marketAPI = new MarketAPIClient();

// Export functions that match the current interface
export async function getAllStocks() {
  return await marketAPI.getMarket();
}

export async function getStockPrice(symbol) {
  const market = await marketAPI.getMarket();
  return market[symbol]?.price || null;
}

export async function getStockData(symbol) {
  return await marketAPI.getStock(symbol);
}

export async function updateMarketPrices(triggers = {}) {
  return await marketAPI.updatePrices(triggers);
}

export async function checkBackendHealth() {
  return await marketAPI.healthCheck();
}

export { marketAPI };
export default marketAPI;
