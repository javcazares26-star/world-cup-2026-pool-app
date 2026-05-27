# World Cup 2026 Pool — Project Overview

A hosted, multi-user web app for predicting scores in the 2026 FIFA World Cup. Built by Javier Cazares for family and friends — Canada · México · USA 2026.

**Live URL:** https://mundial2026-aesthion.vercel.app
**GitHub:** https://github.com/javcazares26-star/world-cup-2026-pool-app

---

## What It Does

- Players sign in (Google OAuth or email magic-link)
- Join a private pool with a 6-character invite code
- Predict scores for every World Cup match (group stage → final)
- Picks lock 5 minutes before each kickoff
- Real-time leaderboard updates as matches finish
- Group standings simulate live based on each player's picks
- Browse all 48 teams and their squads with player photos
- Private group chat per pool
- Share via Twitter/X, WhatsApp, Facebook, or branded OG image

Scoring: **3 points** for an exact score · **1 point** for the correct outcome (win/draw/loss) · **0 points** otherwise.

---

## Stack at a Glance

| Layer | Choice | Why |
|---|---|---|
| **Frontend framework** | Next.js 14 (App Router, TypeScript) | Server-side rendering, file-based routing, free hosting fit |
| **Styling** | Tailwind CSS + custom CSS variables | Quick iteration; dark navy → champagne-gold broadcast theme |
| **Hosting** | Vercel (Hobby tier, free) | Auto-deploy from GitHub, free HTTPS, edge CDN |
| **Database** | Supabase Postgres (free tier) | 500MB DB, RLS, realtime channels, auth all in one |
| **Auth** | Supabase Auth | Google OAuth + email magic-link, no password management |
| **Realtime** | Supabase Realtime (Postgres LISTEN/NOTIFY) | Chat + leaderboard + fixtures update without polling |
| **Fixture data** | API-Football (Pro, ~$19/mo, June–July only) | 104-match schedule + live in-play scores |
| **Squad photos** | TheSportsDB (free, community-edited) | Player cutouts and rosters for all national teams |
| **OG share image** | @vercel/og (server-rendered PNG) | Branded link-preview cards on social shares |
| **Cron** | Vercel cron (Hobby tier: daily) | Pulls fixtures + locks picks; cron-job.org fallback for higher cadence |
| **CI/CD** | GitHub → Vercel webhook | `git push` triggers auto-deploy in ~60s |

---

## Architecture

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Browser    │ ◄────►  │  Vercel (Next.js)│ ◄────►  │  Supabase Postgres│
│  (React UI)  │  HTTPS  │  - App Router    │  HTTPS  │  - auth.users    │
│              │         │  - API routes    │         │  - profiles      │
│              │         │  - Cron jobs     │         │  - pools         │
└──────┬───────┘         │  - OG images     │         │  - pool_members  │
       │                 └──────────┬───────┘         │  - fixtures      │
       │                            │                 │  - picks         │
       │                            │                 │  - messages      │
       │  ┌────────────────────────▼──────┐          │  - super_admins  │
       │  │  External APIs:                │          └──────────────────┘
       │  │  - API-Football (fixtures)     │                  ▲
       │  │  - TheSportsDB (player photos) │                  │
       │  │  - Google OAuth (sign-in)      │                  │
       │  └────────────────────────────────┘            Realtime channel
       │                                                (WebSocket)
       └──────────────────────────────────────────────────────┘
