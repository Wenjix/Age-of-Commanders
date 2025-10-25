import { create } from 'zustand';

export type Personality = 'literalist' | 'paranoid' | 'optimist';
export type GamePhase = 'draft' | 'teach' | 'execute' | 'debrief';

export interface CommanderColors {
  bg: string;
  border: string;
}

export type BuildingType = 'wall' | 'tower' | 'welcome-sign';

export interface Action {
  type: 'build';
  building: BuildingType;
  position: [number, number];
}

export interface Building {
  position: [number, number];
  type: BuildingType;
  ownerId: string;
}

export interface Commander {
  id: string;
  name: string;
  personality: Personality;
  interpretation: string;
  colors: CommanderColors;
  executionPlan: Action[];
  currentActionIndex: number;
}

interface GameState {
  wood: number;
  basePosition: { x: number; y: number };
  buildings: Building[];
  resetZoom: (() => void) | null;
  setResetZoom: (fn: (() => void) | null) => void;
  commanders: Commander[];
  updateCommanderInterpretation: (id: string, interpretation: string) => void;
  updateCommanderExecutionPlan: (id: string, executionPlan: Action[]) => void;
  updateCommanderActionIndex: (id: string, index: number) => void;
  updateCommanderName: (id: string, name: string) => void;
  updateCommanderColor: (id: string, colors: CommanderColors) => void;
  placeBuilding: (building: Building) => boolean;
  placeDebugBuilding: (building: Building) => boolean;
  removeBuilding: (x: number, y: number) => boolean;
  isTileOccupied: (x: number, y: number) => boolean;
  deductWood: (amount: number) => boolean;
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  apiKey: string | null;
  setApiKey: (key: string) => void;
  concurrencyLimit: number;
  setConcurrencyLimit: (limit: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  wood: 50,
  basePosition: { x: 12, y: 12 },
  buildings: [],
  resetZoom: null,
  setResetZoom: (fn) => set({ resetZoom: fn }),
  commanders: [
    {
      id: 'larry',
      name: 'Larry',
      personality: 'literalist',
      interpretation: 'Awaiting command...',
      colors: { bg: '#6B7280', border: '#6B7280' }, // Gray
      executionPlan: [],
      currentActionIndex: 0,
    },
    {
      id: 'paul',
      name: 'Paul',
      personality: 'paranoid',
      interpretation: 'Is this a test?',
      colors: { bg: '#EF4444', border: '#EF4444' }, // Red
      executionPlan: [],
      currentActionIndex: 0,
    },
    {
      id: 'olivia',
      name: 'Olivia',
      personality: 'optimist',
      interpretation: "Let's make friends!",
      colors: { bg: '#22C55E', border: '#22C55E' }, // Green
      executionPlan: [],
      currentActionIndex: 0,
    },
  ],
  updateCommanderInterpretation: (id, interpretation) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, interpretation } : c
      ),
    })),
  updateCommanderExecutionPlan: (id, executionPlan) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, executionPlan, currentActionIndex: 0 } : c
      ),
    })),
  updateCommanderActionIndex: (id, index) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, currentActionIndex: index } : c
      ),
    })),
  updateCommanderName: (id, name) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    })),
  updateCommanderColor: (id, colors) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, colors } : c
      ),
    })),
  isTileOccupied: (x, y) => {
    const state = get();
    const { basePosition, buildings } = state;

    // Check if tile is part of the 2x2 base
    if (
      x >= basePosition.x &&
      x < basePosition.x + 2 &&
      y >= basePosition.y &&
      y < basePosition.y + 2
    ) {
      return true;
    }

    // Check if tile has a building
    return buildings.some(
      (building) => building.position[0] === x && building.position[1] === y
    );
  },
  deductWood: (amount) => {
    const state = get();
    if (state.wood >= amount) {
      set({ wood: state.wood - amount });
      return true;
    }
    return false;
  },
  placeBuilding: (building) => {
    const state = get();
    const [x, y] = building.position;

    // Check if tile is occupied
    if (state.isTileOccupied(x, y)) {
      return false;
    }

    // Add building
    set((state) => ({
      buildings: [...state.buildings, building],
    }));
    return true;
  },
  placeDebugBuilding: (building) => {
    // Debug mode: bypass all checks and place building directly
    set((state) => {
      const newBuildings = [...state.buildings, building];
      return { buildings: newBuildings };
    });
    return true;
  },
  removeBuilding: (x, y) => {
    const state = get();
    const initialLength = state.buildings.length;

    set((state) => ({
      buildings: state.buildings.filter(
        (building) => building.position[0] !== x || building.position[1] !== y
      ),
    }));

    // Return true if a building was removed
    return get().buildings.length < initialLength;
  },
  phase: 'teach',
  setPhase: (phase) => set({ phase }),
  apiKey: import.meta.env.VITE_GEMINI_FLASH_LITE_KEY || null,
  setApiKey: (key) => set({ apiKey: key }),
  concurrencyLimit: 3,
  setConcurrencyLimit: (limit) => set({ concurrencyLimit: limit }),
}));

