#!/bin/bash

# 🔧 Quick Fix for PM2 Ecosystem Config Issue
# Run this on your DigitalOcean droplet to fix the ES module issue

echo "🔧 Fixing PM2 Ecosystem Configuration..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the project directory. Please run from /var/www/italian-meme-exchange"
    exit 1
fi

# Stop any running PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Remove the problematic .js ecosystem file if it exists
if [ -f "ecosystem.config.js" ]; then
    echo "🗑️  Removing problematic ecosystem.config.js..."
    rm ecosystem.config.js
fi

# Create the correct .cjs ecosystem file
echo "📝 Creating proper ecosystem.config.cjs..."
cat > ecosystem.config.cjs << 'EOF'
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

# Update start.sh to use .cjs file
echo "🔄 Updating start.sh script..."
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Italian Meme Stock Exchange Services..."
cd /var/www/italian-meme-exchange
pm2 start ecosystem.config.cjs
pm2 save
echo "✅ Services started! Check status with: pm2 status"
EOF
chmod +x start.sh

# Update update.sh script
echo "🔄 Updating update.sh script..."
cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating Italian Meme Stock Exchange..."
cd /var/www/italian-meme-exchange
pm2 stop all
git pull origin main
npm install --production
pm2 start ecosystem.config.cjs
pm2 save
echo "✅ Update complete!"
EOF
chmod +x update.sh

echo "✅ Fix applied successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your .env file has the required values:"
echo "   - BOT_TOKEN=your_discord_bot_token"
echo "   - CLIENT_ID=your_discord_client_id"
echo ""
echo "2. Start the services:"
echo "   ./start.sh"
echo ""
echo "3. Check status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "🎉 Your Italian Meme Stock Exchange should now start properly!"
