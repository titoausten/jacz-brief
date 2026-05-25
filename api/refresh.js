import { Redis } from '@upstash/redis';
import { fetchFeedItems, AI_SAFETY_FEEDS, MUSIC_FEEDS } from '../lib/feeds.js';
import { generateBrief } from '../lib/summarize.js';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = req.body || {};
    const category = body.category;
    const timestamp = new Date().toISOString();

    if (!category || category === 'ai-safety') {
      const items = await fetchFeedItems(AI_SAFETY_FEEDS);
      const brief = await generateBrief(items, 'ai-safety');
      await kv.set('brief:ai-safety', JSON.stringify({ items: brief, updatedAt: timestamp }));
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
}
