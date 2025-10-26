# Staggered Reveal Implementation Plan (Revised)

## Critical Issues from Original Plan - NOW ADDRESSED

### ✅ Concern 1: Timeout Management and Cancellation
**Issue:** No mechanism to track/cancel setTimeout IDs → memory leaks and broken skip button

**Solution Added:**
- Store all timeout IDs in `useRef` array
- Cleanup function in `useEffect` to clear all pending timeouts
- `clearAllRevealTimeouts()` helper for skip button

### ✅ Concern 2: Camera Movement Discrepancy
**Issue:** Mentioned in goals but not in implementation

**Solution:**
- **Explicitly deferred** to future enhancement
- Plan focuses on scale-in animation only
- Camera movement noted as "Phase 2" feature

### ✅ Concern 3: Spammy Toast Notifications
**Issue:** Toast per building could be overwhelming (10+ buildings = 10+ toasts)

**Solution:**
- **Single toast at start:** "Revealing builds..."
- **No per-building toasts** (visual animation is enough)
- **Single toast at end:** "All buildings revealed!"
- Alternative: Live counter toast (updates in place)

### ✅ Concern 4: Reveal Order Dependency
**Issue:** Assumes commanders array is always [Larry, Paul, Olivia]

**Solution:**
- **Explicit commander ordering** using predefined ID sequence
- Sort by `['larry', 'paul', 'olivia']` regardless of store order
- Gracefully handle missing commanders

---

## Revised Implementation

### 1. Update Zustand Store

**File:** `src/store/useGameStore.ts`

**Add state:**
```typescript
interface GameState {
  // ... existing
  revealingBuildings: boolean;
  setRevealingBuildings: (revealing: boolean) => void;
  revealBuilding: (x: number, y: number) => void;
}

// Implementation:
export const useGameStore = create<GameState>((set, get) => ({
  // ... existing

  revealingBuildings: false,
  setRevealingBuildings: (revealing) => set({ revealingBuildings: revealing }),

  revealBuilding: (x, y) => {
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.position[0] === x && b.position[1] === y
          ? { ...b, revealed: true }
          : b
      ),
    }));
  },

  resetGame: () => {
    set({
      // ... existing resets
      revealingBuildings: false,
    });
  },
}));
```

### 2. Implement Staggered Reveal with Cleanup

**File:** `src/components/DebriefScreen.tsx`

**Complete implementation with all fixes:**

