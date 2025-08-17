#!/usr/bin/env node
import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

console.log('🚀 Discord Meme Stock Bot Setup\n');
console.log('This will help you configure your bot. You can skip any step by pressing Enter.\n');

async function setup() {
  try {
    const botToken = await question('Enter your Discord Bot Token: ');
    const clientId = await question('Enter your Discord Client ID: ');
    const guildId = await question('Enter Guild ID (optional, for testing): ');
    const channelId = await question('Enter Market Channel ID (optional): ');
    
    let envContent = '';
    
    if (botToken.trim()) {
      envContent += `BOT_TOKEN=${botToken.trim()}\n`;
    }
    if (clientId.trim()) {
      envContent += `CLIENT_ID=${clientId.trim()}\n`;
    }
    if (guildId.trim()) {
      envContent += `GUILD_ID=${guildId.trim()}\n`;
    }
    if (channelId.trim()) {
      envContent += `MARKET_CHANNEL_ID=${channelId.trim()}\n`;
    }
    
    envContent += '\n# Optional API Keys for real trend data\n';
    envContent += '# TWITTER_BEARER_TOKEN=\n';
    envContent += '# YOUTUBE_API_KEY=\n';
    envContent += '# REDDIT_CLIENT_ID=\n';
    envContent += '# REDDIT_CLIENT_SECRET=\n';
    
    if (envContent.trim()) {
      fs.writeFileSync('.env', envContent);
      console.log('\n✅ Configuration saved to .env file');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Invite your bot to Discord server with this URL:');
    if (clientId.trim()) {
      console.log(`   https://discord.com/oauth2/authorize?client_id=${clientId.trim()}&permissions=139586751552&scope=bot%20applications.commands`);
    } else {
      console.log('   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=139586751552&scope=bot%20applications.commands');
    }
    console.log('2. Run: npm start');
    console.log('3. Use /market command in Discord to see if it works!');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
  
  rl.close();
}

setup();
