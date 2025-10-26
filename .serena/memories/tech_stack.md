# Age of Commanders - Tech Stack

## Core Framework

- **React 19.1.1** - UI framework
- **TypeScript 5.9.3** - Type-safe development with strict mode enabled
- **Vite 7.1.7** - Build tool and dev server
- **pnpm** - Package manager

## Rendering & Graphics

- **PixiJS 8.14.0** - WebGL rendering engine for 26x26 grid
  - Handles all game canvas rendering
  - Camera system for pan/zoom controls
  - Efficient sprite and graphics rendering

## State Management

- **Zustand 5.0.8** - Lightweight state management
  - Single global store in `src/store/useGameStore.ts`
  - No Redux, no Context API complexity

## Styling

- **Tailwind CSS 4.1.16** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixing

## UI Components

- **Lucide React 0.548.0** - Icon library
- **react-hot-toast 2.6.0** - Toast notifications

## AI/LLM Integration

- **Gemini 2.5 Flash Lite** - Google's LLM API
  - Model: `gemini-2.0-flash-lite`
  - Used for commander personality interpretations
  - API endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent`

## Utilities

- **p-limit 7.2.0** - Concurrency control for LLM API calls (max 3 simultaneous)

## Development Tools

### Linting
- **ESLint 9.36.0** - Code linting
- **@eslint/js 9.36.0** - ESLint JavaScript config
- **typescript-eslint 8.45.0** - TypeScript ESLint plugin
- **eslint-plugin-react-hooks 5.2.0** - React Hooks linting
- **eslint-plugin-react-refresh 0.4.22** - React Refresh linting

### TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext
- **Strict Mode**: Enabled
- **React JSX**: react-jsx
- **Bundler Mode**: moduleResolution
