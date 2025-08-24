#!/usr/bin/env node

// Comprehensive Discord User Sync Script
// This script syncs Discord user info to all available backends

import dotenv from 'dotenv';

dotenv.config();

const testDiscordUser = {
  id: '1225485426349969518',
  username: 'phantasm0009',
  globalName: 'Phantasm',
  displayName: 'Phantasm',
  discriminator: null
};

async function syncToBackend(backendUrl, userInfo) {
  try {
    console.log(`🔄 Syncing to ${backendUrl}...`);
    
    const response = await fetch(`${backendUrl}/api/user/${userInfo.id}/discord-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: userInfo.username,
        globalName: userInfo.globalName,
        displayName: userInfo.displayName,
        discriminator: userInfo.discriminator
      })
    });

    if (response.ok) {
      console.log(`✅ Successfully synced to ${backendUrl}`);
      return true;
    } else {
      console.log(`❌ Failed to sync to ${backendUrl}: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error syncing to ${backendUrl}:`, error.message);
    return false;
  }
}

async function testLeaderboard(backendUrl) {
  try {
    console.log(`🧪 Testing leaderboard at ${backendUrl}...`);
    
    const response = await fetch(`${backendUrl}/api/leaderboard?limit=1`);
    if (response.ok) {
      const data = await response.json();
      const user = data.leaderboard?.[0];
      if (user) {
        console.log(`📊 Leaderboard result:`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Display Name: ${user.displayName}`);
        console.log(`   Global Name: ${user.globalName || 'N/A'}`);
        return user;
      }
    }
  } catch (error) {
    console.log(`❌ Error testing leaderboard:`, error.message);
  }
  return null;
}

async function main() {
  console.log('🔄 Comprehensive Discord User Sync Test\n');
  
  const backends = [
    'http://localhost:3001',
    'http://159.203.134.206:3001', // DigitalOcean backend from earlier logs
  ];

  console.log('📝 Test user data:');
  console.log(`   ID: ${testDiscordUser.id}`);
  console.log(`   Username: ${testDiscordUser.username}`);
  console.log(`   Global Name: ${testDiscordUser.globalName}`);
  console.log(`   Display Name: ${testDiscordUser.displayName}\n`);

  for (const backendUrl of backends) {
    console.log(`\n🎯 Testing backend: ${backendUrl}`);
    console.log('='.repeat(50));
    
    // Test if backend is reachable
    try {
      const healthResponse = await fetch(`${backendUrl}/api/health`);
      if (!healthResponse.ok) {
        console.log(`❌ Backend not reachable (${healthResponse.status})`);
        continue;
      }
      console.log(`✅ Backend is reachable`);
    } catch (error) {
      console.log(`❌ Backend not reachable: ${error.message}`);
      continue;
    }

    // Test current leaderboard state
    await testLeaderboard(backendUrl);
    
    // Sync Discord user info
    const syncSuccess = await syncToBackend(backendUrl, testDiscordUser);
    
    if (syncSuccess) {
      // Wait a moment for sync to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test leaderboard again
      console.log(`🔄 Re-testing leaderboard after sync...`);
      await testLeaderboard(backendUrl);
    }
  }

  console.log('\n✅ Sync test completed!');
  console.log('💡 If usernames are still not updated, the backend might be using a different database or caching the data.');
}

main().catch(console.error);
