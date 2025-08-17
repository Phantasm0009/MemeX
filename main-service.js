#!/usr/bin/env node

// 🎯 Main Service - Combines Discord Bot + Dashboard for Render deployment

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Italian Meme Stock Exchange - Main Service');
console.log('🤖 Discord Bot + 📊 Dashboard Combined');

// Express app for health checks and dashboard
const app = express();
const PORT = process.env.PORT || 10000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'main-service',
    components: ['discord-bot', 'dashboard'],
    timestamp: new Date().toISOString()
  });
});

// Start dashboard server on same port
app.use(express.static(path.join(__dirname, 'dashboard', 'public')));

// Start dashboard server logic
let dashboardServer;
try {
  const dashboardModule = await import('./dashboard/server.js');
  console.log('✅ Dashboard module loaded');
} catch (error) {
  console.error('❌ Failed to load dashboard:', error.message);
}

// Start the main Express server
const server = app.listen(PORT, () => {
  console.log(`✅ Main service running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});

// Start Discord bot as a child process
console.log('🤖 Starting Discord Bot...');
const botProcess = spawn('node', ['index.js'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, BACKEND_URL: process.env.BACKEND_URL || 'https://italian-meme-backend.onrender.com' }
});

botProcess.on('error', (error) => {
  console.error('❌ Discord Bot Error:', error);
});

botProcess.on('exit', (code) => {
  console.log(`🤖 Discord Bot exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting Discord Bot...');
    setTimeout(() => {
      // Restart bot
      const newBotProcess = spawn('node', ['index.js'], {
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env, BACKEND_URL: process.env.BACKEND_URL || 'https://italian-meme-backend.onrender.com' }
      });
    }, 5000);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Graceful shutdown initiated...');
  
  // Close Express server
  server.close(() => {
    console.log('✅ Express server closed');
  });
  
  // Kill bot process
  if (botProcess) {
    botProcess.kill('SIGINT');
  }
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  
  server.close(() => {
    console.log('✅ Express server closed');
    process.exit(0);
  });
});

console.log('🎯 Main Service started successfully!');
console.log('🤖 Discord Bot: Running');
console.log('📊 Dashboard: Running');
console.log(`🌐 Access at: http://localhost:${PORT}`);
