import { Client, GatewayIntentBits, Partials, REST, Routes, EmbedBuilder } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { initDb } from './utils/supabaseDb.js';
import { getAllStocks, checkBackendHealth, marketAPI, syncDiscordUsers } from './utils/marketAPI.js';
import { scheduleDailyQuestReset } from './utils/questScheduler.js';
import { marketScheduler } from './utils/marketScheduler.js';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Check:');
console.log(`   - BOT_TOKEN: ${process.env.BOT_TOKEN ? '✅ Found' : '❌ Missing'}`);
console.log(`   - CLIENT_ID: ${process.env.CLIENT_ID ? '✅ Found' : '❌ Missing'}`);
console.log(`   - SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Found' : '❌ Missing'}`);
console.log(`   - SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing'}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables - you need to set these
const TOKEN = process.env.BOT_TOKEN || 'YOUR_DISCORD_BOT_TOKEN';
const CLIENT_ID = process.env.CLIENT_ID || 'YOUR_CLIENT_ID';
const GUILD_ID = process.env.GUILD_ID; // Optional: for dev testing
const MARKET_CHANNEL_ID = process.env.MARKET_CHANNEL_ID; // Channel to monitor for events

// Initialize database (now with better Supabase detection)
await initDb();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User, Partials.Reaction]
});

// Global variables
let marketChannel = null;

// Load events
async function loadEvents() {
  const eventsPath = path.join(__dirname, 'events');
  for (const file of fs.readdirSync(eventsPath)) {
    if (!file.endsWith('.js')) continue;
    const filePath = path.join(eventsPath, file);
    const event = (await import(pathToFileURL(filePath).href)).default;
    const eventName = file.replace('.js', '');
    if (eventName === 'interactionCreate') {
      client.on('interactionCreate', event);
    } else if (eventName === 'messageCreate') {
      client.on('messageCreate', event);
    } else if (eventName === 'messageReactionAdd') {
      client.on('messageReactionAdd', event);
    } else if (eventName === 'ready') {
      client.once('ready', event);
    }
  }
}

// Register slash commands
async function registerCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  for (const file of fs.readdirSync(commandsPath)) {
    if (file.endsWith('.js')) {
      const filePath = path.join(commandsPath, file);
      const command = (await import(pathToFileURL(filePath).href)).default;
      commands.push(command.data.toJSON());
    }
  }
  
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Started refreshing application (/) commands.');
    
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log('Successfully reloaded guild commands.');
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    }
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

// Create market update embed
function createMarketEmbed(marketData, stats) {
  const embed = new EmbedBuilder()
    .setTitle('📈 Meme Stock Exchange Update')
    .setDescription(marketData.lastEvent || 'Market is trading normally')
    .setColor(stats.positiveStocks > stats.negativeStocks ? '#00ff00' : stats.negativeStocks > stats.positiveStocks ? '#ff0000' : '#ffff00')
    .setTimestamp()
    .setFooter({ text: `📊 ${stats.positiveStocks}↗️ ${stats.negativeStocks}↘️ ${stats.neutralStocks}➡️` });

  for (const [symbol, data] of Object.entries(marketData)) {
    if (symbol === 'lastEvent') continue;
    
    const change = data.lastChange || 0;
    const changeText = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
    const emoji = change > 5 ? '🚀' : change > 0 ? '📈' : change < -5 ? '💥' : change < 0 ? '📉' : '➡️';
    
    embed.addFields({ 
      name: `${emoji} ${symbol}`, 
      value: `$${data.price.toFixed(2)}\n${changeText}`, 
      inline: true 
    });
  }

  return embed;
}

// Check backend health and get market data
async function checkMarketHealth() {
  try {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      console.log('✅ Backend is healthy and updating prices');
    } else {
      console.log('⚠️ Backend offline - using local market data');
    }
  } catch (error) {
    console.log('❌ Failed to check backend health:', error.message);
  }
}

// Send periodic market updates to Discord channel
async function sendMarketUpdate() {
  if (!marketChannel) return;
  
  try {
    const marketData = await getAllStocks();
    const stats = {
      totalValue: Object.values(marketData)
        .filter(data => typeof data === 'object' && data.price)
        .reduce((sum, data) => sum + data.price, 0),
      totalVolume: Object.keys(marketData).length - 1,
      positiveStocks: Object.values(marketData).filter(data => typeof data === 'object' && (data.lastChange || 0) > 0).length,
      negativeStocks: Object.values(marketData).filter(data => typeof data === 'object' && (data.lastChange || 0) < 0).length,
      neutralStocks: Object.values(marketData).filter(data => typeof data === 'object' && (data.lastChange || 0) === 0).length
    };
    
    const embed = createMarketEmbed(marketData, stats);
    await marketChannel.send({ embeds: [embed] });
    console.log('📊 Market update sent to Discord channel');
  } catch (error) {
    console.log('Error sending market update:', error.message);
  }
}

// Market update every minute instead of every 5 minutes
cron.schedule('* * * * *', async () => {
  console.log(`⏰ Minute market update - ${new Date().toLocaleTimeString()}`);
  try {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      console.log('✅ Backend is healthy');
    } else {
      console.log('⚠️ Backend offline - continuing with local data');
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
});

// Daily market summary at 9 AM
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 9 && now.getMinutes() === 0) {
    if (!marketChannel) return;
    
    const marketData = await getAllStocks();
    const stockCount = Object.keys(marketData).length - 1; // Exclude lastEvent
    const averagePrice = Object.values(marketData)
      .filter(data => typeof data === 'object' && data.price)
      .reduce((sum, data, _, arr) => sum + data.price / arr.length, 0);
    
    const embed = new EmbedBuilder()
      .setTitle('🌅 Daily Market Open')
      .setDescription(`Good morning traders! The market is open with ${stockCount} active stocks.`)
      .addFields(
        { name: 'Average Price', value: `$${averagePrice.toFixed(2)}`, inline: true },
        { name: 'Backend Status', value: await checkBackendHealth() ? '✅ Online' : '⚠️ Offline', inline: true },
        { name: 'Tip', value: 'Use `/daily` to claim your bonus!', inline: true }
      )
      .setColor('#ffd700')
      .setTimestamp();
    
    try {
      await marketChannel.send({ embeds: [embed] });
      console.log('🌅 Daily market open message sent');
    } catch (error) {
      console.log('Failed to send daily market message:', error.message);
    }
  }
}, 60 * 1000); // Check every minute

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log(`📊 Monitoring ${client.guilds.cache.size} guild(s)`);
  
  // Initialize quest scheduler
  scheduleDailyQuestReset();
  
  // Initialize market scheduler for daily reports and weekly leaderboards
  marketScheduler.start();
  
  // Sync Discord users with backend cache
  console.log('🔄 Syncing Discord users with backend...');
  try {
    // Collect all unique users across all guilds
    const allUsers = new Set();
    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.members.fetch(); // Fetch all members
        for (const member of guild.members.cache.values()) {
          allUsers.add(member);
        }
      } catch (error) {
        console.log(`⚠️ Could not fetch members for guild ${guild.name}:`, error.message);
      }
    }
    
    // Sync users to backend in batches
    const users = Array.from(allUsers);
    console.log(`📝 Syncing ${users.length} Discord users to backend...`);
    
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const userDataBatch = batch.map(member => ({
        id: member.user.id,
        username: member.user.username,
        globalName: member.user.globalName,
        displayName: member.displayName,
        discriminator: member.user.discriminator,
        tag: member.user.tag
      }));
      
      try {
        await syncDiscordUsers(userDataBatch);
        console.log(`✅ Synced batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)}`);
      } catch (error) {
        console.log(`⚠️ Failed to sync user batch:`, error.message);
      }
    }
    
    console.log('✅ Discord user sync completed');
  } catch (error) {
    console.log('⚠️ Discord user sync failed:', error.message);
  }
  
  // Find market channel
  if (MARKET_CHANNEL_ID) {
    try {
      marketChannel = await client.channels.fetch(MARKET_CHANNEL_ID);
      console.log(`📈 Market channel set: #${marketChannel.name}`);
    } catch (error) {
      console.log('⚠️ Could not find market channel:', error.message);
    }
  }
  
  // Send startup message
  if (marketChannel) {
    const embed = new EmbedBuilder()
      .setTitle('🚀 Stock Bot Online!')
      .setDescription('The meme stock exchange is now active. Use `/market` to see current prices!')
      .setColor('#00ff00')
      .setTimestamp();
    
    try {
      await marketChannel.send({ embeds: [embed] });
    } catch (error) {
      console.log('Failed to send startup message:', error.message);
    }
  }
  
  // Check backend health on startup
  setTimeout(checkMarketHealth, 5000);
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (marketChannel) {
    const embed = new EmbedBuilder()
      .setTitle('📴 Stock Bot Offline')
      .setDescription('The stock bot is shutting down. Trading will resume when I come back online!')
      .setColor('#ff0000')
      .setTimestamp();
    
    marketChannel.send({ embeds: [embed] }).then(() => {
      client.destroy();
      process.exit(0);
    });
  } else {
    client.destroy();
    process.exit(0);
  }
});

// Load events and register commands
await loadEvents();
await registerCommands();

// Login
if (!TOKEN || TOKEN === 'YOUR_DISCORD_BOT_TOKEN') {
  console.error('❌ Please set your BOT_TOKEN environment variable!');
  console.log('Set BOT_TOKEN=your_actual_token');
  console.log('Set CLIENT_ID=your_client_id');
  console.log('Set MARKET_CHANNEL_ID=channel_id (optional)');
  process.exit(1);
}

client.login(TOKEN);
