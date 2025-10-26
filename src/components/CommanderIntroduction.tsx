import { useState } from 'react';
import { useGameStore, type Commander } from '../store/useGameStore';
import { getThemeStyles } from '../utils/themeStyles';

const personalityDescriptions = {
  literalist: 'Interprets commands word-for-word. Never assumes intent. Robotic precision.',
  paranoid: 'Believes everything is a trap. The enemy is always watching. Over-prepares for threats.',
  optimist: 'Sees friendship everywhere. Enemies are just misunderstood guests seeking connection.',
  ruthless: 'Relentlessly hunts down opponents. Every order is a chance to eliminate threats.',
  trickster: 'Loves pranks and misdirection. Tricks both friends and foes with creative chaos.',
};

const personalityExamples = {
  literalist: [
    { command: '"Build defenses"', result: 'Builds exactly 1 wall. "You said defenses, not how many."' },
    { command: '"Prepare for attack"', result: 'Stands ready. "You didn\'t say to build anything."' },
  ],
  paranoid: [
    { command: '"Build a wall"', result: 'Builds 10 walls in a fortress. "They\'re planning something."' },
    { command: '"Scout ahead"', result: 'Builds towers everywhere. "We need eyes on all sides!"' },
  ],
  optimist: [
    { command: '"Defend the base"', result: 'Builds a welcome sign. "Let\'s greet our new friends!"' },
    { command: '"Stop the enemies"', result: 'Builds a party hall. "They just need snacks!"' },
  ],
  ruthless: [
    { command: '"Defend the base"', result: 'Builds mine traps everywhere. "Let them come. They won\'t leave."' },
    { command: '"Build defenses"', result: 'Creates a kill zone with towers. "The best defense is elimination."' },
  ],
  trickster: [
    { command: '"Build a wall"', result: 'Builds decoys instead. "Why walls when you can confuse them?"' },
    { command: '"Defend the base"', result: 'Builds fake bases everywhere. "Good luck finding the real one!"' },
  ],
};

// Unlockable commanders (for demo showcase only)
const unlockableCommanders: Commander[] = [
  {
    id: 'ruth',
    name: 'Ruth',
    personality: 'ruthless',
    interpretation: 'Target acquired...',
    colors: { bg: '#9333EA', border: '#9333EA' }, // Purple
    avatarImage: '/assets/Gemini_Ruth.png',
    executionPlan: [],
    secretBuilds: [],
    currentActionIndex: 0,
    act1Builds: [],
    act2Builds: [],
    act3Builds: [],
    act1ActionIndex: 0,
    act2ActionIndex: 0,
    act3ActionIndex: 0,
  },
  {
    id: 'tom',
    name: 'Tom',
    personality: 'trickster',
    interpretation: 'Let the games begin!',
    colors: { bg: '#F97316', border: '#F97316' }, // Orange
    avatarImage: '/assets/Gemini_Tom.png',
    executionPlan: [],
    secretBuilds: [],
    currentActionIndex: 0,
    act1Builds: [],
    act2Builds: [],
    act3Builds: [],
    act1ActionIndex: 0,
    act2ActionIndex: 0,
    act3ActionIndex: 0,
  },
];

const CommanderCard = ({ commander, theme, locked = false }: { commander: Commander; theme: ReturnType<typeof getThemeStyles>; locked?: boolean }) => {
  return (
    <div className={`flex flex-col items-center gap-3 flex-1 max-w-xs relative ${locked ? 'opacity-70' : ''}`}>
      {/* Locked Badge Overlay */}
      {locked && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 flex items-center gap-1">
          <span>🔒</span>
          <span>LOCKED</span>
        </div>
      )}

      {/* Large Avatar */}
      <img
        src={commander.avatarImage}
        alt={`${commander.name} portrait`}
        className={`w-24 h-24 rounded-full object-cover border-4 ${theme.commanderCardShadow} ${locked ? 'grayscale' : ''}`}
        style={{ borderColor: commander.colors.border }}
      />

      {/* Name */}
      <h3 className={`text-2xl font-bold ${theme.headingText}`}>{commander.name}</h3>

      {/* Personality Badge */}
      <div
        className="px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow-lg"
        style={{ backgroundColor: commander.colors.bg }}
      >
        {commander.personality.charAt(0).toUpperCase() + commander.personality.slice(1)}
      </div>

      {/* Description */}
      <p className={`text-center text-sm leading-relaxed px-4 ${theme.bodyText}`}>
        {personalityDescriptions[commander.personality]}
      </p>
    </div>
  );
};

