const { Redis } = require('@upstash/redis');
const { fetchFeedItems, AI_SAFETY_FEEDS, AI_NEWS_FEEDS, MUSIC_FEEDS } = require('../lib/feeds');
const { generateBrief } = require('../lib/summarize');

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const category = req.body?.category;
    const timestamp = new Date().toISOString();

    if (!category || category === 'ai-safety') {
      const items = await fetchFeedItems(AI_SAFETY_FEEDS);
      const brief = await generateBrief(items, 'ai-safety');
      await kv.set('brief:ai-safety', JSON.stringify({ items: brief, updatedAt: timestamp }));
    }
    if (!category || category === 'ai-news') {
      const items = await fetchFeedItems(AI_NEWS_FEEDS);
      const brief = await generateBrief(items, 'ai-news');
      await kv.set('brief:ai-news', JSON.stringify({ items: brief, updatedAt: timestamp }));
    }
    if (!category || category === 'music') {
      const items = await fetchFeedItems(MUSIC_FEEDS);
      const brief = await generateBrief(items, 'music');
      await kv.set('brief:music', JSON.stringify({ items: brief, updatedAt: timestamp }));
    }

    return res.json({ success: true, timestamp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
