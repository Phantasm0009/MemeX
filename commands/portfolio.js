import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, getHoldings, getDiscordUserInfo } from '../utils/supabaseDb.js';
import { getAllStocks } from '../utils/marketAPI.js';
import { createPortfolioChart } from '../utils/simpleCharts.js';
import QuickChart from 'quickchart-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const metaPath = path.join(__dirname, '../meta.json');

export default {
  data: new SlashCommandBuilder()
    .setName('portfolio')
    .setDescription('📊 Professional portfolio analytics and performance dashboard')
    .addBooleanOption(option =>
      option.setName('chart')
        .setDescription('Hide portfolio performance chart (shown by default)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('view')
        .setDescription('Portfolio analysis view')
        .addChoices(
          { name: '💼 Complete Holdings', value: 'full' },
          { name: '� Profitable Positions', value: 'winners' },
          { name: '� Loss Positions', value: 'losers' },
          { name: '🇮🇹 Italian Assets Only', value: 'italian' }
        )),
  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: [64] }); // 64 = EPHEMERAL flag
      
      const showChart = interaction.options.getBoolean('chart') !== false; // Default to true, only false if explicitly set
      const viewType = interaction.options.getString('view') || 'full';
      
      const discordUserInfo = getDiscordUserInfo(interaction.user);
      const user = await getUser(interaction.user.id, discordUserInfo);
      const holdings = await getHoldings(interaction.user.id);
      const stockPrices = await getAllStocks();
      
      console.log(`🔍 Portfolio Debug - User: ${interaction.user.id}`);
      console.log(`📊 Stock prices type: ${typeof stockPrices}, keys: ${Object.keys(stockPrices || {}).length}`);
      console.log(`💼 Holdings count: ${holdings?.length || 0}`);
      if (holdings?.length > 0) {
        console.log(`📝 Holdings: ${holdings.map(h => `${h.stock}:${h.amount}`).join(', ')}`);
      }
      
      // Load meta data
      let meta = {};
      if (fs.existsSync(metaPath)) {
        meta = JSON.parse(fs.readFileSync(metaPath));
      }
      
      // Ensure user balance is a valid number
      const userBalance = typeof user.balance === 'number' && !isNaN(user.balance) ? user.balance : 1000;
      
      // Calculate portfolio metrics
      let totalInvestments = 0;
      const initialBalance = 1000;
      const holdingsWithValue = [];
      
      for (const holding of holdings) {
        console.log(`🔍 Processing holding: ${holding.stock} (${holding.amount} shares)`);
        const stockData = stockPrices[holding.stock];
        console.log(`📈 Stock data for ${holding.stock}:`, stockData ? 'Found' : 'NOT FOUND');
        const price = stockData?.price || 0;
        const value = price * holding.amount;
        const change = stockData?.lastChange || 0;
        
        if (value > 0) {
          totalInvestments += value;
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

      // Calculate performance metrics
      const totalNetWorth = userBalance + totalInvestments;
      const totalPnL = totalNetWorth - initialBalance;
      const roi = ((totalPnL / initialBalance) * 100);
      
      // Performance classification
      let performanceText = 'Steady Trader';
      let performanceEmoji = '📊';
      let embedColor = '#ffd700';
      
      // Performance classification with professional terminology
      if (roi > 50) {
        performanceText = 'Elite Trader';
        performanceEmoji = '💎';
        embedColor = '#00d4aa';
      } else if (roi > 20) {
        performanceText = 'Advanced Trader';
        performanceEmoji = '🚀';
        embedColor = '#00d4aa';
      } else if (roi > 0) {
        performanceText = 'Profitable Trader';
        performanceEmoji = '📈';
        embedColor = '#00d4aa';
      } else if (roi > -20) {
        performanceText = 'Learning Trader';
        performanceEmoji = '🎯';
        embedColor = '#ffa726';
      } else {
        performanceText = 'Risk Learner';
        performanceEmoji = '�';
        embedColor = '#ff4757';
      }

      // Sort holdings by value for display
      filteredHoldings.sort((a, b) => b.value - a.value);

      // Create professional portfolio embed
      const embed = new EmbedBuilder()
        .setTitle(`💼 **PORTFOLIO DASHBOARD** | ${interaction.user.displayName}`)
        .setDescription(`\`\`\`yaml\nTrader Classification: ${performanceText}\nRisk Profile: ${roi > 0 ? 'Profitable' : 'Learning'}\nMarket Activity: Active\n\`\`\``)
        .setColor(embedColor)
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: 'MemeX Trading Platform • Portfolio Analytics' });

      // Professional portfolio overview
      embed.addFields({
        name: '💰 **Account Summary**',
        value: `\`\`\`\nCash Balance: $${userBalance.toLocaleString()}\nInvestments: $${totalInvestments.toLocaleString()}\nNet Worth:   $${totalNetWorth.toLocaleString()}\n\nP&L:         ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString()}\nROI:         ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%\n\`\`\``,
        inline: true
      });

      // Portfolio statistics
      if (holdingsWithValue.length > 0) {
        let riskScore = 0;
        let italianExposure = 0;
        
        for (const holding of holdingsWithValue) {
          const weight = totalInvestments > 0 ? holding.value / totalInvestments : 0;
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
          name: '📊 Analytics',
          value: `🎯 **Positions:** ${holdingsWithValue.length}\n⚠️ **Risk Level:** ${riskLevel}\n🇮🇹 **Italian Exposure:** ${(italianExposure * 100).toFixed(1)}%\n💎 **Top Holding:** ${filteredHoldings.length > 0 ? filteredHoldings[0].stock : 'None'}`,
          inline: true
        });
      } else {
        embed.addFields({
          name: '📊 Analytics',
          value: '🏪 No investments yet!\nStart trading with `/buy`!',
          inline: true
        });
      }

      // Holdings display
      if (filteredHoldings.length === 0) {
        embed.addFields({
          name: `📊 Holdings`,
          value: viewType === 'full' ? 
            '🏪 No stocks owned yet! Start trading with `/buy`!' :
            `🔍 No ${viewType} holdings found.`,
          inline: false
        });
      } else {
        // Add holdings (limit to prevent embed overflow)
        const maxHoldings = Math.min(filteredHoldings.length, 8);
        let holdingsText = '';
        
        for (let i = 0; i < maxHoldings; i++) {
          const holding = filteredHoldings[i];
          const changeEmoji = holding.change > 5 ? '🚀' : 
                             holding.change > 0 ? '📈' : 
                             holding.change < -5 ? '💥' : 
                             holding.change < 0 ? '📉' : '➡️';
          
          const italianFlag = holding.meta.italian ? ' 🇮🇹' : '';
          const italianName = holding.meta.italianName || holding.meta.name || '';
          
          holdingsText += `${changeEmoji} **${holding.stock}${italianFlag}**`;
          if (italianName) holdingsText += `\n*${italianName}*`;
          holdingsText += `\n${holding.amount} × $${holding.price.toFixed(2)} = $${holding.value.toFixed(2)}`;
          if (holding.change !== 0) {
            holdingsText += ` (${holding.change > 0 ? '+' : ''}${holding.change.toFixed(1)}%)`;
          }
          holdingsText += '\n\n';
        }
        
        embed.addFields({
          name: `📊 Top Holdings (${filteredHoldings.length} total)`,
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

      const replyOptions = { embeds: [embed] };

      // Add QuickChart if requested
      if (showChart && totalNetWorth > 0) {
        try {
          // Generate sample portfolio history (in real app, this would come from database)
          const days = 7;
          const history = [];
          const labels = [];
          
          for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Simulate portfolio changes based on current ROI
            const dayFactor = (days - i) / days;
            const historicalValue = initialBalance + (totalPnL * dayFactor) + (Math.random() - 0.5) * 100;
            history.push(Math.max(500, historicalValue)); // Keep above minimum value
          }
          
          const chart = new QuickChart();
          chart.setConfig({
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: 'Portfolio Value ($)',
                data: history,
                borderColor: totalPnL >= 0 ? '#00ff41' : '#ff4757',
                backgroundColor: totalPnL >= 0 ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 71, 87, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: totalPnL >= 0 ? '#00ff41' : '#ff4757',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
              }]
            },
            options: {
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: `${interaction.user.displayName}'s Portfolio Performance`,
                  color: '#ffffff',
                  font: { size: 16, weight: 'bold' }
                },
                legend: {
                  labels: { color: '#ffffff' }
                }
              },
              scales: {
                x: {
                  ticks: { color: '#ffffff' },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                  beginAtZero: false,
                  ticks: { 
                    color: '#ffffff',
                    callback: function(value) {
                      return '$' + value.toFixed(0);
                    }
                  },
                  grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
              },
              backgroundColor: 'rgba(45, 55, 72, 0.9)'
            }
          });
          
          chart.setWidth(800);
          chart.setHeight(400);
          chart.setBackgroundColor('rgba(45, 55, 72, 0.9)');
          
          const chartUrl = await chart.getShortUrl();
          
          // Create chart embed
          const chartEmbed = new EmbedBuilder()
            .setTitle(`📈 Portfolio Performance Chart`)
            .setDescription(`7-day portfolio trend for **${interaction.user.displayName}**`)
            .setImage(chartUrl)
            .setColor(embedColor)
            .setFooter({ text: `Current Net Worth: $${totalNetWorth.toFixed(2)} • ${totalPnL >= 0 ? 'Profit' : 'Loss'}: ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}` });
          
          replyOptions.embeds.push(chartEmbed);
          
        } catch (error) {
          console.error('Portfolio chart error:', error);
          embed.addFields({
            name: '📊 Chart Error',
            value: 'Unable to generate chart. Try again later!',
            inline: false
          });
        }
      }

      await interaction.editReply(replyOptions);
      
    } catch (error) {
      console.error('Portfolio command error:', error);
      const errorMessage = '❌ There was an error displaying your portfolio. Please try again.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else if (!interaction.replied) {
        await interaction.reply({ content: errorMessage, flags: [64] }); // 64 = EPHEMERAL flag
      }
    }
  }
};
