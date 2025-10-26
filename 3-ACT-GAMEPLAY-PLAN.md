# 3-Act Gameplay Loop Implementation Plan (REVISED)

## Overview
Transform the current 10-turn game into a 24-turn, 3-act structure with intermissions for re-teaching commanders.

**⚠️ CRITICAL FIXES**: This revision addresses auto-advance pause/resume, data model conflicts, early-victory removal, spawn bootstrap, tracking signatures, base-proximity derivation, bonus flag resets, and resume flow.

---

## Phase 1: State Management Foundation

### File: `src/store/useGameStore.ts`

**1.1 Extend Commander interface (REVISED):**
```typescript
interface Commander {
  // ... existing fields
  secretBuilds: Building[];  // KEEP THIS - used by comedyDetection.ts and existing code
  currentActionIndex: number; // KEEP THIS

  // NEW: Act-specific build queues
  act1Builds: Building[];
  act2Builds: Building[];
  act3Builds: Building[];

  // NEW: Track action index per act (so we don't reset wrongly)
  act1ActionIndex: number;
  act2ActionIndex: number;
  act3ActionIndex: number;

  lastCommand?: string;  // Track previous command for context
}
```

**Migration Strategy:**
- Keep `secretBuilds` for backward compatibility with comedy detection
- When Act 1 begins, copy `act1Builds` → `secretBuilds` and use `act1ActionIndex`
- When Act 2 begins, copy `act2Builds` → `secretBuilds` and switch to `act2ActionIndex`
- When Act 3 begins, copy `act3Builds` → `secretBuilds` and switch to `act3ActionIndex`

**1.2 Add game state fields (REVISED):**
```typescript
interface GameState {
  // ... existing fields
  currentAct: 1 | 2 | 3;
  isIntermission: boolean;

  // Bonus tracking
  act1Bonus: number;
  act2Bonus: number;
  act2BaseNeverThreatened: boolean; // Track if enemy ever adjacent to base in Act 2

  // Statistics per act (indices 0=Act1, 1=Act2, 2=Act3)
  enemiesKilledPerAct: [number, number, number];
  woodSpentPerAct: [number, number, number];

  // Actions
  setCurrentAct: (act: 1 | 2 | 3) => void;
  setIsIntermission: (value: boolean) => void;
  recordEnemyKills: (act: number, count: number) => void; // CHANGED: accepts count
  recordWoodSpent: (act: number, amount: number) => void;
  checkBaseProximity: () => void; // Check if enemy adjacent to base
  calculateAct1Bonus: () => number;
  calculateAct2Bonus: () => number;
  resetAct2BonusFlag: () => void; // NEW: reset flag when Act 2 begins

  // NEW: Act switching helper
  switchToAct: (act: 1 | 2 | 3) => void; // Copies act builds to secretBuilds
}
```

**1.3 Update initial values:**
- Change `wood: 50` → `wood: 40`
- Change `maxTurns: 10` → `maxTurns: 24`
- Initialize commanders with:
  ```typescript
  act1Builds: [],
  act2Builds: [],
  act3Builds: [],
  act1ActionIndex: 0,
  act2ActionIndex: 0,
  act3ActionIndex: 0,
  ```
- Initialize state with:
  ```typescript
  currentAct: 1,
  isIntermission: false,
  act1Bonus: 0,
  act2Bonus: 0,
  act2BaseNeverThreatened: true, // Start true, flip false if threatened
  enemiesKilledPerAct: [0, 0, 0],
  woodSpentPerAct: [0, 0, 0],
  ```

**1.4 Implement resetGame() updates:**
```typescript
resetGame: () => {
  set({
    // ... existing resets
    currentAct: 1,
    isIntermission: false,
    act1Bonus: 0,
    act2Bonus: 0,
    act2BaseNeverThreatened: true, // RESET to true
    enemiesKilledPerAct: [0, 0, 0],
    woodSpentPerAct: [0, 0, 0],
    commanders: initialCommanders.map(c => ({
      ...c,
      act1Builds: [],
      act2Builds: [],
      act3Builds: [],
      act1ActionIndex: 0,
      act2ActionIndex: 0,
      act3ActionIndex: 0,
    })),
  });
}
```

**1.5 Implement switchToAct() helper (NEW):**
```typescript
switchToAct: (act: 1 | 2 | 3) => {
  set((state) => ({
    currentAct: act,
    commanders: state.commanders.map(c => {
      const builds = act === 1 ? c.act1Builds : act === 2 ? c.act2Builds : c.act3Builds;
      const actionIndex = act === 1 ? c.act1ActionIndex : act === 2 ? c.act2ActionIndex : c.act3ActionIndex;

      return {
        ...c,
        secretBuilds: builds,  // Copy to secretBuilds for compatibility
        currentActionIndex: actionIndex,
      };
    }),
  }));

  // Reset Act 2 bonus flag when Act 2 begins
  if (act === 2) {
    set({ act2BaseNeverThreatened: true });
  }
}
```

