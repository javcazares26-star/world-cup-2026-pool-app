# Setup: Apply Migrations & Load Real Fixture Data

## Status Check
Your codebase is trying to use fixture columns that may not exist in Supabase yet:
- `match_id` (for knockout phases)
- `qualified_team_home` / `qualified_team_away` (for pre-team-known fixtures)
- `is_knockout` (convenience flag)

These are defined in `/supabase/migrations/add_match_id_and_qualifications.sql` but may not be applied.

## Step 1: Apply All Pending Migrations

Go to **Supabase Dashboard → SQL Editor → New Query** and run each migration file in order:

1. **20260526_add_admin_hidden.sql**
   - Adds `admin_hidden` boolean to pools table
   - Enables pool owners to hide from Members/Leaderboard

2. **add_match_id_and_qualifications.sql** 
   - Adds `match_id`, `qualified_team_home`, `qualified_team_away`, `is_knockout` to fixtures
   - Fixes _MatchRow.tsx errors about missing fixture fields

3. **add_member_status.sql**
   - Adds member location tracking (used for timezone display)

4. **fix_qualified_teams_codes.sql**
   - Ensures qualification labels are consistent

## Step 2: Load Real Fixture Data

Once migrations are applied, run **real-fixtures-2026-v2.sql** in Supabase SQL Editor:
- Replaces test/placeholder fixtures with official 2026 World Cup schedule
- All times are in UTC format for accurate timezone conversion
- Example: Mexico vs South Africa is UTC `2026-06-11 21:00:00+00`

This converts to:
- **1:00 PM CDT** in Mexico City (UTC-5 in June)
- **1:00 PM CDT** in Dallas (also UTC-5)
- **12:00 PM PDT** in Los Angeles (UTC-7)

The dual timezone display will then show: **"Jun 11, 1pm MX / 1pm Dallas,TX"** (same time, not offset) or if user is in Pacific: **"Jun 11, 1pm MX / 12pm Los Angeles,CA"**

## Step 3: Deploy Latest Code

Push your latest changes and deploy to Vercel:
```bash
cd /Users/javiercazares/Documents/Claude/Cowork/world-cup-2026-pool-app
git pull origin main
git add -A
git commit -m "Add hidden admin feature, dual timezone display, fixture columns"
git push origin main
```

Vercel will auto-deploy. Check the deployment logs to ensure TypeScript compiles without errors.

## Step 4: Test

1. Create a new pool with the "Hide me" checkbox checked
2. Go to Members tab → you should not appear
3. Go to Leaderboard → you should not appear  
4. Go to Admin → toggle visibility and confirm Members/Leaderboard update in real-time
5. View any match → should see dual timezone format like "Jun 11, 1pm MX / 1pm Dallas,TX"

## Troubleshooting

**If you still see wrong times:**
- Check that real-fixtures-2026-v2.sql was run (query `SELECT COUNT(*) FROM fixtures WHERE id BETWEEN 900001 AND 900100;` — should be ~50+)
- Verify UTC conversion: `SELECT home_team, kickoff_utc FROM fixtures LIMIT 1;` and manually convert

**If columns don't exist error:**
- Check migration was run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'fixtures' AND column_name IN ('match_id', 'qualified_team_home');`
- If missing, run the migration again

**If Members/Leaderboard don't update when toggling visibility:**
- Ensure real-time subscriptions are enabled: Supabase dashboard → Real-time → check "pools" table is in publication
- This was added in schema.sql: `ALTER PUBLICATION supabase_realtime ADD TABLE public.pools;`
