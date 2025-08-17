import googleTrends from 'google-trends-api';
import Snoowrap from 'snoowrap';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import { simpleTikTokScraper } from './simpleTikTokScraper.js';

// Stock name mappings for better search results
const stockNameMappings = {
  'SKIBI': ['skibidi toilet', 'skibidi', 'toilet meme', 'gen alpha'],
  'SUS': ['among us', 'sus', 'imposter', 'crewmate', 'emergency meeting'],
  'SAHUR': ['tun tun sahur', 'sahur', 'tamburello', 'drumming meme'],
  'LABUB': ['labubu', 'pop mart', 'labubu doll', 'cute monster'],
  'OHIO': ['ohio meme', 'ohio final boss', 'only in ohio', 'ohio skibidi'],
  'RIZZL': ['rizzler', 'rizz', 'charisma', 'ohio rizzler'],
  'GYATT': ['gyatt', 'gyat meme', 'thick', 'kai cenat gyatt'],
  'FRIED': ['deep fryer meme', 'fried', 'cooking', 'deep fried'],
  'SIGMA': ['sigma male', 'sigma grindset', 'alpha male', 'patrick bateman'],
  'TRALA': ['tralalero tralala', 'shark nike', 'three legged shark', 'italian meme'],
  'CROCO': ['bombardiro crocodilo', 'crocodile meme', 'croco', 'italian crocodile'],
  'FANUM': ['fanum tax', 'fanum', 'kai cenat', 'fanum meme'],
  'CAPPU': ['ballerina cappuccina', 'coffee dance', 'cappuccino', 'italian coffee'],
  'BANANI': ['chimpanzini bananini', 'monkey banana', 'ape meme', 'banana ape'],
  'LARILA': ['lirili larila', 'cactus elephant', 'time control', 'italian sound']
};

// Rate limiting for Google Trends
let lastGoogleTrendsCall = 0;
const GOOGLE_TRENDS_COOLDOWN = 10000; // Increased to 10 seconds
let googleTrendsFailCount = 0;
const MAX_GOOGLE_TRENDS_FAILS = 5;

// Initialize APIs
let reddit = null;
let youtube = null;

// Initialize Reddit API
if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
  try {
    reddit = new Snoowrap({
      userAgent: 'italian-meme-stock-bot/1.0.0',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN,
      accessToken: process.env.REDDIT_ACCESS_TOKEN
    });
    console.log('✅ Reddit API initialized');
  } catch (error) {
    console.log('⚠️ Reddit API initialization failed:', error.message);
  }
}

// Initialize YouTube API
if (process.env.YOUTUBE_API_KEY) {
  try {
    youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    console.log('✅ YouTube API initialized');
  } catch (error) {
    console.log('⚠️ YouTube API initialization failed:', error.message);
  }
}

