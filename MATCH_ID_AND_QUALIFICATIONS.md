# Match Identifiers & Team Qualifications — Knockout Phase

**Date:** May 21, 2026  
**Status:** ✅ Ready for deployment  
**Feature:** Display match IDs (M73, M74, etc.) and qualified team positions (1E, 3A, etc.)

---

## What Changed

### Display Improvements
**Before:**
```
ROUND OF 32                              Jun 29, 5:30 PM
     0    vs    0
3-ABCDF                 [score inputs]   TBD
```

**After:**
```
ROUND OF 32  [M73]                       Jun 29, 5:30 PM
1E vs 3A
Spain                   0 vs 0            Uruguay
     [score inputs]
```

### Database Schema
**File:** `supabase/migrations/add_match_id_and_qualifications.sql`

Added to `fixtures` table:
- `match_id` (text, unique) — Match identifier like "M73", "M74"
- `qualified_team_home` (text) — Position label like "1E" (Winner of Group E)
- `qualified_team_away` (text) — Position label like "3A" (3rd place Group A)
- `is_knockout` (boolean) — Flag for easy knockout filtering

### UI Updates
**File:** `src/app/pools/[code]/_MatchRow.tsx`

- Display `[M73]` badge next to round name
- Show qualification line: "1E vs 3A" above team names (knockout matches only)
- Reuse team names once determined (Spain instead of "1E" after group stage)

### Type Updates
**File:** `src/lib/types.ts`

Added fields to Fixture type for TypeScript support.

---

## Qualification Label System

### Format: `[Position][Group]`

**Position codes:**
- `1` = Group winner
- `2` = Runner-up (2nd place)
- `3` = 3rd place

**Group codes:** `A` through `L` (12 groups)

### Examples

| Label | Meaning |
|-------|---------|
| `1E` | Winner of Group E |
| `2D` | Runner-up (2nd place) from Group D |
| `3A` | Third place from Group A |
| `1L` | Winner of Group L |

### Round of 32 Bracket (16 matches)

```
M1:  1A vs 2B       M2:  1B vs 2A
M3:  1C vs 2D       M4:  1D vs 2C
M5:  1E vs 2F       M6:  1F vs 2E
M7:  1G vs 2H       M8:  1H vs 2G
M9:  1I vs 2J       M10: 1J vs 2I
M11: 1K vs 2L       M12: 1L vs 2K
M13: 3A/3B/3C/3D vs 2E/2F/2G/2H (3rd place bracket)
M14: 3E/3F/3G/3H vs 2A/2B/2C/2D
M15: 3I/3J/3K/3L vs 2I/2J/2K/2L
M16: [Complex 3rd place matchup]
```

### Match ID Format

Numbering continues sequentially:
- **M1–M16:** Round of 32 (16 matches)
- **M17–M24:** Round of 16 (8 matches)
- **M25–M28:** Quarter-finals (4 matches)
- **M29–M30:** Semi-finals (2 matches)
- **M31:** Final (1 match)

Total: 31 knockout matches

---

## Data Flow

### Before Group Stage Completes
```
Fixture: M73
├─ match_id: "M73"
├─ qualified_team_home: "1E"
├─ qualified_team_away: "3A"
├─ home_team: "TBD"
├─ away_team: "TBD"
└─ is_knockout: true

Display:
  ROUND OF 16  [M73]
  1E vs 3A
  TBD  0 vs 0  TBD
```

### After Group Stage Completes (Teams Determined)
```
Fixture: M73 (updated)
├─ match_id: "M73"
├─ qualified_team_home: "1E"  (unchanged)
├─ qualified_team_away: "3A"  (unchanged)
├─ home_team: "Spain"         (determined)
├─ away_team: "Uruguay"       (determined)
└─ is_knockout: true

Display:
  ROUND OF 16  [M73]
  1E vs 3A
  Spain  0 vs 0  Uruguay
```

---

## Deployment Steps

### 1️⃣ **Deploy Database Migration**
```bash
# Open Supabase Dashboard → SQL Editor → New query
# Copy-paste entire supabase/migrations/add_match_id_and_qualifications.sql
# Click Run
```

