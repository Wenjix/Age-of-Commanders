import { create } from 'zustand';
import type { TurnLogEntry, CommanderThought } from '../types/turnLog';

export type Personality = 'literalist' | 'paranoid' | 'optimist';
export type GamePhase = 'draft' | 'curate' | 'teach' | 'execute' | 'debrief';
export type UITheme = 'dark-blur' | 'frosted-glass';

export interface CommanderColors {
  bg: string;
  border: string;
}

export type BuildingType = 'wall' | 'tower' | 'decoy' | 'mine' | 'farm';

export interface Action {
  type: 'build';
  building: BuildingType;
  position: [number, number];
}

export interface Building {
  position: [number, number];
  type: BuildingType;
  ownerId: string;
  revealed: boolean; // For blind build & reveal
}

export interface Enemy {
  id: string;
  position: [number, number];
  health: number;
  targetPosition: [number, number];
  isDistracted: boolean;
  label: string; // Comedic name like "Confused Invader"
  markedForDeath?: boolean; // Tower will destroy next turn
}

export interface Commander {
  id: string;
  name: string;
  personality: Personality;
  interpretation: string;
  colors: CommanderColors;
  executionPlan: Action[];
  secretBuilds: Building[]; // Hidden until reveal
  currentActionIndex: number;
}

interface GameState {
  wood: number;
  basePosition: { x: number; y: number };
  baseHealth: number; // Base can take 3 hits
  buildings: Building[];
  enemies: Enemy[];
  enabledBuildings: BuildingType[]; // Player-selected buildings (3 max)
  setEnabledBuildings: (buildings: BuildingType[]) => void;
  resetZoom: (() => void) | null;
  setResetZoom: (fn: (() => void) | null) => void;
  commanders: Commander[];
  updateCommanderInterpretation: (id: string, interpretation: string) => void;
  updateCommanderExecutionPlan: (id: string, executionPlan: Action[]) => void;
  updateCommanderSecretBuilds: (id: string, builds: Building[]) => void;
  updateCommanderActionIndex: (id: string, index: number) => void;
  updateCommanderName: (id: string, name: string) => void;
  updateCommanderColor: (id: string, colors: CommanderColors) => void;
  placeBuilding: (building: Building) => boolean;
  placeDebugBuilding: (building: Building) => boolean;
  removeBuilding: (x: number, y: number) => boolean;
  isTileOccupied: (x: number, y: number) => boolean;
  deductWood: (amount: number) => boolean;
  addWood: (amount: number) => void;
  revealAllBuildings: () => void;
  spawnEnemy: (enemy: Enemy) => void;
  updateEnemy: (id: string, updates: Partial<Enemy>) => void;
  removeEnemy: (id: string) => void;
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  uiTheme: UITheme;
  setUiTheme: (theme: UITheme) => void;
  apiKey: string | null;
  setApiKey: (key: string) => void;
  concurrencyLimit: number;
  setConcurrencyLimit: (limit: number) => void;
  debriefPanelWidth: number; // 0 = hidden, 60 = collapsed tab, 600 = expanded panel
  setDebriefPanelWidth: (width: number) => void;
  revealingBuildings: boolean; // Track if reveal animation is in progress
  setRevealingBuildings: (revealing: boolean) => void;
  revealBuilding: (x: number, y: number) => void; // Reveal individual building

  // Turn system state
  currentTurn: number;
  maxTurns: number;
  isPaused: boolean;
  turnSpeed: number; // Milliseconds between auto-advance
  turnLog: TurnLogEntry[];
  commanderThoughts: CommanderThought[]; // Current thoughts being displayed

  // Turn system actions
  setCurrentTurn: (turn: number) => void;
  nextTurn: () => void;
  previousTurn: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setTurnSpeed: (speed: number) => void;
  addTurnLogEntry: (entry: TurnLogEntry) => void;
  clearTurnLog: () => void;
  addCommanderThought: (thought: CommanderThought) => void;
  clearCommanderThoughts: () => void;
  damageBase: () => void;

  resetGame: () => void;
}

const initialCommanders: Commander[] = [
  {
    id: 'larry',
    name: 'Larry',
    personality: 'literalist',
    interpretation: 'Awaiting command...',
    colors: { bg: '#6B7280', border: '#6B7280' }, // Gray
    executionPlan: [],
    secretBuilds: [],
    currentActionIndex: 0,
  },
  {
    id: 'paul',
    name: 'Paul',
    personality: 'paranoid',
    interpretation: 'Is this a test?',
    colors: { bg: '#EF4444', border: '#EF4444' }, // Red
    executionPlan: [],
    secretBuilds: [],
    currentActionIndex: 0,
  },
  {
    id: 'olivia',
    name: 'Olivia',
    personality: 'optimist',
    interpretation: "Let's make friends!",
    colors: { bg: '#22C55E', border: '#22C55E' }, // Green
    executionPlan: [],
    secretBuilds: [],
    currentActionIndex: 0,
  },
];

