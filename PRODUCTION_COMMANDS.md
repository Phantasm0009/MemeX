# 📋 Quick Reference Commands for memexbot.xyz

## 🚀 Deployment Commands

### One-Line Deployment (Automated)
```bash
curl -sSL https://raw.githubusercontent.com/Phantasm0009/MemeX/main/deploy-docker.sh | sudo bash
```

### Manual Deployment Steps
```bash
# 1. Create droplet directory
mkdir -p /var/www/memexbot && cd /var/www/memexbot

# 2. Clone repository  
git clone https://github.com/Phantasm0009/MemeX.git .

# 3. Setup environment
cp .env.production .env
nano .env  # Edit with your Discord tokens

# 4. Build and start
docker compose build && docker compose up -d

# 5. Deploy Discord commands
docker compose exec memex-discord-bot npm run deploy-commands

# 6. Setup SSL
certbot certonly --webroot -w /var/www/certbot -d memexbot.xyz --email your@email.com --agree-tos --non-interactive
```

## 🔧 Management Commands

### Service Control
```bash
# Start all services
docker compose up -d

# Stop all services  
docker compose down

# Restart all services
docker compose restart

# Restart specific service
docker compose restart memex-discord-bot
```

### Monitoring
```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f memex-discord-bot
docker compose logs -f memex-backend
docker compose logs -f memex-dashboard
docker compose logs -f memex-nginx

# Check service status
docker compose ps

# Check system resources
htop
df -h
```

### Updates
```bash
# Update code
cd /var/www/memexbot
git pull origin main
docker compose build
docker compose up -d

# Force rebuild everything
docker compose down
docker system prune -a -f
git pull origin main
docker compose build --no-cache
docker compose up -d
```

## 🤖 Discord Bot Commands

### Deploy/Update Commands
```bash
# Deploy slash commands
docker compose exec memex-discord-bot npm run deploy-commands

# Clear and redeploy commands
docker compose exec memex-discord-bot node deploy-commands.js --clear
docker compose exec memex-discord-bot npm run deploy-commands
```

### Bot Management
```bash
# View bot logs
docker compose logs -f memex-discord-bot

# Restart bot
docker compose restart memex-discord-bot

# Access bot container
docker compose exec memex-discord-bot /bin/sh
```

## 🔒 SSL Certificate Management

### Initial Setup
```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot certonly --webroot -w /var/www/certbot -d memexbot.xyz -d www.memexbot.xyz --email your@email.com --agree-tos --non-interactive
```

### Renewal
```bash
# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal

# Auto-renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 Troubleshooting

### Common Issues
```bash
# Check if domain points to server
dig +short memexbot.xyz
ping memexbot.xyz

# Test website connectivity
curl -I http://memexbot.xyz
curl -I https://memexbot.xyz

# Check port accessibility
netstat -tlnp | grep :80
netstat -tlnp | grep :443

# Check nginx configuration
docker compose exec memex-nginx nginx -t
```

### Service Recovery
```bash
# Restart unresponsive service
docker compose restart [service-name]

# Rebuild and restart everything
docker compose down
docker compose build --no-cache
docker compose up -d

# Check Docker daemon
systemctl status docker
systemctl restart docker
```

### Database Issues
```bash
# Check database files
ls -la data/
ls -la market.json meta.json

# Reset database (CAUTION: loses user data)
docker compose down
rm -f database.json
docker compose up -d
```

## 📊 Performance Monitoring

### Resource Usage
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
top
htop

# Check Docker resource usage
docker stats
```

### Log Management
```bash
# Check log sizes
du -h logs/

# Clean old logs
find logs/ -name "*.log" -mtime +7 -delete

# View recent errors
docker compose logs --tail=50 memex-backend | grep -i error
```

## 🔄 Backup & Recovery

### Backup Important Data
```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz data/ logs/ .env market.json meta.json

# Copy to local machine
scp root@memexbot.xyz:/var/www/memexbot/backup-*.tar.gz ./
```

### Restore from Backup
```bash
# Stop services
docker compose down

# Extract backup
tar -xzf backup-YYYYMMDD.tar.gz

# Start services
docker compose up -d
```

## 🌐 DNS Management

### Check DNS Propagation
```bash
# Check A record
dig A memexbot.xyz
dig A www.memexbot.xyz

# Check from different locations
nslookup memexbot.xyz 8.8.8.8
nslookup memexbot.xyz 1.1.1.1
```

### Required DNS Records
```
Type: A
Name: @
Value: YOUR_DROPLET_IP

Type: A
Name: www
Value: YOUR_DROPLET_IP
```

## 💰 Cost Optimization

### Droplet Sizing
```bash
# Monitor resource usage
docker stats --no-stream

# If consistently under 50% usage:
# - Consider downgrading to $6/month droplet
# If consistently over 80% usage:
# - Consider upgrading to $24/month droplet
```

### Log Rotation
```bash
# Setup log rotation
echo '/var/www/memexbot/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}' > /etc/logrotate.d/memexbot
```

## 📞 Emergency Contacts

### Service Status URLs
- Main Site: https://memexbot.xyz
- API Health: https://memexbot.xyz/api/health
- DigitalOcean Status: https://status.digitalocean.com

### Quick Health Check
```bash
# Full system check
curl -s https://memexbot.xyz/api/health && echo "✅ API OK" || echo "❌ API Down"
docker compose ps | grep -q "Up" && echo "✅ Services OK" || echo "❌ Services Down"
```
