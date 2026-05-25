import { Redis } from '@upstash/redis';

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const { subscription } = req.body;
      if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' });

      // Store subscription keyed by endpoint hash
      const key = 'sub:' + Buffer.from(subscription.endpoint).toString('base64').slice(0, 32);
      await kv.set(key, JSON.stringify(subscription));

      // Add to subscription index
      const index = await kv.get('sub:index') || [];
      const parsed = typeof index === 'string' ? JSON.parse(index) : index;
      if (!parsed.includes(key)) {
        parsed.push(key);
        await kv.set('sub:index', JSON.stringify(parsed));
      }

      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { endpoint } = req.body;
      const key = 'sub:' + Buffer.from(endpoint).toString('base64').slice(0, 32);
      await kv.del(key);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
