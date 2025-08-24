# 🚀 Manual DigitalOcean Docker Deployment for memexbot.xyz

This guide provides step-by-step manual instructions for deploying your Discord meme stock bot to DigitalOcean using Docker.

## 📋 Pre-Deployment Checklist

- [ ] Discord Bot Token and Client ID ready
- [ ] Domain `memexbot.xyz` purchased and DNS access available
- [ ] DigitalOcean account with payment method
- [ ] Basic terminal/SSH knowledge

## 🏗️ Step 1: Create DigitalOcean Droplet

### 1.1 Create Droplet
1. Log into [DigitalOcean](https://cloud.digitalocean.com)
2. Click **"Create"** → **"Droplets"**
3. **Choose Image:** Ubuntu 22.04 (LTS) x64
4. **Choose Plan:** 
   - **Basic Plan**
   - **Regular Intel** - $12/month (2GB RAM, 1 vCPU, 50GB SSD)
   - For testing: $6/month (1GB RAM) will work but might be slower
5. **Choose Datacenter:** Select closest to your users
6. **Authentication:** 
   - **SSH Key** (recommended - upload your public key)
   - Or **Password** (make it strong!)
7. **Hostname:** `memexbot-server`
8. Click **"Create Droplet"**

### 1.2 Note Your IP Address
- Write down the droplet IP address (e.g., `159.203.134.206`)
- You'll need this for DNS setup

## 🌐 Step 2: Configure DNS for memexbot.xyz

### 2.1 Update DNS Records
Go to your domain registrar's DNS management and add:

```
Type: A
Name: @
Value: YOUR_DROPLET_IP_ADDRESS
TTL: 300

Type: A
Name: www  
Value: YOUR_DROPLET_IP_ADDRESS
TTL: 300
```

### 2.2 Wait for DNS Propagation
- DNS changes take 5-30 minutes to propagate
- Test with: `ping memexbot.xyz` (should return your droplet IP)

## 🔐 Step 3: Connect to Your Droplet

### 3.1 SSH Connection
```bash
# Replace YOUR_DROPLET_IP with your actual IP
ssh root@YOUR_DROPLET_IP

# If using SSH key authentication, no password needed
# If using password, enter the password you set
```

### 3.2 Update System
```bash
apt update && apt upgrade -y
```

## 🐳 Step 4: Install Docker

### 4.1 Install Docker Engine
```bash
# Install dependencies
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index
apt update

# Install Docker
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
docker compose version
```

## 📁 Step 5: Setup Application

### 5.1 Create Directory and Clone Code
```bash
# Create application directory
mkdir -p /var/www/memexbot
cd /var/www/memexbot

# Clone your repository
git clone https://github.com/Phantasm0009/MemeX.git .

# Verify files are there
ls -la
```

### 5.2 Configure Environment Variables
```bash
# Copy the production environment template
cp .env.production .env

# Edit environment variables
nano .env
```

**Update these REQUIRED values in the .env file:**
```bash
# ===== DISCORD BOT CONFIGURATION =====
BOT_TOKEN=your_actual_discord_bot_token_here
CLIENT_ID=your_actual_discord_client_id_here
GUILD_ID=your_discord_server_id_optional

# ===== SERVER CONFIGURATION =====
NODE_ENV=production
BACKEND_PORT=3001
DASHBOARD_PORT=3002
BACKEND_URL=https://memexbot.xyz/api

# ===== OPTIONAL API KEYS =====
# Add these if you want real trend data (recommended for production)
GOOGLE_TRENDS_API_KEY=your_google_api_key_optional
REDDIT_CLIENT_ID=your_reddit_client_id_optional
REDDIT_CLIENT_SECRET=your_reddit_client_secret_optional
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_optional
YOUTUBE_API_KEY=your_youtube_api_key_optional
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

## 🔒 Step 6: Install SSL Certificate Tools

```bash
# Install Certbot for SSL certificates
apt install -y certbot python3-certbot-nginx

# Create certbot directory
mkdir -p /var/www/certbot
```

## 🚀 Step 7: Build and Start Services

### 7.1 Build Docker Images
```bash
cd /var/www/memexbot

# Build all images (this takes a few minutes)
docker compose build --no-cache
```

### 7.2 Start Services
```bash
# Start all services in background
docker compose up -d

# Check if services are running
docker compose ps
```

You should see all services running:
- `memex-discord-bot`
- `memex-backend`
- `memex-dashboard`
- `memex-nginx`

## 🔐 Step 8: Setup SSL Certificate

### 8.1 Test Domain Connection
```bash
# Test if domain points to your server
curl http://memexbot.xyz

# You should see a redirect to HTTPS (that will fail for now)
```

### 8.2 Get SSL Certificate
```bash
# Replace YOUR_EMAIL with your actual email
certbot certonly --webroot -w /var/www/certbot -d memexbot.xyz -d www.memexbot.xyz --email YOUR_EMAIL@example.com --agree-tos --non-interactive
```

### 8.3 Restart Nginx with SSL
```bash
# Restart nginx to use the new SSL certificate
docker compose restart nginx

# Check nginx logs
docker compose logs nginx
```

## 🤖 Step 9: Deploy Discord Commands

```bash
# Deploy slash commands to Discord
docker compose exec memex-discord-bot npm run deploy-commands
```

If successful, you should see:
```
✅ Successfully registered X application commands.
```

## ✅ Step 10: Verify Everything Works

### 10.1 Test Website
1. Open browser and go to `https://memexbot.xyz`
2. You should see the trading dashboard
3. Check that it loads without SSL warnings

### 10.2 Test Discord Bot
1. Go to your Discord server
2. Type `/help` - the bot should respond
3. Try `/market` to see the market data

### 10.3 Check Service Status
```bash
# Check all containers are running
docker compose ps

# Check logs for any errors
docker compose logs -f
```

## 🔧 Management Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f memex-discord-bot
docker compose logs -f memex-backend
docker compose logs -f memex-dashboard
docker compose logs -f memex-nginx
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific service  
docker compose restart memex-discord-bot
```

### Update Code
```bash
cd /var/www/memexbot
git pull origin main
docker compose build
docker compose up -d
```

### Stop/Start
```bash
# Stop all services
docker compose down

# Start all services
docker compose up -d
```

## 🔒 Security Setup

### Enable Firewall
```bash
# Install UFW firewall
apt install ufw

# Allow essential ports
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### Setup Auto-Renewal for SSL
```bash
# Add cron job for certificate renewal
crontab -e

# Add this line (choose nano if prompted):
0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx
```

## 🚨 Troubleshooting

### Common Issues

**1. Website not loading**
```bash
# Check if domain points to server
dig +short memexbot.xyz

# Check nginx logs
docker compose logs nginx
```

**2. Discord bot not responding**
```bash
# Check bot logs
docker compose logs memex-discord-bot

# Restart bot
docker compose restart memex-discord-bot
```

**3. SSL certificate failed**
```bash
# Check if port 80 is accessible
curl -I http://memexbot.xyz

# Try manual certificate
certbot certonly --standalone -d memexbot.xyz
```

**4. Services not starting**
```bash
# Check available resources
free -h
df -h

# Check Docker
systemctl status docker
```

### Emergency Recovery
```bash
# Nuclear option - restart everything
cd /var/www/memexbot
docker compose down
docker system prune -a -f
git pull origin main
docker compose build --no-cache
docker compose up -d
```

## 💰 Monthly Costs

- **DigitalOcean Droplet:** $12/month (2GB RAM)
- **Domain:** ~$1/month (varies by registrar)
- **SSL Certificate:** Free (Let's Encrypt)
- **Total:** ~$13/month

## 🎉 Success!

If everything works:
- ✅ `https://memexbot.xyz` loads the dashboard
- ✅ Discord bot responds to commands
- ✅ SSL certificate shows as secure
- ✅ All Docker containers running

Your Italian Meme Stock Exchange is now live! 🇮🇹💎

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs: `docker compose logs -f`
3. Ensure all environment variables are correctly set
4. Verify DNS is pointing to your droplet IP