```typescript
import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BUILDING_COSTS } from '../constants/gameConstants';
import { getThemeStyles } from '../utils/themeStyles';
import toast from 'react-hot-toast';

export const DebriefScreen = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);
  const buildings = useGameStore((state) => state.buildings);
  const wood = useGameStore((state) => state.wood);
  const revealAllBuildings = useGameStore((state) => state.revealAllBuildings);
  const revealBuilding = useGameStore((state) => state.revealBuilding);
  const uiTheme = useGameStore((state) => state.uiTheme);
  const setDebriefPanelWidth = useGameStore((state) => state.setDebriefPanelWidth);
  const revealingBuildings = useGameStore((state) => state.revealingBuildings);
  const setRevealingBuildings = useGameStore((state) => state.setRevealingBuildings);

  const resetGame = useGameStore((state) => state.resetGame);

  const [revealed, setRevealed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // ✅ FIX #1: Store timeout IDs for cleanup
  const timeoutIdsRef = useRef<number[]>([]);

  // Helper to clear all pending timeouts
  const clearAllRevealTimeouts = () => {
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  // ✅ FIX #4: Explicit commander ordering
  const COMMANDER_REVEAL_ORDER = ['larry', 'paul', 'olivia'];

  useEffect(() => {
    if (phase === 'debrief' && !revealed) {
      setDebriefPanelWidth(0); // Hide panel during reveal
      setIsExpanded(false);
      setRevealingBuildings(true);

      // Get all unrevealed buildings
      const unrevealedBuildings = buildings.filter(b => !b.revealed);

      // ✅ FIX #4: Sort commanders explicitly by reveal order
      const sortedCommanders = COMMANDER_REVEAL_ORDER
        .map(id => commanders.find(c => c.id === id))
        .filter(Boolean); // Remove undefined (in case commander doesn't exist)

      // Group buildings by sorted commander order
      const buildingsByCommander = sortedCommanders.map(commander => ({
        commander,
        buildings: unrevealedBuildings.filter(b => b.ownerId === commander!.id)
      }));

      // Stagger reveal: 500ms initial, 600ms between buildings
      let currentDelay = 500;
      const REVEAL_INTERVAL = 600;

      // ✅ FIX #3: Single toast at start (no per-building spam)
      const revealToastId = 'revealing-builds';
      toast.loading('Revealing builds...', { id: revealToastId });

      buildingsByCommander.forEach(({ commander, buildings }) => {
        buildings.forEach((building) => {
          const timeoutId = window.setTimeout(() => {
            // Reveal individual building
            revealBuilding(building.position[0], building.position[1]);

            // Optional: Update toast with progress (less spammy alternative)
            // toast.loading(`Revealing builds... (${revealed}/${total})`, { id: revealToastId });
          }, currentDelay);

          // ✅ FIX #1: Track timeout ID
          timeoutIdsRef.current.push(timeoutId);
          currentDelay += REVEAL_INTERVAL;
        });
      });

      // After all reveals, show debrief panel
      const finalTimeoutId = window.setTimeout(() => {
        setRevealed(true);
        setRevealingBuildings(false);
        setDebriefPanelWidth(60); // Show collapsed tab

        // ✅ FIX #3: Single toast at end
        toast.success('All buildings revealed!', { id: revealToastId, duration: 2000 });
      }, currentDelay + 500);

      // ✅ FIX #1: Track final timeout
      timeoutIdsRef.current.push(finalTimeoutId);
    }

    // ✅ FIX #1: Cleanup function to prevent memory leaks
    return () => {
      clearAllRevealTimeouts();
    };
  }, [
    phase,
    revealed,
    buildings,
    commanders,
    setDebriefPanelWidth,
    setRevealingBuildings,
    revealBuilding
  ]);

  // Reset revealed state and panel when leaving debrief
  useEffect(() => {
    if (phase !== 'debrief') {
      setRevealed(false);
      setIsExpanded(false);
      setDebriefPanelWidth(0);
      clearAllRevealTimeouts(); // ✅ FIX #1: Cancel pending reveals on phase change
    }
  }, [phase, setDebriefPanelWidth]);

  // Update panel width when expanding/collapsing
  useEffect(() => {
    if (phase === 'debrief') {
      setDebriefPanelWidth(isExpanded ? 600 : 60);
    }
  }, [isExpanded, phase, setDebriefPanelWidth]);

  if (phase !== 'debrief') return null;

  // ... rest of component (stats, panel UI, etc.)

  // ✅ FIX #1: Skip button implementation
  const handleSkipReveal = () => {
    clearAllRevealTimeouts();
    revealAllBuildings();
    setRevealed(true);
    setRevealingBuildings(false);
    setDebriefPanelWidth(60);
    toast.success('All buildings revealed!', { duration: 1000 });
  };

  return (
    <>
      {/* Skip button (only shown during reveal animation) */}
      {revealingBuildings && (
        <button
          onClick={handleSkipReveal}
          className="fixed top-20 right-4 z-[100] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors"
        >
          ⏩ Skip Reveal
        </button>
      )}

      {/* Collapsed/Expanded Panel UI */}
      {/* ... existing panel code ... */}
    </>
  );
};
```

### 3. Add Scale-In Animation (GameCanvas)

**File:** `src/components/GameCanvas.tsx`

**Location:** Inside `renderBuildings` function (around line 252-280)

**Add simple scale animation:**

```typescript
// Track which buildings have been animated (to avoid re-animating)
const animatedBuildingsRef = useRef<Set<string>>(new Set());

// Inside renderBuildings loop:
buildingsRef.current.forEach((building) => {
  // Skip unrevealed buildings during blind execution
  if (!building.revealed) {
    return;
  }

  const key = getBuildingKey(building.position);
  const existingGraphic = buildingGraphicsMap.get(key);

  // Building just revealed (transition from hidden → visible)
  if (!existingGraphic && !animatedBuildingsRef.current.has(key)) {
    // Create sprite
    const sprite = createBuildingSprite(building);

    // ✅ Scale-in animation with bounce
    sprite.scale.set(0); // Start invisible
    const startTime = Date.now();
    const duration = 400; // 400ms animation

    // Simple easeOutBack easing for bounce effect
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutBack formula (overshoot then settle)
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);

      sprite.scale.set(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        sprite.scale.set(1); // Ensure final scale is exactly 1
      }
    };

    animate();
    animatedBuildingsRef.current.add(key);
    buildingGraphicsMap.set(key, { display: sprite, type: building.type });
    camera.addChild(sprite);
    sortCameraChildren(camera);
  }
  // Building already exists (was revealed in previous render)
  else if (existingGraphic) {
    // No changes needed, building already rendered
  }
});
```

