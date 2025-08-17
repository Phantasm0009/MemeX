# 🎯 Step-by-Step Fly.io Deployment

## Step 1: Prepare Your Code ✅

Your code is now ready! I've created:
- ✅ `fly.toml` - Fly.io configuration
- ✅ `Dockerfile.fly` - Optimized container
- ✅ `fly-service.js` - Combined service runner
- ✅ Updated `package.json` with `npm run fly` script

## Step 2: Install Fly CLI

### Windows (PowerShell)
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### Alternative: Download Installer
1. Go to [Fly.io CLI Downloads](https://fly.io/docs/getting-started/installing-flyctl/)
2. Download Windows installer
3. Run and follow installation steps

### Verify Installation
```bash
fly version
```

## Step 3: Login to Fly.io

```bash
fly auth login
```
This opens your browser for authentication.

## Step 4: Push to GitHub (if not done)

```bash
git add .
git commit -m "🚀 Add Fly.io deployment configuration"
git push origin main
```

## Step 5: Initialize Fly App

```bash
# Navigate to your project directory
cd "C:\Users\Pramod Tiwari\Downloads\stock-bot"

# Initialize (but don't deploy yet)
fly launch --no-deploy
```

This creates a `fly.toml` file (we already have one optimized).

## Step 6: Create Persistent Volume

```bash
# Create 1GB volume for data storage
fly volumes create data_volume --region fra --size 1
```

## Step 7: Set Environment Variables

```bash
# Essential Discord Configuration
fly secrets set BOT_TOKEN=your_discord_bot_token_here
fly secrets set CLIENT_ID=your_discord_client_id_here

# Database Configuration (recommended)
fly secrets set SUPABASE_URL=your_supabase_project_url
fly secrets set SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Guild for testing
fly secrets set GUILD_ID=your_test_server_id

# Optional: Market updates channel
fly secrets set MARKET_CHANNEL_ID=your_market_channel_id

# Optional: API Keys for real trends
fly secrets set TWITTER_BEARER_TOKEN=your_twitter_token
fly secrets set YOUTUBE_API_KEY=your_youtube_key
fly secrets set REDDIT_CLIENT_ID=your_reddit_id
fly secrets set REDDIT_CLIENT_SECRET=your_reddit_secret
```

## Step 8: Deploy!

```bash
fly deploy
```

This will:
1. Build your Docker container
2. Push to Fly.io registry
3. Deploy to your selected region
4. Start your Discord bot + dashboard

## Step 9: Verify Deployment

### Check App Status
```bash
fly status
```

### View Logs
```bash
fly logs --follow
```

### Test Your Bot
- Go to your Discord server
- Try commands like `/market`, `/portfolio`, `/buy`

### Test Dashboard
```bash
# Get your app URL
fly info

# Visit: https://your-app-name.fly.dev
```

## Step 10: Monitor & Scale

### Real-time Monitoring
```bash
# Live logs
fly logs --follow

# App metrics
fly dashboard
```

### Scale if Needed
```bash
# Add more machines for high availability
fly scale count 2

# Upgrade resources if needed
fly scale vm shared-cpu-2x --memory 1024
```

## 🚨 Troubleshooting

### If Deployment Fails

1. **Check logs**:
   ```bash
   fly logs
   ```

2. **SSH into container**:
   ```bash
   fly ssh console
   ```

3. **Restart app**:
   ```bash
   fly restart
   ```

### If Bot Doesn't Connect

1. **Verify environment variables**:
   ```bash
   fly secrets list
   ```

2. **Check Discord token**:
   - Make sure BOT_TOKEN is correct
   - Verify bot permissions in Discord Developer Portal

3. **Test locally first**:
   ```bash
   npm run fly
   ```

## ✅ Success Checklist

- [ ] Fly CLI installed and authenticated
- [ ] Persistent volume created
- [ ] Environment variables set
- [ ] App deployed successfully
- [ ] Discord bot responding to commands
- [ ] Dashboard accessible at your Fly.io URL
- [ ] Real-time stock updates working

## 🎯 Your App URLs

After deployment, you'll have:
- **Dashboard**: `https://your-app-name.fly.dev`
- **API**: `https://your-app-name.fly.dev/api`
- **Health Check**: `https://your-app-name.fly.dev/health`

## 🌍 Going Global

To deploy to multiple regions for better global performance:

```bash
# Add regions
fly regions set fra ams lax  # Europe + US West

# Deploy to all regions
fly deploy
```

Your Italian Meme Stock Exchange is now running on Fly.io's global infrastructure! 🇮🇹📈🚀
