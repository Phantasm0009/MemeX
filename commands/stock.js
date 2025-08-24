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
    .setDescription('📈 Deep asset analysis and technical indicators')
    .addStringOption(option =>
      option.setName('symbol')
        .setDescription('Asset symbol (e.g., SKIBI, RIZZL, CROCO)')
        .setRequired(true)),
  async execute(interaction) {
    const symbol = interaction.options.getString('symbol').toUpperCase();
    const market = await getAllStocks();
    
    if (!market[symbol]) {
      const availableStocks = Object.keys(market).filter(key => key !== 'lastEvent').slice(0, 8).join(' • ');
      const errorEmbed = new EmbedBuilder()
        .setTitle('🚫 **ASSET NOT FOUND**')
        .setDescription('```yaml\nError: Invalid Symbol\nSymbol: ' + symbol + '\nStatus: Not Listed\n```')
        .addFields({
          name: '📊 **Available Assets**',
          value: `\`\`\`\n${availableStocks}\n...and more\`\`\`\n*Use \`/market\` for complete listings*`,
          inline: false
        })
        .setColor('#ff4757')
        .setFooter({ text: 'MemeX Trading Platform • Symbol Lookup' })
        .setTimestamp();
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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
    
    // Professional color scheme
    let color = '#ffa726'; // amber for neutral
    if (change > 5) color = '#00d4aa'; // professional green for big gains
    else if (change > 0) color = '#00d4aa'; // professional green for gains
    else if (change < -5) color = '#ff4757'; // professional red for big losses
    else if (change < 0) color = '#ff4757'; // professional red for losses

    const embed = new EmbedBuilder()
      .setTitle(`📊 **ASSET ANALYSIS** | ${symbol}`)
      .setDescription(`\`\`\`yaml\nAsset: ${stockMeta.italianName || stockMeta.name || symbol}\nSymbol: ${symbol}\nStatus: ACTIVE TRADING\n\`\`\``)
      .setColor(color)
      .setFooter({ text: 'MemeX Trading Platform • Technical Analysis' })
      .setTimestamp();

    // Professional price information
    embed.addFields({
      name: '💰 **Current Valuation**',
      value: `\`\`\`\nPrice:      $${stockData.price.toLocaleString()}\nChange:     ${changeText}\nTrend:      ${change > 0 ? 'BULLISH 📈' : change < 0 ? 'BEARISH 📉' : 'NEUTRAL ➡️'}\n\`\`\``,
      inline: true
    });

    // Professional volatility analysis
    const volatility = stockMeta.volatility || 'medium';
    let volEmoji = '🟡';
    let volDesc = 'MODERATE RISK';
    
    if (volatility === 'low') {
      volEmoji = '🟢';
      volDesc = 'LOW RISK - STABLE';
    } else if (volatility === 'high') {
      volEmoji = '🟠';
      volDesc = 'HIGH RISK - VOLATILE';
    } else if (volatility === 'extreme') {
      volEmoji = '🔴';
      volDesc = 'EXTREME RISK - CAUTION';
    }

    embed.addFields({
      name: '⚠️ **Risk Assessment**',
      value: `\`\`\`yaml\nRisk Level: ${volatility.toUpperCase()}\nClassification: ${volDesc}\nStatus: ACTIVE MONITORING\n\`\`\``,
      inline: true
    });

    // Professional asset profile
    if (stockMeta.description) {
      embed.addFields({
        name: '📋 **Asset Intelligence**',
        value: `\`\`\`yaml\nProfile: ${stockMeta.description}\nCategory: ${stockMeta.coreItalian ? 'PREMIUM ASSET' : 'STANDARD ASSET'}\nOrigin: ${stockMeta.coreItalian ? 'VERIFIED AUTHENTIC' : 'MARKET STANDARD'}\n\`\`\``,
        inline: false
      });
    }

    // Professional trading recommendation
    let suggestion = 'MONITOR - Await clear signals';
    let suggestionType = 'NEUTRAL';
    if (change > 5) {
      suggestion = 'STRONG BULLISH - Consider profit taking';
      suggestionType = 'BULL ALERT';
    } else if (change < -5) {
      suggestion = 'OVERSOLD - Potential accumulation zone';
      suggestionType = 'BEAR OPPORTUNITY';
    } else if (volatility === 'extreme') {
      suggestion = 'HIGH VOLATILITY - Use strict risk management';
      suggestionType = 'RISK WARNING';
    } else if (volatility === 'low') {
      suggestion = 'STABLE CHOICE - Conservative allocation suitable';
      suggestionType = 'CONSERVATIVE';
    }

    embed.addFields({
      name: '🎯 **Trading Signal**',
      value: `\`\`\`yaml\nRecommendation: ${suggestion}\nSignal Type: ${suggestionType}\nConfidence: ${volatility === 'extreme' ? 'MEDIUM' : 'HIGH'}\n\`\`\``,
      inline: false
    });

    // Professional price protection notice for BANANI
    if (symbol === 'BANANI' && stockMeta.minimumPrice) {
      embed.addFields({
        name: '🛡️ **Price Protection**',
        value: `\`\`\`yaml\nFloor Price: $${stockMeta.minimumPrice.toFixed(2)}\nProtection: ACTIVE\nMechanism: ALGORITHMIC SUPPORT\n\`\`\``,
        inline: true
      });
    }

    const replyOptions = { embeds: [embed] };
    await (interaction.deferred ? interaction.editReply(replyOptions) : interaction.reply(replyOptions));
  }
};
