#!/usr/bin/env node

// Manual Discord User Info Sync Script
// This script manually syncs Discord user info to test the username system

import dotenv from 'dotenv';
import { getUser, getDiscordUserInfo } from './utils/supabaseDb.js';

dotenv.config();

// Test Discord user object (simulating the user from the leaderboard)
const testDiscordUser = {
  id: '1225485426349969518',
  username: 'phantasm0009',
  globalName: 'Phantasm',
  displayName: 'Phantasm',
  discriminator: null
};

async function syncTestUser() {
  console.log('🧪 Testing Discord User Info Sync...\n');
  
  try {
    console.log('📝 Test user data:');
    console.log(`   ID: ${testDiscordUser.id}`);
    console.log(`   Username: ${testDiscordUser.username}`);
    console.log(`   Global Name: ${testDiscordUser.globalName}`);
    console.log(`   Display Name: ${testDiscordUser.displayName}`);
    
    // Extract Discord user info
    const discordUserInfo = getDiscordUserInfo(testDiscordUser);
    console.log('\n📊 Extracted Discord info:', discordUserInfo);
    
    // Get/update user with Discord info
    console.log('\n🔄 Syncing user with Discord info...');
    const user = await getUser(testDiscordUser.id, discordUserInfo);
    
    console.log('\n✅ User synced successfully!');
    console.log('💡 Now test the leaderboard API to see if usernames updated');
    
  } catch (error) {
    console.error('❌ Error syncing user:', error);
  }
}

syncTestUser().catch(console.error);
