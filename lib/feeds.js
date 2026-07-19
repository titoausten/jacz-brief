const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'TheBrief/1.0' },
});

const AI_SAFETY_FEEDS = [
  { name: 'Alignment Forum', url: 'https://www.alignmentforum.org/feed.xml' },
  { name: 'LessWrong', url: 'https://www.lesswrong.com/feed.xml' },
  { name: 'Anthropic', url: 'https://www.anthropic.com/rss.xml' },
  { name: '80,000 Hours', url: 'https://80000hours.org/feed/' },
  { name: 'Future of Life Institute', url: 'https://futureoflife.org/feed/' },
];

const AI_NEWS_FEEDS = [
  { name: 'MarkTechPost', url: 'https://www.marktechpost.com/feed/' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'The Batch', url: 'https://www.deeplearning.ai/the-batch/feed/' },
];

const MUSIC_FEEDS = [
  { name: 'Music Business Worldwide', url: 'https://www.musicbusinessworldwide.com/feed/' },
  { name: 'Billboard', url: 'https://www.billboard.com/feed/' },
  { name: 'Hypebot', url: 'https://www.hypebot.com/feed' },
  { name: 'Digital Music News', url: 'https://www.digitalmusicnews.com/feed/' },
  { name: 'Variety Music', url: 'https://variety.com/v/music/feed/' },
];

async function fetchFeedItems(feeds) {
  const allItems = [];
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      if (!parsed || !Array.isArray(parsed.items)) return [];
      return parsed.items.slice(0, 6).map((item) => ({
        title: item.title?.trim() || 'Untitled',
        link: item.link || '',
        snippet: (item.contentSnippet || item.content || '').replace(/<[^>]+>/g, '').slice(0, 400),
        pubDate: item.pubDate || new Date().toISOString(),
        source: feed.name,
      }));
    })
  );
  for (const r of results) {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) allItems.push(...r.value);
  }
  return allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 25);
}

module.exports = { AI_SAFETY_FEEDS, MUSIC_FEEDS, fetchFeedItems };
