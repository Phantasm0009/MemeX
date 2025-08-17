import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Supabase configuration - Fixed credential checking
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || '';

console.log('🔍 Supabase Environment Check:');
console.log(`   - SUPABASE_URL: ${SUPABASE_URL ? '✅ Found' : '❌ Missing'} (length: ${SUPABASE_URL.length})`);
console.log(`   - SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing'} (length: ${SUPABASE_ANON_KEY.length})`);

let supabase = null;
let useSupabase = false;

// Initialize Supabase if credentials are provided
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.length > 10 && SUPABASE_ANON_KEY.length > 10) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log('⚠️ Supabase connection test failed, falling back to JSON:', error.message);
      useSupabase = false;
      supabase = null;
    } else {
      useSupabase = true;
      console.log('✅ Supabase connected and tested successfully');
    }
  } catch (error) {
    console.log('⚠️ Supabase connection failed, falling back to JSON:', error.message);
    useSupabase = false;
    supabase = null;
  }
} else {
  console.log('⚠️ Supabase credentials not found or invalid, using JSON database');
  console.log(`   - URL length: ${SUPABASE_URL.length}, Key length: ${SUPABASE_ANON_KEY.length}`);
}

// Fallback to JSON database
const dbPath = path.join(__dirname, '../database.json');
const marketPath = path.join(__dirname, '../market.json');

function initJsonDb() {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      users: {},
      holdings: {},
      transactions: [],
      priceHistory: {}
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  }
}

function loadJsonDb() {
  if (!fs.existsSync(dbPath)) initJsonDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveJsonDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Database initialization
export async function initDb() {
  if (useSupabase) {
    try {
      // Test connection with a simple query
      const { data, error } = await supabase.from('users').select('id').limit(1);
      if (error) {
        console.log('⚠️ Supabase query test failed:', error.message);
        console.log('   Falling back to JSON database');
        useSupabase = false;
        initJsonDb();
      } else {
        console.log('✅ Supabase database connection verified');
      }
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error.message);
      useSupabase = false;
      initJsonDb();
    }
  } else {
    initJsonDb();
  }
}

// User operations
export async function getUser(id) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }
      
      if (data) {
        return {
          id: data.id,
          balance: parseFloat(data.balance) || 1000,
          lastDaily: data.last_daily || 0,
          lastMessage: data.last_message || 0
        };
      }
      
      // Create new user if not found
      const newUser = {
        id,
        balance: 1000,
        last_daily: 0,
        last_message: 0
      };
      
      await supabase.from('users').insert([newUser]);
      
      return {
        id,
        balance: 1000,
        lastDaily: 0,
        lastMessage: 0
      };
    } catch (error) {
      console.error('Supabase getUser error:', error.message);
      // Fall back to JSON
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.users[id]) {
    db.users[id] = {
      id,
      balance: 1000,
      lastDaily: 0,
      lastMessage: 0
    };
    saveJsonDb(db);
  }
  
  // Fix null balance issue
  if (typeof db.users[id].balance !== 'number' || isNaN(db.users[id].balance)) {
    db.users[id].balance = 1000;
    saveJsonDb(db);
  }
  
  return db.users[id];
}

export async function updateUserBalance(id, balance) {
  // Ensure balance is a valid number
  const validBalance = typeof balance === 'number' && !isNaN(balance) ? balance : 1000;
  
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert([{ id, balance: validBalance }]);
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Supabase updateUserBalance error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.users[id]) db.users[id] = { id, balance: 1000, lastDaily: 0, lastMessage: 0 };
  db.users[id].balance = validBalance;
  saveJsonDb(db);
}

export async function updateUserLastDaily(id, timestamp) {
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert([{ id, last_daily: timestamp }]);
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Supabase updateUserLastDaily error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.users[id]) db.users[id] = { id, balance: 1000, lastDaily: 0, lastMessage: 0 };
  db.users[id].lastDaily = timestamp;
  saveJsonDb(db);
}

