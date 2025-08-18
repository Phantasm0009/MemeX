# 🚀 Complete DigitalOcean Deployment Guide

This guide will help you deploy the Italian Meme Stock Exchange with the backend + Discord bot on a DigitalOcean Droplet and the dashboard on DigitalOcean App Platform.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│           DigitalOcean Setup               │
├─────────────────────────────────────────────┤
│  Droplet ($6/month)                         │
│  ├── Discord Bot (index.js)                 │
│  ├── Backend API (backend/server.js)        │
│  ├── Nginx (Reverse Proxy)                  │
│  └── PM2 (Process Manager)                  │
├─────────────────────────────────────────────┤
│  App Platform ($5/month)                    │
│  └── Dashboard (dashboard/server.js)        │
└─────────────────────────────────────────────┘
```

## 🚀 Part 1: Deploy Backend + Bot on Droplet

### Step 1: Create DigitalOcean Droplet

1. **Create Account**: Sign up at [DigitalOcean](https://digitalocean.com) (Get $200 credit!)
2. **Create Droplet**:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month - 1GB RAM, 1 vCPU, 25GB SSD)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: `italian-meme-exchange`

### Step 2: Run Deployment Script

SSH into your droplet and run:

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Download and run the deployment script
curl -sSL https://raw.githubusercontent.com/Phantasm0009/MemeX/main/deploy-digitalocean-optimized.sh | sudo bash
```

### Step 3: Configure Environment

```bash
# Navigate to app directory
cd /var/www/italian-meme-exchange

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```bash
# Discord Bot Configuration (REQUIRED)
BOT_TOKEN=your_actual_discord_bot_token
CLIENT_ID=your_actual_discord_client_id

# Optional but recommended
GUILD_ID=your_test_server_id
MARKET_CHANNEL_ID=your_market_updates_channel

# Database (Highly Recommended for production)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys (Optional - for real trend data)
YOUTUBE_API_KEY=your_youtube_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

### Step 4: Start Services

```bash
# Start the services
./start.sh

# Check status
./status.sh

# View logs
pm2 logs
```

### Step 5: Test API

```bash
# Test health endpoint
curl http://YOUR_DROPLET_IP/health

# Test market data
curl http://YOUR_DROPLET_IP/api/market
```

## 📊 Part 2: Deploy Dashboard on App Platform

### Step 1: Prepare Repository

1. **Fork** the repository to your GitHub account
2. **Update** the backend URL in your fork

### Step 2: Create App Platform Application

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. **Source**: GitHub → Select your forked repository
4. **Branch**: main
5. **Source Directory**: `dashboard`

### Step 3: Configure App Settings

**App Info:**
- **Name**: `italian-meme-dashboard`
- **Region**: Same as your droplet

**Service Configuration:**
- **Name**: dashboard
- **Source Directory**: `/dashboard`
- **Build Command**: `npm install --production`
- **Run Command**: `node server.js`
- **HTTP Port**: 3002

**Environment Variables:**
```
NODE_ENV=production
BACKEND_URL=http://YOUR_DROPLET_IP:3001
DASHBOARD_PORT=3002
```

**Plan:**
- **Basic**: $5/month (512 MB RAM)

### Step 4: Deploy

1. Click **"Create Resources"**
2. Wait for deployment (5-10 minutes)
3. Get your App Platform URL

## 🔧 Configuration & Testing

### Discord Bot Setup

1. **Create Discord Application**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application
   - Bot section → Create bot
   - Copy **Bot Token** and **Client ID**

2. **Invite Bot to Server**:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot%20applications.commands
   ```

3. **Deploy Commands**:
   ```bash
   cd /var/www/italian-meme-exchange
   npm run deploy-commands
   ```

### Database Setup (Recommended)

**Option 1: Supabase (Recommended)**
1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Run SQL from `supabase-setup.sql`
4. Copy URL and Anon Key to `.env`

**Option 2: JSON (Default)**
- Uses local JSON files
- Good for testing
- Not recommended for production

### API Keys (Optional)

**YouTube API:**
1. [Google Cloud Console](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create API key

**Twitter API:**
1. [Twitter Developer Portal](https://developer.twitter.com)
2. Create app
3. Generate Bearer Token

## 🚦 Management Commands

### Droplet Management

```bash
# Start services
cd /var/www/italian-meme-exchange
./start.sh

# Stop services
./stop.sh

# Update code
./update.sh

# Check status
./status.sh

# View logs
pm2 logs
pm2 logs discord-bot
pm2 logs backend-api

# Restart specific service
pm2 restart discord-bot
pm2 restart backend-api
```

### Dashboard Management

- **Deploy**: Automatic on git push
- **Logs**: View in App Platform dashboard
- **Scale**: Increase instances in App Platform

## 🔒 Security & SSL

### Enable SSL (Optional)

```bash
# Install SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal test
certbot renew --dry-run
```

### Firewall Configuration

```bash
# Check firewall status
ufw status

# Allow additional ports if needed
ufw allow 443  # HTTPS
```

## 📊 Monitoring & Maintenance

### Health Checks

- **API Health**: `http://YOUR_DROPLET_IP/health`
- **Dashboard Health**: Check App Platform dashboard
- **Bot Status**: `pm2 status` or Discord server

### Automatic Updates

Set up automatic updates (optional):

```bash
# Create cron job for updates
echo "0 3 * * 1 cd /var/www/italian-meme-exchange && ./update.sh" | crontab -
```

### Backup Strategy

```bash
# Backup data directory
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/ .env

# Upload to DigitalOcean Spaces (optional)
# Configure with your DigitalOcean Spaces credentials
```

## 💰 Cost Breakdown

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Droplet | Basic (1GB) | $6 |
| App Platform | Basic | $5 |
| **Total** | | **$11/month** |

**With $200 credits**: 18+ months free! 🎉

## 🐛 Troubleshooting

### Common Issues

**Bot Not Responding:**
```bash
pm2 logs discord-bot
# Check for token errors or permission issues
```

**API Not Working:**
```bash
pm2 logs backend-api
curl http://localhost:3001/health
# Check port 3001 is open
```

**Dashboard Not Loading:**
- Check App Platform logs
- Verify BACKEND_URL in environment variables
- Test API connection: `curl http://YOUR_DROPLET_IP/api/health`

### Support

- **GitHub Issues**: [Report bugs](https://github.com/Phantasm0009/MemeX/issues)
- **DigitalOcean Docs**: [App Platform](https://docs.digitalocean.com/products/app-platform/)
- **Discord.js Docs**: [Discord.js Guide](https://discordjs.guide/)

## 🎉 Success!

Your Italian Meme Stock Exchange is now live:

- **🤖 Discord Bot**: Active in your server
- **🔗 API**: `http://YOUR_DROPLET_IP/api`
- **📊 Dashboard**: `https://your-dashboard.ondigitalocean.app`

Happy trading! 🇮🇹📈💰
