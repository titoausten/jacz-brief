import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'TheBrief/1.0 (personal intelligence app)' },
  customFields: {
    item: [['media:content', 'media'], ['content:encoded', 'contentEncoded']],
  },
});

export const AI_SAFETY_FEEDS = [
  { name: 'Alignment Forum', url: 'https://www.alignmentforum.org/feed.xml' },
  { name: 'LessWrong', url: 'https://www.lesswrong.com/feed.xml?view=top-100' },
  { name: 'Anthropic', url: 'https://www.anthropic.com/rss.xml' },
  { name: '80,000 Hours', url: 'https://80000hours.org/feed/' },
  { name: 'Future of Life Institute', url: 'https://futureoflife.org/feed/' },
  { name: 'AI Safety Newsletter', url: 'https://newsletter.mlsafety.org/feed' },
  { name: 'Center for AI Safety', url: 'https://www.safe.ai/feed' },
];

export const MUSIC_FEEDS = [
  { name: 'Music Business Worldwide', url: 'https://www.musicbusinessworldwide.com/feed/' },
  { name: 'Billboard', url: 'https://www.billboard.com/feed/' },
  { name: 'Variety Music', url: 'https://variety.com/v/music/feed/' },
  { name: 'Music Week', url: 'https://www.musicweek.com/rss' },
  { name: 'Hypebot', url: 'https://www.hypebot.com/feed' },
  { name: 'Digital Music News', url: 'https://www.digitalmusicnews.com/feed/' },
];

export async function fetchFeedItems(feeds, limit = 25) {
  const allItems = [];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items.slice(0, 6).map((item) => ({
        title: item.title?.trim() || 'Untitled',
        link: item.link || item.guid || '',
        snippet:
          item.contentSnippet?.slice(0, 400) ||
          item.contentEncoded?.replace(/<[^>]+>/g, '').slice(0, 400) ||
          item.content?.replace(/<[^>]+>/g, '').slice(0, 400) ||
          '',
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        source: feed.name,
      }));
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  }

  // Sort by recency, deduplicate by title similarity
  return allItems
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, limit);
}
