// Enhanced backend server with transactions and leaderboard
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('🚀 Starting Enhanced Backend Server');
console.log(`🔧 Loading .env from: ${envPath}`);

// Market data paths
const marketPath = path.join(__dirname, '../market.json');

// Initialize Supabase
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || '';

let supabase = null;
let useSupabase = false;

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.length > 10 && SUPABASE_ANON_KEY.length > 10) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    useSupabase = true;
    console.log('✅ Supabase configured successfully');
  } catch (error) {
    console.log('⚠️ Supabase connection failed:', error.message);
    useSupabase = false;
  }
} else {
  console.log('⚠️ Supabase credentials not found');
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Enhanced Backend',
    timestamp: new Date().toISOString(),
    supabase: useSupabase ? 'connected' : 'disconnected'
  });
});

// Helper functions
async function getAllUsers() {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('balance', { ascending: false });
      
      if (error) throw error;
      
      return data.map(user => ({
        id: user.id,
        balance: parseFloat(user.balance) || 1000,
        username: user.username || null,
        global_name: user.global_name || null,
        display_name: user.display_name || null,
        discriminator: user.discriminator || null,
        lastDaily: user.last_daily || 0,
        lastMessage: user.last_message || 0,
        createdAt: user.created_at || null,
        joined_at: user.joined_at || null
      }));
    } catch (error) {
      console.error('Supabase getAllUsers error:', error.message);
      return [];
    }
  }
  return [];
}

async function getHoldings(userId) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return data.map(holding => ({
        stock: holding.stock,
        amount: holding.amount
      }));
    } catch (error) {
      console.error('Supabase getHoldings error:', error.message);
      return [];
    }
  }
  return [];
}

// Transactions endpoint
app.get('/api/transactions', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  
  try {
    console.log(`💰 API request: Fetching recent transactions (limit: ${limit})...`);
    
    if (useSupabase) {
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
        username: 'Unknown',
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

// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('🏆 API request: Fetching leaderboard...');
    
    const limit = parseInt(req.query.limit) || 10;
    const includeHoldings = req.query.includeHoldings !== 'false';
    
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
      try {
        market = JSON.parse(fs.readFileSync(marketPath));
        console.log(`📊 Loaded market data with ${Object.keys(market).length} stocks`);
      } catch (error) {
        console.error('Error loading market data:', error.message);
      }
    } else {
      console.log('⚠️ Market file not found, portfolio values will be 0');
    }
    
    // Calculate total wealth for each user
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      try {
        let balance = parseFloat(user.balance) || 1000;
        let portfolioValue = 0;
        let holdings = [];
        let totalInvested = 0;
        
        // Get holdings to calculate portfolio value
        holdings = await getHoldings(user.id);
        
        if (holdings && holdings.length > 0) {
          for (const holding of holdings) {
            const currentPrice = market[holding.stock]?.price || 0;
            const holdingValue = holding.amount * currentPrice;
            portfolioValue += holdingValue;
            
            // Estimate original investment (use current price * 0.8 as rough estimate)
            const estimatedAvgPrice = currentPrice * 0.8;
            totalInvested += Math.abs(holding.amount) * estimatedAvgPrice;
          }
        }
        
        const totalValue = balance + portfolioValue;
        
        // Calculate profit percentage
        const startingValue = 1000; // Default starting balance
        const totalInput = startingValue + totalInvested;
        const profit = totalValue - totalInput;
        const profitPercentage = totalInput > 0 ? ((profit / totalInput) * 100) : 0;
        
        // Get the best available username
        const displayName = user.global_name || user.display_name || user.username || `User#${user.id.slice(-4)}`;
        
        return {
          id: user.id,
          username: displayName,
          discriminator: user.discriminator || null,
          displayName: displayName,
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
    
    // Sort by total value descending
    const sortedUsers = enrichedUsers
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, Math.min(limit, 50));
    
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

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Enhanced server running on port ${PORT}`);
  console.log(`📊 Transactions API: http://localhost:${PORT}/api/transactions`);
  console.log(`🏆 Leaderboard API: http://localhost:${PORT}/api/leaderboard`);
  console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
});
