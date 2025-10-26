import { useState } from 'react';
import { useGameStore, type Commander } from '../store/useGameStore';
import { getThemeStyles } from '../utils/themeStyles';

const personalityDescriptions = {
  literalist: 'Interprets commands word-for-word. Never assumes intent. Robotic precision.',
  paranoid: 'Believes everything is a trap. The enemy is always watching. Over-prepares for threats.',
  optimist: 'Sees friendship everywhere. Enemies are just misunderstood guests seeking connection.',
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
};

const CommanderCard = ({ commander, theme }: { commander: Commander; theme: ReturnType<typeof getThemeStyles> }) => {
  return (
    <div className="flex flex-col items-center gap-3 flex-1 max-w-xs">
      {/* Large Avatar */}
      <div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl ${theme.commanderCardShadow}`}
        style={{ backgroundColor: commander.colors.bg }}
      >
        {commander.name[0]}
      </div>

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
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: commander.colors.bg }}
                >
                  {commander.name[0]}
                </div>
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
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-8 ${theme.overlayBackground} ${theme.overlayBackdrop}`}>
        <div className="max-w-6xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className={`text-5xl font-bold mb-4 ${theme.headingText}`}>
              Meet Your Commanders
            </h1>
            <p className={`text-xl ${theme.mutedText}`}>
              Each commander interprets your orders through their unique personality
            </p>
          </div>

          {/* Commander Cards */}
          <div className="flex gap-8 justify-center mb-12">
            {commanders.map((commander) => (
              <CommanderCard key={commander.id} commander={commander} theme={theme} />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
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
        </div>
      </div>

      {/* Learn More Modal */}
      {showModal && <LearnMoreModal onClose={() => setShowModal(false)} />}
    </>
  );
};
