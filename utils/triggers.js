// Detects event triggers from recent messages
export function getEventBonuses(messages) {
  const bonuses = {};
  let lastEvent = '';
  
  // Count occurrences of different triggers
  let pastaCount = 0;
  let romanceCount = 0;
  let pizzaCount = 0;
  let imposterCount = 0;
  let beachCount = 0;
  let oilShortageCount = 0;
  let sharknadoCount = 0;
  let espressoShortageCount = 0;
  
  // Get current hour for time-based events
  const currentHour = new Date().getHours();
  const isPastaHours = currentHour >= 12 && currentHour <= 14; // Lunch time
  const isBeachHours = currentHour >= 10 && currentHour <= 16; // Beach hours
  const isSunday = new Date().getDay() === 0;
  
  for (const msg of messages) {
    const content = msg.content.toLowerCase();
    
    // Pasta Protocol - Italian stocks boost (SKIBI special during pasta hours)
    if (msg.content.includes('🍝') || /pasta|spaghetti|linguine|carbonara|penne|ravioli/i.test(content)) {
      pastaCount++;
    }
    
    // Pizza Power - SAHUR boost 
    if (msg.content.includes('🍕') || /pizza|margherita|pepperoni/i.test(content)) {
      pizzaCount++;
    }
    
    // Romance surge - RIZZL boost
    if (/romance|love|dating|rizz|charm|flirt|casanova|amore/i.test(content)) {
      romanceCount++;
    }
    
    // Imposter panic - SUS drops
    if (/imposter|impostor|sus|suspicious|among us|vent|crewmate/i.test(content)) {
      imposterCount++;
    }
    
    // Beach vibes - GYATT volatility boost
    if (/beach|sand|ocean|surf|bikini|summer|vacation/i.test(content)) {
      beachCount++;
    }
    
    // Oil shortage - FRIED boost
    if (/oil shortage|olive oil|cooking oil|fried|deep fry|shortage/i.test(content)) {
      oilShortageCount++;
    }
    
    // Sharknado - TRALA boost
    if (/shark|tornado|sharknado|nike|sneakers|three.*leg/i.test(content)) {
      sharknadoCount++;
    }
    
    // Espresso shortage - CAPPU boost
    if (/espresso|coffee shortage|caffeine|barista|cappuccino/i.test(content)) {
      espressoShortageCount++;
    }
  }
  
  // Apply bonuses based on trigger counts
  if (pastaCount >= 1) {
    // All Italian stocks get pasta boost
    bonuses['SKIBI'] = 0.25;
    bonuses['SUS'] = 0.15;
    bonuses['SAHUR'] = 0.15;
    bonuses['LABUB'] = 0.15;
    bonuses['OHIO'] = 0.15;
    bonuses['RIZZL'] = 0.15;
    bonuses['GYATT'] = 0.15;
    bonuses['FRIED'] = 0.15;
    bonuses['SIGMA'] = 0.15;
    bonuses['TRALA'] = 0.15;
    bonuses['CROCO'] = 0.15;
    bonuses['FANUM'] = 0.15;
    bonuses['CAPPU'] = 0.15;
    bonuses['BANANI'] = 0.15;
    bonuses['LARILA'] = 0.15;
    
    // SKIBI gets extra boost during pasta hours
    if (isPastaHours) {
      bonuses['SKIBI'] = 0.30;
      lastEvent = `🍝 Gabibbi Toiletto time! SKIBI gets +30% during pasta hours (${pastaCount} pasta mentions)`;
    } else {
      lastEvent = `🍝 Pasta Protocol! All Italian stocks +15-25% (${pastaCount} pasta mentions)`;
    }
  }
  
  if (pizzaCount >= 1) {
    bonuses['SAHUR'] = (bonuses['SAHUR'] || 0) + 0.15;
    lastEvent = `🍕 Tamburello Mistico! SAHUR +15% from pizza power (${pizzaCount} pizza mentions)`;
  }
  
  if (romanceCount >= 2) {
    bonuses['RIZZL'] = (bonuses['RIZZL'] || 0) + 0.25;
    lastEvent = `💕 Casanova activated! RIZZL +25% from romance surge (${romanceCount} romance mentions)`;
  }
  
  if (imposterCount >= 1) {
    bonuses['SUS'] = (bonuses['SUS'] || 0) - 0.20;
    lastEvent = `😱 Tra-I-Nostri panic! SUS -20% from imposter reports (${imposterCount} sus mentions)`;
  }
  
  if (beachCount >= 1 && isBeachHours) {
    bonuses['GYATT'] = (bonuses['GYATT'] || 0) + 0.20; // Double volatility effect
    lastEvent = `🏖️ Culone beach time! GYATT volatility doubled during beach hours (${beachCount} beach mentions)`;
  }
  
  if (oilShortageCount >= 1) {
    bonuses['FRIED'] = (bonuses['FRIED'] || 0) + 0.40;
    lastEvent = `🫒 Friggitrice shortage! FRIED +40% during oil crisis (${oilShortageCount} oil mentions)`;
  }
  
  if (sharknadoCount >= 1) {
    bonuses['TRALA'] = (bonuses['TRALA'] || 0) + 0.50;
    lastEvent = `🦈🌪️ Sharknado event! TRALA +50% - 3-legged shark in Nikes detected! (${sharknadoCount} shark mentions)`;
  }
  
  if (espressoShortageCount >= 1) {
    bonuses['CAPPU'] = (bonuses['CAPPU'] || 0) + 0.20;
    lastEvent = `☕ Ballerina Cappuccina shortage! CAPPU +20% during espresso crisis (${espressoShortageCount} coffee mentions)`;
  }
  
  // Sunday immunity for LABUB
  if (isSunday) {
    bonuses['LABUB_SUNDAY_IMMUNITY'] = true;
    if (!lastEvent) lastEvent = '🛡️ Mostriciattolo Sunday immunity active! LABUB protected from crashes';
  }
  
  return { ...bonuses, lastEvent };
}