```

**Request flow examples:**

- *User opens `/pools/CAZARES2026`*: Vercel runs server component → Supabase reads pool/fixtures/picks/messages/members (filtered by RLS) → sends HTML to browser.
- *User edits a pick*: client calls `supabase.from('picks').upsert(...)` → RLS checks `auth.uid()` and lock time → Postgres NOTIFY → realtime channel pushes update to all other browsers viewing the same pool.
- *Live score sync*: Vercel cron hits `/api/cron/sync-fixtures` → server fetches API-Football → upserts into `fixtures` table → realtime broadcasts the update.
- *Friend opens share link*: lands on `/pools/CAZARES2026` → no session yet → middleware redirects to `/login` → sign in → `auth/callback` → server `join_pool_by_code` RPC auto-adds them → pool page loads.

---

## Database Schema (Supabase Postgres)

| Table | Purpose | Key Columns |
|---|---|---|
| `auth.users` | (built-in) account identities | `id`, `email`, `raw_user_meta_data` |
| `profiles` | display name, avatar, location | `id` (FK auth.users), `display_name`, `avatar_url`, `location` |
| `pools` | one row per family pool | `id`, `code` (unique invite), `name`, `owner_id`, `scoring` (JSONB) |
| `pool_members` | who's in which pool | `(pool_id, user_id)` PK, `role`, `joined_at` |
| `fixtures` | the 104 World Cup matches | `id`, `round`, `group_label`, `kickoff_utc`, `status`, `home/away_team`, `home/away_score` |
| `picks` | each player's predictions | `id`, `user_id`, `pool_id`, `fixture_id`, `home_pick`, `away_pick`, `locked` |
| `messages` | per-pool chat | `id`, `pool_id`, `user_id`, `content`, `created_at` |
| `super_admins` | platform-level admin list | `user_id`, `added_at` |

**Views:**

- `v_pick_scores` — joins picks ↔ fixtures, computes points per pick
- `v_leaderboard` — sums points + exact_count per (pool_id, user_id)

**Key RPCs (Postgres functions):**

- `create_pool(name, code)` — requires super-admin; auto-generates code if blank
- `delete_pool(pool_id)` — owner or super-admin only
- `join_pool_by_code(code)` — adds caller to pool_members; bypasses RLS
- `remove_pool_member(pool_id, user_id)` — owner only
- `add_pool_member_by_email(pool_id, email)` — owner only; invite known users
- `is_super_admin()` — boolean helper used by RLS policies
- `is_pool_member(pool_id, user_id)` — bypasses RLS to break recursion
- `fixture_open_for_picks(fixture_id)` — true if kickoff > now() + 5 min

**RLS (Row Level Security) in plain English:**

- Everyone can read fixtures (no PII).
- Only pool members see their pool's data (picks, messages, members).
- Each user only edits their own picks, and only until 5 min before kickoff.
- Only the pool owner sees the Admin tab; only super-admins can create pools.
- Service role (cron) bypasses RLS for fixture sync.

---

## Features in the UI

| Tab | Visible to | What it shows |
|---|---|---|
| 📝 Picks | All pool members | All matches grouped A–L. Score inputs with +/− and live countdown to lock. |
| 📺 Live | All pool members | In-progress + finished matches with real scores and points earned. |
| 📊 Groups Live | All pool members | Group standings — uses real scores when matches finish, projects from each player's picks otherwise. Shows 🔮 Simulation / 📡 Live badge. |
| 🧑‍🤝‍🧑 Teams | All pool members | 48 team grid; click any team → fetches squad with player photos from TheSportsDB. |
| 👥 Members | All pool members | Each member's avatar + name + location. "Edit my profile" lets you change your own. |
| 🥇 Leaderboard | All pool members | Ranked table with gold/silver/bronze medals. Updates live. |
| 💬 Chat | All pool members | WhatsApp-style real-time chat scoped to this pool. |
| ⚙️ Admin | Pool owner only | Invite by email, kick members, delete any pool you own (with type-to-confirm). |

---

## Operational Setup (How to Rebuild from Scratch)

If you wanted to clone this for a different tournament or family group:

### 1. Provision Supabase
- Sign up at https://supabase.com → New project (free tier).
- SQL Editor → paste `supabase/schema.sql` → Run.
- Then paste these migrations in order: `chat-schema.sql`, `admin-functions.sql`, `super-admin.sql`, `members-profile.sql`, `time-lock.sql`.
- Authentication → Providers → enable **Google** (paste OAuth client ID/secret from Google Cloud Console) and **Email**.
- Authentication → URL Configuration → set Site URL + add `/auth/callback` to Redirect URLs.

### 2. Provision Vercel
- Sign up at https://vercel.com → import repo from GitHub.
- Set Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `API_FOOTBALL_KEY` (sign up at api-football.com)
  - `API_FOOTBALL_LEAGUE_ID=1` (FIFA World Cup)
  - `API_FOOTBALL_SEASON=2026`
  - `CRON_SECRET` (any 64-char random string)
- Deploy.

### 3. Seed fixtures
- Run `supabase/real-fixtures-2026-v2.sql` in Supabase SQL Editor → all 104 matches load.
- Or visit `/api/cron/sync-fixtures?secret=YOUR_CRON_SECRET&mode=full` for live API-Football data.

### 4. Make yourself the admin
- Sign in to the app once with your Google account (creates an `auth.users` row).
- In Supabase SQL Editor: `INSERT INTO super_admins (user_id) SELECT id FROM auth.users WHERE email='YOUR_EMAIL';`
- Now you can create pools.

---

## Costs

| Service | Free tier covers | Paid trigger | Cost |
|---|---|---|---|
| Vercel Hobby | 100 GB bandwidth, daily cron | Bigger projects, faster cron | $20/mo (only if needed) |
| Supabase Free | 500 MB DB, 50k MAU, unlimited realtime | Higher scale | $25/mo (not needed for family pool) |
| API-Football Free | 100 req/day, 2022–2024 seasons | World Cup data + 7,500 req/day | $19/mo (June–July only) |
| Google OAuth | Free | — | $0 |
| TheSportsDB | Free, no key required | — | $0 |
| GitHub | Free private repos | — | $0 |
| **Total during tournament** | | | **~$19 × 2 months = $38** |
| **Total outside tournament** | | | **$0** |

---

## Repository Structure

```
world-cup-2026-pool-app/
├── README.md                          ← original deploy guide
├── OVERVIEW.md                        ← this file
├── package.json
├── next.config.js
├── tailwind.config.ts
├── vercel.json                        ← cron config
├── .env.example                       ← env var template
├── supabase/
│   ├── schema.sql                     ← initial DB schema
│   ├── chat-schema.sql                ← messages table
│   ├── admin-functions.sql            ← owner RPCs
│   ├── super-admin.sql                ← platform admin lockdown
│   ├── members-profile.sql            ← location column
│   ├── time-lock.sql                  ← pick-lock RLS
│   ├── real-fixtures-2026-v2.sql      ← all 104 matches
│   └── test-fixtures.sql              ← 24 demo fixtures
└── src/
    ├── middleware.ts                  ← auth gate for /pools/*
    ├── lib/
    │   ├── types.ts                   ← shared TS types
    │   ├── api-football.ts            ← provider adapter
    │   └── supabase/
    │       ├── client.ts              ← browser client
    │       ├── server.ts              ← SSR + admin clients
    │       └── middleware.ts          ← session refresh
    └── app/
        ├── layout.tsx                 ← host-flag strip + global wrapper
        ├── globals.css                ← theme variables + utilities
        ├── page.tsx                   ← landing (with Estadio Azteca wallpaper)
        ├── login/page.tsx             ← Google + email magic-link
        ├── auth/
        │   ├── callback/route.ts
        │   └── signout/route.ts
        ├── pools/
        │   ├── page.tsx               ← "Your pools" list
        │   ├── _components.tsx        ← join-by-code form
        │   ├── new/page.tsx           ← create pool (admin only)
        │   └── [code]/
        │       ├── page.tsx           ← pool detail (server)
        │       ├── not-found.tsx      ← friendly 404
        │       ├── _PoolTabs.tsx      ← tab navigation
        │       ├── _MatchRow.tsx      ← pick input + lock countdown
        │       ├── _Leaderboard.tsx
        │       ├── _Kpis.tsx
        │       ├── _ShareBar.tsx      ← social share buttons
        │       ├── _FairPlay.tsx      ← Groups Live (with simulation)
        │       ├── _Teams.tsx         ← 48-team browser
        │       ├── _Members.tsx       ← members list + edit profile
        │       ├── _Chat.tsx          ← realtime chat
        │       └── _Admin.tsx         ← owner-only tools
        └── api/
            ├── cron/sync-fixtures/route.ts  ← Vercel cron endpoint
            └── og/[code]/route.tsx          ← OG share image
```

---

## Things That Surprised Me Along the Way

- **Supabase RLS recursion** — if a SELECT policy references another table that also has RLS, you can get silent empty results. Wrap recursive checks in a SECURITY DEFINER helper function.
- **Next.js 16 breaking change** — sync `cookies()` became async. Project pinned to Next 14 to avoid the migration headache.
- **Vercel Hobby cron tier** — only one cron per day. For 5-min live sync, pair with free cron-job.org pinging the same endpoint.
- **`@vercel/og` quirk** — runs in Edge runtime with no DOM, so CSS variables `var(--…)` don't resolve. Use hex literals inside OG image routes.
- **Google OAuth account caching** — by default, Google silently re-picks the previously-signed-in account in incognito. Pass `prompt: "select_account"` to always show the picker.
- **`.app` TLD** — requires HTTPS via HSTS preload. Not a problem on Vercel, but on plain HTTP hosts the domain just won't load.

---

## Credits

- **FIFA** — official fixtures and team data
- **API-Football** — live scores during the tournament
- **TheSportsDB** — community-edited player photos
- **Supabase** — Postgres + auth + realtime infrastructure
- **Vercel** — hosting + cron + OG image rendering
- **Next.js / React** — the framework
- **Tailwind CSS** — styling utility
- **Built in Cowork mode** with Anthropic's Claude as the implementation pair-programmer

---

*Last updated: May 2026 · Built for the 2026 FIFA World Cup · Canada · México · USA*
