import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Simplified test for resistance mechanics without external API calls
console.log('🧪 Testing Soft Resistance Mechanic (Offline Mode)\n');

// Load current prices
const marketPath = path.join(process.cwd(), 'market.json');
const market = JSON.parse(fs.readFileSync(marketPath, 'utf8'));

// Helper functions from priceUpdater.js
function getResistanceZone(currentPrice, maxPrice) {
    const priceRatio = currentPrice / maxPrice;
    if (priceRatio >= 0.95) return 'extreme';
    if (priceRatio >= 0.80) return 'high';
    if (priceRatio >= 0.60) return 'medium';
    return 'low';
}

function getResistanceEffects(zone) {
    const effects = {
        low: { volatilityMultiplier: 1.0, upwardBias: 0.0 },
        medium: { volatilityMultiplier: 0.8, upwardBias: -0.5 },
        high: { volatilityMultiplier: 0.5, upwardBias: -1.5 },
        extreme: { volatilityMultiplier: 0.2, upwardBias: -3.0 }
    };
    return effects[zone];
}

// Max prices from market.json
const maxPrices = {
    SKIBI: 750, SUS: 300, SAHUR: 1200, LABUB: 5000, OHIO: 800,
    RIZZL: 400, GYATT: 250, FRIED: 150, SIGMA: 900, TRALA: 700,
    CROCO: 500, FANUM: 350, CAPPU: 3000, BANANI: 450, LARILA: 3500
};

console.log('📊 Current Resistance Zone Analysis:\n');

for (const [symbol, data] of Object.entries(market)) {
    if (!data || typeof data.price !== 'number') continue;
    
    const currentPrice = data.price;
    const maxPrice = maxPrices[symbol];
    if (!maxPrice) continue;
    
    const zone = getResistanceZone(currentPrice, maxPrice);
    const effects = getResistanceEffects(zone);
    const priceRatio = (currentPrice / maxPrice * 100).toFixed(1);
    
    console.log(`${symbol}: $${currentPrice.toFixed(2)} / $${maxPrice} (${priceRatio}%)`);
    console.log(`  Zone: ${zone.toUpperCase()} | Volatility: ${(effects.volatilityMultiplier * 100).toFixed(0)}% | Bias: ${effects.upwardBias}%`);
    console.log('');
}

// Simulate price changes with resistance
console.log('🔮 Simulating Price Changes with Resistance:\n');

const testStocks = ['SKIBI', 'LABUB', 'SIGMA'];

for (const symbol of testStocks) {
    console.log(`--- Testing ${symbol} ---`);
    const stockData = market[symbol];
    if (!stockData || typeof stockData.price !== 'number') {
        console.log(`  ❌ Invalid data for ${symbol}`);
        continue;
    }
    
    let price = stockData.price;
    const maxPrice = maxPrices[symbol];
    
    console.log(`Starting: $${price.toFixed(2)}`);
    
    for (let i = 1; i <= 5; i++) {
        // Simulate a base upward trend
        const baseTrend = 0.05; // 5% upward trend
        const baseVolatility = 0.08; // 8% max volatility
        
        const zone = getResistanceZone(price, maxPrice);
        const effects = getResistanceEffects(zone);
        
        // Apply resistance effects
        const adjustedVolatility = baseVolatility * effects.volatilityMultiplier;
        const adjustedTrend = baseTrend + (effects.upwardBias / 100);
        
        // Random price change
        const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
        const volatilityChange = randomFactor * adjustedVolatility;
        const totalChange = adjustedTrend + volatilityChange;
        
        const oldPrice = price;
        price = Math.max(0.01, price * (1 + totalChange));
        
        const changePercent = ((price - oldPrice) / oldPrice * 100);
        const priceRatio = (price / maxPrice * 100).toFixed(1);
        
        console.log(`  Update ${i}: $${oldPrice.toFixed(2)} → $${price.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%) | Zone: ${zone} | Ratio: ${priceRatio}%`);
    }
    console.log('');
}

console.log('✅ Resistance mechanic test complete!');
console.log('\n📝 Observations:');
console.log('- Higher resistance zones should show smaller price increases');
console.log('- Extreme zones should show negative bias (downward pressure)');
console.log('- Volatility should decrease as prices approach max values');
