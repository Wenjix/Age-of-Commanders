import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  generateReaction,
  generateHighlights,
  calculateAbsurdityPercentage,
  type GameStats,
} from '../utils/comedyDetection';
import { cleanTextForDisplay } from '../utils/textFormatting';
import { clusterTurns, selectTopMoments, extractBestMoment } from '../utils/timelineUtils';
import toast from 'react-hot-toast';

// Import new debrief components
import { HeroBanner } from './debrief/HeroBanner';
import { HighlightBadges } from './debrief/HighlightBadges';
import { CommanderCard } from './debrief/CommanderCard';
import { BattleTimeline } from './debrief/BattleTimeline';
import { ActionFooter } from './debrief/ActionFooter';

// Import styles
import './debrief/debrief.css';

export const DebriefScreen = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);
  const buildings = useGameStore((state) => state.buildings);
  const wood = useGameStore((state) => state.wood);
  const turnLog = useGameStore((state) => state.turnLog);
  const baseHealth = useGameStore((state) => state.baseHealth);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const maxTurns = useGameStore((state) => state.maxTurns);
  const revealAllBuildings = useGameStore((state) => state.revealAllBuildings);
  const revealBuilding = useGameStore((state) => state.revealBuilding);
  const revealingBuildings = useGameStore((state) => state.revealingBuildings);
  const setRevealingBuildings = useGameStore((state) => state.setRevealingBuildings);
  const resetGame = useGameStore((state) => state.resetGame);

  const [revealed, setRevealed] = useState(false);
  const timeoutIdsRef = useRef<number[]>([]);

  // Get last command from localStorage
  const lastCommand = localStorage.getItem('lastCommand') || 'Defend the base';

  // Calculate initial wood
  const initialWood = 40; // From game constants
  const woodDelta = wood - initialWood;

  // Calculate total enemies killed (count enemy_destroyed events)
  const enemiesKilled = turnLog.filter(entry => entry.type === 'enemy_destroyed').length;

  // Determine outcome
  const outcome: 'victory' | 'defeat' = baseHealth > 0 ? 'victory' : 'defeat';

  // Explicit commander ordering
  const COMMANDER_REVEAL_ORDER = ['larry', 'paul', 'olivia'];

  // Helper to clear all pending timeouts
  const clearAllRevealTimeouts = () => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  // Staggered reveal effect
  useEffect(() => {
    if (phase === 'debrief' && !revealed) {
      setRevealingBuildings(true);

      const unrevealedBuildings = buildings.filter((b) => !b.revealed);

      const sortedCommanders = COMMANDER_REVEAL_ORDER
        .map((id) => commanders.find((c) => c.id === id))
        .filter((c): c is typeof commanders[0] => c !== undefined);

      const buildingsByCommander = sortedCommanders.map((commander) => ({
        commander,
        buildings: unrevealedBuildings.filter((b) => b.ownerId === commander.id),
      }));

      let currentDelay = 500;
      const REVEAL_INTERVAL = 600;

      const revealToastId = 'revealing-builds';
      toast.loading('Revealing builds...', { id: revealToastId });

      buildingsByCommander.forEach(({ buildings: commanderBuildings }) => {
        commanderBuildings.forEach((building) => {
          const timeoutId = window.setTimeout(() => {
            revealBuilding(building.position[0], building.position[1]);
          }, currentDelay);

          timeoutIdsRef.current.push(timeoutId);
          currentDelay += REVEAL_INTERVAL;
        });
      });

      // Final reveal complete
      const finalTimeoutId = window.setTimeout(() => {
        setRevealingBuildings(false);
        setRevealed(true);
        toast.success('All builds revealed!', { id: revealToastId });
      }, currentDelay + 500);

      timeoutIdsRef.current.push(finalTimeoutId);
    }

    return () => {
      clearAllRevealTimeouts();
    };
  }, [phase, revealed, buildings, commanders, revealBuilding, setRevealingBuildings]);

  // Don't render until phase is debrief
  if (phase !== 'debrief') return null;

  // Prepare game stats
  const stats: GameStats = {
    survived: baseHealth > 0,
    enemiesKilled,
    woodRemaining: wood,
  };

  // Group buildings by commander
  const buildingsByCommander = commanders.map((commander) => ({
    commander,
    buildings: buildings.filter((b) => b.ownerId === commander.id),
  }));

  // Generate highlights
  const highlights = generateHighlights(commanders, lastCommand, stats);

  // Extract highlight data
  const quoteOfTheDay = highlights.find(h => h.category === 'Quote of the Day');
  const mostAbsurdHighlight = highlights.find(h => h.category === 'Most Absurd');
  const bestMomentData = extractBestMoment(turnLog);

  // Prepare highlight badges data
  const highlightBadgesData = {
    quoteOfTheDay: quoteOfTheDay ? {
      text: cleanTextForDisplay(quoteOfTheDay.description),
      commander: quoteOfTheDay.commanderName,
    } : undefined,
    mostAbsurd: mostAbsurdHighlight ? {
      commander: mostAbsurdHighlight.commanderName,
      type: 'building', // Could be extracted from description
      count: 5, // Could be extracted from description
      absurdity: 95, // Could be calculated
    } : undefined,
    bestMoment: bestMomentData ? {
      turn: bestMomentData.turn,
      description: bestMomentData.description,
    } : undefined,
  };

  // Prepare timeline data
  const topMoments = selectTopMoments(turnLog, 3);
  const clusters = clusterTurns(turnLog, 3);

  // Handle actions
  const handlePlayAgain = () => {
    resetGame();
  };

  const handleShare = () => {
    toast.success('Share functionality coming soon!');
  };

  const handleSkipReveal = () => {
    clearAllRevealTimeouts();
    revealAllBuildings();
    setRevealingBuildings(false);
    setRevealed(true);
    toast.success('All builds revealed!', { id: 'revealing-builds' });
  };

  return (
    <div className="debrief-screen" style={{ height: '100vh', overflow: 'auto', background: '#0f172a' }}>
      {/* Hero Banner */}
      <HeroBanner
        outcome={outcome}
        missionTitle={lastCommand}
        turnsCompleted={currentTurn}
        maxTurns={maxTurns}
        woodDelta={woodDelta}
        enemiesKilled={enemiesKilled}
      />

      {/* Main Content */}
      <div className="debrief-content" style={{ paddingBottom: '100px' }}>
        {/* Highlight Badges (Sticky) */}
        <HighlightBadges highlights={highlightBadgesData} />

        {/* Skip Reveal Button (if still revealing) */}
        {revealingBuildings && (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <button
              onClick={handleSkipReveal}
              className="action-btn action-btn-secondary"
              style={{ marginBottom: '1rem' }}
            >
              ⏭️ Skip Reveal
            </button>
          </div>
        )}

        {/* Commander Breakdown */}
        <div style={{ padding: '2rem', background: 'transparent' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '2rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            👥 Commander Reports
          </h2>
          {buildingsByCommander.map(({ commander, buildings: commanderBuildings }, index) => {
            const reaction = generateReaction(commander, stats);
            const absurdityPercent = calculateAbsurdityPercentage(commander, lastCommand);

            return (
              <CommanderCard
                key={commander.id}
                commander={commander}
                buildings={commanderBuildings}
                reaction={cleanTextForDisplay(reaction)}
                absurdityPercent={absurdityPercent}
                delay={index * 200}
              />
            );
          })}
        </div>

        {/* Battle Timeline */}
        <div style={{ padding: '0 2rem 2rem' }}>
          <BattleTimeline
            topMoments={topMoments}
            clusters={clusters}
          />
        </div>
      </div>

      {/* Action Footer (Sticky) */}
      <ActionFooter
        onPlayAgain={handlePlayAgain}
        onShare={handleShare}
      />
    </div>
  );
};

