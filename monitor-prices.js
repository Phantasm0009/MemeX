#!/usr/bin/env node

// 📊 Price Monitoring Script for Stability Testing
// This script monitors price changes and alerts if volatility gets too high

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const marketPath = path.join(__dirname, 'market.json');

function monitorPrices() {
  if (!fs.existsSync(marketPath)) {
    console.log('❌ Market data not found');
    return;
  }

  const market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
  
  console.log('📊 Current Market Status:');
  console.log('========================');
  
  let totalValue = 0;
  let highPriceWarnings = 0;
  let extremeVolatility = 0;
  
  for (const [symbol, data] of Object.entries(market)) {
    if (symbol === 'lastEvent') continue;
    
    const price = data.price || 0;
    const change = data.lastChange || 0;
    totalValue += price;
    
    // Check for high prices
    if (price > 100) {
      highPriceWarnings++;
      console.log(`⚠️  ${symbol}: $${price.toFixed(2)} (HIGH PRICE WARNING)`);
    } else if (price > 50) {
      console.log(`🟡 ${symbol}: $${price.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`);
    } else {
      console.log(`✅ ${symbol}: $${price.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(1)}%)`);
    }
    
    // Check for extreme volatility
    if (Math.abs(change) > 10) {
      extremeVolatility++;
    }
  }
  
  console.log('========================');
  console.log(`💰 Total Market Value: $${totalValue.toFixed(2)}`);
  console.log(`⚠️  High Price Warnings: ${highPriceWarnings}`);
  console.log(`🌪️  Extreme Volatility Count: ${extremeVolatility}`);
  
  if (highPriceWarnings > 0) {
    console.log('\n🚨 RECOMMENDATION: Consider running admin resetmarket command');
  }
  
  if (extremeVolatility > 3) {
    console.log('\n🎢 VOLATILITY ALERT: Market experiencing high volatility');
  }
  
  if (highPriceWarnings === 0 && extremeVolatility <= 1) {
    console.log('\n✅ MARKET STATUS: Stable and healthy');
  }
}

// Run monitoring
console.log('🔍 MemeX Market Price Monitor\n');
monitorPrices();
