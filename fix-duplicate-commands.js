#!/usr/bin/env node

// 🧹 Fix Duplicate Commands Script
// This script removes all existing commands (both global and guild) to fix duplicates

import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

if (!clientId || !token) {
    console.error('❌ Missing CLIENT_ID or BOT_TOKEN in .env file');
    process.exit(1);
}

const rest = new REST().setToken(token);

async function fixDuplicateCommands() {
    console.log('🧹 Fixing Duplicate Commands...\n');
    
    try {
        // Clear global commands
        console.log('🗑️  Clearing global commands...');
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log('✅ Global commands cleared');
        
        // Clear guild commands if guild ID exists
        if (guildId) {
            console.log(`🗑️  Clearing guild commands for ${guildId}...`);
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            console.log('✅ Guild commands cleared');
        }
        
        console.log('\n🎉 All duplicate commands have been removed!');
        console.log('\n📝 Next steps:');
        console.log('1. Run: node deploy-commands.js');
        console.log('   (This will deploy to your guild if GUILD_ID is set)');
        console.log('2. Or run: node deploy-commands.js --global');
        console.log('   (This will deploy globally - takes up to 1 hour)');
        
    } catch (error) {
        console.error('❌ Error clearing commands:', error);
        
        if (error.code === 50001) {
            console.error('💡 Bot lacks permissions or guild ID is incorrect');
        }
        
        process.exit(1);
    }
}

fixDuplicateCommands();
