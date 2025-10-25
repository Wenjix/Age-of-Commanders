# Age of Commanders

A React + PixiJS 8 game built with Vite and TypeScript.

## Features

- **20x20 Grid**: Rendered with green grass tiles (32x32px each)
- **Base Building**: Red 32x32px square at center position [10,10]
- **Resource Display**: Top bar showing "Wood: 50"
- **Camera Controls**:
  - **Drag to Pan**: Click and drag to move the camera
  - **Mouse Wheel to Zoom**: Scroll to zoom in/out (min 0.5x, max 2x)
- **State Management**: Zustand for global state (wood count, base position)
- **Styling**: Tailwind CSS for UI components

## Tech Stack

- **React 19** - UI framework
- **PixiJS 8** - WebGL rendering engine
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe development
- **Zustand** - State management
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
/src
  /store
    useGameStore.ts    # Zustand store for game state
  /components
    GameCanvas.tsx     # PixiJS canvas component
    TopBar.tsx         # Resource display bar
  App.tsx              # Main app component
  main.tsx             # Entry point
```

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Game State

The game uses Zustand to manage:
- `wood`: Resource count (initial value: 50)
- `basePosition`: Base building coordinates (x: 10, y: 10)

## Controls

- **Pan Camera**: Click and drag anywhere on the canvas
- **Zoom**: Use mouse wheel to zoom in/out (0.5x - 2x range)

## Next Steps

- Add more building types
- Implement resource gathering
- Add enemy units
- Create unit selection and commands

