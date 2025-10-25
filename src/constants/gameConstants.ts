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
  wall: 5,
  tower: 10,
  decoy: 3,
  mine: 7,
  farm: 8,
};

// Building Descriptions
export const BUILDING_DESCRIPTIONS: Record<BuildingType, string> = {
  wall: 'Blocks enemy movement',
  tower: 'Attacks enemies in range',
  decoy: 'Distracts 50% of enemies',
  mine: 'Explodes on contact',
  farm: 'Decorative (does nothing)',
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
  sprite?: import('pixi.js').Sprite;
  key?: string;
}

