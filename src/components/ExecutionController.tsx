import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import toast from 'react-hot-toast';
import { spawnInitialWave } from '../services/enemyService';
import { stopAutoAdvance } from '../services/turnManager';

export const ExecutionController = () => {
  const phase = useGameStore((state) => state.phase);
  const setPhase = useGameStore((state) => state.setPhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const maxTurns = useGameStore((state) => state.maxTurns);
  const baseHealth = useGameStore((state) => state.baseHealth);
  const enemies = useGameStore((state) => state.enemies);
  const clearTurnLog = useGameStore((state) => state.clearTurnLog);
  const setCurrentTurn = useGameStore((state) => state.setCurrentTurn);

  const [executionStarted, setExecutionStarted] = useState(false);

  useEffect(() => {
    if (phase !== 'execute' || executionStarted) return;

    setExecutionStarted(true);

    // Reset turn system for new execution
    clearTurnLog();
    setCurrentTurn(0);

    // Spawn initial enemy wave
    toast.success('Execution phase started! Enemy wave incoming...', {
      duration: 3000,
      icon: '⚔️'
    });

    // Spawn enemies after a short delay
    setTimeout(() => {
      spawnInitialWave();
    }, 500);

  }, [phase, executionStarted, clearTurnLog, setCurrentTurn]);

  // Monitor for game end conditions
  useEffect(() => {
    if (phase !== 'execute') return;

    // Check defeat condition
    if (baseHealth <= 0) {
      stopAutoAdvance();
      toast.error('Base destroyed! Glory in defeat!', {
        duration: 5000,
        icon: '💀'
      });
      setTimeout(() => {
        setPhase('debrief');
      }, 2000);
    }

    // Check victory condition
    if (enemies.length === 0 && currentTurn >= 3) {
      stopAutoAdvance();
      toast.success('All enemies defeated! Tactical victory!', {
        duration: 5000,
        icon: '🎉'
      });
      setTimeout(() => {
        setPhase('debrief');
      }, 2000);
    }

    // Check max turns reached
    if (currentTurn >= maxTurns) {
      stopAutoAdvance();
      if (enemies.length > 0) {
        toast.success(`Survived ${maxTurns} turns! Strategic victory!`, {
          duration: 5000,
          icon: '🏆'
        });
      }
      setTimeout(() => {
        setPhase('debrief');
      }, 2000);
    }
  }, [phase, baseHealth, enemies.length, currentTurn, maxTurns, setPhase]);

  // Reset execution started when phase changes away from execute
  useEffect(() => {
    if (phase !== 'execute') {
      setExecutionStarted(false);
      stopAutoAdvance();
    }
  }, [phase]);

  return null;
};

