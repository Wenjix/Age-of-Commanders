# Blind Build & Reveal System

## 🎯 Core Concept

**"The fun isn't in control—it's in the gap between intention and execution."**

Players don't see what their commanders build until the wave ends, creating hilarious "Oh NO they didn't!" moments.

## 🎮 Game Flow

### Phase 1: Curate (Building Selection)
- Player chooses **exactly 3 building types** from a pool of 5
- Available buildings:
  - 🧱 **Wall** (5 wood) - Blocks enemy movement
  - 🗼 **Tower** (10 wood) - Attacks enemies in range
  - 🎯 **Decoy** (3 wood) - Distracts 50% of enemies
  - 💣 **Mine** (7 wood) - Explodes on contact
  - 🌾 **Farm** (8 wood) - Decorative (does nothing)

### Phase 2: Teach (Command Input)
- Player enters a command (e.g., "Defend the north")
- All 3 commanders interpret the command simultaneously via LLM
- Each commander's interpretation is displayed in their speech bubble

### Phase 3: Execute (Blind Building)
- Commanders secretly build structures based on their interpretations
- **Buildings are invisible** during this phase
- Only the base, enemies (if any), and timer are visible
- Lasts 5 seconds (demo) or 5 minutes (full game)

### Phase 4: Debrief (Reveal & Results)
- All buildings appear at once with scale-in animation
- Statistics shown:
  - Total buildings constructed
  - Wood used / remaining
  - Breakdown by commander
- **Highlight Reel**: Most absurd builds displayed
- Options: Play Again or Share Results

## 🏗️ Building System

### Building Types & Costs

| Building | Cost | Effect | Personality Preference |
|----------|------|--------|------------------------|
| Wall | 5 wood | Blocks enemies | Literalist, Paranoid |
| Tower | 10 wood | Attacks in range | Paranoid |
| Decoy | 3 wood | Distracts 50% enemies | Optimist |
| Mine | 7 wood | Explodes on contact | Paranoid |
| Farm | 8 wood | Does nothing | Optimist |

### Secret Build Plan Generation

Each commander generates a secret build queue:
- **Max 10 buildings** per commander
- Only uses **player-enabled buildings**
- Respects **shared wood budget** (50 total)
- Positions based on **personality**:

**Literalist (Larry)**:
- Methodical grid pattern around base
- Even distribution of building types
- Predictable, organized placement

**Paranoid (Paul)**:
- Dense perimeter defense
- Prioritizes north edge (enemy spawn)
- Favors defensive buildings (walls, towers, mines)
- Over-prepares with multiple layers

**Optimist (Olivia)**:
- Random decorative placement
- Circular pattern around base
- Favors friendly buildings (farms, decoys)
- Treats enemies as "guests"

## 🎭 Personality-Driven Building

### Position Generation

```typescript
// Literalist: Grid around base
[baseX - 3, baseY], [baseX + 5, baseY], [baseX, baseY - 3], [baseX, baseY + 5]

// Paranoid: North edge + perimeter
[baseX, baseY - 5], [baseX + 1, baseY - 5], [baseX - 1, baseY - 5]

// Optimist: Random circle
angle = (i / count) * 2π
x = baseX + cos(angle) * radius
y = baseY + sin(angle) * radius
```

### Building Type Selection

```typescript
// Literalist: Even distribution
buildings = [wall, tower, decoy, wall, tower, decoy, ...]

// Paranoid: Defensive priority
buildings = [wall, tower, mine, wall, tower, mine, ...]

// Optimist: Friendly priority
buildings = [farm, decoy, farm, decoy, ...]
```

## 🔍 Blind Execution

### What's Hidden
- All player-built structures (walls, towers, etc.)
- Building placement locations
- Resource expenditure details

### What's Visible
- Base (2x2 red square at center)
- Enemies (if spawned)
- Timer/wave progress
- Commander speech bubbles (interpretations)

### Implementation
```typescript
// Buildings have a `revealed` property
interface Building {
  position: [number, number];
  type: BuildingType;
  ownerId: string;
  revealed: boolean; // false during execution
}

// GameCanvas only renders revealed buildings
buildingsRef.current.forEach((building) => {
  if (!building.revealed) return; // Skip during blind phase
  // ... render building
});
```

## 🎉 Reveal Animation

### Trigger
- Automatic after wave ends (5 seconds in demo)
- Transitions from 'execute' to 'debrief' phase

### Animation
- All buildings set to `revealed: true`
- PixiJS scale-in animation (future enhancement)
- Toast notification: "All buildings revealed!"

### Debrief Statistics

