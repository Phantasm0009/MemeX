// Simple in-memory cache for trend data to speed up commands
const trendCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedTrendScore(stockSymbol) {
  const cached = trendCache.get(stockSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.score;
  }
  return null;
}

export function setCachedTrendScore(stockSymbol, score) {
  trendCache.set(stockSymbol, {
    score,
    timestamp: Date.now()
  });
}

export function clearCache() {
  trendCache.clear();
}

export function getCacheStats() {
  return {
    size: trendCache.size,
    entries: Array.from(trendCache.entries()).map(([symbol, data]) => ({
      symbol,
      score: data.score,
      age: Math.round((Date.now() - data.timestamp) / 1000) + 's'
    }))
  };
}
