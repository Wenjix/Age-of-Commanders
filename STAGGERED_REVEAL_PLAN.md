# Implement Staggered Reveal Animation (Blind Execute → Reveal)

## Problem Analysis

**Current State:**
1. ExecutionController jumps directly from `execute` to `debrief` after 5s wave (line 57-60)
2. DebriefScreen reveals ALL buildings simultaneously after 500ms (line 27-30)
3. No visual drama, no staggered animation, no "blind execute → reveal" split

**Planned State (from UI_UX_IMPROVEMENTS.md):**
- Buildings placed during execute phase remain hidden (`revealed: false`)
- Dramatic staggered reveal animation with:
  - One-by-one building appearance
  - Scale-in animation with bounce
  - Sequence by commander (Larry → Paul → Olivia)
  - Optional "Skip" button to see all at once
  - Camera zoom/pan to each building

## Implementation Strategy

### Approach: Intermediate "Reveal" Phase

Instead of jumping from `execute` → `debrief`, introduce an intermediate flow:

```
execute → reveal (NEW) → debrief
```

**Why?**
- Separates the "reveal animation" concern from the "debrief stats" screen
- Allows users to watch the reveal on the canvas without stats panel interference
- Matches the documented flow: "Blind Execute → Reveal → Debrief"

### Alternative: Reveal During Debrief Entry

Keep `execute` → `debrief` but trigger staggered reveal when debrief opens.

**Why?**
- Simpler phase management (no new phase)
- Debrief panel can stay collapsed while buildings reveal
- User sees stats panel appear AFTER reveal completes

**Recommended:** Alternative approach (simpler, no new phase)

## Detailed Implementation Plan

### 1. Update Zustand Store (Add Reveal State)

**File:** `src/store/useGameStore.ts`

**Add:**
```typescript
interface GameState {
  // ... existing
  revealingBuildings: boolean; // Track if reveal animation is in progress
  setRevealingBuildings: (revealing: boolean) => void;
}
```

**Purpose:** Track whether we're currently in reveal animation to prevent user interference

### 2. Create Staggered Reveal Logic (DebriefScreen)

**File:** `src/components/DebriefScreen.tsx`

**Current (line 21-32):**
```typescript
useEffect(() => {
  if (phase === 'debrief' && !revealed) {
    setDebriefPanelWidth(60);
    setIsExpanded(false);
    setTimeout(() => {
      revealAllBuildings(); // ❌ All at once
      setRevealed(true);
      toast.success('All buildings revealed!', { duration: 2000 });
    }, 500);
  }
}, [phase, revealed, revealAllBuildings, setDebriefPanelWidth]);
```

**New (staggered reveal):**
```typescript
useEffect(() => {
  if (phase === 'debrief' && !revealed) {
    setDebriefPanelWidth(0); // Hide panel during reveal
    setIsExpanded(false);
    setRevealingBuildings(true);

    // Get all unrevealed buildings
    const unrevealedBuildings = buildings.filter(b => !b.revealed);

    // Group by commander (Larry → Paul → Olivia)
    const buildingsByCommander = commanders.map(commander => ({
      commander,
      buildings: unrevealedBuildings.filter(b => b.ownerId === commander.id)
    }));

    // Stagger reveal: 500ms delay between each building
    let currentDelay = 500; // Initial delay
    const REVEAL_INTERVAL = 600; // ms between each building

    buildingsByCommander.forEach(({ commander, buildings }) => {
      buildings.forEach((building, index) => {
        setTimeout(() => {
          // Reveal individual building
          revealBuilding(building.position[0], building.position[1]);

          // Toast for each building
          toast.success(
            `${commander.name} built a ${building.type}!`,
            { duration: 1000, id: `reveal-${building.position[0]}-${building.position[1]}` }
          );
        }, currentDelay);
        currentDelay += REVEAL_INTERVAL;
      });
    });

    // After all reveals, show debrief panel
    setTimeout(() => {
      setRevealed(true);
      setRevealingBuildings(false);
      setDebriefPanelWidth(60); // Show collapsed tab
      toast.success('All buildings revealed!', { duration: 2000 });
    }, currentDelay + 500);
  }
}, [phase, revealed, buildings, commanders, setDebriefPanelWidth, setRevealingBuildings]);
```

### 3. Add Individual Building Reveal Action

**File:** `src/store/useGameStore.ts`

**Add:**
```typescript
interface GameState {
  // ... existing
  revealBuilding: (x: number, y: number) => void;
}

// In store implementation:
revealBuilding: (x, y) => {
  set((state) => ({
    buildings: state.buildings.map((b) =>
      b.position[0] === x && b.position[1] === y
        ? { ...b, revealed: true }
        : b
    ),
  }));
},
```

