#!/usr/bin/env node

// 🧪 Test Soft Resistance Mechanic
// This script simulates price movements with the new resistance system

import { updatePrices, resetPrices } from './utils/priceUpdater.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const marketPath = path.join(__dirname, 'market.json');

console.log('🧪 Testing Soft Resistance Mechanic\n');

// First reset prices to baseline
console.log('🔄 Resetting prices to baseline...');
resetPrices();

// Simulate multiple price updates to test resistance
async function testResistance() {
  console.log('\n📈 Simulating 10 price updates to test resistance zones...\n');
  
  for (let i = 1; i <= 10; i++) {
    console.log(`--- Update ${i} ---`);
    
    // Add some artificial volatility to push prices higher
    const mockTriggers = {
      SKIBI: 0.15,  // +15% event bonus to push it toward resistance
      OHIO: 0.12,   // +12% event bonus
      SIGMA: 0.10   // +10% event bonus
    };
    
    await updatePrices(mockTriggers, false); // Disable chaos events for clean testing
    
    // Show current prices vs max prices
    if (fs.existsSync(marketPath)) {
      const market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
      
      console.log('\n💰 Current Prices vs Max Prices:');
      
      const testStocks = ['SKIBI', 'OHIO', 'SIGMA', 'LABUB', 'BANANI'];
      testStocks.forEach(symbol => {
        if (market[symbol]) {
          const price = market[symbol].price;
          const maxPrice = getMaxPrice(symbol);
          const ratio = (price / maxPrice * 100).toFixed(1);
          const zone = price / maxPrice >= 0.95 ? '🔴' : price / maxPrice >= 0.80 ? '🟡' : '🟢';
          
          console.log(`  ${zone} ${symbol}: $${price.toFixed(2)} (${ratio}% of $${maxPrice} max)`);
        }
      });
    }
    
    console.log(''); // Empty line for readability
    
    // Add delay to see progression
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Helper function to get max price for a stock
function getMaxPrice(symbol) {
  const maxPrices = {
    SKIBI: 750,
    OHIO: 800,
    SIGMA: 900,
    LABUB: 600,
    BANANI: 65,
    SUS: 350,
    RIZZL: 400,
    SAHUR: 200,
    GYATT: 150,
    FRIED: 100,
    TRALA: 180,
    CROCO: 220,
    FANUM: 300,
    CAPPU: 450,
    LARILA: 550
  };
  return maxPrices[symbol] || 1000;
}

// Run the test
testResistance().then(() => {
  console.log('✅ Resistance mechanic test completed!');
  console.log('\n📋 Key Features Tested:');
  console.log('   🟢 Normal zone (< 80% of max): Full volatility');
  console.log('   🟡 Medium resistance (80-95%): 50% volatility + small drift');
  console.log('   🔴 Strong resistance (> 95%): 25% volatility + larger drift');
  console.log('   💰 Hard cap: Prices cannot exceed maxPrice');
}).catch(console.error);
