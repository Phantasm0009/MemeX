import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserQuests, claimQuestReward, getUser } from '../utils/supabaseDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('🎁 Claim rewards from completed quests'),

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
          .setColor('#FF6B6B')
          .setTitle('🎁 Claim Rewards')
          .setDescription('🍝 No quests found! Generate new quests first.')
          .setTimestamp()
          .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange' });
        
        return await interaction.editReply({ embeds: [noQuestsEmbed] });
      }

      // Find completed but unclaimed quests
      const unclaimedQuests = quests.filter(quest => quest.completed && !quest.claimed);
      
      if (unclaimedQuests.length === 0) {
        const nothingToClaimEmbed = new EmbedBuilder()
          .setColor('#FFA07A')
          .setTitle('🎁 Claim Rewards')
          .setDescription('🍕 No completed quests to claim! Complete your daily quests first.\n\nUse `/quests` to see your progress.')
          .setTimestamp()
          .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange' });
        
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
          .setColor('#FF6B6B')
          .setTitle('❌ Claim Error')
          .setDescription('🍝 Mamma mia! There was an error claiming your rewards. Please try again.')
          .setTimestamp()
          .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange' });
        
        return await interaction.editReply({ embeds: [claimErrorEmbed] });
      }

      // Get updated user balance
      const user = await getUser(userId);
      
      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setColor('#50C878')
        .setTitle('🎁 Rewards Claimed!')
        .setDescription(`🎉 **Congratulations!** You've claimed your quest rewards!`)
        .addFields(
          {
            name: '💰 Rewards Earned',
            value: `+${totalRewards} Pasta Coins`,
            inline: true
          },
          {
            name: '🏦 New Balance',
            value: `${user?.balance || 0} coins`,
            inline: true
          },
          {
            name: '✅ Quests Completed',
            value: `${claimedQuests.length} quest${claimedQuests.length !== 1 ? 's' : ''}`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange' });

      // Add details about claimed quests
      if (claimedQuests.length > 0) {
        const questDetails = claimedQuests.map(quest => 
          `🎯 **${quest.quest_type.toUpperCase()}**: +${quest.reward} coins`
        ).join('\n');
        
        successEmbed.addFields({
          name: '📋 Claimed Quests',
          value: questDetails,
          inline: false
        });
      }

      // Add encouragement message
      const encouragementMessages = [
        '🍝 Bravissimo! Keep completing quests!',
        '🇮🇹 Perfetto! Your pasta empire grows!',
        '🎯 Eccellente! More quests await tomorrow!',
        '💪 Fantastico! You\'re a true Italian trader!',
        '🌟 Magnifico! The stocks are impressed!'
      ];
      
      const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
      
      successEmbed.addFields({
        name: '🎊 Celebration',
        value: randomMessage,
        inline: false
      });

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
