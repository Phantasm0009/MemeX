#!/bin/bash

# 🧹 Clear Duplicate Discord Commands
# This script clears all existing commands and re-registers them cleanly

set -e

echo "🧹 Clearing duplicate Discord commands..."

# Access the Discord bot container to run command cleanup
echo "🔍 Accessing Discord bot container..."
docker exec -it memex-discord-bot-ultimate-v3 sh -c "
    echo '🗑️  Clearing all existing commands...'
    node -e \"
        import('dotenv').then(dotenv => {
            dotenv.config();
            return import('@discordjs/rest');
        }).then(({ REST }) => {
            return import('discord-api-types/v10');
        }).then(({ Routes }) => {
            const rest = new (require('@discordjs/rest').REST)({ version: '10' }).setToken(process.env.BOT_TOKEN);
            const clientId = process.env.CLIENT_ID;
            
            console.log('🗑️  Clearing global commands...');
            return rest.put(Routes.applicationCommands(clientId), { body: [] });
        }).then(() => {
            console.log('✅ Global commands cleared');
            
            // Also clear guild-specific commands if GUILD_ID is set
            if (process.env.GUILD_ID) {
                const rest = new (require('@discordjs/rest').REST)({ version: '10' }).setToken(process.env.BOT_TOKEN);
                console.log('🗑️  Clearing guild commands...');
                return rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
            }
        }).then(() => {
            console.log('✅ All commands cleared successfully');
        }).catch(console.error);
    \"
"

echo "⏳ Waiting 5 seconds for commands to clear..."
sleep 5

# Restart the Discord bot to re-register commands cleanly
echo "🔄 Restarting Discord bot to re-register commands..."
docker restart memex-discord-bot-ultimate-v3

echo "⏳ Waiting for bot to restart and register commands..."
sleep 15

# Check bot logs
echo "📋 Bot startup logs:"
docker logs memex-discord-bot-ultimate-v3 --tail 10

echo ""
echo "✅ Command cleanup complete!"
echo ""
echo "🎯 The Discord bot should now have clean, non-duplicate commands."
echo "🔍 Check your Discord server - slash commands should be properly registered without duplicates."
