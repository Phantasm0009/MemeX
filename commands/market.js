import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAllStocks, checkBackendHealth } from '../utils/marketAPI.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const metaPath = path.join(__dirname, '../meta.json');

export default {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('View the Italian Meme Stock Exchange market overview')
    .addStringOption(option =>
      option.setName('view')
        .setDescription('Market view type')
        .addChoices(
          { name: '📊 Overview', value: 'overview' },
          { name: '🚀 Top Gainers', value: 'gainers' },
          { name: '📉 Top Losers', value: 'losers' },
          { name: '🇮🇹 Italian Stocks Only', value: 'italian' }
        )),
  async execute(interaction) {
    console.log(`🚨 MARKET COMMAND EXECUTION STARTED - USER: ${interaction.user.username}`);
    console.log(`🎯 Market command started for user ${interaction.user.username}`);
    console.log(`🎯 MARKET COMMAND: EXECUTION STARTED - THIS IS A TEST`);
    
    await interaction.deferReply();
    console.log(`🎯 Market command: Reply deferred`);
    console.log(`🚨 MARKET COMMAND: ABOUT TO TRY GETALLSTOCKS`);
    
    try {
      const viewType = interaction.options.getString('view') || 'overview';
      console.log(`🎯 Market command: View type = ${viewType}`);
      
      // Check backend status
      console.log(`🎯 Market command: Checking backend health...`);
      const backendHealthy = await checkBackendHealth();
      console.log(`🎯 Market command: Backend healthy = ${backendHealthy}`);
      
      console.log(`🎯 Market command: About to call getAllStocks()`);
      console.log(`🚨 CALLING getAllStocks() NOW - THIS SHOULD TRIGGER OUR DEBUG`);
      let market;
      try {
        market = await getAllStocks();
        console.log(`🎯 Market command: getAllStocks() SUCCESS - type:`, typeof market, market ? `keys: ${Object.keys(market).length}` : 'null/undefined');
        console.log(`🚨 MARKET COMMAND: getAllStocks() RETURNED:`, market ? 'HAS DATA' : 'NO DATA');
      } catch (getAllStocksError) {
        console.log(`🎯 Market command: getAllStocks() ERROR:`, getAllStocksError.message);
        console.log(`🎯 Market command: getAllStocks() ERROR STACK:`, getAllStocksError.stack);
        market = null;
      }
      
      if (!market || Object.keys(market).length === 0) {
        console.log(`❌ Market command: Market data check failed - market:`, !!market, `keys:`, market ? Object.keys(market).length : 'N/A');
        console.log(`🎯 MARKET COMMAND: ABOUT TO SEND UNAVAILABLE MESSAGE`);
        return interaction.editReply({
          content: '❌ Market data unavailable. Please try again later.'
        });
      }

      // Load meta data
      let meta = {};
      if (fs.existsSync(metaPath)) {
        meta = JSON.parse(fs.readFileSync(metaPath));
      }

      // Process stocks based on view type
      let stockEntries = Object.entries(market).filter(([key]) => key !== 'lastEvent');
      
      switch (viewType) {
        case 'gainers':
          stockEntries = stockEntries.filter(([, data]) => data.lastChange > 0);
          stockEntries.sort(([, a], [, b]) => b.lastChange - a.lastChange);
          break;
        case 'losers':
          stockEntries = stockEntries.filter(([, data]) => data.lastChange < 0);
          stockEntries.sort(([, a], [, b]) => a.lastChange - b.lastChange);
          break;
        case 'italian':
          stockEntries = stockEntries.filter(([symbol]) => meta[symbol]?.italian);
          stockEntries.sort(([, a], [, b]) => b.price - a.price);
          break;
        default:
          stockEntries.sort(([, a], [, b]) => b.price - a.price);
      }

      // Show ALL stocks - no more artificial limits!
      // We'll split into multiple embeds if needed
      const filteredStocksCount = stockEntries.length;
      const allMarketStocks = Object.keys(market).filter(key => key !== 'lastEvent').length;

      // Calculate market metrics
      const marketCap = stockEntries.reduce((sum, [, data]) => sum + data.price, 0);
      const avgPrice = marketCap / stockEntries.length;
      const gainers = stockEntries.filter(([, data]) => data.lastChange > 0).length;
      const losers = stockEntries.filter(([, data]) => data.lastChange < 0).length;
      const neutral = allMarketStocks - gainers - losers;

      // Create professional trading interface embed
      const embed = new EmbedBuilder()
        .setTitle('📊 **MemeX TRADING TERMINAL**')
        .setDescription('```yaml\nMarket Status: LIVE\nTrading Session: 24/7 Active\nData Feed: Real-time\n```')
        .setColor('#00d4aa')
        .setTimestamp()
        .setFooter({ 
          text: `MemeX Trading Platform • ${viewType.toUpperCase()} View • ${backendHealthy ? '🟢 ONLINE' : '🔴 OFFLINE'}`, 
          iconURL: 'https://cdn.discordapp.com/attachments/1234567890/placeholder-icon.png' 
        });

      // Add market overview with professional metrics
      let overviewText = `\`\`\`yaml\nMarket Cap: $${(marketCap/1000).toFixed(1)}K\nAvg Price: $${avgPrice.toFixed(2)}\nGainers: ${gainers} | Losers: ${losers} | Neutral: ${neutral}\n\`\`\``;
      
      embed.addFields({
        name: '📊 **Market Analytics**',
        value: overviewText,
        inline: false
      });

      // Fetch and display active events
      try {
        const BACKEND_URL = process.env.BACKEND_URL || 'https://api.memexbot.xyz';
        const response = await fetch(`${BACKEND_URL}/api/global-events`);
        
        if (response.ok) {
          const eventData = await response.json();
          let activeEventsText = '';
          let hasActiveEvents = false;

          // Check for active event from the enhanced system
          if (eventData.globalEvents?.activeEvent) {
            const event = eventData.globalEvents.activeEvent;
            const minutesAgo = Math.floor(event.timeAgo / 60000);
            const secondsAgo = Math.floor((event.timeAgo % 60000) / 1000);
            const timeText = minutesAgo > 0 ? `${minutesAgo}m ${secondsAgo}s ago` : `${secondsAgo}s ago`;
            
            // Determine how long the event lasts
            const durationMinutes = Math.floor(event.duration / 60000);
            const remainingTime = event.duration - event.timeAgo;
            const remainingMinutes = Math.max(0, Math.floor(remainingTime / 60000));
            const remainingSeconds = Math.max(0, Math.floor((remainingTime % 60000) / 1000));
            
            if (remainingTime > 0) {
              const rarityEmoji = {
                'common': '🟢',
                'uncommon': '🟡', 
                'rare': '🔴',
                'ultra rare': '🟣',
                'legendary': '🟠'
              }[event.rarity.toLowerCase()] || '🟢';
              
              activeEventsText += `🎭 **${event.name}** ${rarityEmoji}\n`;
              activeEventsText += `⏱️ \`${timeText}\` • \`${remainingMinutes}m ${remainingSeconds}s left\`\n`;
              activeEventsText += `📋 ${event.description}\n\n`;
              hasActiveEvents = true;
            }
          }

          // Check for frozen stocks
          if (eventData.globalEvents?.frozenStocks && eventData.globalEvents.frozenStocks.length > 0) {
            activeEventsText += `🧊 **Frozen:** ${eventData.globalEvents.frozenStocks.join(', ')}\n`;
            hasActiveEvents = true;
          }

          // Check for active mergers
          if (eventData.globalEvents?.activeMerges && eventData.globalEvents.activeMerges.length > 0) {
            const mergeText = eventData.globalEvents.activeMerges.map(merge => 
              `🔄 **${merge.stock1}** ↔️ **${merge.stock2}** \`${merge.timeLeft}s\``
            ).join('\n');
            activeEventsText += mergeText + '\n';
            hasActiveEvents = true;
          }

          // Add weekend effect check
          const now = new Date();
          const isWeekend = now.getDay() === 0 || now.getDay() === 6; // Sunday = 0, Saturday = 6
          if (isWeekend) {
            activeEventsText += `🏖️ **Weekend Mode:** \`Reduced volatility\`\n`;
            hasActiveEvents = true;
          }

          if (hasActiveEvents) {
            embed.addFields({
              name: '🌍 Active Market Events',
              value: activeEventsText.trim(),
              inline: false
            });
          } else {
            embed.addFields({
              name: '� Active Market Events',
              value: '🌙 **Market is calm** • No active events\n📊 Event system monitoring • `/event list` for all events',
              inline: false
            });
          }
        }
      } catch (eventError) {
        // If event fetching fails, silently continue without events display
        console.log('Could not fetch events for market display:', eventError.message);
        embed.addFields({
          name: '🌍 Active Market Events',
          value: '🌙 **Market is calm** • No active events\n📊 Event system monitoring • `/event list` for all events',
          inline: false
        });
      }

      // Create beautiful organized stock display
      let stockDisplays = [];
      
      // Group stocks by price ranges for better organization
      const megaStocks = stockEntries.filter(([, data]) => data.price >= 10000);
      const largeStocks = stockEntries.filter(([, data]) => data.price >= 100 && data.price < 10000);
      const smallStocks = stockEntries.filter(([, data]) => data.price < 100);
      
      // Format function for clean stock display
      const formatStock = (symbol, data, meta) => {
        const change = data.lastChange || 0;
        const changeIcon = change > 0 ? '�' : change < 0 ? '�' : '⚪';
        const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        
        // Price formatting with better readability
        let priceStr;
        if (data.price >= 1000) {
          priceStr = `$${(data.price / 1000).toFixed(1)}K`;
        } else if (data.price >= 1) {
          priceStr = `$${data.price.toFixed(2)}`;
        } else {
          priceStr = `$${data.price.toFixed(3)}`;
        }
        
        return `${changeIcon} **${symbol}** ${priceStr} \`${changeText}\``;
      };

      // Add mega stocks section (>= $10K)
      if (megaStocks.length > 0) {
        const megaDisplay = megaStocks.map(([symbol, data]) => 
          formatStock(symbol, data, meta[symbol] || {})
        ).join('\n');
        
        embed.addFields({
          name: '� Mega Caps ($10K+)',
          value: megaDisplay,
          inline: true
        });
      }

      // Add large stocks section ($100 - $10K)
      if (largeStocks.length > 0) {
        const largeDisplay = largeStocks.map(([symbol, data]) => 
          formatStock(symbol, data, meta[symbol] || {})
        ).join('\n');
        
        embed.addFields({
          name: '🏢 Large Caps ($100-$10K)',
          value: largeDisplay,
          inline: true
        });
      }

      // Add small stocks section (< $100)
      if (smallStocks.length > 0) {
        const smallDisplay = smallStocks.map(([symbol, data]) => 
          formatStock(symbol, data, meta[symbol] || {})
        ).join('\n');
        
        embed.addFields({
          name: '🪙 Small Caps (<$100)',
          value: smallDisplay,
          inline: true
        });
      }

      // Add market summary footer
      const marketSummary = `� **${allMarketStocks} total stocks** • 🔄 **Updates every minute**\n💡 Use \`/stock <symbol>\` for detailed analysis`;
      
      embed.addFields({
        name: '📈 Market Summary',
        value: marketSummary,
        inline: false
      });

      await interaction.editReply({
        embeds: [embed]
      });
      
    } catch (error) {
      console.error('Market command error:', error);
      await interaction.editReply({
        content: '❌ Error loading market data. Please try again.'
      });
    }
  }
};
