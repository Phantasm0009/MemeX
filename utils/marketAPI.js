// API client for communicating with the backend server
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const marketPath = path.join(__dirname, '../market.json');

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

class MarketAPIClient {
  constructor(baseUrl = BACKEND_URL) {
    this.baseUrl = baseUrl;
    this.timeout = 8000; // 8 seconds timeout
    this.retries = 2; // Reduce retries for faster response
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        console.log(`🔗 API Request: ${url} (attempt ${attempt})`);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Italian-Meme-Stock-Bot/1.0',
            'Accept': 'application/json',
            ...options.headers
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 503) {
            console.log(`⚠️ Backend temporarily unavailable (503)`);
            throw new Error(`Backend service unavailable`);
          }
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ API Request successful`);
        return data;
        
      } catch (error) {
        console.log(`❌ API attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.retries) {
          console.log(`💀 All API attempts failed, falling back to local data`);
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Get all market data
  async getMarket() {
    try {
      const response = await this.makeRequest('/api/market');
      console.log(`🔍 API Response type: ${typeof response}, success: ${response?.success}, data length: ${response?.data?.length}`);
      
      // Handle new standalone API server response format
      if (response.success && response.data) {
        // Convert array of stocks back to object format for Discord bot compatibility
        const marketData = {};
        let processedCount = 0;
        response.data.forEach(stock => {
          if (stock.symbol && stock.symbol !== 'lastEvent') {
            marketData[stock.symbol] = {
              price: stock.price,
              change: stock.change,
              volume: stock.volume,
              high24h: stock.high24h,
              low24h: stock.low24h,
              name: stock.name,
              italianName: stock.italianName,
              description: stock.description
            };
            processedCount++;
          }
        });
        console.log(`📊 Processed ${processedCount} stocks, object keys: ${Object.keys(marketData).length}`);
        console.log(`🗝️ Stock symbols: ${Object.keys(marketData).join(', ')}`);
        console.log(`🔍 First stock data:`, Object.keys(marketData)[0] ? marketData[Object.keys(marketData)[0]] : 'None');
        return marketData;
      }
      
      // Handle legacy backend response format
      if (response.market) {
        return response.market;
      }
      
      // If no expected format, throw error to trigger fallback
      throw new Error('Invalid response format from backend');
      
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
      
      // Return a response that includes the number of updated stocks
      // Different backends return different formats, so we handle both
      if (data.market) {
        // Enhanced backend response format
        return data.market;
      } else if (data.updatedStocks !== undefined) {
        // Simple backend response format
        return {
          updatedStocks: data.updatedStocks,
          message: data.message,
          timestamp: data.timestamp
        };
      } else {
        // Fallback
        return { updatedStocks: 15, message: 'Prices updated' };
      }
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

export async function updateDiscordUserInfo(userId, discordUser) {
  try {
    const payload = {
      userId: userId,
      username: discordUser.username || null,
      globalName: discordUser.globalName || null,
      displayName: discordUser.displayName || null,
      discriminator: discordUser.discriminator || null
    };
    
    return await marketAPI.makeRequest(`/api/sync-discord-user`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.log(`⚠️ Failed to sync Discord user info for ${userId}:`, error.message);
    return null;
  }
}

export async function syncDiscordUsers(users) {
  try {
    return await marketAPI.makeRequest(`/api/sync-discord-users`, {
      method: 'POST',
      body: JSON.stringify({ users })
    });
  } catch (error) {
    console.log(`⚠️ Failed to bulk sync Discord users:`, error.message);
    return null;
  }
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
