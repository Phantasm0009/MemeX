#!/usr/bin/env node

// 🚀 Fly.io Service - Combines Discord Bot + Dashboard + Backend for single deployment

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Italian Meme Stock Exchange - Fly.io Service');
console.log('🤖 Discord Bot + 📊 Dashboard + 🔧 Backend Combined');

// Express app for health checks and dashboard
const app = express();
const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'Italian Meme Stock Exchange',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    platform: 'fly.io'
  });
});

// Serve dashboard static files
app.use(express.static(join(__dirname, 'dashboard', 'public')));

// API routes (embedded backend)
app.use(express.json());
app.use('/api', (req, res, next) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Import and setup API routes
let marketAPI;
try {
  const marketModule = await import('./backend/server.js');
  // Add API routes to our express app
  app.use('/api', marketModule.router || marketModule.default);
  console.log('✅ Backend API routes integrated');
} catch (error) {
  console.warn('⚠️ Could not load backend API:', error.message);
  
  // Basic fallback API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'fallback-api' });
  });
}

// Start Express server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});

// Start Discord bot as child process
let botProcess;

function startBot() {
  console.log('🤖 Starting Discord bot...');
  
  botProcess = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { ...process.env }
  });

  botProcess.on('close', (code) => {
    console.log(`🤖 Bot process exited with code ${code}`);
    
    // Restart bot if it crashes (unless we're shutting down)
    if (!isShuttingDown && code !== 0) {
      console.log('🔄 Restarting bot in 5 seconds...');
      setTimeout(startBot, 5000);
    }
  });

  botProcess.on('error', (error) => {
    console.error('❌ Bot process error:', error);
  });
}

// Start the bot
startBot();

// Graceful shutdown handling
let isShuttingDown = false;

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close Express server
  server.close(() => {
    console.log('✅ Express server closed');
  });
  
  // Kill bot process
  if (botProcess) {
    console.log('🤖 Stopping Discord bot...');
    botProcess.kill('SIGTERM');
    
    // Force kill if it doesn't stop gracefully
    setTimeout(() => {
      if (botProcess && !botProcess.killed) {
        console.log('🔥 Force killing bot process...');
        botProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  // Exit after cleanup
  setTimeout(() => {
    console.log('👋 Goodbye!');
    process.exit(0);
  }, 6000);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

console.log('✅ Fly.io service started successfully');
console.log('🎯 All components running in single container');
