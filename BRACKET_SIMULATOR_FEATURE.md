# Bracket Simulator Feature

## Overview
The bracket simulator allows users to visualize which teams would qualify from each group and what the knockout stage bracket would look like **based on their current predictions**. This dynamic preview updates in real-time as users adjust their picks.

## How It Works

### 1. **Group Stage Simulation** (`bracket-simulator.ts`)
- Analyzes all picks made in the pool for group stage matches
- For each group match, calculates the average predicted score across all players' picks
- Determines final group standings based on:
  - **Points**: Win = 3 pts, Draw = 1 pt, Loss = 0 pts
  - **Goal Difference**: Goals For - Goals Against
  - **Goals For**: Total goals scored (as tiebreaker)

### 2. **Qualification Logic**
Based on simulated group results:
- **Top 2 from each of 12 groups** = 24 teams automatically qualify
- **Top 8 third-place finishers** = 8 additional teams qualify
- **Total**: 32 teams advance to knockout stage

This matches the official 2026 World Cup format.

### 3. **Bracket Generation** 
Once qualified teams are determined, they're mapped to their bracket positions:
- **1A vs 2B**: Winner of Group A faces Runner-up of Group B
- **1B vs 2A**: Winner of Group B faces Runner-up of Group A
- And so on... following the official FIFA bracket structure

Third-place teams fill remaining slots based on their rankings.

### 4. **Real-Time Updates**
- Displayed in new **"🔮 Bracket"** tab in the pool interface
- Updates instantly as users change their picks
- Shows current standings, qualified teams, and Round of 32 matchups

## UI Components

### `_BracketPreview.tsx`
Main component displaying:

1. **Info Card**: Explains the feature and how it works
2. **Group Standings**: 
   - Grid layout showing all 12 groups
   - Highlights qualified teams (1st/2nd place) with color coding
   - Shows simulated points, plays, goal difference
3. **Qualified Teams**:
   - Card grid of all 32 teams advancing to knockouts
   - Shows position (1st, 2nd, or 3rd) and group
4. **Round of 32 Preview**:
   - All 16 matchups with team logos and qualification codes
   - Teams paired according to FIFA bracket rules
5. **Help Text**: Explains the simulation methodology

## Key Features

✅ **Fully Dynamic**: Changes as picks are updated
✅ **Pool-Wide**: Uses all players' picks to simulate outcomes (averaged)
✅ **Accurate Scoring**: Uses official FIFA tiebreaker rules
✅ **Visual Clarity**: Shows which teams are qualified with color coding
✅ **Tournament Proof**: Will be replaced with real results once tournament starts

## Technical Details

### Simulation Algorithm
```
For each group fixture:
  1. Find all picks for that match
  2. Calculate average home/away goals from those picks
  3. Update standings (points, goals for/against, GD)
  4. Apply tiebreaker rules (pts → GD → GF)

Repeat until all group matches processed

Extract qualified teams:
  - Top 2 from each group (24 teams)
  - Top 8 of the 12 third-place finishers (8 teams)

Map to bracket positions:
  - 1A plays 2B, 1B plays 2A, etc.
  - 3rd place teams fill remaining slots
```

### Data Flow
```
Fixtures + Picks
    ↓
simulateGroupStandings()
    ↓
Group Standings (with positions)
    ↓
extractQualified()
    ↓
Qualified Teams array (32 teams)
    ↓
generateBracket()
    ↓
BracketMatch[] (Round of 32 matchups)
    ↓
<BracketPreview /> component renders
```

## Future Enhancements

As the tournament progresses:
1. **Phase 1 - Group Stage**: Bracket preview shows simulated advancement
2. **Phase 2 - Group Stage Complete**: Update to show actual group results
3. **Phase 3 - Knockout Stage**: 
   - Actual matchups fill in as teams qualify
   - Real results displayed instead of predictions
   - Bracket updates dynamically with real-time scores

## Testing Checklist

- [ ] Bracket tab appears between Picks and Groups Live tabs
- [ ] Group standings show correct simulated points/GD
- [ ] Top 2 from each group are highlighted
- [ ] Qualified teams grid shows all 32 teams
- [ ] Round of 32 matchups display with correct team pairings
- [ ] Updates when picks are changed
- [ ] Correct tiebreaker ordering (pts → GD → GF)
- [ ] 3rd place teams ranked correctly
- [ ] Works on mobile (responsive grid layout)

## Files Created/Modified

**New Files:**
- `src/lib/bracket-simulator.ts` - Core simulation logic
- `src/app/pools/[code]/_BracketPreview.tsx` - UI component
- `BRACKET_SIMULATOR_FEATURE.md` - This documentation

**Modified Files:**
- `src/app/pools/[code]/_PoolTabs.tsx` - Added bracket tab and imports

## Known Limitations

1. **Knockout Results**: Only Round of 32 is shown (future rounds depend on match outcomes)
2. **Tie Rules**: Uses simplified scoring (doesn't account for head-to-head or other advanced tiebreakers)
3. **Averages**: Uses average of all picks per match (could be enhanced with weighted averages or mode-based)
4. **No Penalties**: Doesn't simulate knockout penalty logic yet

These can be enhanced in future iterations as tournament data becomes available.
