import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserQuests, claimQuestReward, getUser } from '../utils/supabaseDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('💎 Professional reward collection and mission completion'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const userId = interaction.user.id;
      
      // Ensure user exists in database
      await getUser(userId);
      
      // Get user's current quests
      const quests = await getUserQuests(userId);
      
      if (!quests || quests.length === 0) {
        const noQuestsEmbed = new EmbedBuilder()
          .setTitle('💎 **REWARD COLLECTION**')
          .setDescription('```yaml\nStatus: NO MISSIONS AVAILABLE\nActive Rewards: 0\nPending Claims: None\n```')
          .addFields({
            name: '🎯 **Mission System**',
            value: 'Complete daily trading missions to earn rewards.\nUse `/quests` to view available missions.',
            inline: false
          })
          .setColor('#ffa726')
          .setFooter({ text: 'MemeX Trading Platform • Reward Center' })
          .setTimestamp();
        
        return await interaction.editReply({ embeds: [noQuestsEmbed] });
      }

      // Find completed but unclaimed quests
      const unclaimedQuests = quests.filter(quest => quest.completed && !quest.claimed);
      
      if (unclaimedQuests.length === 0) {
        const nothingToClaimEmbed = new EmbedBuilder()
          .setTitle('💎 **REWARD COLLECTION**')
          .setDescription('```yaml\nStatus: NO PENDING REWARDS\nCompleted Missions: All Claimed\nNext Reset: 00:00 UTC\n```')
          .addFields({
            name: '� **Mission Progress**',
            value: 'Complete daily trading missions to earn rewards.\nUse `/quests` to view available missions and progress.',
            inline: false
          })
          .setColor('#ffa726')
          .setFooter({ text: 'MemeX Trading Platform • Reward Center' })
          .setTimestamp();
        
        return await interaction.editReply({ embeds: [nothingToClaimEmbed] });
      }

      // Calculate total rewards
      let totalRewards = 0;
      let claimedQuests = [];

      for (const quest of unclaimedQuests) {
        try {
          const success = await claimQuestReward(userId, quest.id);
          if (success) {
            totalRewards += quest.reward;
            claimedQuests.push(quest);
          }
        } catch (error) {
          console.error(`Error claiming quest ${quest.id}:`, error);
        }
      }

      if (claimedQuests.length === 0) {
        const claimErrorEmbed = new EmbedBuilder()
          .setTitle('❌ **CLAIM FAILED**')
          .setDescription('```yaml\nOperation: REWARD_CLAIM\nStatus: ERROR\nReason: System Error\n```')
          .addFields({
            name: '🔧 **Error Details**',
            value: 'Unable to process reward claim. Please try again or contact support.',
            inline: false
          })
          .setColor('#ff4757')
          .setFooter({ text: 'MemeX Trading Platform • Error Handler' })
          .setTimestamp();
        
        return await interaction.editReply({ embeds: [claimErrorEmbed] });
      }

      // Get updated user balance
      const user = await getUser(userId);
      
      // Create professional success embed
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ **REWARDS CLAIMED**')
        .setDescription('```yaml\nOperation: REWARD_CLAIM\nStatus: SUCCESS\nProcessed: ' + claimedQuests.length + ' missions\n```')
        .setColor('#00d4aa')
        .setFooter({ text: 'MemeX Trading Platform • Reward Processing' })
        .setTimestamp();

      successEmbed.addFields([
        {
          name: '💰 **Capital Injection**',
          value: `\`\`\`\nReward Total: $${totalRewards.toLocaleString()}\nNew Balance: $${(user?.balance || 0).toLocaleString()}\nNet Change: +$${totalRewards.toLocaleString()}\`\`\``,
          inline: false
        },
        {
          name: '📊 **Mission Summary**',
          value: `\`\`\`\nCompleted: ${claimedQuests.length} missions\nRewards: $${totalRewards.toLocaleString()}\nNext Reset: 00:00 UTC\nStatus: PROCESSED\`\`\``,
          inline: false
        }
      ]);

      // Add details about claimed quests
      if (claimedQuests.length > 0) {
        const questDetails = claimedQuests.map(quest => 
          `• **${quest.quest_type.replace(/_/g, ' ').toUpperCase()}** \`$${quest.reward.toLocaleString()}\``
        ).join('\n');
        
        successEmbed.addFields({
          name: '🎯 **Processed Missions**',
          value: questDetails,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in claim command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('❌ Claim Error')
        .setDescription('🍝 Mamma mia! There was an error claiming your rewards. Please try again later.')
        .setTimestamp()
        .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
