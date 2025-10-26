import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BUILDING_COSTS } from '../constants/gameConstants';
import { getThemeStyles } from '../utils/themeStyles';
import toast from 'react-hot-toast';

export const DebriefScreen = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);
  const buildings = useGameStore((state) => state.buildings);
  const wood = useGameStore((state) => state.wood);
  const revealAllBuildings = useGameStore((state) => state.revealAllBuildings);
  const uiTheme = useGameStore((state) => state.uiTheme);
  const setDebriefPanelWidth = useGameStore((state) => state.setDebriefPanelWidth);

  const resetGame = useGameStore((state) => state.resetGame);

  const [revealed, setRevealed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (phase === 'debrief' && !revealed) {
      // Show collapsed tab initially
      setDebriefPanelWidth(60);
      setIsExpanded(false);
      // Trigger reveal animation
      setTimeout(() => {
        revealAllBuildings();
        setRevealed(true);
        toast.success('All buildings revealed!', { duration: 2000 });
      }, 500);
    }
  }, [phase, revealed, revealAllBuildings, setDebriefPanelWidth]);

  // Reset revealed state and panel when leaving debrief
  useEffect(() => {
    if (phase !== 'debrief') {
      setRevealed(false);
      setIsExpanded(false);
      setDebriefPanelWidth(0);
    }
  }, [phase, setDebriefPanelWidth]);

  // Update panel width when expanding/collapsing
  useEffect(() => {
    if (phase === 'debrief') {
      setDebriefPanelWidth(isExpanded ? 600 : 60);
    }
  }, [isExpanded, phase, setDebriefPanelWidth]);

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

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const theme = getThemeStyles(uiTheme);

  // Collapsed tab view
  if (!isExpanded) {
    return (
      <div
        className={`fixed left-0 top-[44px] h-[calc(100vh-44px)] w-[60px] z-[90] flex items-center justify-center cursor-pointer transition-all duration-300 ${theme.cardBorder}`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          borderRight: `2px solid ${theme.cardBorder.includes('white') ? 'rgba(255,255,255,0.2)' : 'rgba(75,85,99,0.5)'}`
        }}
        onClick={handleToggleExpand}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">🎉</span>
          <div className="flex flex-col items-center">
            {['D', 'e', 'b', 'r', 'i', 'e', 'f'].map((letter, i) => (
              <span
                key={i}
                className={`text-sm font-bold ${theme.headingText}`}
              >
                {letter}
              </span>
            ))}
          </div>
          <span className="text-xl">▶</span>
        </div>
      </div>
    );
  }

  // Expanded panel view
  return (
    <div
      className={`fixed left-0 top-[44px] h-[calc(100vh-44px)] w-[600px] z-[90] flex flex-col transition-all duration-300 ${theme.cardBorder} ${theme.overlayBackdrop}`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderRight: `2px solid ${theme.cardBorder.includes('white') ? 'rgba(255,255,255,0.3)' : 'rgba(75,85,99,0.7)'}`
      }}
    >
      {/* Header - Sticky */}
      <div className={`p-4 border-b ${theme.cardBorder} flex items-center justify-between`}>
        <h2 className={`text-2xl font-bold ${theme.headingText}`}>
          🎉 Mission Debrief
        </h2>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleExpand();
          }}
          className={`px-3 py-2 rounded ${theme.secondaryButtonBackground} ${theme.headingText} hover:opacity-80 transition-opacity font-semibold text-sm relative z-10`}
        >
          ◀ Collapse
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className={`${theme.bodyText} text-sm`}>
          The wave is over! Here's what your commanders built...
        </p>

        {/* Overall Statistics */}
        <div className={`${theme.buildingCardBackground} ${theme.cardBorder} rounded-lg p-4`}>
          <h3 className={`${theme.headingText} text-lg font-bold mb-3`}>📊 Overall Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`${theme.mutedText} text-sm`}>Buildings Constructed</span>
              <span className={`${theme.headingText} text-xl font-bold`}>{totalBuildings}</span>
            </div>
            <div className="flex justify-between">
              <span className={`${theme.mutedText} text-sm`}>Wood Used</span>
              <span className={`${theme.headingText} text-xl font-bold`}>{totalWoodUsed}/50</span>
            </div>
            <div className="flex justify-between">
              <span className={`${theme.mutedText} text-sm`}>Wood Remaining</span>
              <span className={`${theme.headingText} text-xl font-bold`}>{woodRemaining}</span>
            </div>
          </div>
        </div>

        {/* Commander Breakdown */}
        <div className="space-y-3">
          <h3 className={`${theme.headingText} text-lg font-bold`}>👥 Commander Breakdown</h3>
          {buildingsByCommander.map(({ commander, buildings, woodUsed, buildingCounts }) => (
            <div
              key={commander.id}
              className={`${theme.cardBackground} border-2 rounded-lg p-3`}
              style={{ borderColor: commander.colors.border }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: commander.colors.bg }}
                  >
                    {commander.name[0]}
                  </div>
                  <div>
                    <p className={`${theme.headingText} font-bold text-sm`}>{commander.name}</p>
                    <p className={`${theme.mutedText} text-xs capitalize`}>{commander.personality}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`${theme.mutedText} text-xs`}>Wood</p>
                  <p className={`${theme.headingText} text-lg font-bold`}>{woodUsed}</p>
                </div>
              </div>
              <div className={`${theme.secondaryButtonBackground} rounded p-2 mb-2`}>
                <p className={`${theme.bodyText} text-xs italic`}>"{commander.interpretation}"</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(buildingCounts).map(([type, count]) => (
                  <span
                    key={type}
                    className={`${theme.secondaryButtonBackground} ${theme.headingText} px-2 py-1 rounded-full text-xs font-semibold`}
                  >
                    {count}x {type}
                  </span>
                ))}
                {buildings.length === 0 && (
                  <span className={`${theme.mutedText} text-xs italic`}>No buildings constructed</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Absurd Moments */}
        {absurdBuilds.length > 0 && (
          <div className={`${theme.buildingCardBackground} ${theme.cardBorder} rounded-lg p-4`}>
            <h3 className={`${theme.headingText} text-lg font-bold mb-2`}>😂 Highlight Reel</h3>
            <ul className="space-y-1">
              {absurdBuilds.slice(0, 3).map((build, index) => (
                <li key={index} className={`${theme.bodyText} text-sm`}>
                  • {build.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer - Sticky */}
      <div className={`p-4 border-t ${theme.cardBorder} space-y-2`}>
        <button
          onClick={handlePlayAgain}
          className={`w-full ${theme.primaryButtonBackground} ${theme.headingText} font-bold py-3 px-4 rounded-lg transition-all ${theme.primaryButtonHover}`}
        >
          🔄 Play Again
        </button>
        <button
          onClick={() => {
            toast.success('Share feature coming soon!');
          }}
          className={`w-full ${theme.secondaryButtonBackground} ${theme.headingText} font-semibold py-2 px-4 rounded-lg transition-opacity hover:opacity-80`}
        >
          📤 Share Results
        </button>
      </div>
    </div>
  );
};

