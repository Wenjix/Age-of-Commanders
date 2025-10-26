import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export const ExecutionScreen = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);

  useEffect(() => {
    // Component disabled - using ExecutionHUD for turn-based execution
    // Original countdown/loading logic has been replaced
  }, [phase, commanders]);

  // Disabled - using ExecutionHUD instead for turn-based execution
  // The original loading screen showed a countdown timer and commander messages
  // Now replaced with real-time turn-based execution
  return null;
};

