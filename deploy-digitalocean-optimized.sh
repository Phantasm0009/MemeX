#!/bin/bash

# 🌊 DigitalOcean Optimized Deployment Script
# This script sets up the backend API + Discord bot on a DigitalOcean Droplet
# The dashboard will be deployed separately on App Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="italian-meme-exchange"
APP_DIR="/var/www/$APP_NAME"
GITHUB_REPO="https://github.com/Phantasm0009/MemeX.git"
NODE_VERSION="18"
DOMAIN="${1:-$(curl -s ifconfig.me)}"  # Use provided domain or IP

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}${NC}"
    echo -e "${PURPLE}=== $1 ===${NC}"
    echo -e "${PURPLE}${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run this script as root (use sudo)"
    log_info "Usage: curl -sSL https://raw.githubusercontent.com/Phantasm0009/MemeX/main/deploy-digitalocean-optimized.sh | sudo bash"
    exit 1
fi

log_header "🌊 DigitalOcean Droplet Setup - Backend API + Discord Bot"
log_info "Domain/IP: $DOMAIN"

# Update system
log_info "Updating system packages..."
apt update && apt upgrade -y
log_success "System updated"

# Install essential packages
log_info "Installing essential packages..."
apt install -y curl wget git ufw htop nano unzip software-properties-common build-essential
log_success "Essential packages installed"

# Install Node.js
log_info "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs
log_success "Node.js $(node --version) installed"

# Install PM2
log_info "Installing PM2 process manager..."
npm install -g pm2
log_success "PM2 installed"

# Set up firewall
log_info "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 3001  # Backend API
log_success "Firewall configured"

# Install Nginx
log_info "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log_success "Nginx installed and started"

# Create application directory
log_info "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR
log_success "Application directory created at $APP_DIR"

# Clone repository
log_info "Cloning repository..."
if [ -d ".git" ]; then
    log_info "Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone $GITHUB_REPO .
fi
log_success "Repository cloned/updated"

# Install dependencies
log_info "Installing Node.js dependencies..."
npm install --production
log_success "Dependencies installed"

# Create environment file template
log_info "Creating environment file..."
cat > .env << EOF
# Discord Bot Configuration
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_client_id_here
GUILD_ID=your_guild_id_optional
MARKET_CHANNEL_ID=your_market_channel_id_optional

# Server Configuration
NODE_ENV=production
PORT=3001
BACKEND_PORT=3001
BACKEND_URL=http://$DOMAIN:3001

# Database Configuration (Recommended: Supabase)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys for Real Trend Data (Optional but recommended)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
YOUTUBE_API_KEY=your_youtube_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_REFRESH_TOKEN=your_reddit_refresh_token

# Security
JWT_SECRET=$(openssl rand -base64 32)
EOF
log_success "Environment file created"

