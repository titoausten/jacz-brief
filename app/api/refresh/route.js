import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { fetchFeedItems, AI_SAFETY_FEEDS, MUSIC_FEEDS } from '@/lib/feeds';
import { generateBrief } from '@/lib/summarize';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { category } = await request.json().catch(() => ({}));

    const timestamp = new Date().toISOString();

    if (!category || category === 'ai-safety') {
      const aiItems = await fetchFeedItems(AI_SAFETY_FEEDS, 25);
      const aiBrief = await generateBrief(aiItems, 'ai-safety');
      await kv.set('brief:ai-safety', JSON.stringify({ items: aiBrief, updatedAt: timestamp }));
    }

    if (!category || category === 'music') {
      const musicItems = await fetchFeedItems(MUSIC_FEEDS, 25);
      const musicBrief = await generateBrief(musicItems, 'music');
      await kv.set('brief:music', JSON.stringify({ items: musicBrief, updatedAt: timestamp }));
    }

    return NextResponse.json({ success: true, timestamp });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
