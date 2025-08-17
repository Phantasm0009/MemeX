# 🎯 Render Deployment Guide - Italian Meme Stock Exchange

## 📋 Overview
Deploy your Italian Meme Stock Exchange to Render with 2 separate services:
1. **Main Service**: Discord Bot + Dashboard (combined)
2. **Backend Service**: API + TikTok Scraper

## 🏗️ Architecture on Render
```
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│       Main Service              │    │      Backend Service            │
│  ┌─────────────┐ ┌─────────────┐│    │  ┌─────────────┐ ┌─────────────┐│
│  │Discord Bot  │ │ Dashboard   ││    │  │  API Server │ │TikTok Scraper││
│  │(index.js)   │ │(port 3002)  ││    │  │(port 3001)  │ │(5min cycle)  ││
│  │             │ │             ││    │  │             │ │              ││
│  └─────────────┘ └─────────────┘│    │  └─────────────┘ └─────────────┘│
└─────────────────────────────────┘    └─────────────────────────────────┘
   https://main-bot.onrender.com         https://backend-api.onrender.com
```

## 🚀 Deployment Steps

### Step 1: Prepare Render Configuration Files

I'll create the configuration files for both services below.

### Step 2: Create Render Services

1. **Go to [Render.com](https://render.com)** and sign up
2. **Connect your GitHub repository**
3. **Create 2 Web Services**:
   - **Service 1**: Main Bot + Dashboard
   - **Service 2**: Backend API

### Step 3: Configure Environment Variables

Set these in **both** Render services:

#### Required Variables:
- `NODE_ENV=production`
- `BOT_TOKEN=your_discord_bot_token`
- `CLIENT_ID=your_discord_client_id`
- `SUPABASE_URL=your_supabase_url`
- `SUPABASE_ANON_KEY=your_supabase_key`

#### Service-Specific Variables:
- **Main Service**: `BACKEND_URL=https://your-backend-name.onrender.com`
- **Backend Service**: `PORT=10000` (Render default)

## 📋 Render Service Configuration

### Main Service (Bot + Dashboard)
- **Build Command**: `npm ci`
- **Start Command**: `npm run main`
- **Root Directory**: `/`
- **Auto-Deploy**: Yes
- **Health Check Path**: `/health`

### Backend Service (API + Scraper)
- **Build Command**: `npm ci`
- **Start Command**: `npm run backend`
- **Root Directory**: `/`
- **Auto-Deploy**: Yes
- **Health Check Path**: `/health`

## 💰 Render Free Tier Limits
- **750 hours/month** per service (enough for 24/7)
- **Sleeps after 15 minutes** of inactivity
- **Auto-wake** on incoming requests
- **512MB RAM** per service
- **Free custom domains**

## 🔧 Benefits of This Setup
✅ **Free hosting** for both services  
✅ **Auto-scaling** and load balancing  
✅ **SSL certificates** included  
✅ **GitHub integration** for auto-deploys  
✅ **Separate scaling** for bot and backend  
✅ **Health monitoring** built-in  

## 🎯 Next Steps
1. Run the commands below to set up the configuration
2. Push to GitHub
3. Create 2 Render services using the render.yaml files
4. Set environment variables in Render dashboard
5. Deploy and enjoy! 🚀
