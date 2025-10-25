import { useGameStore, type GamePhase } from '../store/useGameStore';

const PHASES: { id: GamePhase; label: string; icon: string }[] = [
  { id: 'curate', label: 'Curate', icon: '🏗️' },
  { id: 'teach', label: 'Teach', icon: '📝' },
  { id: 'execute', label: 'Execute', icon: '⚔️' },
  { id: 'debrief', label: 'Debrief', icon: '📊' },
];

export const PhaseIndicator = () => {
  const phase = useGameStore((state) => state.phase);

  const getPhaseIndex = (phaseId: GamePhase) => {
    return PHASES.findIndex((p) => p.id === phaseId);
  };

  const currentIndex = getPhaseIndex(phase);

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {PHASES.map((phaseItem, index) => {
            const isActive = phase === phaseItem.id;
            const isCompleted = index < currentIndex;

            return (
              <div key={phaseItem.id} className="flex items-center flex-1">
                {/* Phase Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300
                      ${
                        isActive
                          ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/50'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? '✓' : phaseItem.icon}
                  </div>
                  <span
                    className={`
                      text-xs mt-1 font-semibold transition-colors duration-300
                      ${
                        isActive
                          ? 'text-blue-400'
                          : isCompleted
                          ? 'text-green-400'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {phaseItem.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < PHASES.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-6">
                    <div
                      className={`
                        h-full transition-all duration-500
                        ${
                          index < currentIndex
                            ? 'bg-green-600'
                            : 'bg-gray-700'
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

