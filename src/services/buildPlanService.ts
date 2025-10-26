import type { BuildingType, Commander, Building } from '../store/useGameStore';
import { BUILDING_COSTS, getFootprint, isFootprintOnGrid } from '../constants/gameConstants';

const GRID_SIZE = 26;

interface BuildPlanConfig {
  commander: Commander;
  enabledBuildings: BuildingType[];
  availableWood: number;
  basePosition: { x: number; y: number };
  existingBuildings: Building[];
}

/**
 * Generate positions based on commander personality
 */
function getPersonalityPositions(
  personality: string,
  basePosition: { x: number; y: number },
  count: number
): [number, number][] {
  const positions: [number, number][] = [];
  const baseX = basePosition.x;
  const baseY = basePosition.y;

  switch (personality) {
    case 'literalist':
      // Methodical grid around base
      for (let i = 0; i < count; i++) {
        const offset = Math.floor(i / 4) + 3;
        const side = i % 4;
        switch (side) {
          case 0: positions.push([baseX - offset, baseY]); break; // Left
          case 1: positions.push([baseX + 2 + offset, baseY]); break; // Right
          case 2: positions.push([baseX, baseY - offset]); break; // Top
          case 3: positions.push([baseX, baseY + 2 + offset]); break; // Bottom
        }
      }
      break;

    case 'paranoid':
      // Dense perimeter defense, prioritize north
      for (let i = 0; i < count; i++) {
        if (i < count / 2) {
          // North edge
          positions.push([baseX + (i % 5) - 2, Math.max(0, baseY - 5 - Math.floor(i / 5))]);
        } else {
          // Around base
          const offset = 2 + Math.floor((i - count / 2) / 4);
          const side = (i - Math.floor(count / 2)) % 4;
          switch (side) {
            case 0: positions.push([baseX - offset, baseY]); break;
            case 1: positions.push([baseX + 2 + offset, baseY]); break;
            case 2: positions.push([baseX, baseY - offset]); break;
            case 3: positions.push([baseX, baseY + 2 + offset]); break;
          }
        }
      }
      break;

    case 'optimist':
      // Random decorative placement
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 5 + Math.random() * 5;
        const x = Math.round(baseX + Math.cos(angle) * radius);
        const y = Math.round(baseY + Math.sin(angle) * radius);
        positions.push([
          Math.max(0, Math.min(GRID_SIZE - 1, x)),
          Math.max(0, Math.min(GRID_SIZE - 1, y)),
        ]);
      }
      break;

    default:
      // Fallback: circle around base
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.round(baseX + Math.cos(angle) * 4);
        const y = Math.round(baseY + Math.sin(angle) * 4);
        positions.push([x, y]);
      }
  }

  return positions.filter(
    ([x, y]) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE
  );
}

/**
 * Choose building types based on personality
 */
function chooseBuildingTypes(
  personality: string,
  enabledBuildings: BuildingType[],
  count: number
): BuildingType[] {
  const buildings: BuildingType[] = [];

  switch (personality) {
    case 'literalist':
      // Even distribution
      for (let i = 0; i < count; i++) {
        buildings.push(enabledBuildings[i % enabledBuildings.length]);
      }
      break;

    case 'paranoid': {
      // Prioritize defensive buildings (walls, towers, mines)
      const defensive = enabledBuildings.filter((b) =>
        ['wall', 'tower', 'mine'].includes(b)
      );
      const fallback = enabledBuildings;
      for (let i = 0; i < count; i++) {
        if (defensive.length > 0) {
          buildings.push(defensive[i % defensive.length]);
        } else {
          buildings.push(fallback[i % fallback.length]);
        }
      }
      break;
    }

    case 'optimist': {
      // Prioritize decorative/friendly buildings (farm, decoy)
      const friendly = enabledBuildings.filter((b) => ['farm', 'decoy'].includes(b));
      const fallbackOpt = enabledBuildings;
      for (let i = 0; i < count; i++) {
        if (friendly.length > 0) {
          buildings.push(friendly[i % friendly.length]);
        } else {
          buildings.push(fallbackOpt[i % fallbackOpt.length]);
        }
      }
      break;
    }

    default:
      for (let i = 0; i < count; i++) {
        buildings.push(enabledBuildings[i % enabledBuildings.length]);
      }
  }

  return buildings;
}

