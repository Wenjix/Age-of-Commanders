# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Age of Commanders** (aka "Empire of Minds") is a comedic AI-powered strategy game built for the AI Games Hackathon 2025. Players give commands to three AI commanders with distinct personalities (Literalist, Paranoid, Optimist), who hilariously misinterpret instructions through LLM-powered interpretations. The game combines React + PixiJS 8 for rendering with Google's Gemini 2.5 Flash Lite for AI personalities.

## Development Commands

### Setup
```bash
pnpm install
```

### Development Server
```bash
pnpm dev
```

### Production Build
```bash
pnpm build
```

### Linting
```bash
pnpm lint
```

### Preview Production Build
```bash
pnpm preview
```

## Tech Stack

- **React 19** - UI framework
- **PixiJS 8** - WebGL rendering engine for 26x26 grid
- **Vite 7** - Build tool and dev server
- **TypeScript 5.9** - Type safety
- **Zustand 5** - State management
- **Tailwind CSS 4** - Styling
- **pnpm** - Package manager
- **Gemini 2.5 Flash Lite** - LLM for commander personalities

## Architecture

### State Management (Zustand)

The entire game state lives in `src/store/useGameStore.ts`:

- **Game Resources**: `wood` (initial: 50)
- **Base Position**: `basePosition` (x: 12, y: 12)
- **Commanders**: Array of 3 commanders (Larry, Paul, Olivia)
- **Game Phases**: `'draft' | 'teach' | 'execute' | 'debrief'`
- **API Key**: Gemini API key (in-memory only, never persisted)

### Component Structure

```
/src
  /components
    GameCanvas.tsx       # PixiJS 26x26 grid with camera controls
    TopBar.tsx           # Resource display + reset zoom button
    CommanderPanel.tsx   # Commander avatars + speech bubbles
    CommandInput.tsx     # Command input (teach phase only)
    ApiKeyModal.tsx      # Gemini API key prompt on first load
  /services
    llmService.ts        # Gemini API integration + caching
  /store
    useGameStore.ts      # Zustand global state
  App.tsx                # Main layout + toast provider
  main.tsx               # Entry point
```

### PixiJS Game Canvas

**Grid System** (`src/components/GameCanvas.tsx`):
- 26x26 tiles (each 32x32 pixels)
- Green grass tiles with dark green borders
- 2x2 red base building at center (x: 12, y: 12)
- All game objects rendered inside a `camera` Container for pan/zoom

**Camera Controls**:
- **Pan**: Click and drag to move camera
- **Zoom**: Mouse wheel (0.5x - 2x range)
- **Reset Zoom**: Button in TopBar
- Camera state managed via event listeners on canvas element

**Important**: The camera Container holds all visual elements. When adding new visual elements (buildings, units, enemies), add them to the `camera` Container, not directly to `app.stage`.

### LLM Integration

**Service Layer** (`src/services/llmService.ts`):
- Uses Google Gemini 2.5 Flash Lite API
- **Concurrency Control**: Max 3 simultaneous calls via `p-limit`
- **Caching**: localStorage (`commander_interpretation_{personality}_{command}`)
- **Fallback Responses**: Used when API fails or no key provided

**Personality System**:
```typescript
literalist: "You interpret instructions WORD-FOR-WORD. Never assume intent. Be robotic."
paranoid: "You believe everything is a trap. The enemy is always watching. Over-prepare."
optimist: "You see friendship everywhere. Enemies are just misunderstood guests!"
```

