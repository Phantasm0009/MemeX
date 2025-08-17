#!/bin/bash

# 🚀 Production Deployment Script for Italian Meme Stock Exchange
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="italian-meme-stock-exchange"
DOMAIN="yourdomain.com"
EMAIL="your-email@domain.com"
USER="ubuntu"
HOST="your-server-ip"

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

# Check if running on server
if [ "$1" = "server" ]; then
    log_info "Running server setup..."
    
    # Update system
    log_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js 18
    log_info "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install PM2
    log_info "Installing PM2..."
    sudo npm install -g pm2
    
    # Install Nginx
    log_info "Installing Nginx..."
    sudo apt install nginx -y
    
    # Install Certbot
    log_info "Installing Certbot..."
    sudo apt install certbot python3-certbot-nginx -y
    
    # Create app directory
    log_info "Creating application directory..."
    sudo mkdir -p /var/www/$PROJECT_NAME
    sudo chown $USER:$USER /var/www/$PROJECT_NAME
    
    # Create logs directory
    mkdir -p /var/www/$PROJECT_NAME/logs
    
    log_success "Server setup completed!"
    exit 0
fi

# Local deployment
log_info "Starting deployment to production server..."

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    log_warning "SSH key not found. Generating new key..."
    ssh-keygen -t rsa -b 4096 -C "$EMAIL"
    log_info "Add this key to your server: ~/.ssh/id_rsa.pub"
    exit 1
fi

# Test SSH connection
log_info "Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 $USER@$HOST "echo 'SSH connection successful'"; then
    log_error "SSH connection failed. Check your server IP and SSH key."
    exit 1
fi

# Sync files to server
log_info "Syncing files to server..."
rsync -avz --exclude-from='.gitignore' \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='.env' \
    ./ $USER@$HOST:/var/www/$PROJECT_NAME/

# Execute deployment on server
log_info "Executing deployment on server..."
ssh $USER@$HOST << EOF
    cd /var/www/$PROJECT_NAME
    
    # Install dependencies
    npm ci --only=production
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp .env.production .env
        echo "⚠️  Please edit .env file with your production values"
    fi
    
    # Setup Nginx configuration
    sudo cp nginx.conf /etc/nginx/sites-available/$PROJECT_NAME
    sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    sudo nginx -t
    
    # Start PM2 processes
    pm2 delete all 2>/dev/null || true
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    # Setup PM2 startup
    sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    echo "✅ Deployment completed!"
EOF

log_success "Deployment completed successfully!"

# SSL Certificate setup
log_info "Setting up SSL certificate..."
ssh $USER@$HOST << EOF
    # Get SSL certificate
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Setup auto-renewal
    sudo crontab -l | grep -q 'certbot renew' || echo '0 12 * * * /usr/bin/certbot renew --quiet' | sudo crontab -
EOF

log_success "SSL certificate setup completed!"

# Final health check
log_info "Running health check..."
sleep 10
if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
    log_success "Health check passed! Your application is live at https://$DOMAIN"
else
    log_warning "Health check failed. Please check the logs."
fi

log_success "🎉 Deployment completed! Your Italian Meme Stock Exchange is live!"
log_info "Dashboard: https://$DOMAIN"
log_info "API: https://$DOMAIN/api"
log_info "Monitor with: ssh $USER@$HOST 'pm2 logs'"
