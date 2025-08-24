import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, updateUserBalance, addHolding, addTransaction, getDiscordUserInfo } from '../utils/supabaseDb.js';
import { getAllStocks } from '../utils/marketAPI.js';

export default {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('🟢 Execute buy order for premium meme assets')
    .addStringOption(opt => opt.setName('stock').setDescription('Asset symbol (e.g., SKIBI, RIZZL)').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of shares to purchase').setRequired(true)),
  async execute(interaction) {
    try {
      // Defer reply only once
      await interaction.deferReply();
      
      const stock = interaction.options.getString('stock').toUpperCase();
      const amount = interaction.options.getInteger('amount');
      
      if (amount <= 0) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('🚫 **ORDER REJECTED**')
          .setDescription('```yaml\nError: Invalid Quantity\nMinimum: 1 share\nRequested: ' + amount + '\n```')
          .setColor('#ff4757')
          .addFields({
            name: '💡 **Trading Tip**',
            value: 'Use positive integers for share quantities.',
            inline: false
          })
          .setFooter({ text: 'MemeX Trading Platform • Order Management' })
          .setTimestamp();
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // Get current market data
      const market = await getAllStocks();
      if (!market[stock] || typeof market[stock].price !== 'number') {
        const availableStocks = Object.keys(market).filter(key => key !== 'lastEvent').slice(0, 8).join(' • ');
        const errorEmbed = new EmbedBuilder()
          .setTitle('🚫 **ASSET NOT FOUND**')
          .setDescription('```yaml\nError: Invalid Symbol\nSymbol: ' + stock + '\nStatus: Not Listed\n```')
          .addFields({
            name: '📊 **Available Assets**',
            value: `\`\`\`\n${availableStocks}\n...and more\`\`\`\n*Use \`/market\` for complete listings*`,
            inline: false
          })
          .setColor('#ff4757')
          .setFooter({ text: 'MemeX Trading Platform • Symbol Lookup' })
          .setTimestamp();
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const price = market[stock].price;
      const totalCost = price * amount;
      const discordUserInfo = getDiscordUserInfo(interaction.user);
      const user = await getUser(interaction.user.id, discordUserInfo);
      
      if (user.balance < totalCost) {
        const shortage = totalCost - user.balance;
        const errorEmbed = new EmbedBuilder()
          .setTitle('🚫 **INSUFFICIENT CAPITAL**')
          .setDescription('```yaml\nOrder Status: REJECTED\nReason: Insufficient Funds\n```')
          .addFields([
            {
              name: '💰 **Account Balance**',
              value: `\`\`\`\nAvailable: $${user.balance.toLocaleString()}\nRequired:  $${totalCost.toLocaleString()}\nShortage:  $${shortage.toLocaleString()}\`\`\``,
              inline: true
            },
            {
              name: '📊 **Order Details**',
              value: `\`\`\`\nAsset:     ${stock}\nQuantity:  ${amount.toLocaleString()}\nPrice:     $${price.toLocaleString()}\nTotal:     $${totalCost.toLocaleString()}\`\`\``,
              inline: true
            },
            {
              name: '💡 **Funding Options**',
              value: `• Max affordable: ${Math.floor(user.balance / price).toLocaleString()} shares\n• Use \`/daily\` for bonus capital\n• Execute \`/sell\` orders first`,
              inline: false
            }
          ])
          .setColor('#ff4757')
          .setFooter({ text: 'MemeX Trading Platform • Risk Management' })
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
      
      // Volatility colors
      const vol = stockMeta.volatility || 'medium';
      const volColor = {
        'low': '�',
        'medium': '🟡', 
        'high': '🟠',
        'extreme': '🔴'
      }[vol] || '🟡';

      const italianName = stockMeta.italianName || stockMeta.name || stock;
      const italianFlag = stockMeta.italian ? ' 🇮🇹' : '';
      
      // Success response with professional trading interface styling
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ **ORDER EXECUTED**')
        .setDescription('```yaml\nTransaction: BUY ORDER\nStatus: FILLED\nExecution: MARKET PRICE\n```')
        .setColor('#00d4aa') // Professional trading green
        .setTimestamp()
        .setFooter({ text: 'MemeX Trading Platform • Order Confirmation' });

      // Order Details
      successEmbed.addFields({
        name: '📊 **Order Summary**',
        value: `\`\`\`\nSymbol:     ${stock}${italianFlag}\nQuantity:   ${amount.toLocaleString()} shares\nPrice:      $${price.toLocaleString()}\nTotal:      $${totalCost.toLocaleString()}\nFees:       $0.00 (Commission-Free)\`\`\``,
        inline: false
      });

      // Account Update
      successEmbed.addFields([
        {
          name: '💰 **Account Update**',
          value: `\`\`\`\nPrevious:   $${user.balance.toLocaleString()}\nCurrent:    $${newBalance.toLocaleString()}\nNet Change: -$${totalCost.toLocaleString()}\`\`\``,
          inline: true
        },
        {
          name: '📈 **Asset Performance**',
          value: `\`\`\`\nLast Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\nVolatility:  ${vol.toUpperCase()}\nTrend:       ${changeEmoji}\`\`\``,
          inline: true
        }
      ]);

      if (stockMeta.italianName) {
        successEmbed.addFields({
          name: '🇮🇹 **Asset Details**',
          value: `**${stockMeta.italianName}** ${volColor}\n*${stockMeta.description || 'Premium Italian meme asset'}*`,
          inline: false
        });
      }

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
          await interaction.reply({ embeds: [errorEmbed], flags: [64] }); // 64 = EPHEMERAL flag
        }
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  }
};
