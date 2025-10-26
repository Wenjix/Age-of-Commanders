import type { BuildingType } from '../store/useGameStore';

// Grid and Tile Constants
export const TILE_SIZE = 32;
export const GRID_SIZE = 26;
export const TOP_BAR_HEIGHT = 40;

// Z-Index Layers
export const Z_LAYERS = {
  TILES: 0,
  BASE: 1,
  BUILDINGS: 10,
  ENEMIES: 20,
} as const;

// Building Costs
export const BUILDING_COSTS: Record<BuildingType, number> = {
  wall: 4,
  tower: 8,
  decoy: 5,
  mine: 6,
  farm: 10,
};

// Building Dimensions (width × height in tiles)
export const BUILDING_DIMENSIONS: Record<BuildingType, { width: number; height: number }> = {
  wall: { width: 3, height: 1 },  // 3×1 horizontal
  tower: { width: 1, height: 1 },
  decoy: { width: 1, height: 1 },
  mine: { width: 1, height: 1 },
  farm: { width: 1, height: 2 },  // 1×2 vertical
};

// Building Blocking Behavior (whether building blocks enemy movement)
export const BUILDING_BLOCKS_MOVEMENT: Record<BuildingType, boolean> = {
  wall: true,
  tower: true,
  decoy: false,  // Decoy doesn't block - enemies pass through
  mine: true,
  farm: true,
};

// Building Descriptions (Old - kept for reference)
export const BUILDING_DESCRIPTIONS: Record<BuildingType, string> = {
  wall: 'Blocks enemy movement',
  tower: 'Attacks enemies in range',
  decoy: 'Distracts 50% of enemies',
  mine: 'Explodes on contact',
  farm: 'Decorative (does nothing)',
};

// Building Card Information (New - Evocative & Ambiguous)
export interface BuildingCardInfo {
  icon: string;
  tagline: string;
  flavorText: string;
  commanderQuotes: {
    larry: string;
    paul: string;
    olivia: string;
  };
}

export const BUILDING_CARDS: Record<BuildingType, BuildingCardInfo> = {
  wall: {
    icon: '🧱',
    tagline: 'A clear boundary',
    flavorText: 'Sometimes you just need to draw a line in the sand. Or dirt. Or wherever.',
    commanderQuotes: {
      larry: 'Exactly as specified.',
      paul: 'NOT ENOUGH!',
      olivia: 'Why so unfriendly?',
    },
  },
  tower: {
    icon: '🗼',
    tagline: 'Elevated perspective',
    flavorText: 'See farther, reach farther. What you do with that is up to you.',
    commanderQuotes: {
      larry: 'Functional design.',
      paul: 'Perfect vantage point!',
      olivia: 'A lighthouse for friends!',
    },
  },
  mine: {
    icon: '💣',
    tagline: 'A buried surprise',
    flavorText: 'Good things come to those who wait. Or bad things. Depends on your perspective.',
    commanderQuotes: {
      larry: 'Placed exactly where instructed.',
      paul: 'PERFECT for intruders!',
      olivia: 'Oops! Didn\'t see that coming! 😊',
    },
  },
  decoy: {
    icon: '🎯',
    tagline: 'A point of interest',
    flavorText: 'Everyone loves a landmark. Some more than others.',
    commanderQuotes: {
      larry: 'Serves its purpose.',
      paul: 'A clever diversion...',
      olivia: 'Welcome signs are so inviting!',
    },
  },
  farm: {
    icon: '🌾',
    tagline: 'For the long game',
    flavorText: 'Plant seeds today, reap rewards tomorrow. Probably. Eventually. Maybe.',
    commanderQuotes: {
      larry: 'No immediate tactical value.',
      paul: 'What if it\'s a TRAP?!',
      olivia: 'Gardens make everything better!',
    },
  },
};

