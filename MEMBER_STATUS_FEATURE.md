# Member Acceptance Status — Feature Complete

**Date:** May 21, 2026  
**Status:** ✅ Ready for deployment  
**Feature:** Track member invitations (pending → accepted or declined)

---

## What Changed

### Database Schema
**File:** `supabase/migrations/add_member_status.sql`

- Added `status` column to `pool_members` table with default `'pending'`
- Added CHECK constraint: `status IN ('pending', 'accepted', 'declined')`
- Created two new RPC functions:
  - `accept_pool_member(pool_id, user_id)` — Owner accepts a pending member
  - `decline_pool_member(pool_id, user_id)` — Owner declines a pending member invite

### Admin UI
**File:** `src/app/pools/[code]/_Admin.tsx`

- Added `status` field to Member type
- New "⏳ Pending approvals" section showing all pending members
- Accept/Decline buttons next to each pending member
- Members table now shows only "accepted" members
- Added `acceptMember()` and `declineMember()` functions with optimistic updates

---

## How It Works

### User Flow: Inviting & Accepting

1. **Owner invites member** (via email or code)
   - New member automatically gets `status = 'pending'`
   - Owner sees them in "⏳ Pending approvals" section

2. **Owner reviews pending member**
   - Click **Accept** → status becomes `'accepted'`, member appears in main Members table
   - Click **Decline** → status becomes `'declined'`, member stays in pending section with declined state

3. **Member is now fully part of the pool**
   - Can see all tabs (Groups, Elimination, Live, etc.)
   - Can make picks and score points
   - Appears in Leaderboard

---

## Database Changes

### Migration File Location
```
supabase/migrations/add_member_status.sql
```

### SQL Summary
```sql
-- Add status column (default 'pending')
ALTER TABLE pool_members ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

-- Create RPC: accept_pool_member
CREATE FUNCTION accept_pool_member(pool_id UUID, user_id UUID) ... 

-- Create RPC: decline_pool_member  
CREATE FUNCTION decline_pool_member(pool_id UUID, user_id UUID) ...
```

### Data Impact
- **Existing members:** Will get `status = 'pending'` (you can manually set to `'accepted'` in Supabase if needed)
- **New members:** Automatically `'pending'`, owner approves/declines
- **No data loss:** Original `joined_at` timestamp preserved

---

## UI Changes

### Before
```
📝 Groups | 🏆 Elimination | 📺 Live | ... | ⚙️ Admin
  [Admin tab shows all members in one table]
```

### After
```
⚙️ Admin tab layout:
  1. Invite by email section (unchanged)
  2. ⏳ Pending approvals (NEW)
     - Shows pending members with Accept/Decline buttons
     - Shows count of pending requests
  3. Members table (filtered to show only 'accepted')
  4. Danger zone (unchanged)
```

---

## Deployment Steps

### Step 1: Deploy Database Schema
```bash
# Option A: Via Supabase Dashboard
1. Open Supabase → SQL Editor → New query
2. Copy-paste entire `supabase/migrations/add_member_status.sql`
3. Click Run
4. Verify: "Query successful" ✓

# Option B: Via CLI
supabase db push
```

### Step 2: Verify Schema
Run these queries in Supabase SQL Editor:

```sql
-- Check status column exists
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'pool_members' AND column_name = 'status';
-- Expected: 1 row with 'status' / 'text'

-- Check RPCs exist
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN ('accept_pool_member', 'decline_pool_member');
-- Expected: 2 rows

-- Check all members have status set
SELECT COUNT(*) FROM pool_members WHERE status IS NULL;
-- Expected: 0 rows
```

### Step 3: Deploy Code Changes
```bash
git add src/app/pools/[code]/_Admin.tsx
git add supabase/migrations/add_member_status.sql
git add MEMBER_STATUS_FEATURE.md
git commit -m "Add member acceptance status tracking (pending → accepted/declined)"
git push origin main
# Vercel auto-deploys within 2 minutes
```

### Step 4: Test in Admin Panel
1. Go to pool → **⚙️ Admin** tab
2. Verify "⏳ Pending approvals" section appears
3. Test Accept → member moves to Members table ✓
4. Test Decline → member marked as declined ✓
5. Check browser console → no errors ✓

---

## Technical Details

### RLS Policies
No changes needed. Existing RLS policies still apply:
- Members can see the pool they're invited to (regardless of status)
- Members can make picks and see the leaderboard
- Only owner can accept/decline

### Real-Time Behavior
- Accept/Decline are optimistic updates (instant UI feedback)
- Changes persist to database via RPC
- If RPC fails, toast shows error and state reverts

### Rollback Plan
If something breaks:
1. Remove `status` column from `pool_members`:
   ```sql
   ALTER TABLE pool_members DROP COLUMN status;
   ```
2. Revert code changes:
   ```bash
   git revert [commit-hash]
   git push
   ```
3. Vercel auto-deploys old version

---

## Pre-Deployment Checklist

- [ ] Backup current database (via Supabase dashboard)
- [ ] Read through migration file
- [ ] Create new query in Supabase SQL Editor
- [ ] Copy-paste entire migration file
- [ ] Click **Run** and wait for "Query successful"
- [ ] Run verification queries above
- [ ] Push code changes to GitHub
- [ ] Wait for Vercel deployment to complete
- [ ] Test in Admin tab (Accept/Decline buttons work)
- [ ] Check Supabase logs for any errors

---

## What's Next

### Immediate
1. Deploy schema + code changes
2. Test Accept/Decline in Admin tab
3. Verify no console errors

### Optional Enhancements (Future)
- Send email notification when invited: "You've been invited to a pool! Click here to join."
- Show member count breakdown: "3 accepted, 2 pending"
- Allow members to self-accept (email confirmation link)
- Timezone reminders: "Your friend is waiting to approve you"

---

## Files Changed

| File | Changes |
|------|---------|
| `supabase/migrations/add_member_status.sql` | New migration file with status column + RPCs |
| `src/app/pools/[code]/_Admin.tsx` | Added pending approval section, Accept/Decline buttons |
| `MEMBER_STATUS_FEATURE.md` | This file |

---

## Questions?

**Schema deployment stuck?**
→ Check Supabase SQL Editor for error messages. Common issue: existing column. Use `ALTER TABLE IF EXISTS` in migration.

**Accept/Decline buttons don't appear?**
→ Verify status column exists in pool_members (check 1 above). Refresh page.

**Member not moving to accepted list after clicking Accept?**
→ Check Supabase logs for RPC errors. Verify user_id and pool_id are correct.

---

**Ready to deploy! 🚀**
