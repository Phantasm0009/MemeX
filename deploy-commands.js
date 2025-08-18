#!/usr/bin/env node

// 🚀 Discord Slash Commands Deployment Script
// This script can deploy commands or clear all existing commands

import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID; // Optional: for guild-specific commands
const token = process.env.BOT_TOKEN;

if (!clientId || !token) {
    console.error('❌ Missing CLIENT_ID or BOT_TOKEN in .env file');
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear') || args.includes('-c');
const shouldRefresh = args.includes('--refresh') || args.includes('-r');
const isGlobal = args.includes('--global') || args.includes('-g');

console.log('🤖 Discord Slash Commands Manager\n');

if (shouldClear) {
    console.log('🗑️  CLEARING ALL COMMANDS...');
} else if (shouldRefresh) {
    console.log('🔄 REFRESHING COMMANDS (clear + deploy)...');
} else {
    console.log('📤 DEPLOYING COMMANDS...');
}

console.log(`📍 Target: ${isGlobal || !guildId ? 'GLOBAL' : 'GUILD (' + guildId + ')'}\n`);

// Load commands from commands directory
const commands = [];

if (!shouldClear) {
    const foldersPath = path.join(__dirname, 'commands');
    
    if (fs.existsSync(foldersPath)) {
        const commandFiles = fs.readdirSync(foldersPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(foldersPath, file);
            try {
                const command = await import(`file://${filePath}`);
                if ('data' in command.default && 'execute' in command.default) {
                    commands.push(command.default.data.toJSON());
                    console.log(`✅ Loaded: /${command.default.data.name}`);
                } else {
                    console.log(`⚠️  Skipped ${file}: missing 'data' or 'execute' property`);
                }
            } catch (error) {
                console.error(`❌ Error loading ${file}:`, error.message);
            }
        }
    } else {
        console.error('❌ Commands directory not found');
        process.exit(1);
    }
    
    console.log(`\n📊 Total commands loaded: ${commands.length}\n`);
}

// Deploy commands
const rest = new REST().setToken(token);

(async () => {
    try {
        if (shouldClear || shouldRefresh) {
            console.log('🗑️  Clearing existing commands...');
            
            if (isGlobal || !guildId) {
                // Clear global commands
                await rest.put(Routes.applicationCommands(clientId), { body: [] });
                console.log('✅ Successfully cleared all global commands');
            } else {
                // Clear guild commands
                await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
                console.log(`✅ Successfully cleared all guild commands for ${guildId}`);
            }
            
            if (shouldClear && !shouldRefresh) {
                console.log('\n🎉 All commands have been cleared!');
                return;
            }
        }
        
        if (!shouldClear) {
            console.log('📤 Deploying commands...');
            
            if (isGlobal || !guildId) {
                // Deploy global commands (takes up to 1 hour to update)
                const data = await rest.put(
                    Routes.applicationCommands(clientId),
                    { body: commands }
                );
                console.log(`✅ Successfully deployed ${data.length} global commands`);
                console.log('⏰ Note: Global commands can take up to 1 hour to update');
            } else {
                // Deploy guild commands (instant)
                const data = await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    { body: commands }
                );
                console.log(`✅ Successfully deployed ${data.length} guild commands`);
                console.log('⚡ Guild commands are active immediately');
            }
        }
        
        console.log('\n🎉 Command deployment complete!');
        
    } catch (error) {
        console.error('❌ Error during deployment:', error);
        
        if (error.code === 50001) {
            console.error('💡 This error usually means the bot lacks permissions or the guild ID is wrong');
        } else if (error.code === 50035) {
            console.error('💡 This error usually means there\'s a problem with command data structure');
        }
        
        process.exit(1);
    }
})();

// Help text
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Discord Slash Commands Manager

Usage:
  node deploy-commands.js [options]

Options:
  --clear, -c      Clear all existing commands (don't deploy new ones)
  --refresh, -r    Clear existing commands and deploy new ones
  --global, -g     Target global commands instead of guild commands
  --help, -h       Show this help message

Examples:
  node deploy-commands.js                    # Deploy commands to guild
  node deploy-commands.js --global           # Deploy commands globally
  node deploy-commands.js --clear            # Clear all guild commands
  node deploy-commands.js --clear --global   # Clear all global commands
  node deploy-commands.js --refresh          # Clear and redeploy guild commands
  node deploy-commands.js --refresh --global # Clear and redeploy global commands

Environment Variables Required:
  CLIENT_ID     - Your Discord application client ID
  BOT_TOKEN     - Your Discord bot token
  GUILD_ID      - Your Discord server ID (optional, for guild commands)
`);
    process.exit(0);
}
