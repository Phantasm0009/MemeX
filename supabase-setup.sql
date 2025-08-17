-- Supabase SQL Setup for Italian Meme Stock Exchange
-- Run these commands in your Supabase SQL editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  balance DECIMAL(12,2) DEFAULT 1000,
  last_daily BIGINT DEFAULT 0,
  last_message BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  stock TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stock)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  stock TEXT NOT NULL,
  amount INTEGER NOT NULL, -- positive for buy, negative for sell
  price DECIMAL(12,4) NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  stock TEXT NOT NULL,
  price DECIMAL(12,4) NOT NULL,
  timestamp BIGINT NOT NULL,
  trend_score DECIMAL(5,4) DEFAULT 0,
  google_trend DECIMAL(5,4) DEFAULT 0,
  twitter_mentions INTEGER DEFAULT 0,
  reddit_mentions INTEGER DEFAULT 0,
  youtube_mentions INTEGER DEFAULT 0,
  tiktok_views BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market data table
CREATE TABLE IF NOT EXISTS market_data (
  stock TEXT PRIMARY KEY,
  price DECIMAL(12,4) NOT NULL,
  last_change DECIMAL(5,2) DEFAULT 0,
  last_event TEXT,
  volatility TEXT DEFAULT 'medium',
  italian_name TEXT,
  special_power TEXT,
  description TEXT,
  core_italian BOOLEAN DEFAULT FALSE,
  minimum_price DECIMAL(12,4),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quests table for daily challenges
CREATE TABLE IF NOT EXISTS quests (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reward INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  quest_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_type, quest_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_price_history_stock ON price_history(stock);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_quests_user_date ON quests(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_quests_completed ON quests(completed);
CREATE INDEX IF NOT EXISTS idx_quests_claimed ON quests(claimed);

-- Create RPC functions for table creation (used by Node.js)
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS VOID AS $$
BEGIN
  -- Table already created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_holdings_table()
RETURNS VOID AS $$
BEGIN
  -- Table already created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_transactions_table()
RETURNS VOID AS $$
BEGIN
  -- Table already created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_price_history_table()
RETURNS VOID AS $$
BEGIN
  -- Table already created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_market_table()
RETURNS VOID AS $$
BEGIN
  -- Table already created above
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Insert initial Italian stock data
INSERT INTO market_data (stock, price, volatility, italian_name, special_power, description, core_italian, minimum_price) VALUES
('SKIBI', 0.75, 'extreme', 'Gabibbi Toiletto', 'pasta_hours', 'Gains +30% during pasta-eating hours', false, null),
('SUS', 0.20, 'high', 'Tra-I-Nostri', 'imposter_panic', 'Imposter reports cause -20% panic dumps', false, null),
('SAHUR', 1.10, 'extreme', 'Tamburello Mistico', 'pizza_emoji', '+15% when pizza emojis appear', false, null),
('LABUB', 4.50, 'low', 'Mostriciattolo', 'sunday_immunity', 'Immune to market crashes on Sundays', false, null),
('OHIO', 1.25, 'high', 'Caporetto Finale', 'random_steal', 'Randomly steals 5% from other stocks', false, null),
('RIZZL', 0.35, 'medium', 'Casanova', 'romance_boost', '+25% when romance novels are mentioned', false, null),
('GYATT', 0.15, 'extreme', 'Culone', 'beach_volatility', 'Volatility doubles during beach hours', false, null),
('FRIED', 0.10, 'high', 'Friggitrice', 'oil_shortage', '+40% during olive oil shortage events', false, null),
('SIGMA', 5.00, 'low', 'Machio', 'bear_flex', 'Flexes on bears during market dips', false, null),
('TRALA', 0.65, 'medium', 'Tralalero Tralala', 'musical_harmony', 'Musical mentions create harmony effects', true, null),
('CROCO', 0.45, 'extreme', 'Bombardiro Crocodilo', 'italian_chaos', 'Chaotic Italian crocodile behaviors', true, null),
('FANUM', 0.30, 'medium', 'Tassa Nonna', 'portfolio_tax', 'Steals 10% from portfolios weekly', false, null),
('CAPPU', 2.75, 'medium', 'Ballerina Cappuccina', 'coffee_dance', 'Dances to coffee culture rhythms', true, null),
('BANANI', 0.40, 'low', 'Chimpanzini Bananini', 'ape_strength', 'Invincible ape power protects price', true, 0.20),
('LARILA', 3.25, 'high', 'Lirili Larila', 'time_control', 'Controls time and space with sounds', true, null)
ON CONFLICT (stock) DO UPDATE SET
  price = EXCLUDED.price,
  volatility = EXCLUDED.volatility,
  italian_name = EXCLUDED.italian_name,
  special_power = EXCLUDED.special_power,
  description = EXCLUDED.description,
  core_italian = EXCLUDED.core_italian,
  minimum_price = EXCLUDED.minimum_price,
  updated_at = NOW();

-- Enable Row Level Security (optional, for production)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- Create policies (optional, for production)
-- CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id);
-- CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id);

COMMIT;
