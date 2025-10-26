import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  FastForward,
  Heart
} from 'lucide-react';
import { processTurn, skipToEnd, startAutoAdvance, stopAutoAdvance } from '../services/turnManager';

export const ExecutionHUD: React.FC = () => {
  const phase = useGameStore((state) => state.phase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const maxTurns = useGameStore((state) => state.maxTurns);
  const isPaused = useGameStore((state) => state.isPaused);
  const baseHealth = useGameStore((state) => state.baseHealth);
  const enemies = useGameStore((state) => state.enemies);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const setPhase = useGameStore((state) => state.setPhase);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (phase !== 'execute') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPaused) {
          resumeGame();
          startAutoAdvance();
        } else {
          pauseGame();
          stopAutoAdvance();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, isPaused, pauseGame, resumeGame]);

  // Start auto-advance when execution phase begins
  useEffect(() => {
    if (phase === 'execute' && currentTurn === 0 && !isPaused) {
      // Start the first turn after a delay
      setTimeout(() => {
        processTurn().then(() => {
          if (!useGameStore.getState().isPaused) {
            startAutoAdvance();
          }
        });
      }, 1000);
    }

    return () => {
      if (phase !== 'execute') {
        stopAutoAdvance();
      }
    };
  }, [phase, currentTurn, isPaused]);

  if (phase !== 'execute') return null;

  const getBaseEmoji = () => {
    if (baseHealth === 3) return '😊';
    if (baseHealth === 2) return '😬';
    if (baseHealth === 1) return '😱';
    return '💀';
  };

  const handleManualTurn = async () => {
    pauseGame();
    stopAutoAdvance();
    await processTurn();
  };

  const handleFastForward = async () => {
    pauseGame();
    stopAutoAdvance();
    await skipToEnd();
  };

  const handlePlayPause = () => {
    if (isPaused) {
      resumeGame();
      startAutoAdvance();
    } else {
      pauseGame();
      stopAutoAdvance();
    }
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl px-6 py-3 shadow-xl border border-gray-700">
        {/* Turn Counter */}
        <div className="flex items-center gap-6">
          {/* Turn Display */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Turn</div>
            <div className="text-2xl font-bold text-white">
              {currentTurn}/{maxTurns}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-gray-700" />

          {/* Base Health */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Base</div>
            <div className="flex items-center gap-1">
              <span className="text-2xl">{getBaseEmoji()}</span>
              <div className="flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < baseHealth
                        ? 'text-red-500 fill-red-500'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-gray-700" />

          {/* Enemy Count */}
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Enemies</div>
            <div className="text-2xl font-bold text-red-400">
              {enemies.length}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-gray-700" />

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Turn */}
            <button
              onClick={() => {
                pauseGame();
                stopAutoAdvance();
                // Implement turn replay if needed
              }}
              disabled={currentTurn === 0}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Turn"
            >
              <SkipBack className="w-5 h-5 text-gray-300" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
              title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-white" />
              ) : (
                <Pause className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Next Turn */}
            <button
              onClick={handleManualTurn}
              disabled={currentTurn >= maxTurns}
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Turn"
            >
              <SkipForward className="w-5 h-5 text-gray-300" />
            </button>

            {/* Fast Forward */}
            <button
              onClick={handleFastForward}
              disabled={currentTurn >= maxTurns}
              className="p-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Fast Forward to End"
            >
              <FastForward className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Status Text */}
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-400">
            {isPaused ? 'PAUSED' : 'AUTO-ADVANCING'} • Press SPACE to {isPaused ? 'resume' : 'pause'}
          </div>
        </div>
      </div>
    </div>
  );
};