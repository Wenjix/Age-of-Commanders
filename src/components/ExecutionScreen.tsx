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

  if (phase !== 'execute') return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="max-w-2xl w-full mx-4">
        {/* Main Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 animate-pulse">
            COMMANDERS BUILDING...
          </h1>
          <p className="text-gray-400 text-lg">
            Your commanders are executing their secret plans
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/50">
            <div className="text-6xl font-bold text-white">
              {timeLeft}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-gray-400 text-sm mt-2">
            {Math.round(progress)}% Complete
          </p>
        </div>

        {/* Commander Status Messages */}
        <div className="space-y-4">
          {commanders.map((commander) => (
            <div
              key={commander.id}
              className="bg-gray-900 border-2 rounded-lg p-4 flex items-center gap-4"
              style={{ borderColor: commander.colors.border }}
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                style={{ backgroundColor: commander.colors.bg }}
              >
                {commander.name[0]}
              </div>

              {/* Status */}
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">
                  {commander.name}
                </div>
                <div className="text-gray-400 text-sm flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  {commanderMessages[commander.id]}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suspense Text */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm italic">
            Buildings will be revealed when construction is complete...
          </p>
        </div>
      </div>
    </div>
  );
};

