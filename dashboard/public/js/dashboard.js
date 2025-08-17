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
            console.log('🔄 Loading dashboard data from enhanced backend...');
            
            // Use enhanced backend endpoints
            const [marketResponse, stocksResponse] = await Promise.all([
                fetch('/api/market'),
                fetch('/api/stocks')
            ]);
            
            if (marketResponse.ok && stocksResponse.ok) {
                const marketData = await marketResponse.json();
                const stocksData = await stocksResponse.json();
                
                console.log('📊 Enhanced market data received:', marketData);
                console.log('📈 Enhanced stocks data received:', stocksData);
                
                // Handle new enhanced API structure
                if (marketData.market) {
                    // New enhanced API format
                    this.marketData = marketData.market;
                    this.marketStats = marketData.stats;
                    this.globalEvents = marketData.globalEvents;
                    this.lastUpdate = new Date(marketData.lastUpdate);
                } else {
                    // Fallback to old format
                    this.marketData = marketData;
                    this.lastUpdate = new Date();
                }
                
                // Handle stocks metadata
                if (stocksData.stocks && stocksData.meta) {
                    this.stocksMetadata = stocksData.meta;
                    // Merge market data with stocks metadata
                    Object.keys(this.marketData).forEach(symbol => {
                        if (stocksData.stocks[symbol]) {
                            this.marketData[symbol] = {
                                ...this.marketData[symbol],
                                ...stocksData.stocks[symbol]
                            };
                        }
                    });
                }
                
                this.updateMarketOverview(this.marketData);
                this.updateStocksGrid(this.marketData);
                this.updateGlobalEvents();
                
                if (!this.isConnected) {
                    this.updateConnectionStatus('warning', 'Enhanced API');
                }
            } else {
                throw new Error('Failed to fetch enhanced backend data');
            }
        } catch (error) {
            console.error('❌ Failed to load enhanced dashboard data:', error);
            this.showError('Failed to load enhanced backend data');
            this.updateConnectionStatus('offline', 'Error');
        }
    }

    updateMarketOverview(marketData) {
        if (!marketData || Object.keys(marketData).length === 0) return;
        
        const stocks = Object.values(marketData);
        const totalStocks = stocks.length;
        
        // Calculate enhanced market statistics
        const totalValue = stocks.reduce((sum, stock) => sum + (stock.price || 0), 0);
        const avgPrice = totalValue / totalStocks;
        const totalVolume = stocks.reduce((sum, stock) => sum + (stock.volume || 0), 0);
        
        const gainers = stocks.filter(stock => (stock.change || 0) > 0).length;
        const losers = stocks.filter(stock => (stock.change || 0) < 0).length;
        const neutral = totalStocks - gainers - losers;
        
        // Update DOM elements with enhanced data
        this.safeUpdateElement('market-cap', `€${totalValue.toFixed(0)}`);
        this.safeUpdateElement('active-traders', this.marketStats?.activeTraders || 'N/A');
        this.safeUpdateElement('total-stocks', totalStocks);
        this.safeUpdateElement('gainers-count', gainers);
        this.safeUpdateElement('losers-count', losers);
        this.safeUpdateElement('neutral-count', neutral);
        
        // Update additional enhanced statistics if available
        if (this.marketStats) {
            this.safeUpdateElement('avg-price', `€${avgPrice.toFixed(2)}`);
            this.safeUpdateElement('total-volume', totalVolume.toLocaleString());
            this.safeUpdateElement('market-trend', this.marketStats.trend || 'Mixed');
            this.safeUpdateElement('volatility', this.marketStats.volatility || 'Medium');
        }
        
        // Update latest event info
        if (this.globalEvents && this.globalEvents.lastEventTime) {
            const lastEventDate = new Date(this.globalEvents.lastEventTime);
            const timeSince = Math.floor((Date.now() - lastEventDate.getTime()) / 60000);
            this.safeUpdateElement('latest-event', `Global event ${timeSince}m ago`);
        } else {
            this.safeUpdateElement('latest-event', 'No recent events');
        }
    }

    updateStocksGrid(marketData) {
        const grid = document.getElementById('stocks-grid');
        if (!grid) return;
        
        // Handle enhanced backend data format (object with symbol keys)
        let stocks;
        if (marketData && typeof marketData === 'object' && !Array.isArray(marketData)) {
            // Convert object to array of stocks with symbols
            stocks = Object.entries(marketData).map(([symbol, data]) => ({
                symbol,
                ...data
            }));
        } else if (Array.isArray(marketData)) {
            // Already an array
            stocks = marketData;
        } else if (marketData?.stocksList) {
            // Fallback to stocksList
            stocks = marketData.stocksList;
        } else {
            console.error('Invalid market data format:', marketData);
            return;
        }
        
        grid.innerHTML = '';
        
        stocks.forEach(stock => {
            const card = this.createEnhancedStockCard(stock);
            grid.appendChild(card);
        });
    }

    createEnhancedStockCard(stock) {
        const card = document.createElement('div');
        const changePercent = stock.change || 0;
        const priceClass = changePercent > 0 ? 'text-green-400' : changePercent < 0 ? 'text-red-400' : 'text-gray-400';
        const changeIcon = changePercent > 0 ? '↗' : changePercent < 0 ? '↘' : '→';
        
        // Get Italian name from metadata or use symbol
        const italianName = stock.italianName || this.stocksMetadata?.[stock.symbol]?.italianName || stock.symbol;
        const description = stock.description || this.stocksMetadata?.[stock.symbol]?.description || 'No description available';
        
        // Check if stock is frozen
        const isFrozen = this.globalEvents?.frozenStocks?.includes(stock.symbol) || stock.frozen;
        const frozenClass = isFrozen ? 'opacity-60 border-blue-500/50' : '';
        const frozenIndicator = isFrozen ? '<i class="fas fa-snowflake text-blue-400 ml-2"></i>' : '';
        
        card.className = `pro-card stock-card cursor-pointer transition-all duration-300 hover:scale-105 ${frozenClass}`;
        card.onclick = () => window.navigateToStock(stock.symbol);
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-white flex items-center">
                        ${stock.symbol}
                        ${frozenIndicator}
                    </h3>
                    <p class="text-sm text-gray-400">${italianName}</p>
                    <p class="text-xs text-gray-500 mt-1">${description}</p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold ${priceClass}">
                        €${(stock.price || 0).toFixed(2)}
                    </div>
                    <div class="text-sm ${priceClass} flex items-center justify-end">
                        ${changeIcon} ${changePercent.toFixed(2)}%
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-400">Volume:</span>
                    <span class="text-white ml-2">${(stock.volume || 0).toLocaleString()}</span>
                </div>
                <div>
                    <span class="text-gray-400">Last Update:</span>
                    <span class="text-white ml-2">${this.formatTime(stock.lastUpdate)}</span>
                </div>
            </div>
            
            ${isFrozen ? '<div class="mt-3 text-xs text-blue-300 bg-blue-500/20 rounded px-2 py-1">🧊 Trading Frozen</div>' : ''}
        `;
        
        return card;
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / 60000);
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    }

    // Add global events update function
    updateGlobalEvents() {
        const container = document.getElementById('global-events-container');
        if (!container || !this.globalEvents) return;
        
        let eventsHTML = '';
        
        // Frozen stocks
        if (this.globalEvents.frozenStocks && this.globalEvents.frozenStocks.length > 0) {
            eventsHTML += `
                <div class="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-2">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-snowflake text-blue-400"></i>
                        <span class="text-blue-300 font-medium">Frozen Stocks</span>
                    </div>
                    <div class="mt-1 text-sm text-blue-200">
                        ${this.globalEvents.frozenStocks.join(', ')} - Trading suspended
                    </div>
                </div>
            `;
        }
        
        // Active mergers
        if (this.globalEvents.activeMerges && this.globalEvents.activeMerges.length > 0) {
            eventsHTML += `
                <div class="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 mb-2">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-handshake text-purple-400"></i>
                        <span class="text-purple-300 font-medium">Active Mergers</span>
                    </div>
                    <div class="mt-1 text-sm text-purple-200">
                        ${this.globalEvents.activeMerges.length} merger(s) in progress
                    </div>
                </div>
            `;
        }
        
        if (eventsHTML === '') {
            eventsHTML = '<div class="text-gray-400 text-sm">No active global events</div>';
        }
        
        container.innerHTML = eventsHTML;
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