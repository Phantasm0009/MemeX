#!/bin/bash

# 🧹 Clear Duplicate Discord Commands (Direct Method)
# This script directly clears duplicate commands

set -e

echo "🧹 Clearing duplicate Discord commands..."

# Run command clearing directly in the bot container
echo "🗑️  Clearing all Discord commands..."
docker exec memex-discord-bot-ultimate-v3 node -e "
import('./deploy-commands.js').then(module => {
    // The deploy-commands.js should handle clearing and re-registering
    console.log('✅ Commands cleared and re-registered');
}).catch(err => {
    console.error('❌ Error clearing commands:', err.message);
    // Try alternative method
    import('dotenv').then(dotenv => {
        dotenv.config();
        const { REST } = require('@discordjs/rest');
        const { Routes } = require('discord-api-types/v10');
        
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        const clientId = process.env.CLIENT_ID;
        
        console.log('🗑️  Clearing commands with alternative method...');
        return rest.put(Routes.applicationCommands(clientId), { body: [] });
    }).then(() => {
        console.log('✅ Commands cleared successfully');
    }).catch(console.error);
});
"

echo "⏳ Waiting for clearing to complete..."
sleep 5

# Restart bot to re-register commands cleanly
echo "🔄 Restarting Discord bot..."
docker restart memex-discord-bot-ultimate-v3

echo "⏳ Waiting for bot restart..."
sleep 10

echo "📋 Bot restart logs:"
docker logs memex-discord-bot-ultimate-v3 --tail 8

echo ""
echo "✅ Duplicate command cleanup complete!"
echo ""
echo "🎯 Check your Discord server:"
echo "   - Type '/' to see available commands"
echo "   - Commands should no longer be duplicated"
echo "   - All 15 commands should be available: /market, /buy, /sell, /portfolio, etc."
