class DashboardManager {
    constructor() {
        this.socket = null;
        this.marketData = {};
        this.lastUpdate = null;
        this.isConnected = false;
        
        this.init();
    }

    async init() {
        this.initializeSocket();
        await this.loadDashboardData();
        this.startPeriodicUpdates();
        this.updateTimestamp();
    }

    initializeSocket() {
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                this.isConnected = true;
                this.updateConnectionStatus('online', 'Live');
            });
            
            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.updateConnectionStatus('offline', 'Offline');
            });
            
            this.socket.on('market-update', (data) => {
                this.marketData = data;
                this.updateMarketDisplay();
            });
            
        } catch (error) {
            console.log('Socket.IO not available, using polling');
            this.updateConnectionStatus('warning', 'Polling');
        }
    }

    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;
        
        const indicator = statusElement.querySelector('div');
        const textElement = statusElement.querySelector('span');
        
        // Update indicator
        indicator.className = `w-2 h-2 rounded-full mr-2 ${this.getStatusClass(status)}`;
        
        // Update text
        textElement.textContent = text;
        
        // Update backend status
        const backendStatus = document.getElementById('backend-status');
        if (backendStatus) {
            backendStatus.textContent = status === 'online' ? 'Healthy' : 'Checking...';
            backendStatus.className = `text-sm font-semibold ${status === 'online' ? 'text-green-400' : 'text-yellow-400'}`;
        }
    }

    getStatusClass(status) {
        const classes = {
            'online': 'bg-green-500 animate-pulse',
            'offline': 'bg-red-500 animate-pulse',
            'warning': 'bg-yellow-500 animate-pulse'
        };
        return classes[status] || 'bg-gray-500';
    }

    async loadDashboardData() {
        try {
            const [overviewResponse, marketResponse] = await Promise.all([
                fetch('/api/dashboard/overview'),
                fetch('/api/dashboard/market')
            ]);
            
            if (overviewResponse.ok && marketResponse.ok) {
                const overviewData = await overviewResponse.json();
                const marketData = await marketResponse.json();
                
                this.updateMarketOverview(overviewData);
                this.updateStocksGrid(marketData);
                this.lastUpdate = new Date();
                
                if (!this.isConnected) {
                    this.updateConnectionStatus('warning', 'API Only');
                }
            } else {
                throw new Error('Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
            this.updateConnectionStatus('offline', 'Error');
        }
    }

    updateMarketOverview(data) {
        this.safeUpdateElement('market-cap', `$${data.marketStats.marketCap}`);
        this.safeUpdateElement('active-traders', data.userStats.totalUsers);
        this.safeUpdateElement('total-stocks', data.marketStats.totalStocks);
        this.safeUpdateElement('gainers-count', data.marketStats.gainers);
        this.safeUpdateElement('losers-count', data.marketStats.losers);
        this.safeUpdateElement('neutral-count', data.marketStats.neutral);
        this.safeUpdateElement('latest-event', data.lastEvent);
    }

    updateStocksGrid(marketData) {
        const grid = document.getElementById('stocks-grid');
        if (!grid) return;
        
        // Use stocksList if available, otherwise fall back to direct array
        const stocks = marketData.stocksList || marketData;
        if (!Array.isArray(stocks)) {
            console.error('Expected stocks array, got:', stocks);
            return;
        }
        
        let stocksHTML = '';
        
        stocks.forEach(stock => {
            const changeColor = this.getPriceChangeColor(stock.change);
            const changeEmoji = this.getPriceChangeEmoji(stock.change);
            const volatilityClass = `volatility-${stock.volatility}`;
            
            stocksHTML += `
                <div class="stock-card animate-fade-in-up cursor-pointer hover:bg-slate-700/40 transition-colors" onclick="navigateToStock('${stock.symbol}')">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="flex flex-col">
                                <div class="flex items-center space-x-2">
                                    <span class="text-lg font-bold">${stock.symbol}</span>
                                    ${stock.italian ? '<span class="text-sm">🇮🇹</span>' : ''}
                                    ${stock.coreItalian ? '<span class="text-sm">⭐</span>' : ''}
                                </div>
                                <p class="text-sm text-slate-400">${stock.italianName || stock.name}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center justify-end space-x-2 mb-1">
                                <span class="text-lg font-bold">$${stock.price.toFixed(4)}</span>
                                <span class="text-lg">${changeEmoji}</span>
                            </div>
                            <div class="flex items-center justify-end space-x-2">
                                <span class="trend-indicator ${changeColor}">
                                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                                </span>
                                <span class="${volatilityClass}">${stock.volatility.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-2 pt-2 border-t border-slate-600/20 text-xs text-slate-500 text-center stock-card-hover-text">
                        Click to view detailed chart
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = stocksHTML;
    }

    getPriceChangeColor(change) {
        if (change > 0) return 'price-positive';
        if (change < 0) return 'price-negative';
        return 'price-neutral';
    }

    getPriceChangeEmoji(change) {
        if (change > 10) return '🚀';
        if (change > 5) return '📈';
        if (change > 0) return '⬆️';
        if (change < -10) return '💥';
        if (change < -5) return '📉';
        if (change < 0) return '⬇️';
        return '➡️';
    }

    safeUpdateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    updateTimestamp() {
        const updateElement = document.getElementById('last-update');
        if (updateElement) {
            updateElement.textContent = new Date().toLocaleTimeString();
        }
        
        // Update every second
        setTimeout(() => this.updateTimestamp(), 1000);
    }

    startPeriodicUpdates() {
        // Refresh data every 30 minutes (1800000ms)
        setInterval(() => {
            this.loadDashboardData();
        }, 1800000);
    }

    showError(message) {
        console.error('Dashboard Error:', message);
        // You can implement toast notifications here
    }

    updateMarketDisplay() {
        // Called when socket receives market update
        this.lastUpdate = new Date();
        // Re-render the market data if needed
    }
}

// Global functions
window.refreshMarketData = async function() {
    if (window.dashboardManager) {
        await window.dashboardManager.loadDashboardData();
    }
};

window.navigateToStock = function(symbol) {
    window.location.href = `/stock?symbol=${symbol}`;
};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new DashboardManager();
});