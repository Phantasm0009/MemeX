# 🐳 Docker Deployment Guide for memexbot.xyz

Complete guide to deploy the Italian Meme Stock Exchange on DigitalOcean droplets using Docker containers.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                memexbot.xyz                         │
├─────────────────────────────────────────────────────┤
│  🌍 Nginx (Port 80/443) - SSL Termination          │
│  ├── 🤖 Discord Bot Service                         │
│  ├── 🔧 Backend API Service (Port 3001)             │
│  └── 📊 Dashboard Service (Port 3002)               │
└─────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### 1. Domain Setup
- Purchase domain `memexbot.xyz` from any registrar
- Have access to DNS management

### 2. DigitalOcean Account
- Create account at [DigitalOcean](https://digitalocean.com)
- Add payment method

### 3. Discord Bot Setup
- Create Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
- Get Bot Token and Client ID
- Invite bot to your server with appropriate permissions

## 🚀 Step-by-Step Deployment

### Step 1: Create DigitalOcean Droplet

1. **Log into DigitalOcean**
2. **Create Droplet:**
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($12/month recommended, $6/month minimum)
   - **CPU:** Regular (2GB RAM minimum)
   - **Datacenter:** Choose closest to your users
   - **Authentication:** SSH Key (recommended) or Password
   - **Hostname:** `memexbot-server`

3. **Note the IP address** (e.g., `159.203.134.206`)

### Step 2: Configure DNS

1. **Go to your domain registrar's DNS management**
2. **Add these DNS records:**
   ```
   Type: A
   Name: @
   Value: YOUR_DROPLET_IP
   TTL: 300

   Type: A  
   Name: www
   Value: YOUR_DROPLET_IP
   TTL: 300
   ```

3. **Wait for DNS propagation** (5-30 minutes)

### Step 3: Connect to Your Droplet

```bash
# Replace YOUR_DROPLET_IP with actual IP
ssh root@YOUR_DROPLET_IP
```

### Step 4: Run Automated Deployment

```bash
# Download and run the deployment script
curl -sSL https://raw.githubusercontent.com/Phantasm0009/MemeX/main/deploy-docker.sh | sudo bash
```

### Step 5: Configure Environment Variables

```bash
# Navigate to app directory
cd /var/www/memexbot

# Edit environment variables
nano .env
```

**Update these required values:**
```bash
# Discord Bot Configuration
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here
GUILD_ID=your_discord_server_id_optional

# API Keys (optional but recommended)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Restart Services

```bash
# Restart all containers with new environment
docker compose restart

# Check if everything is running
docker compose ps
```

### Step 7: Deploy Discord Commands

```bash
# Deploy slash commands to Discord
docker compose exec discord-bot npm run deploy-commands
```

### Step 8: Set Up SSL Certificate

```bash
# Get SSL certificate (replace with your email)
certbot certonly --webroot -w /var/www/certbot -d memexbot.xyz --email your-email@example.com --agree-tos --non-interactive

# Restart Nginx to use SSL
docker compose restart nginx
```

## 🔧 Management Commands

### View Logs
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f discord-bot
docker compose logs -f backend
docker compose logs -f dashboard
docker compose logs -f nginx
```

### Restart Services
```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart discord-bot
```

### Update Code
```bash
cd /var/www/memexbot
git pull origin main
docker compose build
docker compose up -d
```

### Stop/Start All Services
```bash
# Stop all
docker compose down

# Start all
docker compose up -d
```

## 📊 Monitoring & Maintenance

### Check Service Status
```bash
# Check Docker containers
docker compose ps

# Check system resources
htop

# Check disk space
df -h
```

### Backup Important Data
```bash
# Backup database and user data
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/

# Copy backup to local machine
scp root@YOUR_DROPLET_IP:/var/www/memexbot/backup-*.tar.gz ./
```

### Auto-restart on Reboot
```bash
# Enable Docker to start on boot
systemctl enable docker

# Create systemd service for auto-restart
cat > /etc/systemd/system/memexbot.service << 'EOF'
[Unit]
Description=MemeXBot Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/var/www/memexbot
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
systemctl enable memexbot.service
```

## 🔒 Security Best Practices

### 1. Firewall Setup
```bash
# Install UFW firewall
apt install ufw

# Allow SSH, HTTP, and HTTPS
ufw allow ssh
ufw allow 80
ufw allow 443

# Enable firewall
ufw enable
```

### 2. Regular Updates
```bash
# Update system packages monthly
apt update && apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d
```

### 3. Monitor Logs
```bash
# Set up log rotation
echo '/var/www/memexbot/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}' > /etc/logrotate.d/memexbot
```

## 🆘 Troubleshooting

### Common Issues

**1. SSL Certificate Fails**
```bash
# Check if domain points to server
dig +short memexbot.xyz

# Manual certificate request
certbot certonly --standalone -d memexbot.xyz
```

**2. Discord Bot Not Responding**
```bash
# Check bot logs
docker compose logs -f discord-bot

# Restart bot
docker compose restart discord-bot
```

**3. Website Not Loading**
```bash
# Check Nginx logs
docker compose logs -f nginx

# Test Nginx configuration
docker compose exec nginx nginx -t
```

**4. Services Not Starting**
```bash
# Check Docker daemon
systemctl status docker

# Check available disk space
df -h

# Check memory usage
free -h
```

### Emergency Recovery
```bash
# If everything breaks, restart from scratch
cd /var/www/memexbot
docker compose down
docker system prune -a
git pull origin main
docker compose build --no-cache
docker compose up -d
```

## 💰 Cost Breakdown

- **DigitalOcean Droplet:** $12/month (2GB RAM, 50GB SSD)
- **Domain Registration:** $10-15/year
- **SSL Certificate:** Free (Let's Encrypt)
- **Total Monthly Cost:** ~$12

## 🎯 Performance Optimization

### For High Traffic
```bash
# Upgrade to higher droplet plan
# Scale individual services
docker compose up -d --scale backend=2 --scale dashboard=2
```

### Database Optimization
```bash
# If using external database, consider DigitalOcean Managed Database
# PostgreSQL starting at $15/month
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service logs with `docker compose logs -f`
3. Ensure all environment variables are set correctly
4. Verify DNS settings and SSL certificate status

---

🚀 **Congratulations!** Your memexbot.xyz Italian Meme Stock Exchange is now live and ready to trade memes! 🇮🇹💎
