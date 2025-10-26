import { useState } from 'react';
import { useGameStore, type BuildingType } from '../store/useGameStore';
import { BUILDING_COSTS, BUILDING_DESCRIPTIONS } from '../constants/gameConstants';
import { getThemeStyles } from '../utils/themeStyles';
import toast from 'react-hot-toast';

const ALL_BUILDINGS: BuildingType[] = ['wall', 'tower', 'decoy', 'mine', 'farm'];

const BUILDING_ICONS: Record<BuildingType, string> = {
  wall: '🧱',
  tower: '🗼',
  decoy: '🎯',
  mine: '💣',
  farm: '🌾',
};

export const BuildingCuration = () => {
  const phase = useGameStore((state) => state.phase);
  const enabledBuildings = useGameStore((state) => state.enabledBuildings);
  const setEnabledBuildings = useGameStore((state) => state.setEnabledBuildings);
  const setPhase = useGameStore((state) => state.setPhase);
  const uiTheme = useGameStore((state) => state.uiTheme);

  const [selectedBuildings, setSelectedBuildings] = useState<BuildingType[]>(enabledBuildings);

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
      <div className={`rounded-xl p-8 max-w-3xl w-full ${theme.cardBackground} ${theme.cardBorder} ${theme.cardShadow}`}>
        <div className="mb-6">
          <h2 className={`text-3xl font-bold mb-3 ${theme.headingText}`}>
            🏗️ Choose Your Buildings
          </h2>
          <p className={`text-lg leading-relaxed mb-2 ${theme.bodyText}`}>
            Select <strong>exactly 3 building types</strong> for your commanders to use.
          </p>
          <p className={`text-sm ${theme.mutedText}`}>
            Your commanders will interpret your commands and build using only these types.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {ALL_BUILDINGS.map((building) => {
            const isSelected = selectedBuildings.includes(building);
            const cost = BUILDING_COSTS[building];
            const description = BUILDING_DESCRIPTIONS[building];
            const icon = BUILDING_ICONS[building];

            return (
              <button
                key={building}
                onClick={() => toggleBuilding(building)}
                className={`
                  p-4 rounded-lg transition-all text-left
                  ${
                    isSelected
                      ? `${theme.buildingCardSelectedBorder} ${theme.buildingCardSelectedBackground} shadow-md`
                      : `${theme.buildingCardBorder} ${theme.buildingCardBackground} hover:opacity-80`
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <span className={`font-bold capitalize ${theme.headingText}`}>
                      {building}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-blue-400 font-bold">✓</span>
                  )}
                </div>
                <p className={`text-sm mb-2 ${theme.mutedText}`}>{description}</p>
                <p className={`text-sm font-semibold ${theme.bodyText}`}>
                  Cost: {cost} wood
                </p>
              </button>
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
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

