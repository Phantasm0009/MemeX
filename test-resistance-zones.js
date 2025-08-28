import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('🧪 Testing Resistance Zones at High Prices\n');

// Helper functions
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

// Test different resistance zones
const testScenarios = [
    { symbol: 'SKIBI', maxPrice: 750, testPrices: [50, 450, 600, 750] }, // 7%, 60%, 80%, 100%
    { symbol: 'LABUB', maxPrice: 5000, testPrices: [500, 3000, 4000, 4900] }, // 10%, 60%, 80%, 98%
];

for (const scenario of testScenarios) {
    console.log(`📈 Testing ${scenario.symbol} (Max: $${scenario.maxPrice})\n`);
    
    for (const testPrice of scenario.testPrices) {
        const zone = getResistanceZone(testPrice, scenario.maxPrice);
        const effects = getResistanceEffects(zone);
        const priceRatio = (testPrice / scenario.maxPrice * 100).toFixed(1);
        
        console.log(`💰 Price: $${testPrice} (${priceRatio}% of max) - Zone: ${zone.toUpperCase()}`);
        console.log(`   Effects: ${(effects.volatilityMultiplier * 100).toFixed(0)}% volatility, ${effects.upwardBias}% bias`);
        
        // Simulate 3 price updates
        let currentPrice = testPrice;
        for (let i = 1; i <= 3; i++) {
            const baseTrend = 0.05; // 5% upward trend
            const baseVolatility = 0.08; // 8% max volatility
            
            const adjustedVolatility = baseVolatility * effects.volatilityMultiplier;
            const adjustedTrend = baseTrend + (effects.upwardBias / 100);
            
            const randomFactor = (Math.random() - 0.5) * 2;
            const volatilityChange = randomFactor * adjustedVolatility;
            const totalChange = adjustedTrend + volatilityChange;
            
            const oldPrice = currentPrice;
            currentPrice = Math.max(0.01, currentPrice * (1 + totalChange));
            const changePercent = ((currentPrice - oldPrice) / oldPrice * 100);
            
            console.log(`   Update ${i}: $${oldPrice.toFixed(2)} → $${currentPrice.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)`);
        }
        console.log('');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

console.log('🎯 Key Observations:');
console.log('• LOW zone (0-60%): Full volatility, no resistance');
console.log('• MEDIUM zone (60-80%): 80% volatility, -0.5% downward bias');
console.log('• HIGH zone (80-95%): 50% volatility, -1.5% downward bias');
console.log('• EXTREME zone (95-100%): 20% volatility, -3.0% downward bias');
console.log('\n✅ Resistance creates natural price ceilings without hard caps!');
