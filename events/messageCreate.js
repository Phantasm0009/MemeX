import { getUser, updateUserBalance, updateUserLastMessage, completeQuest, getUserQuestProgress, getDiscordUserInfo } from '../utils/supabaseDb.js';

const COOLDOWN = 60 * 1000; // 1 minute
const REWARD = 5;

export default async function messageCreate(message) {
  if (message.author.bot) return;
  
  const userId = message.author.id;
  const discordUserInfo = getDiscordUserInfo(message.author);
  const user = await getUser(userId, discordUserInfo);
  const now = Date.now();
  
  // Regular message rewards (existing logic)
  if (!user.lastMessage || now - user.lastMessage > COOLDOWN) {
    await updateUserBalance(userId, user.balance + REWARD);
    await updateUserLastMessage(userId, now);
    
    // Optional: React to acknowledge the reward (uncomment if desired)
    // message.react('💰').catch(() => {});
  }

  // Quest tracking
  try {
    // Generate daily quests if user doesn't have any
    await getUserQuestProgress(userId);
    
    // Track quest progress
    const messageContent = message.content.toLowerCase();
    
    // Check for "hi" quest
    if (messageContent.includes('hi') || messageContent.includes('hello') || 
        messageContent.includes('ciao') || messageContent.includes('hey')) {
      const result = await completeQuest(userId, 'say_hi');
      console.log(`Hi quest result for ${userId}: ${result}`);
    }
    
    // Daily message quest - always track when user sends a message
    const messageResult = await completeQuest(userId, 'send_message');
    console.log(`Message quest result for ${userId}: ${messageResult}`);
    
    // Check for pasta mentions
    if (messageContent.includes('pizza') || messageContent.includes('pasta') || 
        messageContent.includes('spaghetti') || messageContent.includes('mamma mia')) {
      const pastaResult = await completeQuest(userId, 'pasta_mention');
      console.log(`Pasta quest result for ${userId}: ${pastaResult}`);
    }
    
  } catch (error) {
    console.error('Error tracking quest progress:', error);
  }
}
