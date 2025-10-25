import { useGameStore } from '../store/useGameStore';
import { DebugMenu } from './DebugMenu';

export const TopBar = () => {
  const wood = useGameStore((state) => state.wood);
  const resetZoom = useGameStore((state) => state.resetZoom);

  const handleResetZoom = () => {
    if (resetZoom) {
      resetZoom();
    }
  };

  return (
    <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
      <span className="font-semibold">Wood: {wood}</span>
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

