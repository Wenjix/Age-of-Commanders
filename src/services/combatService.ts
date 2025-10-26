import { useGameStore } from '../store/useGameStore';
import type { Building, Enemy } from '../store/useGameStore';

export interface CombatResult {
  enemiesKilled: number;
  towersActivated: number;
}

// Process combat phase (towers attacking enemies)
export async function processCombatPhase(): Promise<CombatResult> {
  const state = useGameStore.getState();
  const result: CombatResult = {
    enemiesKilled: 0,
    towersActivated: 0,
  };

  // Get all active towers
  const towers = state.buildings.filter(b => b.type === 'tower' && b.revealed);

  // Process each tower
  for (const tower of towers) {
    const enemiesInRange = findEnemiesInRange(tower.position, 2);

    if (enemiesInRange.length > 0) {
      // Tower targets the closest enemy
      const target = enemiesInRange[0];

      // Mark enemy for death (will be destroyed next turn)
      if (!target.markedForDeath) {
        state.updateEnemy(target.id, { markedForDeath: true });
        result.towersActivated++;

        // Log tower attack
        state.addTurnLogEntry({
          turn: state.currentTurn,
          type: 'tower_attack',
          actorId: tower.ownerId,
          targetId: target.id,
          targetName: target.label,
          position: tower.position,
          description: `Tower fires at ${target.label}! (will destroy next turn)`,
          impact: 'medium',
          emoji: '🎯',
        });

        // Visual feedback delay
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }

  // Remove enemies marked for death from previous turn
  const markedEnemies = state.enemies.filter(e => e.markedForDeath);
  for (const enemy of markedEnemies) {
    state.removeEnemy(enemy.id);
    result.enemiesKilled++;

    state.addTurnLogEntry({
      turn: state.currentTurn,
      type: 'enemy_destroyed',
      targetId: enemy.id,
      targetName: enemy.label,
      description: `${enemy.label} was destroyed by tower fire!`,
      impact: 'medium',
      emoji: '💀',
    });
  }

  return result;
}

// Find enemies within range of a position
function findEnemiesInRange(position: [number, number], range: number): Enemy[] {
  const state = useGameStore.getState();
  const [x, y] = position;

  const enemiesInRange = state.enemies
    .filter(enemy => {
      const [ex, ey] = enemy.position;
      const distance = Math.sqrt(Math.pow(ex - x, 2) + Math.pow(ey - y, 2));
      return distance <= range && !enemy.markedForDeath;
    })
    .sort((a, b) => {
      // Sort by distance (closest first)
      const [ax, ay] = a.position;
      const [bx, by] = b.position;
      const distA = Math.sqrt(Math.pow(ax - x, 2) + Math.pow(ay - y, 2));
      const distB = Math.sqrt(Math.pow(bx - x, 2) + Math.pow(by - y, 2));
      return distA - distB;
    });

  return enemiesInRange;
}

// Check if a tower can attack any enemies
export function canTowerAttack(towerPosition: [number, number]): boolean {
  return findEnemiesInRange(towerPosition, 2).length > 0;
}

// Get tower range tiles for visualization
export function getTowerRangeTiles(position: [number, number], range: number): [number, number][] {
  const tiles: [number, number][] = [];
  const [x, y] = position;

  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (dx === 0 && dy === 0) continue;

      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= range) {
        const tileX = x + dx;
        const tileY = y + dy;

        // Check bounds (26x26 grid)
        if (tileX >= 0 && tileX < 26 && tileY >= 0 && tileY < 26) {
          tiles.push([tileX, tileY]);
        }
      }
    }
  }

  return tiles;
}

// Process farm production (generates wood each turn)
export function processFarmProduction() {
  const state = useGameStore.getState();
  const farms = state.buildings.filter(b => b.type === 'farm' && b.revealed);

  const woodGenerated = farms.length * 2; // Each farm generates 2 wood per turn

  if (woodGenerated > 0) {
    state.addWood(woodGenerated);

    state.addTurnLogEntry({
      turn: state.currentTurn,
      type: 'building_placed', // Using existing type
      description: `Farms generated ${woodGenerated} wood!`,
      impact: 'low',
      emoji: '🌾',
    });
  }
}