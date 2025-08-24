// Simplified Trading Dashboard JavaScript
class TradingDashboard {
    constructor() {
        console.log('🚀 Initializing Trading Dashboard');
        this.isConnected = false;
        this.marketData = {};
        this.chartInstances = {};
        this.init();
    }

    async init() {
        try {
            await this.loadInitialData();
            this.initializeSocket();
            this.setupEventListeners();
            this.startRealTimeUpdates();
            console.log('✅ Trading Dashboard initialized');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
        }
    }

    initializeSocket() {
        try {
            if (typeof io !== 'undefined') {
                this.socket = io();
                
                this.socket.on('connect', () => {
                    console.log('📡 Connected to trading server');
                    this.isConnected = true;
                    this.updateConnectionStatus();
                });

                this.socket.on('disconnect', () => {
                    console.log('📡 Disconnected from trading server');
                    this.isConnected = false;
                    this.updateConnectionStatus();
                });

                this.socket.on('marketUpdate', (data) => {
                    this.handleMarketUpdate(data);
                });

                this.socket.on('priceUpdate', (data) => {
                    this.handlePriceUpdate(data);
                });
            } else {
                console.log('Socket.IO not available, using HTTP polling');
                this.startHttpPolling();
            }
        } catch (error) {
            console.error('Socket initialization failed:', error);
            this.startHttpPolling();
        }
    }

    updateConnectionStatus() {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.connection-status span');
        
        if (statusDot) {
            statusDot.className = this.isConnected ? 'status-dot connected' : 'status-dot disconnected';
        }
        if (statusText) {
            statusText.textContent = this.isConnected ? 'Connected' : 'Disconnected';
        }
    }

    async loadInitialData() {
        try {
            console.log('📊 Loading initial market data...');
            
            // Load market data with fallback
            const marketData = await this.loadMarketData().catch(() => this.getDefaultMarketData());
            this.marketData = marketData;
            
            // Update displays if functions exist
            if (typeof this.updateMarketDisplay === 'function') {
                this.updateMarketDisplay();
            }
            
            if (typeof this.updateStockTable === 'function') {
                this.updateStockTable();
            }
            
            console.log('✅ Initial data loaded successfully');
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showErrorMessage('Failed to load market data');
            // Load default data as fallback
            this.marketData = this.getDefaultMarketData();
        }
    }

    async loadMarketData() {
        const response = await fetch('/api/dashboard/market');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.market || data;
    }

    getDefaultMarketData() {
        return {
            SKIBI: { symbol: 'SKIBI', price: 45.67, changePercent: 5.23, marketCap: 1200000, volume: 15400 },
            SUS: { symbol: 'SUS', price: 32.18, changePercent: -2.15, marketCap: 890000, volume: 8700 },
            RIZZL: { symbol: 'RIZZL', price: 67.89, changePercent: 8.91, marketCap: 2100000, volume: 22300 },
            OHIO: { symbol: 'OHIO', price: 28.45, changePercent: 1.67, marketCap: 654000, volume: 5900 },
            GYATT: { symbol: 'GYATT', price: 89.12, changePercent: -4.33, marketCap: 3200000, volume: 18800 },
            LABUB: { symbol: 'LABUB', price: 156.78, changePercent: 12.45, marketCap: 4500000, volume: 31200 },
            SIGMA: { symbol: 'SIGMA', price: 234.56, changePercent: -1.89, marketCap: 6800000, volume: 42100 },
            FANUM: { symbol: 'FANUM', price: 43.21, changePercent: 3.45, marketCap: 980000, volume: 12600 }
        };
    }

    updateMarketDisplay() {
        // Update market stats
        const stocks = Object.values(this.marketData);
        const totalMarketCap = stocks.reduce((sum, stock) => sum + (stock.marketCap || 0), 0);
        const gainers = stocks.filter(stock => stock.changePercent > 0).length;
        const losers = stocks.filter(stock => stock.changePercent < 0).length;
        const avgChange = stocks.reduce((sum, stock) => sum + (stock.changePercent || 0), 0) / stocks.length;

        // Update DOM elements
        this.updateElement('total-market-cap', this.formatLargeNumber(totalMarketCap));
        this.updateElement('gainers-count', gainers.toString());
        this.updateElement('losers-count', losers.toString());
        this.updateElement('avg-change', avgChange.toFixed(2) + '%');

        // Update stock table
        this.updateStockTable();
    }

    updateStockTable() {
        const tableBody = document.querySelector('#stocks-grid tbody');
        if (!tableBody) return;

        const stocks = Object.values(this.marketData);
        
        tableBody.innerHTML = stocks.map(stock => `
            <tr onclick="navigateToStock('${stock.symbol}')" style="cursor: pointer;">
                <td>
                    <div style="font-weight: 600;">${stock.symbol}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">$${stock.price.toFixed(2)}</div>
                </td>
                <td>
                    <div class="${stock.changePercent >= 0 ? 'text-bull' : 'text-bear'}" style="font-weight: 600;">
                        ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                    </div>
                </td>
                <td>
                    <div>${this.formatLargeNumber(stock.marketCap)}</div>
                </td>
                <td>
                    <div>${this.formatNumber(stock.volume)}</div>
                </td>
                <td>
                    <div class="mini-chart"></div>
                </td>
            </tr>
        `).join('');
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
    }

