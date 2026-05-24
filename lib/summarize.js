import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPTS = {
  'ai-safety': `You are a senior intelligence analyst curating a daily brief for an AI Safety researcher and practitioner with deep interests in technical alignment, governance, and Global South representation in AI.

Select the TOP 5 most substantive items from the list below. Prioritise: new research findings, policy developments, significant org announcements, governance news, and anything relevant to technical alignment or the Global South in AI. Skip fluff, hype, and repetitive news.`,

  music: `You are a senior intelligence analyst curating a daily brief for a music entrepreneur building a gospel entertainment company (think: Roc Nation for gospel). They care about the music business at an executive level — deals, publishing, streaming economics, artist management trends, industry structure shifts, and gospel/Christian music developments.

Select the TOP 5 most substantive items from the list below. Prioritise: deal news, revenue/streaming data, publishing and rights developments, industry structure changes, and anything relevant to independent artists or faith-based music. Skip celebrity gossip and fluff.`,
};

export async function generateBrief(items, category) {
  const systemPrompt = PROMPTS[category] || PROMPTS['ai-safety'];

  const itemsText = items
    .map(
      (item, i) =>
        `[${i + 1}] SOURCE: ${item.source}\nTITLE: ${item.title}\nURL: ${item.link}\nSNIPPET: ${item.snippet || '(no snippet)'}\nDATE: ${item.pubDate}`
    )
    .join('\n\n');

  const userPrompt = `${systemPrompt}

From these ${items.length} recent articles, produce your TOP 5 selection.

Respond ONLY with a valid JSON array — no markdown, no preamble, no backticks:
[
  {
    "title": "Rewritten clean headline if needed, otherwise original",
    "summary": "2–3 sentence summary capturing the key development. Be precise and direct.",
    "why": "One crisp sentence on why this matters.",
    "source": "Source name",
    "url": "Original URL",
    "pubDate": "Original pubDate string"
  }
]

ARTICLES:
${itemsText}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = response.content[0].text.trim();

  // Strip any accidental markdown code fences
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  return JSON.parse(cleaned);
}
