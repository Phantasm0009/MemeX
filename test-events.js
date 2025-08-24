#!/usr/bin/env node

// Quick test script to verify global events fix
import { enhancedGlobalEvents } from './utils/enhancedGlobalEvents.js';

console.log('🧪 Testing Enhanced Global Events Fix...\n');

// Test the event system
async function testEvents() {
  console.log('📊 Initial state:');
  console.log(`   - lastEventName: ${enhancedGlobalEvents.lastEventName}`);
  console.log(`   - lastEventDescription: ${enhancedGlobalEvents.lastEventDescription}`);
  console.log(`   - lastEventTime: ${enhancedGlobalEvents.lastEventTime}`);
  
  console.log('\n🎲 Triggering events...');
  
  // Try to trigger an event
  const event = await enhancedGlobalEvents.checkForGlobalEvents();
  
  if (event) {
    console.log('\n✅ Event triggered successfully!');
    console.log(`   - Name: ${event.name}`);
    console.log(`   - Description: ${event.description}`);
    console.log(`   - Type: ${event.type}`);
    console.log(`   - Rarity: ${event.rarity}`);
    
    console.log('\n📋 Stored event info:');
    console.log(`   - lastEventName: ${enhancedGlobalEvents.lastEventName}`);
    console.log(`   - lastEventDescription: ${enhancedGlobalEvents.lastEventDescription}`);
    console.log(`   - lastEventRarity: ${enhancedGlobalEvents.lastEventRarity}`);
    console.log(`   - lastEventTime: ${enhancedGlobalEvents.lastEventTime}`);
    
    // Test API response format
    const activeEventInfo = {
      name: enhancedGlobalEvents.lastEventName || 'Unknown Event',
      description: enhancedGlobalEvents.lastEventDescription || 'A market event occurred',
      timeAgo: Date.now() - enhancedGlobalEvents.lastEventTime,
      duration: enhancedGlobalEvents.lastEventDuration || 60000,
      rarity: enhancedGlobalEvents.lastEventRarity || 'Common'
    };
    
    console.log('\n🌐 API Response Format:');
    console.log(JSON.stringify(activeEventInfo, null, 2));
    
  } else {
    console.log('\n⏳ No event triggered this time (this is normal - events are random)');
    console.log('💡 Try running the script again - events have various trigger chances');
  }
}

testEvents().catch(console.error);
