import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { AttachmentBuilder } from 'discord.js';

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

export async function createPriceChart(stockSymbol, priceHistory, italianName = '') {
  // Prepare data
  const sortedHistory = priceHistory.sort((a, b) => a.timestamp - b.timestamp);
  const labels = sortedHistory.map(point => {
    const date = new Date(point.timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  });
  
  const prices = sortedHistory.map(point => point.price);
  
  // Calculate price change
  const firstPrice = prices[0] || 0;
  const lastPrice = prices[prices.length - 1] || 0;
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  // Determine colors
  const lineColor = priceChange >= 0 ? '#00ff41' : '#ff4757';
  const backgroundColor = priceChange >= 0 ? 'rgba(0, 255, 65, 0.1)' : 'rgba(255, 71, 87, 0.1)';
  
  const configuration = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${stockSymbol} Price`,
        data: prices,
        borderColor: lineColor,
        backgroundColor: backgroundColor,
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointBackgroundColor: lineColor,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: `📈 ${stockSymbol} ${italianName ? `(${italianName})` : ''} - Price History`,
          font: {
            size: 18,
            weight: 'bold'
          },
          color: '#ffffff'
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            maxTicksLimit: 8
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            callback: function(value) {
              return '$' + value.toFixed(4);
            }
          }
        }
      },
      backgroundColor: '#2c2f33',
      elements: {
        point: {
          hoverBackgroundColor: '#ffffff'
        }
      }
    },
    plugins: [{
      id: 'backgroundPlugin',
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#2c2f33';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    }]
  };
  
  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const attachment = new AttachmentBuilder(imageBuffer, { 
      name: `${stockSymbol.toLowerCase()}-chart.png` 
    });
    
    return {
      attachment,
      priceChange: priceChange.toFixed(2),
      currentPrice: lastPrice,
      dataPoints: prices.length
    };
  } catch (error) {
    console.error('Chart generation error:', error);
    throw new Error('Failed to generate price chart');
  }
}

export async function createPortfolioChart(holdings, stockPrices) {
  const portfolioData = holdings.map(holding => {
    const price = stockPrices[holding.stock] || 0;
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
  
  const labels = portfolioData.map(item => item.stock);
  const values = portfolioData.map(item => item.value);
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  
  // Generate colors
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9',
    '#f8c471', '#82e0aa', '#f1948a', '#85c1e9', '#d7bde2'
  ];
  
  const configuration = {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#2c2f33',
        borderWidth: 3,
        hoverBorderWidth: 5
      }]
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: `💼 Portfolio Distribution - $${totalValue.toFixed(2)} Total`,
          font: {
            size: 18,
            weight: 'bold'
          },
          color: '#ffffff'
        },
        legend: {
          position: 'right',
          labels: {
            color: '#ffffff',
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const percentage = ((value / totalValue) * 100).toFixed(1);
                  return {
                    text: `${label}: $${value.toFixed(2)} (${percentage}%)`,
                    fillStyle: data.datasets[0].backgroundColor[i],
                    strokeStyle: data.datasets[0].borderColor,
                    lineWidth: data.datasets[0].borderWidth,
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const percentage = ((value / totalValue) * 100).toFixed(1);
              const holding = portfolioData[context.dataIndex];
              return [
                `${label}: $${value.toFixed(2)} (${percentage}%)`,
                `Amount: ${holding.amount} shares`,
                `Price: $${holding.price.toFixed(4)}`
              ];
            }
          }
        }
      }
    },
    plugins: [{
      id: 'backgroundPlugin',
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#2c2f33';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    }]
  };
  
  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const attachment = new AttachmentBuilder(imageBuffer, { 
      name: 'portfolio-chart.png' 
    });
    
    return {
      attachment,
      totalValue,
      holdings: portfolioData.length
    };
  } catch (error) {
    console.error('Portfolio chart generation error:', error);
    throw new Error('Failed to generate portfolio chart');
  }
}

export async function createMarketOverviewChart(marketData) {
  const stocks = Object.keys(marketData).filter(key => key !== 'lastEvent');
  const prices = stocks.map(stock => marketData[stock].price);
  const changes = stocks.map(stock => marketData[stock].lastChange || 0);
  
  // Sort by price change
  const stockData = stocks.map((stock, i) => ({
    stock,
    price: prices[i],
    change: changes[i]
  })).sort((a, b) => b.change - a.change);
  
  const sortedStocks = stockData.map(item => item.stock);
  const sortedChanges = stockData.map(item => item.change);
  
  // Color based on change
  const colors = sortedChanges.map(change => {
    if (change > 5) return '#00ff41';
    if (change > 0) return '#90EE90';
    if (change < -5) return '#ff4757';
    if (change < 0) return '#ffcccb';
    return '#ffff00';
  });
  
  const configuration = {
    type: 'bar',
    data: {
      labels: sortedStocks,
      datasets: [{
        label: 'Price Change (%)',
        data: sortedChanges,
        backgroundColor: colors,
        borderColor: colors.map(color => color),
        borderWidth: 2
      }]
    },
    options: {
      responsive: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: '🇮🇹 Italian Meme Stock Market Overview',
          font: {
            size: 18,
            weight: 'bold'
          },
          color: '#ffffff'
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff',
            callback: function(value) {
              return value.toFixed(1) + '%';
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#ffffff'
          }
        }
      }
    },
    plugins: [{
      id: 'backgroundPlugin',
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#2c2f33';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    }]
  };
  
  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    const attachment = new AttachmentBuilder(imageBuffer, { 
      name: 'market-overview.png' 
    });
    
    const positiveStocks = sortedChanges.filter(change => change > 0).length;
    const negativeStocks = sortedChanges.filter(change => change < 0).length;
    
    return {
      attachment,
      positiveStocks,
      negativeStocks,
      totalStocks: stocks.length
    };
  } catch (error) {
    console.error('Market overview chart generation error:', error);
    throw new Error('Failed to generate market overview chart');
  }
}
