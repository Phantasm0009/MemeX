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
      .setTitle('�️ **MemeX Trading Platform** | Italian Meme Stock Exchange')
      .setDescription('```yaml\n🚀 Professional Trading Terminal\n💎 15 Premium Italian Meme Assets\n⚡ Real-time Market Data\n🎯 Advanced Portfolio Analytics\n```')
      .setColor('#00d4aa') // Professional trading green
      .setTimestamp()
      .setThumbnail('https://cdn.discordapp.com/attachments/1234567890/placeholder-logo.png')
      .setFooter({ 
        text: 'MemeX | Professional Meme Trading Since 2024', 
        iconURL: 'https://cdn.discordapp.com/attachments/1234567890/placeholder-icon.png' 
      });

    // Trading Commands section with professional styling
    embed.addFields({
      name: '⚡ **Core Trading Functions**',
      value: `\`\`\`ansi
\u001b[0;36m📊 /market\u001b[0m     │ Market Overview & Analytics
\u001b[0;36m🔍 /stock\u001b[0m      │ Deep Asset Analysis
\u001b[0;32m📈 /buy\u001b[0m        │ Execute Buy Orders
\u001b[0;31m📉 /sell\u001b[0m       │ Execute Sell Orders
\u001b[0;35m💼 /portfolio\u001b[0m  │ Portfolio Dashboard
\u001b[0;33m🏆 /leaderboard\u001b[0m │ Top Trader Rankings
\`\`\``,
      inline: true
    });

    // Account Management section
    embed.addFields({
      name: '💰 **Account Management**',
      value: `\`\`\`ansi
\u001b[0;33m💵 /daily\u001b[0m      │ Daily Trading Bonus
\u001b[0;34m📋 /quests\u001b[0m     │ Active Trading Missions
\u001b[0;36m🎁 /claim\u001b[0m      │ Claim Quest Rewards
\u001b[0;37m📊 /history\u001b[0m    │ Transaction History
\`\`\``,
      inline: true
    });

    // Featured Premium Assets with professional styling
    const featured = ['SKIBI', 'SIGMA', 'OHIO', 'LABUB', 'CAPPU'];
    const featuredText = featured.map(symbol => {
      const stock = meta[symbol];
      const volatilityBadge = stock?.volatility === 'extreme' ? '🔥 HIGH VOL' : '📊 STABLE';
      return `\`${symbol.padEnd(6)}\` **${stock?.italianName || symbol}** ${volatilityBadge}`;
    }).join('\n');

    embed.addFields({
      name: '🏅 **Featured Premium Assets**',
      value: `\`\`\`yaml
Symbol │ Asset Name & Risk Profile
───────┼─────────────────────────
\`\`\`${featuredText}`,
      inline: false
    });

    // Market Stats and Info
    embed.addFields({
      name: '📊 **Market Information**',
      value: `\`\`\`yaml
Market Cap: $2.5M+ (Simulated)
Trading Hours: 24/7 Live
Assets: 15 Premium Meme Stocks
Currency: MemeCoins (MC)
Fees: Zero Commission Trading
\`\`\``,
      inline: true
    });

    embed.addFields({
      name: '🎯 **Getting Started**',
      value: `\`\`\`yaml
1. Check /market for live prices
2. Use /daily for starting capital
3. Execute /buy [symbol] [qty]
4. Monitor /portfolio performance
5. Compete on /leaderboard
\`\`\``,
      inline: true
    });

    // How to earn coins with professional styling
    embed.addFields({
      name: '💰 **Capital Management**',
      value: `\`\`\`yaml
• Chat Activity: +5 MC per message
• Daily Bonus: /daily command
• Trading P&L: Buy low, sell high
• Quest Rewards: Complete missions
\`\`\``,
      inline: true
    });

    // Advanced Trading Features
    embed.addFields({
      name: '⚡ **Advanced Features**',
      value: `\`\`\`yaml
• Real-time Market Data
• Volatility Analytics
• Portfolio Performance
• Risk Management Tools
• Global Event System
\`\`\``,
      inline: true
    });

    // All stocks list in professional format
    const allStocks = Object.keys(meta).slice(0, 10).join(' • ');
    embed.addFields({
      name: '� **Available Assets**',
      value: `\`\`\`\n${allStocks}${Object.keys(meta).length > 10 ? '\n...and more' : ''}\`\`\`\n*Use \`/market\` for complete listings with live prices*`,
      inline: false
    });

    await interaction.reply({ embeds: [embed] });
  }
};
