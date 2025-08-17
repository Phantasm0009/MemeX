import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAllUsers, getHoldings } from '../utils/supabaseDb.js';
import { getAllStocks } from '../utils/marketAPI.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top traders in the Italian Meme Stock Exchange')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of top traders to show (1-20)')
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const limit = interaction.options.getInteger('limit') || 10;
      const users = await getAllUsers();
      const market = await getAllStocks();
      
      if (users.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('👑 Italian Meme Stock Leaderboard')
          .setDescription('No traders yet! Start trading to claim the throne! 🍝')
          .setColor('#ffd700')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
      }

      // Calculate net worth for each user (balance + portfolio value)
      const userNetWorths = [];
      
      for (const user of users) {
        try {
          const holdings = await getHoldings(user.id);
          let portfolioValue = 0;
          
          for (const holding of holdings) {
            const stockPrice = market[holding.stock]?.price || 0;
            portfolioValue += stockPrice * holding.amount;
          }
          
          const netWorth = user.balance + portfolioValue;
          const profit = netWorth - 1000; // Starting balance
          const profitPercentage = ((profit / 1000) * 100);
          
          userNetWorths.push({
            userId: user.id,
            balance: user.balance,
            portfolioValue,
            netWorth,
            profit,
            profitPercentage,
            stockCount: holdings.length
          });
        } catch (error) {
          console.error(`Error calculating net worth for user ${user.id}:`, error);
          // Add user with just balance if portfolio calculation fails
          userNetWorths.push({
            userId: user.id,
            balance: user.balance,
            portfolioValue: 0,
            netWorth: user.balance,
            profit: user.balance - 1000,
            profitPercentage: ((user.balance - 1000) / 1000) * 100,
            stockCount: 0
          });
        }
      }
      
      // Sort by net worth descending
      userNetWorths.sort((a, b) => b.netWorth - a.netWorth);
      
      // Take top users
      const topUsers = userNetWorths.slice(0, limit);
      
      const embed = new EmbedBuilder()
        .setTitle('👑 Italian Meme Stock Exchange Leaderboard')
        .setDescription('*Chi è il più ricco? Who\'s the richest trader?* 🇮🇹💰')
        .setColor('#ffd700')
        .setTimestamp()
        .setFooter({ text: `Showing top ${topUsers.length} traders • 🍝 Mamma mia!` });

      // Add leaderboard entries
      let leaderboardText = '';
      
      for (let i = 0; i < topUsers.length; i++) {
        const userData = topUsers[i];
        const rank = i + 1;
        
        // Rank emojis
        let rankEmoji = '';
        if (rank === 1) rankEmoji = '🥇';
        else if (rank === 2) rankEmoji = '🥈';
        else if (rank === 3) rankEmoji = '🥉';
        else rankEmoji = `${rank}.`;
        
        // Performance indicators
        let performanceEmoji = '';
        if (userData.profitPercentage > 50) performanceEmoji = '💎';
        else if (userData.profitPercentage > 20) performanceEmoji = '🚀';
        else if (userData.profitPercentage > 0) performanceEmoji = '📈';
        else if (userData.profitPercentage > -20) performanceEmoji = '🎯';
        else performanceEmoji = '📉';
        
        leaderboardText += `${rankEmoji} ${performanceEmoji} <@${userData.userId}>\n`;
        leaderboardText += `💎 **Net Worth:** $${userData.netWorth.toFixed(2)}\n`;
        leaderboardText += `💵 Cash: $${userData.balance.toFixed(2)} | 📊 Portfolio: $${userData.portfolioValue.toFixed(2)}\n`;
        leaderboardText += `📈 P&L: ${userData.profit >= 0 ? '+' : ''}$${userData.profit.toFixed(2)} (${userData.profitPercentage >= 0 ? '+' : ''}${userData.profitPercentage.toFixed(1)}%)\n`;
        leaderboardText += `🎯 Stocks: ${userData.stockCount}\n\n`;
      }

      embed.addFields({
        name: '🏆 Top Traders',
        value: leaderboardText || 'No data available',
        inline: false
      });

      // Add market stats
      const totalMarketCap = Object.values(market)
        .filter(data => typeof data === 'object' && data.price)
        .reduce((sum, data) => sum + data.price, 0);
      
      const totalNetWorth = userNetWorths.reduce((sum, user) => sum + user.netWorth, 0);
      
      embed.addFields({
        name: '📊 Market Statistics',
        value: `
          💰 **Total Market Cap:** $${totalMarketCap.toFixed(2)}
          👥 **Total Traders:** ${users.length}
          💎 **Combined Net Worth:** $${totalNetWorth.toFixed(2)}
          📈 **Average Net Worth:** $${(totalNetWorth / users.length).toFixed(2)}
        `,
        inline: false
      });

      // Fun facts
      const richestUser = topUsers[0];
      const poorestUser = userNetWorths[userNetWorths.length - 1];
      const avgProfit = userNetWorths.reduce((sum, user) => sum + user.profitPercentage, 0) / userNetWorths.length;
      
      embed.addFields({
        name: '🎯 Trading Insights',
        value: `
          🥇 **Richest Trader:** $${richestUser.netWorth.toFixed(2)} net worth
          📉 **Biggest Loss:** ${poorestUser.profitPercentage.toFixed(1)}% from starting
          📊 **Average Performance:** ${avgProfit >= 0 ? '+' : ''}${avgProfit.toFixed(1)}%
          💡 **Pro Tip:** ${avgProfit > 0 ? 'Market is bullish! 🚀' : 'Buy the dip! 💎🙌'}
        `,
        inline: false
      });

      await interaction.editReply({ embeds: [embed], allowedMentions: { parse: [] } });
      
    } catch (error) {
      console.error('Leaderboard command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Leaderboard Error')
        .setDescription('Unable to fetch leaderboard data. Please try again later.')
        .setColor('#ff4757')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