**Simpler alternative (no easing library needed):**
```typescript
// Linear scale-in (simpler, no bounce)
sprite.alpha = 0;
sprite.scale.set(0);

let progress = 0;
const animationSpeed = 0.05; // Adjust for speed

const animate = () => {
  progress += animationSpeed;
  if (progress >= 1) {
    sprite.alpha = 1;
    sprite.scale.set(1);
    return;
  }

  sprite.alpha = progress;
  sprite.scale.set(progress);
  requestAnimationFrame(animate);
};

animate();
```

### 4. Toast Notification Strategy (Revised)

**Option A: Single Start/End Toast (Recommended)**
```typescript
// Start
toast.loading('Revealing builds...', { id: 'reveal' });

// End
toast.success('All buildings revealed!', { id: 'reveal', duration: 2000 });
```

**Option B: Live Counter Toast (Less Spammy)**
```typescript
let revealedCount = 0;
const totalBuildings = unrevealedBuildings.length;

// Start
toast.loading(`Revealing builds... (0/${totalBuildings})`, { id: 'reveal' });

// Each building
buildingsByCommander.forEach(({ buildings }) => {
  buildings.forEach((building) => {
    setTimeout(() => {
      revealBuilding(...);
      revealedCount++;
      toast.loading(
        `Revealing builds... (${revealedCount}/${totalBuildings})`,
        { id: 'reveal' }
      );
    }, currentDelay);
  });
});

// End
setTimeout(() => {
  toast.success('All buildings revealed!', { id: 'reveal', duration: 2000 });
}, finalDelay);
```

### 5. Camera Movement (Deferred to Phase 2)

**✅ FIX #2: Explicitly document deferral**

**Current Plan:** Scale-in animation only (simpler, faster to implement)

**Future Enhancement (Phase 2):**
- Camera pans to each building before reveal
- Smooth zoom in/out transitions
- Requires camera control utilities in GameCanvas
- Estimated additional effort: 2-3 hours

**Why Defer:**
1. Scale animation provides sufficient visual drama
2. Camera movement adds complexity (coordinate calculations, easing)
3. Can be added later without breaking existing reveal system
4. Focus on getting core reveal working first

---

## Summary of Fixes

| Concern | Status | Solution |
|---------|--------|----------|
| 1. Timeout Management | ✅ Fixed | `useRef` array + cleanup function + `clearAllRevealTimeouts()` |
| 2. Camera Movement | ✅ Addressed | Explicitly deferred to Phase 2, documented as future enhancement |
| 3. Spammy Toasts | ✅ Fixed | Single start/end toast OR live counter (no per-building spam) |
| 4. Reveal Order | ✅ Fixed | Explicit `COMMANDER_REVEAL_ORDER` constant with `.find()` sorting |

---

## Testing Checklist

- [ ] Reveal animation starts when entering debrief phase
- [ ] Buildings appear one-by-one in correct order (Larry → Paul → Olivia)
- [ ] Scale animation works (0 → 1 with bounce)
- [ ] Skip button cancels pending reveals and shows all buildings
- [ ] Component unmount during reveal doesn't cause errors
- [ ] Phase change during reveal cleans up timeouts
- [ ] Toast notifications are not spammy
- [ ] Debrief panel appears after reveal completes
- [ ] Works with 0 buildings (no crashes)
- [ ] Works with many buildings (performance OK)

---

## Implementation Time Estimate

**With all fixes:**
- Store updates: 15 minutes
- Staggered reveal logic + cleanup: 45 minutes
- Scale animation: 30 minutes
- Skip button: 15 minutes
- Testing: 30 minutes

**Total: ~2.5 hours** (conservative estimate)