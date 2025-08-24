import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getTransactions, getPriceHistory } from '../utils/supabaseDb.js';
import { createPriceChart } from '../utils/simpleCharts.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const metaPath = path.join(__dirname, '../meta.json');

// Helper function to create navigation buttons
function createNavigationButtons(userId, currentPage, totalPages, limit) {
  if (totalPages <= 1) return null;
  
  const row = new ActionRowBuilder();
  
  // For 5 or fewer pages, show simplified navigation
  if (totalPages <= 5) {
    // Previous page button
    if (currentPage > 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`history_prev_${userId}_${currentPage - 1}_${limit}`)
          .setLabel('⬅️ Previous')
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    // Page indicator (disabled button showing current page)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`history_page_${userId}_${currentPage}`)
        .setLabel(`Page ${currentPage}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    
    // Next page button
    if (currentPage < totalPages) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`history_next_${userId}_${currentPage + 1}_${limit}`)
          .setLabel('Next ➡️')
          .setStyle(ButtonStyle.Primary)
      );
    }
  } else {
    // For more than 5 pages, show full navigation
    
    // First page button
    if (currentPage > 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`history_first_${userId}_${limit}`)
          .setLabel('⏮️ First')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 1)
      );
    }
    
    // Previous page button
    if (currentPage > 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`history_prev_${userId}_${currentPage - 1}_${limit}`)
          .setLabel('⬅️ Prev')
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    // Page indicator (disabled button showing current page)
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`history_page_${userId}_${currentPage}`)
        .setLabel(`${currentPage}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    
    // Next page button
    if (currentPage < totalPages) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`history_next_${userId}_${currentPage + 1}_${limit}`)
          .setLabel('Next ➡️')
          .setStyle(ButtonStyle.Primary)
      );
    }
    
    // Last page button
    if (currentPage < totalPages) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`history_last_${userId}_${totalPages}_${limit}`)
          .setLabel('Last ⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages)
      );
    }
  }
  
  return row;
}

