# Age of Commanders - Code Style & Conventions

## TypeScript Configuration

### Compiler Strictness
- **Strict mode enabled** - All strict type-checking options are on
- **No unused locals** - Variables must be used
- **No unused parameters** - Function parameters must be used
- **No fallthrough cases** - Switch statements must have breaks
- **Target**: ES2022
- **Module**: ESNext with bundler resolution

### Type Annotations
- Explicit type annotations on interfaces and type aliases
- Inferred types are acceptable for simple variables
- Function return types are often inferred but can be explicit

## File Organization

### Directory Structure
```
/src
  /components       # React components
    /debrief       # Debrief-specific components
  /services        # Business logic and API services
  /store          # Zustand state management
  /types          # TypeScript type definitions
  /utils          # Utility functions
  /constants      # Game constants and configuration
  /assets         # Static assets
```

### Naming Conventions

**Files**:
- React components: PascalCase (e.g., `GameCanvas.tsx`)
- Services: camelCase (e.g., `llmService.ts`)
- Types: camelCase (e.g., `turnLog.ts`)
- Utils: camelCase (e.g., `gameUtils.ts`)

**Code**:
- Components: PascalCase (e.g., `CommanderPanel`)
- Functions: camelCase (e.g., `interpretCommand`)
- Constants: UPPER_SNAKE_CASE or camelCase depending on context
- Interfaces: PascalCase (e.g., `GameState`, `Commander`)
- Type aliases: PascalCase (e.g., `GamePhase`, `BuildingType`)

## React Patterns

### State Management
- Use Zustand for global state
- Use React hooks (useState, useEffect) for local component state
- Access Zustand state with selectors to avoid unnecessary re-renders

**Example**:
```typescript
const { wood, commanders, phase } = useGameStore((state) => ({
  wood: state.wood,
  commanders: state.commanders,
  phase: state.phase,
}));
```

### Component Structure
- Functional components only (no class components)
- React 19 with latest JSX transform
- Hooks follow React rules (top-level, consistent order)

### Event Handlers
- Inline arrow functions for simple handlers
- Named functions for complex logic

## ESLint Rules

- React Hooks rules enforced (exhaustive deps, rules of hooks)
- React Refresh compatibility required
- TypeScript recommended rules applied
- No global variables except browser globals

## Import/Export Style

- Named exports preferred for utilities and services
- Default exports for React components
- ES modules (`import`/`export`) exclusively
- Path aliases not configured (use relative imports)

## Comments & Documentation

- JSDoc comments are minimal in current codebase
- Inline comments used sparingly for complex logic
- TODO comments may appear but should be addressed
- Code should be self-documenting through naming

## Styling Conventions

### Tailwind CSS
- Utility classes used extensively
- Custom styles in component files when needed
- Theme customization in `tailwind.config.js`

### Inline Styles
- Used for dynamic colors (e.g., commander avatars)
- Avoid for static styling (use Tailwind instead)

**Example** (commander colors):
```typescript
style={{ 
  backgroundColor: commander.colors.bg, 
  borderColor: commander.colors.border 
}}
```

## PixiJS Patterns

### Resource Cleanup
- Always destroy PixiJS apps in useEffect cleanup
- Remove event listeners on unmount

**Example**:
```typescript
useEffect(() => {
  const app = new Application();
  // ... setup
  
  return () => {
    app.destroy(true, { children: true });
    // Remove listeners
  };
}, []);
```

### Camera Container
- All game objects added to `camera` Container (not `app.stage`)
- Camera handles pan/zoom transformations
- Position calculations use TILE_SIZE constant (32px)

## Constants

- Define constants in `src/constants/gameConstants.ts`
- Magic numbers should be replaced with named constants
- Grid size: 26x26, Tile size: 32px

## Error Handling

- Try-catch blocks for async operations (especially LLM calls)
- Toast notifications for user-facing errors
- Console logging for debug information
- Graceful degradation (fallback responses for LLM failures)
