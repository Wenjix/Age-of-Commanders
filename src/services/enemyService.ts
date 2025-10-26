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

// NEW: Act spawn schedules for 3-act system
const ACT_SPAWN_SCHEDULES = {
  1: { turns: [1, 3, 5, 7], distribution: [2, 2, 1, 1] },      // 6 total
  2: { turns: [9, 11, 13, 15], distribution: [3, 3, 3, 3] },   // 12 total
  3: { turns: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
       distribution: [2, 2, 3, 3, 2, 3, 3, 3, 3, 2, 3, 3, 3, 3] }, // 38 total
};

export interface EnemyTurnResult {
  baseDamaged: boolean;
  enemiesMoved: number;
  enemiesKilledByMines: number; // NEW: Track mine kills separately
}

// Spawn a wave of enemies at the top of the map
export function spawnEnemyWave(waveSize: number) { // CHANGED: waveSize now required, no default
  const state = useGameStore.getState();

  // REMOVED: "Clear any existing enemies" logic - we want accumulation across acts

  for (let i = 0; i < waveSize; i++) {
    // Random x position between 5-20
    const x = Math.floor(Math.random() * 16) + 5;

    // Randomly assign target to one of the 4 base tiles
    const baseTiles: [number, number][] = [
      [state.basePosition.x, state.basePosition.y],           // [12, 12]
      [state.basePosition.x, state.basePosition.y + 1],       // [12, 13]
      [state.basePosition.x + 1, state.basePosition.y],       // [13, 12]
      [state.basePosition.x + 1, state.basePosition.y + 1],   // [13, 13]
    ];
    const randomBaseTarget = baseTiles[Math.floor(Math.random() * baseTiles.length)];

    const enemy: Enemy = {
      id: `enemy_${Date.now()}_${i}`,
      position: [x, 0], // Start at top of map
      health: 1,
      targetPosition: randomBaseTarget,
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

// NEW: Spawn enemies for a specific turn based on act schedule
export function spawnEnemiesForTurn(turn: number, act: 1 | 2 | 3): void {
  const schedule = ACT_SPAWN_SCHEDULES[act];
  const turnIndex = schedule.turns.indexOf(turn);

  if (turnIndex !== -1) {
    const waveSize = schedule.distribution[turnIndex];
    spawnEnemyWave(waveSize);
  }
}

// Process enemy movement for one turn
export async function processEnemyTurn(): Promise<EnemyTurnResult> {
  const state = useGameStore.getState();
  const result: EnemyTurnResult = {
    baseDamaged: false,
    enemiesMoved: 0,
    enemiesKilledByMines: 0, // NEW: Track mine kills
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
        result.enemiesKilledByMines++; // NEW: Increment mine kill counter

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

// Calculate where an enemy should move using greedy pathfinding
function calculateEnemyMove(enemy: Enemy): [number, number] {
  const state = useGameStore.getState();
  const [x, y] = enemy.position;

  // Step 1: Determine target (decoy or base)
  let targetPosition = enemy.targetPosition;
  const nearestDecoy = findNearestDecoy(enemy.position);

  if (nearestDecoy && Math.random() < 0.5) {
    // 50% chance to get distracted by nearest decoy
    targetPosition = nearestDecoy.position;

    // Update enemy state to reflect distraction
    state.updateEnemy(enemy.id, {
      targetPosition: nearestDecoy.position,
      isDistracted: true,
    });

    state.addTurnLogEntry({
      turn: state.currentTurn,
      type: 'enemy_distracted',
      actorId: enemy.id,
      actorName: enemy.label,
      description: `${enemy.label} is distracted by the decoy at [${nearestDecoy.position[0]}, ${nearestDecoy.position[1]}]!`,
      impact: 'low',
      emoji: '🤔',
    });
  } else if (enemy.isDistracted) {
    // Reset to base target if was previously distracted
    const baseTiles: [number, number][] = [
      [state.basePosition.x, state.basePosition.y],
      [state.basePosition.x, state.basePosition.y + 1],
      [state.basePosition.x + 1, state.basePosition.y],
      [state.basePosition.x + 1, state.basePosition.y + 1],
    ];
    // Find closest base tile to maintain original target assignment
    let closestBaseTile = baseTiles[0];
    let minDist = calculateDistance(enemy.position, baseTiles[0]);
    for (const tile of baseTiles) {
      const dist = calculateDistance(enemy.position, tile);
      if (dist < minDist) {
        minDist = dist;
        closestBaseTile = tile;
      }
    }
    targetPosition = closestBaseTile;

    state.updateEnemy(enemy.id, {
      targetPosition: closestBaseTile,
      isDistracted: false,
    });
  }

  // Step 2: Evaluate all 4 adjacent tiles using greedy pathfinding
  const adjacentTiles: [number, number][] = [
    [x, y - 1], // Up
    [x, y + 1], // Down
    [x - 1, y], // Left
    [x + 1, y], // Right
  ];

  let bestMove: [number, number] = [x, y]; // Default: stay in place
  let bestDistance = Infinity;

  for (const [nx, ny] of adjacentTiles) {
    // Check if tile is out of bounds
    if (nx < 0 || nx >= 26 || ny < 0 || ny >= 26) continue;

    // Check if tile is blocked by wall or tower
    const wall = getWallAtPosition([nx, ny]);
    const tower = getTowerAtPosition([nx, ny]);
    if (wall || tower) continue;

    // Calculate distance to target
    const distance = calculateDistance([nx, ny], targetPosition);

    // Choose tile with minimum distance
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMove = [nx, ny];
    }
  }

  return bestMove;
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

// Get tower at position
function getTowerAtPosition(position: [number, number]): Building | null {
  const state = useGameStore.getState();
  return state.buildings.find(
    b => b.position[0] === position[0] &&
        b.position[1] === position[1] &&
        b.type === 'tower' &&
        b.revealed
  ) || null;
}

// Calculate Euclidean distance between two positions
function calculateDistance(pos1: [number, number], pos2: [number, number]): number {
  const dx = pos2[0] - pos1[0];
  const dy = pos2[1] - pos1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// Find nearest decoy to enemy position
function findNearestDecoy(enemyPos: [number, number]): Building | null {
  const state = useGameStore.getState();
  const decoys = state.buildings.filter(b => b.type === 'decoy' && b.revealed);
  
  if (decoys.length === 0) return null;
  
  let nearestDecoy: Building | null = null;
  let minDistance = Infinity;
  
  for (const decoy of decoys) {
    const distance = calculateDistance(enemyPos, decoy.position);
    if (distance < minDistance) {
      minDistance = distance;
      nearestDecoy = decoy;
    }
  }
  
  return nearestDecoy;
}

// REMOVED: spawnInitialWave() - replaced by spawnEnemiesForTurn() in turn loop