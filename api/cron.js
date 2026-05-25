import { Redis } from '@upstash/redis';
import { fetchFeedItems, AI_SAFETY_FEEDS, MUSIC_FEEDS } from '../lib/feeds.js';
import { generateBrief } from '../lib/summarize.js';

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const maxDuration = 60;

export default async function handler(req, res) {
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const timestamp = new Date().toISOString();
    const [aiItems, musicItems] = await Promise.all([
      fetchFeedItems(AI_SAFETY_FEEDS),
      fetchFeedItems(MUSIC_FEEDS),
    ]);
    const aiBrief = await generateBrief(aiItems, 'ai-safety');
    const musicBrief = await generateBrief(musicItems, 'music');
    await Promise.all([
      kv.set('brief:ai-safety', JSON.stringify({ items: aiBrief, updatedAt: timestamp })),
      kv.set('brief:music', JSON.stringify({ items: musicBrief, updatedAt: timestamp })),
    ]);
    return res.json({ success: true, timestamp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
