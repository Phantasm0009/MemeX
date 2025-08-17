import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAllStocks, checkBackendHealth } from '../utils/marketAPI.js';
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
    // Defer reply only once at the start
    await interaction.deferReply();
    
    try {
      const viewType = interaction.options.getString('view') || 'overview';
      
      // Check backend status
      const backendHealthy = await checkBackendHealth();
      
      const market = await getAllStocks();
      if (!market || Object.keys(market).length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Market Unavailable')
          .setDescription('Unable to fetch market data. Please try again later.')
          .setColor('#ff4757')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
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
          stockEntries = stockEntries
            .filter(([, data]) => data.lastChange > 0)
            .sort(([, a], [, b]) => b.lastChange - a.lastChange)
            .slice(0, 8);
          break;
        case 'losers':
          stockEntries = stockEntries
            .filter(([, data]) => data.lastChange < 0)
            .sort(([, a], [, b]) => a.lastChange - b.lastChange)
            .slice(0, 8);
          break;
        case 'italian':
          stockEntries = stockEntries.filter(([symbol]) => meta[symbol]?.italian);
          break;
        default:
          stockEntries = stockEntries.sort(([, a], [, b]) => b.price - a.price);
      }

      // Calculate market stats
      const totalStocks = Object.keys(market).length - 1;
      const marketCap = stockEntries.reduce((sum, [, data]) => sum + data.price, 0);
      const avgPrice = marketCap / stockEntries.length;
      const gainers = stockEntries.filter(([, data]) => data.lastChange > 0).length;
      const losers = stockEntries.filter(([, data]) => data.lastChange < 0).length;

      // Create main embed
      const mainEmbed = new EmbedBuilder()
        .setTitle('🇮🇹 Italian Meme Stock Exchange 📈')
        .setDescription(`
          **${market.lastEvent || 'Market is buzzing with Italian brainrot energy! 🍝'}**
          
          ${!backendHealthy ? '⚠️ *Using cached data - backend offline*' : '🟢 *Live data from backend*'}
        `)
        .setColor('#009246') // Italian flag green
        .setTimestamp()
        .setFooter({ 
          text: `🍝 ${stockEntries.length} stocks displayed • Updated every minute • Andiamo!` 
        });

      // Add market summary
      mainEmbed.addFields({
        name: '📊 Market Snapshot',
        value: `
          💰 **Market Cap:** $${marketCap.toFixed(2)}
          📈 **Average Price:** $${avgPrice.toFixed(4)}
          🚀 **Gainers:** ${gainers} | 📉 **Losers:** ${losers} | ➡️ **Neutral:** ${stockEntries.length - gainers - losers}
        `,
        inline: false
      });

      // Create stock display
      const stockChunks = [];
      for (let i = 0; i < stockEntries.length; i += 3) {
        stockChunks.push(stockEntries.slice(i, i + 3));
      }

      for (const chunk of stockChunks.slice(0, 5)) { // Max 5 rows to avoid embed limits
        for (const [symbol, data] of chunk) {
          const stockMeta = meta[symbol] || {};
          const change = data.lastChange || 0;
          
          // Enhanced emoji system
          let emoji = '🔸';
          let trendText = '';
          
          if (change > 15) { emoji = '🚀'; trendText = 'MOON'; }
          else if (change > 10) { emoji = '💎'; trendText = 'PUMP'; }
          else if (change > 5) { emoji = '📈'; trendText = 'UP'; }
          else if (change > 0) { emoji = '⬆️'; trendText = 'RISE'; }
          else if (change < -15) { emoji = '💥'; trendText = 'REKT'; }
          else if (change < -10) { emoji = '🔥'; trendText = 'DUMP'; }
          else if (change < -5) { emoji = '📉'; trendText = 'DOWN'; }
          else if (change < 0) { emoji = '⬇️'; trendText = 'DIP'; }
          else { emoji = '➡️'; trendText = 'FLAT'; }

          // Volatility indicator
          const vol = stockMeta.volatility || 'medium';
          const volEmoji = {
            'low': '🟢',
            'medium': '🟡', 
            'high': '🟠',
            'extreme': '🔴'
          }[vol] || '🟡';

          const italianFlag = stockMeta.italian ? ' 🇮🇹' : '';
          const coreItalian = stockMeta.coreItalian ? ' ⭐' : '';
          
          const fieldName = `${emoji} ${symbol}${italianFlag}${coreItalian}`;
          const fieldValue = `
            **${stockMeta.italianName || symbol}**
            💰 $${data.price.toFixed(4)}
            📊 ${change >= 0 ? '+' : ''}${change.toFixed(2)}% *${trendText}*
            ${volEmoji} ${vol.toUpperCase()} volatility
          `;
          
          mainEmbed.addFields({ 
            name: fieldName, 
            value: fieldValue.trim(), 
            inline: true 
          });
        }
      }

      // Add special section for view types
      if (viewType === 'italian') {
        const italianCount = stockEntries.length;
        mainEmbed.setDescription(`
          **🇮🇹 ITALIAN STOCKS ONLY - Autentico Brainrot! 🍝**
          
          ${market.lastEvent || 'Showing all authentic Italian meme stocks!'}
          
          *Displaying ${italianCount} Italian stocks with special pasta powers*
        `);
      }

      // Add trading tips
      let tip = '💡 Pro tip: ';
      switch (viewType) {
        case 'gainers':
          tip += 'Consider taking profits on strong gainers!';
          break;
        case 'losers':
          tip += 'Look for buying opportunities on quality dips!';
          break;
        case 'italian':
          tip += 'Italian stocks get bonuses during pasta hours (12-2 PM)!';
          break;
        default:
          tip += 'Check individual stocks with `/stock <symbol>` for detailed info!';
      }

      mainEmbed.addFields({
        name: '🎯 Trading Insight',
        value: tip,
        inline: false
      });

      const replyOptions = { embeds: [mainEmbed] };
      await interaction.editReply(replyOptions);
      
    } catch (error) {
      console.error('Market command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Market Error')
        .setDescription('There was an error loading market data. Please try again.')
        .setColor('#ff4757')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
