import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const category = req.query.category || 'ai-safety';

  try {
    const data = await kv.get(`brief:${category}`);
    if (!data) return res.json({ items: [], updatedAt: null, empty: true });
    return res.json(typeof data === 'string' ? JSON.parse(data) : data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
