import googleTrends from 'google-trends-api';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

// Stock name mappings for better search results
const stockNameMappings = {
  'SKIBI': ['skibidi toilet', 'skibidi', 'toilet meme'],
  'SUS': ['among us', 'sus', 'imposter', 'crewmate'],
  'SAHUR': ['tun tun sahur', 'sahur', 'tamburello'],
  'LABUB': ['labubu', 'pop mart', 'labubu doll'],
  'OHIO': ['ohio meme', 'ohio final boss', 'only in ohio'],
  'RIZZL': ['rizzler', 'rizz', 'charisma'],
  'GYATT': ['gyatt', 'gyat meme'],
  'FRIED': ['deep fryer meme', 'fried', 'cooking'],
  'SIGMA': ['sigma male', 'sigma grindset', 'alpha male'],
  'TRALA': ['tralalero tralala', 'shark nike', 'three legged shark'],
  'CROCO': ['bombardiro crocodilo', 'crocodile meme', 'croco'],
  'FANUM': ['fanum tax', 'fanum', 'kai cenat'],
  'CAPPU': ['ballerina cappuccina', 'coffee dance', 'cappuccino'],
  'BANANI': ['chimpanzini bananini', 'monkey banana', 'ape meme'],
  'LARILA': ['lirili larila', 'cactus elephant', 'time control']
};

export async function getTrendScore(stockSymbol) {
  let score = 0;
  const searchTerms = stockNameMappings[stockSymbol] || [stockSymbol.toLowerCase()];
  const primaryTerm = searchTerms[0];
  
  try {
    // Google Trends (weight: 30%)
    const googleScore = await getGoogleTrend(primaryTerm);
    score += googleScore * 0.3;
  } catch (error) {
    console.log('Google Trends API error for', stockSymbol, ':', error.message);
  }
  
  try {
    // Twitter/X mentions (weight: 25%)
    const twitterScore = await getTwitterMentions(searchTerms);
    score += twitterScore * 0.25;
  } catch (error) {
    console.log('Twitter API error for', stockSymbol, ':', error.message);
  }
  
  try {
    // Reddit mentions (weight: 20%)
    const redditScore = await getRedditMentions(searchTerms);
    score += redditScore * 0.2;
  } catch (error) {
    console.log('Reddit API error for', stockSymbol, ':', error.message);
  }
  
  try {
    // YouTube videos (weight: 15%)
    const youtubeScore = await getYouTubeMentions(searchTerms);
    score += youtubeScore * 0.15;
  } catch (error) {
    console.log('YouTube API error for', stockSymbol, ':', error.message);
  }
  
  try {
    // TikTok scraping (weight: 10%)
    const tiktokScore = await getTikTokMentions(searchTerms);
    score += tiktokScore * 0.1;
  } catch (error) {
    console.log('TikTok scraping error for', stockSymbol, ':', error.message);
  }
  
  // Return score between -0.08 and +0.08 (8% max change)
  return Math.max(-0.08, Math.min(0.08, score));
}

async function getGoogleTrend(keyword) {
  try {
    const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const res = await googleTrends.interestOverTime({ 
      keyword, 
      startTime,
      granularTimeResolution: true,
      geo: 'US' // Focus on US trends
    });
    
    const data = JSON.parse(res);
    if (!data.default?.timelineData?.length) return 0;
    
    const values = data.default.timelineData.map(d => d.value[0]);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3; // Last 3 data points
    
    // Compare recent vs average for trend direction
    const trendMultiplier = recent > average ? 1.2 : 0.8;
    
    // Normalize to -0.03 to +0.03 range
    return ((average - 50) / 1500) * trendMultiplier;
  } catch (error) {
    console.log('Google Trends error for', keyword, ':', error.message);
    return Math.random() * 0.02 - 0.01; // Fallback random
  }
}

