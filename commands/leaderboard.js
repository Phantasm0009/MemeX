import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 Elite trader rankings and portfolio performance leaders')
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of top performers to display (1-20)')
        .setMinValue(1)
        .setMaxValue(20)
        .setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const limit = interaction.options.getInteger('limit') || 10;
      
      // Sync current user's Discord info to backend
      try {
        console.log(`📝 Syncing Discord info for user ${interaction.user.id}...`);
        const syncResponse = await fetch(`${BACKEND_URL}/api/user/${interaction.user.id}/discord-info`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: interaction.user.username,
            globalName: interaction.user.globalName,
            displayName: interaction.user.displayName || interaction.user.globalName || interaction.user.username,
            discriminator: interaction.user.discriminator
          })
        });
        
        if (syncResponse.ok) {
          console.log(`✅ Successfully synced Discord info for ${interaction.user.username}`);
        }
      } catch (syncError) {
        console.log('⚠️ Failed to sync Discord info:', syncError.message);
      }
      
      // Fetch leaderboard data from backend API
      console.log('🏆 Fetching leaderboard from backend...');
      const response = await fetch(`${BACKEND_URL}/api/leaderboard?limit=${limit}&includeHoldings=true`);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const leaderboard = data.leaderboard || [];
      
      if (leaderboard.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('� **ELITE TRADER RANKINGS**')
          .setDescription('```yaml\nMarket Status: INITIALIZING\nTrader Count: 0\nRankings: UNAVAILABLE\n```')
          .addFields({
            name: '🏆 **Market Notice**',
            value: 'No trading activity detected. Start your portfolio journey with `/buy` to appear on the leaderboard.',
            inline: false
          })
          .setColor('#ffa726')
          .setFooter({ text: 'MemeX Trading Platform • Market Analytics' })
          .setTimestamp();
        
        return interaction.editReply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 **ELITE TRADER RANKINGS**')
        .setDescription('```yaml\nMarket Status: ACTIVE\nTop Performers: ' + Math.min(limit, leaderboard.length) + '\nData Source: LIVE\n```')
        .setColor('#00d4aa')
        .setFooter({ text: 'MemeX Trading Platform • Elite Performance Metrics' })
        .setTimestamp();

      // Add leaderboard entries
      let leaderboardText = '';
      
      for (let i = 0; i < leaderboard.length; i++) {
        const userData = leaderboard[i];
        const rank = userData.rank || (i + 1);
        
        // Medal system for top 3
        let medal = '';
        if (rank === 1) medal = '🥇';
        else if (rank === 2) medal = '🥈';
        else if (rank === 3) medal = '🥉';
        else medal = `${rank}.`;
        
        // Get percentage change indicator
        const changePercent = userData.profitPercentage || 0;
        let changeIndicator = '';
        if (changePercent > 0) {
          changeIndicator = `+${changePercent.toFixed(1)}%`;
        } else if (changePercent < 0) {
          changeIndicator = `${changePercent.toFixed(1)}%`;
        } else {
          changeIndicator = '0.0%';
        }
        
        // Use Discord username if available, otherwise use display name
        const displayName = userData.username || userData.displayName || `User#${userData.id.slice(-4)}`;
        
        leaderboardText += `${medal} **${displayName}** \`$${userData.totalValue.toLocaleString('en-US', { maximumFractionDigits: 1 })}M\` \`${changeIndicator}\`\n`;
      }

      embed.addFields({
        name: '💎 **Top Portfolio Holdings**',
        value: leaderboardText || 'No traders found',
        inline: false
      });

      // Add market statistics using professional format
      const totalNetWorth = leaderboard.reduce((sum, user) => sum + user.totalValue, 0);
      const avgNetWorth = totalNetWorth / leaderboard.length;
      const avgProfit = leaderboard.reduce((sum, user) => sum + user.profitPercentage, 0) / leaderboard.length;
      
      embed.addFields({
        name: '� **Market Analytics**',
        value: `\`\`\`yaml\nActive Traders: ${data.totalUsers || leaderboard.length}\nTotal Volume: $${(totalNetWorth / 1000000).toFixed(1)}M\nAvg Portfolio: $${(avgNetWorth / 1000000).toFixed(1)}M\nMarket Trend: ${avgProfit >= 0 ? 'BULLISH' : 'BEARISH'}\n\`\`\``,
        inline: false
      });

      // Performance insights with professional styling
      const richestUser = leaderboard[0];
      const poorestUser = leaderboard[leaderboard.length - 1];
      
      embed.addFields({
        name: '🎯 **Performance Insights**',
        value: `\`\`\`yaml\nTop Holdings: $${(richestUser.totalValue / 1000000).toFixed(1)}M\nPerformance Range: ${poorestUser.profitPercentage.toFixed(1)}% → ${richestUser.profitPercentage.toFixed(1)}%\nAvg Return: ${avgProfit >= 0 ? '+' : ''}${avgProfit.toFixed(1)}%\nMarket Signal: ${avgProfit > 0 ? 'BUY' : 'HODL'}\n\`\`\``,
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Leaderboard command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Leaderboard Error')
        .setDescription(`Unable to fetch leaderboard data: ${error.message}`)
        .setColor('#ff4757')
        .setTimestamp();
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
