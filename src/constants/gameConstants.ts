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
} as const;

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
    WELCOME_SIGN: {
      FILL: 0xfbbf24,
      STROKE: 0xf59e0b,
    },
    DEFAULT: {
      FILL: 0x808080,
      STROKE: 0x404040,
    },
  },
} as const;

// Building Styles Configuration
export const BUILDING_STYLES: Record<BuildingType | 'default', { fill: number; stroke: number }> = {
  'wall': { fill: COLORS.BUILDINGS.WALL.FILL, stroke: COLORS.BUILDINGS.WALL.STROKE },
  'tower': { fill: COLORS.BUILDINGS.TOWER.FILL, stroke: COLORS.BUILDINGS.TOWER.STROKE },
  'welcome-sign': { fill: COLORS.BUILDINGS.WELCOME_SIGN.FILL, stroke: COLORS.BUILDINGS.WELCOME_SIGN.STROKE },
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

// Queue Item Types
export interface BuildingQueueItem {
  action: 'add' | 'remove';
  sprite?: import('pixi.js').Sprite;
  key?: string;
}