async function getTwitterMentions(searchTerms) {
  const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
  
  if (!TWITTER_BEARER_TOKEN) {
    return Math.random() * 0.02 - 0.01; // Fallback random
  }
  
  try {
    let totalMentions = 0;
    let totalEngagement = 0;
    
    for (const term of searchTerms.slice(0, 2)) { // Limit to 2 terms to avoid rate limiting
      const query = encodeURIComponent(`${term} lang:en -is:retweet`);
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=100&tweet.fields=public_metrics`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }
      
      const data = await response.json();
      const tweets = data.data || [];
      
      totalMentions += tweets.length;
      totalEngagement += tweets.reduce((sum, tweet) => {
        const metrics = tweet.public_metrics || {};
        return sum + (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0);
      }, 0);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Normalize based on mentions and engagement
    const mentionScore = Math.min(0.015, totalMentions / 5000);
    const engagementScore = Math.min(0.015, totalEngagement / 50000);
    
    return mentionScore + engagementScore;
  } catch (error) {
    console.log('Twitter API error:', error.message);
    return Math.random() * 0.02 - 0.01; // Fallback random
  }
}

async function getRedditMentions(searchTerms) {
  try {
    let totalScore = 0;
    
    for (const term of searchTerms.slice(0, 2)) {
      const query = encodeURIComponent(term);
      const url = `https://www.reddit.com/search.json?q=${query}&limit=50&sort=new&t=week`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StockBot/1.0 (by /u/StockBot)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }
      
      const data = await response.json();
      const posts = data.data?.children || [];
      
      let postScore = 0;
      posts.forEach(post => {
        const postData = post.data;
        const score = postData.score || 0;
        const comments = postData.num_comments || 0;
        postScore += score + (comments * 2); // Weight comments higher
      });
      
      totalScore += postScore;
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Normalize post score
    return Math.min(0.02, totalScore / 100000);
  } catch (error) {
    console.log('Reddit API error:', error.message);
    return Math.random() * 0.01 - 0.005; // Fallback random
  }
}

async function getYouTubeMentions(searchTerms) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    return Math.random() * 0.01 - 0.005; // Fallback random
  }
  
  try {
    let totalViews = 0;
    let totalVideos = 0;
    
    for (const term of searchTerms.slice(0, 2)) {
      const query = encodeURIComponent(term);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&publishedAfter=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&maxResults=25&key=${YOUTUBE_API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      const videos = data.items || [];
      
      totalVideos += videos.length;
      
      // Get video statistics for view counts
      const videoIds = videos.map(v => v.id.videoId).filter(Boolean).slice(0, 10); // Limit to 10 to avoid quota issues
      
      if (videoIds.length > 0) {
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        const statsResponse = await fetch(statsUrl);
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const stats = statsData.items || [];
          
          stats.forEach(video => {
            const viewCount = parseInt(video.statistics?.viewCount || 0);
            totalViews += viewCount;
          });
        }
      }
      
      // Small delay to avoid quota issues
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Normalize based on video count and views
    const videoScore = Math.min(0.01, totalVideos / 1000);
    const viewScore = Math.min(0.015, totalViews / 10000000);
    
    return videoScore + viewScore;
  } catch (error) {
    console.log('YouTube API error:', error.message);
    return Math.random() * 0.01 - 0.005; // Fallback random
  }
}

async function getTikTokMentions(searchTerms) {
  try {
    let browser;
    let totalViews = 0;
    
    // Launch headless browser
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    for (const term of searchTerms.slice(0, 1)) { // Only check primary term to avoid being blocked
      try {
        const searchTerm = term.replace(/\s+/g, '');
        const url = `https://www.tiktok.com/tag/${searchTerm}`;
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
        
        // Try to extract view count from tag page
        const viewElements = await page.$$('[data-e2e="video-views"]');
        
        for (const element of viewElements.slice(0, 5)) { // Check first 5 videos
          try {
            const viewText = await page.evaluate(el => el.textContent, element);
            const views = parseViewCount(viewText);
            totalViews += views;
          } catch (e) {
            // Skip this element
          }
        }
        
        // Small delay between searches
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.log('TikTok scraping error for term:', term, e.message);
      }
    }
    
    await browser.close();
    
    // Normalize view count
    return Math.min(0.015, totalViews / 50000000);
  } catch (error) {
    console.log('TikTok scraping error:', error.message);
    return Math.random() * 0.01 - 0.005; // Fallback random
  }
}

function parseViewCount(viewText) {
  if (!viewText) return 0;
  
  const text = viewText.toLowerCase().replace(/,/g, '');
  let multiplier = 1;
  
  if (text.includes('k')) {
    multiplier = 1000;
  } else if (text.includes('m')) {
    multiplier = 1000000;
  } else if (text.includes('b')) {
    multiplier = 1000000000;
  }
  
  const number = parseFloat(text.replace(/[^\d.]/g, ''));
  return (number || 0) * multiplier;
}