export async function updateUserLastMessage(id, timestamp) {
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert([{ id, last_message: timestamp }]);
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Supabase updateUserLastMessage error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.users[id]) db.users[id] = { id, balance: 1000, lastDaily: 0, lastMessage: 0 };
  db.users[id].lastMessage = timestamp;
  saveJsonDb(db);
}

// Holdings operations
export async function getHoldings(id) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .eq('user_id', id);
      
      if (error) throw error;
      
      return data.map(holding => ({
        stock: holding.stock,
        amount: holding.amount
      }));
    } catch (error) {
      console.error('Supabase getHoldings error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  return db.holdings[id] || [];
}

export async function addHolding(id, stock, amount) {
  if (useSupabase) {
    try {
      // Check if holding exists
      const { data: existing } = await supabase
        .from('holdings')
        .select('amount')
        .eq('user_id', id)
        .eq('stock', stock)
        .single();
      
      if (existing) {
        // Update existing holding
        const { error } = await supabase
          .from('holdings')
          .update({ amount: existing.amount + amount })
          .eq('user_id', id)
          .eq('stock', stock);
        
        if (error) throw error;
      } else {
        // Insert new holding
        const { error } = await supabase
          .from('holdings')
          .insert([{ user_id: id, stock, amount }]);
        
        if (error) throw error;
      }
      return;
    } catch (error) {
      console.error('Supabase addHolding error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.holdings[id]) db.holdings[id] = [];
  
  const existing = db.holdings[id].find(h => h.stock === stock);
  if (existing) {
    existing.amount += amount;
  } else {
    db.holdings[id].push({ stock, amount });
  }
  saveJsonDb(db);
}

export async function removeHolding(id, stock, amount) {
  if (useSupabase) {
    try {
      const { data: existing } = await supabase
        .from('holdings')
        .select('amount')
        .eq('user_id', id)
        .eq('stock', stock)
        .single();
      
      if (existing) {
        const newAmount = existing.amount - amount;
        if (newAmount <= 0) {
          // Delete holding
          await supabase
            .from('holdings')
            .delete()
            .eq('user_id', id)
            .eq('stock', stock);
        } else {
          // Update holding
          await supabase
            .from('holdings')
            .update({ amount: newAmount })
            .eq('user_id', id)
            .eq('stock', stock);
        }
      }
      return;
    } catch (error) {
      console.error('Supabase removeHolding error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.holdings[id]) return;
  
  const holding = db.holdings[id].find(h => h.stock === stock);
  if (holding) {
    holding.amount -= amount;
    if (holding.amount <= 0) {
      db.holdings[id] = db.holdings[id].filter(h => h.stock !== stock);
    }
  }
  saveJsonDb(db);
}

// Transaction operations
export async function addTransaction(userId, stock, amount, price) {
  const transaction = {
    userId,
    stock,
    amount,
    price,
    timestamp: Date.now()
  };
  
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          stock,
          amount,
          price,
          timestamp: transaction.timestamp
        }]);
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Supabase addTransaction error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.transactions) db.transactions = [];
  db.transactions.push(transaction);
  saveJsonDb(db);
}

export async function getTransactions(userId, limit = 50) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return data.map(tx => ({
        userId: tx.user_id,
        stock: tx.stock,
        amount: tx.amount,
        price: tx.price,
        timestamp: tx.timestamp
      }));
    } catch (error) {
      console.error('Supabase getTransactions error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  return (db.transactions || [])
    .filter(t => t.userId === userId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

// 🔧 NEW: Price History Function (ADDED)
export async function getPriceHistory(stockSymbol, limit = 100) {
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('stock', stockSymbol)
        .order('timestamp', { ascending: true })
        .limit(limit);
      
      if (error) throw error;
      
      return data.map(entry => ({
        stock: entry.stock,
        price: parseFloat(entry.price),
        timestamp: entry.timestamp,
        trendScore: entry.trend_score || 0
      }));
    } catch (error) {
      console.error('Supabase getPriceHistory error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON - generate mock price history from current market data
  const market = getAllStocks();
  if (!market[stockSymbol]) {
    return [];
  }
  
  const currentPrice = market[stockSymbol].price;
  const history = [];
  const now = Date.now();
  
  // Generate 10 historical data points over the last 24 hours
  for (let i = 9; i >= 0; i--) {
    const timestamp = now - (i * 2.4 * 60 * 60 * 1000); // Every 2.4 hours
    const priceVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const price = currentPrice * (1 + priceVariation);
    
    history.push({
      stock: stockSymbol,
      price: Math.max(0.01, price), // Minimum price of $0.01
      timestamp: timestamp,
      trendScore: (Math.random() - 0.5) * 0.04 // ±2% trend score
    });
  }
  
  return history;
}

// 🔧 NEW: Add Price History Entry (ADDED)
export async function addPriceHistory(stockSymbol, price, trendScore = 0) {
  const entry = {
    stock: stockSymbol,
    price: parseFloat(price),
    timestamp: Date.now(),
    trend_score: trendScore
  };
  
  if (useSupabase) {
    try {
      const { error } = await supabase
        .from('price_history')
        .insert([entry]);
      
      if (error) throw error;
      return;
    } catch (error) {
      console.error('Supabase addPriceHistory error:', error.message);
      useSupabase = false;
    }
  }
  
  // For JSON fallback, we don't store price history to keep file size manageable
  // Price history is generated on-demand in getPriceHistory()
}

// Leaderboard operations
export async function getAllUsers() {
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
        lastDaily: user.last_daily || 0,
        lastMessage: user.last_message || 0
      }));
    } catch (error) {
      console.error('Supabase getAllUsers error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  return Object.values(db.users).sort((a, b) => b.balance - a.balance);
}

// Quest operations
export async function getUserQuests(userId, date = null) {
  // Use the new global quest system
  return await getUserQuestProgress(userId, date);
}

// Generate global daily quests (same for everyone)
export async function getGlobalDailyQuests(questDate = null) {
  const date = questDate || new Date().toISOString().split('T')[0];
  
  // Create deterministic random based on date for global consistency
  const seed = date.split('-').reduce((a, b) => a + parseInt(b), 0);
  const seededRandom = (index) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };
  
  // Quest templates with varying rewards
  const questTemplates = [
    {
      type: 'send_message',
      description: 'Send any message in the server',
      baseReward: 75
    },
    {
      type: 'say_hi',
      description: 'Say "hi", "hello", or "ciao" in chat',
      baseReward: 85
    },
    {
      type: 'use_command',
      description: 'Use any bot command (like /market or /portfolio)',
      baseReward: 95
    },
    {
      type: 'buy_stock',
      description: 'Buy any Italian meme stock with /buy',
      baseReward: 150
    },
    {
      type: 'sell_stock',
      description: 'Sell any stock with /sell',
      baseReward: 140
    },
    {
      type: 'react_message',
      description: 'React to any message with an emoji',
      baseReward: 70
    },
    {
      type: 'check_portfolio',
      description: 'Check your portfolio with /portfolio',
      baseReward: 80
    },
    {
      type: 'daily_bonus',
      description: 'Claim your daily bonus with /daily',
      baseReward: 120
    },
    {
      type: 'pasta_mention',
      description: 'Mention "pasta", "pizza", or "spaghetti" in chat',
      baseReward: 110
    },
    {
      type: 'meme_stock',
      description: 'Check any stock info with /stock',
      baseReward: 85
    }
  ];
  
  // Use seeded random to select same 3 quests for everyone on this date
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => seededRandom(1) - 0.5).slice(0, 3);
  const selectedQuests = indices.map((index, questIndex) => {
    const template = questTemplates[index];
    const rewardVariation = Math.floor(seededRandom(questIndex + 10) * 51) - 25; // ±25 coins
    return {
      type: template.type,
      description: template.description,
      reward: Math.max(50, template.baseReward + rewardVariation)
    };
  });
  
  return selectedQuests;
}

// Get or create user's quest progress for today's global quests
export async function getUserQuestProgress(userId, questDate = null) {
  const date = questDate || new Date().toISOString().split('T')[0];
  const globalQuests = await getGlobalDailyQuests(date);
  
  try {
    if (useSupabase && supabase) {
      // Get user's progress for today's quests
      const { data: userProgress, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_date', date);
      
      if (error) {
        console.error('Error fetching user quest progress:', error);
        return globalQuests.map(quest => ({ ...quest, completed: false, claimed: false }));
      }
      
      // Merge global quests with user progress
      return globalQuests.map(globalQuest => {
        const userQuest = userProgress?.find(up => up.quest_type === globalQuest.type);
        return {
          ...globalQuest,
          id: userQuest?.id,
          completed: userQuest?.completed || false,
          claimed: userQuest?.claimed || false,
          quest_type: globalQuest.type // Ensure quest_type is set
        };
      });
    } else {
      // JSON fallback - implement proper quest progress tracking
      const db = loadJsonDb();
      if (!db.quests) db.quests = {};
      if (!db.quests[userId]) db.quests[userId] = {};
      if (!db.quests[userId][date]) db.quests[userId][date] = [];
      
      const userQuests = db.quests[userId][date];
      
      // Merge global quests with user progress
      return globalQuests.map(globalQuest => {
        const userQuest = userQuests.find(uq => uq.quest_type === globalQuest.type);
        return {
          ...globalQuest,
          id: userQuest?.id || null,
          completed: userQuest?.completed || false,
          claimed: userQuest?.claimed || false,
          quest_type: globalQuest.type,
          completed_at: userQuest?.completed_at || null
        };
      });
    }
  } catch (error) {
    console.error('Error in getUserQuestProgress:', error);
    return globalQuests.map(quest => ({ ...quest, completed: false, claimed: false, quest_type: quest.type }));
  }
}

export async function createDailyQuests(userId, questDate = null) {
  // This function is now deprecated in favor of getUserQuestProgress
  return await getUserQuestProgress(userId, questDate);
}

export async function completeQuest(userId, questType, questDate = null) {
  const date = questDate || new Date().toISOString().split('T')[0];
  
  try {
    if (useSupabase && supabase) {
      // First, check if quest entry exists for this user/type/date
      const { data: existingQuest, error: fetchError } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_type', questType)
        .eq('quest_date', date)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching quest:', fetchError);
        return false;
      }
      
      // If quest already exists and is completed, don't do anything
      if (existingQuest && existingQuest.completed) {
        return false; // Already completed
      }
      
      if (!existingQuest) {
        // Create new quest entry
        const globalQuests = await getGlobalDailyQuests(date);
        const questTemplate = globalQuests.find(q => q.type === questType);
        
        if (!questTemplate) {
          console.log(`Quest template not found for type: ${questType}`);
          return false;
        }
        
        const { error: insertError } = await supabase
          .from('quests')
          .insert({
            user_id: userId,
            quest_type: questType,
            description: questTemplate.description,
            reward: questTemplate.reward,
            completed: true,
            quest_date: date,
            completed_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error creating quest:', insertError);
          return false;
        }
        
        console.log(`✅ Quest completed (Supabase): ${questType} for user ${userId}`);
        return true;
      } else if (!existingQuest.completed) {
        // Update existing quest to completed
        const { error: updateError } = await supabase
          .from('quests')
          .update({ 
            completed: true, 
            completed_at: new Date().toISOString() 
          })
          .eq('id', existingQuest.id);
        
        if (updateError) {
          console.error('Error updating quest:', updateError);
          return false;
        }
        
        console.log(`✅ Quest updated to completed (Supabase): ${questType} for user ${userId}`);
        return true;
      }
      
      return false; // Quest already completed
    } else {
      // JSON fallback - implement proper quest tracking
      const db = loadJsonDb();
      if (!db.quests) db.quests = {};
      if (!db.quests[userId]) db.quests[userId] = {};
      if (!db.quests[userId][date]) db.quests[userId][date] = [];
      
      // Check if quest already completed today
      const existingQuest = db.quests[userId][date].find(q => q.quest_type === questType);
      if (existingQuest && existingQuest.completed) {
        return false; // Already completed
      }
      
      // Get quest template
      const globalQuests = await getGlobalDailyQuests(date);
      const questTemplate = globalQuests.find(q => q.type === questType);
      
      if (!questTemplate) {
        console.log(`Quest template not found for type: ${questType}`);
        return false;
      }
      
      if (!existingQuest) {
        // Create new quest
        db.quests[userId][date].push({
          quest_type: questType,
          description: questTemplate.description,
          reward: questTemplate.reward,
          completed: true,
          claimed: false,
          completed_at: new Date().toISOString()
        });
      } else {
        // Update existing quest
        existingQuest.completed = true;
        existingQuest.completed_at = new Date().toISOString();
      }
      
      saveJsonDb(db);
      console.log(`✅ Quest completed (JSON): ${questType} for user ${userId}`);
      return true;
    }
  } catch (error) {
    console.error('Error in completeQuest:', error);
    return false;
  }
}

export async function getCompletedQuests(userId, questDate = null) {
  const date = questDate || new Date().toISOString().split('T')[0];
  const quests = await getUserQuests(userId, date);
  return quests.filter(quest => quest.completed);
}

export async function getUnclaimedQuestRewards(userId, questDate = null) {
  const date = questDate || new Date().toISOString().split('T')[0];
  
  if (useSupabase) {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('reward')
        .eq('user_id', userId)
        .eq('quest_date', date)
        .eq('completed', true)
        .eq('claimed', false);
      
      if (error) throw error;
      
      return data.reduce((total, quest) => total + quest.reward, 0);
    } catch (error) {
      console.error('Supabase getUnclaimedQuestRewards error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.quests?.[userId]?.[date]) return 0;
  
  const userQuests = db.quests[userId][date];
  const completedUnclaimedQuests = userQuests.filter(quest => quest.completed && !quest.claimed);
  
  if (completedUnclaimedQuests.length === 0) return 0;
  
  const totalReward = completedUnclaimedQuests.reduce((sum, quest) => sum + quest.reward, 0);
  
  // Mark as claimed
  completedUnclaimedQuests.forEach(quest => quest.claimed = true);
  saveJsonDb(db);
  
  // Add coins to user balance
  const user = await getUser(userId);
  await updateUserBalance(userId, user.balance + totalReward);
  
  return totalReward;
}

export async function claimQuestRewards(userId, questDate = null) {
  const date = questDate || new Date().toISOString().split('T')[0];
  
  if (useSupabase) {
    try {
      const { data: quests, error: fetchError } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_date', date)
        .eq('completed', true)
        .eq('claimed', false);
      
      if (fetchError) throw fetchError;
      if (!quests.length) return 0;
      
      const totalReward = quests.reduce((sum, quest) => sum + quest.reward, 0);
      
      // Mark as claimed
      const { error: updateError } = await supabase
        .from('quests')
        .update({ claimed: true })
        .eq('user_id', userId)
        .eq('quest_date', date)
        .eq('completed', true)
        .eq('claimed', false);
      
      if (updateError) throw updateError;
      
      // Add coins to user balance
      const user = await getUser(userId);
      await updateUserBalance(userId, user.balance + totalReward);
      
      return totalReward;
    } catch (error) {
      console.error('Supabase claimQuestRewards error:', error.message);
      useSupabase = false;
    }
  }
  
  // Fallback to JSON
  const db = loadJsonDb();
  if (!db.quests?.[userId]?.[date]) return 0;
  
  const unclaimedQuests = db.quests[userId][date].filter(
    quest => quest.completed && !quest.claimed
  );
  
  if (!unclaimedQuests.length) return 0;
  
  const totalReward = unclaimedQuests.reduce((sum, quest) => sum + quest.reward, 0);
  
  // Mark as claimed
  unclaimedQuests.forEach(quest => {
    quest.claimed = true;
  });
  
  // Add coins to user balance
  const user = await getUser(userId);
  await updateUserBalance(userId, user.balance + totalReward);
  
  saveJsonDb(db);
  return totalReward;
}

// Stock price operations (still uses market.json)
export function getStockPrice(symbol) {
  if (!fs.existsSync(marketPath)) return null;
  const market = JSON.parse(fs.readFileSync(marketPath));
  return market[symbol]?.price || null;
}

export function setStockPrice(symbol, price) {
  if (!fs.existsSync(marketPath)) return;
  const market = JSON.parse(fs.readFileSync(marketPath));
  if (market[symbol]) {
    market[symbol].price = price;
    fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
  }
}

export function getAllStocks() {
  if (!fs.existsSync(marketPath)) return {};
  return JSON.parse(fs.readFileSync(marketPath));
}

// Reset all quests (for daily reset system)
export async function resetAllQuests() {
  try {
    if (supabase) {
      // Delete old quests from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('quests')
        .delete()
        .lt('quest_date', yesterdayDate);
      
      if (error) {
        console.error('Error resetting quests in Supabase:', error);
        return false;
      }
      
      console.log('✅ Quests reset successfully in Supabase');
      return true;
    } else {
      // For JSON fallback, we don't store persistent quests
      console.log('✅ Quest reset completed (JSON mode)');
      return true;
    }
  } catch (error) {
    console.error('Error in resetAllQuests:', error);
    return false;
  }
}

// Alias for getUserQuestProgress (creates daily quests if they don't exist)
export async function generateUserQuests(userId, questDate = null) {
  return await getUserQuestProgress(userId, questDate);
}

// Alias for claimQuestReward (single quest)
export async function claimQuestReward(userId, questId) {
  try {
    if (useSupabase && supabase) {
      // First get the quest to check if it's completed and get reward amount
      const { data: quest, error: fetchError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .eq('user_id', userId)
        .eq('completed', true)
        .eq('claimed', false)
        .single();
      
      if (fetchError || !quest) {
        console.error('Quest not found or not claimable:', fetchError);
        return false;
      }
      
      // Mark quest as claimed
      const { error: updateError } = await supabase
        .from('quests')
        .update({ 
          claimed: true, 
          claimed_at: new Date().toISOString() 
        })
        .eq('id', questId);
      
      if (updateError) {
        console.error('Error claiming quest in Supabase:', updateError);
        return false;
      }
      
      // Update user balance
      const user = await getUser(userId);
      await updateUserBalance(userId, user.balance + quest.reward);
      
      console.log(`✅ Quest claimed (Supabase): ${quest.quest_type} for user ${userId}, reward: ${quest.reward}`);
      return true;
    } else {
      // JSON fallback - find and claim single quest
      const db = loadJsonDb();
      const date = new Date().toISOString().split('T')[0];
      
      if (!db.quests?.[userId]?.[date]) {
        console.error(`No quests found for user ${userId} on date ${date}`);
        return false;
      }
      
      // Try to find quest by ID first, then by quest_type
      const quest = db.quests[userId][date].find(q => 
        (q.id === questId || q.quest_type === questId) && 
        q.completed && !q.claimed
      );
      
      if (!quest) {
        console.log(`Quest ${questId} not found, completed, or already claimed for user ${userId}`);
        console.log(`Available quests:`, db.quests[userId][date].map(q => ({
          type: q.quest_type,
          completed: q.completed,
          claimed: q.claimed
        })));
        return false;
      }
      
      // Mark quest as claimed
      quest.claimed = true;
      quest.claimed_at = new Date().toISOString();
      
      // Update user balance
      const user = await getUser(userId);
      await updateUserBalance(userId, user.balance + quest.reward);
      
      saveJsonDb(db);
      console.log(`✅ Quest claimed (JSON): ${quest.quest_type} for user ${userId}, reward: ${quest.reward}`);
      return true;
    }
  } catch (error) {
    console.error('Error in claimQuestReward:', error);
    return false;
  }
}

export { initDb as default };
