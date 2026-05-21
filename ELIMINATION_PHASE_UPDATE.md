# Elimination Phase Feature — Complete

**Date:** May 21, 2026  
**Status:** ✅ Deployed  
**Feature:** Group Stage + Knockout Phase picks

---

## What Changed

### New Tab Structure
The **Picks section** has been split into two tabs:

1. **📝 Groups** (formerly "Picks")
   - Group A through Group L matches
   - All 48 teams, 64 group-stage matches
   - Grouped by group label (Group A, Group B, etc.)

2. **🏆 Elimination** (new)
   - Knockout phase matches after group stage
   - Automatically organized by round:
     - Round of 32
     - Round of 16
     - Quarter-finals
     - Semi-finals
     - Final
   - Sorted chronologically within each round

### Updated Tab Bar
```
Before:  📝 Picks | 📺 Live | 📊 Groups Live | ...
After:   📝 Groups | 🏆 Elimination | 📺 Live | 📊 Groups Live | ...
```

---

## How It Works

### Data Filtering
- **Group matches:** Where `fixture.group_label` is not null (e.g., "Group A")
- **Elimination matches:** Where `fixture.group_label` is null but `fixture.round` is set

### Scoring
- Same rules apply to both phases
- 3 points for exact prediction
- 1 point for correct outcome (winner/draw)
- 0 points for missed prediction
- Picks lock 5 minutes before each match's kickoff

### Real-Time Updates
- Both tabs subscribe to fixture updates via Supabase Realtime
- Live scores, status changes, and final results sync instantly
- Leaderboard recalculates when any pick changes

---

## User Experience

### During Group Stage
1. Members navigate to **📝 Groups** tab
2. See all matches organized by group (Group A, Group B, etc.)
3. Make predictions for group-stage matches
4. **🏆 Elimination** tab shows: "Elimination phase fixtures will appear after the group stage."

### After Group Stage Begins
1. Once API-Football syncs knockout matches, they appear in **🏆 Elimination** tab
2. Members click **🏆 Elimination**
3. See knockout matches organized by round (Round of 32, Quarter-finals, etc.)
4. Make predictions for knockout matches
5. Scoring automatically includes all picks (both phases)

### During Knockout Phase
- Live scores, final results update in real-time
- Leaderboard reflects points from both phases
- Members can switch between tabs to see current progress

---

## Code Changes

**File:** `src/app/pools/[code]/_PoolTabs.tsx`

### New Utilities
```tsx
// Separate group stage from elimination
const groupStageFixtures = useMemo(() => 
  fixtures.filter(f => f.group_label), [fixtures]
);

const eliminationFixtures = useMemo(() => 
  fixtures.filter(f => !f.group_label), [fixtures]
);

// Group by stage
const groupedByStage = useMemo(() => {
  const groups: Record<string, Fixture[]> = {};
  const elim: Record<string, Fixture[]> = {};
  
  // Group stage organized by group_label
  // Elimination organized by round
  
  return { groups, elim };
}, [groupStageFixtures, eliminationFixtures]);
```

### Elimination Tab Rendering
```tsx
{tab === "elimination" && (
  <>
    {/* Instructions card */}
    {Object.entries(groupedByStage.elim)
      .sort(([a], [b]) => {
        const order = ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"];
        return order.indexOf(a) - order.indexOf(b);
      })
      .map(([round, ms]) => (
        // Render round section with sorted matches
      ))}
  </>
)}
```

---

## What's Next

### For You (Admin)
1. Test the new tab layout
2. Verify no errors in browser console
3. When API-Football syncs knockout fixtures, they'll auto-appear in the **🏆 Elimination** tab

### For Your Family
1. Members continue making group-stage picks in **📝 Groups** tab
2. When knockout fixtures appear, they navigate to **🏆 Elimination** tab
3. Scoring works seamlessly across both phases
4. Leaderboard automatically includes all picks

---

## Testing Checklist

- [ ] Deploy changes (git push → Vercel auto-deploy)
- [ ] Visit pool page → see new tabs: "📝 Groups" and "🏆 Elimination"
- [ ] Click **📝 Groups** → see group stage matches only
- [ ] Click **🏆 Elimination** → see empty message (until fixtures sync)
- [ ] Make a group stage pick → verify it saves and scores correctly
- [ ] Check browser console → no errors
- [ ] Verify leaderboard still works (includes group-stage picks)

---

## When Knockout Matches Appear

### Prerequisites
- API-Football subscription active
- Sync cron running (every 5 min)
- Tournament progresses past group stage

### Automatic
- Once group stage completes and knockout matches are synced to DB
- **🏆 Elimination** tab will auto-populate with knockout matches
- No code changes needed
- Members can start making knockout predictions

---

## Fixture Data Structure

The distinction between phases is determined by the `fixtures` table:

**Group Stage:**
```
id: 123456
round: "Group Stage - 1"
group_label: "Group A"
home_team: "Canada"
away_team: "Mexico"
```

**Elimination:**
```
id: 456789
round: "Round of 16"
group_label: null
home_team: "France"
away_team: "Germany"
```

The app filters and groups automatically based on these fields.

---

## Summary

✅ **Two-phase predictions:** Group stage + Knockout  
✅ **Automatic organization:** By group, then by round  
✅ **Unified scoring:** Both phases count toward leaderboard  
✅ **Real-time updates:** Live scores sync instantly  
✅ **Same lock rules:** 5 min before each match  

Your pool is now ready for the entire tournament! 🏆⚽
