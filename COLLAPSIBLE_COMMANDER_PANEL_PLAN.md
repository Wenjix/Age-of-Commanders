# Make Commander Panel Collapsible (Bottom Bar)

## Current State

The CommanderPanel (`src/components/CommanderPanel.tsx`) is currently:
- Fixed height bottom bar showing all 3 commanders side-by-side
- Always expanded when visible (hidden only during curate phase)
- Takes up significant vertical space with speech bubbles

## Proposed Collapsible Design

### Collapsed State (Default)
```
┌──────────────────────────────────────────────┐
│ 👤 👤 👤  Commanders Thinking...    [▲ Expand]│  ← ~44px height
└──────────────────────────────────────────────┘
```
- Minimal height bar (~44px to match TopBar)
- Shows just commander avatars (small, no speech bubbles)
- Expand button on the right
- Visual indicator that commanders are "thinking"

### Expanded State (User Clicks Expand)
```
┌──────────────────────────────────────────────┐
│ [▼ Collapse]                                 │
├──────────────────────────────────────────────┤
│  👤 Larry                                     │
│  └─ "I will build exactly 3 walls..."        │  ← Full speech
│                                               │     bubbles
│  👤 Paul                                      │
│  └─ "What if they trick me..."               │
│                                               │
│  👤 Olivia                                    │
│  └─ "Let's make friends with everyone!"      │
└──────────────────────────────────────────────┘
```
- Expands upward (like a drawer from bottom)
- Shows full commander avatars + speech bubbles
- Collapse button at top
- Smooth animation (300ms transition)

## Implementation Plan

### 1. Add Collapsed State to Zustand Store

**File:** `src/store/useGameStore.ts`

**Add:**
```typescript
interface GameState {
  // ... existing
  commanderPanelExpanded: boolean;
  setCommanderPanelExpanded: (expanded: boolean) => void;
}

// Implementation:
commanderPanelExpanded: false, // Default collapsed
setCommanderPanelExpanded: (expanded) => set({ commanderPanelExpanded: expanded }),

resetGame: () => {
  set({
    // ... existing
    commanderPanelExpanded: false, // Reset to collapsed
  });
},
```

### 2. Update CommanderPanel Component

**File:** `src/components/CommanderPanel.tsx`

**Add:**
- Local state for panel expansion
- Toggle button
- Conditional rendering (collapsed vs expanded view)
- Smooth animation with Tailwind transitions

**Collapsed View:**
```typescript
{!isExpanded && (
  <div className="bg-gray-950 border-t border-gray-700 px-4 py-2 flex items-center justify-between transition-all duration-300">
    {/* Left: Small avatars in a row */}
    <div className="flex items-center gap-2">
      {commanders.map((commander) => (
        <div
          key={commander.id}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
          style={{ backgroundColor: commander.colors.bg }}
        >
          {commander.name[0]}
        </div>
      ))}
      <span className="text-gray-400 text-sm ml-2">Commanders Thinking...</span>
    </div>

    {/* Right: Expand button */}
    <button
      onClick={() => setIsExpanded(true)}
      className="text-gray-400 hover:text-white transition-colors px-3 py-1 rounded text-sm"
    >
      ▲ Expand
    </button>
  </div>
)}
```

**Expanded View:**
```typescript
{isExpanded && (
  <div className="bg-gray-950 border-t border-gray-700 transition-all duration-300">
    {/* Collapse button bar */}
    <div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center">
      <span className="text-gray-400 text-sm">Commander Thoughts</span>
      <button
        onClick={() => setIsExpanded(false)}
        className="text-gray-400 hover:text-white transition-colors px-3 py-1 rounded text-sm"
      >
        ▼ Collapse
      </button>
    </div>

    {/* Commander content (existing layout) */}
    <div className="p-4">
      <div className="flex gap-4 max-w-7xl mx-auto">
        {commanders.map((commander) => (
          <CommanderAvatar key={commander.id} commander={commander} />
        ))}
      </div>
    </div>
  </div>
)}
```

### 3. Animation Details

**Smooth Height Transition:**
- Use `max-height` transition (collapsed: `max-h-[44px]`, expanded: `max-h-[300px]`)
- Add `overflow-hidden` during transition
- Duration: `300ms` (matches other UI animations)

**Alternative (More Complex but Smoother):**
- Use `grid-template-rows` with `0fr` → `1fr` transition
- Requires wrapping content in grid

### 4. Update Tailwind Safelist

**File:** `src/index.css`

**Add:**
```css
@source inline("
  max-h-[44px] max-h-[300px]
  w-8 h-8 text-xs
");
```

## Visual Design Options

### Option A: Minimal Collapsed (Recommended)
- Just avatars + "Thinking..." label + button
- ~44px height
- Matches TopBar aesthetics

### Option B: Show Active Commander
- Collapsed shows only the commander whose turn it is
- Still small, but gives context
- Slightly taller (~60px)

### Option C: Ticker Tape Style
- Collapsed shows rotating/scrolling commander thoughts
- More dynamic but potentially distracting

**Recommendation:** Option A (Minimal) - cleanest, least distracting

## State Management Strategy

### When to Auto-Expand?
- **Never auto-expand** (user controls it)
- Stays in user's chosen state across phases
- Could add tooltip: "Click to see what commanders are thinking"

### When to Show Panel?
- Keep existing logic: hidden during `curate` phase
- Show (collapsed by default) during: `draft`, `teach`, `execute`, `debrief`

## Files to Modify

1. ✅ `src/store/useGameStore.ts` - Add `commanderPanelExpanded` state (optional - could use local state)
2. ✅ `src/components/CommanderPanel.tsx` - Add collapse/expand logic and UI
3. ✅ `src/index.css` - Add Tailwind safelist classes

## User Experience

**Benefits:**
- ✅ More screen space for game canvas by default
- ✅ Reduces visual clutter when user doesn't need commander thoughts
- ✅ User has control over when to see details
- ✅ Consistent with modern UI patterns (collapsible panels)

**Interaction Flow:**
1. User enters teach phase
2. CommanderPanel appears at bottom (collapsed)
3. User sees small avatars + "Thinking..." indicator
4. User clicks "▲ Expand" when curious about interpretations
5. Panel expands upward showing full speech bubbles
6. User clicks "▼ Collapse" to reclaim screen space
7. Panel stays collapsed/expanded based on user preference

## Implementation Time

- State management: 10 minutes
- Collapsed view UI: 20 minutes
- Expanded view refactor: 15 minutes
- Animations/polish: 15 minutes

**Total: ~1 hour**
