import { Redis } from '@upstash/redis';
import { fetchFeedItems, AI_SAFETY_FEEDS, MUSIC_FEEDS } from '../lib/feeds.js';
import { generateBrief } from '../lib/summarize.js';
import webpush from 'web-push';

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const maxDuration = 60;

async function sendNotifications(title, body) {
  try {
    webpush.setVapidDetails(
      'mailto:your@email.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const indexRaw = await kv.get('sub:index');
    const index = indexRaw ? (typeof indexRaw === 'string' ? JSON.parse(indexRaw) : indexRaw) : [];

    const payload = JSON.stringify({ title, body });

    await Promise.allSettled(
      index.map(async (key) => {
        const subRaw = await kv.get(key);
        if (!subRaw) return;
        const sub = typeof subRaw === 'string' ? JSON.parse(subRaw) : subRaw;
        await webpush.sendNotification(sub, payload);
      })
    );
  } catch (err) {
    console.error('Notification error:', err);
  }
}

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

    await sendNotifications(
      '☀️ Your Morning Brief is Ready',
      'Top 5 AI Safety + Music Business stories — tap to read'
    );

    return res.json({ success: true, timestamp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
