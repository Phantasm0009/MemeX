# 🌊 DigitalOcean Deployment Script
#!/bin/bash

# Automated deployment script for DigitalOcean Droplet
# Run this script on your fresh Ubuntu 22.04 droplet

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
    exit 1
fi

log_header "🌊 DigitalOcean Deployment - Italian Meme Stock Exchange"

# Update system
log_info "Updating system packages..."
apt update && apt upgrade -y
log_success "System updated"

# Install essential packages
log_info "Installing essential packages..."
apt install -y curl wget git ufw htop nano unzip software-properties-common
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

# Install Docker (optional)
log_info "Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
log_success "Docker installed"

# Install Docker Compose
log_info "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
log_success "Docker Compose installed"

# Create application directory
log_info "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR
log_success "Application directory created at $APP_DIR"

# Clone repository
log_info "Cloning repository..."
git clone $GITHUB_REPO .
log_success "Repository cloned"

# Install dependencies
log_info "Installing Node.js dependencies..."
npm install --production
log_success "Dependencies installed"

# Set up firewall
log_info "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 8080
ufw allow 3001
ufw allow 3002
log_success "Firewall configured"

# Install Nginx
log_info "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log_success "Nginx installed and started"

# Create environment file template
log_info "Creating environment file template..."
cat > .env << EOF
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
EOF
log_success "Environment file template created"

# Create PM2 ecosystem file
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
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/discord-bot-error.log',
      out_file: './logs/discord-bot-out.log',
      log_file: './logs/discord-bot.log'
    },
    {
      name: 'backend-api',
      script: 'backend/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend.log'
    },
    {
      name: 'dashboard',
      script: 'dashboard/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/dashboard-error.log',
      out_file: './logs/dashboard-out.log',
      log_file: './logs/dashboard.log'
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

# Create Nginx configuration
log_info "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    # Dashboard
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # API
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
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
log_success "Nginx configured"

# Set up SSL with Certbot (optional)
log_info "Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
log_success "Certbot installed (run 'certbot --nginx -d your-domain.com' to set up SSL)"

# Create startup script
log_info "Creating startup script..."
cat > start.sh << 'EOF'
#!/bin/bash
cd /var/www/italian-meme-exchange
pm2 start ecosystem.config.js
pm2 save
EOF
chmod +x start.sh
log_success "Startup script created"

# Set up PM2 startup
log_info "Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root
log_success "PM2 startup configured"

log_header "🎉 Deployment Complete!"

echo -e "${GREEN}Your Italian Meme Stock Exchange is ready to deploy!${NC}"
echo -e ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Edit the .env file with your actual values:"
echo -e "   ${BLUE}nano $APP_DIR/.env${NC}"
echo -e ""
echo -e "2. Start your applications:"
echo -e "   ${BLUE}cd $APP_DIR && ./start.sh${NC}"
echo -e ""
echo -e "3. Check status:"
echo -e "   ${BLUE}pm2 status${NC}"
echo -e "   ${BLUE}pm2 logs${NC}"
echo -e ""
echo -e "4. Access your applications:"
echo -e "   Dashboard: ${BLUE}http://$(curl -s ifconfig.me)${NC}"
echo -e "   API: ${BLUE}http://$(curl -s ifconfig.me)/api${NC}"
echo -e ""
echo -e "5. Set up SSL (optional):"
echo -e "   ${BLUE}certbot --nginx -d your-domain.com${NC}"
echo -e ""
echo -e "${GREEN}Your $200 DigitalOcean credits will last 33+ months with a $6 droplet!${NC}"
echo -e "${GREEN}Estimated monthly cost: $6 (Basic Droplet)${NC}"
echo -e ""
echo -e "${PURPLE}Happy trading! 🇮🇹📈${NC}"