---

## Phase 2: Enemy Spawn System

### File: `src/services/enemyService.ts`

**2.1 Create spawn schedules:**
```typescript
const ACT_SPAWN_SCHEDULES = {
  1: { turns: [1, 3, 5, 7], distribution: [2, 2, 1, 1] },      // 6 total
  2: { turns: [9, 11, 13, 15], distribution: [3, 3, 3, 3] },   // 12 total
  3: { turns: [17, 18, 19, 20, 21, 22, 23], distribution: [3, 3, 2, 3, 2, 3, 2] }, // 18 total
};
```

**2.2 Modify `spawnEnemyWave()` (REVISED):**
```typescript
export function spawnEnemyWave(waveSize: number) {  // Make waveSize required, remove default
  const state = useGameStore.getState();

  // REMOVED: "Clear any existing enemies" logic - we want accumulation

  for (let i = 0; i < waveSize; i++) {
    // Random x position between 5-20
    const x = Math.floor(Math.random() * 16) + 5;
    const enemy: Enemy = {
      id: `enemy_${Date.now()}_${i}`,
      position: [x, 0], // Start at top of map
      health: 1,
      targetPosition: [state.basePosition.x + 1, state.basePosition.y + 1], // Center of base
      isDistracted: false,
      label: ENEMY_LABELS[Math.floor(Math.random() * ENEMY_LABELS.length)],
    };

    state.spawnEnemy(enemy);

    // Log spawn
    state.addTurnLogEntry({
      turn: state.currentTurn,
      type: 'enemy_spawn',
      actorId: enemy.id,
      actorName: enemy.label,
      position: enemy.position,
      description: `${enemy.label} appeared at the northern border!`,
      impact: 'low',
      emoji: '👹',
    });
  }
}
```

**2.3 Add new function:**
```typescript
export function spawnEnemiesForTurn(turn: number, act: 1 | 2 | 3): void {
  const schedule = ACT_SPAWN_SCHEDULES[act];
  const turnIndex = schedule.turns.indexOf(turn);

  if (turnIndex !== -1) {
    const waveSize = schedule.distribution[turnIndex];
    spawnEnemyWave(waveSize);
  }
}
```

**2.4 REMOVE `spawnInitialWave()` function:**
- Delete the entire function (lines 244-254 in current code)
- This function is replaced by `spawnEnemiesForTurn()`

---

## Phase 3: Turn Manager Enhancements

### File: `src/services/turnManager.ts`

**3.1 Modify `processTurn()` (HEAVILY REVISED):**

```typescript
export async function processTurn(): Promise<TurnResult> {
  const state = useGameStore.getState();

  // CRITICAL: Check if we're in intermission - if so, bail out
  if (state.isIntermission) {
    console.log('[processTurn] In intermission, skipping turn processing');
    return {
      enemiesKilled: 0,
      buildingsPlaced: 0,
      baseDamaged: false,
      gameOver: false,
      victory: false,
    };
  }

  const result: TurnResult = {
    enemiesKilled: 0,
    buildingsPlaced: 0,
    baseDamaged: false,
    gameOver: false,
    victory: false,
  };

  // Increment turn
  state.nextTurn();
  const currentTurn = state.currentTurn;

  // Log turn start
  state.addTurnLogEntry({
    turn: currentTurn,
    type: 'enemy_move',
    description: `Turn ${currentTurn} begins!`,
    impact: 'low',
  });

  // CRITICAL: Spawn enemies for this turn (replaces spawnInitialWave)
  spawnEnemiesForTurn(currentTurn, state.currentAct);

  // Phase 1: Enemy Movement
  const enemyResult = await processEnemyTurn();
  result.baseDamaged = enemyResult.baseDamaged;

  // Check base proximity for Act 2 bonus
  state.checkBaseProximity();

  // Check for defeat
  if (state.baseHealth <= 0) {
    result.gameOver = true;
    result.victory = false;
    stopAutoAdvance(); // CRITICAL: Stop auto-advance on defeat
    return result;
  }

  // Phase 2: Commander Building
  await processCommanderBuilds(currentTurn);

  // Phase 3: Combat Resolution
  const combatResult = await processCombatPhase();
  result.enemiesKilled = combatResult.enemiesKilled;

  // CRITICAL: Track enemy kills with count
  if (result.enemiesKilled > 0) {
    state.recordEnemyKills(state.currentAct, result.enemiesKilled);
  }

  // REMOVED: Early victory condition (all enemies defeated)
  // Game always runs to turn 24 or defeat

  // Check for intermission after turn 8 or 16
  if (currentTurn === 8 || currentTurn === 16) {
    const bonus = currentTurn === 8
      ? state.calculateAct1Bonus()
      : state.calculateAct2Bonus();

    if (bonus > 0) {
      state.addWood(bonus);
      state.addTurnLogEntry({
        turn: currentTurn,
        type: 'building_placed', // Reuse existing type
        description: `Act ${state.currentAct} bonus: +${bonus} wood! Total: ${state.wood + bonus} wood`,
        impact: 'high',
        emoji: '🎁',
      });
    }

    state.setIsIntermission(true);
    stopAutoAdvance(); // CRITICAL: Stop auto-advance when entering intermission

    return result; // Pause execution
  }

  // Check if we've reached max turns (turn 24)
  if (currentTurn >= state.maxTurns) {
    result.gameOver = true;
    result.victory = state.baseHealth > 0;
    state.setPhase('debrief');
    stopAutoAdvance(); // CRITICAL: Stop auto-advance

    state.addTurnLogEntry({
      turn: currentTurn,
      type: 'victory',
      description: result.victory
        ? `Survived all 24 turns! Strategic Victory!`
        : `Defeat on turn ${currentTurn}`,
      impact: 'high',
      emoji: result.victory ? '🏆' : '💀',
    });
  }

  return result;
}
```

