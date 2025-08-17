import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, getHoldings } from '../utils/supabaseDb.js';
import { getAllStocks } from '../utils/marketAPI.js'; // ✅ Already correct
import { createPortfolioChart } from '../utils/simpleCharts.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const metaPath = path.join(__dirname, '../meta.json');

export default {
  data: new SlashCommandBuilder()
    .setName('portfolio')
    .setDescription('View your Italian meme stock portfolio')
    .addBooleanOption(option =>
      option.setName('chart')
        .setDescription('Show visual portfolio distribution')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('view')
        .setDescription('Portfolio view type')
        .addChoices(
          { name: '💼 Full Portfolio', value: 'full' },
          { name: '🚀 Winners Only', value: 'winners' },
          { name: '📉 Losers Only', value: 'losers' },
          { name: '🇮🇹 Italian Stocks Only', value: 'italian' }
        )),
  async execute(interaction) {
    try {
      const showChart = interaction.options.getBoolean('chart') || false;
      const viewType = interaction.options.getString('view') || 'full';
      
      const user = await getUser(interaction.user.id);
      const holdings = await getHoldings(interaction.user.id);
      const stockPrices = await getAllStocks();
      
      // Load meta data
      let meta = {};
      if (fs.existsSync(metaPath)) {
        meta = JSON.parse(fs.readFileSync(metaPath));
      }
      
      // Ensure user balance is a valid number
      const userBalance = typeof user.balance === 'number' && !isNaN(user.balance) ? user.balance : 1000;
      
      // Calculate portfolio metrics
      let totalValue = userBalance;
      const initialBalance = 1000;
      const holdingsWithValue = [];
      
      for (const holding of holdings) {
        const stockData = stockPrices[holding.stock];
        const price = stockData?.price || 0;
        const value = price * holding.amount;
        const change = stockData?.lastChange || 0;
        
        if (value > 0) {
          totalValue += value;
          holdingsWithValue.push({
            stock: holding.stock,
            amount: holding.amount,
            price: price,
            value: value,
            change: change,
            meta: meta[holding.stock] || {}
          });
        }
      }

      // Filter holdings based on view type
      let filteredHoldings = holdingsWithValue;
      switch (viewType) {
        case 'winners':
          filteredHoldings = holdingsWithValue.filter(h => h.change > 0);
          break;
        case 'losers':
          filteredHoldings = holdingsWithValue.filter(h => h.change < 0);
          break;
        case 'italian':
          filteredHoldings = holdingsWithValue.filter(h => h.meta.italian);
          break;
      }

      // Calculate performance metrics (with null safety)
      const totalProfit = totalValue - initialBalance;
      const profitPercentage = ((totalProfit / initialBalance) * 100);
      const portfolioValue = Math.max(0, totalValue - userBalance);
      
      // Performance classification
      let performanceEmoji = '📊';
      let performanceText = 'Steady Trader';
      let performanceColor = '#ffd700';
      
      if (profitPercentage > 50) {
        performanceEmoji = '💎';
        performanceText = 'Diamond Hands';
        performanceColor = '#00ff41';
      } else if (profitPercentage > 20) {
        performanceEmoji = '🚀';
        performanceText = 'Moon Trader';
        performanceColor = '#00ff41';
      } else if (profitPercentage > 0) {
        performanceEmoji = '📈';
        performanceText = 'Profit Maker';
        performanceColor = '#90EE90';
      } else if (profitPercentage > -20) {
        performanceEmoji = '🎯';
        performanceText = 'Learning Trader';
        performanceColor = '#ffff00';
      } else {
        performanceEmoji = '📉';
        performanceText = 'Paper Hands';
        performanceColor = '#ff4757';
      }

      // Create main embed
      const embed = new EmbedBuilder()
        .setTitle(`${performanceEmoji} ${interaction.user.displayName}'s Portfolio`)
        .setDescription(`
          **${performanceText}** • *Mamma mia, what a trader!* 🇮🇹
          
          ${viewType === 'italian' ? '🍝 *Showing only Italian stocks with pasta power*' : ''}
          ${viewType === 'winners' ? '🚀 *Showing only winning positions*' : ''}
          ${viewType === 'losers' ? '📉 *Showing only losing positions (buy the dip!)*' : ''}
        `)
        .setColor(performanceColor)
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange • Invest in brainrot!' });

      // Portfolio overview (with safe number handling)
      embed.addFields({
        name: '💰 Portfolio Overview',
        value: `
          💵 **Cash Balance:** $${userBalance.toFixed(2)}
          📊 **Investments:** $${portfolioValue.toFixed(2)}
          💎 **Total Net Worth:** $${totalValue.toFixed(2)}
          
          📈 **Total P&L:** ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}
          📊 **ROI:** ${profitPercentage >= 0 ? '+' : ''}${profitPercentage.toFixed(1)}%
        `,
        inline: false
      });

      if (filteredHoldings.length === 0) {
        embed.addFields({
          name: '📊 Holdings',
          value: viewType === 'full' ? 
            '🏪 No stocks owned yet! Start trading with `/buy`!' :
            `🔍 No ${viewType} holdings found. Try changing the view type!`,
          inline: false
        });
      } else {
        // Sort holdings by value
        filteredHoldings.sort((a, b) => b.value - a.value);
        
        // Add holdings (chunked to avoid embed limits)
        const maxHoldings = Math.min(filteredHoldings.length, 12);
        let holdingsText = '';
        
        for (let i = 0; i < maxHoldings; i++) {
          const holding = filteredHoldings[i];
          const changeEmoji = holding.change > 5 ? '🚀' : 
                             holding.change > 0 ? '📈' : 
                             holding.change < -5 ? '💥' : 
                             holding.change < 0 ? '📉' : '➡️';
          
          const italianFlag = holding.meta.italian ? ' 🇮🇹' : '';
          const coreItalian = holding.meta.coreItalian ? ' ⭐' : '';
          
          holdingsText += `
            ${changeEmoji} **${holding.stock}${italianFlag}${coreItalian}**
            ${holding.meta.italianName ? `*${holding.meta.italianName}*` : ''}
            ${holding.amount} shares @ $${holding.price.toFixed(4)} = $${holding.value.toFixed(2)}
            ${holding.change !== 0 ? `(${holding.change > 0 ? '+' : ''}${holding.change.toFixed(1)}% today)` : ''}
          `;
        }
        
        embed.addFields({
          name: `📊 Holdings (${filteredHoldings.length} positions)`,
          value: holdingsText.trim() || 'No holdings found',
          inline: false
        });
        
        if (filteredHoldings.length > maxHoldings) {
          embed.addFields({
            name: '📋 Note',
            value: `Showing top ${maxHoldings} of ${filteredHoldings.length} holdings`,
            inline: false
          });
        }
      }

      // Portfolio analytics
      if (holdingsWithValue.length > 0) {
        // Risk analysis
        let riskScore = 0;
        let italianExposure = 0;
        
        for (const holding of holdingsWithValue) {
          const weight = portfolioValue > 0 ? holding.value / portfolioValue : 0;
          const volatilityScore = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'extreme': 4
          }[holding.meta.volatility] || 2;
          
          riskScore += weight * volatilityScore;
          if (holding.meta.italian) italianExposure += weight;
        }
        
        const riskLevel = riskScore < 1.5 ? 'Low 🟢' : 
                         riskScore < 2.5 ? 'Medium 🟡' : 
                         riskScore < 3.5 ? 'High 🟠' : 'Extreme 🔴';
        
        embed.addFields({
          name: '📊 Portfolio Analytics',
          value: `
            🎯 **Diversification:** ${holdingsWithValue.length} stocks
            ⚠️ **Risk Level:** ${riskLevel}
            🇮🇹 **Italian Exposure:** ${(italianExposure * 100).toFixed(1)}%
            💎 **Largest Position:** ${holdingsWithValue.length > 0 ? holdingsWithValue[0].stock : 'None'}
          `,
          inline: true
        });
      }

      // Add chart if requested
      if (showChart && holdingsWithValue.length > 0) {
        try {
          const chartResult = createPortfolioChart(holdingsWithValue, stockPrices);
          
          embed.addFields({
            name: '📊 Portfolio Distribution',
            value: chartResult.chart,
            inline: false
          });
        } catch (error) {
          console.error('Portfolio chart error:', error);
          embed.addFields({
            name: '📊 Chart Error',
            value: 'Unable to generate chart. Try again later!',
            inline: false
          });
        }
      }

      const replyOptions = { embeds: [embed], ephemeral: true };
      await (interaction.deferred ? interaction.editReply(replyOptions) : interaction.reply(replyOptions));
      
    } catch (error) {
      console.error('Portfolio command error:', error);
      const errorMessage = {
        content: '❌ There was an error displaying your portfolio. Please try again.',
        ephemeral: true
      };
      
      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else if (!interaction.replied) {
        await interaction.reply(errorMessage);
      }
    }
  }
};
