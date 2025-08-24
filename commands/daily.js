import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, updateUserBalance, updateUserLastDaily, getDiscordUserInfo } from '../utils/supabaseDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('💰 Claim daily trading capital bonus'),
  async execute(interaction) {
    const discordUserInfo = getDiscordUserInfo(interaction.user);
    const user = await getUser(interaction.user.id, discordUserInfo);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (user.lastDaily && (now - user.lastDaily) < dayInMs) {
      const timeLeft = dayInMs - (now - user.lastDaily);
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      
      const cooldownEmbed = new EmbedBuilder()
        .setTitle('⏰ **DAILY BONUS CLAIMED**')
        .setDescription('```yaml\nStatus: Already Collected\nNext Available: ' + hoursLeft + 'h ' + minutesLeft + 'm\n```')
        .addFields({
          name: '💡 **Alternative Options**',
          value: '• Execute trades for profit\n• Complete `/quests` for rewards\n• Check `/market` for opportunities',
          inline: false
        })
        .setColor('#ffa726')
        .setFooter({ text: 'MemeX Trading Platform • Daily Rewards' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [cooldownEmbed], ephemeral: true });
    }
    
    const bonus = 100;
    await updateUserBalance(interaction.user.id, user.balance + bonus);
    await updateUserLastDaily(interaction.user.id, now);
    
    const successEmbed = new EmbedBuilder()
      .setTitle('💰 **DAILY CAPITAL BONUS**')
      .setDescription('```yaml\nTransaction: Daily Bonus\nStatus: Credited\nAmount: $' + bonus.toLocaleString() + '\n```')
      .addFields([
        {
          name: '📊 **Account Summary**',
          value: `\`\`\`\nPrevious: $${user.balance.toLocaleString()}\nBonus:    $${bonus.toLocaleString()}\nCurrent:  $${(user.balance + bonus).toLocaleString()}\`\`\``,
          inline: true
        },
        {
          name: '🎯 **Next Steps**',
          value: '• Analyze `/market` trends\n• Execute strategic trades\n• Build your portfolio',
          inline: true
        }
      ])
      .setColor('#00d4aa')
      .setFooter({ text: 'MemeX Trading Platform • Account Management' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
  }
};
