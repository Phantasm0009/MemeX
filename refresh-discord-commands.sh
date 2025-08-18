#!/bin/bash

# 🔄 Refresh Discord Commands on DigitalOcean
# This script clears old commands and deploys fresh ones

echo "🤖 Refreshing Discord Slash Commands..."

cd /var/www/italian-meme-exchange

echo "🗑️  Clearing old commands..."
npm run clear-commands

echo "⏳ Waiting 5 seconds..."
sleep 5

echo "📤 Deploying fresh commands..."
npm run deploy-commands

echo "✅ Commands refreshed! They should be updated in Discord now."
echo "💡 If you don't see changes, try:"
echo "   - Restart Discord client"
echo "   - Use 'node deploy-commands.js --refresh --global' for global commands"
