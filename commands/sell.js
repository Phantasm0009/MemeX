import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, updateUserBalance, removeHolding, addTransaction, getHoldings, getDiscordUserInfo } from '../utils/supabaseDb.js';
import { getAllStocks } from '../utils/marketAPI.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('🔴 Execute sell order for premium meme assets')
    .addStringOption(opt => opt.setName('stock').setDescription('Asset symbol (e.g., SKIBI, RIZZL)').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of shares to liquidate').setRequired(true)),
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
      const discordUserInfo = getDiscordUserInfo(interaction.user);
      const user = await getUser(interaction.user.id, discordUserInfo);
      const holdings = await getHoldings(interaction.user.id);
      
      // Check if user owns this stock
      const holding = holdings.find(h => h.stock === stock);
      if (!holding || holding.amount < amount) {
        const ownedAmount = holding ? holding.amount : 0;
        const errorEmbed = new EmbedBuilder()
          .setTitle('🚫 **INSUFFICIENT HOLDINGS**')
          .setDescription('```yaml\nOrder Status: REJECTED\nReason: Insufficient Shares\n```')
          .addFields([
            {
              name: '📊 **Position Analysis**',
              value: `\`\`\`\nAsset:     ${stock}\nOwned:     ${ownedAmount.toLocaleString()} shares\nRequested: ${amount.toLocaleString()} shares\nShortage:  ${(amount - ownedAmount).toLocaleString()} shares\`\`\``,
              inline: false
            },
            {
              name: '💡 **Available Actions**',
              value: `• Max sellable: ${ownedAmount.toLocaleString()} shares\n• Use \`/portfolio\` to view all holdings\n• Consider partial liquidation`,
              inline: false
            }
          ])
          .setColor('#ff4757')
          .setFooter({ text: 'MemeX Trading Platform • Position Management' })
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
      const italianFlag = stockMeta.italian ? ' 🇮🇹' : '';
      
      // Create professional success embed
      const successEmbed = new EmbedBuilder()
        .setTitle('✅ **ORDER EXECUTED**')
        .setDescription('```yaml\nTransaction: SELL ORDER\nStatus: FILLED\nExecution: MARKET PRICE\n```')
        .setColor('#ff4757') // Professional trading red for sell
        .setTimestamp()
        .setFooter({ text: 'MemeX Trading Platform • Order Confirmation' });

      // Order Details
      successEmbed.addFields({
        name: '� **Order Summary**',
        value: `\`\`\`\nSymbol:     ${stock}${italianFlag}\nQuantity:   ${amount.toLocaleString()} shares\nPrice:      $${price.toLocaleString()}\nProceeds:   $${totalGain.toLocaleString()}\nFees:       $0.00 (Commission-Free)\`\`\``,
        inline: false
      });

      // Account Update
      successEmbed.addFields([
        {
          name: '� **Account Update**',
          value: `\`\`\`\nPrevious:   $${user.balance.toLocaleString()}\nCurrent:    $${newBalance.toLocaleString()}\nNet Change: +$${totalGain.toLocaleString()}\`\`\``,
          inline: true
        },
        {
          name: '� **Asset Performance**',
          value: `\`\`\`\nLast Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\nRemaining:   ${(holding.amount - amount).toLocaleString()} shares\nTrend:       ${changeEmoji}\`\`\``,
          inline: true
        }
      ]);

      // Market timing analysis
      let timingAnalysis = '';
      if (change > 5) {
        timingAnalysis = 'EXCELLENT timing - sold during uptrend';
      } else if (change < -5) {
        timingAnalysis = 'DEFENSIVE move - limited downside exposure';
      } else {
        timingAnalysis = 'NEUTRAL timing - stable market conditions';
      }

      successEmbed.addFields({
        name: '🎯 **Market Timing Analysis**',
        value: `\`\`\`\nAnalysis: ${timingAnalysis}\nSignal: ${change > 0 ? 'BULLISH' : change < 0 ? 'BEARISH' : 'NEUTRAL'}\nStrategy: ${change > 10 ? 'PROFIT TAKING' : change < -10 ? 'LOSS MITIGATION' : 'REBALANCING'}\`\`\``,
        inline: false
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
          await interaction.reply({ embeds: [errorEmbed], flags: [64] }); // 64 = EPHEMERAL flag
        }
      } catch (replyError) {
        console.error('Failed to send error message:', replyError);
      }
    }
  }
};
