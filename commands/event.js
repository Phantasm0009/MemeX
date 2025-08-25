import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.memexbot.xyz';

// Event definitions with effects and descriptions
const EVENT_DEFINITIONS = {
  'meme_market_boom': {
    name: '🚀 Global Meme Market Boom',
    description: 'Worldwide meme surge detected! All stocks pumping!',
    effect: 'All stocks +10-20%',
    duration: '1 minute',
    rarity: 'Common',
    emoji: '🚀'
  },
  'meme_crash': {
    name: '💥 Global Meme Crash',
    description: 'Market-wide meme fatigue detected! Mass sell-off!',
    effect: 'All stocks -15-30%',
    duration: '2 minutes',
    rarity: 'Uncommon',
    emoji: '💥'
  },
  'viral_tiktok_challenge': {
    name: '🎵 Viral TikTok Challenge',
    description: 'New TikTok challenge going viral! Boosting related memes!',
    effect: '2-3 random stocks +20-50%',
    duration: '3 minutes',
    rarity: 'Common',
    emoji: '🎵'
  },
  'reddit_meme_hype': {
    name: '🔴 Reddit Meme Hype',
    description: 'Trending on Reddit! Meme stonks rising!',
    effect: '1-5 random stocks +10%',
    duration: '2 minutes',
    rarity: 'Common',
    emoji: '🔴'
  },
  'heatwave_meltdown': {
    name: '🔥 Heatwave Meme Meltdown',
    description: 'Extreme heat causing server meltdowns! Stocks crashing!',
    effect: '1-2 random stocks -20-40%',
    duration: '5 minutes',
    rarity: 'Uncommon',
    emoji: '🔥'
  },
  'global_pizza_day': {
    name: '🍕 Global Pizza Day',
    description: 'Pizza emojis flooding the internet! Italian stocks rising!',
    effect: 'SAHUR +15%, Italian stocks +10%',
    duration: '10 minutes',
    rarity: 'Common',
    emoji: '🍕'
  },
  'internet_outage_panic': {
    name: '📡 Internet Outage Panic',
    description: 'Global internet outages causing panic sells!',
    effect: 'All stocks -5-15%',
    duration: '4 minutes',
    rarity: 'Uncommon',
    emoji: '📡'
  },
  'stock_freeze_hour': {
    name: '🧊 Stock Freeze Hour',
    description: 'Market volatility frozen! Prices stabilized!',
    effect: 'Selected stocks frozen for 1 hour',
    duration: '60 minutes',
    rarity: 'Rare',
    emoji: '🧊'
  },
  'market_romance': {
    name: '💕 Market Romance',
    description: 'Love is in the air! Romance stocks surging!',
    effect: 'RIZZL +40%, related stocks +15%',
    duration: '8 minutes',
    rarity: 'Common',
    emoji: '💕'
  },
  'trend_surge': {
    name: '📈 Trend Surge',
    description: 'Multiple platforms showing surge activity!',
    effect: '3-5 random stocks +15-25%',
    duration: '5 minutes',
    rarity: 'Common',
    emoji: '📈'
  },
  'pasta_party': {
    name: '🍝 Pasta Party',
    description: 'Italian culture celebration! Pasta memes everywhere!',
    effect: 'Italian stocks +20%',
    duration: '15 minutes',
    rarity: 'Common',
    emoji: '🍝'
  },
  'stock_panic': {
    name: '😱 Stock Panic',
    description: 'Panic selling detected! Random stocks crashing!',
    effect: '2-4 random stocks -15-25%',
    duration: '3 minutes',
    rarity: 'Common',
    emoji: '😱'
  },
  'weekend_chill': {
    name: '🏖️ Weekend Chill',
    description: 'Weekend vibes reducing market volatility!',
    effect: 'Reduced volatility for all stocks',
    duration: 'Weekend',
    rarity: 'Weekend Special',
    emoji: '🏖️'
  },
  'meme_mutation': {
    name: '🧬 Meme Mutation',
    description: 'Rare meme evolution detected! Massive transformation!',
    effect: '1 random stock +100-200%',
    duration: '30 minutes',
    rarity: 'Ultra Rare',
    emoji: '🧬'
  },
  'global_jackpot': {
    name: '🎰 Global Jackpot',
    description: 'Cosmic meme alignment! Ultimate gains event!',
    effect: 'All stocks +50-100%',
    duration: '45 minutes',
    rarity: 'Legendary',
    emoji: '🎰'
  },
  'chaos_hour': {
    name: '🌪️ Chaos Hour',
    description: 'Complete market chaos! Extreme volatility!',
    effect: 'Random +/-50% on all stocks',
    duration: '60 minutes',
    rarity: 'Rare',
    emoji: '🌪️'
  }
};

// Bot developer IDs - these users can use admin commands
const BOT_DEVELOPERS = process.env.BOT_DEVELOPERS 
  ? process.env.BOT_DEVELOPERS.split(',').map(id => id.trim())
  : ['1225485426349969518']; // Default developer ID

