import { useGameStore } from '../store/useGameStore';
import { DebugMenu } from './DebugMenu';

export const TopBar = () => {
  const wood = useGameStore((state) => state.wood);
  const resetZoom = useGameStore((state) => state.resetZoom);
  const debriefPanelWidth = useGameStore((state) => state.debriefPanelWidth);
  const currentAct = useGameStore((state) => state.currentAct);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const phase = useGameStore((state) => state.phase);

  const handleResetZoom = () => {
    if (resetZoom) {
      resetZoom();
    }
  };

  return (
    <div
      className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between z-[100] relative transition-all duration-300"
      style={{ paddingLeft: `${debriefPanelWidth + 16}px` }}
    >
      <div className="flex items-center gap-4">
        <span className="font-semibold">Wood: {wood}</span>
        {phase === 'execute' && (
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">Act {currentAct}/3</span>
            <span className="text-slate-300">Turn {currentTurn}/24</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleResetZoom}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Reset Zoom
        </button>
        <DebugMenu />
      </div>
    </div>
  );
};

