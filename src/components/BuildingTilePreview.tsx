import type { BuildingType } from '../store/useGameStore';
import { BUILDING_DIMENSIONS, BUILDING_STYLES } from '../constants/gameConstants';

interface BuildingTilePreviewProps {
  type: BuildingType;
  size?: 'small' | 'medium' | 'large';
}

// Convert hex color to CSS string
const hexToCSS = (hex: number): string => {
  return `#${hex.toString(16).padStart(6, '0')}`;
};

export const BuildingTilePreview = ({ type, size = 'medium' }: BuildingTilePreviewProps) => {
  const dimensions = BUILDING_DIMENSIONS[type];
  const colors = BUILDING_STYLES[type];

  // Tile size in pixels based on size variant
  const tileSize = size === 'small' ? 12 : size === 'medium' ? 20 : 32;
  const borderWidth = size === 'small' ? 1 : 2;

  // Get fill and stroke colors
  const fillColor = hexToCSS(colors.fill);
  const strokeColor = hexToCSS(colors.stroke);

  // Generate tiles based on dimensions (TypeScript infers the type)
  const tiles = [];
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      tiles.push(
        <div
          key={`${x}-${y}`}
          className="rounded-sm"
          style={{
            width: `${tileSize}px`,
            height: `${tileSize}px`,
            backgroundColor: fillColor,
            border: `${borderWidth}px solid ${strokeColor}`,
          }}
        />
      );
    }
  }

  return (
    <div
      className="flex flex-wrap gap-px"
      style={{
        width: `${dimensions.width * (tileSize + 2 * borderWidth + 1)}px`,
      }}
    >
      {tiles}
    </div>
  );
};
