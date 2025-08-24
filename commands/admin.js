import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateMarketPrices } from '../utils/marketAPI.js';
import { updateUserBalance, getUser, getAllStocks } from '../utils/supabaseDb.js';
import { getRandomChaosEvent } from '../utils/triggers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const marketPath = path.join(__dirname, '../market.json');
const metaPath = path.join(__dirname, '../meta.json');

// Bot developer IDs - these users can use admin commands
const BOT_DEVELOPERS = process.env.BOT_DEVELOPERS 
  ? process.env.BOT_DEVELOPERS.split(',').map(id => id.trim())
  : ['1225485426349969518']; // Default developer ID

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('🔧 Professional market administration and management system')
    .setDefaultMemberPermissions(0) // Hide from public - only bot developers can see
    .addSubcommand(subcommand =>
      subcommand
        .setName('addstock')
        .setDescription('📈 Add new asset to trading platform')
        .addStringOption(option =>
          option.setName('symbol')
            .setDescription('Asset symbol (e.g., MEME)')
            .setRequired(true))
        .addNumberOption(option =>
          option.setName('price')
            .setDescription('Initial market price')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Asset full name (e.g., "Skibidi Toilet")')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('volatility')
            .setDescription('Market volatility classification')
            .setRequired(true)
            .addChoices(
              { name: 'Low Risk', value: 'low' },
              { name: 'Medium Risk', value: 'medium' },
              { name: 'High Risk', value: 'high' },
              { name: 'Extreme Risk', value: 'extreme' }
            ))
        .addBooleanOption(option =>
          option.setName('italian')
            .setDescription('Is this an Italian stock? (affected by pasta events)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('removestock')
        .setDescription('Remove a stock from the market')
        .addStringOption(option =>
          option.setName('symbol')
            .setDescription('Stock symbol to remove')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('setprice')
        .setDescription('Manually set a stock price')
        .addStringOption(option =>
          option.setName('symbol')
            .setDescription('Stock symbol')
            .setRequired(true))
        .addNumberOption(option =>
          option.setName('price')
            .setDescription('New price')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('givemoney')
        .setDescription('Give money to a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to give money to')
            .setRequired(true))
        .addNumberOption(option =>
          option.setName('amount')
            .setDescription('Amount to give')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('updateprices')
        .setDescription('Force update all stock prices'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('marketstats')
        .setDescription('View detailed market statistics'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('resetmarket')
        .setDescription('Reset all stock prices to default values'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('startevent')
        .setDescription('Manually trigger a market event with custom duration')
        .addStringOption(option =>
          option.setName('event')
            .setDescription('Type of event to trigger')
            .setRequired(true)
            .addChoices(
              { name: '🍝 Pasta Protocol (All Italian stocks +25-35%)', value: 'PASTA_PROTOCOL' },
              { name: '🍕 Pizza Power (SAHUR +25%)', value: 'PIZZA_POWER' },
              { name: '💕 Romance Boost (RIZZL +40%)', value: 'ROMANCE_BOOST' },
              { name: '💥 Croco Nuke (Random stock -100%)', value: 'CROCO_NUKE' },
              { name: '🌪️ Ohio Steal (Steals 5% from random stock)', value: 'OHIO_STEAL' },
              { name: '🧊 Time Freeze (Reduced volatility)', value: 'LARILA_FREEZE' },
              { name: '💪 Sigma Flex (SIGMA +15%)', value: 'SIGMA_FLEX' },
              { name: '👵 Fanum Tax (Random stock -15%, FANUM +10%)', value: 'FANUM_TAX' },
              { name: '🦍 Banana Power (BANANI +20%)', value: 'BANANI_INVINCIBLE' },
              { name: '🚀 Bull Run (All stocks +15%)', value: 'BULL_RUN' },
              { name: '📉 Bear Market (Most stocks -12%)', value: 'BEAR_MARKET' },
              { name: '🎲 Random Chaos (Surprise event)', value: 'RANDOM_CHAOS' }
            ))
        .addIntegerOption(option =>
          option.setName('duration')
            .setDescription('Duration in minutes (1-10000)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10000))),
            
  async execute(interaction) {
    // Check if user is a bot developer
    if (!BOT_DEVELOPERS.includes(interaction.user.id)) {
      return await interaction.reply({ 
        content: '❌ Only bot developers can use this command!', 
        flags: MessageFlags.Ephemeral 
      });
    }

    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    
    try {
      if (subcommand === 'addstock') {
        const symbol = interaction.options.getString('symbol').toUpperCase();
        const price = interaction.options.getNumber('price');
        const name = interaction.options.getString('name');
        const volatility = interaction.options.getString('volatility');
        const italian = interaction.options.getBoolean('italian') || false;
        
        if (price <= 0) {
          return interaction.editReply('❌ Price must be positive!');
        }
        
        // Load market data
        let market = {};
        let meta = {};
        
        try {
          if (fs.existsSync(marketPath)) {
            market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
          }
          if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          }
        } catch (error) {
          console.error('Error reading market files:', error);
          market = {};
          meta = {};
        }
        
        if (market[symbol]) {
          return interaction.editReply(`❌ Stock ${symbol} already exists!`);
        }
        
        // Add stock with comprehensive data
        market[symbol] = { 
          price, 
          lastChange: 0,
          name,
          timestamp: Date.now(),
          high24h: price,
          low24h: price,
          volume24h: 0
        };
        
        meta[symbol] = { 
          volatility, 
          italian,
          name,
          description: `${italian ? '🇮🇹 ' : ''}${name} - A ${volatility} volatility meme stock`,
          created: Date.now()
        };
        
        // Save files
        fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
        
        const embed = new EmbedBuilder()
          .setTitle('✅ Stock Added Successfully')
          .setColor(0x00ff00)
          .addFields(
            { name: 'Symbol', value: symbol, inline: true },
            { name: 'Name', value: name, inline: true },
            { name: 'Price', value: `$${price.toFixed(2)}`, inline: true },
            { name: 'Volatility', value: volatility.toUpperCase(), inline: true },
            { name: 'Italian Stock', value: italian ? 'Yes 🇮🇹' : 'No', inline: true }
          )
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'removestock') {
        const symbol = interaction.options.getString('symbol').toUpperCase();
        
        let market = {};
        let meta = {};
        
        try {
          if (fs.existsSync(marketPath)) {
            market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
          }
          if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          }
        } catch (error) {
          console.error('Error reading market files:', error);
          return interaction.editReply('❌ Error reading market data!');
        }
        
        if (!market[symbol]) {
          return interaction.editReply(`❌ Stock ${symbol} does not exist!`);
        }
        
        const stockName = meta[symbol]?.name || symbol;
        delete market[symbol];
        delete meta[symbol];
        
        fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
        
        await interaction.editReply(`🗑️ Removed stock **${symbol}** (${stockName}) from the market`);
        
      } else if (subcommand === 'setprice') {
        const symbol = interaction.options.getString('symbol').toUpperCase();
        const price = interaction.options.getNumber('price');
        
        if (price <= 0) {
          return interaction.editReply('❌ Price must be positive!');
        }
        
        let market = {};
        
        try {
          if (fs.existsSync(marketPath)) {
            market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
          }
        } catch (error) {
          console.error('Error reading market file:', error);
          return interaction.editReply('❌ Error reading market data!');
        }
        
        if (!market[symbol]) {
          return interaction.editReply(`❌ Stock ${symbol} does not exist!`);
        }
        
        const oldPrice = market[symbol].price;
        const changePercent = ((price - oldPrice) / oldPrice) * 100;
        
        market[symbol].price = price;
        market[symbol].lastChange = changePercent;
        market[symbol].timestamp = Date.now();
        
        // Update 24h high/low
        if (price > market[symbol].high24h) market[symbol].high24h = price;
        if (price < market[symbol].low24h) market[symbol].low24h = price;
        
        fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
        
        const embed = new EmbedBuilder()
          .setTitle('💰 Price Updated')
          .setColor(changePercent >= 0 ? 0x00ff00 : 0xff0000)
          .addFields(
            { name: 'Stock', value: symbol, inline: true },
            { name: 'Old Price', value: `$${oldPrice.toFixed(2)}`, inline: true },
            { name: 'New Price', value: `$${price.toFixed(2)}`, inline: true },
            { name: 'Change', value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`, inline: true }
          )
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
      } else if (subcommand === 'givemoney') {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getNumber('amount');
        
        try {
          const user = await getUser(targetUser.id);
          const newBalance = user.balance + amount;
          await updateUserBalance(targetUser.id, newBalance);
          
          const embed = new EmbedBuilder()
            .setTitle('💸 Money Transferred')
            .setColor(0x00ff00)
            .addFields(
              { name: 'Recipient', value: targetUser.displayName, inline: true },
              { name: 'Amount', value: `$${amount.toFixed(2)}`, inline: true },
              { name: 'New Balance', value: `$${newBalance.toFixed(2)}`, inline: true }
            )
            .setTimestamp();
          
          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          console.error('Error giving money:', error);
          await interaction.editReply('❌ Error updating user balance!');
        }
        
      } else if (subcommand === 'updateprices') {
        await interaction.editReply('🔄 Updating market prices...');
        
        try {
          await updateMarketPrices();
          await interaction.editReply('✅ Market prices updated successfully!');
        } catch (error) {
          console.error('Error updating prices:', error);
          await interaction.editReply('❌ Error updating market prices!');
        }
        
      } else if (subcommand === 'marketstats') {
        try {
          const market = fs.existsSync(marketPath) ? JSON.parse(fs.readFileSync(marketPath, 'utf8')) : {};
          const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};
          
          const stocks = Object.keys(market);
          const totalValue = stocks.reduce((sum, symbol) => sum + market[symbol].price, 0);
          const avgPrice = totalValue / stocks.length || 0;
          
          const gainers = stocks.filter(s => market[s].lastChange > 0).length;
          const losers = stocks.filter(s => market[s].lastChange < 0).length;
          const unchanged = stocks.filter(s => market[s].lastChange === 0).length;
          
          const italianStocks = stocks.filter(s => meta[s]?.italian).length;
          
          const embed = new EmbedBuilder()
            .setTitle('� Market Statistics')
            .setColor(0x0099ff)
            .addFields(
              { name: 'Total Stocks', value: stocks.length.toString(), inline: true },
              { name: 'Average Price', value: `$${avgPrice.toFixed(2)}`, inline: true },
              { name: 'Total Market Value', value: `$${totalValue.toFixed(2)}`, inline: true },
              { name: 'Gainers', value: gainers.toString(), inline: true },
              { name: 'Losers', value: losers.toString(), inline: true },
              { name: 'Unchanged', value: unchanged.toString(), inline: true },
              { name: 'Italian Stocks', value: `${italianStocks} 🇮🇹`, inline: true }
            )
            .setTimestamp();
          
          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          console.error('Error getting market stats:', error);
          await interaction.editReply('❌ Error retrieving market statistics!');
        }
        
      } else if (subcommand === 'resetmarket') {
        try {
          // Default stocks with proper pricing
          const defaultMarket = {
            "SKIBI": { price: 42.50, lastChange: 0, name: "Skibidi Toilet", timestamp: Date.now(), high24h: 42.50, low24h: 42.50, volume24h: 0 },
            "SUS": { price: 13.37, lastChange: 0, name: "Among Us", timestamp: Date.now(), high24h: 13.37, low24h: 13.37, volume24h: 0 },
            "SAHUR": { price: 88.88, lastChange: 0, name: "Tun Tun Sahur", timestamp: Date.now(), high24h: 88.88, low24h: 88.88, volume24h: 0 },
            "LABUB": { price: 156.90, lastChange: 0, name: "Labubu", timestamp: Date.now(), high24h: 156.90, low24h: 156.90, volume24h: 0 },
            "OHIO": { price: 69.42, lastChange: 0, name: "Ohio Memes", timestamp: Date.now(), high24h: 69.42, low24h: 69.42, volume24h: 0 },
            "RIZZL": { price: 420.69, lastChange: 0, name: "Rizz Lord", timestamp: Date.now(), high24h: 420.69, low24h: 420.69, volume24h: 0 },
            "GYATT": { price: 777.77, lastChange: 0, name: "Gyatt Meme", timestamp: Date.now(), high24h: 777.77, low24h: 777.77, volume24h: 0 },
            "FRIED": { price: 35.20, lastChange: 0, name: "Fried Chicken", timestamp: Date.now(), high24h: 35.20, low24h: 35.20, volume24h: 0 },
            "SIGMA": { price: 999.99, lastChange: 0, name: "Sigma Male", timestamp: Date.now(), high24h: 999.99, low24h: 999.99, volume24h: 0 },
            "TRALA": { price: 25.75, lastChange: 0, name: "Tra La La", timestamp: Date.now(), high24h: 25.75, low24h: 25.75, volume24h: 0 },
            "CROCO": { price: 180.45, lastChange: 0, name: "Crocodile Meme", timestamp: Date.now(), high24h: 180.45, low24h: 180.45, volume24h: 0 }
          };
          
          const defaultMeta = {
            "SKIBI": { volatility: "extreme", italian: true, name: "Skibidi Toilet", description: "🇮🇹 Gains +30% during pasta-eating hours" },
            "SUS": { volatility: "high", italian: false, name: "Among Us", description: "Imposter reports cause -20% panic dumps" },
            "SAHUR": { volatility: "medium", italian: true, name: "Tun Tun Sahur", description: "🇮🇹 +15% when pizza emojis appear" },
            "LABUB": { volatility: "low", italian: false, name: "Labubu", description: "Immune to market crashes on Sundays" },
            "OHIO": { volatility: "extreme", italian: false, name: "Ohio Memes", description: "Randomly steals 5% from other stocks" },
            "RIZZL": { volatility: "high", italian: true, name: "Rizz Lord", description: "🇮🇹 +25% when romance novels are mentioned" },
            "GYATT": { volatility: "extreme", italian: false, name: "Gyatt Meme", description: "Volatility doubles during beach hours" },
            "FRIED": { volatility: "medium", italian: true, name: "Fried Chicken", description: "🇮🇹 +40% during olive oil shortage events" },
            "SIGMA": { volatility: "low", italian: false, name: "Sigma Male", description: "Alpha energy protects from market crashes" },
            "TRALA": { volatility: "medium", italian: true, name: "Tra La La", description: "🇮🇹 Musical meme with steady growth" },
            "CROCO": { volatility: "high", italian: false, name: "Crocodile Meme", description: "Snaps back from losses quickly" }
          };
          
          fs.writeFileSync(marketPath, JSON.stringify(defaultMarket, null, 2));
          fs.writeFileSync(metaPath, JSON.stringify(defaultMeta, null, 2));
          
          await interaction.editReply('🔄 Market reset to default values! All stocks restored with proper pricing.');
        } catch (error) {
          console.error('Error resetting market:', error);
          await interaction.editReply('❌ Error resetting market!');
        }
        
      } else if (subcommand === 'startevent') {
        try {
          const eventType = interaction.options.getString('event');
          const duration = interaction.options.getInteger('duration');
          
          // Generate event effects based on selected type
          let eventEffects = {};
          let eventName = '';
          
          switch (eventType) {
            case 'PASTA_PROTOCOL':
              eventEffects = {
                'SKIBI': 0.35, 'SUS': 0.25, 'SAHUR': 0.30, 'LABUB': 0.25, 'OHIO': 0.25,
                'RIZZL': 0.30, 'GYATT': 0.25, 'FRIED': 0.35, 'SIGMA': 0.25, 'TRALA': 0.30,
                'CROCO': 0.25, 'FANUM': 0.25, 'CAPPU': 0.30, 'BANANI': 0.25, 'LARILA': 0.30
              };
              eventName = '🍝 Pasta Protocol Active! All Italian stocks boosted!';
              break;
              
            case 'PIZZA_POWER':
              eventEffects = { 'SAHUR': 0.25 };
              eventName = '🍕 Pizza Power! SAHUR gets major boost!';
              break;
              
            case 'ROMANCE_BOOST':
              eventEffects = { 'RIZZL': 0.40 };
              eventName = '💕 Romance in the air! RIZZL soars!';
              break;
              
            case 'CROCO_NUKE':
              const stocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
              const target = stocks[Math.floor(Math.random() * stocks.length)];
              eventEffects = { [target]: -1.0 };
              eventName = `💥 Bombardiro Crocodilo NUKE! ${target} obliterated!`;
              break;
              
            case 'OHIO_STEAL':
              const stealStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
              const victim = stealStocks[Math.floor(Math.random() * stealStocks.length)];
              eventEffects = { [victim]: -0.05, 'OHIO': 0.05 };
              eventName = `🌪️ Caporetto Finale steals 5% from ${victim}!`;
              break;
              
            case 'LARILA_FREEZE':
              eventEffects = { TIME_FREEZE: true };
              eventName = '🧊⏰ Lirili Larila time freeze! Market volatility reduced!';
              break;
              
            case 'SIGMA_FLEX':
              eventEffects = { 'SIGMA': 0.15 };
              eventName = '💪 Machio flexes on the bears! SIGMA chad energy!';
              break;
              
            case 'FANUM_TAX':
              const taxStocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'CAPPU', 'BANANI', 'LARILA'];
              const taxedStock = taxStocks[Math.floor(Math.random() * taxStocks.length)];
              eventEffects = { [taxedStock]: -0.15, 'FANUM': 0.10 };
              eventName = `👵💰 Tassa Nonna collects! FANUM taxes ${taxedStock}!`;
              break;
              
            case 'BANANI_INVINCIBLE':
              eventEffects = { 'BANANI': 0.20 };
              eventName = '🦍🍌 Chimpanzini Bananini is invincible! Ape power!';
              break;
              
            case 'BULL_RUN':
              eventEffects = {
                'SKIBI': 0.15, 'SUS': 0.15, 'SAHUR': 0.15, 'LABUB': 0.15, 'OHIO': 0.15,
                'RIZZL': 0.15, 'GYATT': 0.15, 'FRIED': 0.15, 'SIGMA': 0.15, 'TRALA': 0.15,
                'CROCO': 0.15, 'FANUM': 0.15, 'CAPPU': 0.15, 'BANANI': 0.15, 'LARILA': 0.15
              };
              eventName = '🚀 Meme bull run! All stocks surge!';
              break;
              
            case 'BEAR_MARKET':
              eventEffects = {
                'SKIBI': -0.12, 'SUS': -0.12, 'SAHUR': -0.12, 'LABUB': 0, 'OHIO': -0.12,
                'RIZZL': -0.12, 'GYATT': -0.12, 'FRIED': -0.12, 'SIGMA': -0.12, 'TRALA': -0.12,
                'CROCO': -0.12, 'FANUM': -0.12, 'CAPPU': -0.12, 'BANANI': -0.05, 'LARILA': -0.12
              };
              eventName = '📉 Market crash! Most stocks tumble! (LABUB protected)';
              break;
              
            case 'RANDOM_CHAOS':
              const chaosEvent = getRandomChaosEvent();
              eventEffects = chaosEvent;
              eventName = chaosEvent.lastEvent || '🎲 Random chaos event triggered!';
              break;
              
            default:
              eventEffects = {};
              eventName = 'Unknown event';
          }
          
          // Apply event effects to market
          let market = {};
          if (fs.existsSync(marketPath)) {
            market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
          }
          
          const affectedStocks = [];
          let totalChanges = 0;
          
          // Apply price changes
          for (const [stock, change] of Object.entries(eventEffects)) {
            if (stock === 'lastEvent' || stock === 'TIME_FREEZE') continue;
            
            if (market[stock] && typeof change === 'number') {
              const oldPrice = market[stock].price || 0;
              const newPrice = Math.max(0.01, oldPrice * (1 + change)); // Minimum price of 0.01
              const percentChange = ((newPrice - oldPrice) / oldPrice * 100).toFixed(2);
              
              market[stock].price = newPrice;
              market[stock].lastChange = change;
              market[stock].timestamp = Date.now();
              
              // Update 24h high/low
              if (newPrice > (market[stock].high24h || 0)) {
                market[stock].high24h = newPrice;
              }
              if (newPrice < (market[stock].low24h || Infinity)) {
                market[stock].low24h = newPrice;
              }
              
              affectedStocks.push(`${stock}: ${percentChange}%`);
              totalChanges++;
            }
          }
          
          // Save updated market
          fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
          
          // Store event info for tracking (you could extend this to a database later)
          const eventInfo = {
            type: eventType,
            name: eventName,
            duration: duration,
            startTime: Date.now(),
            endTime: Date.now() + (duration * 60 * 1000), // Convert minutes to milliseconds
            affectedStocks: Object.keys(eventEffects).filter(k => k !== 'lastEvent' && k !== 'TIME_FREEZE')
          };
          
          // Create response embed
          const embed = new EmbedBuilder()
            .setTitle('🎭 Admin Event Triggered!')
            .setColor(0x00FF00)
            .setDescription(`**${eventName}**`)
            .addFields(
              { name: '⏱️ Duration', value: `${duration} minutes`, inline: true },
              { name: '📊 Affected Stocks', value: `${totalChanges} stocks`, inline: true },
              { name: '🎯 Event Type', value: eventType.replace('_', ' '), inline: true }
            )
            .setFooter({ text: `Event will last until ${new Date(eventInfo.endTime).toLocaleTimeString()}` })
            .setTimestamp();
          
          if (affectedStocks.length > 0) {
            embed.addFields({
              name: '📈 Price Changes',
              value: affectedStocks.slice(0, 10).join('\n') + (affectedStocks.length > 10 ? '\n...' : ''),
              inline: false
            });
          }
          
          await interaction.editReply({ embeds: [embed] });
          
          // Set a timeout to announce when the event ends (optional)
          setTimeout(() => {
            const channel = interaction.channel;
            if (channel) {
              channel.send(`⌛ **${eventName}** has ended after ${duration} minutes!`);
            }
          }, duration * 60 * 1000);
          
        } catch (error) {
          console.error('Error starting event:', error);
          await interaction.editReply('❌ Error starting event!');
        }
      }
    } catch (error) {
      console.error('Admin command error:', error);
      await interaction.editReply('❌ An error occurred while executing the admin command!');
    }
  }
};