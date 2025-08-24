import { Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { completeQuest, getUserQuestProgress } from '../utils/supabaseDb.js';
import { updateDiscordUserInfo } from '../utils/marketAPI.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Collection();
const commandsPath = path.join(__dirname, '../commands');
for (const file of fs.readdirSync(commandsPath)) {
  if (file.endsWith('.js')) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(pathToFileURL(filePath).href)).default;
    commands.set(command.data.name, command);
  }
}

export default async function interactionCreate(interaction) {
  // Handle button interactions
  if (interaction.isButton()) {
    // Check if any command can handle this button interaction
    for (const command of commands.values()) {
      if (command.handleButtonInteraction) {
        const handled = await command.handleButtonInteraction(interaction);
        if (handled) return;
      }
    }
    return;
  }
  
  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    // Sync Discord user info to backend cache
    try {
      const member = interaction.guild?.members.cache.get(interaction.user.id) || 
                    await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
      
      const userData = {
        id: interaction.user.id,
        username: interaction.user.username,
        globalName: interaction.user.globalName,
        displayName: member?.displayName || interaction.user.displayName,
        discriminator: interaction.user.discriminator,
        tag: interaction.user.tag
      };
      
      await updateDiscordUserInfo(userData);
    } catch (syncError) {
      console.log('User sync error (non-critical):', syncError.message);
    }
    
    // Quest tracking for bot command usage
    const userId = interaction.user.id;
    const commandName = interaction.commandName;
    
    // Generate daily quests if user doesn't have any
    await getUserQuestProgress(userId);
    
    // Track quest progress based on command used
    if (['buy', 'sell'].includes(commandName)) {
      if (commandName === 'buy') {
        const result = await completeQuest(userId, 'buy_stock');
        console.log(`Buy quest result for ${userId}: ${result}`);
      } else {
        const result = await completeQuest(userId, 'sell_stock');
        console.log(`Sell quest result for ${userId}: ${result}`);
      }
    } else if (['portfolio'].includes(commandName)) {
      const result = await completeQuest(userId, 'check_portfolio');
      console.log(`Portfolio quest result for ${userId}: ${result}`);
    } else if (['stock'].includes(commandName)) {
      const result = await completeQuest(userId, 'meme_stock');
      console.log(`Stock quest result for ${userId}: ${result}`);
    } else if (['daily'].includes(commandName)) {
      const result = await completeQuest(userId, 'daily_bonus');
      console.log(`Daily quest result for ${userId}: ${result}`);
    }
    
    // Always track general bot usage
    const commandResult = await completeQuest(userId, 'use_command');
    console.log(`Command quest result for ${userId}: ${commandResult}`);
    
    // Let individual commands handle their own deferral
    await command.execute(interaction);
    
  } catch (err) {
    console.error(`${interaction.commandName} command error:`, err);
    
    // Handle both regular replies and deferred replies
    const errorMessage = { content: 'There was an error executing this command.', ephemeral: true };
    
    try {
      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else if (!interaction.replied) {
        await interaction.reply(errorMessage);
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}
