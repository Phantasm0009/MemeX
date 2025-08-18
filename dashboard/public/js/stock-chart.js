class StockChartManager {
    constructor() {
        this.chart = null;
        this.currentStock = null;
        this.currentTimeframe = '24h';
        this.stockData = {};
        this.priceHistory = [];
    }

    async init() {
        // Get stock symbol from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.currentStock = urlParams.get('symbol');
        
        if (!this.currentStock) {
            window.location.href = '/dashboard';
            return;
        }

        await this.loadStockData();
        this.initChart();
        this.startDataRefresh();
    }

    async loadStockData() {
        try {
            // Load market data
            const marketResponse = await fetch('/api/dashboard/market');
            
            if (!marketResponse.ok) {
                throw new Error(`Backend API error: ${marketResponse.status}`);
            }
            
            const marketData = await marketResponse.json();
            
            if (!marketData || !marketData.stocks) {
                throw new Error('Invalid market data format');
            }
            
            if (!marketData.stocks[this.currentStock]) {
                // Show available stocks if current stock not found
                const availableStocks = Object.keys(marketData.stocks);
                if (availableStocks.length > 0) {
                    this.currentStock = availableStocks[0];
                    this.stockData = marketData.stocks[this.currentStock];
                } else {
                    throw new Error('No stocks available');
                }
            } else {
                this.stockData = marketData.stocks[this.currentStock];
            }
            
            this.updateStockHeader();
            this.generatePriceHistory();
            
        } catch (error) {
            console.error('Error loading stock data:', error);
            this.showError(`Failed to load stock data: ${error.message}`);
        }
    }

    updateStockHeader() {
        const stock = this.stockData;
        const meta = stock.meta || {};
        
        // Basic info
        document.getElementById('stock-symbol').textContent = this.currentStock;
        document.getElementById('stock-name').textContent = meta.italianName || stock.name || `Stock ${this.currentStock}`;
        document.getElementById('stock-description').textContent = meta.description || 'No description available';
        
        // Price info
        const price = stock.price || 0;
        const change = stock.lastChange || 0;
        
        document.getElementById('stock-price').textContent = `$${price.toFixed(2)}`;
        
        const changeElement = document.getElementById('stock-change');
        const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeElement.textContent = changeText;
        changeElement.className = `text-lg font-semibold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`;
        
        // Add Italian flag for Italian stocks
        const flagElement = document.getElementById('stock-flag');
        if (meta.coreItalian) {
            flagElement.textContent = '🇮🇹';
        }
        
        // Stats
        this.updateQuickStats(stock);
        this.updateMarketEvents();
    }

    updateQuickStats(stock) {
        const price = stock.price || 0;
        const change = stock.lastChange || 0;
        
        // Calculate 24h high/low based on current price and change
        const dayHigh = price * (1 + Math.abs(change) / 100);
        const dayLow = price * (1 - Math.abs(change) / 100);
        
        document.getElementById('stock-high').textContent = `$${dayHigh.toFixed(2)}`;
        document.getElementById('stock-low').textContent = `$${dayLow.toFixed(2)}`;
        
        // Volatility
        const volatility = stock.meta?.volatility || 'Medium';
        document.getElementById('stock-volatility').textContent = volatility;
        
        // Market cap (simulated)
        const marketCap = price * 1000000; // Simulate market cap
        document.getElementById('stock-market-cap').textContent = `$${this.formatNumber(marketCap)}`;
        
        // Volume (simulated)
        const volume = Math.floor(Math.random() * 100000) + 10000;
        document.getElementById('stock-volume').textContent = `Volume: ${this.formatNumber(volume)}`;
    }

    generatePriceHistory() {
        const currentPrice = this.stockData.price || 10;
        const baseChange = this.stockData.lastChange || 0;
        
        // Generate realistic price history
        this.priceHistory = [];
        const timeframes = {
            '1h': { points: 60, interval: 1 },      // 60 points, 1 minute each
            '24h': { points: 24, interval: 60 },    // 24 points, 1 hour each  
            '7d': { points: 7, interval: 1440 },    // 7 points, 1 day each
            '30d': { points: 30, interval: 1440 }   // 30 points, 1 day each
        };
        
        const config = timeframes[this.currentTimeframe];
        const now = Date.now();
        
        for (let i = config.points - 1; i >= 0; i--) {
            const timestamp = now - (i * config.interval * 60 * 1000);
            
            // Create realistic price movement
            const timeProgress = (config.points - 1 - i) / (config.points - 1);
            const volatility = this.getVolatilityMultiplier();
            const randomWalk = (Math.random() - 0.5) * volatility;
            const trendComponent = (baseChange / 100) * timeProgress;
            
            let priceMultiplier = 1 + trendComponent + randomWalk;
            priceMultiplier = Math.max(0.5, Math.min(1.5, priceMultiplier)); // Limit extreme values
            
            const price = currentPrice * priceMultiplier;
            
            this.priceHistory.push({
                timestamp,
                price: Math.max(0.01, price), // Ensure positive price
                volume: Math.floor(Math.random() * 50000) + 5000
            });
        }
        
        // Ensure the last price matches current price
        if (this.priceHistory.length > 0) {
            this.priceHistory[this.priceHistory.length - 1].price = currentPrice;
        }
    }

    getVolatilityMultiplier() {
        const volatilityMap = {
            'Low': 0.02,
            'Medium': 0.05,
            'High': 0.08,
            'Extreme': 0.12
        };
        
        const volatility = this.stockData.meta?.volatility || 'Medium';
        return volatilityMap[volatility] || 0.05;
    }

    initChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        const labels = this.priceHistory.map(point => {
            const date = new Date(point.timestamp);
            if (this.currentTimeframe === '1h') {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (this.currentTimeframe === '24h') {
                return date.toLocaleTimeString([], { hour: '2-digit' });
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        });

        const prices = this.priceHistory.map(point => point.price);
        const firstPrice = prices[0];
        const lastPrice = prices[prices.length - 1];
        const isPositive = lastPrice >= firstPrice;

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${this.currentStock} Price`,
                    data: prices,
                    borderColor: isPositive ? '#10b981' : '#ef4444',
                    backgroundColor: isPositive 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.2,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: isPositive ? '#10b981' : '#ef4444',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: isPositive ? '#10b981' : '#ef4444',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `Price: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: (value) => `$${value.toFixed(2)}`
                        }
                    }
                }
            }
        });
    }

    updateMarketEvents() {
        const eventsContainer = document.getElementById('market-events');
        
        // Simulate market events related to this stock
        const events = [
            {
                icon: 'fas fa-pizza-slice',
                text: 'Global Pizza Day affecting prices',
                color: 'text-orange-400',
                time: '2 hours ago'
            },
            {
                icon: 'fas fa-trending-up',
                text: `${this.currentStock} trending on social media`,
                color: 'text-green-400',
                time: '4 hours ago'
            },
            {
                icon: 'fas fa-globe',
                text: 'Market volatility increased',
                color: 'text-yellow-400',
                time: '6 hours ago'
            }
        ];

        eventsContainer.innerHTML = events.map(event => `
            <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div class="flex items-center space-x-3">
                    <i class="${event.icon} ${event.color}"></i>
                    <div class="text-sm text-gray-300">${event.text}</div>
                </div>
                <div class="text-xs text-gray-500">${event.time}</div>
            </div>
        `).join('');
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    showError(message) {
        // You can implement a toast notification here
        console.error(message);
    }

    startDataRefresh() {
        // Refresh data every 30 minutes (1800000ms)
        setInterval(() => {
            this.loadStockData();
            if (this.chart) {
                this.generatePriceHistory();
                this.updateChart();
            }
        }, 1800000);
    }

    updateChart() {
        if (!this.chart) return;

        const labels = this.priceHistory.map(point => {
            const date = new Date(point.timestamp);
            if (this.currentTimeframe === '1h') {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else if (this.currentTimeframe === '24h') {
                return date.toLocaleTimeString([], { hour: '2-digit' });
            } else {
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        });

        const prices = this.priceHistory.map(point => point.price);
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = prices;
        this.chart.update('none');
    }
}

// Global functions
window.changeTimeframe = function(timeframe) {
    if (window.stockChartManager) {
        window.stockChartManager.currentTimeframe = timeframe;
        
        // Update button states
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-600');
            btn.classList.add('bg-slate-700');
        });
        
        const activeBtn = document.querySelector(`[data-timeframe="${timeframe}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-slate-700');
            activeBtn.classList.add('active', 'bg-blue-600');
        }
        
        window.stockChartManager.generatePriceHistory();
        window.stockChartManager.updateChart();
    }
};

window.refreshStockData = async function() {
    if (window.stockChartManager) {
        await window.stockChartManager.loadStockData();
        window.stockChartManager.generatePriceHistory();
        window.stockChartManager.updateChart();
    }
};

window.executeTrade = function(type) {
    const amount = document.getElementById('trade-amount').value;
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const stock = window.stockChartManager?.currentStock;
    if (!stock) return;
    
    const command = type === 'buy' 
        ? `/buy stock:${stock} amount:${amount}`
        : `/sell stock:${stock} amount:${amount}`;
    
    // Copy command to clipboard
    navigator.clipboard.writeText(command).then(() => {
        alert(`Command copied to clipboard:\n${command}\n\nPaste this in Discord to execute the trade!`);
    }).catch(() => {
        alert(`Use this command in Discord:\n${command}`);
    });
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.stockChartManager = new StockChartManager();
    window.stockChartManager.init();
});
