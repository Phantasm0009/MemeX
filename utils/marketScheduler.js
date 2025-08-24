import cron from 'node-cron';
import fetch from 'node-fetch';
import { EmbedBuilder, WebhookClient } from 'discord.js';
import { getAllStocks } from './marketAPI.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const marketPath = path.join(__dirname, '../market.json');

// Webhook clients
const DAILY_WEBHOOK_URL = 'https://discord.com/api/webhooks/1409266813405102210/fubTQ6E_YirwxgWJ7UZb5P_GZpbkdiGHfo1-DeegyLmRdLUEvLBZXPa0CtcWtMwXglIb';
const WEEKLY_WEBHOOK_URL = 'https://discord.com/api/webhooks/1409267041818378405/4QcQQFTVkIc4r4XYjn5paHSambu2Se--C6-6Wx-ToOc5P98YvW4UOrwxVxKRGJmUAs16';

const dailyWebhook = new WebhookClient({ url: DAILY_WEBHOOK_URL });
const weeklyWebhook = new WebhookClient({ url: WEEKLY_WEBHOOK_URL });

// Backend URL for leaderboard data
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export class MarketScheduler {
  constructor() {
    this.dailyJob = null;
    this.weeklyJob = null;
  }

  // Start the scheduled tasks
  start() {
    console.log('📅 Starting Market Scheduler...');
    
    // Daily market report at 9 PM EST (1 AM UTC)
    this.dailyJob = cron.schedule('0 1 * * *', async () => {
      console.log('📊 Running daily market report...');
      await this.sendDailyMarketReport();
    }, {
      timezone: "America/New_York"  // EST timezone
    });

    // Weekly leaderboard on Fridays at 9 PM EST
    this.weeklyJob = cron.schedule('0 1 * * 5', async () => {
      console.log('🏆 Running weekly leaderboard...');
      await this.sendWeeklyLeaderboard();
    }, {
      timezone: "America/New_York"  // EST timezone
    });

    console.log('✅ Market Scheduler started successfully');
    console.log('   📊 Daily Reports: Every day at 9:00 PM EST');
    console.log('   🏆 Weekly Leaderboard: Fridays at 9:00 PM EST');
  }

  // Stop the scheduled tasks
  stop() {
    if (this.dailyJob) {
      this.dailyJob.destroy();
      console.log('🛑 Daily market report job stopped');
    }
    if (this.weeklyJob) {
      this.weeklyJob.destroy();
      console.log('🛑 Weekly leaderboard job stopped');
    }
  }

  // Send daily market report (top gainers/losers)
  async sendDailyMarketReport() {
    try {
      console.log('📈 Generating daily market report...');
      
      // Get current market data
      const stocks = await getAllStocks();
      
      if (!stocks || Object.keys(stocks).length === 0) {
        console.log('❌ No market data available for daily report');
        return;
      }

      // Calculate percentage changes and sort
      const stocksWithChange = Object.entries(stocks).map(([symbol, data]) => {
        const currentPrice = data.price || 0;
        const previousPrice = data.previousPrice || data.price || 0;
        const change = previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
        
        return {
          symbol,
          currentPrice,
          previousPrice,
          change,
          volume: data.volume || 0,
          marketCap: data.marketCap || 0
        };
      });

      // Sort by change percentage
      const gainers = stocksWithChange
        .filter(stock => stock.change > 0)
        .sort((a, b) => b.change - a.change)
        .slice(0, 5);

      const losers = stocksWithChange
        .filter(stock => stock.change < 0)
        .sort((a, b) => a.change - b.change)
        .slice(0, 5);

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('📊 **DAILY MARKET REPORT**')
        .setDescription('```yaml\nMemeX Trading Platform - Market Close Summary\nTimestamp: ' + new Date().toLocaleDateString('en-US', { 
          timeZone: 'America/New_York',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) + '\n```')
        .setColor('#00d4aa')
        .setFooter({ text: 'MemeX Trading Platform • Daily Market Analysis' })
        .setTimestamp();

      // Add top gainers
      if (gainers.length > 0) {
        let gainersText = '';
        gainers.forEach((stock, index) => {
          const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index] || '📈';
          gainersText += `${emoji} **${stock.symbol}** - $${stock.currentPrice.toFixed(4)}\n`;
          gainersText += `\`\`\`+${stock.change.toFixed(2)}% (+$${(stock.currentPrice - stock.previousPrice).toFixed(4)})\`\`\`\n`;
        });
        
        embed.addFields({
          name: '🚀 **TOP GAINERS**',
          value: gainersText,
          inline: true
        });
      }

      // Add top losers
      if (losers.length > 0) {
        let losersText = '';
        losers.forEach((stock, index) => {
          const emoji = ['💀', '📉', '🔻', '⬇️', '🩸'][index] || '📉';
          losersText += `${emoji} **${stock.symbol}** - $${stock.currentPrice.toFixed(4)}\n`;
          losersText += `\`\`\`${stock.change.toFixed(2)}% ($${(stock.currentPrice - stock.previousPrice).toFixed(4)})\`\`\`\n`;
        });
        
        embed.addFields({
          name: '📉 **TOP LOSERS**',
          value: losersText,
          inline: true
        });
      }

      // Market summary
      const totalStocks = stocksWithChange.length;
      const advancers = stocksWithChange.filter(s => s.change > 0).length;
      const decliners = stocksWithChange.filter(s => s.change < 0).length;
      const unchanged = totalStocks - advancers - decliners;

      embed.addFields({
        name: '📊 **MARKET SUMMARY**',
        value: `\`\`\`yaml\nTotal Assets: ${totalStocks}\nAdvancers: ${advancers}\nDecliners: ${decliners}\nUnchanged: ${unchanged}\n\nMarket Sentiment: ${advancers > decliners ? '🟢 BULLISH' : decliners > advancers ? '🔴 BEARISH' : '🟡 NEUTRAL'}\`\`\``,
        inline: false
      });

      // Send via webhook
      await dailyWebhook.send({
        embeds: [embed],
        username: 'MemeX Market Bot',
        avatarURL: 'https://cdn.discordapp.com/avatars/1225485426349969518/avatar.png'
      });

      console.log('✅ Daily market report sent successfully');

    } catch (error) {
      console.error('❌ Failed to send daily market report:', error);
    }
  }

  // Send weekly leaderboard
  async sendWeeklyLeaderboard() {
    try {
      console.log('🏆 Generating weekly leaderboard...');

      // Fetch leaderboard data from backend
      const response = await fetch(`${BACKEND_URL}/api/leaderboard?limit=10`);
      
      if (!response.ok) {
        console.log('❌ Failed to fetch leaderboard data');
        return;
      }

      const leaderboardData = await response.json();
      
      if (!leaderboardData.success || !leaderboardData.leaderboard) {
        console.log('❌ Invalid leaderboard response');
        return;
      }

      const leaderboard = leaderboardData.leaderboard;

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle('🏆 **WEEKLY LEADERBOARD**')
        .setDescription('```yaml\nMemeX Trading Platform - Elite Trader Rankings\nWeek Ending: ' + new Date().toLocaleDateString('en-US', { 
          timeZone: 'America/New_York',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) + '\n```')
        .setColor('#ffd700')
        .setFooter({ text: 'MemeX Trading Platform • Weekly Elite Rankings' })
        .setTimestamp();

      if (leaderboard.length === 0) {
        embed.addFields({
          name: '📊 **Trader Activity**',
          value: 'No trading activity this week. Be the first to start trading!',
          inline: false
        });
      } else {
        let leaderboardText = '';
        
        leaderboard.forEach((trader, index) => {
          const rank = index + 1;
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}️⃣`;
          const value = trader.totalValue || 0;
          const username = trader.username || trader.discordUsername || 'Unknown Trader';
          
          leaderboardText += `${medal} **${username}**\n`;
          leaderboardText += `\`\`\`Portfolio Value: $${value.toLocaleString()}\`\`\`\n`;
        });
        
        embed.addFields({
          name: '👑 **TOP TRADERS**',
          value: leaderboardText,
          inline: false
        });

        // Add weekly stats
        const totalTraders = leaderboard.length;
        const topValue = leaderboard[0]?.totalValue || 0;
        const avgValue = leaderboard.reduce((sum, trader) => sum + (trader.totalValue || 0), 0) / totalTraders;

        embed.addFields({
          name: '📈 **WEEKLY STATISTICS**',
          value: `\`\`\`yaml\nActive Traders: ${totalTraders}\nTop Portfolio: $${topValue.toLocaleString()}\nAverage Value: $${avgValue.toLocaleString()}\n\nNext Reset: Next Friday at 9:00 PM EST\`\`\``,
          inline: false
        });
      }

      // Send via webhook
      await weeklyWebhook.send({
        embeds: [embed],
        username: 'MemeX Leaderboard Bot',
        avatarURL: 'https://cdn.discordapp.com/avatars/1225485426349969518/avatar.png'
      });

      console.log('✅ Weekly leaderboard sent successfully');

    } catch (error) {
      console.error('❌ Failed to send weekly leaderboard:', error);
    }
  }

  // Manual trigger for testing
  async testDailyReport() {
    console.log('🧪 Testing daily market report...');
    await this.sendDailyMarketReport();
  }

  async testWeeklyLeaderboard() {
    console.log('🧪 Testing weekly leaderboard...');
    await this.sendWeeklyLeaderboard();
  }
}

// Create global instance
export const marketScheduler = new MarketScheduler();