export default {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('📊 Professional trading history and market analytics')
    .addSubcommand(subcommand =>
      subcommand
        .setName('transactions')
        .setDescription('📈 View detailed transaction history and performance')
        .addIntegerOption(option =>
          option.setName('page')
            .setDescription('Page number to view (default: 1)')
            .setMinValue(1)
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('limit')
            .setDescription('Transactions per page (5-20, default: 10)')
            .setMinValue(5)
            .setMaxValue(20)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('chart')
        .setDescription('📊 Generate technical analysis charts')
        .addStringOption(option =>
          option.setName('stock')
            .setDescription('Asset symbol for chart analysis (e.g., SKIBI, RIZZL)')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Analysis timeframe in days (1-30)')
            .setMinValue(1)
            .setMaxValue(30)
            .setRequired(false))),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'transactions') {
      try {
        const page = interaction.options.getInteger('page') || 1;
        const limit = interaction.options.getInteger('limit') || 10;
        const offset = (page - 1) * limit;
        
        // Get total count first to calculate pagination
        const allTransactions = await getTransactions(interaction.user.id, 1000); // Get a large number to count total
        const totalTransactions = allTransactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);
        
        if (totalTransactions === 0) {
          const embed = new EmbedBuilder()
            .setTitle('📊 **TRANSACTION HISTORY**')
            .setDescription('```yaml\nAccount Status: ACTIVE\nTransaction Count: 0\nTrading History: EMPTY\n```')
            .addFields({
              name: '💡 **Getting Started**',
              value: 'Execute your first trade to build transaction history.\nUse `/buy` or `/sell` to start trading premium assets.',
              inline: false
            })
            .setColor('#ffa726')
            .setFooter({ text: 'MemeX Trading Platform • Transaction Analytics' })
            .setTimestamp();
          
          return interaction.editReply({ embeds: [embed] });
        }

        // Validate page number
        if (page > totalPages) {
          const embed = new EmbedBuilder()
            .setTitle('📊 **TRANSACTION HISTORY**')
            .setDescription('```yaml\nError: PAGE_OUT_OF_RANGE\nRequested: Page ' + page + '\nAvailable: 1-' + totalPages + '\n```')
            .addFields({
              name: '💡 **Navigation Help**',
              value: `Total transactions: ${totalTransactions}\nAvailable pages: 1-${totalPages}\nUse \`/history transactions page:1\` to start from the beginning.`,
              inline: false
            })
            .setColor('#ff4757')
            .setFooter({ text: 'MemeX Trading Platform • Page Navigation' })
            .setTimestamp();
          
          return interaction.editReply({ embeds: [embed] });
        }

        // Get transactions for specific page
        const transactions = allTransactions.slice(offset, offset + limit);

        const embed = new EmbedBuilder()
          .setTitle('📊 **TRANSACTION HISTORY**')
          .setDescription('```yaml\nAccount: ' + interaction.user.displayName + '\nPage: ' + page + '/' + totalPages + '\nShowing: ' + transactions.length + ' of ' + totalTransactions + ' total\n```')
          .setColor('#00d4aa')
          .setFooter({ text: 'MemeX Trading Platform • Trading Analytics • Page ' + page + '/' + totalPages })
          .setTimestamp();

        let transactionText = '';
        
        for (const tx of transactions) {
          const type = tx.amount > 0 ? 'BUY' : 'SELL';
          const emoji = tx.amount > 0 ? '�' : '�';
          const amount = Math.abs(tx.amount);
          const total = (amount * tx.price).toFixed(2);
          const date = new Date(tx.timestamp).toLocaleDateString();
          const time = new Date(tx.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          transactionText += `${emoji} **${type}** ${amount.toLocaleString()} ${tx.stock} @ $${tx.price.toFixed(4)} = $${total}\n`;
          transactionText += `\`\`\`${date} • ${time}\`\`\`\n`;
        }

        embed.addFields({
          name: '📋 **Trade Execution Log**',
          value: transactionText || 'No transactions found',
          inline: false
        });

        // Calculate performance stats for current page
        let pageSpent = 0;
        let pageReceived = 0;
        
        for (const tx of transactions) {
          if (tx.amount > 0) { // Buy transaction
            pageSpent += tx.amount * tx.price;
          } else { // Sell transaction
            pageReceived += Math.abs(tx.amount) * tx.price;
          }
        }
        
        const pageNetCashFlow = pageReceived - pageSpent;

        // Calculate total portfolio performance
        let totalSpent = 0;
        let totalReceived = 0;
        
        for (const tx of allTransactions) {
          if (tx.amount > 0) { // Buy transaction
            totalSpent += tx.amount * tx.price;
          } else { // Sell transaction
            totalReceived += Math.abs(tx.amount) * tx.price;
          }
        }
        
        const totalNetCashFlow = totalReceived - totalSpent;

        embed.addFields({
          name: '💰 **Performance Analytics**',
          value: `\`\`\`yaml\nPage Summary:\n  Invested: $${pageSpent.toLocaleString()}\n  Realized: $${pageReceived.toLocaleString()}\n  Net Flow: ${pageNetCashFlow >= 0 ? '+' : ''}$${pageNetCashFlow.toLocaleString()}\n\nTotal Portfolio:\n  Total Invested: $${totalSpent.toLocaleString()}\n  Total Realized: $${totalReceived.toLocaleString()}\n  Overall P&L: ${totalNetCashFlow >= 0 ? '+' : ''}$${totalNetCashFlow.toLocaleString()}\n\`\`\``,
          inline: false
        });

        // Create navigation buttons
        const navigationButtons = createNavigationButtons(interaction.user.id, page, totalPages, limit);
        
        const replyOptions = { embeds: [embed] };
        if (navigationButtons) {
          replyOptions.components = [navigationButtons];
        }

        await interaction.editReply(replyOptions);
        
      } catch (error) {
        console.error('Transaction history error:', error);
        await interaction.editReply({
          content: '❌ Failed to retrieve transaction history. Please try again later.'
        });
      }
      
    } else if (subcommand === 'chart') {
      const stockSymbol = interaction.options.getString('stock').toUpperCase();
      const days = interaction.options.getInteger('days') || 7;
      
      try {
        // Get price history
        const priceHistory = await getPriceHistory(stockSymbol, 100);
        
        if (priceHistory.length < 2) {
          // Create some emergency fallback data if no history exists
          const market = await import('../utils/marketAPI.js');
          const allStocks = await market.getAllStocks();
          
          if (!allStocks[stockSymbol]) {
            const embed = new EmbedBuilder()
              .setTitle(`📈 ${stockSymbol} Price Chart`)
              .setDescription(`Stock "${stockSymbol}" does not exist.\n\nUse \`/market\` to see available stocks.`)
              .setColor('#ff6b6b')
              .setTimestamp();
            
            return interaction.editReply({ embeds: [embed] });
          }
          
          // Generate minimal emergency data for new stocks
          const currentPrice = allStocks[stockSymbol].price;
          const now = Date.now();
          const emergencyHistory = [];
          
          for (let i = 10; i >= 0; i--) {
            const timestamp = now - (i * 2 * 60 * 60 * 1000); // Every 2 hours
            const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
            const price = currentPrice * (0.95 + (Math.random() * 0.1) + variation); // 95-105% range with variation
            
            emergencyHistory.push({
              stock: stockSymbol,
              price: Math.max(0.01, price),
              timestamp: timestamp,
              trendScore: 0
            });
          }
          
          const embed = new EmbedBuilder()
            .setTitle(`📈 ${stockSymbol} Price Chart`)
            .setDescription(`⚠️ Limited historical data available for ${stockSymbol}.\n\nThis chart shows estimated recent price movements. More data will be available as trading continues.`)
            .setColor('#ffa502')
            .setTimestamp();
          
          // Use emergency data for chart generation
          const chartResult = createPriceChart(stockSymbol, emergencyHistory, '');
          const priceChange = parseFloat(chartResult.priceChange);
          const isPositive = priceChange >= 0;
          
          embed.addFields({
            name: '📊 Estimated Price Movement',
            value: `
              **Current Price:** $${chartResult.currentPrice.toFixed(4)}
              **Estimated Change:** ${isPositive ? '+' : ''}${chartResult.priceChange}%
              **Data Points:** ${chartResult.dataPoints} (estimated)
              **Trend:** ${isPositive ? '📈 Bullish' : '📉 Bearish'}
              
              ${chartResult.chart}
            `,
            inline: false
          });
          
          embed.setFooter({ 
            text: '⚠️ Chart based on estimated data • Start trading to build real price history!' 
          });
          
          return interaction.editReply({ embeds: [embed] });
        }

        // Filter by days if specified
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const filteredHistory = priceHistory.filter(entry => entry.timestamp >= cutoffTime);
        
        if (filteredHistory.length < 2) {
          const embed = new EmbedBuilder()
            .setTitle('� **TECHNICAL ANALYSIS**')
            .setDescription('```yaml\nAsset: ' + stockSymbol + '\nTimeframe: ' + days + ' days\nData Points: INSUFFICIENT\n```')
            .addFields({
              name: '⚠️ **Data Limitation**',
              value: 'Insufficient historical data for technical analysis.\nIncrease timeframe or wait for more market updates.',
              inline: false
            })
            .setColor('#ffa726')
            .setFooter({ text: 'MemeX Trading Platform • Technical Analysis' })
            .setTimestamp();
          
          return interaction.editReply({ embeds: [embed] });
        }

        // Load meta data for Italian name
        let meta = {};
        if (fs.existsSync(metaPath)) {
          meta = JSON.parse(fs.readFileSync(metaPath));
        }
        
        const stockMeta = meta[stockSymbol] || {};
        const italianName = stockMeta.italianName || '';
        
        // Generate ASCII chart using simple charts
        const chartResult = createPriceChart(stockSymbol, filteredHistory, italianName);
        
        const priceChange = parseFloat(chartResult.priceChange);
        const isPositive = priceChange >= 0;
        
        const embed = new EmbedBuilder()
          .setTitle('📊 **TECHNICAL ANALYSIS**')
          .setDescription('```yaml\nAsset: ' + stockSymbol + (italianName ? ` (${italianName})` : '') + '\nTimeframe: ' + days + ' days\nSignal: ' + (isPositive ? 'BULLISH' : 'BEARISH') + '\n```')
          .setColor(isPositive ? '#00d4aa' : '#ff4757')
          .setFooter({ text: 'MemeX Trading Platform • Technical Analysis Engine' })
          .setTimestamp();

        embed.addFields([
          {
            name: '📈 **Price Action**',
            value: `\`\`\`\nCurrent: $${chartResult.currentPrice.toFixed(4)}\nChange: ${isPositive ? '+' : ''}${chartResult.priceChange}%\nTrend: ${isPositive ? 'BULLISH' : 'BEARISH'}\nData: ${chartResult.dataPoints} points\`\`\``,
            inline: false
          },
          {
            name: '📊 **Technical Chart**',
            value: '```\n' + chartResult.chart + '\n```',
            inline: false
          }
        ]);

        // Add stock info if available
        if (stockMeta.description) {
          embed.addFields({
            name: '� **Asset Profile**',
            value: `\`\`\`\nCharacteristics: ${stockMeta.description}\nVolatility: ${stockMeta.volatility || 'Medium'}\nMarket: Italian Meme Exchange\`\`\``,
            inline: false
          });
        }

        // Add volatility info
        if (stockMeta.volatility) {
          const volEmoji = {
            'low': '🟢',
            'medium': '🟡',
            'high': '🟠',
            'extreme': '🔴'
          }[stockMeta.volatility] || '🟡';
          
          embed.addFields({
            name: '📊 Volatility',
            value: `${volEmoji} **${stockMeta.volatility.toUpperCase()}** - Expect ${stockMeta.volatility} price movements`,
            inline: true
          });
        }

        await interaction.editReply({ embeds: [embed] });
        
      } catch (error) {
        console.error('Chart generation error:', error);
        
        const embed = new EmbedBuilder()
          .setTitle('❌ Chart Generation Failed')
          .setDescription(`Failed to generate chart for ${stockSymbol}. Please try again later.`)
          .setColor('#ff4757')
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
      }
    }
  },
  
  // Handle button interactions for pagination
  async handleButtonInteraction(interaction) {
    if (!interaction.customId.startsWith('history_')) return false;
    
    await interaction.deferUpdate();
    
    const [, action, userId, pageOrLimit, limitOrUndefined] = interaction.customId.split('_');
    
    // Verify the user can interact with this pagination
    if (userId !== interaction.user.id) {
      await interaction.followUp({ 
        content: '❌ You can only navigate your own transaction history.', 
        ephemeral: true 
      });
      return true;
    }
    
    let page, limit;
    
    if (action === 'first') {
      page = 1;
      limit = parseInt(pageOrLimit);
    } else if (action === 'last') {
      page = parseInt(pageOrLimit);
      limit = parseInt(limitOrUndefined);
    } else if (action === 'prev' || action === 'next') {
      page = parseInt(pageOrLimit);
      limit = parseInt(limitOrUndefined);
    } else if (action === 'page') {
      // This is just the indicator button, ignore
      return true;
    }
    
    try {
      const offset = (page - 1) * limit;
      
      // Get total count first to calculate pagination
      const allTransactions = await getTransactions(interaction.user.id, 1000);
      const totalTransactions = allTransactions.length;
      const totalPages = Math.ceil(totalTransactions / limit);
      
      if (totalTransactions === 0) {
        await interaction.editReply({
          content: '❌ No transactions found.',
          embeds: [],
          components: []
        });
        return true;
      }
      
      // Validate page number
      if (page < 1 || page > totalPages) {
        await interaction.followUp({ 
          content: `❌ Invalid page number. Available pages: 1-${totalPages}`, 
          ephemeral: true 
        });
        return true;
      }
      
      // Get transactions for specific page
      const transactions = allTransactions.slice(offset, offset + limit);
      
      const embed = new EmbedBuilder()
        .setTitle('📊 **TRANSACTION HISTORY**')
        .setDescription('```yaml\nAccount: ' + interaction.user.displayName + '\nPage: ' + page + '/' + totalPages + '\nShowing: ' + transactions.length + ' of ' + totalTransactions + ' total\n```')
        .setColor('#00d4aa')
        .setFooter({ text: 'MemeX Trading Platform • Trading Analytics • Page ' + page + '/' + totalPages })
        .setTimestamp();
      
      let transactionText = '';
      
      for (const tx of transactions) {
        const type = tx.amount > 0 ? 'BUY' : 'SELL';
        const emoji = tx.amount > 0 ? '🟢' : '🔴';
        const amount = Math.abs(tx.amount);
        const total = (amount * tx.price).toFixed(2);
        const date = new Date(tx.timestamp).toLocaleDateString();
        const time = new Date(tx.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        transactionText += `${emoji} **${type}** ${amount.toLocaleString()} ${tx.stock} @ $${tx.price.toFixed(4)} = $${total}\n`;
        transactionText += `\`\`\`${date} • ${time}\`\`\`\n`;
      }
      
      embed.addFields({
        name: '📋 **Trade Execution Log**',
        value: transactionText || 'No transactions found',
        inline: false
      });
      
      // Calculate performance stats for current page
      let pageSpent = 0;
      let pageReceived = 0;
      
      for (const tx of transactions) {
        if (tx.amount > 0) { // Buy transaction
          pageSpent += tx.amount * tx.price;
        } else { // Sell transaction
          pageReceived += Math.abs(tx.amount) * tx.price;
        }
      }
      
      const pageNetCashFlow = pageReceived - pageSpent;
      
      // Calculate total portfolio performance
      let totalSpent = 0;
      let totalReceived = 0;
      
      for (const tx of allTransactions) {
        if (tx.amount > 0) { // Buy transaction
          totalSpent += tx.amount * tx.price;
        } else { // Sell transaction
          totalReceived += Math.abs(tx.amount) * tx.price;
        }
      }
      
      const totalNetCashFlow = totalReceived - totalSpent;
      
      embed.addFields({
        name: '💰 **Performance Analytics**',
        value: `\`\`\`yaml\nPage Summary:\n  Invested: $${pageSpent.toLocaleString()}\n  Realized: $${pageReceived.toLocaleString()}\n  Net Flow: ${pageNetCashFlow >= 0 ? '+' : ''}$${pageNetCashFlow.toLocaleString()}\n\nTotal Portfolio:\n  Total Invested: $${totalSpent.toLocaleString()}\n  Total Realized: $${totalReceived.toLocaleString()}\n  Overall P&L: ${totalNetCashFlow >= 0 ? '+' : ''}$${totalNetCashFlow.toLocaleString()}\n\`\`\``,
        inline: false
      });
      
      // Create updated navigation buttons
      const navigationButtons = createNavigationButtons(interaction.user.id, page, totalPages, limit);
      
      const replyOptions = { embeds: [embed] };
      if (navigationButtons) {
        replyOptions.components = [navigationButtons];
      }
      
      await interaction.editReply(replyOptions);
      
    } catch (error) {
      console.error('Button interaction error:', error);
      await interaction.followUp({
        content: '❌ Failed to load transaction page. Please try again later.',
        ephemeral: true
      });
    }
    
    return true;
  }
};
