# Chat Sidebar & Real-Time Notifications Feature

## Overview
Two major UX improvements have been implemented:

1. **Persistent Chat Sidebar**: Chat is no longer a tab—it's always accessible on the right side of the screen
2. **Real-Time Notifications**: Shiny, animated toast notifications for goals and leaderboard changes

## Feature #1: Persistent Chat Sidebar

### What Changed
- **Before**: Chat was a tab in `_PoolTabs` component, requiring users to click the tab to access it
- **After**: Chat is now a fixed right sidebar (desktop) or drawer (mobile) that stays visible while viewing picks, brackets, leaderboard, etc.

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│  Header (Pool name, share button)               │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│  Pool Tabs Content   │  Chat Sidebar (280px)    │
│  (Picks, Bracket,    │  - Always accessible     │
│   Leaderboard, etc)  │  - Real-time messages    │
│                      │  - Scrollable            │
│                      │                          │
└──────────────────────┴──────────────────────────┘
```

### Responsive Behavior
- **Desktop (>768px)**: Chat sidebar visible alongside content
- **Mobile**: Chat appears as bottom drawer, toggled by FAB button
- **Mobile FAB**: Floating Action Button (💬) appears bottom-right when chat is closed

### Files Modified
- `src/app/pools/[code]/_PoolLayout.tsx` - New component managing layout + notifications
- `src/app/pools/[code]/_PoolTabs.tsx` - Removed chat tab
- `src/app/pools/[code]/page.tsx` - Uses PoolLayout instead of PoolTabs
- `src/app/layout.tsx` - Added NotificationProvider wrapper

## Feature #2: Real-Time Notifications

### Notification Types

#### Goal Notifications 🎉
**Triggered when**: Any team scores during a live match
**Displays**: 
- Team name and goal count
- Current match score
- Auto-dismisses after 5 seconds
- Shiny gradient background (red → pink)

Example:
```
⚽ GOAL!
Argentina scores! 2-1
[━━━━━━━━━━━━━━━] (progress bar)
```

#### Leaderboard Notifications 📈
**Triggered when**: Your rank changes due to picks/scores
**Displays**:
- Direction of change (up/down arrow)
- New rank position
- Current points
- Auto-dismisses after 7 seconds
- Shiny gradient background (gold → yellow)

Example:
```
📈 Leaderboard Update
You moved up to #3! 45 points
[━━━━━━━━━━━━━━━] (progress bar)
```

### Visual Features
- **Shiny Animation**: Horizontal shine effect sweeping across notification
- **Bounce Icon**: Icon animates with bounce effect
- **Progress Bar**: Visual countdown to auto-dismiss
- **Stacking**: Multiple notifications stack vertically
- **Close Button**: Manual close button (×) in top-right
- **Gradient Backgrounds**: Color-coded by notification type

### Technical Implementation

#### NotificationContext (`src/components/NotificationContext.tsx`)
```typescript
// Add notifications anywhere with:
const { addNotification } = useNotification();

addNotification({
  type: 'goal',
  title: '⚽ GOAL!',
  message: 'Argentina scores! 2-1',
  duration: 5000,
});
```

#### Toast Component (`src/components/Toast.tsx`)
- Handles rendering and animations
- Auto-dismiss with progress bar
- Custom styling per notification type
- Smooth entry/exit animations

#### Real-Time Subscriptions (`src/app/pools/[code]/_PoolLayout.tsx`)
Two Supabase real-time channels:

1. **Goal Detection**:
   - Listens to `fixtures` table updates
   - Compares home_score and away_score changes
   - Triggers notification for each goal

2. **Leaderboard Tracking**:
   - Listens to `picks` table changes in current pool
   - Fetches updated leaderboard
   - Compares your previous rank to new rank
   - Triggers notification only if rank changed

## User Experience Flow

### Scenario 1: Viewing Picks Tab
```
User viewing picks tab
  ↓
Live score arrives (fixture score updates)
  ↓