Verify:
```sql
-- Check new columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'fixtures' 
AND column_name IN ('match_id', 'qualified_team_home', 'qualified_team_away', 'is_knockout');
-- Expected: 4 rows
```

### 2️⃣ **Deploy Code Changes**
```bash
git add src/app/pools/[code]/_MatchRow.tsx
git add src/lib/types.ts
git add supabase/migrations/add_match_id_and_qualifications.sql
git add MATCH_ID_AND_QUALIFICATIONS.md
git commit -m "Add match identifiers and qualified team position labels for knockout phase"
git push origin main
# Vercel auto-deploys within 2 minutes
```

### 3️⃣ **Test Display**
1. Go to pool → **🏆 Elimination** tab
2. Verify matches show:
   - `[M73]` badge next to round name ✓
   - `1E vs 3A` qualification line ✓
   - Team names (or "TBD" if not yet determined) ✓
3. Browser console → no errors ✓

---

## How API-Football Sync Populates This Data

When your sync cron runs (`every 5 minutes after deploy`):

1. **Fetches fixtures** from API-Football for World Cup 2026
2. **For knockout matches:**
   - Extracts `match_id` from API response (e.g., "M73")
   - Extracts qualified team labels from bracket structure (e.g., "1E", "3A")
   - Sets `is_knockout = true`
3. **Stores in DB** with all fields populated
4. **Updates team names** once group stage determines qualifiers (Spain, Uruguay, etc.)

The sync script needs to handle qualification label mapping — this is handled by API-Football's tournament structure.

---

## File Changes Summary

| File | Changes |
|------|---------|
| `supabase/migrations/add_match_id_and_qualifications.sql` | New migration: match_id, qualified_team_*, is_knockout columns |
| `src/app/pools/[code]/_MatchRow.tsx` | Added M-ID badge, qualification label line display |
| `src/lib/types.ts` | Added 4 new fields to Fixture type |
| `MATCH_ID_AND_QUALIFICATIONS.md` | This documentation |

---

## Pre-Deployment Checklist

- [ ] Read through migration file (makes sense structurally)
- [ ] Create new query in Supabase SQL Editor
- [ ] Copy-paste entire migration file
- [ ] Click **Run** and wait for "Query successful"
- [ ] Run verification query (check 4 columns exist)
- [ ] Push code changes to GitHub
- [ ] Wait for Vercel deployment
- [ ] Test Elimination tab display (M-IDs and qualifications appear)
- [ ] Check browser console for TypeScript errors

---

## When Knockout Fixtures Appear

Once your API-Football subscription is active and syncing 2026 World Cup data:

1. **Cron runs** (every 5 min) and pulls knockout fixtures
2. **Fixtures appear** in `🏆 Elimination` tab automatically
3. **Match identifiers** (M73, M74, etc.) display instantly
4. **Qualification labels** (1E vs 3A) show bracket structure
5. **Team names** update as group stage completes and qualifiers are determined

No further code changes needed — all fields populate automatically via sync.

---

## Example Display After Deployment

```
🏆 ELIMINATION TAB

─────────────────────────────────────────────────────────

ROUND OF 16  [M17]                    Jun 30, 10:00 AM
1A vs 2B
France             0  vs  0            Germany
  [△▼] [input] vs [input] [△▼]

─────────────────────────────────────────────────────────

ROUND OF 16  [M18]                    Jun 30, 2:00 PM
1B vs 2A
Spain              0  vs  0            Portugal
  [△▼] [input] vs [input] [△▼]

─────────────────────────────────────────────────────────

[More matches continue below]
```

---

## Questions?

**Migration deployment stuck?**
→ Check Supabase error message. Common issue: column already exists. Verify you're running the migration file, not the base schema.

**M-IDs not showing?**
→ Verify match_id column exists and has data. Check Supabase table directly.

**Qualification labels showing as null?**
→ This is OK until API-Football syncs knockout fixtures. They'll populate automatically once sync runs.

---

**Ready to deploy! 🚀⚽**
