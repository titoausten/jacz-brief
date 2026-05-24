# The Brief

Your personal daily intelligence briefing app — top 5 AI Safety stories every morning, top 5 Music Business stories every evening. Runs as a PWA (installable on iPhone and Android) hosted on Vercel.

---

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Vercel KV** (Redis) — stores daily summaries
- **Vercel Cron** — triggers at 6am daily
- **Claude API** — summarises and curates the top 5
- **RSS Parser** — pulls from credible sources

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd the-brief
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in:
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `CRON_SECRET` — any random string (e.g. `openssl rand -hex 32`)
- Vercel KV vars — added automatically when you connect KV in Vercel dashboard

### 3. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### 4. Add Vercel KV Storage

In your Vercel dashboard:
1. Go to **Storage** → **Create Database** → **KV**
2. Connect it to your project
3. Vercel auto-populates the `KV_*` env vars

### 5. Confirm cron is active

The `vercel.json` configures a daily cron at **6:00 AM UTC**. Check it's enabled in:
**Vercel Dashboard → Project → Settings → Cron Jobs**

Adjust the timezone offset if needed (e.g. `0 6 * * *` = 6am UTC = 7am BST in summer).

---

## Install on your phone

### iPhone (Safari)
1. Open the app URL in Safari
2. Tap the **Share** button → **Add to Home Screen**
3. Done — it opens like a native app

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the **three-dot menu** → **Add to Home Screen**
3. Done

---

## Manual refresh

Tap the **↻ REFRESH** button in the app to regenerate the current tab's brief on demand. This calls Claude fresh, so it takes ~20–30 seconds.

---

## Customising sources

Edit `lib/feeds.js` to add, remove or swap RSS feeds. All major credible sources have RSS feeds. Good additions:

**AI Safety:**
- GovAI blog: `https://www.governance.ai/feed`
- DeepMind: `https://deepmind.google/blog/rss.xml`
- AI Now Institute: their blog RSS

**Music Business:**
- Music Alliance: various
- Synchtank blog
- Gospel Music Association news

---

## Architecture

```
Vercel Cron (6am)
    ↓
/api/cron
    ├── fetchFeedItems(AI_SAFETY_FEEDS) → 25 recent items
    ├── generateBrief('ai-safety') → Claude picks top 5
    ├── fetchFeedItems(MUSIC_FEEDS) → 25 recent items
    ├── generateBrief('music') → Claude picks top 5
    └── kv.set('brief:ai-safety'), kv.set('brief:music')

App load
    ├── GET /api/briefs?category=ai-safety → reads KV
    └── GET /api/briefs?category=music → reads KV

Refresh button
    └── POST /api/refresh → re-runs fetch + Claude for active tab
```

---

## Costs (approximate)

- **Vercel**: Free tier covers this entirely (hobby plan)
- **Vercel KV**: Free tier (256MB) — more than enough
- **Claude API**: ~2 summarisation calls/day × 2 categories = 4 calls. At Sonnet pricing, roughly **$0.01–0.03/day**
- **Total**: Essentially free
