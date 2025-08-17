# 📋 Quick Deployment Checklist

## 🚀 Pre-Deployment Setup

### 1. Environment Variables Setup
Copy `.env.production` to `.env` and fill in:
```bash
cp .env.production .env
```

Required variables:
- [ ] `DISCORD_TOKEN` - Your Discord bot token
- [ ] `DISCORD_CLIENT_ID` - Your Discord application ID  
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Your Supabase anonymous key

### 2. Database Setup (Supabase)
- [ ] Create Supabase project
- [ ] Run the SQL schema from `database/schema.sql`
- [ ] Enable Row Level Security (RLS)
- [ ] Test database connection

### 3. Discord Bot Setup
- [ ] Create Discord application at https://discord.com/developers/applications
- [ ] Create bot and get token
- [ ] Add bot to your server with proper permissions
- [ ] Register slash commands: `npm run deploy-commands`

## 🌐 Hosting Options

### Option 1: VPS Deployment (Recommended for production)
**Cost:** $5-15/month | **Setup Time:** 30 minutes

```bash
# 1. Setup server
ssh user@your-server
chmod +x deploy.sh
./deploy.sh server

# 2. Deploy from local
./deploy.sh
```

**Platforms:**
- DigitalOcean Droplets
- Linode VPS
- AWS EC2 (t3.micro)
- Vultr Cloud Compute

### Option 2: Railway (Easiest)
**Cost:** Free tier available | **Setup Time:** 5 minutes

1. Connect GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Option 3: Render
**Cost:** Free tier available | **Setup Time:** 10 minutes

1. Connect GitHub repo to Render
2. Use `render.yaml` configuration
3. Set environment variables in Render dashboard

### Option 4: Docker (Any platform)
**Cost:** Varies | **Setup Time:** 15 minutes

```bash
# Build and run
docker-compose up -d

# Or single container
docker build -t italian-meme-bot .
docker run -d --env-file .env -p 3000:3000 italian-meme-bot
```

## ✅ Post-Deployment Checklist

### 1. Health Checks
- [ ] API responds: `curl https://yourdomain.com/health`
- [ ] Dashboard loads: `https://yourdomain.com`
- [ ] Discord bot online in server
- [ ] TikTok scraper updating prices

### 2. Monitor Services
```bash
# PM2 logs (VPS)
pm2 logs

# Docker logs
docker-compose logs -f

# Check processes
pm2 status
```

### 3. SSL Certificate (VPS only)
```bash
# Auto-generated during deployment
sudo certbot certificates
```

### 4. Performance Monitoring
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Monitor resource usage
- [ ] Check log rotation working

## 🔧 Common Issues & Solutions

### Bot Not Responding
```bash
# Check Discord permissions
# Verify DISCORD_TOKEN is correct
# Check bot is in server
pm2 logs discord-bot
```

### Database Connection Error
```bash
# Verify Supabase credentials
# Check network connectivity
# Test with: npm run health
```

### TikTok Scraper Failing
```bash
# Usually rate limiting
# Check logs: pm2 logs backend
# Restart: pm2 restart backend
```

### High Memory Usage
```bash
# Monitor: pm2 monit
# Restart if needed: pm2 restart all
# Check for memory leaks in logs
```

## 📊 Monitoring Commands

```bash
# Service status
pm2 status

# Real-time monitoring
pm2 monit

# Restart all services
pm2 restart ecosystem.config.js

# View logs
pm2 logs

# Health check
curl https://yourdomain.com/health
```

## 🎉 You're Live!

Once deployed, your Italian Meme Stock Exchange will be running at:
- **Dashboard:** https://yourdomain.com
- **API:** https://yourdomain.com/api
- **Discord Bot:** Active in your server

Users can start trading Italian brainrot memes immediately! 🇮🇹📈
