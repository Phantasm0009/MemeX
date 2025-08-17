import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateMarketPrices } from '../utils/marketAPI.js';
import { updateUserBalance, getUser } from '../utils/supabaseDb.js'; // ✅ Fixed import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const marketPath = path.join(__dirname, '../market.json');
const metaPath = path.join(__dirname, '../meta.json');

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin commands for managing the stock market')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('addstock')
        .setDescription('Add a new stock to the market')
        .addStringOption(option =>
          option.setName('symbol')
            .setDescription('Stock symbol (e.g., MEME)')
            .setRequired(true))
        .addNumberOption(option =>
          option.setName('price')
            .setDescription('Starting price')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('volatility')
            .setDescription('Volatility level')
            .setRequired(true)
            .addChoices(
              { name: 'Low', value: 'low' },
              { name: 'Medium', value: 'medium' },
              { name: 'High', value: 'high' },
              { name: 'Extreme', value: 'extreme' }
            ))
        .addBooleanOption(option =>
          option.setName('italian')
            .setDescription('Is this an Italian stock? (affected by pasta events)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('removestock')
        .setDescription('Remove a stock from the market')
        .addStringOption(option =>
          option.setName('symbol')
            .setDescription('Stock symbol to remove')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('setprice')
        .setDescription('Manually set a stock price')
        .addStringOption(option =>
          option.setName('symbol')
            .setDescription('Stock symbol')
            .setRequired(true))
        .addNumberOption(option =>
          option.setName('price')
            .setDescription('New price')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('givemoney')
        .setDescription('Give money to a user')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to give money to')
            .setRequired(true))
        .addNumberOption(option =>
          option.setName('amount')
            .setDescription('Amount to give')
            .setRequired(true))),
            
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'addstock') {
      const symbol = interaction.options.getString('symbol').toUpperCase();
      const price = interaction.options.getNumber('price');
      const volatility = interaction.options.getString('volatility');
      const italian = interaction.options.getBoolean('italian') || false;
      
      if (price <= 0) {
        return interaction.reply({ content: 'Price must be positive!', ephemeral: true });
      }
      
      // Load market data
      const market = fs.existsSync(marketPath) ? JSON.parse(fs.readFileSync(marketPath)) : {};
      const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath)) : {};
      
      if (market[symbol]) {
        return interaction.reply({ content: `Stock ${symbol} already exists!`, ephemeral: true });
      }
      
      // Add stock
      market[symbol] = { price, lastChange: 0 };
      meta[symbol] = { volatility, italian };
      
      fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
      
      await interaction.reply({ 
        content: `✅ Added stock **${symbol}** at $${price.toFixed(2)} (${volatility} volatility${italian ? ', Italian' : ''})`,
        ephemeral: true 
      });
      
    } else if (subcommand === 'removestock') {
      const symbol = interaction.options.getString('symbol').toUpperCase();
      
      const market = fs.existsSync(marketPath) ? JSON.parse(fs.readFileSync(marketPath)) : {};
      const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath)) : {};
      
      if (!market[symbol]) {
        return interaction.reply({ content: `Stock ${symbol} does not exist!`, ephemeral: true });
      }
      
      delete market[symbol];
      delete meta[symbol];
      
      fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
      
      await interaction.reply({ 
        content: `🗑️ Removed stock **${symbol}** from the market`,
        ephemeral: true 
      });
      
    } else if (subcommand === 'setprice') {
      const symbol = interaction.options.getString('symbol').toUpperCase();
      const price = interaction.options.getNumber('price');
      
      if (price <= 0) {
        return interaction.reply({ content: 'Price must be positive!', ephemeral: true });
      }
      
      const market = fs.existsSync(marketPath) ? JSON.parse(fs.readFileSync(marketPath)) : {};
      
      if (!market[symbol]) {
        return interaction.reply({ content: `Stock ${symbol} does not exist!`, ephemeral: true });
      }
      
      const oldPrice = market[symbol].price;
      market[symbol].price = price;
      market[symbol].lastChange = ((price - oldPrice) / oldPrice) * 100;
      
      fs.writeFileSync(marketPath, JSON.stringify(market, null, 2));
      
      await interaction.reply({ 
        content: `💰 Set **${symbol}** price to $${price.toFixed(2)} (was $${oldPrice.toFixed(2)})`,
        ephemeral: true 
      });
      
    } else if (subcommand === 'givemoney') {
      const targetUser = interaction.options.getUser('user');
      const amount = interaction.options.getNumber('amount');
      
      const user = await getUser(targetUser.id); // ✅ Fixed to use async
      await updateUserBalance(targetUser.id, user.balance + amount); // ✅ Fixed to use async
      
      await interaction.reply({ 
        content: `💸 Gave $${amount.toFixed(2)} to ${targetUser.displayName}. New balance: $${(user.balance + amount).toFixed(2)}`,
        ephemeral: true 
      });
    }
  }
};