// Color Palette (in hexadecimal for PixiJS)
export const COLORS = {
  // Background
  BACKGROUND: 0x1a1a1a,

  // Grass Tile
  GRASS: {
    FILL: 0x228b22,
    STROKE: 0x1a5a1a,
  },

  // Base Building
  BASE: 0xff0000,

  // Building Types
  BUILDINGS: {
    WALL: {
      FILL: 0x4b5563,
      STROKE: 0x1f2937,
    },
    TOWER: {
      FILL: 0x3b82f6,
      STROKE: 0x1e40af,
    },
    DECOY: {
      FILL: 0xfbbf24,
      STROKE: 0xf59e0b,
    },
    MINE: {
      FILL: 0xef4444,
      STROKE: 0xb91c1c,
    },
    FARM: {
      FILL: 0x22c55e,
      STROKE: 0x16a34a,
    },
    DEFAULT: {
      FILL: 0x808080,
      STROKE: 0x404040,
    },
  },

  // Enemies
  ENEMY: {
    FILL: 0x7c2d12,
    STROKE: 0x431407,
  },
} as const;

// Building Styles Configuration
export const BUILDING_STYLES: Record<BuildingType | 'default', { fill: number; stroke: number }> = {
  'wall': { fill: COLORS.BUILDINGS.WALL.FILL, stroke: COLORS.BUILDINGS.WALL.STROKE },
  'tower': { fill: COLORS.BUILDINGS.TOWER.FILL, stroke: COLORS.BUILDINGS.TOWER.STROKE },
  'decoy': { fill: COLORS.BUILDINGS.DECOY.FILL, stroke: COLORS.BUILDINGS.DECOY.STROKE },
  'mine': { fill: COLORS.BUILDINGS.MINE.FILL, stroke: COLORS.BUILDINGS.MINE.STROKE },
  'farm': { fill: COLORS.BUILDINGS.FARM.FILL, stroke: COLORS.BUILDINGS.FARM.STROKE },
  'default': { fill: COLORS.BUILDINGS.DEFAULT.FILL, stroke: COLORS.BUILDINGS.DEFAULT.STROKE },
};

// Camera Settings
export const CAMERA_SETTINGS = {
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2,
  ZOOM_FACTOR: {
    IN: 1.1,
    OUT: 0.9,
  },
} as const;

// Combat Settings
export const COMBAT_SETTINGS = {
  TOWER_RANGE: 3, // tiles
  TOWER_DAMAGE: 1,
  ENEMY_HEALTH: 1,
  ENEMY_SPEED: 0.5, // tiles per second
  DECOY_DISTRACTION_CHANCE: 0.5, // 50%
};

// Queue Item Types
export interface BuildingQueueItem {
  action: 'add' | 'remove';
  sprite?: import('pixi.js').Sprite | import('pixi.js').Container;
  key?: string;
}

/**
 * Get all tiles occupied by a building based on its type and position.
 * Position (x, y) represents the top-left tile of the building's footprint.
 *
 * @param type - Building type
 * @param x - X coordinate (top-left tile)
 * @param y - Y coordinate (top-left tile)
 * @returns Array of [x, y] coordinates for all tiles in the footprint
 */
export function getFootprint(type: BuildingType, x: number, y: number): [number, number][] {
  const { width, height } = BUILDING_DIMENSIONS[type];
  const footprint: [number, number][] = [];

  for (let dx = 0; dx < width; dx++) {
    for (let dy = 0; dy < height; dy++) {
      footprint.push([x + dx, y + dy]);
    }
  }

  return footprint;
}

/**
 * Check if a building's footprint fits within the grid boundaries.
 *
 * @param type - Building type
 * @param x - X coordinate (top-left tile)
 * @param y - Y coordinate (top-left tile)
 * @returns True if the entire footprint is within grid bounds
 */
export function isFootprintOnGrid(type: BuildingType, x: number, y: number): boolean {
  const { width, height } = BUILDING_DIMENSIONS[type];
  return x >= 0 && y >= 0 && x + width <= GRID_SIZE && y + height <= GRID_SIZE;
}