/**
 * Check if a tile is occupied
 */
function isTileOccupied(
  x: number,
  y: number,
  basePosition: { x: number; y: number },
  existingBuildings: Building[]
): boolean {
  // Check base (2x2)
  if (
    x >= basePosition.x &&
    x < basePosition.x + 2 &&
    y >= basePosition.y &&
    y < basePosition.y + 2
  ) {
    return true;
  }

  // Check if any building's footprint overlaps with this tile
  return existingBuildings.some((b) => {
    const footprint = getFootprint(b.type, b.position[0], b.position[1]);
    return footprint.some(([fx, fy]) => fx === x && fy === y);
  });
}

/**
 * Generate a secret build plan for a commander
 */
export function generateSecretBuildPlan(config: BuildPlanConfig): Building[] {
  const { commander, enabledBuildings, availableWood, basePosition, existingBuildings } = config;
  
  if (enabledBuildings.length === 0) {
    return [];
  }

  const maxBuilds = 10;
  let remainingWood = availableWood;
  const builds: Building[] = [];

  // Get potential positions
  const positions = getPersonalityPositions(
    commander.personality,
    basePosition,
    maxBuilds * 2 // Get more than we need to account for occupied tiles
  );

  // Get building types
  const buildingTypes = chooseBuildingTypes(
    commander.personality,
    enabledBuildings,
    maxBuilds
  );

  // Create builds
  for (let i = 0; i < Math.min(maxBuilds, positions.length); i++) {
    const building = buildingTypes[i];
    const cost = BUILDING_COSTS[building];
    const position = positions[i];

    // Check if we can afford it
    if (cost > remainingWood) {
      continue;
    }

    // Check if footprint is on grid
    if (!isFootprintOnGrid(building, position[0], position[1])) {
      continue;
    }

    // Check if all tiles in footprint are free
    const footprint = getFootprint(building, position[0], position[1]);
    const allBuildingsSoFar = [...existingBuildings, ...builds];
    const isBlocked = footprint.some(([fx, fy]) =>
      isTileOccupied(fx, fy, basePosition, allBuildingsSoFar)
    );

    if (isBlocked) {
      continue;
    }

    // Add the build
    builds.push({
      position,
      type: building,
      ownerId: commander.id,
      revealed: false,
    });

    remainingWood -= cost;
  }

  return builds;
}

/**
 * Generate build plans for all commanders with shared wood budget
 */
export function generateAllBuildPlans(
  commanders: Commander[],
  enabledBuildings: BuildingType[],
  totalWood: number,
  basePosition: { x: number; y: number },
  existingBuildings: Building[]
): Map<string, Building[]> {
  const plans = new Map<string, Building[]>();
  let remainingWood = totalWood;
  const allBuilds: Building[] = [...existingBuildings];

  // Distribute wood roughly equally
  const woodPerCommander = Math.floor(totalWood / commanders.length);

  for (const commander of commanders) {
    const plan = generateSecretBuildPlan({
      commander,
      enabledBuildings,
      availableWood: Math.min(woodPerCommander, remainingWood),
      basePosition,
      existingBuildings: allBuilds,
    });

    // Calculate actual wood used
    const woodUsed = plan.reduce((sum, b) => sum + BUILDING_COSTS[b.type], 0);
    remainingWood -= woodUsed;

    // Add to all builds to avoid overlaps
    allBuilds.push(...plan);

    plans.set(commander.id, plan);
  }

  return plans;
}

