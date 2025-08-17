import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, updateUserBalance, removeHolding, addTransaction, getHoldings } from '../utils/supabaseDb.js';
import { getAllStocks } from '../utils/marketAPI.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell Italian meme stocks')
    .addStringOption(opt => opt.setName('stock').setDescription('Stock symbol (e.g., SKIBI, RIZZL)').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of shares to sell').setRequired(true)),
  async execute(interaction) {
    try {
      // Defer reply only once
      await interaction.deferReply();
      
      const stock = interaction.options.getString('stock').toUpperCase();
      const amount = interaction.options.getInteger('amount');
      
      if (amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Invalid Amount')
          .setDescription('You must sell at least 1 share!')
          .setColor('#ff4757')
          .setTimestamp();
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // Get current market data
      const market = await getAllStocks();
      if (!market[stock] || typeof market[stock].price !== 'number') {
        const availableStocks = Object.keys(market).filter(key => key !== 'lastEvent').join(', ');
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Stock Not Found')
          .setDescription(`**${stock}** is not a valid stock symbol!\n\n**Available stocks:** ${availableStocks}`)
          .setColor('#ff4757')
          .setTimestamp();
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const price = market[stock].price;
      const user = await getUser(interaction.user.id);
      const holdings = await getHoldings(interaction.user.id);
      
      // Check if user owns this stock
      const holding = holdings.find(h => h.stock === stock);
      if (!holding || holding.amount < amount) {
        const ownedAmount = holding ? holding.amount : 0;
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Insufficient Shares')
          .setDescription(`You don't have enough **${stock}** shares to sell!\n\n**You own:** ${ownedAmount} shares\n**Trying to sell:** ${amount} shares`)
          .setColor('#ff4757')
          .setTimestamp();
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const totalGain = price * amount;
      const newBalance = user.balance + totalGain;
      
      // Update user balance and holdings
      await updateUserBalance(interaction.user.id, newBalance);
      await removeHolding(interaction.user.id, stock, amount);
      await addTransaction(interaction.user.id, stock, -amount, price);

      // Load meta data for stock info
      const metaPath = './meta.json';
      let meta = {};
      try {
        const fs = await import('fs');
        if (fs.existsSync(metaPath)) {
          meta = JSON.parse(fs.readFileSync(metaPath));
        }
      } catch (error) {
        console.log('Could not load meta data:', error.message);
      }

      const stockMeta = meta[stock] || {};
      const change = market[stock].lastChange || 0;
      const changeEmoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      
      // Create success embed
      const successEmbed = new EmbedBuilder()
        .setTitle('📉 Stock Sold Successfully!')
        .setDescription(`Sold **${amount}** shares of **${stock}** ${stockMeta.italianName ? `(${stockMeta.italianName})` : ''} 🇮🇹`)
        .setColor('#00ff41')
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL());

      successEmbed.addFields([
        {
          name: '💰 Sale Details',
          value: `
            **Stock:** ${stock} ${stockMeta.italian ? '🇮🇹' : ''}
            **Shares Sold:** ${amount}
            **Price per Share:** $${price.toFixed(4)}
            **Total Received:** $${totalGain.toFixed(2)}
          `,
          inline: true
        },
        {
          name: '📊 Current Status',
          value: `
            **Current Price:** $${price.toFixed(4)} ${changeEmoji}
            **Price Change:** ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
            **Remaining Shares:** ${holding.amount - amount}
          `,
          inline: true
        },
        {
          name: '💵 Your Wallet',
          value: `
            **Previous Balance:** $${user.balance.toFixed(2)}
            **Sale Proceeds:** +$${totalGain.toFixed(2)}
            **New Balance:** $${newBalance.toFixed(2)}
          `,
          inline: false
        }
      ]);

      // Add tip based on stock performance
      let tip = '💡 ';
      if (change > 5) {
        tip += 'Great timing! You sold during a pump! 🚀';
      } else if (change < -5) {
        tip += 'You sold during a dip - could be smart loss mitigation! 🛡️';
      } else {
        tip += 'Consider using `/market` to check other opportunities!';
      }

      successEmbed.addFields({
        name: '🎯 Trading Tip',
        value: tip,
        inline: false
      });

      successEmbed.setFooter({ 
        text: '🇮🇹 Italian Meme Stock Exchange • Trade responsibly!' 
      });

      await interaction.editReply({ embeds: [successEmbed] });
      
    } catch (error) {
      console.error('Sell command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Sale Failed')
        .setDescription('There was an error processing your sale. Please try again.')
        .setColor('#ff4757')
        .setTimestamp();
      
      // Safe error reply
      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else if (!interaction.replied) {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  }
};
