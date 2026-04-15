# Product Context

## What
Multi-game 3D board game portal. Currently features Chess and Checkers (Russian Draughts), with Go planned.

## Why
Personal project to showcase 3D browser game development with React Three Fiber. Playable AI opponents, beautiful visuals, responsive UI.

## Tech Stack
- React 19 + TypeScript (strict)
- Vite 8 (requires Node 20.19+ or 22.12+, using Node 24)
- React Three Fiber + @react-three/drei for 3D rendering
- Zustand for state management (with persist middleware for settings/stats)
- Framer Motion for UI animations
- WebAudio API for synthesized sound effects
- Web Workers for AI computation
- HashRouter for GitHub Pages compatibility
- ESLint for code quality

## Architecture
- Feature-based folder structure: `src/games/{chess,checkers}/`
- Each game has: engine, stores, components (scene + ui), hooks, ai, audio, config
- Shared core: `src/core/` (components, i18n, types)
- Pages: `src/pages/` (HomePage, ChessPage, CheckersPage, StatsPage)

## Deployment
- GitHub Pages via `gh-pages` branch
- Base URL configured via Vite `base` option