export async function getTrendScore(stockSymbol) {
  let totalScore = 0;
  let sourceCount = 0;
  
  const searchTerms = stockNameMappings[stockSymbol] || [stockSymbol.toLowerCase()];
  const primaryTerm = searchTerms[0];
  
  console.log(`🔍 Fetching trends for ${stockSymbol} (${primaryTerm})...`);
  
  // Google Trends (25% weight) - Skip if failing too much
  if (googleTrendsFailCount < MAX_GOOGLE_TRENDS_FAILS) {
    try {
      const googleScore = await getGoogleTrend(primaryTerm);
      if (googleScore !== null) {
        totalScore += googleScore * 0.25;
        sourceCount++;
        console.log(`📈 Google Trends: ${(googleScore * 100).toFixed(1)}%`);
        googleTrendsFailCount = Math.max(0, googleTrendsFailCount - 1); // Reduce fail count on success
      }
    } catch (error) {
      console.log(`Google Trends API error: ${error.message.substring(0, 50)}`);
      googleTrendsFailCount++;
      const fallbackScore = getIntelligentGoogleFallback(primaryTerm);
      totalScore += fallbackScore * 0.25;
      sourceCount++;
      console.log(`📈 Google Trends: ${(fallbackScore * 100).toFixed(1)}% (simulated)`);
    }
  } else {
    // Use intelligent simulation when Google Trends is consistently failing
    const fallbackScore = getIntelligentGoogleFallback(primaryTerm);
    totalScore += fallbackScore * 0.25;
    sourceCount++;
    console.log(`📈 Google Trends: ${(fallbackScore * 100).toFixed(1)}% (simulation)`);
  }
  
  try {
    // Twitter/X API (25% weight)
    const twitterScore = await getTwitterMentions(searchTerms);
    if (twitterScore !== null) {
      totalScore += twitterScore * 0.25;
      sourceCount++;
      console.log(`🐦 Twitter/X: ${(twitterScore * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.log(`Twitter API error: ${error.message.substring(0, 50)}`);
    const fallbackScore = (Math.random() - 0.5) * 0.03;
    totalScore += fallbackScore * 0.25;
    sourceCount++;
    console.log(`🐦 Twitter/X: ${(fallbackScore * 100).toFixed(1)}%`);
  }
  
  try {
    // Reddit API (20% weight)
    const redditScore = await getRedditMentions(searchTerms);
    if (redditScore !== null) {
      totalScore += redditScore * 0.20;
      sourceCount++;
      console.log(`🔴 Reddit: ${(redditScore * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.log(`Reddit API error: ${error.message.substring(0, 50)}`);
    const fallbackScore = (Math.random() - 0.5) * 0.02;
    totalScore += fallbackScore * 0.20;
    sourceCount++;
    console.log(`🔴 Reddit: ${(fallbackScore * 100).toFixed(1)}%`);
  }
  
  try {
    // YouTube API (15% weight)
    const youtubeScore = await getYouTubeMentions(searchTerms);
    if (youtubeScore !== null) {
      totalScore += youtubeScore * 0.15;
      sourceCount++;
      console.log(`📺 YouTube: ${(youtubeScore * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.log(`YouTube API error: ${error.message.substring(0, 50)}`);
    const fallbackScore = (Math.random() - 0.5) * 0.02;
    totalScore += fallbackScore * 0.15;
    sourceCount++;
    console.log(`📺 YouTube: ${(fallbackScore * 100).toFixed(1)}%`);
  }
  
  try {
    // Simple TikTok simulation (15% weight)
    const tiktokScore = await simpleTikTokScraper.getTikTokTrendScore(stockSymbol);
    totalScore += tiktokScore * 0.15;
    sourceCount++;
    console.log(`🎵 TikTok: ${(tiktokScore * 100).toFixed(1)}%`);
  } catch (error) {
    console.log(`TikTok simulation error: ${error.message.substring(0, 50)}`);
    const fallbackScore = (Math.random() - 0.5) * 0.01;
    totalScore += fallbackScore * 0.15;
    sourceCount++;
    console.log(`🎵 TikTok: ${(fallbackScore * 100).toFixed(1)}%`);
  }
  
  if (sourceCount > 0) {
    console.log(`✅ Combined ${sourceCount} sources: ${(totalScore * 100).toFixed(1)}%`);
  }
  
  // Return score between -0.08 and +0.08 (8% max change)
  return Math.max(-0.08, Math.min(0.08, totalScore));
}

function getIntelligentGoogleFallback(keyword) {
  // Simulate Google Trends based on keyword popularity and current trends
  const trendingNow = {
    'skibidi': 0.02,
    'toilet': 0.015,
    'sigma': 0.018,
    'rizz': 0.025,
    'ohio': 0.02,
    'gyatt': 0.03,
    'among us': 0.01,
    'sus': 0.012,
    'labubu': 0.008,
    'fanum': 0.015
  };

  const lowerKeyword = keyword.toLowerCase();
  let baseScore = 0;

  // Check if keyword matches trending terms
  for (const [trend, score] of Object.entries(trendingNow)) {
    if (lowerKeyword.includes(trend) || trend.includes(lowerKeyword)) {
      baseScore += score;
    }
  }

  // Add time-based variation (Google searches vary by time)
  const hour = new Date().getHours();
  let timeMultiplier = 1;
  if (hour >= 16 && hour <= 22) { // Peak search hours
    timeMultiplier = 1.2;
  } else if (hour >= 0 && hour <= 6) { // Low search hours
    timeMultiplier = 0.7;
  }

  baseScore *= timeMultiplier;

  // Add some controlled randomness
  const randomVariation = (Math.random() - 0.5) * 0.02;
  
  return Math.max(-0.03, Math.min(0.05, baseScore + randomVariation));
}

async function getGoogleTrend(keyword) {
  try {
    // Enhanced rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - lastGoogleTrendsCall;
    if (timeSinceLastCall < GOOGLE_TRENDS_COOLDOWN) {
      await new Promise(resolve => setTimeout(resolve, GOOGLE_TRENDS_COOLDOWN - timeSinceLastCall));
    }
    lastGoogleTrendsCall = Date.now();
    
    // Use different time periods to avoid rate limits
    const timeOptions = [
      new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
    ];
    
    const startTime = timeOptions[Math.floor(Math.random() * timeOptions.length)];
    
    const result = await googleTrends.interestOverTime({
      keyword: keyword,
      startTime: startTime,
      geo: 'US'
    });
    
    // Better JSON parsing with error handling
    let data;
    try {
      data = JSON.parse(result);
    } catch (parseError) {
      console.log('Google Trends JSON parse failed, using intelligent fallback');
      throw new Error('Invalid response format from Google Trends');
    }
    
    if (!data.default?.timelineData?.length) {
      return getIntelligentGoogleFallback(keyword);
    }
    
    // Get latest data points
    const timelineData = data.default.timelineData;
    const recent = timelineData.slice(-2); // Last 2 data points
    
    // Calculate average interest
    const avgInterest = recent.reduce((sum, point) => {
      return sum + (point.value?.[0] || 0);
    }, 0) / recent.length;
    
    // Convert to trend score (-0.05 to +0.05)
    const trendScore = (avgInterest - 50) / 1000;
    return Math.max(-0.05, Math.min(0.05, trendScore));
    
  } catch (error) {
    console.log('Google Trends fallback:', error.message.substring(0, 50));
    return getIntelligentGoogleFallback(keyword);
  }
}

async function getTwitterMentions(searchTerms) {
  const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
  
  if (!TWITTER_BEARER_TOKEN) {
    return (Math.random() - 0.5) * 0.03; // Random fallback
  }
  
  try {
    const query = searchTerms.slice(0, 2).join(' OR '); // Max 2 terms
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=public_metrics`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'User-Agent': 'italian-meme-stock-bot/1.0'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      return (Math.random() - 0.5) * 0.03;
    }
    
    const data = await response.json();
    
    if (!data.data?.length) {
      return (Math.random() - 0.5) * 0.01;
    }
    
    // Calculate engagement score
    let totalEngagement = 0;
    let tweetCount = data.data.length;
    
    for (const tweet of data.data) {
      const metrics = tweet.public_metrics || {};
      totalEngagement += (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0);
    }
    
    // Normalize to trend score
    const avgEngagement = totalEngagement / tweetCount;
    const trendScore = Math.min(avgEngagement / 1000, 0.05); // Cap at 5%
    
    return Math.max(-0.02, trendScore);
    
  } catch (error) {
    return (Math.random() - 0.5) * 0.03;
  }
}

async function getRedditMentions(searchTerms) {
  if (!reddit) {
    return (Math.random() - 0.5) * 0.02; // Random fallback
  }
  
  try {
    const query = searchTerms[0]; // Use primary term
    const subreddits = ['dankmemes', 'memes'];
    
    let totalScore = 0;
    let postCount = 0;
    
    // Search in relevant subreddits
    for (const subreddit of subreddits.slice(0, 1)) { // Limit to avoid rate limits
      try {
        const results = await reddit.getSubreddit(subreddit).search({
          query: query,
          sort: 'new',
          time: 'week',
          limit: 10
        });
        
        for (const post of results) {
          totalScore += (post.score || 0) + (post.num_comments || 0);
          postCount++;
        }
      } catch (subError) {
        console.log(`Reddit subreddit error (${subreddit}):`, subError.message);
      }
    }
    
    if (postCount === 0) {
      return (Math.random() - 0.5) * 0.01;
    }
    
    // Normalize post score
    const avgEngagement = totalScore / postCount;
    const trendScore = Math.min(avgEngagement / 500, 0.04); // Cap at 4%
    
    return Math.max(-0.02, trendScore);
    
  } catch (error) {
    return (Math.random() - 0.5) * 0.02;
  }
}

async function getYouTubeMentions(searchTerms) {
  if (!youtube) {
    return (Math.random() - 0.5) * 0.02; // Random fallback
  }
  
  try {
    const query = searchTerms[0];
    
    const response = await youtube.search.list({
      part: 'snippet',
      q: query,
      type: 'video',
      publishedAfter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: 25
    });
    
    const videos = response.data.items || [];
    const videoCount = videos.length;
    
    // Simple scoring based on video count
    const trendScore = Math.min(videoCount / 100, 0.02); // Cap at 2%
    
    return Math.max(-0.01, trendScore);
    
  } catch (error) {
    console.log('YouTube API error:', error.message);
    return (Math.random() - 0.5) * 0.02;
  }
}
