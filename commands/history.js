import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getTransactions, getPriceHistory } from '../utils/supabaseDb.js';
import { createPriceChart } from '../utils/simpleCharts.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const metaPath = path.join(__dirname, '../meta.json');

export default {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View transaction history or price chart')
    .addSubcommand(subcommand =>
      subcommand
        .setName('transactions')
        .setDescription('View your recent transaction history')
        .addIntegerOption(option =>
          option.setName('limit')
            .setDescription('Number of transactions to show (1-50)')
            .setMinValue(1)
            .setMaxValue(50)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('chart')
        .setDescription('View price chart for a stock')
        .addStringOption(option =>
          option.setName('stock')
            .setDescription('Stock symbol (e.g., SKIBI, RIZZL)')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Number of days to show (1-30)')
            .setMinValue(1)
            .setMaxValue(30)
            .setRequired(false))),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'transactions') {
      try {
        const limit = interaction.options.getInteger('limit') || 15;
        const transactions = await getTransactions(interaction.user.id, limit);
        
        if (transactions.length === 0) {
          const embed = new EmbedBuilder()
            .setTitle('📊 Transaction History')
            .setDescription('You have no transaction history yet.\n\nStart trading with `/buy` and `/sell` commands! 🍝')
            .setColor('#4287f5')
            .setTimestamp();
          
          return interaction.editReply({ embeds: [embed] });
        }

        const embed = new EmbedBuilder()
          .setTitle(`📊 Transaction History for ${interaction.user.displayName}`)
          .setDescription(`*Your trading journey in the Italian Meme Stock Exchange* 🇮🇹`)
          .setColor('#4287f5')
          .setTimestamp()
          .setThumbnail(interaction.user.displayAvatarURL());

        let description = '';
        
        for (const tx of transactions) {
          const type = tx.amount > 0 ? 'BUY' : 'SELL';
          const emoji = tx.amount > 0 ? '📈' : '📉';
          const amount = Math.abs(tx.amount);
          const total = (amount * tx.price).toFixed(2);
          const date = new Date(tx.timestamp).toLocaleDateString();
          const time = new Date(tx.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          description += `${emoji} **${type}** ${amount} ${tx.stock} @ $${tx.price.toFixed(4)} = $${total}\n`;
          description += `   📅 ${date} at ${time}\n\n`;
        }

        embed.addFields({
          name: '📋 Recent Transactions',
          value: description || 'No transactions found',
          inline: false
        });
        
        if (transactions.length >= limit) {
          embed.setFooter({ text: `Showing last ${limit} transactions • Use limit option for more` });
        } else {
          embed.setFooter({ text: `Showing all ${transactions.length} transactions` });
        }

        // Calculate total profit/loss from transactions
        let totalSpent = 0;
        let totalReceived = 0;
        
        for (const tx of transactions) {
          if (tx.amount > 0) { // Buy transaction
            totalSpent += tx.amount * tx.price;
          } else { // Sell transaction
            totalReceived += Math.abs(tx.amount) * tx.price;
          }
        }
        
        const netCashFlow = totalReceived - totalSpent;

        embed.addFields({
          name: '💰 Trading Summary',
          value: `
            🛒 **Total Spent:** $${totalSpent.toFixed(2)}
            💸 **Total Received:** $${totalReceived.toFixed(2)}
            📊 **Net Cash Flow:** ${netCashFlow >= 0 ? '+' : ''}$${netCashFlow.toFixed(2)}
            📈 **Transactions:** ${transactions.length}
          `,
          inline: true
        });

        await interaction.editReply({ embeds: [embed] });
        
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
          const embed = new EmbedBuilder()
            .setTitle(`📈 ${stockSymbol} Price Chart`)
            .setDescription(`Not enough price data for ${stockSymbol}.\n\nThis stock needs more trading history to generate a meaningful chart.`)
            .setColor('#ff6b6b')
            .setTimestamp();
          
          return interaction.editReply({ embeds: [embed] });
        }

        // Filter by days if specified
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const filteredHistory = priceHistory.filter(entry => entry.timestamp >= cutoffTime);
        
        if (filteredHistory.length < 2) {
          const embed = new EmbedBuilder()
            .setTitle(`📈 ${stockSymbol} Price Chart`)
            .setDescription(`Not enough recent data for ${stockSymbol} in the last ${days} days.\n\nTry a longer time period or wait for more price updates.`)
            .setColor('#ff6b6b')
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
          .setTitle(`📈 ${stockSymbol} ${italianName ? `(${italianName})` : ''} - Price Chart`)
          .setDescription(`
            **Current Price:** $${chartResult.currentPrice.toFixed(4)}
            **Price Change:** ${isPositive ? '+' : ''}${chartResult.priceChange}%
            **Time Period:** Last ${days} days
            **Data Points:** ${chartResult.dataPoints}
            **Trend:** ${isPositive ? '📈 Bullish' : '📉 Bearish'}
            
            ${chartResult.chart}
          `)
          .setColor(isPositive ? '#00ff41' : '#ff4757')
          .setTimestamp()
          .setFooter({ 
            text: '🇮🇹 Italian Meme Stock Exchange • Prices update based on real trends' 
          });

        // Add stock info if available
        if (stockMeta.description) {
          embed.addFields({
            name: '🇮🇹 Stock Personality',
            value: stockMeta.description,
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
  }
};
