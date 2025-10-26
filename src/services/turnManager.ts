import { useGameStore } from '../store/useGameStore';
import { processEnemyTurn } from './enemyService';
import { processCombatPhase } from './combatService';
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

  // Phase 1: Enemy Movement
  const enemyResult = await processEnemyTurn();
  result.baseDamaged = enemyResult.baseDamaged;

  // Check for defeat
  if (state.baseHealth <= 0) {
    result.gameOver = true;
    result.victory = false;
    return result;
  }

  // Phase 2: Commander Building
  await processCommanderBuilds(currentTurn);

  // Phase 3: Combat Resolution
  const combatResult = await processCombatPhase();
  result.enemiesKilled = combatResult.enemiesKilled;

  // Check victory condition
  const remainingEnemies = useGameStore.getState().enemies.length;
  if (remainingEnemies === 0 && currentTurn >= 3) {
    // Victory if all enemies defeated after wave spawned
    state.addTurnLogEntry({
      turn: currentTurn,
      type: 'victory',
      description: 'All enemies defeated! Tactical Victory!',
      impact: 'high',
      emoji: '🎉',
    });
    result.gameOver = true;
    result.victory = true;
    state.setPhase('debrief');
  }

  // Check if we've reached max turns
  if (currentTurn >= state.maxTurns) {
    if (remainingEnemies > 0) {
      state.addTurnLogEntry({
        turn: currentTurn,
        type: 'victory',
        description: `Survived ${state.maxTurns} turns! Strategic Victory!`,
        impact: 'high',
        emoji: '🏆',
      });
    }
    result.gameOver = true;
    result.victory = state.baseHealth > 0;
    state.setPhase('debrief');
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

    if (
      currentState.phase !== 'execute' ||
      currentState.isPaused ||
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

  while (state.currentTurn < state.maxTurns) {
    const result = await processTurn();
    if (result.gameOver) break;
  }
}