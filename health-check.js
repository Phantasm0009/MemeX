#!/usr/bin/env node

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.memexbot.xyz';
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3002';

async function checkHealth() {
  console.log('🏥 Health Check Starting...\n');
  
  let allHealthy = true;

  // Check Backend API
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/health`, {
      timeout: 5000
    });
    
    if (backendResponse.ok) {
      const data = await backendResponse.json();
      console.log('✅ Backend API: Healthy');
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Uptime: ${Math.round(data.uptime)} seconds`);
      console.log(`   - Memory: ${Math.round(data.memory.heapUsed / 1024 / 1024)}MB`);
    } else {
      console.log('❌ Backend API: Unhealthy');
      console.log(`   - Status Code: ${backendResponse.status}`);
      allHealthy = false;
    }
  } catch (error) {
    console.log('❌ Backend API: Connection Failed');
    console.log(`   - Error: ${error.message}`);
    allHealthy = false;
  }

  // Check Dashboard
  try {
    const dashboardResponse = await fetch(`${DASHBOARD_URL}/health`, {
      timeout: 5000
    });
    
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard: Healthy');
    } else {
      console.log('❌ Dashboard: Unhealthy');
      console.log(`   - Status Code: ${dashboardResponse.status}`);
      allHealthy = false;
    }
  } catch (error) {
    console.log('❌ Dashboard: Connection Failed');
    console.log(`   - Error: ${error.message}`);
    allHealthy = false;
  }

  // Check Environment Variables
  const requiredEnvVars = [
    'BOT_TOKEN',
    'CLIENT_ID',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  console.log('\n🔐 Environment Variables:');
  let envHealthy = true;
  
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`);
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      envHealthy = false;
      allHealthy = false;
    }
  });

  // Overall Status
  console.log('\n' + '='.repeat(50));
  if (allHealthy && envHealthy) {
    console.log('🎉 Overall Health: HEALTHY');
    console.log('   All systems operational!');
    process.exit(0);
  } else {
    console.log('🚨 Overall Health: UNHEALTHY');
    console.log('   Some systems need attention!');
    process.exit(1);
  }
}

checkHealth().catch(error => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});
