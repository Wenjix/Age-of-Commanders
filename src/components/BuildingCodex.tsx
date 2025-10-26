import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BuildingTilePreview } from './BuildingTilePreview';
import { BUILDING_COSTS, BUILDING_CARDS } from '../constants/gameConstants';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const BuildingCodex = () => {
  const phase = useGameStore((state) => state.phase);
  const enabledBuildings = useGameStore((state) => state.enabledBuildings);
  const [isExpanded, setIsExpanded] = useState(true);

  // Only show during teach and execute phases
  if (phase !== 'teach' && phase !== 'execute') {
    return null;
  }

  // Don't show if no buildings are enabled
  if (enabledBuildings.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-30">
      {!isExpanded ? (
        /* Collapsed State - Just a button */
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-xl border border-gray-700 hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <span className="text-sm font-semibold">Building Legend</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      ) : (
        /* Expanded State - Show all enabled buildings */
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2 bg-gray-800 flex items-center justify-between border-b border-gray-700">
            <h3 className="text-white text-sm font-bold">Building Legend</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Building List */}
          <div className="p-3 space-y-2">
            {enabledBuildings.map((building) => {
              const cardInfo = BUILDING_CARDS[building];
              const cost = BUILDING_COSTS[building];

              return (
                <div
                  key={building}
                  className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg"
                >
                  {/* Emoji Icon */}
                  <div className="text-2xl flex-shrink-0">{cardInfo.icon}</div>

                  {/* Tile Preview */}
                  <div className="flex-shrink-0">
                    <BuildingTilePreview type={building} size="small" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold capitalize">
                      {building}
                    </div>
                    <div className="text-gray-400 text-xs">
                      🪵 {cost} wood
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Hint */}
          <div className="px-4 py-2 bg-gray-800/50 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              Matches color-coded buildings on map
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
