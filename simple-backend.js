#!/usr/bin/env node

// 🔧 Simple Backend Server for Italian Meme Stock Exchange
// Simplified version to avoid ES module issues

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Italian Meme Stock Exchange Backend',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Italian Meme Stock Exchange Backend API',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Basic market data endpoint
app.get('/api/market', (req, res) => {
  try {
    const marketPath = join(__dirname, '../market.json');
    if (fs.existsSync(marketPath)) {
      const marketData = JSON.parse(fs.readFileSync(marketPath, 'utf8'));
      res.json({ success: true, data: marketData });
    } else {
      res.json({ success: true, data: {} });
    }
  } catch (error) {
    console.error('❌ Market data error:', error);
    res.status(500).json({ success: false, error: 'Failed to load market data' });
  }
});

// Basic stocks endpoint
app.get('/api/stocks', (req, res) => {
  try {
    const metaPath = join(__dirname, '../meta.json');
    if (fs.existsSync(metaPath)) {
      const metaData = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      res.json({ success: true, data: metaData });
    } else {
      res.json({ success: true, data: {} });
    }
  } catch (error) {
    console.error('❌ Stocks data error:', error);
    res.status(500).json({ success: false, error: 'Failed to load stocks data' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Backend error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔧 Backend API server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📈 Market Data: http://localhost:${PORT}/api/market`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Backend received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Backend received SIGINT, shutting down gracefully');
  process.exit(0);
});
