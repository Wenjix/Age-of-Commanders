# Age of Commanders

> A comedic AI-powered strategy game where you teach three commanders with distinct personalities—and watch them hilariously misinterpret everything.

Built for **AI Games Hackathon 2025** with React, PixiJS, and Google Gemini.

## The Concept

Give commands to three AI commanders, each with a wildly different personality:
- **Larry (Literalist)**: Interprets instructions word-for-word, never assumes intent
- **Paul (Paranoid)**: Believes everything is a trap, over-prepares for threats
- **Olivia (Optimist)**: Sees friendship everywhere, enemies are just misunderstood

Watch them build defenses, fight enemies, and create shareable comedic moments through LLM-powered interpretations.

## Features

- **26x26 Grid**: PixiJS-rendered battlefield with camera pan/zoom
- **3-Act Gameplay**: Progressive difficulty with intermissions and bonus rewards
- **AI Commanders**: Gemini 2.5 Flash Lite powers unique personality interpretations
- **Turn-Based Combat**: 30-turn execution with enemy waves
- **Building System**: Walls and towers with blind-build reveal mechanics
- **Debrief Screen**: Post-game highlights, battle timeline, and shareable quotes

## Tech Stack

- **React 19** + **TypeScript** - UI framework with strict type safety
- **PixiJS 8** - WebGL rendering for the game grid
- **Zustand 5** - Lightweight state management
- **Gemini 2.5 Flash Lite** - LLM for commander personalities
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Styling

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm package manager
- Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/apikey))

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app will prompt for your Gemini API key on first launch (stored in-memory only).

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

## Project Structure

```
/src
  /components     # React UI components
  /services       # LLM integration, combat logic, turn management
  /store          # Zustand global state
  /utils          # Comedy detection, formatting, game logic
  /constants      # Game configuration
```

## Game Controls

- **Pan Camera**: Click and drag
- **Zoom**: Mouse wheel (0.5x - 2x)
- **Commander Panel**: View AI interpretations and status

## Environment Variables

Create a `.env` file:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

Or enter it via the in-app modal (more secure—not persisted).

## License

Built for AI Games Hackathon 2025.
