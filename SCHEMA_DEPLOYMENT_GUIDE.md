# Schema Deployment Guide

**Date:** May 21, 2026  
**Changes:** Fixed pool code collision + added messages table + added 3 RPCs + fixed score constraint

---

## What Changed

### 1. Pool Code Collision Fix ✅
**File:** `supabase/schema.sql` (create_pool RPC)

**Change:** Added collision retry logic. If random code already exists, retry up to 5 times.

**Why:** Previously, duplicate code would cause INSERT to fail, but the error wasn't visible to user. Now it retries automatically, raising a clear error only after 5 failed attempts.

---

### 2. Messages Table ✅
**File:** `supabase/schema.sql` (new)

**Added:**
- `messages` table with RLS policies (pool members only)
- Indexes on `pool_id` and `created_at`
- Realtime publication for live chat updates

**Why:** Chat feature needs persistent message storage. Was referenced in code but not in schema.

---

### 3. Three Missing RPCs ✅
**File:** `supabase/schema.sql` (new)

**Added:**
1. `remove_pool_member(pool_id, user_id)` — Deletes member + their picks + messages (owner-only)
2. `add_pool_member_by_email(pool_id, email)` — Looks up user by email + adds to pool (owner-only)
3. `delete_pool(pool_id)` — Permanently deletes pool + all data (owner-only)

**Why:** Admin actions reference these RPCs. They were missing from schema.

---

### 4. Score Constraint Fix ✅
**File:** `supabase/schema.sql` (picks table CHECK constraint)

**Change:** Updated from `CHECK (home_pick >= 0 AND home_pick <= 30)` to `<= 20`

**Why:** UI limits to 0-20, schema allowed 0-30. Now consistent.

---

## Deployment Steps

### Step 1: Back Up Current Database
```sql
-- In Supabase Dashboard → SQL Editor, run:
-- (This creates a snapshot; Supabase auto-backups daily anyway)

-- Just note the current time for safety
SELECT NOW();
```

### Step 2: Deploy Schema Changes
**Option A: Supabase Dashboard (Easiest)**

1. Go to **Supabase Dashboard** → **SQL Editor** → **New query**
2. Copy the **entire** updated `supabase/schema.sql`
3. Paste into the editor
4. Click **Run**
5. Wait for ✅ "Query successful"

**Option B: Supabase CLI (If Installed)**
```bash
cd /path/to/world-cup-2026-pool-app
supabase db push
```

---

### Step 3: Verify Deployment

Run each verification query in **Supabase SQL Editor**:

#### Check 1: Messages Table Exists
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'messages';
-- Expected: 1 row with 'messages'
```

#### Check 2: RPC Functions Exist
```sql
SELECT proname FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN ('remove_pool_member', 'add_pool_member_by_email', 'delete_pool', 'create_pool');
-- Expected: 4 rows (remove_pool_member, add_pool_member_by_email, delete_pool, create_pool)
```

#### Check 3: Messages RLS Policies
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'messages';
-- Expected: 3 policies (messages visible to pool members, users insert own, users delete own)
```

