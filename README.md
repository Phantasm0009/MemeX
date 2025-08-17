# 🇮🇹 Italian Meme Stock Exchange Bot

A Discord bot for trading 15 authentic Italian brainrot meme stocks with dynamic pricing based on real-world trends!

## 🚀 Features

### 15 Italian Meme Stocks
- **SKIBI** - Gabibbi Toiletto (Extreme volatility)
- **SUS** - Tra-I-Nostri (High volatility)  
- **SAHUR** - Tamburello Mistico (Extreme volatility)
- **LABUB** - Mostriciattolo (Low volatility)
- **OHIO** - Caporetto Finale (High volatility)
- **RIZZL** - Casanova (Medium volatility)
- **GYATT** - Culone (Extreme volatility)
- **FRIED** - Friggitrice (High volatility)
- **SIGMA** - Machio (Low volatility)
- **TRALA** - Tralalero Tralala (Medium volatility) 🇮🇹
- **CROCO** - Bombardiro Crocodilo (Extreme volatility) 🇮🇹
- **FANUM** - Tassa Nonna (Medium volatility)
- **CAPPU** - Ballerina Cappuccina (Medium volatility) 🇮🇹
- **BANANI** - Chimpanzini Bananini (Low volatility) 🇮🇹
- **LARILA** - Lirili Larila (High volatility) 🇮🇹

### Special Features
- **Core Italian Stocks** (🇮🇹): Authentic Italian brainrot creations with special powers
- **Dynamic Pricing**: Prices update based on Google Trends, Twitter, Reddit, YouTube, and TikTok data
- **Italian Time Events**: Pasta hours (12-2 PM) and beach hours (6-8 PM) affect prices
- **Chaos Events**: Random market manipulation events
- **Sunday Immunity**: Italian stocks resist chaos on Sundays
- **Price Protection**: BANANI cannot drop below $0.20
- 📊 **Portfolio Tracking**: View holdings, transaction history, and net worth
- 👑 **Leaderboards**: See who's the richest trader
- 🔧 **Admin Commands**: Add/remove stocks, set prices, give money

## Stock Personalities

- **RIZZL** (High volatility): Romance-themed, boosted by love/dating mentions
- **SAHUR** (Medium volatility, Italian): Pizza-powered, reacts to 🍕 and pasta
- **CROCO** (Extreme volatility, Italian): Chaos stock, can nuke others randomly
- **OHIO** (High volatility): Steals value from other stocks occasionally
- **LARILA** (Low volatility): Stable stock, sometimes freezes market

## Commands

### Trading Commands
- `/market` - View all stock prices and recent changes
- `/buy <stock> <amount>` - Buy shares of a stock
- `/sell <stock> <amount>` - Sell shares you own
- `/portfolio` - View your holdings and net worth
- `/history` - View transaction history
- `/daily` - Claim daily bonus (24-hour cooldown)
- `/leaderboard` - Top 10 richest users

### Admin Commands (Requires Administrator permission)
- `/admin addstock <symbol> <price> <volatility> [italian]` - Add new stock
- `/admin removestock <symbol>` - Remove a stock
- `/admin setprice <symbol> <price>` - Manually set stock price
- `/admin givemoney <user> <amount>` - Give money to a user

## Setup Instructions

### 1. Create Discord Bot
1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Enable "Message Content Intent" in Bot settings

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
1. Copy `.env.example` to `.env`
2. Fill in your Discord bot credentials:
```env
BOT_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_id_here
MARKET_CHANNEL_ID=channel_id_for_market_updates_optional
```

### 4. Invite Bot to Server
Use this URL (replace CLIENT_ID):
```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=139586751552&scope=bot%20applications.commands
```

### 5. Run the Bot
```bash
npm start
```

## Event Triggers

The bot monitors chat messages for these events:

- **🍝 Pasta Protocol**: 2+ pasta mentions → Italian stocks +25%
- **💕 Romance Surge**: 3+ romance mentions → RIZZL +25%  
- **🍕 Pizza Power**: 2+ pizza mentions → SAHUR +15%
- **👵 Nonnas Peace**: 2+ peaceful mentions → CROCO +15%
- **🔥 Heatwave**: 1+ heatwave mention → Random stock -40%

## Chaos Events (10% chance every minute)

- **🐊 CROCO NUKE**: CROCO destroys another stock (-100%)
- **🌪️ OHIO STEAL**: OHIO takes 5% from another stock
- **🧊 LARILA FREEZE**: Reduced volatility next update
- **🚀 BULL RUN**: All stocks +10%

## Optional Real-World Integration

Add API keys to `.env` for real trend data:

- **Google Trends API**: `google-trends-api` package
- **Twitter API**: Bearer token for tweet search
- **Reddit API**: Search recent posts
- **YouTube API**: Search for shorts/videos

Without API keys, the bot uses random trend data.

## File Structure

```
stock-bot/
├── commands/           # Slash command handlers
│   ├── buy.js         # Buy stocks
│   ├── sell.js        # Sell stocks
│   ├── market.js      # View market
│   ├── portfolio.js   # View holdings
│   ├── leaderboard.js # User rankings
│   ├── daily.js       # Daily bonus
│   ├── history.js     # Transaction history
│   └── admin.js       # Admin commands
├── events/            # Discord event handlers
│   ├── interactionCreate.js
│   └── messageCreate.js
├── utils/             # Helper modules
│   ├── db.js          # Database operations
│   ├── priceUpdater.js # Market price logic
│   ├── trendFetcher.js # Real-world trend APIs
│   └── triggers.js    # Event detection
├── market.json        # Current stock prices
├── meta.json          # Stock metadata
├── database.json      # User data & transactions
└── index.js           # Main bot file
```

## Troubleshooting

### Dependencies Not Installing
If `better-sqlite3` fails to compile, the bot uses JSON database instead. This is normal on some systems.

### Bot Not Responding
1. Check console for errors
2. Verify bot token is correct
3. Ensure bot has proper permissions in server
4. Check if commands are registered (restart bot)

### API Errors
API integrations are optional. The bot works fine with just Discord - real-world trend data enhances the experience but isn't required.

## Contributing

Feel free to submit issues and pull requests! Some ideas:
- Add more meme stocks
- New event triggers
- Better trend analysis
- Web dashboard
- Stock charts/graphs

## License

MIT License - do whatever you want with this code!
