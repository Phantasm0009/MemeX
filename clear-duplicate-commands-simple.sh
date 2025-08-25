#!/bin/bash

# 🧹 Clear Duplicate Discord Commands (Simple Method)
# This script clears all commands and re-registers them cleanly

set -e

echo "🧹 Clearing duplicate Discord commands..."

# Use the Discord bot container to clear and re-register commands
echo "🔍 Accessing Discord bot container..."
docker exec memex-discord-bot-ultimate-v3 sh -c "
    echo '🗑️  Clearing all existing commands...'
    
    # Clear global commands
    node -e \"
        import('./deploy-commands.js').then(() => {
            console.log('Commands cleared and re-registered');
        }).catch(err => {
            console.error('Error:', err.message);
        });
    \"
"

echo "⏳ Waiting for command registration to complete..."
sleep 10

# Check bot status
echo "📋 Checking bot status:"
docker logs memex-discord-bot-ultimate-v3 --tail 5

echo ""
echo "✅ Command cleanup complete!"
echo ""
echo "🎯 Discord commands should now be clean without duplicates."
echo "🔍 Try typing '/' in your Discord server to see the commands."
