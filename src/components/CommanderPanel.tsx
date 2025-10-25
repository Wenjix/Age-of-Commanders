import { useGameStore, type Commander, type Personality } from '../store/useGameStore';

const getPersonalityColor = (personality: Personality): string => {
  switch (personality) {
    case 'literalist':
      return 'border-gray-400';
    case 'paranoid':
      return 'border-red-500';
    case 'optimist':
      return 'border-green-500';
  }
};

const getAvatarColor = (personality: Personality): string => {
  switch (personality) {
    case 'literalist':
      return 'bg-gray-500';
    case 'paranoid':
      return 'bg-red-500';
    case 'optimist':
      return 'bg-green-500';
  }
};

const CommanderAvatar = ({ commander }: { commander: Commander }) => {
  const borderColor = getPersonalityColor(commander.personality);
  const avatarColor = getAvatarColor(commander.personality);

  return (
    <div className="flex items-start gap-3 p-4 bg-gray-900 rounded-lg">
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
        {commander.name[0]}
      </div>

      {/* Speech Bubble */}
      <div className="flex-1">
        <div className="text-white text-sm font-semibold mb-1">{commander.name}</div>
        <div className={`bg-gray-800 border-2 ${borderColor} rounded-lg px-3 py-2 relative`}>
          {/* Speech bubble tail */}
          <div className={`absolute -left-2 top-3 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 ${borderColor.replace('border-', 'border-r-')}`}></div>
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

