const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPTS = {
  'ai-safety': `You are curating a daily brief for an AI Safety researcher who cares about technical alignment, governance, and Global South representation in AI. Pick the TOP 5 most substantive items. Skip fluff.`,

  'ai-news': `You are curating a daily brief for a senior AI practitioner who wants to stay on top of what's being built and shipped in the AI industry. Pick the TOP 5 most substantive items. Prioritise: new model releases, major product launches, significant funding rounds, company strategy moves, new research findings with real-world application, and open-source releases. Skip opinion pieces, listicles, and anything without a concrete development. Keep it crisp and executive-level.`,
  
  music: `You are curating a daily brief for a gospel music entrepreneur building an entertainment company. They care about music business at an executive level — deals, publishing, streaming, rights, and industry shifts. Pick the TOP 5 most substantive items. Skip celebrity gossip.`,
};

async function generateBrief(items, category) {
  const itemsText = items
    .map((item, i) => `[${i+1}] SOURCE: ${item.source}\nTITLE: ${item.title}\nURL: ${item.link}\nSNIPPET: ${item.snippet}`)
    .join('\n\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `${PROMPTS[category]}\n\nRespond ONLY with a JSON array, no markdown:\n[\n  {\n    "title": "headline",\n    "summary": "2-3 sentence summary",\n    "why": "one sentence why it matters",\n    "source": "source name",\n    "url": "url"\n  }\n]\n\nARTICLES:\n${itemsText}`,
    }],
  });

  const raw = response.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(raw);
}

module.exports = { generateBrief };
