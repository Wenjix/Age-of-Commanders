import type { Container } from 'pixi.js';
import type { Building, BuildingType } from '../store/useGameStore';
import { BUILDING_STYLES } from '../constants/gameConstants';

/**
 * Sorts the children of a container if sortable
 */
export function sortCameraChildren(camera: Container): void {
  if (camera.sortableChildren) {
    camera.sortDirty = true;
    camera.sortChildren();
  }
}

/**
 * Gets the building key for a position
 */
export function getBuildingKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Gets the style for a building type
 */
export function getStyleForType(type: BuildingType): { fill: number; stroke: number } {
  return BUILDING_STYLES[type] || BUILDING_STYLES.default;
}

/**
 * Compares two building arrays for equality
 * More efficient than JSON.stringify for large arrays
 */
export function buildingsEqual(buildings1: Building[], buildings2: Building[]): boolean {
  if (buildings1.length !== buildings2.length) {
    return false;
  }

  // Create a map of buildings by position for efficient comparison
  const buildingMap1 = new Map<string, Building>();
  for (const building of buildings1) {
    const key = getBuildingKey(building.position[0], building.position[1]);
    buildingMap1.set(key, building);
  }

  // Check if all buildings in the second array exist in the first with the same properties
  for (const building of buildings2) {
    const key = getBuildingKey(building.position[0], building.position[1]);
    const building1 = buildingMap1.get(key);

    if (!building1 ||
        building1.type !== building.type ||
        building1.ownerId !== building.ownerId) {
      return false;
    }
  }

  return true;
}

/**
 * Validates if a position is within the grid bounds
 */
export function isValidGridPosition(x: number, y: number, gridSize: number): boolean {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
}