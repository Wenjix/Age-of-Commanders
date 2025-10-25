import { create } from 'zustand';

export type Personality = 'literalist' | 'paranoid' | 'optimist';
export type GamePhase = 'draft' | 'teach' | 'execute' | 'debrief';

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
  updateCommanderInterpretation: (id: string, interpretation: string) => void;
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  apiKey: string | null;
  setApiKey: (key: string) => void;
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
  updateCommanderInterpretation: (id, interpretation) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, interpretation } : c
      ),
    })),
  phase: 'teach',
  setPhase: (phase) => set({ phase }),
  apiKey: null,
  setApiKey: (key) => set({ apiKey: key }),
}));

