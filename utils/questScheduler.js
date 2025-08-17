import cron from 'node-cron';
import { resetAllQuests } from '../utils/supabaseDb.js';

// Schedule daily quest reset at midnight UTC
export function scheduleDailyQuestReset() {
  // Reset quests every day at 00:00 UTC
  cron.schedule('0 0 * * *', async () => {
    console.log('🎯 Running daily quest reset...');
    try {
      await resetAllQuests();
      console.log('✅ Daily quests reset successfully');
    } catch (error) {
      console.error('❌ Error resetting daily quests:', error);
    }
  }, {
    timezone: "UTC"
  });
  
  console.log('⏰ Daily quest reset scheduler initialized (00:00 UTC)');
}

// Alternative: Reset based on user's timezone (optional future feature)
export function scheduleUserTimezoneQuestReset(timezone = 'America/New_York') {
  cron.schedule('0 0 * * *', async () => {
    console.log(`🎯 Running quest reset for timezone: ${timezone}`);
    try {
      await resetAllQuests();
      console.log('✅ Timezone-based quest reset completed');
    } catch (error) {
      console.error('❌ Error in timezone quest reset:', error);
    }
  }, {
    timezone: timezone
  });
}

export default { scheduleDailyQuestReset, scheduleUserTimezoneQuestReset };