    startRealTimeUpdates() {
        // Update data every 30 seconds
        setInterval(() => {
            if (!this.socket || !this.isConnected) {
                this.loadInitialData();
            }
        }, 30000);
    }

    startHttpPolling() {
        // Fallback polling every 10 seconds
        setInterval(async () => {
            try {
                const data = await this.loadMarketData().catch(() => null);
                if (data) {
                    this.marketData = data;
                    this.updateMarketDisplay();
                }
            } catch (error) {
                console.log('Polling failed, using cached data');
            }
        }, 10000);
    }

    handleMarketUpdate(data) {
        if (data && data.market) {
            this.marketData = data.market;
            this.updateMarketDisplay();
        }
    }

    handlePriceUpdate(data) {
        if (data && data.symbol && this.marketData[data.symbol]) {
            this.marketData[data.symbol] = { ...this.marketData[data.symbol], ...data };
            this.updateMarketDisplay();
        }
    }

    async refreshData() {
        console.log('🔄 Refreshing data...');
        await this.loadInitialData();
    }

    // Utility functions
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatLargeNumber(num) {
        if (num >= 1000000000) {
            return '$' + (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return '$' + (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return '$' + (num / 1000).toFixed(1) + 'K';
        }
        return '$' + num.toString();
    }

    showErrorMessage(message) {
        console.error('❌', message);
        // Could add a toast notification here
    }

    navigateToStock(symbol) {
        window.location.href = `/stock?symbol=${symbol}`;
    }
}

// Dashboard-specific class that extends TradingDashboard
class DashboardPage extends TradingDashboard {
    constructor() {
        super();
        // Initialize dashboard-specific charts after a short delay
        setTimeout(() => this.initializeDashboardCharts(), 1000);
    }

    initializeDashboardCharts() {
        if (typeof Chart === 'undefined') {
            console.log('Chart.js not loaded, skipping charts');
            return;
        }

        // Market Overview Chart
        const marketCtx = document.getElementById('market-overview-chart');
        if (marketCtx && !this.chartInstances.marketOverview) {
            this.chartInstances.marketOverview = new Chart(marketCtx, {
                type: 'line',
                data: {
                    labels: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
                    datasets: [{
                        label: 'Market Index',
                        data: [100, 105, 103, 108, 112, 115],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: '#333' }, ticks: { color: '#b3b3b3' } },
                        y: { grid: { color: '#333' }, ticks: { color: '#b3b3b3' } }
                    },
                    elements: { point: { radius: 0 } }
                }
            });
        }

        // Top Performers Chart
        const performersCtx = document.getElementById('top-performers-chart');
        if (performersCtx && !this.chartInstances.topPerformers) {
            this.chartInstances.topPerformers = new Chart(performersCtx, {
                type: 'bar',
                data: {
                    labels: ['RIZZL', 'LABUB', 'SKIBI', 'FANUM', 'OHIO'],
                    datasets: [{
                        label: 'Change %',
                        data: [8.91, 12.45, 5.23, 3.45, 1.67],
                        backgroundColor: ['#00d4aa', '#00d4aa', '#00d4aa', '#00d4aa', '#00d4aa'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: '#333' }, ticks: { color: '#b3b3b3' } },
                        y: { 
                            grid: { color: '#333' }, 
                            ticks: { 
                                color: '#b3b3b3',
                                callback: function(value) { return value + '%'; }
                            }
                        }
                    }
                }
            });
        }

        console.log('📊 Dashboard charts initialized');
    }

    updateMarketDisplay() {
        super.updateMarketDisplay();
        this.updateCharts();
    }

    updateCharts() {
        // Update charts with real data if available
        if (this.chartInstances.topPerformers) {
            const stocks = Object.values(this.marketData);
            const topPerformers = stocks
                .sort((a, b) => b.changePercent - a.changePercent)
                .slice(0, 5);
            
            this.chartInstances.topPerformers.data.labels = topPerformers.map(s => s.symbol);
            this.chartInstances.topPerformers.data.datasets[0].data = topPerformers.map(s => s.changePercent);
            this.chartInstances.topPerformers.data.datasets[0].backgroundColor = topPerformers.map(s => 
                s.changePercent >= 0 ? '#00d4aa' : '#ff4757'
            );
            this.chartInstances.topPerformers.update('none');
        }
    }
}

// Global functions
window.refreshMarketData = function() {
    if (window.tradingDashboard) {
        window.tradingDashboard.refreshData();
    }
};

window.navigateToStock = function(symbol) {
    window.location.href = `/stock?symbol=${symbol}`;
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Determine which page we're on and initialize accordingly
    const path = window.location.pathname;
    
    if (path === '/' || path === '/dashboard') {
        window.tradingDashboard = new DashboardPage();
    } else {
        window.tradingDashboard = new TradingDashboard();
    }
});

// Export for use in other scripts
window.TradingDashboard = TradingDashboard;
