# Age of Commanders - Architecture

## High-Level Overview

Age of Commanders is a client-side React application with PixiJS rendering, Zustand state management, and Google Gemini LLM integration.

## State Management (Zustand)

### Single Global Store
Location: `src/store/useGameStore.ts`

The entire game state lives in one Zustand store with the following key sections:

#### Game Resources
- `wood` - Current wood count (starts at 40)
- `basePosition` - Base coordinates (x: 12, y: 12)
- `baseHealth` - Health of the base (max 3)

#### Commanders
- `commanders` - Array of 3 commanders (Larry, Paul, Olivia)
- Each has personality, interpretation, execution plan, secret builds
- Commander colors managed via `CommanderColors` interface

#### Game Phases
- `phase` - Current game phase: `'draft' | 'teach' | 'execute' | 'debrief'`
- Phase determines which UI components are visible

#### 3-Act System
- `currentAct` - Current act (1, 2, or 3)
- `isIntermission` - Whether in intermission between acts
- `act1Bonus`, `act2Bonus` - Bonus resources earned
- `enemiesKilledPerAct` - Tracks kills per act [act1, act2, act3]
- `woodSpentPerAct` - Tracks spending per act

#### Turn System
- `currentTurn` - Current turn number (0-30)
- `maxTurns` - Maximum turns (30 for extended Act 3)
- `isPaused` - Pause state
- `turnSpeed` - Milliseconds per turn (default: 2000)
- `turnLog` - Array of turn events
- `commanderThoughts` - Temporary thought bubbles

#### Buildings & Enemies
- `buildings` - Array of placed buildings
- `enemies` - Array of active enemies
- `enabledBuildings` - Buildings available to commanders

#### API Configuration
- `apiKey` - Gemini API key (in-memory only, never persisted)
- `concurrencyLimit` - Max simultaneous LLM calls (default: 3)

### Store Actions

**Commander Updates**:
- `updateCommanderInterpretation(id, interpretation)`
- `updateCommanderExecutionPlan(id, executionPlan)`
- `updateCommanderSecretBuilds(id, builds)`
- `updateCommanderActionIndex(id, index)`
- `updateCommanderName(id, name)`
- `updateCommanderColor(id, colors)`

**Building Management**:
- `placeBuilding(building)` - Validates and places building
- `removeBuilding(x, y)` - Removes building at position
- `isTileOccupied(x, y)` - Checks tile occupancy
- `revealBuilding(x, y)` - Reveals a specific building
- `revealAllBuildings()` - Reveals all buildings

**Resource Management**:
- `deductWood(amount)` - Returns false if insufficient
- `addWood(amount)` - Adds wood

**Enemy Management**:
- `spawnEnemy(enemy)` - Adds enemy to game
- `updateEnemy(id, updates)` - Updates enemy properties
- `removeEnemy(id)` - Removes enemy

**Phase Control**:
- `setPhase(phase)` - Changes game phase

**Turn System**:
- `nextTurn()` - Advances turn
- `previousTurn()` - Goes back (for replay)
- `pauseGame()` / `resumeGame()` - Pause controls
- `setTurnSpeed(speed)` - Adjusts turn speed
- `addTurnLogEntry(entry)` - Logs events
- `clearTurnLog()` - Resets log
- `addCommanderThought(thought)` - Shows thought bubble
- `clearCommanderThoughts()` - Clears all thoughts

**3-Act System**:
- `setCurrentAct(act)` - Sets current act
- `setIsIntermission(value)` - Controls intermission state
- `recordEnemyKills(act, count)` - Records kills for act
- `recordWoodSpent(act, amount)` - Records spending for act
- `checkBaseProximity()` - Checks Act 2 bonus condition
- `calculateAct1Bonus()` - Calculates Act 1 bonus
- `calculateAct2Bonus()` - Calculates Act 2 bonus
- `switchToAct(act)` - Switches to specific act
- `resetGame()` - Full game reset

## Component Architecture

### Main Layout
**File**: `src/App.tsx`
- Root component
- Manages toast notifications (react-hot-toast)
- Conditionally renders screens based on phase

### Core Components

**GameCanvas** (`src/components/GameCanvas.tsx`)
- PixiJS Application wrapper
- Renders 26x26 grid with grass tiles
- Manages camera Container for pan/zoom
- Handles building and enemy rendering
- Camera controls: click-drag pan, mousewheel zoom

**TopBar** (`src/components/TopBar.tsx`)
- Resource display (wood count)
- Reset zoom button
- Phase indicator

**CommanderPanel** (`src/components/CommanderPanel.tsx`)
- Displays 3 commander avatars
- Speech bubbles for interpretations
- Collapsible panel design

**CommandInput** (`src/components/CommandInput.tsx`)
- Text input for player commands
- Only visible during 'teach' phase
- Triggers LLM interpretation calls

**ApiKeyModal** (`src/components/ApiKeyModal.tsx`)
- Prompts for Gemini API key on first load
- Allows skipping (uses fallback responses)
- Provides link to Google AI Studio

**IntermissionPanel** (`src/components/IntermissionPanel.tsx`)
- Displays between acts
- Shows bonus rewards
- Allows progression to next act

**DebriefScreen** (`src/components/DebriefScreen.tsx`)
- Post-game summary
- Battle timeline
- Commander cards with highlights
- Shareable quotes

