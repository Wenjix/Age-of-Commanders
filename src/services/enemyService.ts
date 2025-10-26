import { useGameStore } from '../store/useGameStore';
import type { Enemy, Building } from '../store/useGameStore';

const ENEMY_LABELS = [
  'Confused Invader',
  'Polite Raider',
  'Suspicious Scout',
  'Lost Tourist',
  'Reluctant Warrior',
  'Overeager Recruit',
  'Misguided Merchant',
  'Wayward Wanderer',
  'Baffled Bandit',
  'Friendly Foe',
];

export interface EnemyTurnResult {
  baseDamaged: boolean;
  enemiesMoved: number;
}

// Spawn a wave of enemies at the top of the map
export function spawnEnemyWave(waveSize: number = 10) {
  const state = useGameStore.getState();

  // Clear any existing enemies
  state.enemies.forEach(enemy => state.removeEnemy(enemy.id));

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

// Process enemy movement for one turn
export async function processEnemyTurn(): Promise<EnemyTurnResult> {
  const state = useGameStore.getState();
  const result: EnemyTurnResult = {
    baseDamaged: false,
    enemiesMoved: 0,
  };

  // Copy enemies array to avoid mutation during iteration
  const enemies = [...state.enemies];

  for (const enemy of enemies) {
    // Skip if enemy is marked for death (will be handled in combat phase)
    if (enemy.markedForDeath) continue;

    const newPosition = calculateEnemyMove(enemy);

    // Check if enemy reached the base
    if (isPositionOnBase(newPosition)) {
      // Enemy damages base and is removed
      state.damageBase();
      state.removeEnemy(enemy.id);
      result.baseDamaged = true;

      state.addTurnLogEntry({
        turn: state.currentTurn,
        type: 'base_damaged',
        actorId: enemy.id,
        actorName: enemy.label,
        description: `${enemy.label} reached the base and dealt damage!`,
        impact: 'high',
        emoji: '💥',
      });
    } else {
      // Move the enemy
      state.updateEnemy(enemy.id, { position: newPosition });
      result.enemiesMoved++;

      // Check for mine at new position
      const mine = getMineAtPosition(newPosition);
      if (mine) {
        // Both mine and enemy are destroyed
        state.removeBuilding(mine.position[0], mine.position[1]);
        state.removeEnemy(enemy.id);

        state.addTurnLogEntry({
          turn: state.currentTurn,
          type: 'mine_explosion',
          actorId: enemy.id,
          actorName: enemy.label,
          position: newPosition,
          description: `${enemy.label} stepped on a mine! BOOM! 💥`,
          impact: 'medium',
          emoji: '💥',
        });
      }
    }

    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return result;
}

// Calculate where an enemy should move
function calculateEnemyMove(enemy: Enemy): [number, number] {
  const state = useGameStore.getState();
  const [x, y] = enemy.position;

  // Check for adjacent decoy buildings
  const adjacentDecoy = findAdjacentDecoy(enemy.position);

  if (adjacentDecoy && Math.random() < 0.5) {
    // 50% chance to move toward decoy
    const [decoyX, decoyY] = adjacentDecoy.position;

    state.addTurnLogEntry({
      turn: state.currentTurn,
      type: 'enemy_distracted',
      actorId: enemy.id,
      actorName: enemy.label,
      description: `${enemy.label} is distracted by the decoy!`,
      impact: 'low',
      emoji: '🤔',
    });

    // Move toward decoy
    if (Math.abs(decoyX - x) > Math.abs(decoyY - y)) {
      return [x + Math.sign(decoyX - x), y];
    } else {
      return [x, y + Math.sign(decoyY - y)];
    }
  }

  // Default: move down (toward base)
  const newY = y + 1;

  // Check if path is blocked by wall
  const wall = getWallAtPosition([x, newY]);
  if (wall) {
    // Try to move around the wall
    const leftClear = !getWallAtPosition([x - 1, y]);
    const rightClear = !getWallAtPosition([x + 1, y]);

    if (leftClear && rightClear) {
      // Choose random direction
      return Math.random() < 0.5 ? [x - 1, y] : [x + 1, y];
    } else if (leftClear) {
      return [x - 1, y];
    } else if (rightClear) {
      return [x + 1, y];
    } else {
      // Stuck, don't move
      return [x, y];
    }
  }

  return [x, newY];
}

// Check if a position is on the base
function isPositionOnBase(position: [number, number]): boolean {
  const state = useGameStore.getState();
  const [x, y] = position;
  const { basePosition } = state;

  return (
    x >= basePosition.x &&
    x < basePosition.x + 2 &&
    y >= basePosition.y &&
    y < basePosition.y + 2
  );
}

// Find adjacent decoy building
function findAdjacentDecoy(position: [number, number]): Building | null {
  const state = useGameStore.getState();
  const [x, y] = position;

  // Check all adjacent tiles
  const adjacentPositions = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
    [x - 1, y - 1],
    [x + 1, y - 1],
    [x - 1, y + 1],
    [x + 1, y + 1],
  ];

  for (const pos of adjacentPositions) {
    const building = state.buildings.find(
      b => b.position[0] === pos[0] &&
          b.position[1] === pos[1] &&
          b.type === 'decoy' &&
          b.revealed
    );
    if (building) return building;
  }

  return null;
}

// Get wall at position
function getWallAtPosition(position: [number, number]): Building | null {
  const state = useGameStore.getState();
  return state.buildings.find(
    b => b.position[0] === position[0] &&
        b.position[1] === position[1] &&
        b.type === 'wall' &&
        b.revealed
  ) || null;
}

// Get mine at position
function getMineAtPosition(position: [number, number]): Building | null {
  const state = useGameStore.getState();
  return state.buildings.find(
    b => b.position[0] === position[0] &&
        b.position[1] === position[1] &&
        b.type === 'mine' &&
        b.revealed
  ) || null;
}

// Spawn initial wave (called when execution starts)
export function spawnInitialWave() {
  const state = useGameStore.getState();

  // Spawn enemies on turn 1
  if (state.currentTurn === 0) {
    setTimeout(() => {
      spawnEnemyWave(5); // Start with 5 enemies
    }, 1000);
  }
}