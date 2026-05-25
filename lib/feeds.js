import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 12000,
  headers: { 'User-Agent': 'TheBrief/1.0' },
});

export const AI_SAFETY_FEEDS = [
  { name: 'Alignment Forum', url: 'https://www.alignmentforum.org/feed.xml' },
  { name: 'LessWrong', url: 'https://www.lesswrong.com/feed.xml' },
  { name: 'Anthropic', url: 'https://www.anthropic.com/rss.xml' },
  { name: '80,000 Hours', url: 'https://80000hours.org/feed/' },
  { name: 'Future of Life Institute', url: 'https://futureoflife.org/feed/' },
];

export const MUSIC_FEEDS = [
  { name: 'Music Business Worldwide', url: 'https://www.musicbusinessworldwide.com/feed/' },
  { name: 'Billboard', url: 'https://www.billboard.com/feed/' },
  { name: 'Hypebot', url: 'https://www.hypebot.com/feed' },
  { name: 'Digital Music News', url: 'https://www.digitalmusicnews.com/feed/' },
  { name: 'Variety Music', url: 'https://variety.com/v/music/feed/' },
];

export async function fetchFeedItems(feeds) {
  const allItems = [];
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
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
    if (r.status === 'fulfilled') allItems.push(...r.value);
  }
  return allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 25);
}
