#!/usr/bin/env node

// Simple backend starter to avoid ES module issues
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Starting Backend API server...');

// Start backend with proper NODE_OPTIONS
const backend = spawn('node', ['--experimental-modules', '--experimental-specifier-resolution=node', 'backend/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    BACKEND_PORT: '3001',
    PORT: '3001'
  }
});

backend.on('error', (error) => {
  console.error('❌ Backend startup error:', error);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`🔧 Backend exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

process.on('SIGINT', () => {
  console.log('🛑 Stopping backend...');
  backend.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Stopping backend...');
  backend.kill('SIGTERM');
});
