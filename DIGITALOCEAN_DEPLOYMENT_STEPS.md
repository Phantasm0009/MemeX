# 🌊 Step-by-Step DigitalOcean Deployment

## Step 1: Create DigitalOcean Account ✅

You already have $200 credits! 🎉

## Step 2: Choose Your Deployment Method

### 🎯 Recommended: Single Droplet ($6/month)

#### Create Droplet
1. **Login to DigitalOcean**
2. **Click "Create" → "Droplets"**
3. **Choose Image**: Ubuntu 22.04 LTS
4. **Choose Plan**: Basic ($6/month, 1GB RAM, 1 vCPU, 25GB SSD)
5. **Choose Region**: New York, San Francisco, or Amsterdam (closest to your users)
6. **Authentication**: SSH Key (recommended) or Password
7. **Hostname**: `italian-meme-exchange`
8. **Click "Create Droplet"**

#### Connect to Your Droplet
```bash
# SSH into your server (replace with your droplet IP)
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y
```

## Step 3: Install Dependencies

### Install Node.js 18
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Install Git
```bash
apt install git -y
```

## Step 4: Deploy Your Application

### Clone Your Repository
```bash
# Create the web directory first
sudo mkdir -p /var/www

# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/Phantasm0009/MemeX.git italian-meme-exchange

# Navigate to project
cd italian-meme-exchange

# Install dependencies
npm install
```

### Set Up Environment Variables
```bash
# Create production environment file
nano .env

# Add your environment variables (see Step 5 below)
```

## Step 5: Environment Variables

Create `.env` file with your configuration:

```bash
# Discord Bot Configuration
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here
GUILD_ID=your_guild_id_optional
MARKET_CHANNEL_ID=your_market_channel_id_optional

# Server Configuration
NODE_ENV=production
PORT=8080
BACKEND_PORT=3001
DASHBOARD_PORT=3002
BACKEND_URL=http://localhost:3001

# Database Configuration (Optional - uses JSON fallback)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys for Real Trend Data (Optional)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
YOUTUBE_API_KEY=your_youtube_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_secret
```

## Step 6: Set Up Firewall

```bash
# Enable UFW firewall
ufw enable

# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Allow your app ports
ufw allow 8080
ufw allow 3001
ufw allow 3002

# Check status
ufw status
```

## Step 7: Start Your Application

### Using PM2 (Recommended)
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add this configuration:
```javascript
module.exports = {
  apps: [
    {
      name: 'italian-meme-discord-bot',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/discord-bot-error.log',
      out_file: './logs/discord-bot-out.log',
      log_file: './logs/discord-bot-combined.log',
      time: true
    },
    {
      name: 'italian-meme-backend',
      script: 'backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        BACKEND_PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'italian-meme-dashboard',
      script: 'dashboard/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        DASHBOARD_PORT: 3002
      },
      error_file: './logs/dashboard-error.log',
      out_file: './logs/dashboard-out.log',
      log_file: './logs/dashboard-combined.log',
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/Phantasm0009/MemeX.git',
      path: '/var/www/italian-meme-exchange',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
```

### Start All Services
```bash
# Start all applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup

# Check status
pm2 status
```

## Step 8: Set Up Nginx (Optional but Recommended)

### Install Nginx
```bash
apt install nginx -y
```

### Configure Nginx
```bash
# Create nginx configuration
nano /etc/nginx/sites-available/italian-meme-exchange
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or droplet IP

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

### Enable Site
```bash
# Enable the site
ln -s /etc/nginx/sites-available/italian-meme-exchange /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx

# Enable nginx to start on boot
systemctl enable nginx
```

## Step 9: Set Up SSL (Optional but Recommended)

### Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### Get SSL Certificate
```bash
# Replace with your domain
certbot --nginx -d your-domain.com

# Test automatic renewal
certbot renew --dry-run
```

## Step 10: Monitor Your Application

### Check Application Status
```bash
# PM2 status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit
```

### Check System Resources
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check running processes
htop
```

## 🚨 Troubleshooting

### If Bot Won't Start
```bash
# Check logs
pm2 logs discord-bot

# Restart bot
pm2 restart discord-bot

# Check environment variables
printenv | grep BOT_TOKEN
```

### If Dashboard Won't Load
```bash
# Check dashboard logs
pm2 logs dashboard

# Test locally
curl http://localhost:3002

# Check nginx status
systemctl status nginx
```

### If API Isn't Working
```bash
# Check API logs
pm2 logs backend-api

# Test API directly
curl http://localhost:3001/health
```

## ✅ Success Checklist

- [ ] Droplet created and SSH access working
- [ ] Node.js 18 installed
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] PM2 process manager installed
- [ ] All services started with PM2
- [ ] Firewall configured
- [ ] Nginx reverse proxy set up (optional)
- [ ] SSL certificate installed (optional)
- [ ] Discord bot responding to commands
- [ ] Dashboard accessible via web browser
- [ ] API endpoints working

## 🎯 Your URLs After Deployment

- **Dashboard**: `http://your-droplet-ip:3002` or `https://your-domain.com`
- **API**: `http://your-droplet-ip:3001/api` or `https://your-domain.com/api`
- **Bot**: Running in background, responds to Discord commands

## 💰 Cost Monitoring

With your $200 credits and a $6/month droplet:
- **Monthly cost**: $6
- **Credits will last**: 33+ months
- **Total runtime**: Nearly 3 years! 🎉

## 🔄 Maintenance

### Update Your Application
```bash
# Pull latest changes
cd /var/www/italian-meme-exchange
git pull origin main

# Install new dependencies
npm install

# Restart services
pm2 restart all
```

### Monitor Credits
- Check DigitalOcean billing dashboard monthly
- Set up billing alerts in DigitalOcean console

Your Italian Meme Stock Exchange will be running on professional infrastructure for years with your $200 credits! 🇮🇹📈
