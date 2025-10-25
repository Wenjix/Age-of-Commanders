import { useState } from 'react';
import { useGameStore, type BuildingType } from '../store/useGameStore';
import { BUILDING_COSTS, BUILDING_DESCRIPTIONS } from '../constants/gameConstants';
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
  
  const [selectedBuildings, setSelectedBuildings] = useState<BuildingType[]>(enabledBuildings);

  if (phase !== 'curate') return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-3xl w-full">
        <div className="mb-6">
          <h2 className="text-gray-900 text-3xl font-bold mb-3">
            🏗️ Choose Your Buildings
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-2">
            Select <strong>exactly 3 building types</strong> for your commanders to use.
          </p>
          <p className="text-gray-600 text-sm">
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
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-gray-900 font-bold capitalize">
                      {building}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2">{description}</p>
                <p className="text-gray-800 text-sm font-semibold">
                  Cost: {cost} wood
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-gray-700">
            <span className="font-semibold">Selected:</span>{' '}
            <span className={selectedBuildings.length === 3 ? 'text-green-600' : 'text-red-600'}>
              {selectedBuildings.length}/3
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedBuildings.length !== 3}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