const LearnMoreModal = ({ onClose }: { onClose: () => void }) => {
  const commanders = useGameStore((state) => state.commanders);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          How Commanders Interpret Orders
        </h2>

        {/* Commander Examples */}
        <div className="space-y-8">
          {commanders.map((commander) => (
            <div key={commander.id} className="border-t border-gray-700 pt-6 first:border-0 first:pt-0">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={commander.avatarImage}
                  alt={`${commander.name} portrait`}
                  className="w-12 h-12 rounded-full object-cover border-2"
                  style={{ borderColor: commander.colors.border }}
                />
                <div>
                  <h3 className="text-xl font-bold text-white">{commander.name}</h3>
                  <p className="text-sm text-gray-400">
                    {commander.personality.charAt(0).toUpperCase() + commander.personality.slice(1)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 ml-15">
                {personalityExamples[commander.personality].map((example, idx) => (
                  <div key={idx} className="bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Command:</div>
                    <div className="text-white font-mono mb-2">{example.command}</div>
                    <div className="text-sm text-gray-400 mb-1">Result:</div>
                    <div className="text-green-400 italic">{example.result}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};

export const CommanderIntroduction = () => {
  const phase = useGameStore((state) => state.phase);
  const setPhase = useGameStore((state) => state.setPhase);
  const commanders = useGameStore((state) => state.commanders);
  const uiTheme = useGameStore((state) => state.uiTheme);
  const [showModal, setShowModal] = useState(false);

  // Only show during draft phase
  if (phase !== 'draft') {
    return null;
  }

  const theme = getThemeStyles(uiTheme);

  return (
    <>
      {/* Main Introduction Screen */}
      <div className={`fixed inset-0 z-50 overflow-y-auto ${theme.overlayBackground} ${theme.overlayBackdrop}`}>
        <div className="max-w-6xl w-full mx-auto pt-24 pb-8 px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className={`text-5xl font-bold mb-4 ${theme.headingText}`}>
              Meet Your Commanders
            </h1>
            <p className={`text-xl ${theme.mutedText}`}>
              Each commander interprets your orders through their unique personality
            </p>
          </div>

          {/* Active Squad Section */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold mb-6 text-center ${theme.headingText}`}>
              Your Squad
            </h2>
            <div className="flex gap-8 justify-center">
              {commanders.map((commander) => (
                <CommanderCard key={commander.id} commander={commander} theme={theme} />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mb-12">
            <button
              onClick={() => setShowModal(true)}
              className={`text-white font-bold py-4 px-8 rounded-lg transition-all text-lg ${theme.secondaryButtonBackground} ${theme.secondaryButtonHover}`}
            >
              Learn More
            </button>
            <button
              onClick={() => setPhase('curate')}
              className={`text-white font-bold py-4 px-8 rounded-lg transition-all text-lg flex items-center gap-2 ${theme.primaryButtonBackground} ${theme.primaryButtonHover}`}
            >
              Start Mission
              <span className="text-xl">→</span>
            </button>
          </div>

          {/* Separator */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center">
              <span className={`px-4 text-sm ${theme.mutedText} bg-gray-900`}>
                More commanders await...
              </span>
            </div>
          </div>

          {/* Unlockable Commanders Section */}
          <div>
            <h2 className={`text-2xl font-bold mb-6 text-center ${theme.headingText}`}>
              Unlockable Commanders
            </h2>
            <div className="flex gap-8 justify-center">
              {unlockableCommanders.map((commander) => (
                <CommanderCard key={commander.id} commander={commander} theme={theme} locked />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Modal */}
      {showModal && <LearnMoreModal onClose={() => setShowModal(false)} />}
    </>
  );
};
