# Comedy Detection Bug: Reads Plans Instead of Actual Buildings

## Issue Description

The comedy detection system (`src/utils/comedyDetection.ts`) currently reads from `commander.secretBuilds` (the commander's planned builds) instead of the actual buildings placed on the map. This causes the system to celebrate or blame commanders for builds that never actually happened.

## Current Behavior (Bug)

**Scenario**: Commander Paul plans to build 10 mines but only has enough wood for 3.

- **What happens**: Only 3 mines are placed on the map
- **What comedy system reports**: "Built 10 mines (preparing for WW3)"
- **Highlight shows**: 10 mines
- **Absurdity calculation**: Based on 10 mines

The commander gets blamed for 10 mines when only 3 exist.

## Expected Behavior (Fix)

The comedy system should analyze the 3 actually-built mines, making the comedy grounded in reality rather than intentions.

## Root Cause

The `DebriefScreen.tsx` component **already calculates** actual buildings per commander (line 160):
```typescript
const commanderBuildings = buildings.filter((b) => b.ownerId === commander.id);
```

But when it calls comedy detection functions, those functions ignore this and read from `commander.secretBuilds` instead.

## Affected Code Locations

### `src/utils/comedyDetection.ts`

1. **Line 94**: `detectAbsurdBuilds()`
   - `const builds = commander.secretBuilds;`

2. **Lines 192-254**: `REACTIONS` templates (8 occurrences)
   - `c.secretBuilds.length` (lines 192, 193, 200)
   - `c.secretBuilds.filter(b => b.type === 'mine')` (line 223)
   - `c.secretBuilds.filter(b => b.type === 'wall')` (line 227)
   - `c.secretBuilds.filter(b => b.type === 'farm')` (line 242)
   - `c.secretBuilds.filter(b => b.type === 'decoy')` (line 250)
   - `c.secretBuilds.length === 0` (line 254)

3. **Lines 322-373**: `generateHighlights()` (6 occurrences)
   - `paul.secretBuilds.filter()` (lines 325, 326)
   - `larry.secretBuilds.length` (lines 344, 349)
   - `olivia.secretBuilds.filter()` (lines 358, 359)

4. **Line 404**: `calculateAbsurdityPercentage()`
   - Calls `detectAbsurdBuilds()` which reads from secretBuilds

### `src/components/DebriefScreen.tsx`

Calls that need updating:
- **Line 170**: `generateReaction(commander, stats)` - needs actual buildings
- **Line 173**: `calculateAbsurdityPercentage(commander, lastCommand)` - needs actual buildings
- **Line 186**: `generateHighlights(commanders, lastCommand, stats)` - needs buildings map

---

## Implementation Plan

### Step 1: Update `detectAbsurdBuilds()` signature

**File**: `src/utils/comedyDetection.ts` (line 89)

**Current**:
```typescript
export function detectAbsurdBuilds(
  commander: Commander,
  command: string
): BuildAbsurdity[] {
  const absurdities: BuildAbsurdity[] = [];
  const builds = commander.secretBuilds;
```

**Updated**:
```typescript
export function detectAbsurdBuilds(
  commander: Commander,
  command: string,
  actualBuildings: Building[]
): BuildAbsurdity[] {
  const absurdities: BuildAbsurdity[] = [];
  const builds = actualBuildings;
```

### Step 2: Update `generateReaction()` signature

**File**: `src/utils/comedyDetection.ts` (line 260)

**Current**:
```typescript
export function generateReaction(commander: Commander, stats: GameStats): string {
```

**Updated**:
```typescript
export function generateReaction(
  commander: Commander,
  stats: GameStats,
  actualBuildings: Building[]
): string {
```

### Step 3: Update REACTIONS templates

**File**: `src/utils/comedyDetection.ts` (lines 181-258)

All condition functions need to accept `actualBuildings` parameter:

**Current pattern**:
```typescript
{
  condition: (c, _s) => c.secretBuilds.length <= 3,
  reaction: (c, _s) => `I built exactly ${c.secretBuilds.length} structures...`
}
```

**Updated pattern**:
```typescript
{
  condition: (c, _s, buildings) => buildings.length <= 3,
  reaction: (c, _s, buildings) => `I built exactly ${buildings.length} structures...`
}
```

**Update ReactionTemplate interface**:
```typescript
interface ReactionTemplate {
  condition: (commander: Commander, stats: GameStats, buildings: Building[]) => boolean;
  reaction: string | ((commander: Commander, stats: GameStats, buildings: Building[]) => string);
}
```

**Update all 8 occurrences** in the REACTIONS object to use the `buildings` parameter instead of `c.secretBuilds`.

### Step 4: Update generateReaction() implementation

**File**: `src/utils/comedyDetection.ts` (line 260-276)

**Current**:
```typescript
export function generateReaction(commander: Commander, stats: GameStats): string {
  const templates = REACTIONS[commander.personality];

  for (const template of templates) {
    if (template.condition(commander, stats)) {
      if (typeof template.reaction === 'function') {
        return template.reaction(commander, stats);
      }
      return template.reaction;
    }
  }

  return commander.interpretation;
}
```

**Updated**:
```typescript
export function generateReaction(
  commander: Commander,
  stats: GameStats,
  actualBuildings: Building[]
): string {
  const templates = REACTIONS[commander.personality];

  for (const template of templates) {
    if (template.condition(commander, stats, actualBuildings)) {
      if (typeof template.reaction === 'function') {
        return template.reaction(commander, stats, actualBuildings);
      }
      return template.reaction;
    }
  }

  return commander.interpretation;
}
```

### Step 5: Update `generateHighlights()` signature

**File**: `src/utils/comedyDetection.ts` (line 287)

**Current**:
```typescript
export function generateHighlights(
  commanders: Commander[],
  command: string,
  _stats: GameStats
): Highlight[] {
```

**Updated**:
```typescript
export function generateHighlights(
  commanders: Commander[],
  command: string,
  _stats: GameStats,
  buildingsByCommanderId: Map<string, Building[]>
): Highlight[] {
```

### Step 6: Update generateHighlights() implementation

Replace all `commander.secretBuilds` lookups with map lookups:

**Example (line 325-326)**:

**Current**:
```typescript
const paul = commanders.find(c => c.personality === 'paranoid');
if (paul) {
  const mineCount = paul.secretBuilds.filter(b => b.type === 'mine').length;
  const wallCount = paul.secretBuilds.filter(b => b.type === 'wall').length;
```

**Updated**:
```typescript
const paul = commanders.find(c => c.personality === 'paranoid');
if (paul) {
  const paulBuildings = buildingsByCommanderId.get(paul.id) || [];
  const mineCount = paulBuildings.filter(b => b.type === 'mine').length;
  const wallCount = paulBuildings.filter(b => b.type === 'wall').length;
```

Apply similar changes for:
- Larry's builds (line 344)
- Olivia's builds (line 358)
- detectAbsurdBuilds calls (line 301)

### Step 7: Update `calculateAbsurdityPercentage()` signature

**File**: `src/utils/comedyDetection.ts` (line 403)

**Current**:
```typescript
export function calculateAbsurdityPercentage(commander: Commander, command: string): number {
  const absurdities = detectAbsurdBuilds(commander, command);
```

**Updated**:
```typescript
export function calculateAbsurdityPercentage(
  commander: Commander,
  command: string,
  actualBuildings: Building[]
): number {
  const absurdities = detectAbsurdBuilds(commander, command, actualBuildings);
```

### Step 8: Update DebriefScreen.tsx calls

**File**: `src/components/DebriefScreen.tsx`

**Line 170** (inside `buildingsByCommander.map()`):
```typescript
const reaction = generateReaction(commander, stats, commanderBuildings);
```

**Line 173**:
```typescript
const absurdityPercent = calculateAbsurdityPercentage(commander, lastCommand, commanderBuildings);
```

**Line 186** (before the call):
```typescript
// Create buildings map for highlights
const buildingsMap = new Map<string, Building[]>();
buildingsByCommander.forEach(({ commander, buildings }) => {
  buildingsMap.set(commander.id, buildings);
});

const highlights = generateHighlights(commanders, lastCommand, stats, buildingsMap);
```

---

## Testing Scenarios

After implementing the fix, test these scenarios:

1. **Insufficient Wood**: Commander plans 10 towers but can only afford 3
   - Comedy system should reference 3 towers, not 10

2. **Tile Occupied**: Commander plans to build at occupied tiles
   - Comedy system should only count successful builds

3. **No Builds**: Commander has no wood left
   - Comedy system should show "built nothing" accurately

4. **All Builds Succeed**: Commander has plenty of resources
   - Comedy system should match planned builds (same as before)

---

## Why This Matters

The comedy is funnier when it's grounded in reality. If the game shows 3 mines on screen but the debrief says "Built 10 mines preparing for WW3," it breaks immersion and feels buggy rather than funny.

**After fix**: The absurdity comes from what actually happened, making the comedy more satisfying and believable.
