import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
import { fetchFeedItems, AI_SAFETY_FEEDS, MUSIC_FEEDS } from '@/lib/feeds';
import { generateBrief } from '@/lib/summarize';

export const maxDuration = 60; // Allow up to 60s for feed fetching + Claude

export async function GET(request) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const timestamp = new Date().toISOString();

    // Run both fetches in parallel
    const [aiItems, musicItems] = await Promise.all([
      fetchFeedItems(AI_SAFETY_FEEDS, 25),
      fetchFeedItems(MUSIC_FEEDS, 25),
    ]);

    // Summarise with Claude (sequential to avoid rate limits)
    const aiBrief = await generateBrief(aiItems, 'ai-safety');
    const musicBrief = await generateBrief(musicItems, 'music');

    // Store in Vercel KV
    await Promise.all([
      kv.set('brief:ai-safety', JSON.stringify({ items: aiBrief, updatedAt: timestamp })),
      kv.set('brief:music', JSON.stringify({ items: musicBrief, updatedAt: timestamp })),
    ]);

    return NextResponse.json({ success: true, timestamp, aiCount: aiBrief.length, musicCount: musicBrief.length });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
