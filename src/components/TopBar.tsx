import { useGameStore } from '../store/useGameStore';

export const TopBar = () => {
  const wood = useGameStore((state) => state.wood);

  return (
    <div className="bg-gray-800 text-white px-4 py-2 flex items-center">
      <span className="font-semibold">Wood: {wood}</span>
    </div>
  );
};

