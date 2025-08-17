import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserQuests, claimQuestReward, getUser } from '../utils/supabaseDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription('📋 View your daily quests and progress'),

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
          .setTitle('📋 Daily Quests')
          .setDescription('🍝 No quests available today! New quests are generated daily.')
          .setTimestamp()
          .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange' });
        
        return await interaction.editReply({ embeds: [noQuestsEmbed] });
      }

      // Create quest embed
      const questEmbed = new EmbedBuilder()
        .setColor('#4ECDC4')
        .setTitle('📋 Your Daily Quests')
        .setDescription('🎯 Complete these challenges to earn Pasta Coins!')
        .setTimestamp()
        .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange' });

      let questFields = [];
      let completedCount = 0;
      let totalRewards = 0;

      quests.forEach((quest, index) => {
        const statusIcon = quest.completed 
          ? (quest.claimed ? '✅' : '🎁') 
          : '⏳';
        
        const status = quest.completed 
          ? (quest.claimed ? 'Claimed!' : 'Ready to Claim!') 
          : 'In Progress';
        
        if (quest.completed) completedCount++;
        if (quest.completed && !quest.claimed) totalRewards += quest.reward;

        // Make quest type more readable
        const questTypeDisplay = (quest.quest_type || quest.type || 'Unknown')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        questFields.push({
          name: `${statusIcon} Quest ${index + 1}: ${questTypeDisplay}`,
          value: `📝 **Task:** ${quest.description || 'No description'}\n💰 **Reward:** ${quest.reward || 0} coins\n📊 **Status:** ${status}${quest.completed_at ? `\n⏰ **Completed:** ${new Date(quest.completed_at).toLocaleTimeString()}` : ''}`,
          inline: false
        });
      });

      questEmbed.addFields(questFields);

      // Add summary field
      const summaryText = [
        `🎯 **Completed:** ${completedCount}/${quests.length}`,
        totalRewards > 0 ? `💰 **Ready to Claim:** ${totalRewards} coins` : '',
        totalRewards > 0 ? `\n*Use \`/claim\` to collect your rewards!*` : ''
      ].filter(Boolean).join('\n');

      questEmbed.addFields({
        name: '📊 Progress Summary',
        value: summaryText,
        inline: false
      });

      await interaction.editReply({ embeds: [questEmbed] });

    } catch (error) {
      console.error('Error in quests command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('❌ Quest Error')
        .setDescription('🍝 Mamma mia! There was an error loading your quests. Please try again later.')
        .setTimestamp()
        .setFooter({ text: '🇮🇹 Italian Meme Stock Exchange' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