// Get recent messages from a channel (for event detection)
export async function getRecentMessages(channel, limit = 20) {
  if (!channel || !channel.isTextBased()) return [];
  
  try {
    const messages = await channel.messages.fetch({ limit });
    return Array.from(messages.values()).reverse(); // Oldest first
  } catch (error) {
    console.log('Error fetching recent messages:', error.message);
    return [];
  }
}

// Enhanced chaos events with new stock personalities
export function getRandomChaosEvent() {
  const events = [
    {
      name: 'CROCO_NUKE',
      description: 'Bombardiro Crocodilo explodes and nukes a random stock!',
      effect: () => {
        const stocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
        const target = stocks[Math.floor(Math.random() * stocks.length)];
        return { [target]: -1.0, lastEvent: `💥 Bombardiro Crocodilo NUKE! ${target} obliterated -100%!` };
      }
    },
    {
      name: 'OHIO_STEAL',
      description: 'Caporetto Finale steals value from another stock',
      effect: () => {
        const stocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'FANUM', 'CAPPU', 'BANANI', 'LARILA'];
        const victim = stocks[Math.floor(Math.random() * stocks.length)];
        return { 
          [victim]: -0.05, 
          'OHIO': 0.05, 
          lastEvent: `🌪️ Caporetto Finale steals 5% from ${victim}!` 
        };
      }
    },
    {
      name: 'LARILA_FREEZE',
      description: 'Lirili Larila uses time control to freeze market movement',
      effect: () => {
        return { 
          lastEvent: '🧊⏰ Lirili Larila time freeze! Reduced volatility next update - cactus-elephant controls time!',
          TIME_FREEZE: true 
        };
      }
    },
    {
      name: 'SIGMA_FLEX',
      description: 'Machio flexes during market dip',
      effect: () => {
        return { 
          'SIGMA': 0.15,
          lastEvent: '💪 Machio flexes on the bears! SIGMA +15% chad energy!' 
        };
      }
    },
    {
      name: 'FANUM_TAX',
      description: 'Tassa Nonna collects weekly tax',
      effect: () => {
        const stocks = ['SKIBI', 'SUS', 'SAHUR', 'LABUB', 'OHIO', 'RIZZL', 'GYATT', 'FRIED', 'SIGMA', 'TRALA', 'CROCO', 'CAPPU', 'BANANI', 'LARILA'];
        const taxedStock = stocks[Math.floor(Math.random() * stocks.length)];
        return { 
          [taxedStock]: -0.10,
          'FANUM': 0.05,
          lastEvent: `👵💰 Tassa Nonna collects! FANUM taxes ${taxedStock} -10%!` 
        };
      }
    },
    {
      name: 'BANANI_INVINCIBLE',
      description: 'Chimpanzini Bananini shows invincibility',
      effect: () => {
        return { 
          'BANANI': 0.10,
          lastEvent: '🦍🍌 Chimpanzini Bananini is invincible! +10% ape power!' 
        };
      }
    },
    {
      name: 'BULL_RUN',
      description: 'Sudden meme market bull run!',
      effect: () => {
        return { 
          'SKIBI': 0.08,
          'SUS': 0.08,
          'SAHUR': 0.08,
          'LABUB': 0.08,
          'OHIO': 0.08,
          'RIZZL': 0.08,
          'GYATT': 0.08,
          'FRIED': 0.08,
          'SIGMA': 0.08,
          'TRALA': 0.08,
          'CROCO': 0.08,
          'FANUM': 0.08,
          'CAPPU': 0.08,
          'BANANI': 0.08,
          'LARILA': 0.08,
          lastEvent: '🚀 Meme bull run! All stocks +8%!' 
        };
      }
    }
  ];
  
  // 15% chance of chaos event (increased for more action)
  if (Math.random() < 0.15) {
    const event = events[Math.floor(Math.random() * events.length)];
    return event.effect();
  }
  
  return {};
}
