import { useState } from 'react';
import { useGameStore, type BuildingType } from '../store/useGameStore';
import { BUILDING_COSTS, BUILDING_CARDS } from '../constants/gameConstants';
import { getThemeStyles } from '../utils/themeStyles';
import toast from 'react-hot-toast';

const ALL_BUILDINGS: BuildingType[] = ['wall', 'tower', 'decoy', 'mine', 'farm'];

export const BuildingCuration = () => {
  const phase = useGameStore((state) => state.phase);
  const enabledBuildings = useGameStore((state) => state.enabledBuildings);
  const setEnabledBuildings = useGameStore((state) => state.setEnabledBuildings);
  const setPhase = useGameStore((state) => state.setPhase);
  const uiTheme = useGameStore((state) => state.uiTheme);

  const [selectedBuildings, setSelectedBuildings] = useState<BuildingType[]>(enabledBuildings);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingType | null>(null);

  if (phase !== 'curate') return null;

  const theme = getThemeStyles(uiTheme);

  const toggleBuilding = (building: BuildingType) => {
    if (selectedBuildings.includes(building)) {
      setSelectedBuildings(selectedBuildings.filter((b) => b !== building));
    } else {
      if (selectedBuildings.length >= 3) {
        toast.error('You can only select 3 building types!');
        return;
      }
      setSelectedBuildings([...selectedBuildings, building]);
    }
  };

  const handleConfirm = () => {
    if (selectedBuildings.length !== 3) {
      toast.error('Please select exactly 3 building types!');
      return;
    }
    
    setEnabledBuildings(selectedBuildings);
    toast.success('Building types selected! Now give your commanders a command.');
    setPhase('teach');
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${theme.overlayBackground} ${theme.overlayBackdrop}`}>
      <div className={`rounded-xl p-8 max-w-5xl w-full ${theme.cardBackground} ${theme.cardBorder} ${theme.cardShadow}`}>
        <div className="mb-6">
          <h2 className={`text-3xl font-bold mb-3 ${theme.headingText}`}>
            🏗️ Choose Your Buildings
          </h2>
          <p className={`text-lg leading-relaxed mb-2 ${theme.bodyText}`}>
            Select <strong>exactly 3 building types</strong> for your commanders to use.
          </p>
          <p className={`text-sm ${theme.mutedText}`}>
            Your commanders will interpret your commands differently. Choose wisely... or don't. 😏
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {ALL_BUILDINGS.map((building) => {
            const isSelected = selectedBuildings.includes(building);
            const isHovered = hoveredBuilding === building;
            const cost = BUILDING_COSTS[building];
            const cardInfo = BUILDING_CARDS[building];

            return (
              <div
                key={building}
                className="relative"
                onMouseEnter={() => setHoveredBuilding(building)}
                onMouseLeave={() => setHoveredBuilding(null)}
              >
                <button
                  onClick={() => toggleBuilding(building)}
                  className={`
                    w-full p-6 rounded-xl transition-all text-left relative overflow-hidden
                    ${
                      isSelected
                        ? `${theme.buildingCardSelectedBorder} ${theme.buildingCardSelectedBackground} shadow-lg scale-105`
                        : `${theme.buildingCardBorder} ${theme.buildingCardBackground} hover:scale-102 hover:shadow-md`
                    }
                  `}
                >
                  {/* Selection Checkmark */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      ✓
                    </div>
                  )}

                  {/* Cost Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-600 rounded-full text-white text-xs font-bold shadow-md">
                    💰 {cost}
                  </div>

                  {/* Icon */}
                  <div className="text-6xl mb-4 mt-8 text-center">
                    {cardInfo.icon}
                  </div>

                  {/* Building Name */}
                  <h3 className={`text-2xl font-bold mb-2 text-center capitalize ${theme.headingText}`}>
                    {building}
                  </h3>

                  {/* Divider */}
                  <div className="w-16 h-1 bg-gradient-to-r from-transparent via-gray-500 to-transparent mx-auto mb-3"></div>

                  {/* Tagline */}
                  <p className={`text-center text-lg font-semibold mb-3 italic ${theme.headingText}`}>
                    "{cardInfo.tagline}"
                  </p>

                  {/* Flavor Text */}
                  <p className={`text-sm text-center leading-relaxed ${theme.bodyText}`}>
                    {cardInfo.flavorText}
                  </p>

                  {/* Hover Hint */}
                  <div className={`text-xs text-center mt-4 ${theme.mutedText} italic`}>
                    {isHovered ? '💬 Commander reviews below' : '💬 Hover for hints'}
                  </div>
                </button>

                {/* Hover Tooltip - Commander Quotes */}
                {isHovered && (
                  <div
                    className={`absolute left-0 right-0 top-full mt-2 p-4 rounded-lg ${theme.cardBackground} ${theme.cardBorder} shadow-xl z-10 animate-fade-in`}
                  >
                    <div className="text-xs font-bold mb-2 text-center text-gray-400">
                      💬 Past Commander Reviews
                    </div>
                    <div className="space-y-2">
                      {/* Larry's Quote */}
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          L
                        </div>
                        <p className={`text-xs italic ${theme.bodyText}`}>
                          "{cardInfo.commanderQuotes.larry}"
                        </p>
                      </div>

                      {/* Paul's Quote */}
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          P
                        </div>
                        <p className={`text-xs italic ${theme.bodyText}`}>
                          "{cardInfo.commanderQuotes.paul}"
                        </p>
                      </div>

                      {/* Olivia's Quote */}
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          O
                        </div>
                        <p className={`text-xs italic ${theme.bodyText}`}>
                          "{cardInfo.commanderQuotes.olivia}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className={theme.bodyText}>
            <span className="font-semibold">Selected:</span>{' '}
            <span className={selectedBuildings.length === 3 ? 'text-green-400' : 'text-red-400'}>
              {selectedBuildings.length}/3
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedBuildings.length !== 3}
            className={`text-white font-bold py-3 px-8 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.primaryButtonBackground} ${theme.primaryButtonHover}`}
          >
            Confirm Selection →
          </button>
        </div>
      </div>
    </div>
  );
};