### Debrief Subcomponents
- `BattleTimeline` - Visual timeline of turns
- `CommanderCard` - Individual commander results
- `HeroBanner` - Victory/defeat header
- `ActionFooter` - Share and restart buttons
- `HighlightBadges` - Special moment badges

### Execution Components
- `ExecutionController` - Manages turn execution
- `ExecutionScreen` - Main execution phase UI
- `ExecutionHUD` - Turn counter and controls
- `PhaseIndicator` - Current phase display

### Other Components
- `BuildingCuration` - Building selection UI
- `CommanderIntroduction` - Initial commander reveal
- `DebugMenu` - Developer tools

## Service Layer

### LLM Service (`src/services/llmService.ts`)

**Purpose**: Handles all Google Gemini API interactions

**Key Functions**:
- `interpretCommandForAllCommanders(command, commanders, apiKey)`
  - Calls Gemini API for all 3 commanders concurrently
  - Uses p-limit for concurrency control (max 3)
  - Returns Map of commander.id → interpretation

**Caching Strategy**:
- localStorage key: `commander_interpretation_{personality}_{command}`
- Checks cache before API call
- Stores successful responses

**Personality Prompts**:
```typescript
literalist: "Interpret WORD-FOR-WORD. Never assume intent. Be robotic."
paranoid: "Everything is a trap. Enemy is watching. Over-prepare."
optimist: "See friendship everywhere. Enemies are misunderstood guests!"
```

**Fallback Responses**:
- Used when API fails or no key provided
- Personality-appropriate default responses

**API Configuration**:
- Model: `gemini-2.0-flash-lite`
- Temperature: 0.7
- Max Tokens: 200

### Combat Service (`src/services/combatService.ts`)
- Handles combat resolution
- Damage calculations
- Range and targeting logic

### Enemy Service (`src/services/enemyService.ts`)
- Enemy spawning logic
- Pathfinding
- Wave management

### Build Plan Service (`src/services/buildPlanService.ts`)
- Converts LLM interpretations to building plans
- Validates building placements
- Manages secret builds per commander

### Turn Manager (`src/services/turnManager.ts`)
- Executes turn logic
- Updates game state each turn
- Manages enemy movement and combat
- Generates turn log entries

## Type Definitions

### Main Types (`src/store/useGameStore.ts`)
- `GamePhase` - Union type for game phases
- `Personality` - Union type for commander personalities
- `Commander` - Commander data structure
- `Building` - Building data structure
- `Enemy` - Enemy data structure
- `GameState` - Complete game state interface
- `UITheme` - UI theme options

### Turn Log Types (`src/types/turnLog.ts`)
- `TurnLogEntry` - Structure for turn events
- `CommanderThought` - Thought bubble data

## Constants (`src/constants/gameConstants.ts`)
- Grid dimensions (26x26)
- Tile size (32px)
- Building costs and stats
- Enemy stats and spawn rules

## Utilities

### Game Utils (`src/utils/gameUtils.ts`)
- `getFootprint(buildingType, x, y)` - Returns occupied tiles
- `isFootprintOnGrid(buildingType, x, y)` - Validates placement

### Comedy Detection (`src/utils/comedyDetection.ts`)
- Analyzes gameplay for funny moments
- Identifies highlights for debrief

### Timeline Utils (`src/utils/timelineUtils.ts`)
- Processes turn log into visual timeline
- Groups events by type

### Text Formatting (`src/utils/textFormatting.ts`)
- Formats numbers, percentages
- Emoji injection for events

### Theme Styles (`src/utils/themeStyles.ts`)
- Theme-based styling utilities
- Color palette management

## Game Flow

1. **Draft Phase**: Select commanders and initial setup
2. **Teach Phase**: Enter command → LLM interprets → Review interpretations
3. **Execute Phase**: Watch turn-by-turn execution (30 turns max)
4. **Debrief Phase**: Review results, share quotes, restart

**3-Act Structure**:
- Act 1 (10 turns) → Intermission → Act 2 (10 turns) → Intermission → Act 3 (10 turns) → Debrief

## PixiJS Integration

### Grid Rendering
- 26x26 tiles, each 32x32 pixels
- Green grass tiles with dark borders
- 2x2 red base at center (12, 12)

### Camera System
- All visual elements in `camera` Container
- Pan: click-drag
- Zoom: mousewheel (0.5x - 2x)
- Reset zoom via TopBar button

### Rendering Pipeline
- Tiles rendered first
- Buildings layered on top
- Enemies rendered above buildings
- Effects/highlights on top layer

## Data Flow

```
User Input (CommandInput)
  ↓
LLM Service (interpretCommandForAllCommanders)
  ↓
Update Zustand Store (updateCommanderInterpretation)
  ↓
Build Plan Service (generate execution plans)
  ↓
Execute Phase (Turn Manager)
  ↓
Update Store (buildings, enemies, turn log)
  ↓
React Components Re-render
  ↓
PixiJS Canvas Updates
```

## Performance Considerations

- LLM calls **only** in teach phase (not during execution)
- Caching reduces redundant API calls
- Concurrency limiting prevents rate limits
- PixiJS handles 26x26 grid efficiently
- Zustand selective subscriptions minimize re-renders