**3.2 Modify `processCommanderBuilds()` (REVISED):**

```typescript
async function processCommanderBuilds(turn: number): Promise<number> {
  const state = useGameStore.getState();
  let buildingsPlaced = 0;

  for (const commander of state.commanders) {
    // REVISED: Use currentActionIndex which is synced with the current act
    // (via switchToAct which copies act-specific builds to secretBuilds)
    if (!commander.secretBuilds || commander.currentActionIndex >= commander.secretBuilds.length) {
      continue;
    }

    const building = commander.secretBuilds[commander.currentActionIndex];
    const cost = BUILDING_COSTS[building.type];

    // Show commander thought bubble
    state.addCommanderThought({
      commanderId: commander.id,
      text: getCommanderBuildThought(commander.personality, building, true),
      type: 'building',
      duration: 3000,
    });

    // Check if we can afford it
    if (state.wood >= cost) {
      // Check if tile is occupied
      if (!state.isTileOccupied(building.position[0], building.position[1])) {
        // Place the building
        const success = state.placeBuilding({
          ...building,
          revealed: true, // Buildings are revealed immediately during execution
        });

        if (success) {
          state.deductWood(cost);

          // CRITICAL: Track wood spent
          state.recordWoodSpent(state.currentAct, cost);

          buildingsPlaced++;

          // Log the successful build
          state.addTurnLogEntry({
            turn,
            type: 'building_placed',
            actorId: commander.id,
            actorName: commander.name,
            position: building.position,
            description: `${commander.name} built a ${building.type} at [${building.position[0]}, ${building.position[1]}]`,
            impact: 'medium',
            emoji: '🔨',
          });

          // Update success thought
          setTimeout(() => {
            state.addCommanderThought({
              commanderId: commander.id,
              text: getCommanderBuildThought(commander.personality, building, true, true),
              type: 'success',
              duration: 2000,
            });
          }, 1500);
        } else {
          handleBuildFailure(commander, building, turn, 'occupied');
        }
      } else {
        handleBuildFailure(commander, building, turn, 'occupied');
      }
    } else {
      handleBuildFailure(commander, building, turn, 'no_wood');
    }

    // Move to next build in queue
    state.updateCommanderActionIndex(commander.id, commander.currentActionIndex + 1);

    // Small delay between commander actions for visual clarity
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return buildingsPlaced;
}
```

**3.3 Modify `startAutoAdvance()` (CRITICAL REVISION):**

```typescript
export function startAutoAdvance() {
  const state = useGameStore.getState();

  if (turnInterval) {
    clearInterval(turnInterval);
  }

  turnInterval = setInterval(async () => {
    const currentState = useGameStore.getState();

    // CRITICAL: Check intermission flag
    if (
      currentState.phase !== 'execute' ||
      currentState.isPaused ||
      currentState.isIntermission ||  // NEW: Stop if in intermission
      currentState.currentTurn >= currentState.maxTurns
    ) {
      stopAutoAdvance();
      return;
    }

    const result = await processTurn();

    if (result.gameOver) {
      stopAutoAdvance();
    }
  }, state.turnSpeed);
}
```

**3.4 Modify `skipToEnd()` (CRITICAL REVISION):**

```typescript
export async function skipToEnd() {
  const state = useGameStore.getState();
  state.pauseGame();

  while (state.currentTurn < state.maxTurns && !state.isIntermission) {  // NEW: Stop at intermission
    const result = await processTurn();
    if (result.gameOver || state.isIntermission) break;  // NEW: Break on intermission
  }
}
```

**3.5 Add `resumeFromIntermission()` (CRITICAL REVISION):**