#### Check 4: Realtime Enabled for Messages
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
-- Expected: 1 row
```

#### Check 5: Score Constraint Updated
```sql
SELECT pg_get_expr(adbin, adrelid) AS constraint_expr
FROM pg_attribute a
JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
WHERE a.attrelid = 'public.picks'::regclass
AND (a.attname = 'home_pick' OR a.attname = 'away_pick');
-- Expected: Constraints should mention '<= 20', not '<= 30'
```

#### Check 6: Verify No Pool with Null Code
```sql
SELECT * FROM public.pools WHERE code IS NULL;
-- Expected: 0 rows (should be empty)
```

---

### Step 4: Test Each Feature

#### Test Chat (Messages Table)
1. Go to your pool: https://mundial2026-aesthion.vercel.app/pools/CAZARES2026
2. Click **💬 Chat** tab
3. Type a message + send
4. Expected: Message appears instantly + persists on refresh

**If chat fails:**
- Check browser console for errors
- Verify messages table exists (Check 3 above)
- Verify RLS policies (Check 4 above)

#### Test Admin: Invite by Email
1. As pool owner, click **⚙️ Admin** tab
2. Under "Invite by email", enter a family member's email
3. Click **Add to pool**
4. Expected: "Invited [email]. They'll see the pool on their dashboard."

**If fails:**
- Verify `add_pool_member_by_email` RPC exists (Check 2 above)
- Check Supabase logs for RPC error

#### Test Admin: Remove Member
1. In Admin tab, find a test member in the Members table
2. Click **Remove** button
3. Click **OK** on confirmation
4. Expected: Member disappears from list instantly

**If fails:**
- Verify `remove_pool_member` RPC exists (Check 2 above)

#### Test Admin: Delete Pool (Danger Zone)
1. Create a **test pool** (not your main CAZARES2026)
2. As owner, click **⚙️ Admin** tab
3. Under "Danger zone", select the test pool from dropdown
4. Type the pool code exactly
5. Click **Delete pool forever**
6. Expected: Pool deleted + you're redirected to /pools

**If fails:**
- Verify `delete_pool` RPC exists (Check 2 above)

#### Test Create Pool with Collision
*(This is hard to trigger naturally; skip unless you want to test the retry logic)*

If you want to verify the collision retry works:
```sql
-- Manually insert a pool with code "TESTAA" to trigger collision:
INSERT INTO public.pools (code, name, owner_id) 
VALUES ('TESTAA', 'Collision Test', 'YOUR_USER_ID');

-- Now in your app, try to create a pool (random code will eventually try TESTAA, fail, retry)
-- This is low-probability, so skip unless you want to stress-test
```

---

### Step 5: Verify Pick Score Constraint
1. In **Picks** tab, try to set a pick to 25
2. Expected: Input should clamp to 20 (not allow > 20)

**Note:** The constraint is client-side AND server-side, so:
- Client UI prevents you from entering > 20
- Server DB rejects any pick > 20 at the database level

---

## Rollback Plan (If Something Goes Wrong)

If something breaks after deployment:

**Option 1: Use Supabase Auto-Backup**
1. Go to Supabase Dashboard → **Settings** → **Backups**
2. Restore to a point before the deployment
3. Coordinate the rollback time with your team

**Option 2: Drop the New Objects**
```sql
-- In Supabase SQL Editor:
DROP TABLE IF EXISTS public.messages CASCADE;
DROP FUNCTION IF EXISTS public.remove_pool_member CASCADE;
DROP FUNCTION IF EXISTS public.add_pool_member_by_email CASCADE;
DROP FUNCTION IF EXISTS public.delete_pool CASCADE;
-- Then recreate the old create_pool version
```

---

## Deployment Checklist

- [ ] Backed up current DB (noted the time)
- [ ] Copied full `supabase/schema.sql` to Supabase SQL Editor
- [ ] Ran the schema update (got ✅ "Query successful")
- [ ] Ran all 6 verification checks above
- [ ] All checks passed
- [ ] Tested chat (send a message)
- [ ] Tested admin: invite by email
- [ ] Tested admin: remove member
- [ ] Tested admin: delete test pool
- [ ] Verified pick score clamp to 20

---

## What to Do Next

1. **Before inviting family:** Complete all steps above + test thoroughly
2. **Deploy to Vercel:** Push code changes (if any) + the schema update must be live on Supabase first
3. **Share pool code:** CAZARES2026 is ready for invites
4. **Monitor:** Watch Supabase logs for any RPC errors in the first 24h

---

## Troubleshooting

### "Pool code not found" when creating a pool
- Check that `create_pool` RPC updated (verify in Check 2)
- If error persists, try manually creating a pool with custom code in admin

### Chat doesn't work / "table messages does not exist"
- Run Check 3 verification above
- If messages table missing, you may not have run full schema.sql
- Re-run the entire schema.sql from step 2

### Admin actions fail silently
- Check browser console for JS errors
- Verify all 3 RPCs exist (Check 2)
- Check Supabase logs (Dashboard → Logs → Database) for RPC errors

### "Only the pool owner can..." error but you ARE the owner
- Check that `pools.owner_id` matches your `auth.uid()`
- Query: `SELECT id, owner_id FROM pools WHERE code = 'YOUR_CODE'` 
- Verify owner_id is a valid UUID

---

## Questions?

If anything fails, check:
1. Supabase Dashboard → **Logs** tab (Database section)
2. Browser console (F12 → Console tab)
3. Supabase Status page for outages

Good luck! 🚀
