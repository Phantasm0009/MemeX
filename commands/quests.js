import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUserQuests, claimQuestReward, getUser } from '../utils/supabaseDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('quests')
    .setDescription('🎯 Professional trading mission dashboard and progress tracker'),

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
          .setTitle('🎯 **TRADING MISSIONS**')
          .setDescription('```yaml\nMission Status: NO ACTIVE MISSIONS\nNext Reset: 00:00 UTC Daily\nAvailability: All Traders\n```')
          .addFields({
            name: '💡 **Mission System**',
            value: 'Daily trading missions provide bonus capital and rewards for active traders. Check back tomorrow.',
            inline: false
          })
          .setColor('#ffa726')
          .setFooter({ text: 'MemeX Trading Platform • Mission Control' })
          .setTimestamp();
        
        return await interaction.editReply({ embeds: [noQuestsEmbed] });
      }

      // Create professional quest embed
      const questEmbed = new EmbedBuilder()
        .setTitle('🎯 **DAILY TRADING MISSIONS**')
        .setDescription('```yaml\nMission Status: ACTIVE\nTotal Missions: ' + quests.length + '\nReset Time: 00:00 UTC\n```')
        .setColor('#00d4aa')
        .setFooter({ text: 'MemeX Trading Platform • Mission Dashboard' })
        .setTimestamp();

      let questText = '';
      let completedCount = 0;
      let totalRewards = 0;

      quests.forEach((quest, index) => {
        const statusIcon = quest.completed 
          ? (quest.claimed ? '✅' : '🎁') 
          : '⏳';
        
        const status = quest.completed 
          ? (quest.claimed ? 'CLAIMED' : 'READY') 
          : 'ACTIVE';
        
        if (quest.completed) completedCount++;
        if (quest.completed && !quest.claimed) totalRewards += quest.reward;

        // Make quest type more readable
        const questTypeDisplay = (quest.quest_type || quest.type || 'Unknown')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        questText += `${statusIcon} **${questTypeDisplay}**\n`;
        questText += `\`\`\`\nObjective: ${quest.description || 'No description'}\nReward: $${(quest.reward || 0).toLocaleString()}\nStatus: ${status}\n\`\`\`\n`;
      });

      questEmbed.addFields({
        name: '📋 **Mission Objectives**',
        value: questText || 'No missions available',
        inline: false
      });

      // Add professional summary
      questEmbed.addFields({
        name: '📈 **Mission Analytics**',
        value: `\`\`\`yaml\nCompleted: ${completedCount}/${quests.length}\nSuccess Rate: ${((completedCount / quests.length) * 100).toFixed(1)}%\nPending Rewards: $${totalRewards.toLocaleString()}\nNext Action: ${totalRewards > 0 ? 'USE /claim' : 'COMPLETE MISSIONS'}\n\`\`\``,
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
