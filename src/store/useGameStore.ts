import { create } from 'zustand';

interface GameState {
  wood: number;
  basePosition: { x: number; y: number };
  resetZoom: (() => void) | null;
  setResetZoom: (fn: (() => void) | null) => void;
}

export const useGameStore = create<GameState>((set) => ({
  wood: 50,
  basePosition: { x: 12, y: 12 },
  resetZoom: null,
  setResetZoom: (fn) => set({ resetZoom: fn }),
}));