**Overall Stats:**
- Buildings Constructed: 12
- Wood Used: 47/50
- Wood Remaining: 3

**Commander Breakdown:**
- Avatar with personality badge
- Interpretation quote
- Buildings by type (e.g., "3x wall, 2x tower")
- Wood used per commander

**Highlight Reel:**
- Most absurd builds (e.g., "Olivia built 3 Farms (they do nothing)")
- Sorted by absurdity score
- Creates shareable moments

## 🎯 Comedy Moments

### Example Scenarios

**Command**: "Defend the north"

**Larry (Literalist)**:
- Builds exactly 3 walls facing north
- "I have placed defensive structures on the northern perimeter."

**Paul (Paranoid)**:
- Builds 8 mines all over the map
- "The enemy will attack from ALL sides! I've prepared for every scenario!"

**Olivia (Optimist)**:
- Builds 5 decoys in a circle
- "I've created welcoming signs so our visitors know where to gather!"

---

**Command**: "Build a tower"

**Larry**:
- Builds exactly 1 tower at [12, 8]
- "Tower constructed as specified."

**Paul**:
- Builds 3 towers + 5 walls around them
- "One tower is a trap! I've built three with fortifications!"

**Olivia**:
- Builds 1 farm
- "I've built a lovely observation tower for bird watching!"

## 🛠️ Technical Implementation

### Files Created/Modified

**New Files:**
- `src/components/BuildingCuration.tsx` - Building selection UI
- `src/components/DebriefScreen.tsx` - Results screen
- `src/services/buildPlanService.ts` - Build plan generation

**Modified Files:**
- `src/store/useGameStore.ts` - Added `enabledBuildings`, `secretBuilds`, `revealed`
- `src/components/ExecutionController.tsx` - Blind execution logic
- `src/components/CommandInput.tsx` - Integrated build plan generation
- `src/components/GameCanvas.tsx` - Only render revealed buildings
- `src/constants/gameConstants.ts` - New building types and costs

### State Management

```typescript
// Zustand store additions
interface GameState {
  enabledBuildings: BuildingType[]; // Player-selected (3 max)
  buildings: Building[]; // All buildings (revealed + hidden)
  commanders: Commander[]; // Each has secretBuilds array
  phase: 'curate' | 'teach' | 'execute' | 'debrief';
  revealAllBuildings: () => void;
}

interface Commander {
  secretBuilds: Building[]; // Hidden until reveal
  // ... other properties
}

interface Building {
  revealed: boolean; // Controls visibility
  // ... other properties
}
```

### Execution Flow

1. **Curate Phase**: Player selects 3 buildings → stored in `enabledBuildings`
2. **Teach Phase**: 
   - User enters command
   - LLM interprets for each commander
   - `generateAllBuildPlans()` creates secret builds
   - Stored in `commander.secretBuilds`
3. **Execute Phase**:
   - All secret builds placed immediately (revealed: false)
   - Wood deducted
   - Buildings invisible in GameCanvas
   - Timer runs (5 seconds demo)
4. **Debrief Phase**:
   - `revealAllBuildings()` sets all to revealed: true
   - GameCanvas re-renders with buildings visible
   - Statistics calculated and displayed

## 🚀 Future Enhancements

- [ ] Actual enemy waves with combat logic
- [ ] Building reveal animations (scale-in, fade-in)
- [ ] Share results as image/tweet
- [ ] Sound effects for reveal
- [ ] Commander reaction animations
- [ ] Building effectiveness scoring
- [ ] Replay system
- [ ] Multiple difficulty levels
- [ ] More building types
- [ ] Custom commander personalities

## 🎮 Testing Checklist

- [x] Building curation UI works
- [x] Can select exactly 3 buildings
- [x] LLM interpretations generate
- [x] Secret builds created based on personality
- [x] Buildings hidden during execute phase
- [x] Buildings revealed in debrief phase
- [x] Statistics calculated correctly
- [x] Play Again resets game state
- [ ] Enemy combat logic
- [ ] Building effectiveness (walls block, towers attack, etc.)
- [ ] Share functionality

## 📊 Metrics for Comedy

**Absurdity Score:**
- Farm: 3 points (does nothing)
- Decoy: 2 points (minimal effect)
- Mine: 1 point (overkill)
- Wall/Tower: 0 points (normal)

**Highlight Reel Priority:**
1. Optimist building farms
2. Paranoid building excessive mines
3. Literalist building in perfect grid (boring but funny)
4. Any commander misinterpreting command completely

---

**Status**: ✅ Core system implemented and tested
**Next**: Add enemy waves and combat logic

