# Age of Commanders - Project Overview

## Purpose

**Age of Commanders** (aka "Empire of Minds") is a comedic AI-powered strategy game built for the AI Games Hackathon 2025. Players give commands to three AI commanders with distinct personalities (Literalist, Paranoid, Optimist), who hilariously misinterpret instructions through LLM-powered interpretations.

## Core Concept

The game combines React + PixiJS 8 for rendering with Google's Gemini 2.5 Flash Lite for AI personalities. Players experience comedy through the commanders' misinterpretations of their strategic instructions.

## Game Features

- **26x26 Grid**: WebGL-rendered game world with PixiJS
- **Three AI Commanders**: Each with distinct personality-driven interpretation styles
- **3-Act System**: Progressive gameplay with intermissions and bonus mechanics
- **Building System**: Walls and Towers with blind-build reveal mechanics
- **Combat System**: Turn-based combat with enemy waves
- **LLM Integration**: Real-time AI-powered commander responses via Gemini API

## Development Focus

- **Hackathon Project**: Prioritize comedy over complexity
- **Client-Side Only**: No backend, all state in-memory or localStorage
- **Stability**: No crashes during demo
- **Demo-Ready**: Should work offline after LLM responses are cached
