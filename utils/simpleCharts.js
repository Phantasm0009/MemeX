// Simple text-based chart generator for Discord embeds
// Replaces canvas-based charts for Windows compatibility

export function createPriceChart(stockSymbol, priceHistory, italianName = '') {
  const sortedHistory = priceHistory.sort((a, b) => a.timestamp - b.timestamp);
  const prices = sortedHistory.map(point => point.price);
  
  if (prices.length < 2) {
    return {
      chart: '� Not enough data for chart',
      priceChange: '0.00',
      currentPrice: prices[0] || 0,
      dataPoints: prices.length
    };
  }
  
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  // Generate simple ASCII chart
  const chartHeight = 6;
  const chartWidth = Math.min(prices.length, 25);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 0.01;
  
  let chart = '```\n';
  
  // Create the chart using simple ASCII characters
  for (let row = chartHeight - 1; row >= 0; row--) {
    const threshold = minPrice + (priceRange * row / (chartHeight - 1));
    let line = '';
    
    for (let col = 0; col < chartWidth; col++) {
      const priceIndex = Math.floor((col / chartWidth) * prices.length);
      const price = prices[priceIndex];
      
      if (price >= threshold - (priceRange / chartHeight / 2) && price <= threshold + (priceRange / chartHeight / 2)) {
        line += priceChange >= 0 ? '*' : 'o';
      } else if (price > threshold) {
        line += '█';
      } else {
        line += '·';
      }
    }
    chart += line + '\n';
  }
  
  chart += '```';
  
  return {
    chart: chart,
    priceChange: priceChange.toFixed(2),
    currentPrice: lastPrice,
    dataPoints: prices.length
  };
}

export function createPortfolioChart(holdings, stockPrices) {
  const portfolioData = holdings.map(holding => {
    const price = stockPrices[holding.stock]?.price || 0;
    const value = holding.amount * price;
    return {
      stock: holding.stock,
      value: value,
      amount: holding.amount,
      price: price
    };
  });
  
  // Sort by value descending
  portfolioData.sort((a, b) => b.value - a.value);
  
  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
  
  if (totalValue === 0) {
    return {
      chart: 'No holdings to chart',
      totalValue: 0,
      holdings: 0
    };
  }
  
  // Create text chart
  let chart = '**Portfolio Distribution:**\n';
  
  for (const item of portfolioData.slice(0, 10)) { // Top 10 holdings
    const percentage = (item.value / totalValue) * 100;
    const barLength = Math.round(percentage / 2); // Scale to fit
    const bar = '█'.repeat(barLength) + '░'.repeat(Math.max(0, 50 - barLength));
    
    chart += `${item.stock}: ${percentage.toFixed(1)}% ($${item.value.toFixed(2)})\n`;
    chart += `\`${bar}\`\n`;
  }
  
  return {
    chart: chart,
    totalValue,
    holdings: portfolioData.length
  };
}

export function createMarketOverviewChart(marketData) {
  const stocks = Object.keys(marketData).filter(key => key !== 'lastEvent');
  const changes = stocks.map(stock => marketData[stock].lastChange || 0);
  
  // Sort by change
  const stockData = stocks.map((stock, i) => ({
    stock,
    change: changes[i]
  })).sort((a, b) => b.change - a.change);
  
  let chart = '**Market Performance:**\n';
  
  for (const item of stockData) {
    const change = item.change;
    const absChange = Math.abs(change);
    const barLength = Math.min(Math.round(absChange), 20);
    
    let emoji = '➡️';
    let bar = '';
    
    if (change > 0) {
      emoji = change > 5 ? '🚀' : '📈';
      bar = '█'.repeat(barLength);
    } else if (change < 0) {
      emoji = change < -5 ? '💥' : '📉';
      bar = '▓'.repeat(barLength);
    }
    
    chart += `${emoji} ${item.stock}: ${change > 0 ? '+' : ''}${change.toFixed(1)}%\n`;
    if (bar) {
      chart += `\`${bar}\`\n`;
    }
  }
  
  const positiveStocks = stockData.filter(item => item.change > 0).length;
  const negativeStocks = stockData.filter(item => item.change < 0).length;
  
  return {
    chart: chart,
    positiveStocks,
    negativeStocks,
    totalStocks: stocks.length
  };
}
