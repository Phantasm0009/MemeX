--- 
applyTo: "**"
---

## Project Overview
Build a **Discord bot** using **Node.js** and **discord.js v14** that simulates a trading platform where users can buy/sell meme "stocks" (e.g., "Tun Tun Sahur", "Among Us", "Labubu") with **fake currency** earned from server activity (messages, slash commands, and optional tasks).

Meme prices should **dynamically update** based on **real-world popularity signals** using:
- **Google Trends API** (official REST API or `google-trends-api` npm)
- **Reddit API** (PRAW alternative in Node via `snoowrap`)
- **TikTok scraping** (puppeteer or unofficial API to get hashtag view counts)
- **X (Twitter) API** (v2 endpoints for hashtag mentions)
- **YouTube Shorts API** (use YouTube Data API v3 search for Shorts tagged with the meme name)

The bot must:
1. Use **slash commands** (NOT `!` prefixes).
2. Persist all data (user balances, portfolios, meme prices, price history) in **SQLite** (`better-sqlite3`) or PostgreSQL.
3. Update meme prices automatically every X minutes based on fetched trend data.
4. Provide a leaderboard, portfolio display, and transaction history.
5. Include admin commands to add/remove memes.

## Technical Guidelines
### Discord Bot
- Use `discord.js` v14 with ESM (`"type": "module"` in package.json).
- Register slash commands globally using `REST.put(Routes.applicationCommands(...))`.
- Organize commands in `/commands` folder with separate files.
- Use an event handler in `/events` for `interactionCreate` and `ready`.

**Example Command Structure:**
```js
// commands/buy.js
import { SlashCommandBuilder } from 'discord.js';
import db from '../db.js';

export default {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy meme stock')
    .addStringOption(opt => opt.setName('meme').setDescription('Meme name').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Units to buy').setRequired(true)),
  async execute(interaction) {
    const meme = interaction.options.getString('meme');
    const amount = interaction.options.getInteger('amount');
    // Fetch current price
    const price = db.prepare('SELECT price FROM memes WHERE name = ?').get(meme)?.price;
    if (!price) return interaction.reply({ content: 'Meme not found.', ephemeral: true });
    const totalCost = price * amount;
    // Deduct balance and add to portfolio
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(totalCost, interaction.user.id);
    db.prepare('INSERT INTO portfolio (userId, meme, amount) VALUES (?, ?, ?) ON CONFLICT(userId, meme) DO UPDATE SET amount = amount + excluded.amount')
      .run(interaction.user.id, meme, amount);
    await interaction.reply(`Bought ${amount} of ${meme} for $${totalCost}.`);
  }
};
```

### Database
- Use `better-sqlite3` for simple file-based storage.
- Tables:  
  - `users(id TEXT PRIMARY KEY, balance INTEGER DEFAULT 1000)`
  - `memes(name TEXT PRIMARY KEY, price REAL, lastUpdated INTEGER)`
  - `portfolio(userId TEXT, meme TEXT, amount INTEGER, PRIMARY KEY(userId, meme))`
  - `transactions(id INTEGER PRIMARY KEY, userId TEXT, meme TEXT, amount INTEGER, price REAL, timestamp INTEGER)`

### Price Updating Logic
**Every X minutes (cron job with `node-cron`)**:
1. For each meme in DB:
   - Fetch **Google Trends interest** (last 24h, worldwide).
   - Fetch **Reddit mentions** (past day count).
   - Scrape **TikTok hashtag** view count.
   - Fetch **X mentions** via API search.
   - Fetch **YouTube Shorts** results for meme keyword.
2. Normalize data into a **popularity score** (0–100).
3. Adjust meme price:
   ```js
   newPrice = oldPrice * (1 + ((popularityScore - 50) / 1000));
   ```
4. Save new price and timestamp in DB.

### APIs & Integration Examples
**Google Trends**
```js
import googleTrends from 'google-trends-api';
const interest = await googleTrends.interestOverTime({ keyword: 'Among Us', startTime: new Date(Date.now() - 24*60*60*1000) });
```

**Reddit API**
```js
import Snoowrap from 'snoowrap';
const reddit = new Snoowrap({ userAgent, clientId, clientSecret, refreshToken });
const posts = await reddit.search({ query: 'Among Us', time: 'day' });
```

**TikTok Scraping (puppeteer)**
```js
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://www.tiktok.com/tag/amongus');
const views = await page.$eval('.some-selector', el => el.innerText);
```

**X API**
```js
import fetch from 'node-fetch';
const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=Among%20Us`, { headers: { Authorization: `Bearer ${TOKEN}` } });
```

**YouTube Shorts API**
```js
import { google } from 'googleapis';
const youtube = google.youtube({ version: 'v3', auth: API_KEY });
const res = await youtube.search.list({ q: 'Among Us', type: 'video', videoDuration: 'short', maxResults: 10 });
```

### Earning Currency
- Award **+1 coin per message** sent in server (with cooldown to prevent spam).
- Award coins for completing optional tasks (admin-configurable).

---

### Required NPM Packages
```bash
npm install discord.js better-sqlite3 node-cron snoowrap google-trends-api puppeteer node-fetch @googleapis/youtube
```

## Deliverables for Copilot
When generating code, always:
1. Use **ESM imports**.
2. Follow the file structure:
   ```
   /commands
   /events
   db.js
   index.js
   priceUpdater.js
   ```
3. Implement **error handling** for all API calls.
4. Keep code modular and readable.
```