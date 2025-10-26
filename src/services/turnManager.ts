import { useGameStore } from '../store/useGameStore';
import { processEnemyTurn, spawnEnemiesForTurn } from './enemyService';
import { processCombatPhase, processFarmProduction } from './combatService';
import type { Building } from '../store/useGameStore';
import { BUILDING_COSTS } from '../constants/gameConstants';

export interface TurnResult {
  enemiesKilled: number;
  buildingsPlaced: number;
  baseDamaged: boolean;
  gameOver: boolean;
  victory: boolean;
}

// Process one turn of the game
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

  // Phase 0: Farm Production (resource generation)
  processFarmProduction();

  // CRITICAL: Spawn enemies for this turn (replaces spawnInitialWave)
  spawnEnemiesForTurn(currentTurn, state.currentAct);

  // Phase 1: Enemy Movement
  const enemyResult = await processEnemyTurn();
  result.baseDamaged = enemyResult.baseDamaged;

  // Track mine kills
  if (enemyResult.enemiesKilledByMines > 0) {
    state.recordEnemyKills(state.currentAct, enemyResult.enemiesKilledByMines);
  }

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
        ? `Survived all 30 turns! Strategic Victory!`
        : `Defeat on turn ${currentTurn}`,
      impact: 'high',
      emoji: result.victory ? '🏆' : '💀',
    });
  }

  return result;
}

// Process commander building phase
async function processCommanderBuilds(turn: number): Promise<number> {
  const state = useGameStore.getState();
  let buildingsPlaced = 0;

  for (const commander of state.commanders) {
    // Check if commander has builds left in their queue
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

// Handle building failure
function handleBuildFailure(
  commander: any,
  building: Building,
  turn: number,
  reason: 'no_wood' | 'occupied'
) {
  const state = useGameStore.getState();

  const failureMessage = reason === 'no_wood'
    ? `Not enough wood for ${building.type}!`
    : `Can't build at [${building.position[0]}, ${building.position[1]}] - occupied!`;

  // Show failure thought
  state.addCommanderThought({
    commanderId: commander.id,
    text: getCommanderFailureThought(commander.personality, reason),
    type: 'failure',
    duration: 3000,
  });

  // Log the failure
  state.addTurnLogEntry({
    turn,
    type: 'building_failed',
    actorId: commander.id,
    actorName: commander.name,
    position: building.position,
    description: `${commander.name} failed to build: ${failureMessage}`,
    impact: 'low',
    emoji: '❌',
  });
}

// Get commander's building thought based on personality
function getCommanderBuildThought(
  personality: string,
  building: Building,
  isBuilding: boolean,
  isSuccess: boolean = false
): string {
  if (isSuccess) {
    switch (personality) {
      case 'literalist':
        return `${building.type.toUpperCase()} PLACED.`;
      case 'paranoid':
        return `They'll never see this coming...`;
      case 'optimist':
        return `What a lovely addition!`;
      default:
        return `Built!`;
    }
  }

  if (isBuilding) {
    switch (personality) {
      case 'literalist':
        return `Building ${building.type} at [${building.position[0]},${building.position[1]}]...`;
      case 'paranoid':
        return `Fortifying the inner sanctum...`;
      case 'optimist':
        return `Creating a welcoming space...`;
      default:
        return `Building...`;
    }
  }

  return '';
}

// Get commander's failure thought based on personality
function getCommanderFailureThought(personality: string, reason: 'no_wood' | 'occupied'): string {
  if (reason === 'no_wood') {
    switch (personality) {
      case 'literalist':
        return 'INSUFFICIENT RESOURCES. ABORT.';
      case 'paranoid':
        return 'They sabotaged our supplies!';
      case 'optimist':
        return "We'll make do without it!";
      default:
        return 'Not enough wood!';
    }
  } else {
    switch (personality) {
      case 'literalist':
        return 'TILE OCCUPIED. ABORT.';
      case 'paranoid':
        return 'Someone beat us to it... suspicious...';
      case 'optimist':
        return 'This spot was meant for something else!';
      default:
        return "Can't build here!";
    }
  }
}

// Auto-advance turns
let turnInterval: NodeJS.Timeout | null = null;

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
      currentState.isIntermission  // NEW: Stop if in intermission
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

export function stopAutoAdvance() {
  if (turnInterval) {
    clearInterval(turnInterval);
    turnInterval = null;
  }
}

// Manual turn control
export async function skipToEnd() {
  const state = useGameStore.getState();
  state.pauseGame();

  while (state.currentTurn < state.maxTurns && !state.isIntermission) {  // NEW: Stop at intermission
    const result = await processTurn();
    if (result.gameOver || state.isIntermission) break;  // NEW: Break on intermission
  }
}

// NEW: Resume from intermission (called by IntermissionPanel)
export function resumeFromIntermission(): void {
  const state = useGameStore.getState();

  // Advance to next act
  const nextAct = state.currentTurn === 8 ? 2 : 3;
  state.switchToAct(nextAct as 1 | 2 | 3);  // This copies act builds to secretBuilds and resets Act 2 flag

  // Clear intermission flag
  state.setIsIntermission(false);

  // CRITICAL: Restart auto-advance
  startAutoAdvance();

  // CRITICAL: Process the next turn immediately to keep momentum
  setTimeout(() => {
    processTurn();
  }, 500);
}