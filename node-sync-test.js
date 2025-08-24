#!/usr/bin/env node

// Direct Discord User Sync Test via Node.js fetch
import fetch from 'node-fetch';

const testDiscordUser = {
  id: '1225485426349969518',
  username: 'phantasm0009',
  globalName: 'Phantasm',
  displayName: 'Phantasm',
  discriminator: null
};

async function testSync() {
  console.log('🧪 Testing Discord user sync with Node.js fetch...\n');
  
  try {
    console.log('📝 Sending Discord user info...');
    console.log(`   User ID: ${testDiscordUser.id}`);
    console.log(`   Username: ${testDiscordUser.username}`);
    console.log(`   Global Name: ${testDiscordUser.globalName}`);
    console.log(`   Display Name: ${testDiscordUser.displayName}\n`);

    // Test health first
    console.log('🔍 Testing backend health...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      console.log('✅ Backend is healthy');
    } else {
      console.log('❌ Backend health check failed');
      return;
    }

    // Send Discord sync request
    console.log('\n🔄 Sending Discord sync request...');
    const response = await fetch(`http://localhost:3001/api/user/${testDiscordUser.id}/discord-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: testDiscordUser.username,
        globalName: testDiscordUser.globalName,
        displayName: testDiscordUser.displayName,
        discriminator: testDiscordUser.discriminator
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Discord sync successful!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Discord sync failed!');
      console.log('📄 Error:', error);
    }

    // Test leaderboard
    console.log('\n🏆 Testing leaderboard...');
    const leaderboardResponse = await fetch('http://localhost:3001/api/leaderboard?limit=1');
    if (leaderboardResponse.ok) {
      const leaderboard = await leaderboardResponse.json();
      const user = leaderboard.leaderboard?.[0];
      if (user) {
        console.log('📊 Leaderboard user:');
        console.log(`   Username: ${user.username}`);
        console.log(`   Display Name: ${user.displayName}`);
        console.log(`   Global Name: ${user.globalName || 'N/A'}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSync();