```typescript
export function resumeFromIntermission(): void {
  const state = useGameStore.getState();

  // Advance to next act
  const nextAct = state.currentTurn === 8 ? 2 : 3;
  state.switchToAct(nextAct);  // This copies act builds to secretBuilds and resets Act 2 flag

  // Clear intermission flag
  state.setIsIntermission(false);

  // CRITICAL: Restart auto-advance
  startAutoAdvance();

  // CRITICAL: Process the next turn immediately to keep momentum
  setTimeout(() => {
    processTurn();
  }, 500);
}
```

---

## Phase 4: LLM Service for Intermissions

### File: `src/services/llmService.ts`

**4.1 Add context-aware interpretation:**
```typescript
export async function interpretCommandWithContext(
  newCommand: string,
  lastCommand: string | undefined,
  personality: Personality,
  gameState: { wood: number; enemiesKilled: number; act: number },
  apiKey: string | null
): Promise<string> {
  // Check cache first (include context in cache key)
  const cacheKey = `${CACHE_PREFIX}${personality}_act${gameState.act}_${newCommand}_${lastCommand}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  if (!apiKey) {
    return FALLBACK_RESPONSES[personality];
  }

  const contextPrompt = `
Previous command: ${lastCommand || 'None'}
New command: ${newCommand}
Current state: Act ${gameState.act}, ${gameState.wood} wood, ${gameState.enemiesKilled} enemies defeated

${PERSONALITY_PROMPTS[personality]}

Interpret the NEW command considering your personality and the current state.`;

  return currentLimit(async () => {
    try {
      const interpretation = await callGeminiAPI(apiKey, contextPrompt, newCommand);
      localStorage.setItem(cacheKey, interpretation);
      return interpretation;
    } catch (error) {
      console.error(`Failed to get interpretation for ${personality}:`, error);
      return FALLBACK_RESPONSES[personality];
    }
  });
}
```

**4.2 Add skip/silence handler:**
```typescript
export function interpretSkipAsCommand(
  personality: Personality,
  lastCommand: string | undefined,
  gameState: { wood: number }
): Action[] {
  switch (personality) {
    case 'literalist':
      // Repeat last build if possible, else do nothing
      return lastCommand ? generateExecutionPlan(lastCommand, personality).slice(0, 1) : [];

    case 'paranoid':
      // Build defensive structures near base
      return [
        { type: 'build', building: 'wall', position: [11, 11] },
        { type: 'build', building: 'mine', position: [13, 11] },
      ];

    case 'optimist':
      // Spend on "fun" builds
      return [
        { type: 'build', building: 'decoy', position: [10, 8] },
        { type: 'build', building: 'farm', position: [14, 8] },
      ];
  }
}
```

**4.3 Add silence thought messages:**
```typescript
export function getSkipThought(personality: Personality): string {
  switch (personality) {
    case 'literalist':
      return 'No new instructions. Continue original plan.';
    case 'paranoid':
      return "They've gone silent… it's a trap. Assume worst-case.";
    case 'optimist':
      return 'They trust us to handle it! Let's get creative!';
  }
}
```

**4.4 Limit builds to 3 per commander:**
```typescript
export function generateExecutionPlan(...): Action[] {
  const plan: Action[] = [...]; // existing logic
  return plan.slice(0, 3); // Max 3 builds per act
}
```

---

## Phase 5: Intermission UI Component

### New File: `src/components/IntermissionPanel.tsx`

**5.1 Create component:**
```tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { resumeFromIntermission } from '../services/turnManager';
import {
  interpretCommandWithContext,
  interpretSkipAsCommand,
  getSkipThought,
  generateExecutionPlan
} from '../services/llmService';
import toast from 'react-hot-toast';

