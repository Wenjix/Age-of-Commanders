import { useGameStore, type Commander } from '../store/useGameStore';

const getPersonalityColors = (personality: string) => {
  switch (personality) {
    case 'literalist':
      return {
        avatar: '#6B7280', // gray-500
        border: '#9CA3AF', // gray-400
      };
    case 'paranoid':
      return {
        avatar: '#EF4444', // red-500
        border: '#EF4444', // red-500
      };
    case 'optimist':
      return {
        avatar: '#22C55E', // green-500
        border: '#22C55E', // green-500
      };
    default:
      return {
        avatar: '#6B7280',
        border: '#9CA3AF',
      };
  }
};

const CommanderAvatar = ({ commander }: { commander: Commander }) => {
  const colors = getPersonalityColors(commander.personality);

  return (
    <div className="flex items-start gap-3 flex-1">
      {/* Avatar - using inline styles to ensure colors work */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
        style={{ backgroundColor: colors.avatar }}
      >
        {commander.name[0]}
      </div>

      {/* Speech Bubble */}
      <div className="flex-1">
        <div className="text-white text-sm font-semibold mb-1">{commander.name}</div>
        <div 
          className="bg-gray-800 border-2 rounded-lg px-3 py-2 relative"
          style={{ borderColor: colors.border }}
        >
          {/* Speech bubble tail */}
          <div 
            className="absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8"
            style={{ borderRightColor: colors.border }}
          ></div>
          <p className="text-white text-sm">{commander.interpretation}</p>
        </div>
      </div>
    </div>
  );
};

export const CommanderPanel = () => {
  const commanders = useGameStore((state) => state.commanders);

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

