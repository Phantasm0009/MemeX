import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const metaPath = path.join(__dirname, '../meta.json');

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Learn about the Italian Meme Stock Exchange'),
  async execute(interaction) {
    
    // Load meta data for featured stocks
    let meta = {};
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath));
    }

    const embed = new EmbedBuilder()
      .setTitle('🇮🇹 Welcome to the Italian Meme Stock Exchange! 🍝')
      .setDescription('Trade 15 authentic Italian brainrot stocks with fake currency!')
      .setColor('#009246') // Italian flag green
      .setTimestamp();

    // Commands section
    embed.addFields({
      name: '📈 Trading Commands',
      value: `
**\`/market\`** - View all stock prices
**\`/stock [symbol]\`** - Detailed stock info
**\`/buy [symbol] [amount]\`** - Buy stocks
**\`/sell [symbol] [amount]\`** - Sell stocks
**\`/portfolio\`** - View your holdings
**\`/leaderboard\`** - Richest traders
**\`/daily\`** - Get daily bonus coins
      `,
      inline: false
    });

    // Featured Italian stocks
    const featured = ['SKIBI', 'SIGMA', 'OHIO', 'LABUB', 'CAPPU'];
    const featuredText = featured.map(symbol => {
      const stock = meta[symbol];
      return `**${symbol}** - ${stock?.italianName || symbol} ${stock?.volatility === 'extreme' ? '🔥' : ''}`;
    }).join('\n');

    embed.addFields({
      name: '⭐ Featured Italian Brainrot Stocks',
      value: featuredText,
      inline: false
    });

    // How to earn coins
    embed.addFields({
      name: '💰 Earning Coins',
      value: `
• **Chat Activity**: +1 coin per message (once per minute)
• **Daily Bonus**: Use \`/daily\` for free coins
• **Trading Profits**: Buy low, sell high!
      `,
      inline: true
    });

    // Special mechanics
    embed.addFields({
      name: '🎲 Special Mechanics',
      value: `
• **Volatility Levels**: Low/Medium/High/Extreme
• **Pasta Hours**: 12-2 PM Italian time bonus
• **Beach Hours**: 6-8 PM siesta effects
• **Sunday Immunity**: Italian stocks resist chaos
• **Chaos Events**: Random market manipulation
      `,
      inline: true
    });

    // Tips
    embed.addFields({
      name: '💡 Pro Tips',
      value: `
🔍 Use \`/stock [symbol]\` for detailed info
📊 Check volatility before big trades
🇮🇹 Core Italian stocks have special powers
⚡ Extreme volatility = high risk/reward
🛡️ BANANI has minimum price protection
      `,
      inline: false
    });

    // All stocks list
    const allStocks = Object.keys(meta).join(', ');
    embed.addFields({
      name: '📋 All Available Stocks',
      value: allStocks,
      inline: false
    });

    embed.setFooter({ 
      text: 'Prices update based on real-world meme trends! 🌍' 
    });

    await interaction.reply({ embeds: [embed] });
  }
};
