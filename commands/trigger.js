import { SlashCommandBuilder } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

// Bot developer IDs - these users can use developer commands
const BOT_DEVELOPERS = process.env.BOT_DEVELOPERS 
  ? process.env.BOT_DEVELOPERS.split(',').map(id => id.trim())
  : ['1225485426349969518']; // Default developer ID

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.memexbot.xyz';

export default {
  data: new SlashCommandBuilder()
    .setName('trigger')
    .setDescription('🎭 Force trigger global market events (Developer Only)')
    .addStringOption(option =>
      option.setName('event')
        .setDescription('Event type to trigger')
        .setRequired(true)
        .addChoices(
          { name: '🚀 Meme Market Boom', value: 'meme_market_boom' },
          { name: '💥 Meme Crash', value: 'meme_crash' },
          { name: '📱 Viral TikTok Challenge', value: 'viral_tiktok_challenge' },
          { name: '🔥 Reddit Meme Hype', value: 'reddit_meme_hype' },
          { name: '🌡️ Heatwave Meltdown', value: 'heatwave_meltdown' },
          { name: '🍕 Global Pizza Day', value: 'global_pizza_day' },
          { name: '📡 Internet Outage Panic', value: 'internet_outage_panic' },
          { name: '🧊 Stock Freeze Hour', value: 'stock_freeze_hour' },
          { name: '💕 Market Romance', value: 'market_romance' },
          { name: '📈 Trend Surge', value: 'trend_surge' },
          { name: '🍝 Pasta Party', value: 'pasta_party' },
          { name: '😨 Stock Panic', value: 'stock_panic' },
          { name: '🏖️ Weekend Chill', value: 'weekend_chill' },
          { name: '🧬 Meme Mutation', value: 'meme_mutation' },
          { name: '🎰 Global Jackpot', value: 'global_jackpot' },
          { name: '⚡ Chaos Hour', value: 'chaos_hour' }
        ))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Event duration in seconds (optional)')
        .setMinValue(30)
        .setMaxValue(3600)
        .setRequired(false))
    .setDefaultMemberPermissions(0), // Hide from public - only bot developers can see

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }); // Make it ephemeral for privacy

    try {
      const userId = interaction.user.id;
      
      // Check if user is a bot developer
      if (!BOT_DEVELOPERS.includes(userId)) {
        const accessDeniedEmbed = new EmbedBuilder()
          .setTitle('🔒 **ACCESS RESTRICTED**')
          .setDescription('```yaml\nStatus: ACCESS DENIED\nPermission: DEVELOPER_ONLY\nClearance: INSUFFICIENT\n```')
          .setColor('#ff4757')
          .addFields({
            name: '⚠️ **Authorization Required**',
            value: '```\nThis command requires developer-level access.\nContact system administrator for permissions.\n```',
            inline: false
          })
          .setFooter({ text: 'MemeX Trading Platform • Security System' })
          .setTimestamp();

        return await interaction.editReply({ embeds: [accessDeniedEmbed] });
      }

      const eventType = interaction.options.getString('event');
      const duration = interaction.options.getInteger('duration');

      // Send request to backend API
      const requestBody = { eventType };
      if (duration) {
        requestBody.duration = duration * 1000; // Convert to milliseconds
      }

      console.log(`🎭 Developer ${interaction.user.username} triggering event: ${eventType}`);

      const response = await fetch(`${BACKEND_URL}/api/trigger-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ **EVENT TRIGGER FAILED**')
          .setDescription('```yaml\nStatus: OPERATION_FAILED\nSystem: BACKEND_API\nAction: EVENT_TRIGGER\n```')
          .setColor('#ff4757')
          .addFields({
            name: '🔧 **Error Details**',
            value: `\`\`\`\nError: ${result.error || 'Unknown error'}\nCode: ${response.status}\nTime: ${new Date().toISOString()}\n\`\`\``,
            inline: false
          })
          .setFooter({ text: 'MemeX Trading Platform • Developer Console' })
          .setTimestamp();

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Get event emoji based on type
      const eventEmojis = {
        'meme_market_boom': '🚀',
        'meme_crash': '💥',
        'viral_tiktok_challenge': '📱',
        'reddit_meme_hype': '🔥',
        'heatwave_meltdown': '🌡️',
        'global_pizza_day': '🍕',
        'internet_outage_panic': '📡',
        'stock_freeze_hour': '🧊',
        'market_romance': '💕',
        'trend_surge': '📈',
        'pasta_party': '🍝',
        'stock_panic': '😨',
        'weekend_chill': '🏖️',
        'meme_mutation': '🧬',
        'global_jackpot': '🎰',
        'chaos_hour': '⚡'
      };

      const successEmbed = new EmbedBuilder()
        .setTitle(`${eventEmojis[eventType]} **EVENT TRIGGERED SUCCESSFULLY**`)
        .setDescription('```yaml\nStatus: EXECUTED\nSystem: GLOBAL_EVENTS\nOperation: MANUAL_TRIGGER\n```')
        .setColor('#00d4aa')
        .addFields(
          {
            name: '🎭 **Event Details**',
            value: `\`\`\`yaml\nName: ${result.eventName || 'Unknown Event'}\nType: ${eventType}\nDuration: ${duration ? `${duration}s` : 'Default'}\nAffected: ${result.affectedStocks?.length || 0} stocks\n\`\`\``,
            inline: false
          },
          {
            name: '📊 **Market Impact**',
            value: `\`\`\`yaml\nTrigger Time: ${new Date().toLocaleTimeString()}\nOperator: ${interaction.user.username}\nBackend: ${response.ok ? 'RESPONSIVE' : 'ERROR'}\nMarket: ${result.success ? 'UPDATED' : 'PENDING'}\n\`\`\``,
            inline: false
          }
        )
        .setFooter({ text: 'MemeX Trading Platform • Developer Console' })
        .setTimestamp();

      if (result.affectedStocks && result.affectedStocks.length > 0) {
        successEmbed.addFields({
          name: '📈 **Affected Assets**',
          value: `\`\`\`\n${result.affectedStocks.join(', ')}\n\`\`\``,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [successEmbed] });

      // Log the successful trigger
      console.log(`✅ Event ${eventType} successfully triggered by developer ${interaction.user.username} (${userId})`);

    } catch (error) {
      console.error('Error triggering event:', error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('💀 **SYSTEM ERROR**')
        .setDescription('```yaml\nStatus: CRITICAL_ERROR\nSystem: COMMAND_HANDLER\nAction: EVENT_TRIGGER\n```')
        .setColor('#ff4757')
        .addFields({
          name: '🔧 **Technical Details**',
          value: `\`\`\`\nError: ${error.message}\nTime: ${new Date().toISOString()}\nBackend: ${BACKEND_URL}\n\`\`\``,
          inline: false
        })
        .setFooter({ text: 'MemeX Trading Platform • Developer Console' })
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
