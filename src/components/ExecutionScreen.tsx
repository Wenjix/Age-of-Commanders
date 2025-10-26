import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

const EXECUTION_DURATION = 5000; // 5 seconds

const COMMANDER_MESSAGES = {
  literalist: [
    'Calculating optimal positions...',
    'Executing build sequence...',
    'Verifying structural integrity...',
    'Finalizing construction...',
  ],
  paranoid: [
    'Fortifying all perimeters...',
    'Setting up defensive layers...',
    'Preparing for worst case...',
    'Triple-checking security...',
  ],
  optimist: [
    'Creating welcoming spaces...',
    'Spreading joy and friendship...',
    'Building happy places...',
    'Making everything beautiful...',
  ],
};

export const ExecutionScreen = () => {
  const phase = useGameStore((state) => state.phase);
  const commanders = useGameStore((state) => state.commanders);
  const [timeLeft, setTimeLeft] = useState(EXECUTION_DURATION / 1000);
  const [progress, setProgress] = useState(0);
  const [commanderMessages, setCommanderMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (phase !== 'execute') return;

    // Initialize messages
    const initialMessages: Record<string, string> = {};
    commanders.forEach((commander) => {
      const messages = COMMANDER_MESSAGES[commander.personality];
      initialMessages[commander.id] = messages[0];
    });
    setCommanderMessages(initialMessages);

    // Countdown timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, EXECUTION_DURATION - elapsed);
      const seconds = Math.ceil(remaining / 1000);
      const progressPercent = Math.min(100, (elapsed / EXECUTION_DURATION) * 100);

      setTimeLeft(seconds);
      setProgress(progressPercent);

      // Update commander messages based on progress
      if (progressPercent >= 25 && progressPercent < 50) {
        commanders.forEach((commander) => {
          const messages = COMMANDER_MESSAGES[commander.personality];
          setCommanderMessages((prev) => ({
            ...prev,
            [commander.id]: messages[1],
          }));
        });
      } else if (progressPercent >= 50 && progressPercent < 75) {
        commanders.forEach((commander) => {
          const messages = COMMANDER_MESSAGES[commander.personality];
          setCommanderMessages((prev) => ({
            ...prev,
            [commander.id]: messages[2],
          }));
        });
      } else if (progressPercent >= 75) {
        commanders.forEach((commander) => {
          const messages = COMMANDER_MESSAGES[commander.personality];
          setCommanderMessages((prev) => ({
            ...prev,
            [commander.id]: messages[3],
          }));
        });
      }

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [phase, commanders]);

  // Disabled - using ExecutionHUD instead for turn-based execution
  // The original loading screen showed a countdown timer and commander messages
  // Now replaced with real-time turn-based execution
  return null;
};