export const useGameStore = create<GameState>((set, get) => ({
  wood: 50,
  basePosition: { x: 12, y: 12 },
  baseHealth: 3,
  buildings: [],
  enemies: [],
  enabledBuildings: [],
  setEnabledBuildings: (buildings) => set({ enabledBuildings: buildings }),
  resetZoom: null,
  setResetZoom: (fn) => set({ resetZoom: fn }),
  commanders: initialCommanders,

  // Turn system initial state
  currentTurn: 0,
  maxTurns: 10,
  isPaused: false,
  turnSpeed: 2000,
  turnLog: [],
  commanderThoughts: [],
  
  updateCommanderInterpretation: (id, interpretation) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, interpretation } : c
      ),
    })),
    
  updateCommanderExecutionPlan: (id, executionPlan) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, executionPlan } : c
      ),
    })),
    
  updateCommanderSecretBuilds: (id, builds) =>
    set((state) => ({
      commanders: state.commanders.map((c) =>
        c.id === id ? { ...c, secretBuilds: builds } : c
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
    
  placeBuilding: (building) => {
    const state = get();
    const [x, y] = building.position;
    
    if (state.isTileOccupied(x, y)) {
      return false;
    }
    
    set((state) => ({
      buildings: [...state.buildings, building],
    }));
    return true;
  },
  
  placeDebugBuilding: (building) => {
    set((state) => ({
      buildings: [...state.buildings, building],
    }));
    return true;
  },
  
  removeBuilding: (x, y) => {
    const state = get();
    const buildingIndex = state.buildings.findIndex(
      (b) => b.position[0] === x && b.position[1] === y
    );
    
    if (buildingIndex === -1) {
      return false;
    }
    
    set((state) => ({
      buildings: state.buildings.filter((_, i) => i !== buildingIndex),
    }));
    return true;
  },
  
  isTileOccupied: (x, y) => {
    const state = get();
    const { basePosition, buildings } = state;
    
    // Check if it's the base (2x2)
    if (
      x >= basePosition.x &&
      x < basePosition.x + 2 &&
      y >= basePosition.y &&
      y < basePosition.y + 2
    ) {
      return true;
    }
    
    // Check if there's a building
    return buildings.some((b) => b.position[0] === x && b.position[1] === y);
  },
  
  deductWood: (amount) => {
    const state = get();
    if (state.wood < amount) {
      return false;
    }
    set((state) => ({ wood: state.wood - amount }));
    return true;
  },
  
  addWood: (amount) => {
    set((state) => ({ wood: state.wood + amount }));
  },
  
  revealAllBuildings: () => {
    set((state) => ({
      buildings: state.buildings.map((b) => ({ ...b, revealed: true })),
    }));
  },
  
  spawnEnemy: (enemy) => {
    set((state) => ({
      enemies: [...state.enemies, enemy],
    }));
  },
  
  updateEnemy: (id, updates) => {
    set((state) => ({
      enemies: state.enemies.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  },
  
  removeEnemy: (id) => {
    set((state) => ({
      enemies: state.enemies.filter((e) => e.id !== id),
    }));
  },

  phase: 'draft',
  setPhase: (phase) => set({ phase }),
  uiTheme: 'frosted-glass',
  setUiTheme: (theme) => set({ uiTheme: theme }),
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  setApiKey: (key) => set({ apiKey: key }),
  concurrencyLimit: 3,
  setConcurrencyLimit: (limit) => set({ concurrencyLimit: limit }),
  debriefPanelWidth: 0,
  setDebriefPanelWidth: (width) => set({ debriefPanelWidth: width }),
  revealingBuildings: false,
  setRevealingBuildings: (revealing) => set({ revealingBuildings: revealing }),

  revealBuilding: (x, y) => {
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.position[0] === x && b.position[1] === y
          ? { ...b, revealed: true }
          : b
      ),
    }));
  },

  // Turn system actions
  setCurrentTurn: (turn) => set({ currentTurn: turn }),

  nextTurn: () => {
    const state = get();
    if (state.currentTurn < state.maxTurns) {
      set({ currentTurn: state.currentTurn + 1 });
    }
  },

  previousTurn: () => {
    const state = get();
    if (state.currentTurn > 0) {
      set({ currentTurn: state.currentTurn - 1 });
    }
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),
  setTurnSpeed: (speed) => set({ turnSpeed: speed }),

  addTurnLogEntry: (entry) => {
    set((state) => ({
      turnLog: [...state.turnLog, entry],
    }));
  },

  clearTurnLog: () => set({ turnLog: [] }),

  addCommanderThought: (thought) => {
    set((state) => ({
      commanderThoughts: [...state.commanderThoughts, thought],
    }));

    // Auto-remove thought after duration
    setTimeout(() => {
      set((state) => ({
        commanderThoughts: state.commanderThoughts.filter(
          (t) => t.commanderId !== thought.commanderId || t.text !== thought.text
        ),
      }));
    }, thought.duration);
  },

  clearCommanderThoughts: () => set({ commanderThoughts: [] }),

  damageBase: () => {
    const state = get();
    const newHealth = Math.max(0, state.baseHealth - 1);
    set({ baseHealth: newHealth });

    // Add to turn log
    state.addTurnLogEntry({
      turn: state.currentTurn,
      type: 'base_damaged',
      description: `Base took damage! Health: ${newHealth}/3`,
      impact: 'high',
      emoji: newHealth === 0 ? '💀' : newHealth === 1 ? '😱' : '😬',
    });

    if (newHealth === 0) {
      state.addTurnLogEntry({
        turn: state.currentTurn,
        type: 'defeat',
        description: 'The base has been destroyed! Glory in defeat!',
        impact: 'high',
        emoji: '💀',
      });
      set({ phase: 'debrief' });
    }
  },

  resetGame: () => {
    set({
      wood: 50,
      baseHealth: 3,
      buildings: [],
      enemies: [],
      enabledBuildings: [],
      commanders: initialCommanders,
      phase: 'draft',
      debriefPanelWidth: 0,
      revealingBuildings: false,
      currentTurn: 0,
      isPaused: false,
      turnLog: [],
      commanderThoughts: [],
    });
  },
}));