export const IntermissionPanel = () => {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTurn = useGameStore((state) => state.currentTurn);
  const wood = useGameStore((state) => state.wood);
  const act1Bonus = useGameStore((state) => state.act1Bonus);
  const act2Bonus = useGameStore((state) => state.act2Bonus);
  const commanders = useGameStore((state) => state.commanders);
  const apiKey = useGameStore((state) => state.apiKey);
  const enemiesKilledPerAct = useGameStore((state) => state.enemiesKilledPerAct);
  const currentAct = useGameStore((state) => state.currentAct);
  const updateCommanderInterpretation = useGameStore((state) => state.updateCommanderInterpretation);

  const bonus = currentTurn === 8 ? act1Bonus : act2Bonus;
  const nextAct = currentTurn === 8 ? 2 : 3;

  const handleSubmit = async () => {
    if (!command.trim() && !isProcessing) {
      handleSkip(); // Treat empty submit as skip
      return;
    }

    setIsProcessing(true);
    toast.loading('Commanders interpreting new orders...');

    try {
      // Call LLM for each commander with context
      const interpretations = await Promise.all(
        commanders.map(async (commander) => {
          const totalKills = enemiesKilledPerAct.reduce((a, b) => a + b, 0);
          const interpretation = await interpretCommandWithContext(
            command,
            commander.lastCommand,
            commander.personality,
            { wood, enemiesKilled: totalKills, act: nextAct },
            apiKey
          );

          return { commanderId: commander.id, interpretation };
        })
      );

      // Update interpretations and generate builds
      const actBuildsKey = nextAct === 2 ? 'act2Builds' : 'act3Builds';

      interpretations.forEach(({ commanderId, interpretation }) => {
        updateCommanderInterpretation(commanderId, interpretation);

        // Generate execution plan (max 3 builds)
        const commander = commanders.find(c => c.id === commanderId)!;
        const plan = generateExecutionPlan(interpretation, commander.personality);

        // Convert plan to buildings
        const builds = plan.map(action => ({
          position: action.position,
          type: action.building,
          ownerId: commanderId,
          revealed: false,
        }));

        // Store in appropriate act builds
        if (nextAct === 2) {
          useGameStore.getState().updateCommanderSecretBuilds(commanderId, builds);
          // Also update act2Builds specifically
          useGameStore.setState((state) => ({
            commanders: state.commanders.map(c =>
              c.id === commanderId ? { ...c, act2Builds: builds, lastCommand: command } : c
            ),
          }));
        } else {
          useGameStore.getState().updateCommanderSecretBuilds(commanderId, builds);
          useGameStore.setState((state) => ({
            commanders: state.commanders.map(c =>
              c.id === commanderId ? { ...c, act3Builds: builds, lastCommand: command } : c
            ),
          }));
        }
      });

      toast.dismiss();
      toast.success('Orders received! Resuming execution...');

      // Resume execution
      setTimeout(() => {
        resumeFromIntermission();
      }, 1000);

    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process command');
      console.error('Intermission command error:', error);
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    setIsProcessing(true);
    toast.loading('Commanders thinking independently...');

    // Generate builds using interpretSkipAsCommand()
    commanders.forEach((commander) => {
      const builds = interpretSkipAsCommand(
        commander.personality,
        commander.lastCommand,
        { wood }
      ).map(action => ({
        position: action.position,
        type: action.building,
        ownerId: commander.id,
        revealed: false,
      }));

      // Show personality-specific thought
      const thought = getSkipThought(commander.personality);
      updateCommanderInterpretation(commander.id, thought);

      // Store builds
      const actBuildsKey = nextAct === 2 ? 'act2Builds' : 'act3Builds';
      if (nextAct === 2) {
        useGameStore.setState((state) => ({
          commanders: state.commanders.map(c =>
            c.id === commander.id ? { ...c, act2Builds: builds } : c
          ),
        }));
      } else {
        useGameStore.setState((state) => ({
          commanders: state.commanders.map(c =>
            c.id === commander.id ? { ...c, act3Builds: builds } : c
          ),
        }));
      }
    });

    toast.dismiss();
    toast.success('Commanders proceeding with own judgment...');

    setTimeout(() => {
      resumeFromIntermission();
    }, 1000);
  };

  // Keyboard handler for SPACE
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isProcessing) {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isProcessing]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 max-w-2xl w-full mx-4 border-2 border-amber-500">
        <h2 className="text-3xl font-bold text-amber-400 mb-4">
          🎭 Intermission: Act {nextAct} Approaching
        </h2>

        <div className="bg-slate-700 rounded p-4 mb-6">
          <p className="text-lg text-green-400 font-semibold">
            Act {currentAct} Bonus: {bonus > 0 ? `+${bonus} wood` : 'None'}
          </p>
          <p className="text-lg text-blue-400">
            Current Wood: {wood}
          </p>
          <p className="text-sm text-slate-300 mt-2">
            Total Enemies Defeated: {enemiesKilledPerAct.reduce((a, b) => a + b, 0)}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Give your commanders new orders for Act {nextAct}:
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isProcessing) {
                handleSubmit();
              }
            }}
            placeholder="e.g., 'Build more defenses' or 'Focus on farms'"
            className="w-full px-4 py-3 bg-slate-700 text-white rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
            disabled={isProcessing}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white font-semibold rounded transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Submit Command'}
          </button>

          <button
            onClick={handleSkip}
            disabled={isProcessing}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-500 text-white font-semibold rounded transition-colors"
          >
            Skip (SPACE)
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Skipping will let commanders decide their own actions based on their personalities
        </p>
      </div>
    </div>
  );
};
```

---

## Phase 6: UI Updates

### File: `src/components/TopBar.tsx`

**6.1 Update turn display:**
```tsx
const currentAct = useGameStore((state) => state.currentAct);
const currentTurn = useGameStore((state) => state.currentTurn);