# Create optimized PM2 ecosystem file for backend + bot only
log_info "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'discord-bot',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/discord-bot-error.log',
      out_file: './logs/discord-bot-out.log',
      log_file: './logs/discord-bot-combined.log',
      time: true
    },
    {
      name: 'backend-api',
      script: 'backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      min_uptime: '10s',
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        BACKEND_PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
EOF
log_success "PM2 ecosystem file created"

# Create logs directory
log_info "Creating logs directory..."
mkdir -p logs
chmod 755 logs
log_success "Logs directory created"

# Create Nginx configuration for API only
log_info "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
# Italian Meme Stock Exchange - Backend API Configuration
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API endpoints
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # CORS headers for dashboard
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
        
        # CORS for health checks
        add_header Access-Control-Allow-Origin "*" always;
    }

    # Root redirect to API documentation
    location / {
        return 200 '{"status":"Italian Meme Stock Exchange API","endpoints":["/api/stocks","/api/market","/health"],"dashboard":"Deploy on DigitalOcean App Platform"}';
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin "*" always;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
log_success "Nginx configured for API"

# Install Certbot for SSL
log_info "Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
log_success "Certbot installed"

# Create management scripts
log_info "Creating management scripts..."

# Start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Italian Meme Stock Exchange Services..."
cd /var/www/italian-meme-exchange
pm2 start ecosystem.config.js
pm2 save
echo "✅ Services started! Check status with: pm2 status"
EOF
chmod +x start.sh

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Italian Meme Stock Exchange Services..."
pm2 stop all
echo "✅ Services stopped!"
EOF
chmod +x stop.sh

# Update script
cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating Italian Meme Stock Exchange..."
cd /var/www/italian-meme-exchange
pm2 stop all
git pull origin main
npm install --production
pm2 start ecosystem.config.js
pm2 save
echo "✅ Update complete!"
EOF
chmod +x update.sh

# Status script
cat > status.sh << 'EOF'
#!/bin/bash
echo "📊 Italian Meme Stock Exchange Status"
echo "=================================="
pm2 status
echo ""
echo "🌐 API Status:"
curl -s http://localhost:3001/health | jq 2>/dev/null || curl -s http://localhost:3001/health
echo ""
echo "📈 Market Data:"
curl -s http://localhost:3001/api/market | jq '.["SKIBI","SUS","RIZZL"] | to_entries | map({stock: .key, price: .value.price})' 2>/dev/null || echo "Market data unavailable"
EOF
chmod +x status.sh

log_success "Management scripts created"

# Set up PM2 startup
log_info "Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root
log_success "PM2 startup configured"

# Create dashboard deployment guide
log_info "Creating dashboard deployment guide..."
cat > DASHBOARD_DEPLOYMENT.md << EOF
# 📊 Dashboard Deployment on DigitalOcean App Platform

## Quick Deploy to App Platform

1. **Fork the repository** to your GitHub account

2. **Create a new App** on DigitalOcean App Platform:
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository: \`Phantasm0009/MemeX\`

3. **Configure the App**:
   - **Source**: Select your forked repository
   - **Branch**: main
   - **Source Directory**: \`dashboard\`
   - **Autodeploy**: Enabled

4. **App Settings**:
   - **Name**: \`italian-meme-dashboard\`
   - **Region**: Same as your droplet (recommended)
   - **Plan**: Basic (\$5/month)

5. **Environment Variables**:
   Add these in App Platform:
   \`\`\`
   NODE_ENV=production
   BACKEND_URL=http://$DOMAIN:3001
   DASHBOARD_PORT=3002
   \`\`\`

6. **Build Command**: \`npm install\`
7. **Run Command**: \`node server.js\`

## Manual Deploy Commands

If you prefer manual deployment:

\`\`\`bash
# Create app specification
doctl apps create dashboard-app-spec.yaml

# Update existing app
doctl apps update YOUR_APP_ID dashboard-app-spec.yaml
\`\`\`

## Configuration Files

The following files are configured for App Platform deployment:
- \`dashboard/package.json\` - Dependencies and scripts
- \`dashboard/server.js\` - Express server
- \`.env\` - Environment variables (configure in App Platform)

## API Connection

Your dashboard will connect to: \`http://$DOMAIN:3001/api\`

Make sure your API is running on the droplet before deploying the dashboard.
EOF

# Create App Platform specification
cat > dashboard-app-spec.yaml << EOF
name: italian-meme-dashboard
services:
- name: dashboard
  source_dir: /dashboard
  github:
    repo: Phantasm0009/MemeX
    branch: main
    deploy_on_push: true
  run_command: node server.js
  build_command: npm install
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: BACKEND_URL
    value: http://$DOMAIN:3001
  - key: DASHBOARD_PORT
    value: "3002"
  http_port: 3002
region: nyc
EOF

log_success "Dashboard deployment files created"

log_header "🎉 DigitalOcean Droplet Setup Complete!"

echo -e "${GREEN}Your Italian Meme Stock Exchange backend is ready!${NC}"
echo -e ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e ""
echo -e "${BLUE}1. Configure Environment Variables:${NC}"
echo -e "   nano $APP_DIR/.env"
echo -e "   ${YELLOW}Required: BOT_TOKEN, CLIENT_ID${NC}"
echo -e "   ${GREEN}Recommended: SUPABASE_URL, SUPABASE_ANON_KEY${NC}"
echo -e ""
echo -e "${BLUE}2. Start Services:${NC}"
echo -e "   cd $APP_DIR && ./start.sh"
echo -e ""
echo -e "${BLUE}3. Check Status:${NC}"
echo -e "   ./status.sh"
echo -e "   pm2 logs"
echo -e ""
echo -e "${BLUE}4. Deploy Dashboard to App Platform:${NC}"
echo -e "   See: $APP_DIR/DASHBOARD_DEPLOYMENT.md"
echo -e "   Quick: https://cloud.digitalocean.com/apps"
echo -e ""
echo -e "${BLUE}5. Set up SSL (Optional):${NC}"
echo -e "   certbot --nginx -d your-domain.com"
echo -e ""
echo -e "${YELLOW}📡 Service URLs:${NC}"
echo -e "   API: ${BLUE}http://$DOMAIN/api${NC}"
echo -e "   Health: ${BLUE}http://$DOMAIN/health${NC}"
echo -e "   Dashboard: ${BLUE}Deploy on App Platform${NC}"
echo -e ""
echo -e "${YELLOW}💰 Estimated Monthly Costs:${NC}"
echo -e "   Droplet (Basic): ${GREEN}\$6/month${NC}"
echo -e "   App Platform: ${GREEN}\$5/month${NC}"
echo -e "   Total: ${GREEN}\$11/month${NC}"
echo -e ""
echo -e "${GREEN}Your \$200 DigitalOcean credits = 18+ months free! 🎉${NC}"
echo -e ""
echo -e "${PURPLE}Happy trading! 🇮🇹📈💰${NC}"
