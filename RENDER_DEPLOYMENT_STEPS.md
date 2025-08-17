# 🚀 Step-by-Step Render Deployment

## Step 1: Prepare Your Code

Your code is now ready! I've created:
- ✅ `main-service.js` - Combines Discord bot + dashboard
- ✅ `render-main.yaml` - Main service configuration  
- ✅ `render-backend.yaml` - Backend service configuration
- ✅ Updated `package.json` with `npm run main` script

## Step 2: Push to GitHub

```bash
git add .
git commit -m "🎯 Add Render deployment configuration"
git push origin main
```

## Step 3: Create Render Services

### 3.1 Create Main Service (Bot + Dashboard)

1. **Go to [Render.com](https://render.com)**
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `italian-meme-main`
   - **Region**: `Ohio (US East)`
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm run main`
   - **Plan**: `Free`

### 3.2 Create Backend Service (API + Scraper)

1. **Click "New +"** → **"Web Service"** again
2. **Connect same GitHub repository**
3. **Configure the service**:
   - **Name**: `italian-meme-backend`
   - **Region**: `Ohio (US East)`
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm run backend`
   - **Plan**: `Free`

## Step 4: Set Environment Variables

### 4.1 Main Service Variables
Go to your main service → **Environment** tab → Add these:

```
BOT_TOKEN = your_discord_bot_token
CLIENT_ID = your_discord_client_id
SUPABASE_URL = your_supabase_url
SUPABASE_ANON_KEY = your_supabase_key
NODE_ENV = production
PORT = 10000
BACKEND_URL = https://italian-meme-backend.onrender.com
```

### 4.2 Backend Service Variables
Go to your backend service → **Environment** tab → Add these:

```
SUPABASE_URL = your_supabase_url
SUPABASE_ANON_KEY = your_supabase_key
NODE_ENV = production
PORT = 10000
```

## Step 5: Update BACKEND_URL

**IMPORTANT**: After your backend service deploys, update the `BACKEND_URL` in your main service:

1. **Copy your backend service URL** (e.g., `https://italian-meme-backend-abc123.onrender.com`)
2. **Go to main service** → **Environment** tab
3. **Update BACKEND_URL** with your actual backend URL
4. **Save changes** and wait for redeploy

## Step 6: Deploy & Test

Both services will deploy automatically. You can monitor deployment logs in real-time.

### Test Your Deployment:

1. **Main Service Health Check**: `https://your-main-service.onrender.com/health`
2. **Backend Health Check**: `https://your-backend-service.onrender.com/health`
3. **Dashboard**: `https://your-main-service.onrender.com`
4. **Discord Bot**: Should come online in your server

## 🎉 You're Live!

Your Italian Meme Stock Exchange is now running on Render with:
- ✅ **Discord Bot**: Trading commands work
- ✅ **Dashboard**: Real-time market data
- ✅ **Backend API**: TikTok scraping & price updates
- ✅ **Free hosting**: 750 hours/month per service
- ✅ **Auto-scaling**: Handles traffic spikes
- ✅ **SSL certificates**: Secure HTTPS

## 📊 Monitoring

- **Service logs**: View in Render dashboard
- **Metrics**: CPU, memory, response times
- **Alerts**: Email notifications for issues
- **Health checks**: Automatic monitoring

## 🔧 Troubleshooting

**Bot not responding?**
- Check BOT_TOKEN is correct
- Verify bot is in your Discord server
- Check main service logs

**Dashboard not loading?**
- Check main service is running
- Verify BACKEND_URL is correct
- Check backend service logs

**TikTok data not updating?**
- Check backend service logs
- Verify Supabase connection
- Check for rate limiting