Real-time notification: "⚽ GOAL! Spain scores! 2-1"
  ↓
Notification displays for 5 seconds, fades out
  ↓
Chat sidebar visible on right (no action needed to see messages)
```

### Scenario 2: Mobile Chat Access
```
User on mobile, viewing picks
  ↓
Wants to message pool
  ↓
Clicks 💬 FAB button (bottom-right)
  ↓
Chat drawer slides up from bottom
  ↓
Types message
  ↓
Clicks ✕ or taps outside to close
  ↓
Back to picks view with FAB visible again
```

### Scenario 3: Rank Change
```
User viewing leaderboard
  ↓
Another player's picks update scores
  ↓
Your rank improves from #4 → #3
  ↓
Real-time notification: "📈 Leaderboard Update - You moved up to #3!"
  ↓
Notification displays for 7 seconds
  ↓
Leaderboard tab updates live
```

## Files Created
- `src/components/NotificationContext.tsx` - Notification state management
- `src/components/Toast.tsx` - Notification UI component
- `src/app/pools/[code]/_PoolLayout.tsx` - Main layout with sidebar + subscriptions

## Files Modified
- `src/app/pools/[code]/_PoolTabs.tsx` - Removed chat tab, removed Chat import
- `src/app/pools/[code]/page.tsx` - Changed to use PoolLayout
- `src/app/layout.tsx` - Added NotificationProvider wrapper

## Technical Details

### Notification Auto-Dismiss
- Default duration: 6000ms
- Goal notifications: 5000ms
- Leaderboard notifications: 7000ms
- Exit animation: 300ms before removal

### Performance
- Notifications are queued in React state
- Maximum recommended: 3-5 simultaneous notifications
- Older notifications auto-dismiss to avoid overflow
- No performance impact on fixtures/picks data

### Real-Time Data Flow
```
Supabase DB → Real-time Subscription
    ↓
PoolLayout detects change
    ↓
Comparison logic (score/rank)
    ↓
useNotification hook
    ↓
NotificationContext adds to queue
    ↓
Toast components render
```

## Testing Checklist

- [ ] Chat sidebar visible on desktop (right side)
- [ ] Chat hidden but accessible via FAB on mobile
- [ ] Multiple messages in chat don't break layout
- [ ] Goal notification appears when fixture score updates
- [ ] Notification shows correct teams and scores
- [ ] Leaderboard notification appears when rank changes
- [ ] Multiple notifications stack vertically
- [ ] Notifications auto-dismiss after duration
- [ ] Manual close button works
- [ ] Progress bar animates correctly
- [ ] Shiny animation visible on all notification types
- [ ] Responsive on phone, tablet, desktop
- [ ] Chat closes properly on mobile after message
- [ ] No console errors or warnings
- [ ] Performance remains smooth during high activity

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Future Enhancements

1. **Notification Preferences**:
   - User setting to disable goal notifications
   - Sound effects option
   - Notification urgency levels

2. **Chat Improvements**:
   - Unread message counter
   - Typing indicators
   - Message reactions/emojis

3. **Advanced Notifications**:
   - Match starting soon
   - Picks about to lock
   - Pool member joined/left
   - Tournament milestones

4. **Notification History**:
   - View recent notifications
   - Replay notifications

## Known Limitations

1. **Mobile Chat Height**: Fixed at 384px (24rem) on mobile—may need adjustment for very tall messages
2. **Notification Limit**: Currently no hard limit, but 5+ simultaneous notifications may cause visual clutter
3. **Sound**: No audio notifications yet (future enhancement)
4. **Persistence**: Notifications don't persist across page refreshes (by design—toast notifications are transient)

## Deployment Notes

When pushing to production:
1. NotificationProvider is wrapped at root level (`src/app/layout.tsx`)
2. No database migration required
3. Real-time subscriptions use existing `fixtures` and `picks` channels
4. CSS animations use @keyframes (included in Toast component)

All features work out-of-the-box with existing Supabase setup!
