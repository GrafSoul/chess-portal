# Board Games Portal

A modern 3D board game collection built with React Three Fiber. Features immersive physics-based interactions, AI opponents with configurable difficulty, and a polished UI across four classic strategy games.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-r183-black?logo=threedotjs)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

---

## Games

| Game | AI Engine | Physics | Description |
|------|-----------|---------|-------------|
| **Chess** | Stockfish WASM | Piece animations | Full rules, all openings, ELO-calibrated difficulty |
| **Checkers** | Minimax + alpha-beta | Piece captures | Russian checkers with multi-jump chains |
| **Go** | Monte Carlo Tree Search | Stone placement | 9x9 / 13x13 / 19x19, territory scoring, ko rule |
| **Backgammon** | Expectimax with chance nodes | Rapier dice rolling | Long Backgammon (Narde) with 4 rule presets |

---

## Key Features

- **3D Rendering** — React Three Fiber with PBR materials, dynamic shadows, and smooth camera rigs
- **Physics Simulation** — @react-three/rapier for realistic dice rolling, piece interactions, and collision detection
- **AI Opponents** — Web Worker-based engines (non-blocking UI) with Easy / Medium / Hard difficulty
- **Internationalization** — English and Russian with runtime locale switching
- **Responsive UI** — Framer Motion animations, slide-in settings panels, move history sidebars
- **State Management** — Zustand stores with immutable game state; full undo/redo support
- **Code-split** — Lazy-loaded game pages for fast initial load
- **Stats Tracking** — Game history and win/loss statistics

---

## Tech Stack

### Core

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript strict |
| 3D Engine | Three.js r183 via @react-three/fiber |
| Physics | @react-three/rapier (Rapier WASM) |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion 12, @react-spring/three |
| State | Zustand 5 |
| Routing | React Router 7 |
| Build | Vite 8 |
| Testing | Vitest + Playwright |

### AI Engines

| Game | Algorithm | Implementation |
|------|-----------|---------------|
| Chess | Stockfish 18 | WASM module, UCI protocol |
| Checkers | Minimax + alpha-beta pruning | Web Worker, depth 6-12 |
| Go | MCTS (Monte Carlo Tree Search) | Web Worker, 1k-50k playouts |
| Backgammon | Expectimax with chance nodes | Web Worker, depth 1-5, budget-limited |

---

## Project Structure

```
src/
├── app/                    # Router, app shell
├── core/                   # Shared infrastructure
│   ├── components/         # SceneCanvas, layout, sidebar
│   ├── hooks/              # useEscapeClose, shared hooks
│   ├── i18n/               # Translations, locale store
│   ├── stores/             # Global stores (stats, theme)
│   └── utils/              # Shared utilities
├── games/
│   ├── chess/
│   │   ├── ai/            # StockfishService (WASM)
│   │   ├── components/    # 3D board, pieces, UI panels
│   │   ├── engine/        # chess.js integration
│   │   └── stores/        # Game state, settings
│   ├── checkers/
│   │   ├── ai/            # Minimax worker
│   │   ├── components/    # 3D board, pieces, UI
│   │   ├── engine/        # Move generator, rules
│   │   └── stores/        # Game state, settings
│   ├── go/
│   │   ├── ai/            # MCTS worker
│   │   ├── components/    # 3D board, stones, UI
│   │   ├── engine/        # Liberty counting, scoring
│   │   └── stores/        # Game state, settings
│   └── backgammon/
│       ├── ai/            # Expectimax worker
│       ├── components/    # 3D board, dice cup, UI
│       │   ├── scene/     # R3F scene components
│       │   └── ui/        # Settings, rules, overlays
│       ├── config/        # AI levels, rule presets
│       ├── engine/        # Move generator, rules, evaluator
│       ├── hooks/         # useBackgammonGame, useBackgammonAI
│       └── stores/        # Game state, settings
└── pages/                  # Route-level page components
```

---

## Getting Started

### Prerequisites

- **Node.js 24+** (required for Vite 8 and modern TypeScript)
- **npm 11+**

### Installation

```bash
git clone https://github.com/your-username/chess-portal.git
cd chess-portal
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview    # Preview production build locally
```

### Testing

```bash
npm run test          # Run unit tests
npm run test:watch    # Watch mode
```

### Linting

```bash
npm run lint
```

---

## Architecture Decisions

### Why Web Workers for AI?

All AI engines run in dedicated Web Workers to keep the UI thread at 60fps. The main thread communicates with workers via a Promise-based service layer (`*AIService.ts`) — one active search at a time, with abort/cancel support.

### Why Zustand?

Game state is deeply nested (board arrays, move sequences, dice state). Zustand's `getState()` pattern provides stable references for R3F components (which skip re-renders aggressively), while subscriptions give fine-grained reactivity for UI overlays.

### Why Rapier for Dice?

Backgammon dice require realistic tumbling, bouncing off walls, and settling on faces. Rapier's WASM physics engine handles this with minimal configuration — gravity, restitution, and friction produce natural-looking rolls without hand-tuned animations.

### Why Immutable Game State?

All engine functions (`applySubMove`, `commitTurn`, `generateLegalSequences`) are pure — they accept state and return new state without mutation. This enables:
- Trivial undo/redo (store previous states)
- Safe AI search (workers receive serialized snapshots)
- React-friendly rendering (reference equality checks)

---

## Performance

- **Code Splitting** — Each game page is lazy-loaded; initial bundle is ~67KB gzipped
- **Memoized R3F Components** — Custom `memo` comparators prevent unnecessary re-renders of 3D objects
- **Web Worker AI** — Zero main-thread blocking during AI computation
- **Budget-limited Search** — AI engines cap node evaluations to guarantee sub-second response times
- **Physics Pausing** — Rapier world is paused when dice are not actively rolling

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Acknowledgments

- [Stockfish](https://stockfishchess.org/) — Chess engine
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — React renderer for Three.js
- [Rapier](https://rapier.rs/) — Physics engine
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [Framer Motion](https://www.framer.com/motion/) — Animation library
