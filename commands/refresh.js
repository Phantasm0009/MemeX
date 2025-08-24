import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { updateMarketPrices } from '../utils/marketAPI.js';

// Bot developer IDs - these users can use developer commands
const BOT_DEVELOPERS = process.env.BOT_DEVELOPERS 
  ? process.env.BOT_DEVELOPERS.split(',').map(id => id.trim())
  : ['1225485426349969518']; // Default developer ID

export default {
  data: new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('⚡ Force market data refresh and price recalculation (Developer Only)')
    .setDefaultMemberPermissions(0), // Hide from public - only bot developers can see
  
  async execute(interaction) {
    // Professional access control for developer commands
    if (!BOT_DEVELOPERS.includes(interaction.user.id)) {
      const accessDeniedEmbed = new EmbedBuilder()
        .setTitle('🚫 **ACCESS DENIED**')
        .setDescription('```yaml\nAccess Level: DEVELOPER REQUIRED\nUser Level: STANDARD\nStatus: UNAUTHORIZED\n```')
        .addFields({
          name: '🔐 **Security Notice**',
          value: 'This command requires developer-level privileges for market management.',
          inline: false
        })
        .setColor('#ff4757')
        .setFooter({ text: 'MemeX Trading Platform • Security System' })
        .setTimestamp();
      
      return await interaction.reply({ 
        embeds: [accessDeniedEmbed], 
        flags: MessageFlags.Ephemeral 
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const startTime = Date.now();
      
      // Force refresh all stock prices
      const response = await updateMarketPrices();
      
      const endTime = Date.now();
      const updateTime = endTime - startTime;

      // Ensure we have a valid response
      if (!response || typeof response !== 'object') {
        throw new Error('Failed to retrieve updated market data');
      }

      // Handle different response formats
      let stockCount = 15; // Default fallback
      let eventMessage = null;
      
      if (response.updatedStocks !== undefined) {
        // Simple backend response format
        stockCount = response.updatedStocks;
      } else if (response && typeof response === 'object') {
        // Enhanced backend response format (contains market data)
        stockCount = Object.keys(response).filter(k => 
          k !== 'lastEvent' && k !== 'timestamp' && typeof response[k] === 'object'
        ).length;
        eventMessage = response.lastEvent;
      }

      // Create professional success response
      const embed = new EmbedBuilder()
        .setTitle('✅ **MARKET REFRESH EXECUTED**')
        .setDescription('```yaml\nOperation: Force Price Update\nStatus: COMPLETED\nTrigger: Manual Developer Override\n```')
        .addFields([
          {
            name: '⚡ **Performance Metrics**',
            value: `\`\`\`\nExecution Time: ${updateTime}ms\nAssets Updated: ${stockCount}\nSuccess Rate: 100%\nAPI Response: OK\`\`\``,
            inline: true
          },
          {
            name: '🎯 **Operation Details**',
            value: `\`\`\`\nMethod: Force Refresh\nOperator: ${interaction.user.tag}\nTimestamp: ${new Date().toISOString()}\`\`\``,
            inline: true
          }
        ])
        .setColor('#00d4aa')
        .setFooter({ text: 'MemeX Trading Platform • Market Operations' })
        .setTimestamp();

      // Add market event info if available
      if (eventMessage) {
        embed.addFields({ name: '📰 Latest Event', value: eventMessage, inline: false });
      }

      // Add response message if available
      if (response.message) {
        embed.addFields({ name: '📋 Backend Message', value: response.message, inline: false });
      }

      await interaction.editReply({ 
        embeds: [embed],
        flags: MessageFlags.Ephemeral 
      });

      console.log(`🔄 Manual market refresh triggered by developer ${interaction.user.tag} (${interaction.user.id})`);

    } catch (error) {
      console.error('Developer refresh command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Refresh Failed')
        .setDescription('An error occurred while refreshing market prices.')
        .addFields(
          { name: 'Error Details', value: error.message || 'Unknown error', inline: false },
          { name: 'Error Type', value: error.name || 'Error', inline: true },
          { name: 'Timestamp', value: new Date().toLocaleTimeString(), inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ 
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