**Purpose:** Reveal buildings one-by-one instead of all at once

### 4. Add Scale-In Animation (GameCanvas)

**File:** `src/components/GameCanvas.tsx`

**Current:** Buildings just appear when `revealed: true`

**Enhancement:** Add scale animation when building is revealed

**Location:** Inside the `renderBuildings` function (around line 252-280)

**Pseudo-code:**
```typescript
// When a building transitions from unrevealed → revealed:
if (building.revealed && !existingGraphic) {
  // Create the sprite
  const sprite = createBuildingSprite(building);

  // Start at scale 0
  sprite.scale.set(0);

  // Animate to scale 1 with bounce
  animateScaleIn(sprite, {
    from: 0,
    to: 1,
    duration: 400,
    easing: 'easeOutBack' // Creates bounce effect
  });

  camera.addChild(sprite);
}
```

**Implementation Options:**
1. **Simple:** Use `requestAnimationFrame` for custom tween
2. **Library:** Use GSAP (if already included) or PixiJS Tween library
3. **Manual:** Simple easing function with timestamp tracking

### 5. Optional: Skip Button

**File:** `src/components/DebriefScreen.tsx` or new `RevealController.tsx`

**Feature:** Allow users to skip the staggered reveal

**Implementation:**
```typescript
// Show "Skip Reveal" button during reveal
{phase === 'debrief' && revealingBuildings && (
  <button
    onClick={() => {
      // Cancel all pending timeouts
      clearAllRevealTimeouts();
      // Reveal all immediately
      revealAllBuildings();
      setRevealed(true);
      setRevealingBuildings(false);
      setDebriefPanelWidth(60);
    }}
    className="fixed top-20 right-4 z-[100] ..."
  >
    ⏩ Skip Reveal
  </button>
)}
```

### 6. Update ExecutionController (No Changes Needed)

**File:** `src/components/ExecutionController.tsx`

**Current behavior is CORRECT:**
- Places buildings with `revealed: false` (line 31)
- Transitions to `debrief` after wave (line 59)
- DebriefScreen handles the reveal animation

**No changes needed here!**

## Visual Flow

**Before (Current):**
```
Execute Phase (5s)
  └─> Buildings placed (hidden)
  └─> Wave timer completes
  └─> setPhase('debrief')
  └─> DebriefScreen mounts
      └─> 500ms delay
      └─> revealAllBuildings() ← ALL AT ONCE ❌
      └─> Show panel
```

**After (Staggered):**
```
Execute Phase (5s)
  └─> Buildings placed (hidden)
  └─> Wave timer completes
  └─> setPhase('debrief')
  └─> DebriefScreen mounts
      └─> Panel hidden (width: 0)
      └─> 500ms delay
      └─> Reveal Larry's building #1 (scale-in animation)
      └─> 600ms delay
      └─> Reveal Larry's building #2 (scale-in animation)
      └─> 600ms delay
      └─> Reveal Paul's building #1 (scale-in animation)
      └─> ... (continue for all buildings)
      └─> 500ms delay after last reveal
      └─> Show debrief panel (collapsed tab)
      └─> User can expand to see stats
```

## User Experience

1. **Execute phase completes** - "Wave complete! Revealing builds..." toast
2. **Camera stays on canvas** - Debrief panel hidden (width: 0)
3. **First building appears** - Scale from 0 → 1 with bounce, toast shows "Larry built a wall!"
4. **600ms later** - Next building appears, another toast
5. **Repeat** for all buildings (Larry → Paul → Olivia)
6. **Final toast** - "All buildings revealed!"
7. **Debrief tab appears** - Collapsed 60px tab on left side
8. **User clicks** - Panel expands to show stats

## Files to Modify

1. ✅ `src/store/useGameStore.ts` - Add `revealBuilding`, `revealingBuildings` state
2. ✅ `src/components/DebriefScreen.tsx` - Replace instant reveal with staggered logic
3. ✅ `src/components/GameCanvas.tsx` - Add scale-in animation for revealed buildings
4. ⭕ (Optional) New `RevealController.tsx` - Separate component for reveal logic + skip button

## Complexity Analysis

**Minimal Implementation (No Animation):**
- Just stagger the `revealBuilding()` calls
- ~50 lines of code
- 30 minutes

**With Scale Animation:**
- Add simple scale tween
- ~100 lines of code
- 1 hour

**Full Implementation (Animation + Skip):**
- Scale animation, skip button, toast notifications
- ~150 lines of code
- 1.5 hours

## Recommendation

Start with **Minimal + Simple Scale Animation**:
1. Staggered reveal timing (group by commander)
2. Simple scale animation (0 → 1 over 400ms)
3. Toast notifications per building
4. Skip button can be added later if needed