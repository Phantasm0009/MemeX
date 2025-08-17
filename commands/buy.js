import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, updateUserBalance, addHolding, addTransaction } from '../utils/supabaseDb.js';
import { getAllStocks } from '../utils/marketAPI.js';

export default {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy Italian meme stocks')
    .addStringOption(opt => opt.setName('stock').setDescription('Stock symbol (e.g., SKIBI, RIZZL)').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of shares to buy').setRequired(true)),
  async execute(interaction) {
    try {
      // Defer reply only once
      await interaction.deferReply();
      
      const stock = interaction.options.getString('stock').toUpperCase();
      const amount = interaction.options.getInteger('amount');
      
      if (amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Invalid Amount')
          .setDescription('You must buy at least 1 share!')
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
      const totalCost = price * amount;
      const user = await getUser(interaction.user.id);
      
      if (user.balance < totalCost) {
        const shortage = totalCost - user.balance;
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Insufficient Funds')
          .setDescription(`You don't have enough money to buy **${amount}** shares of **${stock}**!`)
          .addFields([
            {
              name: '💰 Purchase Details',
              value: `
                **Cost:** $${totalCost.toFixed(2)}
                **Your Balance:** $${user.balance.toFixed(2)}
                **You Need:** $${shortage.toFixed(2)} more
              `,
              inline: true
            },
            {
              name: '💡 Suggestions',
              value: `
                • Buy ${Math.floor(user.balance / price)} shares instead
                • Use \`/daily\` for bonus money
                • Sell other stocks first
              `,
              inline: true
            }
          ])
          .setColor('#ff4757')
          .setTimestamp();
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const newBalance = user.balance - totalCost;
      
      // Update user balance and holdings
      await updateUserBalance(interaction.user.id, newBalance);
      await addHolding(interaction.user.id, stock, amount);
      await addTransaction(interaction.user.id, stock, amount, price);

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
        .setTitle('📈 Stock Purchased Successfully!')
        .setDescription(`Bought **${amount}** shares of **${stock}** ${stockMeta.italianName ? `(${stockMeta.italianName})` : ''} 🇮🇹`)
        .setColor('#00ff41')
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL());

      successEmbed.addFields([
        {
          name: '💰 Purchase Details',
          value: `
            **Stock:** ${stock} ${stockMeta.italian ? '🇮🇹' : ''}
            **Shares Bought:** ${amount}
            **Price per Share:** $${price.toFixed(4)}
            **Total Cost:** $${totalCost.toFixed(2)}
          `,
          inline: true
        },
        {
          name: '📊 Stock Info',
          value: `
            **Current Price:** $${price.toFixed(4)} ${changeEmoji}
            **Price Change:** ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
            **Volatility:** ${stockMeta.volatility ? stockMeta.volatility.toUpperCase() : 'MEDIUM'}
          `,
          inline: true
        },
        {
          name: '💵 Your Wallet',
          value: `
            **Previous Balance:** $${user.balance.toFixed(2)}
            **Purchase Cost:** -$${totalCost.toFixed(2)}
            **New Balance:** $${newBalance.toFixed(2)}
          `,
          inline: false
        }
      ]);

      // Add special stock description if available
      if (stockMeta.description) {
        successEmbed.addFields({
          name: '🇮🇹 Stock Personality',
          value: stockMeta.description,
          inline: false
        });
      }

      // Add investment tip
      let tip = '💡 ';
      if (stockMeta.volatility === 'extreme') {
        tip += 'High risk, high reward! This stock has extreme volatility! 🎢';
      } else if (stockMeta.volatility === 'low') {
        tip += 'Good choice for steady growth! Low volatility stock! 📈';
      } else if (stockMeta.italian) {
        tip += 'Italian stocks get bonuses during pasta hours (12-2 PM)! 🍝';
      } else {
        tip += 'Use `/portfolio` to track your investments!';
      }

      successEmbed.addFields({
        name: '🎯 Investment Tip',
        value: tip,
        inline: false
      });

      successEmbed.setFooter({ 
        text: '🇮🇹 Italian Meme Stock Exchange • Invest wisely!' 
      });

      await interaction.editReply({ embeds: [successEmbed] });
      
    } catch (error) {
      console.error('Buy command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Purchase Failed')
        .setDescription('There was an error processing your purchase. Please try again.')
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
