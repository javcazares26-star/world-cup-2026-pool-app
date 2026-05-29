# World Cup Winner Pick Feature

## Overview
Participants can predict which National Team will win the 2026 FIFA World Cup. Correct predictions award **5 bonus points** added to their total leaderboard score.

## Timeline

| Date | Event | Action |
|------|-------|--------|
| June 11, 2026 @ 17:55 UTC | First match starts (5 mins before) | **MUST PICK** a team by this deadline |
| June 11 - June 26 | Group Stage | Can **CHANGE** pick anytime |
| June 27 (approx) | First knockout match | Pick becomes **LOCKED**, no more changes |
| July 19, 2026 | Final match played | Winner determined, **5 POINTS AWARDED** |

## User Experience

### 1. Picking a Team (June 11 - June 26)
- **Location**: Top of "Picks" tab as `🏆 World Cup Winner Pick` section
- **Display**: All 32 teams as selectable cards (sorted A-Z)
- **Countdown**: Shows time until first lock (June 11 @ 17:55 UTC)
- **Current Selection**: Shows user's current pick in highlighted box
- **Status**: Shows "LOCKED" badge once group stage ends

### 2. Group Stage (June 11 - June 26)
- User picks a team by the June 11 deadline (5 mins before first match)
- Can change their pick **anytime during Group Stage**
- Countdown timer shows time remaining until the pick locks
- Selection is saved to database immediately upon clicking a team

### 3. After Group Stage (June 27+)
- Pick is automatically locked when first knockout match starts
- "LOCKED" badge appears
- Team cards become disabled/unclickable
- Cannot change pick

### 4. After Tournament (July 19+)
- Once tournament winner is determined, **5 points awarded** to correct picks
- Leaderboard updates with bonus points
- Shows "✓ +5 points!" badge for winners

## Technical Implementation

### Database Schema

**Table: `tournament_winner_picks`**
```sql
id              bigint (primary key)
pool_id         bigint (FK to pools)
user_id         uuid (FK to auth.users)
team_name       text (e.g., "Argentina", "France", "USA")
locked_at       timestamp (NULL = unlocked, set when group stage ends)
points_awarded  integer (0 = not won, 5 = won)
created_at      timestamp
updated_at      timestamp

Unique constraint: (pool_id, user_id) — one pick per user per pool
```

### Components

**`_WinnerPick.tsx`**
- Displays 32 teams as selectable cards
- Shows countdown timer until June 11 lock deadline
- Auto-locks when group stage ends (first knockout match)
- Tracks current pick and lock status
- Real-time database updates via Supabase
- Shows success messages when pick changes

### Lock Deadlines

**First Deadline** (5 mins before tournament starts):
- Date: June 11, 2026
- Time: 17:55 UTC (1:00 PM Mexico City Time - 5 mins)
- Purpose: User MUST have made a pick by this time
- After this: Pick affects scoring even if changes occur

**Group Stage Lock** (5 mins before first knockout):
- Date: ~June 27, 2026 (calculated from first knockout fixture)
- Purpose: Pick becomes truly locked, no more changes allowed
- Calculated from: `fixtures.filter(f => !f.group_label)[0].kickoff_utc - 5 mins`

### Leaderboard Integration

**Points Calculation**:
```
Total Points = Match Picks Points + Tournament Winner Points

Where:
- Match Picks Points = 1 point per correct result, 3 points per exact score
- Tournament Winner Points = 0 or 5 (awarded only if correct)
```

**View: `v_leaderboard_with_winner`**
- Combines match pick scores from `v_pick_scores`
- Adds tournament winner pick points from `tournament_winner_picks`
- Automatically includes winner bonus in leaderboard ranking

## Implementation Checklist

### Phase 1: Database (DONE ✓)
- [x] Create `tournament_winner_picks` table
- [x] Add RLS policies
- [x] Create indexes

### Phase 2: UI Component (DONE ✓)
- [x] Build `_WinnerPick.tsx` component
- [x] Integrate into Picks tab
- [x] Countdown timer
- [x] Team card selection
- [x] Lock status display
- [x] Real-time database sync

