# 🚀 Separated Architecture Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 memexbot.xyz                    │
├─────────────────────────────────────────────────┤
│  🖥️  DigitalOcean Droplet ($6/month)            │
│  ├── 🤖 Discord Bot                             │
│  ├── 🔧 Backend API (Port 3001)                 │
│  └── 🌐 Nginx (SSL + API Proxy)                 │
├─────────────────────────────────────────────────┤
│  📊 DigitalOcean App Platform ($5/month)        │
│  └── 🎯 Dashboard (connects to API)             │
└─────────────────────────────────────────────────┘
```

## 🎯 Benefits of This Setup

- **🔄 Separation of Concerns**: Bot/API logic separate from web interface
- **🚀 Better Performance**: Dashboard scales independently
- **💰 Cost Effective**: App Platform handles dashboard auto-scaling
- **🔒 Security**: API is properly isolated and rate-limited
- **🌐 CDN**: App Platform provides built-in CDN for dashboard

## 📋 Step 1: Update Your Droplet

### Replace docker-compose.yml
```bash
cd /var/www/memexbot
mv docker-compose.yml docker-compose-old.yml
mv docker-compose-simplified.yml docker-compose.yml
```

### Update Nginx configuration
```bash
mkdir -p docker
```

### Stop current containers
```bash
docker compose down
```

### Start simplified stack (Bot + API only)
```bash
docker compose up -d
```

## 📋 Step 2: Deploy Dashboard to App Platform

### Method 1: Using App Platform Web Interface

1. **Go to DigitalOcean App Platform**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub Repository**
   - Choose "GitHub" as source
   - Select repository: `Phantasm0009/MemeX`
   - Branch: `main`

3. **Configure Service**
   - **Name**: `memex-dashboard`
   - **Source Directory**: `dashboard`
   - **Build Command**: `npm install --production`
   - **Run Command**: `node server.js`
   - **Environment Variables**:
     ```
     NODE_ENV=production
     PORT=3002
     DASHBOARD_PORT=3002
     BACKEND_URL=https://memexbot.xyz
     ```

4. **Set Resource Allocation**
   - **Plan**: Basic ($5/month)
   - **Instance Size**: Basic XXS
   - **Instance Count**: 1

5. **Deploy**
   - Click "Create Resources"
   - Wait for deployment (3-5 minutes)

### Method 2: Using App Spec (Automated)

```bash
# Upload the app spec to create the app
doctl apps create --spec app-platform-dashboard.yaml
```

## 📋 Step 3: Update Domain Configuration

### Option A: Subdomain Setup (Recommended)
- **API**: `api.memexbot.xyz` → DigitalOcean Droplet
- **Dashboard**: `memexbot.xyz` → App Platform
- **Bot**: Runs on droplet, no public access needed

### Option B: Path-based Setup
- **API**: `memexbot.xyz/api/*` → DigitalOcean Droplet  
- **Dashboard**: `memexbot.xyz/*` → App Platform

## 📋 Step 4: SSL Certificate Setup

Since nginx is now API-only, SSL setup is simpler:

```bash
# Generate SSL certificate for API domain
docker compose exec certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email atiwar0414@gmail.com \
  --agree-tos \
  --no-eff-email \
  -d memexbot.xyz

# Restart nginx to load certificates
docker compose restart nginx
```

## 📋 Step 5: Test the Setup

### Test API Endpoints
```bash
# Health check
curl https://memexbot.xyz/health

# Market data
curl https://memexbot.xyz/api/market

# Leaderboard
curl https://memexbot.xyz/api/leaderboard
```

### Test Dashboard
- Visit your App Platform URL (provided after deployment)
- Should connect to the API and display market data

## 🔧 Environment Variables

### Droplet (.env)
```bash
# Discord Bot
BOT_TOKEN=your_bot_token
CLIENT_ID=your_client_id
BOT_DEVELOPERS=1225485426349969518

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# APIs (optional)
REDDIT_REFRESH_TOKEN=your_reddit_token
TWITTER_BEARER_TOKEN=your_twitter_token
YOUTUBE_API_KEY=your_youtube_key
```

### App Platform (Dashboard)
- Set these in the App Platform dashboard
- Use secrets for sensitive values

## 📊 Monitoring & Logs

### Droplet Logs
```bash
# All services
docker compose logs -f

# Specific services
docker compose logs -f backend
docker compose logs -f discord-bot
docker compose logs -f nginx
```

### App Platform Logs
- Available in the App Platform dashboard
- Real-time logs and metrics included

## 🚀 Scaling

### Droplet (Backend + Bot)
- Can scale vertically by upgrading droplet size
- Backend handles multiple dashboard instances

### Dashboard (App Platform)
- Automatically scales based on traffic
- Can increase instance count if needed

## 💰 Cost Breakdown

- **Droplet (Bot + API)**: $6/month
- **App Platform (Dashboard)**: $5/month  
- **Domain**: ~$12/year
- **Total**: ~$11/month + domain

## 🔒 Security Benefits

- **API Rate Limiting**: Nginx limits API calls
- **CORS Configured**: Proper cross-origin setup
- **SSL Everywhere**: End-to-end encryption
- **Separate Scaling**: Dashboard can't affect bot/API performance

## 🎯 Next Steps

1. Deploy this separated architecture
2. Point your domain DNS to the appropriate services
3. Monitor performance and logs
4. Consider adding Redis for caching if needed
5. Set up monitoring/alerting for production

This architecture provides better separation, scalability, and security for your meme stock exchange!
