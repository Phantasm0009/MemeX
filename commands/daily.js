import { SlashCommandBuilder } from 'discord.js';
import { getUser, updateUserBalance, updateUserLastDaily } from '../utils/supabaseDb.js';

export default {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily bonus'),
  async execute(interaction) {
    const user = await getUser(interaction.user.id);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (user.lastDaily && (now - user.lastDaily) < dayInMs) {
      const timeLeft = dayInMs - (now - user.lastDaily);
      const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const errorMsg = { 
        content: `You already claimed your daily bonus! Try again in ${hoursLeft}h ${minutesLeft}m.`, 
        ephemeral: true 
      };
      return interaction.deferred ? interaction.editReply(errorMsg) : interaction.reply(errorMsg);
    }
    
    const bonus = 100;
    await updateUserBalance(interaction.user.id, user.balance + bonus);
    await updateUserLastDaily(interaction.user.id, now);
    
    const successMsg = { 
      content: `💰 You claimed your daily bonus of $${bonus}! Current balance: $${(user.balance + bonus).toFixed(2)}`, 
      ephemeral: true 
    };
    await (interaction.deferred ? interaction.editReply(successMsg) : interaction.reply(successMsg));
  }
};