**API Configuration**:
- Model: `gemini-2.0-flash-lite`
- Temperature: 0.7
- Max Tokens: 200
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent`

### Game Flow

1. **First Load**: API key modal appears (user enters Gemini key or skips)
2. **Teach Phase**: User types command, all 3 commanders interpret simultaneously
3. **Execute Phase**: Commanders execute pre-computed plans (no LLM calls)
4. **Debrief Phase**: Show results + shareable quotes

**Phase Management**: Only show `CommandInput` during 'teach' phase. Interpretations appear in speech bubbles in `CommanderPanel`.

## Key Implementation Details

### Adding New Visual Elements to the Grid

When adding buildings, units, or enemies:

1. Calculate position in pixels: `x * TILE_SIZE`, `y * TILE_SIZE` (TILE_SIZE = 32)
2. Create PixiJS Graphics object
3. Add to the `camera` Container (NOT `app.stage`)
4. Store metadata in Zustand state for game logic

Example:
```typescript
const wall = new Graphics();
wall.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
wall.fill(0x8B4513); // Brown
camera.addChild(wall);
```

### Updating Commander Interpretations

Use the `updateCommanderInterpretation` action from Zustand:

```typescript
const updateCommanderInterpretation = useGameStore(
  (state) => state.updateCommanderInterpretation
);

updateCommanderInterpretation('larry', 'New interpretation text');
```

### Making LLM Calls

Use `interpretCommandForAllCommanders` from `llmService.ts`:

```typescript
import { interpretCommandForAllCommanders } from '../services/llmService';

const results = await interpretCommandForAllCommanders(
  command,
  commanders,
  apiKey
);

// results is a Map<string, string> of commander.id -> interpretation
```

### Toast Notifications

Use `react-hot-toast` for user feedback:

```typescript
import toast from 'react-hot-toast';

toast.success('Command sent!');
toast.error('API call failed');
toast.loading('Processing...');
```

### Avatar Colors

Commander avatars use inline styles (not Tailwind classes) to ensure colors display:

```typescript
literalist: { bg: '#6B7280', border: '#6B7280' }  // Gray
paranoid:   { bg: '#EF4444', border: '#EF4444' }  // Red
optimist:   { bg: '#22C55E', border: '#22C55E' }  // Green
```

## Project-Specific Guidelines

### Hackathon Focus

- **Prioritize comedy over complexity**: The goal is to make judges laugh
- **Stability over features**: No crashes during demo
- **Client-side only**: No backend, all state in-memory or localStorage
- **Demo-ready**: Should work offline after LLM responses are cached

### Performance Considerations

- LLM calls **only** during teach phase (execution is deterministic)
- Cache all interpretations to reduce API calls
- Use concurrency limiting to avoid rate limits
- PixiJS handles 26x26 grid efficiently (no performance issues)

### API Key Handling

- Never persist API key to localStorage or backend
- Store in Zustand state (in-memory only)
- Show modal on first load if not set
- Provide link to Google AI Studio for key generation
- Gracefully degrade to fallback responses if no key

### Grid Coordinates

- Grid is 26x26 tiles (0-25 in both x and y)
- Base is 2x2 tiles at position (12, 12)
- Enemies spawn from north edge (y: 0, x varies)
- Coordinate system: (0,0) is top-left, (25,25) is bottom-right

## Common Patterns

### Phase-Based Conditional Rendering

```typescript
const phase = useGameStore((state) => state.phase);

{phase === 'teach' && <CommandInput />}
{phase === 'execute' && <ExecutionControls />}
```

### Accessing Multiple Zustand State Values

```typescript
const { wood, commanders, phase } = useGameStore((state) => ({
  wood: state.wood,
  commanders: state.commanders,
  phase: state.phase,
}));
```

### PixiJS Cleanup

Always clean up PixiJS resources in useEffect cleanup:

```typescript
return () => {
  if (app) {
    app.destroy(true, { children: true });
  }
  // Remove event listeners
};
```

## Future Development Areas

Based on PRD.md:

- **Buildings**: Walls (5 wood), Towers (10 wood)
- **Enemies**: 1 wave of 10 units from north edge
- **Execution Logic**: Convert LLM interpretations to action plans
- **Debrief Screen**: Show funny quotes + share button
- **Multiple Waves**: Difficulty scaling
- **Sound/Music**: Background audio and SFX
