import { useGameStore, type Commander } from '../store/useGameStore';

const CommanderAvatar = ({ commander }: { commander: Commander }) => {
  return (
    <div className="flex items-start gap-3 flex-1">
      {/* Avatar - using inline styles to ensure colors work */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
        style={{ backgroundColor: commander.colors.bg }}
      >
        {commander.name[0]}
      </div>

      {/* Speech Bubble */}
      <div className="flex-1">
        <div className="text-white text-sm font-semibold mb-1">{commander.name}</div>
        <div
          className="bg-gray-800 border-2 rounded-lg px-3 py-2 relative"
          style={{ borderColor: commander.colors.border }}
        >
          {/* Speech bubble tail */}
          <div
            className="absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8"
            style={{ borderRightColor: commander.colors.border }}
          ></div>
          <p className="text-white text-sm">{commander.interpretation}</p>
        </div>
      </div>
    </div>
  );
};

export const CommanderPanel = () => {
  const commanders = useGameStore((state) => state.commanders);
  const phase = useGameStore((state) => state.phase);

  // Hide during curate phase
  if (phase === 'curate') {
    return null;
  }

  return (
    <div className="bg-gray-950 border-t border-gray-700 p-4">
      <div className="flex gap-4 max-w-7xl mx-auto">
        {commanders.map((commander) => (
          <CommanderAvatar key={commander.id} commander={commander} />
        ))}
      </div>
    </div>
  );
};

