import { create } from 'zustand';

export type Personality = 'literalist' | 'paranoid' | 'optimist';

export interface Commander {
  id: string;
  name: string;
  personality: Personality;
  interpretation: string;
}

interface GameState {
  wood: number;
  basePosition: { x: number; y: number };
  resetZoom: (() => void) | null;
  setResetZoom: (fn: (() => void) | null) => void;
  commanders: Commander[];
}

export const useGameStore = create<GameState>((set) => ({
  wood: 50,
  basePosition: { x: 12, y: 12 },
  resetZoom: null,
  setResetZoom: (fn) => set({ resetZoom: fn }),
  commanders: [
    {
      id: 'larry',
      name: 'Larry',
      personality: 'literalist',
      interpretation: 'Awaiting command...',
    },
    {
      id: 'paul',
      name: 'Paul',
      personality: 'paranoid',
      interpretation: 'Is this a test?',
    },
    {
      id: 'olivia',
      name: 'Olivia',
      personality: 'optimist',
      interpretation: "Let's make friends!",
    },
  ],
}));

