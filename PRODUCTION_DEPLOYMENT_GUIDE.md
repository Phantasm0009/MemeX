# 🚀 Production Deployment Guide - Italian Meme Stock Exchange

## 📋 Overview
This guide will help you deploy the Italian Meme Stock Exchange bot to production with proper hosting, environment configuration, and monitoring.

## 🏗️ Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Discord Bot   │    │  Backend API    │    │   Dashboard     │
│   (index.js)    │    │ (backend/...)   │    │ (dashboard/...) │
│   Port: N/A     │    │   Port: 3001    │    │   Port: 3002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────┴─────────────────┐
                │          Supabase Database        │
                │     (PostgreSQL + Real-time)      │
                └───────────────────────────────────┘
```

## 🌐 Hosting Options

### Option 1: VPS Hosting (Recommended)
**Best for: Full control, custom domains, SSL certificates**

#### VPS Providers:
- **DigitalOcean** - $5-10/month (recommended)
- **Linode** - $5-10/month  
- **Vultr** - $5-10/month
- **AWS EC2** - $5-15/month (more complex)

#### VPS Specifications:
- **CPU**: 1-2 vCPUs
- **RAM**: 2-4GB
- **Storage**: 25-50GB SSD
- **OS**: Ubuntu 22.04 LTS

---

### Option 2: Platform-as-a-Service (Easiest)
**Best for: Quick deployment, automatic scaling**

#### PaaS Providers:
- **Railway** - $5-10/month (recommended for beginners)
- **Render** - $7-25/month
- **Heroku** - $5-25/month
- **Vercel** - Free tier available (for Dashboard only)

---

### Option 3: Serverless (Advanced)
**Best for: Cost optimization, automatic scaling**

#### Serverless Options:
- **AWS Lambda** + **ECS** for bot
- **Vercel** for dashboard
- **Supabase Edge Functions**

---

## 🔧 Production Setup Steps

### Step 1: Environment Variables
Create production `.env` file:

```bash
# Discord Bot Configuration
BOT_TOKEN=your_production_discord_bot_token
CLIENT_ID=your_discord_client_id
GUILD_ID=your_main_server_id (optional)
MARKET_CHANNEL_ID=your_market_updates_channel

# Server Configuration
NODE_ENV=production
BACKEND_PORT=3001
DASHBOARD_PORT=3002
BACKEND_URL=https://yourdomain.com

# Database (Supabase - recommended)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys for Trend Data
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
YOUTUBE_API_KEY=your_youtube_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REFRESH_TOKEN=your_reddit_refresh_token

# Security
JWT_SECRET=your_jwt_secret_for_dashboard_auth
ADMIN_PASSWORD=your_admin_dashboard_password

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_for_error_tracking
```

### Step 2: Database Setup (Supabase)
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Run the SQL setup script (provided below)
4. Copy URL and API key to `.env`

### Step 3: Domain & SSL
1. Purchase domain (e.g., `italian-meme-stock.com`)
2. Set up DNS records:
   ```
   A     @        your_server_ip
   A     api      your_server_ip
   A     dashboard your_server_ip
   ```
3. Install SSL certificate (Let's Encrypt)

### Step 4: Server Configuration
Choose your deployment method below.

---

## 🚀 Deployment Methods

### Method 1: VPS Deployment (Ubuntu)

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install nginx -y

# Install Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

#### 2. Deploy Application
```bash
# Create app directory
sudo mkdir -p /var/www/italian-meme-stock
cd /var/www/italian-meme-stock

# Clone your code (or upload via SCP/SFTP)
git clone your-repository .

# Install dependencies
npm install --production

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Set up PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/italian-meme-stock
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Dashboard
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/italian-meme-stock /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Method 2: Railway Deployment (Easiest)

#### 1. Prepare for Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

#### 2. Deploy
```bash
# Initialize Railway project
railway init

# Add environment variables
railway variables set BOT_TOKEN=your_token
railway variables set SUPABASE_URL=your_url
# ... add all other variables

# Deploy
railway up
```

---

### Method 3: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
# Use Node.js 18 Alpine
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose ports
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start application
CMD ["npm", "run", "production"]
```

#### 2. Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
      - "3002:3002"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
```

---

## 📊 Monitoring & Maintenance

### Health Checks
```javascript
// Add to backend/server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

### Logging
```javascript
// Add Winston logger
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});
```

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'discord-bot',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'backend-api',
      script: 'backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'dashboard',
      script: 'dashboard/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

---

## 🔒 Security Checklist

- [ ] Use HTTPS/SSL certificates
- [ ] Hide API keys in environment variables
- [ ] Set up firewall (UFW on Ubuntu)
- [ ] Enable fail2ban for SSH protection
- [ ] Use strong passwords for database
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Set up backup strategy

---

## 📈 Scaling Considerations

### When to Scale:
- More than 1000 Discord users
- API response times > 2 seconds
- High CPU/memory usage (>80%)

### Scaling Options:
1. **Vertical Scaling**: Upgrade server specs
2. **Horizontal Scaling**: Multiple server instances
3. **Load Balancing**: Distribute traffic
4. **CDN**: Cache static assets (CloudFlare)
5. **Database**: Read replicas, connection pooling

---

## 💰 Cost Estimates

### Monthly Costs:
- **VPS Hosting**: $5-15
- **Supabase**: $0-25 (based on usage)
- **Domain**: $10-15/year
- **Monitoring**: $0-10
- **Total**: $15-50/month

### Free Tier Options:
- **Railway**: 500 hours/month free
- **Render**: 750 hours/month free
- **Supabase**: 50MB database free
- **Vercel**: Unlimited for dashboard

---

## 🚨 Common Issues & Solutions

### Issue: Bot goes offline
**Solution**: Use PM2 with auto-restart

### Issue: High memory usage
**Solution**: Add memory limits, restart scheduling

### Issue: API rate limits
**Solution**: Implement caching, request queuing

### Issue: Database connection errors
**Solution**: Connection pooling, retry logic

---

## 📞 Support & Maintenance

### Regular Tasks:
- Weekly: Check logs and errors
- Monthly: Update dependencies  
- Quarterly: Security audit
- Yearly: Renew SSL certificates

### Emergency Contacts:
- Server Status: Setup monitoring alerts
- Database Issues: Supabase support
- DNS Problems: Domain registrar support

---

## 🎯 Next Steps

1. Choose hosting method
2. Set up production environment
3. Configure domain and SSL
4. Deploy application
5. Set up monitoring
6. Test all functionality
7. Launch to users!

**Need help?** This guide covers the essentials, but each hosting provider has specific instructions. Feel free to ask for help with any specific deployment method!
