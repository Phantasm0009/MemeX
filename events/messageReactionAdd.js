import { completeQuest, getUserQuestProgress } from '../utils/supabaseDb.js';

export default async function messageReactionAdd(reaction, user) {
  // Don't track bot reactions
  if (user.bot) return;
  
  try {
    const userId = user.id;
    
    // Generate daily quests if user doesn't have any
    await getUserQuestProgress(userId);
    
    // Track quest progress for adding reactions
    await completeQuest(userId, 'react_message');
    
    // Track specific emoji reactions
    const emoji = reaction.emoji.name;
    if (['🍕', '🍝', '🇮🇹', '💰', '📈', '📉'].includes(emoji)) {
      await completeQuest(userId, 'pasta_mention'); // Reuse pasta_mention for Italian emojis
    }
    
  } catch (error) {
    console.error('Error tracking reaction quest progress:', error);
  }
}
