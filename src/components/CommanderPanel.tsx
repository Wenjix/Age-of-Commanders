import { useState, useEffect, useRef } from 'react';
import { useGameStore, type Commander } from '../store/useGameStore';
import { cleanTextForDisplay } from '../utils/textFormatting';

interface CommanderAvatarProps {
  commander: Commander;
  displayText: string;
  showCursor: boolean;
}

const CommanderAvatar = ({ commander, displayText, showCursor }: CommanderAvatarProps) => {
  return (
    <div className="flex items-start gap-3 flex-1">
      {/* Avatar - Portrait Image */}
      <img
        src={commander.avatarImage}
        alt={`${commander.name} portrait`}
        className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
        style={{ borderColor: commander.colors.border }}
      />

      {/* Speech Bubble */}
      <div className="flex-1">
        <div className="text-white text-sm font-semibold mb-1">{commander.name}</div>
        <div
          className="bg-gray-800 border-2 rounded-lg px-3 py-2 relative min-h-[60px]"
          style={{ borderColor: commander.colors.border }}
        >
          {/* Speech bubble tail */}
          <div
            className="absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8"
            style={{ borderRightColor: commander.colors.border }}
          ></div>
          <p className="text-white text-sm whitespace-pre-wrap">
            {displayText}
            {showCursor && <span className="animate-pulse">▊</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

export const CommanderPanel = () => {
  const commanders = useGameStore((state) => state.commanders);
  const phase = useGameStore((state) => state.phase);
  const [isExpanded, setIsExpanded] = useState(false);

  // Streaming state - track displayed text per commander
  const [streamingText, setStreamingText] = useState<Record<string, string>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const cleanedTextsRef = useRef<Record<string, string>>({});

  // Clean and cache commander interpretations
  useEffect(() => {
    const cleaned: Record<string, string> = {};
    commanders.forEach((commander) => {
      cleaned[commander.id] = cleanTextForDisplay(commander.interpretation || '');
    });
    cleanedTextsRef.current = cleaned;
  }, [commanders]);

  // Start streaming effect when panel expands
  useEffect(() => {
    if (isExpanded && !isStreaming) {
      // Initialize streaming text to empty
      const initialText: Record<string, string> = {};
      commanders.forEach((commander) => {
        initialText[commander.id] = '';
      });
      setStreamingText(initialText);
      setIsStreaming(true);

      // Streaming speed: ~40 characters per second
      const charsPerInterval = 2;
      const intervalMs = 50;

      let currentIndex = 0;
      intervalRef.current = window.setInterval(() => {
        currentIndex += charsPerInterval;

        const newText: Record<string, string> = {};
        let allComplete = true;

        commanders.forEach((commander) => {
          const fullText = cleanedTextsRef.current[commander.id] || '';
          if (currentIndex < fullText.length) {
            newText[commander.id] = fullText.substring(0, currentIndex);
            allComplete = false;
          } else {
            newText[commander.id] = fullText;
          }
        });

        setStreamingText(newText);

        if (allComplete) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsStreaming(false);
        }
      }, intervalMs);
    }

    // Cleanup interval on unmount or when collapsed
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isExpanded, isStreaming, commanders]);

  // Reset streaming when panel collapses
  useEffect(() => {
    if (!isExpanded) {
      setIsStreaming(false);
      setStreamingText({});
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isExpanded]);

  // Hide during curate and debrief phases
  if (phase === 'curate' || phase === 'debrief') {
    return null;
  }

  return (
    <div className="bg-gray-950 border-t border-gray-700 transition-all duration-300">
      {!isExpanded ? (
        /* Collapsed State */
        <div className="px-4 py-2 flex items-center justify-center relative">
          {/* Center: Small avatars in a row */}
          <div className="flex items-center gap-2">
            {commanders.map((commander) => (
              <img
                key={commander.id}
                src={commander.avatarImage}
                alt={`${commander.name} portrait`}
                className="w-8 h-8 rounded-full object-cover border-2"
                style={{ borderColor: commander.colors.border }}
              />
            ))}
            <span className="text-gray-400 text-sm ml-2">Commanders Thinking...</span>
          </div>

          {/* Right: Expand button (absolute positioned) */}
          <button
            onClick={() => setIsExpanded(true)}
            className="absolute right-4 text-gray-400 hover:text-white transition-colors px-3 py-1 rounded text-sm"
          >
            ▲ Expand
          </button>
        </div>
      ) : (
        /* Expanded State */
        <div>
          {/* Collapse button bar */}
          <div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center">
            <span className="text-gray-400 text-sm">Commander Thoughts</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors px-3 py-1 rounded text-sm"
            >
              ▼ Collapse
            </button>
          </div>

          {/* Commander content (existing layout) */}
          <div className="p-4">
            <div className="flex gap-4 max-w-7xl mx-auto">
              {commanders.map((commander) => (
                <CommanderAvatar
                  key={commander.id}
                  commander={commander}
                  displayText={streamingText[commander.id] || cleanedTextsRef.current[commander.id] || ''}
                  showCursor={isStreaming}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

