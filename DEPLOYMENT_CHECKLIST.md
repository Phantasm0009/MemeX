# ✅ DigitalOcean Deployment Checklist

## Pre-Deployment Setup

- [ ] **Discord Bot Created**
  - Go to [Discord Developer Portal](https://discord.com/developers/applications)
  - Create new application → Bot section → Create bot
  - Copy Bot Token and Client ID

- [ ] **Environment Variables Ready**
  - BOT_TOKEN=`your_bot_token_here`
  - CLIENT_ID=`your_client_id_here`
  - (Optional) SUPABASE_URL and SUPABASE_ANON_KEY

- [ ] **DigitalOcean Account**
  - Sign up at [DigitalOcean](https://digitalocean.com)
  - Get $200 free credits with referral
  - Add payment method

- [ ] **Local Test Passed**
  - Run `npm run test-deployment` ✅

## Part 1: Droplet Deployment (Backend + Bot)

- [ ] **Create Droplet**
  - Image: Ubuntu 22.04 LTS
  - Plan: Basic $6/month (1GB RAM)
  - Region: Choose closest to users
  - SSH Key authentication (recommended)

- [ ] **Run Deployment Script**
  ```bash
  ssh root@YOUR_DROPLET_IP
  curl -sSL https://raw.githubusercontent.com/Phantasm0009/MemeX/main/deploy-digitalocean-optimized.sh | sudo bash
  ```

- [ ] **Configure Environment**
  ```bash
  cd /var/www/italian-meme-exchange
  nano .env
  # Add your actual BOT_TOKEN and CLIENT_ID
  ```

- [ ] **Fix PM2 Configuration (if needed)**
  ```bash
  # If you get ES module errors, run this fix:
  curl -sSL https://raw.githubusercontent.com/Phantasm0009/MemeX/main/quick-fix-pm2.sh | bash
  ```

- [ ] **Start Services**
  ```bash
  ./start.sh
  ```

- [ ] **Verify API Working**
  ```bash
  curl http://159.203.134.206/health
  curl http://159.203.134.206/api/market
  ```

- [ ] **Deploy Discord Commands**
  ```bash
  npm run deploy-commands
  ```

- [ ] **Test Discord Bot**
  - Invite bot to server
  - Test `/market` command
  - Test `/buy` and `/sell` commands

## Part 2: Dashboard Deployment (App Platform)

- [ ] **Fork Repository**
  - Fork [Phantasm0009/MemeX](https://github.com/Phantasm0009/MemeX) to your GitHub

- [ ] **Create App Platform App**
  - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
  - Create App → GitHub → Select your fork
  - Source Directory: `dashboard`

- [ ] **Configure App Settings**
  - Name: `italian-meme-dashboard`
  - Build Command: `npm install --production`
  - Run Command: `node server.js`
  - HTTP Port: 3002
  - Plan: Basic $5/month

- [ ] **Set Environment Variables**
  ```
  NODE_ENV=production
  BACKEND_URL=http://YOUR_DROPLET_IP:3001
  DASHBOARD_PORT=3002
  ```

- [ ] **Deploy and Test**
  - Wait for deployment (5-10 minutes)
  - Open dashboard URL
  - Verify market data loads
  - Check real-time updates

## Part 3: Optional Enhancements

- [ ] **Set up Domain (Optional)**
  ```bash
  # Point domain to droplet IP
  # Update Nginx config
  # Install SSL certificate
  certbot --nginx -d your-domain.com
  ```

- [ ] **Database Upgrade (Recommended)**
  - Create [Supabase](https://supabase.com) account
  - Create new project
  - Run SQL from `supabase-setup.sql`
  - Update .env with Supabase credentials

- [ ] **API Keys (Enhanced Features)**
  - YouTube API key for trend data
  - Twitter Bearer Token for mentions
  - Reddit API for meme tracking

## ✅ Success Verification

Your deployment is successful when:

- [ ] Discord bot responds to `/market` command
- [ ] API returns data: `curl http://YOUR_DROPLET_IP/api/market`
- [ ] Dashboard loads at App Platform URL
- [ ] Users can execute `/buy` and `/sell` commands
- [ ] Prices update automatically
- [ ] PM2 shows all services running: `pm2 status`

## 📊 Final URLs

- **API**: `http://YOUR_DROPLET_IP/api`
- **Health**: `http://YOUR_DROPLET_IP/health`  
- **Dashboard**: `https://your-app.ondigitalocean.app`
- **Discord Bot**: Active in your server

## 💰 Monthly Costs

- Droplet: $6/month
- App Platform: $5/month
- **Total: $11/month**
- **With $200 credits: 18+ months FREE!**

## 🆘 Need Help?

- **Full Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Issues**: [GitHub Issues](https://github.com/Phantasm0009/MemeX/issues)
- **DigitalOcean Support**: [Help Center](https://docs.digitalocean.com/)

## 🎉 You're Done!

Once all checkboxes are ✅, your Italian Meme Stock Exchange is live!

**Happy Trading! 🇮🇹📈💰**