// In the render:
<div className="turn-info">
  <span className="text-amber-400 font-bold">Act {currentAct}/3</span>
  <span className="text-slate-300">Turn {currentTurn}/24</span>
</div>
```

### File: `src/components/ExecutionController.tsx` (HEAVILY REVISED)

**6.2 Replace entire file content:**

```tsx
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import toast from 'react-hot-toast';
import { stopAutoAdvance } from '../services/turnManager';
import { IntermissionPanel } from './IntermissionPanel';

export const ExecutionController = () => {
  const phase = useGameStore((state) => state.phase);
  const setPhase = useGameStore((state) => state.setPhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const maxTurns = useGameStore((state) => state.maxTurns);
  const baseHealth = useGameStore((state) => state.baseHealth);
  const isIntermission = useGameStore((state) => state.isIntermission);
  const clearTurnLog = useGameStore((state) => state.clearTurnLog);
  const setCurrentTurn = useGameStore((state) => state.setCurrentTurn);
  const switchToAct = useGameStore((state) => state.switchToAct);

  const [executionStarted, setExecutionStarted] = useState(false);

  useEffect(() => {
    if (phase !== 'execute' || executionStarted) return;

    setExecutionStarted(true);

    // Reset turn system for new execution
    clearTurnLog();
    setCurrentTurn(0);

    // CRITICAL: Initialize Act 1
    switchToAct(1);

    // REMOVED: spawnInitialWave() call - now handled by processTurn()

    toast.success('Execution phase started! Prepare for battle...', {
      duration: 3000,
      icon: '⚔️'
    });

  }, [phase, executionStarted, clearTurnLog, setCurrentTurn, switchToAct]);

  // Monitor for defeat condition (REVISED - removed early victory)
  useEffect(() => {
    if (phase !== 'execute' || isIntermission) return;

    // Check defeat condition
    if (baseHealth <= 0) {
      stopAutoAdvance();
      toast.error('Base destroyed! Glory in defeat!', {
        duration: 5000,
        icon: '💀'
      });
      setTimeout(() => {
        setPhase('debrief');
      }, 2000);
    }

    // REMOVED: Early victory check (all enemies defeated)
    // REMOVED: Max turns check (handled in processTurn now)

  }, [phase, baseHealth, isIntermission, currentTurn, maxTurns, setPhase]);

  // Reset execution started when phase changes away from execute
  useEffect(() => {
    if (phase !== 'execute') {
      setExecutionStarted(false);
      stopAutoAdvance();
    }
  }, [phase]);

  // Render intermission panel if in intermission
  if (phase === 'execute' && isIntermission) {
    return <IntermissionPanel />;
  }

  return null;
};
```

---

## Phase 7: Bonus Calculation Logic

### File: `src/store/useGameStore.ts`

**7.1 Implement recordEnemyKills (REVISED):**
```typescript
recordEnemyKills: (act: number, count: number) => {
  set((state) => {
    const newKills = [...state.enemiesKilledPerAct];
    newKills[act - 1] += count; // act is 1-indexed, array is 0-indexed
    return { enemiesKilledPerAct: newKills as [number, number, number] };
  });
}
```

**7.2 Implement recordWoodSpent:**
```typescript
recordWoodSpent: (act: number, amount: number) => {
  set((state) => {
    const newSpent = [...state.woodSpentPerAct];
    newSpent[act - 1] += amount;
    return { woodSpentPerAct: newSpent as [number, number, number] };
  });
}
```

**7.3 Act 1 Bonus (≥2 enemies killed):**
```typescript
calculateAct1Bonus: () => {
  const state = get();
  const killed = state.enemiesKilledPerAct[0];
  const bonus = killed >= 2 ? 10 : 0;
  set({ act1Bonus: bonus });
  return bonus;
}
```

**7.4 Act 2 Bonus (base never threatened) - REVISED:**
```typescript
checkBaseProximity: () => {
  const state = get();
  if (state.currentAct !== 2) return; // Only check during Act 2

  // CRITICAL: Derive from basePosition instead of hard-coding
  const { basePosition } = state;
  const baseAdjacentPositions: [number, number][] = [];

  // Generate 12 surrounding tiles around 2x2 base
  for (let x = basePosition.x - 1; x <= basePosition.x + 2; x++) {
    for (let y = basePosition.y - 1; y <= basePosition.y + 2; y++) {
      // Skip the 4 tiles that ARE the base
      if (x >= basePosition.x && x < basePosition.x + 2 &&
          y >= basePosition.y && y < basePosition.y + 2) {
        continue;
      }
      baseAdjacentPositions.push([x, y]);
    }
  }

  const enemyThreatening = state.enemies.some(enemy =>
    baseAdjacentPositions.some(([x, y]) =>
      enemy.position[0] === x && enemy.position[1] === y
    )
  );

  if (enemyThreatening) {
    set({ act2BaseNeverThreatened: false });
  }
}

calculateAct2Bonus: () => {
  const state = get();
  const bonus = state.act2BaseNeverThreatened ? 15 : 0;
  set({ act2Bonus: bonus });
  return bonus;
}

resetAct2BonusFlag: () => {
  set({ act2BaseNeverThreatened: true });
}
```

---

## Phase 8: Combat Service Updates

### File: `src/services/combatService.ts`

**8.1 Track kills in combat phase (REVISED):**

No changes needed - `processCombatPhase()` already returns `enemiesKilled` count, which is now properly tracked in `processTurn()`.

---

## Phase 9: Enemy Service Updates

### File: `src/services/enemyService.ts`

**9.1 Track mine kills (REVISED):**

Modify `processEnemyTurn()` to return kill count from mines:

```typescript
export async function processEnemyTurn(): Promise<EnemyTurnResult> {
  const state = useGameStore.getState();
  const result: EnemyTurnResult = {
    baseDamaged: false,
    enemiesMoved: 0,
    enemiesKilledByMines: 0, // NEW field
  };

  // ... existing code ...

  for (const enemy of enemies) {
    // ... existing movement code ...

    // Check for mine at new position
    const mine = getMineAtPosition(newPosition);
    if (mine) {
      // Both mine and enemy are destroyed
      state.removeBuilding(mine.position[0], mine.position[1]);
      state.removeEnemy(enemy.id);
      result.enemiesKilledByMines++; // NEW: Increment counter

      // ... existing log entry ...
    }

    // ... rest of code ...
  }

  return result;
}
```

**9.2 Update EnemyTurnResult interface:**
```typescript
export interface EnemyTurnResult {
  baseDamaged: boolean;
  enemiesMoved: number;
  enemiesKilledByMines: number; // NEW
}
```

**9.3 Track mine kills in processTurn():**

In `turnManager.ts`, update the enemy movement section:

```typescript
// Phase 1: Enemy Movement
const enemyResult = await processEnemyTurn();
result.baseDamaged = enemyResult.baseDamaged;

// Track mine kills
if (enemyResult.enemiesKilledByMines > 0) {
  state.recordEnemyKills(state.currentAct, enemyResult.enemiesKilledByMines);
}
```

---

## Phase 10: Debrief Enhancements

### File: `src/components/DebriefScreen.tsx` (to be modified)

**10.1 Display per-act stats:**
```tsx
const enemiesKilledPerAct = useGameStore((state) => state.enemiesKilledPerAct);
const woodSpentPerAct = useGameStore((state) => state.woodSpentPerAct);
const act1Bonus = useGameStore((state) => state.act1Bonus);
const act2Bonus = useGameStore((state) => state.act2Bonus);

<div className="act-breakdown grid grid-cols-3 gap-4 mt-6">
  {[1, 2, 3].map(act => (
    <div key={act} className="bg-slate-700 rounded-lg p-4">
      <h3 className="text-xl font-bold text-amber-400 mb-2">Act {act}</h3>
      <p className="text-sm text-slate-300">
        <span className="font-semibold">Enemies Killed:</span> {enemiesKilledPerAct[act - 1]}
      </p>
      <p className="text-sm text-slate-300">
        <span className="font-semibold">Wood Spent:</span> {woodSpentPerAct[act - 1]}
      </p>
      {act < 3 && (
        <p className="text-sm text-green-400 font-semibold mt-2">
          Bonus: {act === 1 ? act1Bonus : act2Bonus} wood
        </p>
      )}
    </div>
  ))}
</div>
```

**10.2 Generate title:**
```typescript
function generateTitle(
  victory: boolean,
  baseHealth: number,
  enemiesKilledPerAct: [number, number, number],
  woodSpentPerAct: [number, number, number]
): string {
  const totalKills = enemiesKilledPerAct.reduce((a, b) => a + b, 0);
  const totalSpent = woodSpentPerAct.reduce((a, b) => a + b, 0);

  if (victory) {
    if (totalKills >= 30 && totalSpent < 30) return "Tactical Genius";
    if (totalKills >= 30) return "Victorious Commander";
    if (baseHealth === 3) return "Flawless Defense";
    if (totalSpent < 20) return "Frugal Survivor";
    return "Survivor";
  } else {
    if (totalKills === 0) return "Pacifist Philosopher";
    if (totalSpent > 80) return "Overspender";
    if (baseHealth === 0 && totalKills > 20) return "Heroic Last Stand";
    return "Honorable Defeat";
  }
}
```

---

## Critical Fixes Summary

### ✅ Fixed: Intermission Never Pauses Loop
- Added `isIntermission` check to `startAutoAdvance()` interval
- Added `stopAutoAdvance()` call when entering intermission
- Modified `skipToEnd()` to break on intermission
- Added `processTurn()` early return if in intermission

### ✅ Fixed: Commander Build Queues Conflict
- Kept `secretBuilds` and `currentActionIndex` for backward compatibility
- Added act-specific build arrays (`act1Builds`, `act2Builds`, `act3Builds`)
- Added act-specific action indices
- Created `switchToAct()` helper that copies act builds to `secretBuilds`
- This maintains compatibility with `comedyDetection.ts` and existing code

### ✅ Fixed: Early-Victory Removal Incomplete
- Removed victory check from `processTurn()`
- Removed victory/max-turn checks from `ExecutionController`
- Game now always runs to turn 24 or defeat

### ✅ Fixed: Enemy Spawn Bootstrap
- Removed `spawnInitialWave()` call from `ExecutionController`
- Added `spawnEnemiesForTurn()` call in `processTurn()`
- Deleted `spawnInitialWave()` function from `enemyService.ts`

### ✅ Fixed: Kill/Wood Tracking Underspecified
- Changed `recordEnemyKill()` to `recordEnemyKills(act, count)`
- Added mine kill tracking in `processEnemyTurn()`
- Track kills from both combat and mines
- Track wood spending after successful `deductWood()`

### ✅ Fixed: Base-Proximity Check Brittle
- Derive adjacent positions from `basePosition` instead of hard-coding
- Generate 12 surrounding tiles programmatically
- Works with any base position

### ✅ Fixed: Act 2 Bonus Flag Never Resets
- Initialize `act2BaseNeverThreatened: true` in initial state
- Reset to `true` in `resetGame()`
- Reset to `true` in `switchToAct(2)` when Act 2 begins

### ✅ Fixed: Loop Resume Flow Incomplete
- `resumeFromIntermission()` calls `startAutoAdvance()`
- Immediately processes next turn after 500ms delay
- Properly switches to next act via `switchToAct()`

---

## Testing Checklist

- [ ] Game starts at 40 wood, turn 0, Act 1
- [ ] Turn 1: 2 enemies spawn at top
- [ ] Turn 3: 2 enemies spawn
- [ ] Turn 5: 1 enemy spawns
- [ ] Turn 7: 1 enemy spawns
- [ ] Intermission 1 triggers after turn 8
- [ ] Auto-advance stops during intermission
- [ ] Act 1 bonus calculated correctly (≥2 kills = +10 wood)
- [ ] Intermission panel shows bonus and current wood
- [ ] Submitting command calls LLM with context
- [ ] Skipping (SPACE) generates personality-based builds without LLM
- [ ] Skip shows personality-specific thoughts
- [ ] Resume restarts auto-advance and advances to Act 2
- [ ] Act 2 enemies spawn on turns 9, 11, 13, 15 (3 each)
- [ ] Act 2 bonus flag resets to true when Act 2 begins
- [ ] Base proximity check uses derived positions
- [ ] Act 2 bonus calculated correctly (base never threatened = +15 wood)
- [ ] Intermission 2 triggers after turn 16
- [ ] Act 3 enemies spawn every turn 17-23
- [ ] Game ends at turn 24 with debrief
- [ ] No early victory on "all enemies defeated"
- [ ] Defeat still triggers if base health reaches 0
- [ ] Per-act stats display correctly in debrief
- [ ] Title generation based on performance
- [ ] Commander builds use correct act queue (act1/act2/act3)
- [ ] `currentActionIndex` syncs correctly per act
- [ ] Mine kills tracked in enemy kill stats
- [ ] Wood spending tracked per act

---

## Implementation Order (REVISED)

1. **State Management** (Phase 1) - Foundation with all critical fixes
2. **Enemy Spawning** (Phase 2) - Remove bootstrap, add per-turn spawning
3. **Turn Manager** (Phase 3) - Intermission pause/resume, auto-advance fixes
4. **Combat/Enemy Service Updates** (Phase 8-9) - Kill tracking
5. **Intermission UI** (Phase 5) - Test with placeholder LLM logic first
6. **LLM Context** (Phase 4) - Integrate context-aware interpretations
7. **UI Updates** (Phase 6) - Polish act/turn display, ExecutionController rewrite
8. **Bonuses** (Phase 7) - Implement and test bonus calculations with derived positions
9. **Debrief** (Phase 10) - Final stats and title generation

---

## Notes

- **No early victory**: Game always runs to turn 24 or defeat
- **Intermissions are sub-states**: Phase stays 'execute', but `isIntermission` flag controls UI and pauses auto-advance
- **LLM calls only during intermissions**: Execution remains deterministic
- **Commander thought bubbles**: Show during skip and during build execution
- **Resource tracking**: Track wood spent per act for debrief statistics
- **Backward compatibility**: Keep `secretBuilds` and `currentActionIndex` for existing code
- **Auto-advance control**: Must stop when entering intermission and restart when resuming
- **Base position flexibility**: All base-related checks derive from `basePosition` state
