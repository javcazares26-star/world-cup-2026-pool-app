# World Cup 2026 Score Pool

Hosted, multi-user score-prediction app for the 2026 FIFA World Cup. Friends sign in with Google, join your pool with a 6-char code, predict every match, and a live leaderboard updates in real time as scores come in from the official feed.

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Postgres + Auth + Realtime) · API-Football · Vercel hosting + cron.

---

## What you get

- **Google sign-in** (one tap) via Supabase Auth.
- **Private pools** with shareable 6-char invite codes (`MEXFAM`, `CAZARES`, etc.).
- **All 104 World Cup matches** auto-synced from API-Football, including live in-play scores.
- **Picks lock at kickoff** — no peeking-then-editing.
- **Real-time leaderboard** — points update the second a goal is scored (Supabase realtime channels).
- **Open Graph share cards** — every share link generates a 1200×630 branded preview image.
- **Social share buttons** — Twitter/X, Facebook, WhatsApp, native share sheet, copy link.
- **Scoring:** 3 points exact, 1 point correct outcome, 0 miss (configurable per pool via the `scoring` JSON column).

---

## Setup — deploy in ~30 minutes

### 1. Create the Supabase project (5 min)

1. Sign up at <https://supabase.com> → New project. Free tier is fine.
2. Once provisioned, go to **SQL Editor → New query**.
3. Paste the entire contents of `supabase/schema.sql` and run it. You should see tables `profiles`, `pools`, `pool_members`, `fixtures`, `picks` in the **Table Editor**.
4. Go to **Authentication → Providers → Google**:
   - Toggle Google ON.
   - You'll need a Google OAuth client — see Step 2.
5. Go to **Settings → API**. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (keep secret!) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Create Google OAuth credentials (5 min)

1. Go to <https://console.cloud.google.com>. Create or pick a project.
2. **APIs & Services → OAuth consent screen** → External → fill app name (e.g. "World Cup Pool"). Add your email as a test user (or publish the app if you want anyone to sign up).
3. **APIs & Services → Credentials → Create Credentials → OAuth Client ID** → Web application.
   - Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback` (use the URL from Supabase Auth → Providers → Google — Supabase shows you this exact value).
4. Copy Client ID + Client Secret into Supabase Authentication → Google. Save.

### 3. Get an API-Football key (3 min)

1. Sign up at <https://www.api-football.com> (or RapidAPI — both work, same key).
2. Confirm the FIFA World Cup league ID. As of the 2025–26 cycle it's `league=1, season=2026`. Verify with: `curl -H "x-apisports-key: YOUR_KEY" "https://v3.football.api-sports.io/leagues?search=world%20cup"`.
3. Copy the key.

### 4. Deploy to Vercel (10 min)

```bash
# from this folder
npm install
git init && git add . && git commit -m "init"
gh repo create world-cup-2026-pool --public --source=. --push   # or push to GitHub UI
```

1. <https://vercel.com> → Add New Project → Import your repo.
2. Framework preset: Next.js (auto-detected).
3. **Environment Variables** — paste all from `.env.example`, filled in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `API_FOOTBALL_KEY`
   - `API_FOOTBALL_LEAGUE_ID=1`
   - `API_FOOTBALL_SEASON=2026`
   - `CRON_SECRET` — run `openssl rand -hex 32` and paste the output.
   - `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app` (set after first deploy)
4. Deploy.
5. In Supabase → **Authentication → URL Configuration**, set:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`
6. Vercel cron from `vercel.json` will auto-hit `/api/cron/sync-fixtures` every 5 min. On first run it does a full pull; afterwards just the live endpoint.

### 5. Smoke test

1. Visit your Vercel URL → click "Get started" → sign in with Google.
2. Click "Create a pool" → name it ("Cazares Family Cup") → optional custom code ("CAZARES").
3. Visit `https://your-app.vercel.app/api/cron/sync-fixtures?secret=YOUR_CRON_SECRET&mode=full` to force a fixture pull. You should see `{"ok":true,"count":104}`.
4. Refresh the pool page → group cards populate with all 104 matches.
5. Open a different browser / incognito → go to `https://your-app.vercel.app/pools/CAZARES` → sign in as a different Google account → you're auto-joined.
6. Both windows make picks → leaderboard updates live in both via realtime channel.

