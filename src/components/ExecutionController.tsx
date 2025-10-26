import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import toast from 'react-hot-toast';
import { stopAutoAdvance } from '../services/turnManager';
import { IntermissionPanel } from './IntermissionPanel';

export const ExecutionController = () => {
  const phase = useGameStore((state) => state.phase);
  const setPhase = useGameStore((state) => state.setPhase);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const maxTurns = useGameStore((state) => state.maxTurns);
  const baseHealth = useGameStore((state) => state.baseHealth);
  const isIntermission = useGameStore((state) => state.isIntermission);
  const clearTurnLog = useGameStore((state) => state.clearTurnLog);
  const setCurrentTurn = useGameStore((state) => state.setCurrentTurn);
  const switchToAct = useGameStore((state) => state.switchToAct);

  const [executionStarted, setExecutionStarted] = useState(false);

  useEffect(() => {
    if (phase !== 'execute' || executionStarted) return;

    setExecutionStarted(true);

    // Reset turn system for new execution
    clearTurnLog();
    setCurrentTurn(0);

    // CRITICAL: Initialize Act 1
    switchToAct(1);

    // REMOVED: spawnInitialWave() call - now handled by processTurn()

    toast.success('Execution phase started! Prepare for battle...', {
      duration: 3000,
      icon: '⚔️'
    });

  }, [phase, executionStarted, clearTurnLog, setCurrentTurn, switchToAct]);

  // Monitor for defeat condition (REVISED - removed early victory)
  useEffect(() => {
    if (phase !== 'execute' || isIntermission) return;

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

    // REMOVED: Early victory check (all enemies defeated)
    // REMOVED: Max turns check (handled in processTurn now)

  }, [phase, baseHealth, isIntermission, currentTurn, maxTurns, setPhase]);

  // Reset execution started when phase changes away from execute
  useEffect(() => {
    if (phase !== 'execute') {
      setExecutionStarted(false);
      stopAutoAdvance();
    }
  }, [phase]);

  // Render intermission panel if in intermission
  if (phase === 'execute' && isIntermission) {
    return <IntermissionPanel />;
  }

  return null;
};

