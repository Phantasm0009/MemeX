class TradingDashboard {
    constructor() {        
        this.socket = null;
        this.marketData = {};
        this.priceHistory = {};
        this.isConnected = false;
        this.currentPage = 'dashboard';
        this.updateInterval = null;
        this.chartInstances = {};
        this.isInitialized = false;
        
        this.init();
    }
    
    // Static method to get singleton instance
    static getInstance() {
        if (!window.tradingDashboardInstance) {
            console.log('🚀 Creating new Trading Dashboard instance');
            window.tradingDashboardInstance = new TradingDashboard();
        } else {
            console.log('📋 Using existing Trading Dashboard instance');
        }
        return window.tradingDashboardInstance;
    }

    async init() {
        if (this.isInitialized) {
            console.log('� Trading Dashboard already initialized, skipping...');
            return;
        }
        
        console.log('�🚀 Initializing Trading Dashboard');
        this.isInitialized = true;
        
        // Initialize Socket.IO connection
        this.initializeSocket();
        
        // Load initial data
        await this.loadInitialData();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeCharts();
        }
        
        console.log('✅ Trading Dashboard initialized');
    }
    
    // Cleanup method to destroy all charts
    cleanup() {
        console.log('🧹 Cleaning up Trading Dashboard...');
        
        // Destroy all chart instances
        Object.keys(this.chartInstances).forEach(key => {
            if (this.chartInstances[key]) {
                try {
                    this.chartInstances[key].destroy();
                    console.log(`🗑️ Destroyed chart: ${key}`);
                } catch (error) {
                    console.warn(`Warning destroying chart ${key}:`, error);
                }
                delete this.chartInstances[key];
            }
        });
        
        // Clear any intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Disconnect socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
    
    detectPageType() {
        
        // Initialize stock details if on stock page
        if (this.currentPage === 'stock') {
            this.initializeStockPage();
        }
    }
    
    detectPageType() {
        const path = window.location.pathname;
        if (path.includes('/stock')) {
            this.currentPage = 'stock';
            // Extract stock symbol from URL if present
            const urlParams = new URLSearchParams(window.location.search);
            const pathSymbol = path.split('/').pop();
            window.currentStock = urlParams.get('symbol') || (pathSymbol && pathSymbol !== 'stock' ? pathSymbol : null);
            
            console.log('🔍 URL Analysis:', {
                fullPath: path,
                pathSymbol,
                urlSymbol: urlParams.get('symbol'),
                finalSymbol: window.currentStock
            });
        } else if (path.includes('/dashboard')) {
            this.currentPage = 'dashboard';
        }
    }
    
    async initializeStockPage() {
        console.log('📊 Initializing stock detail page');
        
        // Get stock symbol from URL - ensure we have the right symbol
        const urlParams = new URLSearchParams(window.location.search);
        const path = window.location.pathname;
        const pathParts = path.split('/');
        
        // Get symbol from URL parameter or path
        let symbol = urlParams.get('symbol');
        if (!symbol && pathParts.length > 2 && pathParts[1] === 'stock') {
            symbol = pathParts[2]; // /stock/SYMBOL format
        }
        
        console.log('🔍 Stock symbol detection:', {
            path: path,
            pathParts: pathParts,
            urlParam: urlParams.get('symbol'),
            extractedSymbol: symbol
        });
        
        if (symbol) {
            window.currentStock = symbol;
            await this.loadStockDetails(symbol);
        } else {
            // Show stock selector if no symbol provided
            this.showStockSelector();
        }
    }
    
    updateChartTimeframe(timeframe) {
        if (!this.chartInstances.stockPrice) {
            console.warn('Stock chart not initialized');
            return;
        }

        console.log(`🔄 Updating chart to ${timeframe} timeframe`);
        
        const chart = this.chartInstances.stockPrice;
        const now = Date.now();
        const basePrice = this.marketData[this.currentSymbol]?.price || 100;
        
        let labels = [];
        let data = [];
        let intervals, timeUnit;

        switch (timeframe) {
            case '1H':
                intervals = 60; // 60 minutes
                timeUnit = 60 * 1000; // 1 minute
                break;
            case '1D':
                intervals = 24; // 24 hours
                timeUnit = 60 * 60 * 1000; // 1 hour
                break;
            case '1W':
                intervals = 7; // 7 days
                timeUnit = 24 * 60 * 60 * 1000; // 1 day
                break;
            case '1M':
                intervals = 30; // 30 days
                timeUnit = 24 * 60 * 60 * 1000; // 1 day
                break;
            default:
                intervals = 24;
                timeUnit = 60 * 60 * 1000;
        }

        // Generate data points
        for (let i = intervals - 1; i >= 0; i--) {
            const timestamp = now - (i * timeUnit);
            const date = new Date(timestamp);
            
            // Format labels based on timeframe
            let label;
            if (timeframe === '1H') {
                label = date.getMinutes().toString().padStart(2, '0');
            } else if (timeframe === '1D') {
                label = date.getHours().toString().padStart(2, '0') + ':00';
            } else {
                label = (date.getMonth() + 1) + '/' + date.getDate();
            }
            
            labels.push(label);
            
            // Generate realistic price variation
            const variation = (Math.random() - 0.5) * 0.15; // ±7.5% variation
            const trendFactor = (intervals - i) / intervals; // Slight upward trend
            const price = basePrice * (1 + variation + (trendFactor * 0.1));
            data.push(price);
        }

        // Update chart data
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update('none'); // No animation for smoother experience
    }

    async loadStockDetails(symbol) {
        try {
            console.log(`📈 Loading details for ${symbol}`);
            
            // First, update the current symbol
            this.currentSymbol = symbol;
            window.currentStock = symbol;
            
            // Update page URL without refreshing
            if (window.location.pathname !== `/stock/${symbol}`) {
                window.history.pushState({}, '', `/stock/${symbol}`);
            }
            
            // Update page title immediately
            document.getElementById('stock-symbol').textContent = symbol;
            document.getElementById('stock-name').textContent = 'Loading...';
            
            // Load stock data from the backend
            const response = await fetch(`/api/stock/${symbol}`);
            if (response.ok) {
                const stockData = await response.json();
                console.log('📊 Stock data received:', stockData);
                
                this.currentSymbol = stockData.symbol;
                this.updateStockDisplay(stockData);
                
                // Load activity data (use transactions as fallback)
                try {
                    const activityResponse = await fetch(`/api/transactions?limit=50`);
                    if (activityResponse.ok) {
                        const activityData = await activityResponse.json();
                        // Filter transactions for current stock
                        if (activityData.transactions) {
                            const stockTransactions = activityData.transactions.filter(tx => 
                                tx.stock === stockData.symbol
                            );
                            this.updateStockActivity({ transactions: stockTransactions });
                        } else {
                            this.updateStockActivity(activityData);
                        }
                    }
                } catch (activityError) {
                    console.log('Activity data not available');
                }
                
                // Initialize charts and trading panel with a delay to ensure DOM is ready
                setTimeout(() => {
                    this.initializeStockChart();
                    this.setupTradingPanel();
                }, 200);
                
            } else {
                throw new Error(`Stock ${symbol} not found`);
            }
        } catch (error) {
            console.error('Error loading stock details:', error);
            this.showStockError(error.message);
        }
    }
    
    updateStockDisplay(stockData) {
        // Handle nested data structure from API
        const data = stockData.data || stockData; // Support both nested and flat structures
        const meta = stockData.meta || {};
        
        // Update basic info
        document.getElementById('stock-symbol').textContent = stockData.symbol || data.symbol;
        document.getElementById('stock-name').textContent = meta.italianName || data.name || stockData.symbol || data.symbol;
        
        // Update price info
        const currentPrice = document.getElementById('current-price');
        const priceChange = document.getElementById('price-change');
        const marketCap = document.getElementById('market-cap');
        
        if (currentPrice) currentPrice.textContent = `$${(data.price || 0).toFixed(2)}`;
        if (priceChange) {
            const change = data.change || 0;
            const changePercent = data.changePercent || (change * 100) || 0;
            priceChange.textContent = `${change >= 0 ? '+' : ''}$${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
            priceChange.className = 'stat-change ' + (change >= 0 ? 'text-bull' : 'text-bear');
        }
        if (marketCap) marketCap.textContent = this.formatNumber(data.marketCap || (data.price * 1000000) || 0);
        
        // Update other stats if elements exist
        const volume = document.getElementById('volume');
        const high24h = document.getElementById('high-24h');
        const low24h = document.getElementById('low-24h');
        
        if (volume) volume.textContent = this.formatNumber(data.volume || 0);
        if (high24h) high24h.textContent = `$${(data.high24h || data.price || 0).toFixed(2)}`;
        if (low24h) low24h.textContent = `$${(data.low24h || data.price || 0).toFixed(2)}`;
    }
    
    updateStockActivity(activityData) {
        const activityContainer = document.getElementById('stock-activity');
        if (!activityContainer) return;
        
        // Handle both response formats: direct transactions array or transactions property
        const transactions = activityData.transactions || activityData || [];
        
        if (transactions && transactions.length > 0) {
            const activityHTML = transactions.map(activity => `
                <div class="activity-item">
                    <div class="activity-type ${activity.type}">${activity.type.toUpperCase()}</div>
                    <div class="activity-details">
                        <span class="activity-user">${activity.username || 'Unknown'}</span>
                        <span class="activity-amount">${Math.abs(activity.amount)} shares</span>
                        <span class="activity-price">@$${activity.price.toFixed(2)}</span>
                    </div>
                    <div class="activity-time">${this.getTimeAgo(activity.timestamp)}</div>
                </div>
            `).join('');
            activityContainer.innerHTML = activityHTML;
        } else {
            activityContainer.innerHTML = '<div class="no-activity">No recent activity</div>';
        }
    }
    
    showStockSelector() {
        const stockSymbol = document.getElementById('stock-symbol');
        const stockName = document.getElementById('stock-name');
        
        if (stockSymbol) stockSymbol.textContent = 'Select Stock';
        if (stockName) stockName.textContent = 'Choose a stock symbol from the dashboard';
        
        // Show available stocks
        this.loadAvailableStocks();
    }
    
    async loadAvailableStocks() {
        try {
            const response = await fetch('/api/dashboard/market');
            if (response.ok) {
                const data = await response.json();
                const stocks = data.market || data;
                this.displayStockSelection(stocks);
            }
        } catch (error) {
            console.error('Error loading available stocks:', error);
        }
    }
    
    displayStockSelection(stocks) {
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            const stocksHTML = Object.keys(stocks).map(symbol => `
                <div class="stock-option" onclick="window.tradingDashboard.selectStock('${symbol}')">
                    <div class="stock-symbol">${symbol}</div>
                    <div class="stock-price">$${(stocks[symbol].price || 0).toFixed(2)}</div>
                    <div class="stock-change ${(stocks[symbol].change || 0) >= 0 ? 'positive' : 'negative'}">
                        ${((stocks[symbol].change || 0) * 100).toFixed(2)}%
                    </div>
                </div>
            `).join('');
            
            contentArea.innerHTML = `
                <div class="stock-selector">
                    <h2>Select a Stock to View Details</h2>
                    <div class="stock-grid">
                        ${stocksHTML}
                    </div>
                </div>
            `;
        }
    }
    
    selectStock(symbol) {
        window.currentStock = symbol;
        window.history.pushState({}, '', `/stock/${symbol}`);
        this.loadStockDetails(symbol);
    }
    
    showStockError(message) {
        const stockSymbol = document.getElementById('stock-symbol');
        const stockName = document.getElementById('stock-name');
        
        if (stockSymbol) stockSymbol.textContent = 'Error';
        if (stockName) stockName.textContent = message;
        
        console.error('Stock error:', message);
        
        // Also show a user-friendly error in the main content area
        const errorCard = document.querySelector('.trading-card');
        if (errorCard) {
            errorCard.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h2>Unable to Load Stock</h2>
                    <p style="color: #888; margin: 1rem 0;">${message}</p>
                    <button onclick="window.location.href='/dashboard'" class="btn btn-primary">
                        Return to Dashboard
                    </button>
                </div>
            `;
        }
    }

    initializeSocket() {
        // Temporarily disable Socket.io and use HTTP polling instead
        // TODO: Set up Socket.io on backend server for real-time updates
        console.log('🔄 Using HTTP polling for data updates (Socket.io disabled)');
        this.startHttpPolling();
        return;
        
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
            
            this.socket.on('tradeActivity', (data) => {
                this.handleTradeActivity(data);
            });
            
            this.socket.on('marketEvent', (data) => {
                this.handleMarketEvent(data);
            });
        } else {
            console.warn('⚠️ Socket.IO not available, using HTTP polling');
            this.startHttpPolling();
        }
    }

    updateConnectionStatus() {
        const statusElements = document.querySelectorAll('.connection-status');
        statusElements.forEach(element => {
            const dot = element.querySelector('.status-dot');
            const text = element.querySelector('.status-text');
            
            if (dot && text) {
                if (this.isConnected) {
                    dot.className = 'status-dot connected';
                    text.textContent = 'Connected';
                } else {
                    dot.className = 'status-dot disconnected';
                    text.textContent = 'Disconnected';
                }
            }
        });
    }

    async loadInitialData() {
        try {
            console.log('📊 Loading initial market data...');
            
            // Load market data
            const marketResponse = await fetch('/api/market');
            if (marketResponse.ok) {
                const data = await marketResponse.json();
                this.marketData = data.market || data;
                console.log('✅ Market data loaded:', Object.keys(this.marketData).length, 'stocks');
                this.updateMarketDisplay();
            } else {
                throw new Error('Failed to fetch market data');
            }

            // Load leaderboard data
            try {
                const leaderboardResponse = await fetch('/api/leaderboard');
                if (leaderboardResponse.ok) {
                    const leaderboardData = await leaderboardResponse.json();
                    // Handle both old and new API response formats
                    const leaderboard = leaderboardData.leaderboard || leaderboardData;
                    console.log('📊 Leaderboard data received:', leaderboard);
                    this.updateLeaderboardDisplay(leaderboard);
                } else {
                    console.log('Leaderboard response not OK:', leaderboardResponse.status);
                }
            } catch (error) {
                console.log('Leaderboard data error:', error);
                console.log('Using mock leaderboard data');
            }

            // Load analytics data (using transactions for activity)
            try {
                const analyticsResponse = await fetch('/api/transactions?limit=100');
                if (analyticsResponse.ok) {
                    const transactions = await analyticsResponse.json();
                    this.updateAnalyticsDisplay(transactions);
                }
            } catch (error) {
                console.log('Analytics data not available, using mock data');
            }

            // Load trading activity data
            try {
                const activityResponse = await fetch('/api/transactions?limit=30');
                if (activityResponse.ok) {
                    const activityData = await activityResponse.json();
                    this.updateTradingActivity(activityData);
                }
            } catch (error) {
                console.log('Trading activity data not available, using mock data');
                this.loadFallbackActivity();
            }

            console.log('✅ Initial data loaded successfully');

        } catch (error) {
            console.error('Error loading initial data:', error);
            console.log('📊 Loading fallback market data...');
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        // Fallback market data
        this.marketData = {
            SKIBI: { name: "Skibidi Toilet", price: 45.67, change: 5.23, changePercent: 12.95, volume: 15420, high24h: 48.92, low24h: 42.15 },
            RIZZL: { name: "Rizz Lord", price: 18.23, change: -1.45, changePercent: -7.36, volume: 8930, high24h: 19.89, low24h: 17.45 },
            SIGMA: { name: "Sigma Male", price: 289.45, change: 15.67, changePercent: 5.72, volume: 3421, high24h: 295.12, low24h: 275.33 },
            LABUB: { name: "Labubu Vibes", price: 567.89, change: -23.45, changePercent: -3.97, volume: 1234, high24h: 589.34, low24h: 545.67 },
            OHIO: { name: "Ohio Moments", price: 45.12, change: 2.34, changePercent: 5.47, volume: 9876, high24h: 47.23, low24h: 42.89 },
            SUS: { name: "Among Us Sus", price: 26.78, change: -0.89, changePercent: -3.22, volume: 5432, high24h: 28.45, low24h: 25.67 },
            GYATT: { name: "Gyatt Moment", price: 7.89, change: 0.45, changePercent: 6.05, volume: 12345, high24h: 8.23, low24h: 7.34 },
            FRIED: { name: "Fried Chicken", price: 2.34, change: 0.12, changePercent: 5.41, volume: 6789, high24h: 2.45, low24h: 2.21 }
        };
        
        console.log('✅ Fallback data loaded');
        this.updateMarketDisplay();
    }
    
    updateTradingActivity(activityData) {
        const activityFeed = document.getElementById('trading-activity');
        if (!activityFeed || !activityData.activity) return;
        
        const activityHTML = activityData.activity.map(activity => {
            const timeAgo = this.getTimeAgo(activity.timestamp);
            const actionText = activity.type === 'buy' ? 'bought' : 'sold';
            const actionClass = activity.type === 'buy' ? 'text-bull' : 'text-bear';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        ${activity.type === 'buy' ? 'B' : 'S'}
                    </div>
                    <div class="activity-details">
                        <div class="activity-user">${activity.username}</div>
                        <div class="activity-action">
                            ${actionText} <span class="${actionClass}">${activity.amount}</span> shares of 
                            <span class="stock-symbol">${activity.stock}</span> at 
                            <span class="price">$${activity.price.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
        
        activityFeed.innerHTML = activityHTML;
    }
    
    loadFallbackActivity() {
        const fallbackActivity = {
            activity: [
                {
                    type: 'buy',
                    username: 'MemeTrader',
                    stock: 'SKIBI',
                    amount: 5,
                    price: 32.45,
                    timestamp: Date.now() - 120000
                },
                {
                    type: 'sell',
                    username: 'StockMaster',
                    stock: 'RIZZL',
                    amount: 3,
                    price: 18.20,
                    timestamp: Date.now() - 180000
                },
                {
                    type: 'buy',
                    username: 'CryptoNinja',
                    stock: 'SIGMA',
                    amount: 2,
                    price: 289.45,
                    timestamp: Date.now() - 240000
                },
                {
                    type: 'sell',
                    username: 'DiamondHands',
                    stock: 'OHIO',
                    amount: 7,
                    price: 45.12,
                    timestamp: Date.now() - 300000
                }
            ]
        };
        
        this.updateTradingActivity(fallbackActivity);
    }

    setupEventListeners() {
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                if (page) {
                    this.navigateToPage(page);
                }
            }
            
            // Stock row clicks
            if (e.target.closest('.stock-row') || e.target.closest('tr[onclick*="navigateToStock"]')) {
                const row = e.target.closest('.stock-row') || e.target.closest('tr');
                const symbol = row.getAttribute('data-symbol') || 
                              row.onclick?.toString().match(/navigateToStock\('([^']+)'\)/)?.[1];
                if (symbol) {
                    this.showStockDetails(symbol);
                }
            }
            
            // Close stock details overlay when clicking outside
            if (e.target.matches('.stock-details-overlay')) {
                window.hideStockDetails();
            }
            
            // Refresh button
            if (e.target.matches('.refresh-btn')) {
                this.refreshData();
            }
        });

        // ESC key to close overlay
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('stock-details-overlay');
                if (overlay && overlay.style.display === 'block') {
                    window.hideStockDetails();
                }
            }
        });

        // Mobile sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('open');
            });
        }
    }

    startRealTimeUpdates() {
        // Don't start additional polling if HTTP polling is already active
        // The polling is handled by startHttpPolling() or socket connection
        console.log('⏰ Starting timestamp updates...');
        
        // Update timestamps every second
        setInterval(() => {
            this.updateTimestamps();
        }, 1000);
    }

    startHttpPolling() {
        // Fallback HTTP polling when socket is not available
        console.log('📡 Starting HTTP polling connection...');
        
        // Mark as connected for HTTP polling
        this.isConnected = true;
        this.updateConnectionStatus();
        console.log('✅ Connected via HTTP polling');
        
        this.updateInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/market');
                if (response.ok) {
                    const data = await response.json();
                    this.handleMarketUpdate(data);
                } else {
                    console.warn('Failed to fetch market data:', response.status);
                }
            } catch (error) {
                console.error('Polling error:', error);
                // Don't disconnect on single errors, just log them
            }
        }, 5000);
    }

    handleMarketUpdate(data) {
        this.marketData = { ...this.marketData, ...data };
        this.updateMarketDisplay();
        
        // Update price history for charts
        Object.keys(data).forEach(symbol => {
            if (!this.priceHistory[symbol]) {
                this.priceHistory[symbol] = [];
            }
            
            this.priceHistory[symbol].push({
                timestamp: Date.now(),
                price: data[symbol].price
            });
            
            // Keep only last 100 points
            if (this.priceHistory[symbol].length > 100) {
                this.priceHistory[symbol] = this.priceHistory[symbol].slice(-100);
            }
        });
        
        this.updateCharts();
    }

    handlePriceUpdate(data) {
        const { symbol, price, change, changePercent } = data;
        
        // Update market data
        if (this.marketData[symbol]) {
            this.marketData[symbol].price = price;
            this.marketData[symbol].change = change;
            this.marketData[symbol].changePercent = changePercent;
        }
        
        // Update display
        this.updateStockRow(symbol);
        
        // Add to price history
        if (!this.priceHistory[symbol]) {
            this.priceHistory[symbol] = [];
        }
        
        this.priceHistory[symbol].push({
            timestamp: Date.now(),
            price: price
        });
        
        // Keep only last 100 points
        if (this.priceHistory[symbol].length > 100) {
            this.priceHistory[symbol] = this.priceHistory[symbol].slice(-100);
        }
        
        // Update charts if on stock detail page
        if (this.currentPage === 'stock' && window.currentStock === symbol) {
            this.updateStockChart(symbol);
        }
    }

    handleTradeActivity(data) {
        this.addTradeActivity(data);
    }

    handleMarketEvent(data) {
        this.addMarketEvent(data);
    }

    updateMarketDisplay() {
        const stocksGrid = document.getElementById('stocks-grid');
        if (!stocksGrid) return;
        
        if (!this.marketData || typeof this.marketData !== 'object') {
            console.error('❌ Invalid market data structure:', this.marketData);
            return;
        }
        
        const stocks = Object.entries(this.marketData).map(([symbol, data]) => {
            // Skip non-stock entries like 'lastEvent', 'timestamp', etc.
            if (symbol === 'lastEvent' || symbol === 'timestamp' || symbol === 'lastUpdate' || 
                !data || typeof data !== 'object' || typeof data === 'string') {
                return null;
            }
            
            // Ensure data is a stock object and has required properties
            if (!data.hasOwnProperty('price')) {
                return null;
            }
            
            return {
                symbol,
                name: data.name || data.italianName || symbol,
                price: Number(data.price) || 0,
                change: Number(data.change) || 0,
                changePercent: Number(data.changePercent) || 0,
                volume: Number(data.volume) || 0,
                marketCap: Number(data.marketCap) || Number(data.price) * 1000000 || 0,
                high24h: Number(data.high24h) || Number(data.price) || 0,
                low24h: Number(data.low24h) || Number(data.price) || 0
            };
        }).filter(stock => stock !== null);
        
        // Sort by market cap or volume
        stocks.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
        
        stocksGrid.innerHTML = stocks.map(stock => this.createStockRow(stock)).join('');
        
        // Update market stats
        this.updateMarketStats(stocks);
        
        // Update dashboard charts with real data if on dashboard page
        if (window.location.pathname === '/dashboard' || window.location.pathname === '/') {
            this.initializeDashboardCharts();
        }
    }

    createStockRow(stock) {
        const changePercent = Number(stock.changePercent) || 0;
        const change = Number(stock.change) || 0;
        const price = Number(stock.price) || 0;
        
        const changeClass = changePercent > 0 ? 'positive' : 
                           changePercent < 0 ? 'negative' : 'neutral';
        const changeIcon = changePercent > 0 ? '▲' : 
                          changePercent < 0 ? '▼' : '●';
        
        return `
            <tr class="stock-row" data-symbol="${stock.symbol}">
                <td>
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name || ''}</div>
                </td>
                <td class="stock-price">$${this.formatNumber(price)}</td>
                <td class="price-change ${changeClass}">
                    ${changeIcon} ${this.formatNumber(Math.abs(change))} (${this.formatPercent(changePercent)})
                </td>
                <td class="font-mono">$${this.formatLargeNumber(stock.marketCap || 0)}</td>
                <td class="font-mono">${this.formatLargeNumber(stock.volume || 0)}</td>
                <td>
                    <div class="mini-chart" id="mini-chart-${stock.symbol}"></div>
                </td>
            </tr>
        `;
    }

    updateStockRow(symbol) {
        const row = document.querySelector(`[data-symbol="${symbol}"]`);
        if (!row || !this.marketData[symbol]) return;
        
        const stock = this.marketData[symbol];
        const changeClass = stock.changePercent > 0 ? 'positive' : 
                           stock.changePercent < 0 ? 'negative' : 'neutral';
        const changeIcon = stock.changePercent > 0 ? '▲' : 
                          stock.changePercent < 0 ? '▼' : '●';
        
        // Update price
        const priceCell = row.querySelector('.stock-price');
        if (priceCell) {
            priceCell.textContent = `$${this.formatNumber(stock.price || 0)}`;
        }
        
        // Update change
        const changeCell = row.querySelector('.price-change');
        if (changeCell) {
            changeCell.className = `price-change ${changeClass}`;
            changeCell.innerHTML = `${changeIcon} ${this.formatNumber(Math.abs(stock.change || 0))} (${this.formatPercent(stock.changePercent || 0)})`;
        }
        
        // Add flash effect
        row.classList.add('flash-update');
        setTimeout(() => row.classList.remove('flash-update'), 500);
    }

    updateMarketStats(stocks) {
        const totalMarketCap = stocks.reduce((sum, stock) => sum + (stock.marketCap || 0), 0);
        const avgChange = stocks.reduce((sum, stock) => sum + (stock.changePercent || 0), 0) / stocks.length;
        const gainers = stocks.filter(stock => (stock.changePercent || 0) > 0).length;
        const losers = stocks.filter(stock => (stock.changePercent || 0) < 0).length;
        
        this.updateStatCard('total-market-cap', totalMarketCap, '$');
        this.updateStatCard('avg-change', avgChange, '%');
        this.updateStatCard('gainers-count', gainers);
        this.updateStatCard('losers-count', losers);
    }

    updateStatCard(id, value, prefix = '') {
        const element = document.getElementById(id);
        if (element) {
            const formattedValue = prefix === '$' ? this.formatLargeNumber(value) :
                                  prefix === '%' ? this.formatPercent(value) :
                                  value.toString();
            element.textContent = prefix + formattedValue;
        }
    }

    updateLeaderboardDisplay(leaderboard) {
        // Handle both old and new API formats for backward compatibility
        const normalizeUser = (user) => ({
            username: user.username || user.displayName || user.globalName || user.discord_username || `Trader#${(user.id?.slice(-4) || Math.random().toString().slice(-4))}`,
            totalValue: user.totalValue || user.portfolio_value || 0,
            profitPercentage: user.profitPercentage !== undefined ? user.profitPercentage : (user.daily_change || 0),
            totalTrades: user.totalTrades || user.total_trades || 0,
            balance: user.balance || 0,
            portfolioValue: user.portfolioValue || user.portfolio_value || 0
        });
        
        // Update podium
        const podium = document.querySelector('.leaderboard-podium');
        if (podium && leaderboard.length >= 3) {
            const users = leaderboard.map(normalizeUser);
            podium.innerHTML = `
                <div class="podium-item second">
                    <div class="podium-rank second">2</div>
                    <div class="podium-user">${users[1].username}</div>
                    <div class="podium-value">$${this.formatLargeNumber(users[1].totalValue)}</div>
                </div>
                <div class="podium-item first">
                    <div class="podium-rank first">1</div>
                    <div class="podium-user">${users[0].username}</div>
                    <div class="podium-value">$${this.formatLargeNumber(users[0].totalValue)}</div>
                </div>
                <div class="podium-item third">
                    <div class="podium-rank third">3</div>
                    <div class="podium-user">${users[2].username}</div>
                    <div class="podium-value">$${this.formatLargeNumber(users[2].totalValue)}</div>
                </div>
            `;
        }
        
        // Update full leaderboard table
        const leaderboardTable = document.getElementById('leaderboard-table');
        if (leaderboardTable) {
            const tbody = leaderboardTable.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = leaderboard.map((user, index) => {
                    const normalizedUser = normalizeUser(user);
                    return `
                        <tr>
                            <td class="font-weight-600">#${index + 1}</td>
                            <td>${normalizedUser.username}</td>
                            <td class="font-mono">$${this.formatLargeNumber(normalizedUser.totalValue)}</td>
                            <td class="price-change ${normalizedUser.profitPercentage >= 0 ? 'positive' : 'negative'}">
                                ${normalizedUser.profitPercentage >= 0 ? '▲' : '▼'} ${this.formatPercent(Math.abs(normalizedUser.profitPercentage))}%
                            </td>
                            <td class="font-mono">${normalizedUser.totalTrades}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }

    addTradeActivity(activity) {
        const activityFeed = document.querySelector('.activity-feed');
        if (!activityFeed) return;
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item fade-in';
        
        const timeAgo = this.getTimeAgo(activity.timestamp);
        const actionText = activity.type === 'buy' ? 'bought' : 'sold';
        
        activityItem.innerHTML = `
            <div class="activity-icon ${activity.type}">
                ${activity.type === 'buy' ? 'B' : 'S'}
            </div>
            <div class="activity-details">
                <div class="activity-user">${activity.username}</div>
                <div class="activity-action">
                    ${actionText} ${activity.amount} shares of ${activity.symbol} at $${this.formatNumber(activity.price)}
                </div>
            </div>
            <div class="activity-time">${timeAgo}</div>
        `;
        
        // Add to top of feed
        activityFeed.insertBefore(activityItem, activityFeed.firstChild);
        
        // Remove old items (keep only last 50)
        const items = activityFeed.querySelectorAll('.activity-item');
        if (items.length > 50) {
            for (let i = 50; i < items.length; i++) {
                items[i].remove();
            }
        }
    }

    addMarketEvent(event) {
        const eventsContainer = document.getElementById('market-events');
        if (!eventsContainer) return;
        
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item fade-in';
        
        eventItem.innerHTML = `
            <div class="event-header">
                <div class="event-title">${event.title}</div>
                <div class="event-impact ${event.impact > 0 ? 'positive' : 'negative'}">
                    ${event.impact > 0 ? '+' : ''}${this.formatPercent(event.impact)} Impact
                </div>
            </div>
            <div class="event-description">${event.description}</div>
        `;
        
        eventsContainer.insertBefore(eventItem, eventsContainer.firstChild);
        
        // Remove old events (keep only last 10)
        const events = eventsContainer.querySelectorAll('.event-item');
        if (events.length > 10) {
            for (let i = 10; i < events.length; i++) {
                events[i].remove();
            }
        }
    }

    navigateToPage(page) {
        this.currentPage = page;
        
        // Update active nav item
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        // Load page content
        window.location.href = `/${page}`;
    }

    navigateToStock(symbol) {
        this.showStockDetails(symbol);
    }

    async showStockDetails(symbol) {
        console.log(`📊 Showing details for ${symbol}`);
        
        try {
            // Show the overlay
            const overlay = document.getElementById('stock-details-overlay');
            if (overlay) {
                overlay.style.display = 'block';
                document.body.style.overflow = 'hidden'; // Prevent background scroll
            }
            
            // Update header info
            const symbolElement = document.getElementById('selected-stock-symbol');
            const nameElement = document.getElementById('selected-stock-name');
            
            if (symbolElement) symbolElement.textContent = symbol;
            if (nameElement) {
                const meta = await this.getStockMeta(symbol);
                nameElement.textContent = meta?.italianName || `${symbol} Stock Details`;
            }
            
            // Load stock data
            await this.loadStockDetails(symbol);
            
        } catch (error) {
            console.error('Error showing stock details:', error);
        }
    }

    async loadStockDetails(symbol) {
        try {
            // Get current stock data from market data
            const stock = this.marketData?.[symbol];
            if (!stock) {
                console.warn(`No data found for ${symbol}`);
                return;
            }
            
            // Update price information
            this.updateStockPriceInfo(symbol, stock);
            
            // Initialize stock chart
            this.initializeStockChart(symbol, stock);
            
            // Load stock activity
            await this.loadStockActivity(symbol);
            
        } catch (error) {
            console.error('Error loading stock details:', error);
        }
    }

    updateStockPriceInfo(symbol, stock) {
        const elements = {
            'selected-current-price': `$${stock.price?.toFixed(2) || '0.00'}`,
            'selected-market-cap': this.formatMarketCap(stock.price * 1000000), // Estimate
            'selected-volume-24h': this.formatNumber(Math.floor(Math.random() * 10000) + 1000),
            'selected-volatility': `${Math.abs(stock.change || 0).toFixed(1)}%`,
            'selected-open-price': `$${(stock.price * 0.98)?.toFixed(2) || '0.00'}`,
            'selected-high-price': `$${(stock.high24h || stock.price * 1.05)?.toFixed(2) || '0.00'}`,
            'selected-low-price': `$${(stock.low24h || stock.price * 0.95)?.toFixed(2) || '0.00'}`,
            'selected-prev-close': `$${(stock.price * 0.99)?.toFixed(2) || '0.00'}`,
            'selected-week-high': `$${(stock.price * 1.2)?.toFixed(2) || '0.00'}`,
            'selected-week-low': `$${(stock.price * 0.8)?.toFixed(2) || '0.00'}`,
            'selected-avg-volume': this.formatNumber(Math.floor(Math.random() * 5000) + 2000)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Update price change with color
        const changeElement = document.getElementById('selected-price-change');
        if (changeElement && stock.change !== undefined) {
            const changeValue = stock.change;
            const changeText = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`;
            changeElement.textContent = changeText;
            changeElement.className = `stat-change ${changeValue >= 0 ? 'text-bull' : 'text-bear'}`;
        }
    }

    initializeStockChart(symbol, stock) {
        const canvas = document.getElementById('selected-stock-price-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.selectedStockChart) {
            this.selectedStockChart.destroy();
        }
        
        // Generate sample price history
        const priceHistory = this.generateSamplePriceHistory(stock.price, 24);
        
        this.selectedStockChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: priceHistory.map((_, i) => {
                    const date = new Date();
                    date.setHours(date.getHours() - (24 - i));
                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                }),
                datasets: [{
                    label: `${symbol} Price`,
                    data: priceHistory,
                    borderColor: '#00d4aa',
                    backgroundColor: 'rgba(0, 212, 170, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#00d4aa',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `${symbol}: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    generateSamplePriceHistory(currentPrice, hours) {
        const history = [];
        let price = currentPrice;
        
        for (let i = 0; i < hours; i++) {
            // Random walk with slight mean reversion
            const change = (Math.random() - 0.5) * 0.05; // 5% max change per hour
            price = Math.max(0.01, price * (1 + change));
            history.push(price);
        }
        
        // Ensure last price matches current price
        history[history.length - 1] = currentPrice;
        
        return history;
    }

    async loadStockActivity(symbol) {
        try {
            const response = await fetch(`/api/transactions?stock=${symbol}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                this.updateStockActivity(data.transactions || []);
            } else {
                // Fallback to sample data
                this.updateStockActivity(this.generateSampleStockActivity(symbol));
            }
        } catch (error) {
            console.error('Error loading stock activity:', error);
            this.updateStockActivity(this.generateSampleStockActivity(symbol));
        }
    }

    generateSampleStockActivity(symbol) {
        const activities = [];
        const usernames = ['TradingPro', 'MemeKing', 'DiamondHands', 'PaperHands', 'RocketMan'];
        
        for (let i = 0; i < 5; i++) {
            activities.push({
                type: Math.random() > 0.5 ? 'buy' : 'sell',
                username: usernames[Math.floor(Math.random() * usernames.length)],
                stock: symbol,
                amount: Math.floor(Math.random() * 100) + 1,
                price: this.marketData?.[symbol]?.price || 100,
                timestamp: Date.now() - Math.random() * 3600000 // Within last hour
            });
        }
        
        return activities;
    }

    updateStockActivity(activities) {
        const container = document.getElementById('selected-stock-activity');
        if (!container) return;
        
        if (!activities || activities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-chart-line mb-2"></i>
                    <div>No recent activity</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    ${activity.type === 'buy' ? 'B' : 'S'}
                </div>
                <div class="activity-details">
                    <div class="activity-user">${activity.username}</div>
                    <div class="activity-action">
                        ${activity.type === 'buy' ? 'Bought' : 'Sold'} ${activity.amount} shares at $${activity.price.toFixed(2)}
                    </div>
                </div>
                <div class="activity-time">${this.getTimeAgo(activity.timestamp)}</div>
            </div>
        `).join('');
    }

    async getStockMeta(symbol) {
        try {
            const response = await fetch('/api/market');
            if (response.ok) {
                const data = await response.json();
                return data.meta?.[symbol] || null;
            }
        } catch (error) {
            console.error('Error getting stock meta:', error);
        }
        return null;
    }

    async refreshData() {
        console.log('🔄 Refreshing dashboard data...');
        
        // Show loading state
        this.showLoadingState();
        
        try {
            await this.loadInitialData();
            console.log('✅ Data refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            this.showErrorMessage('Failed to refresh data');
        } finally {
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="loading"></i> Refreshing...';
            refreshBtn.disabled = true;
        }
    }

    hideLoadingState() {
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshBtn.disabled = false;
        }
    }

    showErrorMessage(message) {
        // You can implement a toast notification here
        console.error(message);
    }

    updateTimestamps() {
        document.querySelectorAll('.timestamp').forEach(element => {
            const timestamp = parseInt(element.getAttribute('data-timestamp'));
            if (timestamp) {
                element.textContent = this.getTimeAgo(timestamp);
            }
        });
    }

    initializeCharts() {
        // Initialize charts based on current page
        const path = window.location.pathname;
        
        // Add a delay to ensure DOM is fully rendered
        setTimeout(() => {
            if (path === '/dashboard' || path === '/') {
                this.initializeDashboardCharts();
            } else if (path === '/analytics') {
                this.initializeAnalyticsCharts();
            } else if (path === '/stock') {
                this.initializeStockCharts();
            }
        }, 100);
    }
    
    initializeDashboardCharts() {
        try {
            // Destroy existing charts first
            if (this.chartInstances['market-overview']) {
                this.chartInstances['market-overview'].destroy();
                delete this.chartInstances['market-overview'];
            }
            if (this.chartInstances['top-performers']) {
                this.chartInstances['top-performers'].destroy();
                delete this.chartInstances['top-performers'];
            }
            
            // Get real market data for charts
            const marketStocks = Object.entries(this.marketData || {}).map(([symbol, data]) => ({
                symbol,
                change: Number(data.changePercent) || 0,
                price: Number(data.price) || 0
            }));
            
            // Sort by change percentage to get top performers
            const topPerformers = marketStocks
                .sort((a, b) => b.change - a.change)
                .slice(0, 5);
            
            // Market Overview Chart
            const marketCtx = document.getElementById('market-overview-chart');
            if (marketCtx && marketCtx.getContext) {
                const ctx = marketCtx.getContext('2d');
                ctx.clearRect(0, 0, marketCtx.width, marketCtx.height);
                
                // Generate realistic market trend data
                const now = new Date();
                const labels = [];
                const data = [];
                for (let i = 7; i >= 0; i--) {
                    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
                    labels.push(time.getHours() + ':00');
                    
                    // Calculate market index based on average price movements
                    const avgChange = marketStocks.reduce((sum, stock) => sum + stock.change, 0) / marketStocks.length;
                    const baseIndex = 100;
                    const indexValue = baseIndex + (avgChange * (8 - i) / 8);
                    data.push(indexValue + (Math.random() - 0.5) * 2); // Add some noise
                }
                
                this.chartInstances['market-overview'] = new Chart(marketCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Market Index',
                            data: data,
                            borderColor: '#00ff88',
                            backgroundColor: 'rgba(0, 255, 136, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
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
                                    color: '#8892b0'
                                }
                            },
                            y: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#8892b0'
                                }
                            }
                        }
                    }
                });
            }

            // Top Performers Chart with real data
            const performersCtx = document.getElementById('top-performers-chart');
            if (performersCtx && performersCtx.getContext && topPerformers.length > 0) {
                const ctx = performersCtx.getContext('2d');
                ctx.clearRect(0, 0, performersCtx.width, performersCtx.height);
                
                this.chartInstances['top-performers'] = new Chart(performersCtx, {
                    type: 'bar',
                    data: {
                        labels: topPerformers.map(stock => stock.symbol),
                        datasets: [{
                            label: 'Daily Change (%)',
                            data: topPerformers.map(stock => stock.change),
                            backgroundColor: topPerformers.map(stock => 
                                stock.change > 0 ? '#00ff88' : '#ff4757'
                            ),
                            borderColor: '#00ff88',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
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
                                    color: '#8892b0'
                                }
                            },
                            y: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#8892b0',
                                    callback: function(value) {
                                        return value.toFixed(1) + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            console.log('✅ Dashboard charts initialized with real data');
        } catch (error) {
            console.error('❌ Error initializing dashboard charts:', error);
        }
    }
    
    initializeAnalyticsCharts() {
        try {
            // Destroy existing charts first to prevent canvas reuse
            if (this.chartInstances['market-cap']) {
                this.chartInstances['market-cap'].destroy();
                delete this.chartInstances['market-cap'];
            }
            if (this.chartInstances['volume-analysis']) {
                this.chartInstances['volume-analysis'].destroy();
                delete this.chartInstances['volume-analysis'];
            }
            if (this.chartInstances['price-distribution']) {
                this.chartInstances['price-distribution'].destroy();
                delete this.chartInstances['price-distribution'];
            }
            
            // Market Cap Over Time Chart
            const marketCapCtx = document.getElementById('market-cap-chart');
            if (marketCapCtx && marketCapCtx.getContext) {
                // Clear the canvas first
                const ctx = marketCapCtx.getContext('2d');
                ctx.clearRect(0, 0, marketCapCtx.width, marketCapCtx.height);
                
                this.chartInstances['market-cap'] = new Chart(marketCapCtx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(this.marketData || {}),
                        datasets: [{
                            data: Object.values(this.marketData || {}).map(stock => stock.price * 1000),
                            backgroundColor: [
                                '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
                                '#ef4444', '#ec4899', '#6366f1', '#84cc16'
                            ],
                            borderWidth: 2,
                            borderColor: '#1a1a2e'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    color: '#ffffff',
                                    padding: 15,
                                    usePointStyle: true
                                }
                            }
                        }
                    }
                });
            }

            // Volume Analysis Chart
            const volumeCtx = document.getElementById('volume-analysis-chart');
            if (volumeCtx && volumeCtx.getContext) {
                const ctx = volumeCtx.getContext('2d');
                ctx.clearRect(0, 0, volumeCtx.width, volumeCtx.height);
                
                this.chartInstances['volume-analysis'] = new Chart(volumeCtx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(this.marketData || {}),
                        datasets: [{
                            label: 'Trading Volume',
                            data: Object.values(this.marketData || {}).map(stock => stock.volume || 0),
                            backgroundColor: '#8b5cf6',
                            borderColor: '#8b5cf6',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: {
                                    color: '#ffffff'
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#8892b0'
                                }
                            },
                            y: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#8892b0'
                                }
                            }
                        }
                    }
                });
            }

            // Price Distribution Chart
            const priceCtx = document.getElementById('price-distribution-chart');
            if (priceCtx && priceCtx.getContext) {
                const ctx = priceCtx.getContext('2d');
                ctx.clearRect(0, 0, priceCtx.width, priceCtx.height);
                
                this.chartInstances['price-distribution'] = new Chart(priceCtx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Price vs Volume',
                            data: Object.values(this.marketData || {}).map(stock => ({
                                x: stock.volume || 0,
                                y: stock.price || 0
                            })),
                            backgroundColor: '#06b6d4',
                            borderColor: '#06b6d4'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                labels: {
                                    color: '#ffffff'
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Volume',
                                    color: '#ffffff'
                                },
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#8892b0'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Price ($)',
                                    color: '#ffffff'
                                },
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#8892b0'
                                }
                            }
                        }
                    }
                });
            }
            
            console.log('✅ Analytics charts initialized');
        } catch (error) {
            console.error('❌ Error initializing analytics charts:', error);
        }
    }
    
    initializeStockCharts() {
        // Stock page specific charts  
        console.log('Initializing stock charts...');
    }
    
    initializeStockChart(retryCount = 0) {
        console.log('🔄 Initializing individual stock chart...', `(attempt ${retryCount + 1})`);
        
        if (retryCount >= 10) {
            console.error('❌ Failed to initialize stock chart after 10 attempts');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded, retrying in 500ms...');
            setTimeout(() => this.initializeStockChart(retryCount + 1), 500);
            return;
        }

        const ctx = document.getElementById('stock-price-chart');
        if (!ctx) {
            console.warn('Stock price chart canvas not found, waiting for DOM...');
            // Try again after a longer delay to allow DOM to load
            setTimeout(() => this.initializeStockChart(retryCount + 1), 1000);
            return;
        }

        // Destroy existing chart if it exists - improved cleanup
        if (this.chartInstances.stockPrice) {
            try {
                this.chartInstances.stockPrice.destroy();
                console.log('🗑️ Destroyed existing stock chart');
            } catch (error) {
                console.warn('Warning cleaning up previous chart:', error);
            }
            delete this.chartInstances.stockPrice;
        }
        
        // Also check for any existing Chart.js instances on this canvas
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            try {
                existingChart.destroy();
                console.log('🗑️ Destroyed Chart.js instance on canvas');
            } catch (error) {
                console.warn('Warning destroying Chart.js instance:', error);
            }
        }

        // Generate mock price history data
        const now = Date.now();
        const labels = [];
        const data = [];
        const basePrice = this.marketData[this.currentSymbol]?.price || 100;

        // Generate 24 hours of data (hourly points)
        for (let i = 23; i >= 0; i--) {
            const timestamp = now - (i * 60 * 60 * 1000); // 1 hour intervals
            const date = new Date(timestamp);
            labels.push(date.getHours() + ':00');
            
            // Generate realistic price variation
            const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
            const price = basePrice * (1 + variation * (23 - i) / 23);
            data.push(price);
        }

        this.chartInstances.stockPrice = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${this.currentSymbol} Price`,
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2,
                    pointHoverRadius: 6
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
                        backgroundColor: 'rgba(26, 26, 26, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#b3b3b3',
                        borderColor: '#333333',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => `Price: $${context.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#333333'
                        },
                        ticks: {
                            color: '#b3b3b3'
                        }
                    },
                    y: {
                        grid: {
                            color: '#333333'
                        },
                        ticks: {
                            color: '#b3b3b3',
                            callback: (value) => `$${value.toFixed(2)}`
                        }
                    }
                }
            }
        });

        // Setup timeframe buttons
        document.querySelectorAll('.chart-timeframe').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-timeframe').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const timeframe = e.target.dataset.timeframe;
                this.updateChartTimeframe(timeframe);
            });
        });

        console.log('✅ Stock chart initialized successfully');
    }
    
    setupTradingPanel() {
        console.log('🔄 Setting up trading panel...');
        // Trading panel setup would go here - for now just log
        // This would include buy/sell buttons, amount inputs, etc.
    }

    updateCharts() {
        // Update all chart instances
        Object.keys(this.chartInstances).forEach(chartId => {
            const chart = this.chartInstances[chartId];
            if (chart && chart.update) {
                chart.update();
            }
        });
    }

    // Utility Methods
    formatNumber(number) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    formatLargeNumber(number) {
        if (number >= 1e9) {
            return (number / 1e9).toFixed(1) + 'B';
        } else if (number >= 1e6) {
            return (number / 1e6).toFixed(1) + 'M';
        } else if (number >= 1e3) {
            return (number / 1e3).toFixed(1) + 'K';
        }
        return this.formatNumber(number);
    }

    formatPercent(number) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number / 100);
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }
}

// Global instance - use singleton pattern
window.tradingDashboard = TradingDashboard.getInstance();

// Global utility functions
window.refreshMarketData = () => window.tradingDashboard.refreshData();
window.navigateToStock = (symbol) => window.tradingDashboard.showStockDetails(symbol);
window.hideStockDetails = () => {
    const overlay = document.getElementById('stock-details-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore background scroll
    }
    
    // Clean up chart
    if (window.tradingDashboard.selectedStockChart) {
        window.tradingDashboard.selectedStockChart.destroy();
        window.tradingDashboard.selectedStockChart = null;
    }
};
window.refreshStockData = () => {
    const symbolElement = document.getElementById('selected-stock-symbol');
    if (symbolElement) {
        const symbol = symbolElement.textContent;
        if (symbol && symbol !== 'LOADING...') {
            window.tradingDashboard.loadStockDetails(symbol);
        }
    }
};
