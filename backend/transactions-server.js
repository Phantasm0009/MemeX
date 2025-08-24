// Simple backend server with Supabase transactions endpoint
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('🚀 Starting Transactions Backend Server');
console.log(`🔧 Loading .env from: ${envPath}`);

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
    service: 'Transactions Backend',
    timestamp: new Date().toISOString(),
    supabase: useSupabase ? 'connected' : 'disconnected'
  });
});

// Transactions endpoint - Get recent trading activity from Supabase
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
        username: 'Unknown', // We'll fetch usernames separately if needed
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
      // Fallback: return empty array if no Supabase
      console.log('⚠️ No Supabase connection - returning empty transactions');
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

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Transactions server running on port ${PORT}`);
  console.log(`📊 Transactions API: http://localhost:${PORT}/api/transactions`);
  console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
});