---

## Project layout

```
.
├── README.md                          ← this file
├── package.json
├── next.config.js                     ← Next.js config
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── vercel.json                        ← cron schedule
├── .env.example
├── supabase/
│   └── schema.sql                     ← paste into Supabase SQL editor
└── src/
    ├── middleware.ts                  ← route protection
    ├── lib/
    │   ├── types.ts                   ← shared TS types
    │   ├── api-football.ts            ← provider adapter (swappable)
    │   └── supabase/
    │       ├── client.ts              ← browser client
    │       ├── server.ts              ← SSR + admin clients
    │       └── middleware.ts          ← session refresh
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                   ← marketing landing
    │   ├── login/page.tsx             ← Google sign-in
    │   ├── auth/
    │   │   ├── callback/route.ts      ← OAuth code exchange
    │   │   └── signout/route.ts
    │   ├── pools/
    │   │   ├── page.tsx               ← your pools list
    │   │   ├── _components.tsx        ← join-by-code form
    │   │   ├── new/page.tsx           ← create pool
    │   │   └── [code]/
    │   │       ├── page.tsx           ← pool home (server)
    │   │       ├── _PoolTabs.tsx      ← tabs + realtime (client)
    │   │       ├── _MatchRow.tsx      ← score input
    │   │       ├── _Leaderboard.tsx
    │   │       ├── _Kpis.tsx
    │   │       └── _ShareBar.tsx
    │   └── api/
    │       ├── cron/sync-fixtures/route.ts   ← Vercel cron
    │       └── og/[code]/route.tsx           ← OG share image
```

---

## Day-to-day operations

**During matches.** Cron pulls live scores every 5 min. To go faster (cron tier minimum), hit the URL manually or bump the cadence in `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/sync-fixtures", "schedule": "*/2 * * * *" }] }
```

Note Vercel Hobby plan limits cron to once daily on free; Pro is needed for `*/5` etc. If you stay on Hobby, swap to a free polling service (cron-job.org → POST to your URL with the `x-cron-secret` header).

**Picks lock automatically** when `kickoff_utc <= now()` via the cron route. The UI also greys out the input.

**Changing scoring rules** for a specific pool — update the `scoring` JSON column on `pools`. (The leaderboard view currently uses fixed 3/1/0; if you go custom, swap the view's `case` for a join to `pools.scoring`.)

**Adding more languages.** The static UI strings are inline for v1; lift them into `src/i18n/{en,es}.ts` when you want EN/ES toggle parity with the local demo. Supabase profile already has a `locale` column for per-user preference.

---

## Costs

| Service | Free tier | Likely paid? |
|---|---|---|
| Supabase | 500MB DB, 50k MAU, unlimited realtime | No |
| Vercel | 100GB bandwidth, 100k function invocations / mo | No, unless cron must run < daily |
| API-Football | 100 req/day free | **Likely yes** during tournament — $19/mo for 7.5k/day handles the 5-min cron with 90% headroom. |
| Google OAuth | Free | No |

Total: **~$19 for the month of the tournament.**

---

## What's intentionally NOT included (yet)

- Knockout-round bracket picks. Group stage works end-to-end; the knockout fixtures will sync automatically but bracket-style "pick who advances" UI is a v2.
- Email/push notifications ("Argentina scored! Your pick was 2–1.").
- Admin UI for pool owners (kick members, edit scoring). Use Supabase Studio for now.
- Custom scoring rule application in the SQL view (the column exists; the view is hardcoded for v1).

All of these are clean follow-ons — say the word.

---

## Troubleshooting

**"Fixtures haven't synced yet" on the pool page.** Hit `/api/cron/sync-fixtures?secret=...&mode=full` to force-pull.

**Google sign-in redirects to a Supabase URL and 404s.** Set the Site URL + Redirect URLs in Supabase → Auth → URL Configuration to your Vercel domain.

**Realtime not updating.** Confirm `alter publication supabase_realtime add table public.fixtures;` ran (it's in `schema.sql`). Check Supabase → Database → Replication.

**OG images 500.** Vercel needs `@vercel/og` on Node runtime, not Edge. The route already sets `runtime = "nodejs"`.
