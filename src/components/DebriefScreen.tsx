import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BUILDING_COSTS } from '../constants/gameConstants';
import toast from 'react-hot-toast';

export const DebriefScreen = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);
  const buildings = useGameStore((state) => state.buildings);
  const wood = useGameStore((state) => state.wood);
  const revealAllBuildings = useGameStore((state) => state.revealAllBuildings);

  const resetGame = useGameStore((state) => state.resetGame);
  
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (phase === 'debrief' && !revealed) {
      // Trigger reveal animation
      setTimeout(() => {
        revealAllBuildings();
        setRevealed(true);
        toast.success('All buildings revealed!', { duration: 2000 });
      }, 500);
    }
  }, [phase, revealed, revealAllBuildings]);

  // Reset revealed state when leaving debrief
  useEffect(() => {
    if (phase !== 'debrief') {
      setRevealed(false);
    }
  }, [phase]);

  if (phase !== 'debrief') return null;

  // Calculate statistics
  const totalBuildings = buildings.length;
  const totalWoodUsed = buildings.reduce((sum, b) => sum + BUILDING_COSTS[b.type], 0);
  const woodRemaining = wood;

  // Group buildings by commander
  const buildingsByCommander = commanders.map((commander) => {
    const commanderBuildings = buildings.filter((b) => b.ownerId === commander.id);
    const woodUsed = commanderBuildings.reduce((sum, b) => sum + BUILDING_COSTS[b.type], 0);
    
    // Count by type
    const buildingCounts: Record<string, number> = {};
    commanderBuildings.forEach((b) => {
      buildingCounts[b.type] = (buildingCounts[b.type] || 0) + 1;
    });

    return {
      commander,
      buildings: commanderBuildings,
      woodUsed,
      buildingCounts,
    };
  });

  // Find most absurd build
  const absurdBuilds = [
    ...buildings.filter((b) => b.type === 'farm').map((b) => ({
      text: `${commanders.find((c) => c.id === b.ownerId)?.name} built a Farm (it does nothing)`,
      absurdity: 3,
    })),
    ...buildings.filter((b) => b.type === 'decoy').map((b) => ({
      text: `${commanders.find((c) => c.id === b.ownerId)?.name} placed a Decoy`,
      absurdity: 2,
    })),
  ].sort((a, b) => b.absurdity - a.absurdity);

  const handlePlayAgain = () => {
    resetGame();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full my-8">
        <div className="mb-6">
          <h2 className="text-gray-900 text-4xl font-bold mb-3">
            🎉 Mission Debrief
          </h2>
          <p className="text-gray-700 text-lg">
            The wave is over! Here's what your commanders built...
          </p>
        </div>

        {/* Overall Statistics */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-gray-900 text-xl font-bold mb-3">📊 Overall Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Buildings Constructed</p>
              <p className="text-gray-900 text-3xl font-bold">{totalBuildings}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Wood Used</p>
              <p className="text-gray-900 text-3xl font-bold">{totalWoodUsed}/50</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Wood Remaining</p>
              <p className="text-gray-900 text-3xl font-bold">{woodRemaining}</p>
            </div>
          </div>
        </div>

        {/* Commander Breakdown */}
        <div className="space-y-4 mb-6">
          <h3 className="text-gray-900 text-xl font-bold">👥 Commander Breakdown</h3>
          {buildingsByCommander.map(({ commander, buildings, woodUsed, buildingCounts }) => (
            <div
              key={commander.id}
              className="border-2 rounded-lg p-4"
              style={{ borderColor: commander.colors.border }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: commander.colors.bg }}
                  >
                    {commander.name[0]}
                  </div>
                  <div>
                    <p className="text-gray-900 font-bold">{commander.name}</p>
                    <p className="text-gray-600 text-sm capitalize">{commander.personality}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Wood Used</p>
                  <p className="text-gray-900 text-xl font-bold">{woodUsed}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-3 mb-2">
                <p className="text-gray-700 text-sm italic">"{commander.interpretation}"</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(buildingCounts).map(([type, count]) => (
                  <span
                    key={type}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    {count}x {type}
                  </span>
                ))}
                {buildings.length === 0 && (
                  <span className="text-gray-500 text-sm italic">No buildings constructed</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Absurd Moments */}
        {absurdBuilds.length > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-gray-900 text-xl font-bold mb-3">😂 Highlight Reel</h3>
            <ul className="space-y-2">
              {absurdBuilds.slice(0, 3).map((build, index) => (
                <li key={index} className="text-gray-700">
                  • {build.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePlayAgain}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            🔄 Play Again
          </button>
          <button
            onClick={() => {
              // TODO: Implement share functionality
              toast.success('Share feature coming soon!');
            }}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            📤 Share Results
          </button>
        </div>
      </div>
    </div>
  );
};

