# 🎯 Render Environment Variables Configuration

## Main Service Environment Variables
```bash
# Discord Bot Configuration
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here
GUILD_ID=your_guild_id_optional
MARKET_CHANNEL_ID=your_market_channel_id_optional

# Service Configuration
NODE_ENV=production
PORT=10000
DASHBOARD_PORT=10000

# Backend API URL (UPDATE WITH YOUR BACKEND SERVICE URL)
BACKEND_URL=https://italian-meme-backend.onrender.com

# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Backend Service Environment Variables
```bash
# Service Configuration
NODE_ENV=production
PORT=10000
BACKEND_PORT=10000

# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys for Real Trend Data (Optional)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
YOUTUBE_API_KEY=your_youtube_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REFRESH_TOKEN=your_reddit_refresh_token
```

## How to Set Environment Variables in Render

### Step 1: Access Service Settings
1. Go to your Render dashboard
2. Click on your service
3. Go to "Environment" tab

### Step 2: Add Variables
1. Click "Add Environment Variable"
2. Enter Key and Value
3. Click "Save Changes"

### Step 3: Required Variables
**Main Service** needs:
- BOT_TOKEN
- CLIENT_ID
- SUPABASE_URL
- SUPABASE_ANON_KEY
- BACKEND_URL

**Backend Service** needs:
- SUPABASE_URL
- SUPABASE_ANON_KEY

## 🔗 Service URLs After Deployment
- **Main Service**: `https://your-main-service-name.onrender.com`
- **Backend Service**: `https://your-backend-service-name.onrender.com`

## 📋 Important Notes
1. **Update BACKEND_URL** in main service with your actual backend URL
2. **Set auto-deploy** to true for both services
3. **Free tier** sleeps after 15 minutes of inactivity
4. **Auto-wake** happens on incoming requests
5. **Custom domains** are free with Render
