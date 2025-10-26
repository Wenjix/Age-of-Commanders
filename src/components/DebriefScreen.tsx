import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BUILDING_COSTS } from '../constants/gameConstants';
import { getThemeStyles } from '../utils/themeStyles';
import {
  generateReaction,
  generateHighlights,
  calculateAbsurdityPercentage,
  type GameStats,
} from '../utils/comedyDetection';
import toast from 'react-hot-toast';
import { cleanTextForDisplay } from '../utils/textFormatting';

const BUILDING_ICONS: Record<string, string> = {
  wall: '🧱',
  tower: '🗼',
  mine: '💣',
  decoy: '🎯',
  farm: '🌾',
};

const PERSONALITY_EMOJIS = {
  literalist: '😐',
  paranoid: '😰',
  optimist: '😊',
};

export const DebriefScreen = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);
  const buildings = useGameStore((state) => state.buildings);
  const wood = useGameStore((state) => state.wood);
  const turnLog = useGameStore((state) => state.turnLog);
  const baseHealth = useGameStore((state) => state.baseHealth);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const enemies = useGameStore((state) => state.enemies);
  const revealAllBuildings = useGameStore((state) => state.revealAllBuildings);
  const revealBuilding = useGameStore((state) => state.revealBuilding);
  const uiTheme = useGameStore((state) => state.uiTheme);
  const setDebriefPanelWidth = useGameStore((state) => state.setDebriefPanelWidth);
  const revealingBuildings = useGameStore((state) => state.revealingBuildings);
  const setRevealingBuildings = useGameStore((state) => state.setRevealingBuildings);

  const resetGame = useGameStore((state) => state.resetGame);

  const [revealed, setRevealed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Track timeout IDs for cleanup
  const timeoutIdsRef = useRef<number[]>([]);

  // Helper to clear all pending timeouts
  const clearAllRevealTimeouts = () => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  // Explicit commander ordering for consistent reveal sequence
  const COMMANDER_REVEAL_ORDER = ['larry', 'paul', 'olivia'];

  // Get last command from localStorage
  const lastCommand = localStorage.getItem('lastCommand') || 'Defend the base';

  useEffect(() => {
    if (phase === 'debrief' && !revealed) {
      setDebriefPanelWidth(0); // Hide panel during reveal
      setIsExpanded(false);
      setRevealingBuildings(true);

      // Get all unrevealed buildings
      const unrevealedBuildings = buildings.filter((b) => !b.revealed);

      // Sort commanders explicitly by reveal order
      const sortedCommanders = COMMANDER_REVEAL_ORDER
        .map((id) => commanders.find((c) => c.id === id))
        .filter((c): c is typeof commanders[0] => c !== undefined);

      // Group buildings by sorted commander order
      const buildingsByCommander = sortedCommanders.map((commander) => ({
        commander,
        buildings: unrevealedBuildings.filter((b) => b.ownerId === commander.id),
      }));

      // Stagger reveal: 500ms initial, 600ms between buildings
      let currentDelay = 500;
      const REVEAL_INTERVAL = 600;

      // Single toast at start (no per-building spam)
      const revealToastId = 'revealing-builds';
      toast.loading('Revealing builds...', { id: revealToastId });

      buildingsByCommander.forEach(({ buildings: commanderBuildings }) => {
        commanderBuildings.forEach((building) => {
          const timeoutId = window.setTimeout(() => {
            // Reveal individual building
            revealBuilding(building.position[0], building.position[1]);
          }, currentDelay);

          timeoutIdsRef.current.push(timeoutId);
          currentDelay += REVEAL_INTERVAL;
        });
      });

      // After all reveals, show debrief panel
      const finalTimeoutId = window.setTimeout(() => {
        setRevealed(true);
        setRevealingBuildings(false);
        setDebriefPanelWidth(60); // Show collapsed tab
        toast.success('All buildings revealed!', { id: revealToastId, duration: 2000 });
      }, currentDelay + 500);

      timeoutIdsRef.current.push(finalTimeoutId);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      clearAllRevealTimeouts();
    };
  }, [phase, revealed, buildings, commanders, setDebriefPanelWidth, setRevealingBuildings, revealBuilding]);

  // Reset revealed state and panel when leaving debrief
  useEffect(() => {
    if (phase !== 'debrief') {
      setRevealed(false);
      setIsExpanded(false);
      setDebriefPanelWidth(0);
      clearAllRevealTimeouts(); // Cancel pending reveals on phase change
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

  // Game stats for comedy detection
  const stats: GameStats = {
    survived: true, // TODO: Implement actual survival logic
    woodRemaining,
    totalBuildings,
    enemiesKilled: 0, // TODO: Implement enemy tracking
    buildingsByType: buildings.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Group buildings by commander with comedy analysis
  const buildingsByCommander = commanders.map((commander) => {
    const commanderBuildings = buildings.filter((b) => b.ownerId === commander.id);
    const woodUsed = commanderBuildings.reduce((sum, b) => sum + BUILDING_COSTS[b.type], 0);
    
    // Count by type
    const buildingCounts: Record<string, number> = {};
    commanderBuildings.forEach((b) => {
      buildingCounts[b.type] = (buildingCounts[b.type] || 0) + 1;
    });

    // Generate post-mission reaction
    const reaction = generateReaction(commander, stats);
    
    // Calculate absurdity
    const absurdityPercent = calculateAbsurdityPercentage(commander, lastCommand);

    return {
      commander,
      buildings: commanderBuildings,
      woodUsed,
      buildingCounts,
      reaction,
      absurdityPercent,
    };
  });

  // Generate highlights
  const highlights = generateHighlights(commanders, lastCommand, stats);

  const handlePlayAgain = () => {
    resetGame();
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSkipReveal = () => {
    clearAllRevealTimeouts();
    revealAllBuildings();
    setRevealed(true);
    setRevealingBuildings(false);
    setDebriefPanelWidth(60);
    toast.success('All buildings revealed!', { duration: 1000 });
  };

  const theme = getThemeStyles(uiTheme);

  // Collapsed tab view
  if (!isExpanded) {
    return (
      <>
        {/* Skip button (only shown during reveal animation) */}
        {revealingBuildings && (
          <button
            onClick={handleSkipReveal}
            className="fixed top-20 right-4 z-[100] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors"
          >
            ⏩ Skip Reveal
          </button>
        )}

        {/* Collapsed tab */}
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
      </>
    );
  }

  // Expanded panel view
  return (
    <>
      {/* Skip button (only shown during reveal animation) */}
      {revealingBuildings && (
        <button
          onClick={handleSkipReveal}
          className="fixed top-20 right-4 z-[100] bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors"
        >
          ⏩ Skip Reveal
        </button>
      )}

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
        {/* Command Reminder */}
        <div className={`${theme.buildingCardBackground} ${theme.cardBorder} rounded-lg p-4`}>
          <p className={`${theme.mutedText} text-sm mb-1`}>You said:</p>
          <p className={`${theme.headingText} text-lg font-bold`}>"{lastCommand}"</p>
        </div>

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

        {/* Commander Breakdown with Reactions */}
        <div className="space-y-3">
          <h3 className={`${theme.headingText} text-lg font-bold`}>👥 Commander Breakdown</h3>
          {buildingsByCommander.map(({ commander, buildings, woodUsed, buildingCounts, reaction, absurdityPercent }) => (
            <div
              key={commander.id}
              className={`${theme.cardBackground} border-2 rounded-lg p-3`}
              style={{ borderColor: commander.colors.border }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: commander.colors.bg }}
                  >
                    {commander.name[0]}
                  </div>
                  <div>
                    <p className={`${theme.headingText} font-bold`}>{commander.name}</p>
                    <p className={`${theme.mutedText} text-xs capitalize`}>{commander.personality}</p>
                  </div>
                </div>
                <div className="text-3xl">
                  {PERSONALITY_EMOJIS[commander.personality]}
                </div>
              </div>

              {/* Interpretation */}
              <div className={`${theme.secondaryButtonBackground} rounded p-2 mb-2`}>
                <p className={`${theme.mutedText} text-xs mb-1`}>They heard:</p>
                <p className={`${theme.bodyText} text-xs italic`}>"{cleanTextForDisplay(commander.interpretation)}"</p>
              </div>

              {/* Buildings */}
              <div className="mb-2">
                <p className={`${theme.mutedText} text-xs mb-1`}>What they built ({woodUsed} wood):</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(buildingCounts).map(([type, count]) => (
                    <span
                      key={type}
                      className={`${theme.secondaryButtonBackground} ${theme.headingText} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}
                    >
                      <span>{BUILDING_ICONS[type]}</span>
                      <span>{count}x {type}</span>
                    </span>
                  ))}
                  {buildings.length === 0 && (
                    <span className={`${theme.mutedText} text-xs italic`}>Nothing (stood by)</span>
                  )}
                </div>
              </div>

              {/* Post-Mission Reaction */}
              <div
                className="p-2 rounded mb-2"
                style={{
                  backgroundColor: `${commander.colors.bg}20`,
                  border: `1px solid ${commander.colors.border}`,
                }}
              >
                <p className={`${theme.mutedText} text-xs mb-1`}>Reaction:</p>
                <p className={`${theme.bodyText} text-sm font-medium`}>💬 {cleanTextForDisplay(reaction)}</p>
              </div>

              {/* Absurdity Meter */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`${theme.mutedText} text-xs`}>Absurdity Level:</span>
                  <span className={`${theme.headingText} text-sm font-bold`}>{absurdityPercent}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${absurdityPercent}%`,
                      background: absurdityPercent > 70 
                        ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                        : absurdityPercent > 40
                        ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : 'linear-gradient(90deg, #10b981, #059669)',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Turn-by-Turn Log */}
        {turnLog.length > 0 && (
          <div className={`${theme.buildingCardBackground} ${theme.cardBorder} rounded-lg p-4`}>
            <h3 className={`${theme.headingText} text-lg font-bold mb-3`}>
              📜 Battle Chronicle (Turn {currentTurn}/{10})
            </h3>

            {/* Victory/Defeat Status */}
            <div className="mb-3">
              {baseHealth === 0 ? (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-center">
                  <span className="text-2xl">💀</span>
                  <p className={`${theme.headingText} text-lg font-bold`}>GLORY IN DEFEAT!</p>
                  <p className={`${theme.mutedText} text-sm`}>The base was destroyed on turn {currentTurn}</p>
                </div>
              ) : enemies.length === 0 ? (
                <div className="bg-green-900/50 border border-green-500 rounded-lg p-3 text-center">
                  <span className="text-2xl">🎉</span>
                  <p className={`${theme.headingText} text-lg font-bold`}>TACTICAL VICTORY!</p>
                  <p className={`${theme.mutedText} text-sm`}>All enemies defeated!</p>
                </div>
              ) : (
                <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-3 text-center">
                  <span className="text-2xl">🏆</span>
                  <p className={`${theme.headingText} text-lg font-bold`}>STRATEGIC VICTORY!</p>
                  <p className={`${theme.mutedText} text-sm`}>Survived {currentTurn} turns with {enemies.length} enemies remaining</p>
                </div>
              )}
            </div>

            {/* Turn Log Entries */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Group log entries by turn */}
              {Array.from({ length: currentTurn }, (_, i) => i + 1).map(turn => {
                const turnEntries = turnLog.filter(entry => entry.turn === turn);
                if (turnEntries.length === 0) return null;

                return (
                  <div key={turn} className={`${theme.secondaryButtonBackground} rounded p-2`}>
                    <p className={`${theme.headingText} text-sm font-bold mb-1`}>Turn {turn}</p>
                    <div className="space-y-1">
                      {turnEntries.map((entry, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 text-xs ${
                            entry.impact === 'high'
                              ? 'font-semibold'
                              : entry.impact === 'medium'
                              ? 'font-medium'
                              : ''
                          }`}
                        >
                          <span className="text-base">{entry.emoji || '•'}</span>
                          <span className={entry.impact === 'high' ? theme.headingText : theme.bodyText}>
                            {entry.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Most Impactful Events */}
            {(() => {
              const impactfulEvents = turnLog
                .filter(e => e.impact === 'high')
                .slice(-3);

              if (impactfulEvents.length > 0) {
                return (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className={`${theme.mutedText} text-xs mb-2`}>Most Impactful Moments:</p>
                    <div className="space-y-1">
                      {impactfulEvents.map((event, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span>{event.emoji}</span>
                          <span className={`${theme.headingText} text-xs`}>
                            Turn {event.turn}: {event.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Highlight Reel */}
        {highlights.length > 0 && (
          <div className={`${theme.buildingCardBackground} ${theme.cardBorder} rounded-lg p-4`}>
            <h3 className={`${theme.headingText} text-lg font-bold mb-3`}>🏆 Highlight Reel</h3>
            <div className="space-y-2">
              {highlights.map((highlight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded ${theme.secondaryButtonBackground}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{highlight.emoji}</span>
                    <span className={`${theme.headingText} font-bold text-sm`}>
                      {highlight.category}
                    </span>
                  </div>
                  <p className={`${theme.mutedText} text-xs mb-1`}>{highlight.commanderName}</p>
                  <p className={`${theme.bodyText} text-sm`}>{cleanTextForDisplay(highlight.description)}</p>
                </div>
              ))}
            </div>

            {/* Quote of the Day */}
            {highlights.find(h => h.category === 'Quote of the Day') && (
              <div
                className="mt-3 p-4 rounded-lg text-center border-2"
                style={{ 
                  borderColor: '#fbbf24',
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                }}
              >
                <div className="text-lg mb-2">✨ QUOTE OF THE DAY ✨</div>
                <div className={`text-base italic ${theme.headingText} mb-1`}>
                  "{cleanTextForDisplay(highlights.find(h => h.category === 'Quote of the Day')?.description || '')}"
                </div>
                <div className={`text-xs ${theme.mutedText}`}>
                  - {highlights.find(h => h.category === 'Quote of the Day')?.commanderName}
                </div>
              </div>
            )}
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
    </>
  );
};

