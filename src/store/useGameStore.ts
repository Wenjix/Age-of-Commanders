import { create } from 'zustand';

interface GameState {
  wood: number;
  basePosition: { x: number; y: number };
}

export const useGameStore = create<GameState>(() => ({
  wood: 50,
  basePosition: { x: 10, y: 10 },
}));

