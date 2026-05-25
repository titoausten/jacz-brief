const { Redis } = require('@upstash/redis');

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const { subscription } = req.body;
      if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
      const key = 'sub:' + Buffer.from(subscription.endpoint).toString('base64').slice(0, 32);
      await kv.set(key, JSON.stringify(subscription));
      const indexRaw = await kv.get('sub:index');
      const index = indexRaw ? (typeof indexRaw === 'string' ? JSON.parse(indexRaw) : indexRaw) : [];
      if (!index.includes(key)) { index.push(key); await kv.set('sub:index', JSON.stringify(index)); }
      return res.json({ success: true });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