### Phase 3: Locking Logic (DONE ✓)
- [x] Calculate first deadline (June 11 @ 17:55 UTC)
- [x] Calculate group stage lock (5 mins before first knockout)
- [x] Auto-lock when group stage ends
- [x] Prevent changes after lock
- [x] Show lock status in UI

### Phase 4: Leaderboard Points (PENDING)
- [ ] Apply migration: `update_leaderboard_with_winner_pick.sql`
- [ ] Update leaderboard view to include winner points
- [ ] Test points calculation

### Phase 5: Award Points (MANUAL - July 19)
After Final match is played:
1. Query the Final fixture to identify winning team (e.g., "Argentina")
2. Run SQL function:
   ```sql
   SELECT public.award_tournament_winner_points(POOL_ID, 'Argentina');
   ```
3. Leaderboard automatically updates with +5 points

## Files Created

- `migrations/tournament_winner_picks.sql` — Database schema
- `src/app/pools/[code]/_WinnerPick.tsx` — UI component
- `migrations/update_leaderboard_with_winner_pick.sql` — Leaderboard integration
- `WORLD_CUP_WINNER_FEATURE.md` — This documentation

## Files Modified

- `src/app/pools/[code]/_PoolTabs.tsx` — Added WinnerPick import and component

## Testing Checklist

- [ ] Create `tournament_winner_picks` table via migration
- [ ] Load app and see "🏆 World Cup Winner Pick" section at top of Picks tab
- [ ] See all 32 teams displayed as cards
- [ ] Select a team and confirm it's saved
- [ ] See countdown timer showing time until lock
- [ ] Change pick and confirm update works during group stage
- [ ] Verify lock happens when group stage ends
- [ ] After group stage, confirm cards are disabled
- [ ] Verify leaderboard includes winner points after July 19
- [ ] Confirm +5 points awarded for correct predictions

## Deployment Notes

1. **Database Migrations**:
   ```bash
   # Apply in Supabase SQL editor:
   psql your-connection-string < migrations/tournament_winner_picks.sql
   psql your-connection-string < migrations/update_leaderboard_with_winner_pick.sql
   ```

2. **Environment**: Add cron secret for automatic point awards
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables:
   CRON_SECRET=your-secret-random-string
   ```

3. **Cron Setup** (automatic points award):
   - Endpoint: `GET /api/cron/award-tournament-winner?secret=CRON_SECRET`
   - Set up one-time cron at https://cron-job.org:
     - URL: `https://mundial2026-aesthion.vercel.app/api/cron/award-tournament-winner?secret=YOUR_CRON_SECRET`
     - Schedule: **July 19, 2026 at 22:00 UTC** (after Final finishes)
     - Timeout: 30 seconds
     - This is a **one-time execution**, not recurring
   - The function will:
     - Find the Final match and identify winning team
     - Award 5 points to all users who predicted correctly
     - Update leaderboard with bonus points automatically

## Future Enhancements

1. **Notifications**: Send toast notification when user wins the +5 points
2. **Leaderboard Detail**: Show "Winner Pick: Argentina ✓" next to user's final score
3. **Admin Dashboard**: Show which teams were picked most frequently
4. **Historical**: Track winner pick predictions across all pools for analysis

## Known Limitations

1. **Team Names**: Uses string team names (e.g., "Argentina"), not IDs
   - Pro: Human-readable
   - Con: Must match exactly with fixture team names
   - Solution: Extracted from actual fixtures data

2. **Leaderboard View**: May need to update your existing leaderboard query
   - Check `WORLD_CUP_WINNER_FEATURE.md` Phase 4 for migration steps

## Support

For issues or questions:
1. Check countdown timer calculates correctly (should be June 11 @ 17:55 UTC)
2. Verify group stage lock calculates from first knockout fixture
3. Ensure team names match exactly with fixture data
4. Run award function with correct winning team name after Final