export default {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('🎭 Professional market event management system (Admin Only)')
    .setDefaultMemberPermissions(0) // Hide from public - only bot developers can see
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('📋 View complete event catalog and specifications'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('active')
        .setDescription('🔍 Monitor active market events and conditions')),

  async execute(interaction) {
    // Professional access control for admin commands
    if (!BOT_DEVELOPERS.includes(interaction.user.id)) {
      const accessDeniedEmbed = new EmbedBuilder()
        .setTitle('🚫 **ACCESS DENIED**')
        .setDescription('```yaml\nAccess Level: ADMIN REQUIRED\nUser Level: STANDARD\nStatus: UNAUTHORIZED\n```')
        .addFields({
          name: '🔐 **Security Notice**',
          value: 'This command requires developer-level privileges for market event management.',
          inline: false
        })
        .setColor('#ff4757')
        .setFooter({ text: 'MemeX Trading Platform • Security System' })
        .setTimestamp();
      
      return interaction.reply({
        embeds: [accessDeniedEmbed],
        ephemeral: true
      });
    }
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'list') {
        // Show all possible events with their descriptions
        const embed = new EmbedBuilder()
          .setTitle('🎭 Market Events Encyclopedia')
          .setDescription('*All possible market events that can occur in the Italian Meme Stock Exchange*')
          .setColor('#9b59b6')
          .setTimestamp();

        // Group events by rarity
        const eventsByRarity = {
          'Common': [],
          'Uncommon': [],
          'Rare': [],
          'Ultra Rare': [],
          'Legendary': [],
          'Weekend Special': []
        };

        Object.entries(EVENT_DEFINITIONS).forEach(([key, event]) => {
          eventsByRarity[event.rarity].push(`${event.emoji} **${event.name}**\n${event.description}\n*Effect:* ${event.effect}\n*Duration:* ${event.duration}`);
        });

        // Add fields for each rarity tier
        Object.entries(eventsByRarity).forEach(([rarity, events]) => {
          if (events.length > 0) {
            const rarityEmojis = {
              'Common': '🟢',
              'Uncommon': '🟡',
              'Rare': '🔴',
              'Ultra Rare': '🟣',
              'Legendary': '🟠',
              'Weekend Special': '🔵'
            };
            
            embed.addFields({
              name: `${rarityEmojis[rarity]} ${rarity} Events`,
              value: events.slice(0, 3).join('\n\n') + (events.length > 3 ? '\n*...and more*' : ''),
              inline: false
            });
          }
        });

        embed.setFooter({ 
          text: `${Object.keys(EVENT_DEFINITIONS).length} total events • Events trigger automatically based on market conditions` 
        });

        await interaction.editReply({ embeds: [embed] });

      } else if (subcommand === 'active') {
        // Fetch active events from backend
        try {
          const response = await fetch(`${BACKEND_URL}/api/global-events`);
          
          if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`);
          }

          const data = await response.json();
          
          const embed = new EmbedBuilder()
            .setTitle('🌍 Active Market Events')
            .setColor('#e74c3c')
            .setTimestamp();

          let hasActiveEvents = false;

          // Check for frozen stocks
          if (data.globalEvents?.frozenStocks && data.globalEvents.frozenStocks.length > 0) {
            embed.addFields({
              name: '🧊 Frozen Stocks',
              value: `${data.globalEvents.frozenStocks.join(', ')}\n*These stocks have reduced volatility*`,
              inline: false
            });
            hasActiveEvents = true;
          }

          // Check for active merges
          if (data.globalEvents?.activeMerges && data.globalEvents.activeMerges.length > 0) {
            embed.addFields({
              name: '🔄 Active Mergers',
              value: data.globalEvents.activeMerges.map(merge => 
                `**${merge.stock1}** ↔️ **${merge.stock2}** (${merge.timeLeft}s left)`
              ).join('\n'),
              inline: false
            });
            hasActiveEvents = true;
          }

          // Check for recent global events
          if (data.globalEvents?.lastEventTime) {
            const timeSinceEvent = Date.now() - data.globalEvents.lastEventTime;
            if (timeSinceEvent < 300000) { // Last 5 minutes
              embed.addFields({
                name: '⚡ Recent Event',
                value: `Last global event was ${Math.floor(timeSinceEvent / 1000)} seconds ago`,
                inline: false
              });
              hasActiveEvents = true;
            }
          }

          if (!hasActiveEvents) {
            embed.setDescription('🌙 **Market is calm**\n\nNo active events currently affecting the market. Events may trigger automatically based on market conditions, social media trends, and time-based factors.');
            embed.addFields({
              name: '📊 Event System Status',
              value: '✅ Active and monitoring\n🎲 Random events possible\n⏰ Time-based events scheduled\n🌐 Social media trend tracking active',
              inline: false
            });
          }

          embed.setFooter({ 
            text: 'Events update automatically • Use /event list to see all possible events' 
          });

          await interaction.editReply({ embeds: [embed] });

        } catch (error) {
          console.error('Error fetching active events:', error);
          
          const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Event System Error')
            .setDescription('Unable to fetch active events from the backend server.')
            .setColor('#ff4757')
            .addFields({
              name: 'Possible Causes',
              value: '• Backend server is offline\n• Network connectivity issues\n• Event system maintenance',
              inline: false
            })
            .setTimestamp();

          await interaction.editReply({ embeds: [errorEmbed] });
        }
      }

    } catch (error) {
      console.error('Event command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Command Error')
        .setDescription('An error occurred while executing the event command.')
        .setColor('#ff4757')
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
