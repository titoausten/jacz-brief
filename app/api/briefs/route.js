import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'ai-safety';

  const validCategories = ['ai-safety', 'music'];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  try {
    const data = await kv.get(`brief:${category}`);

    if (!data) {
      return NextResponse.json({ items: [], updatedAt: null, empty: true });
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Briefs fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
