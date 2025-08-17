import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getAllStocks } from '../utils/marketAPI.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const metaPath = path.join(__dirname, '../meta.json');

export default {
  data: new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Get detailed information about a specific stock')
    .addStringOption(option =>
      option.setName('symbol')
        .setDescription('Stock symbol (e.g., SKIBI, RIZZL, CROCO)')
        .setRequired(true)),
  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();
    const market = await getAllStocks();
    
    if (!market[symbol]) {
      const availableStocks = Object.keys(market).filter(key => key !== 'lastEvent').join(', ');
      const errorMsg = { 
        content: `Stock ${symbol} not found! Available stocks: ${availableStocks}`, 
        ephemeral: true 
      };
      return interaction.deferred ? interaction.editReply(errorMsg) : interaction.reply(errorMsg);
    }

    // Load meta data
    let meta = {};
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath));
    }

    const stockData = market[symbol];
    const stockMeta = meta[symbol] || {};
    
    const change = stockData.lastChange || 0;
    const changeText = change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
    
    // Color based on performance
    let color = '#ffff00'; // yellow for neutral
    if (change > 5) color = '#00ff00'; // green for big gains
    else if (change > 0) color = '#90EE90'; // light green for gains
    else if (change < -5) color = '#ff0000'; // red for big losses
    else if (change < 0) color = '#ffcccb'; // light red for losses

    const embed = new EmbedBuilder()
      .setTitle(`${symbol} - ${stockMeta.italianName || stockMeta.name || symbol}`)
      .setColor(color)
      .setTimestamp();

    // Price information
    embed.addFields({
      name: '💰 Current Price',
      value: `**$${stockData.price.toFixed(4)}**\n${changeText} ${change > 0 ? '📈' : change < 0 ? '📉' : '➡️'}`,
      inline: true
    });

    // Volatility information
    const volatility = stockMeta.volatility || 'medium';
    let volEmoji = '🟡';
    let volDesc = 'Moderate price swings';
    
    if (volatility === 'low') {
      volEmoji = '🟢';
      volDesc = 'Stable, small price movements';
    } else if (volatility === 'high') {
      volEmoji = '🟠';
      volDesc = 'Large price swings possible';
    } else if (volatility === 'extreme') {
      volEmoji = '🔴';
      volDesc = 'Wild price swings expected!';
    }

    embed.addFields({
      name: '📊 Volatility',
      value: `${volEmoji} **${volatility.toUpperCase()}**\n${volDesc}`,
      inline: true
    });

    // Special power
    if (stockMeta.description) {
      embed.addFields({
        name: '🇮🇹 Italian Twist',
        value: stockMeta.description,
        inline: false
      });
    }

    // Core Italian brainrot stocks
    if (stockMeta.coreItalian) {
      embed.addFields({
        name: '⭐ Core Italian Brainrot',
        value: 'This is an authentic Italian brainrot creation!',
        inline: true
      });
    }

    // Add trading suggestion
    let suggestion = 'Monitor for trading opportunities';
    if (change > 5) {
      suggestion = '🚀 Strong momentum - consider taking profits';
    } else if (change < -5) {
      suggestion = '💡 Potential buying opportunity on the dip';
    } else if (volatility === 'extreme') {
      suggestion = '⚠️ High risk/high reward - trade carefully';
    } else if (volatility === 'low') {
      suggestion = '📈 Stable choice for conservative portfolios';
    }

    embed.addFields({
      name: '💡 Trading Insight',
      value: suggestion,
      inline: false
    });

    // Add minimum price info for BANANI
    if (symbol === 'BANANI' && stockMeta.minimumPrice) {
      embed.addFields({
        name: '🛡️ Price Protection',
        value: `Cannot drop below $${stockMeta.minimumPrice.toFixed(2)} - Invincible ape power!`,
        inline: true
      });
    }

    const replyOptions = { embeds: [embed] };
    await (interaction.deferred ? interaction.editReply(replyOptions) : interaction.reply(replyOptions));
  }
};
