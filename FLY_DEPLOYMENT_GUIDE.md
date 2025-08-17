# 🚀 Fly.io Deployment Guide - Italian Meme Stock Exchange

## 📋 Overview
Deploy your entire Italian Meme Stock Exchange to Fly.io as a single, powerful application:
- **Discord Bot** + **Dashboard** + **Backend API** all in one container
- Global edge deployment with automatic scaling
- Persistent volumes for data storage
- Built-in load balancing and health checks

## 🏗️ Architecture on Fly.io
```
┌─────────────────────────────────────────────────────────┐
│                 Fly.io Container                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │Discord Bot  │ │ Dashboard   │ │   Backend API       ││
│  │ (WebSocket) │ │ (Express)   │ │ (Express Routes)    ││
│  │   Port: -   │ │ Port: 8080  │ │   Port: 8080/api    ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │          Persistent Volume (/app/data)              ││
│  │     market.json, database.json, logs, etc.         ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Deployment Steps

### 1. Install Fly CLI
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Or download from: https://fly.io/docs/getting-started/installing-flyctl/
```

### 2. Login to Fly.io
```bash
fly auth login
```

### 3. Initialize Your App
```bash
fly launch --no-deploy
# This creates fly.toml based on our configuration
```

### 4. Create Persistent Volume
```bash
fly volumes create data_volume --region fra --size 1
```

### 5. Set Environment Variables
```bash
# Discord Bot Configuration
fly secrets set BOT_TOKEN=your_discord_bot_token_here
fly secrets set CLIENT_ID=your_discord_client_id_here
fly secrets set GUILD_ID=your_guild_id_optional

# Database Configuration  
fly secrets set SUPABASE_URL=your_supabase_project_url
fly secrets set SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional API Keys
fly secrets set TWITTER_BEARER_TOKEN=your_twitter_token
fly secrets set YOUTUBE_API_KEY=your_youtube_key
```

### 6. Deploy
```bash
fly deploy
```

### 7. Check Status
```bash
fly status
fly logs
```

## 🌍 Global Deployment Regions

Fly.io has edge locations worldwide. Choose the best region for your users:

```bash
# Europe (recommended for Italian users)
fly regions set fra  # Frankfurt
fly regions set ams  # Amsterdam

# Global coverage
fly regions set fra ams lax sjc  # Europe + US West
```

## 📊 Monitoring & Scaling

### View Logs
```bash
fly logs --follow
```

### Check Health
```bash
fly status
curl https://your-app.fly.dev/health
```

### Scale Up/Down
```bash
# Scale to 2 machines for high availability
fly scale count 2

# Scale resources
fly scale vm shared-cpu-2x --memory 1024
```

## 💾 Persistent Data Management

Your data is stored in the persistent volume at `/app/data`:

```bash
# SSH into your container
fly ssh console

# Check your data
ls -la /app/data/
```

## 🔧 Environment Variables

All environment variables are managed via Fly secrets:

```bash
# List current secrets
fly secrets list

# Update a secret
fly secrets set BOT_TOKEN=new_token_here

# Remove a secret
fly secrets unset OPTIONAL_VAR
```

## 🚀 Advantages of Fly.io

### ✅ Pros
- **Global Edge Network**: Deploy close to your users worldwide
- **Always-On**: Perfect for Discord bots (no cold starts)
- **Docker Native**: Full container control and flexibility
- **Persistent Storage**: Volumes for your data files
- **Auto-Scaling**: Scales based on demand
- **Great Free Tier**: 3 shared VMs, 160GB transfer
- **Fast Deployments**: Usually under 30 seconds
- **Built-in SSL**: Automatic HTTPS certificates

### ⚠️ Considerations
- **Learning Curve**: More complex than simple platforms
- **Docker Required**: Need to understand containerization
- **Resource Limits**: Free tier has VM limits

## 💰 Cost Comparison

| Resource | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **VMs** | 3 shared-cpu | Unlimited |
| **RAM** | 256MB each | Up to 8GB |
| **Storage** | 3GB volumes | Unlimited |
| **Bandwidth** | 160GB/month | $0.02/GB |
| **Regions** | All regions | All regions |

## 🎯 Why Fly.io is Perfect for Your Bot

1. **Single Container**: Everything runs together efficiently
2. **Global Reach**: Low latency for users worldwide  
3. **Always-On**: Discord bot never sleeps
4. **Persistent Data**: Your JSON files are safe
5. **Easy Scaling**: Grow as your Discord server grows
6. **Professional**: Production-ready infrastructure

## 🚧 Next Steps

1. **Push your code to GitHub** (if not already done)
2. **Install Fly CLI** on your machine
3. **Run the deployment commands** above
4. **Configure your environment variables**
5. **Deploy and enjoy!**

Your Italian Meme Stock Exchange will be running globally with professional infrastructure! 🇮🇹📈
