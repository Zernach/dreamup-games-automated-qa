# DreamUp Games QA - Automated Quality Assurance System

AI-powered automated quality assurance system for browser games using Playwright automation and Claude AI evaluation.

## Overview

This full-stack application provides automated testing and quality assessment for browser-based games. It loads games in a headless browser, captures evidence (screenshots, console logs, network errors), and uses AI to evaluate playability and detect issues.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                     React + Vite                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Railway (Backend)                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Express REST API + WebSocket                        │  │
│  │  - Browser Automation (Playwright)                   │  │
│  │  - Evidence Capture (Screenshots, Logs)              │  │
│  │  - AI Evaluation (Claude API)                        │  │
│  │  - In-Memory Storage                                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────┐                         │
│  │    Railway Volumes            │                         │
│  │    (Screenshots/Logs)         │                         │
│  └───────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
dreamup-games-qa/
├── backend/              # Express API server
│   ├── src/
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic (in-memory storage)
│   │   ├── types.ts      # TypeScript type definitions
│   │   └── utils/        # Utilities
│   └── package.json
│
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # React components (GameCard, Layout, etc.)
│   │   ├── data/         # Game presets and static data
│   │   ├── lib/          # API client & utilities
│   │   └── styles/       # Global styles
│   └── package.json
│
├── shared/               # Shared TypeScript types
│   └── src/types.ts
│
└── package.json          # Root workspace configuration
```

## Features

### Current (MVP)
- ✅ Full-stack monorepo with TypeScript
- ✅ Express REST API with validation
- ✅ In-memory storage for test data
- ✅ React + Vite frontend with TailwindCSS
- ✅ Test submission and results viewing
- ✅ Dashboard with statistics and test history
- ✅ Game preset selection with live iframe previews
- ✅ Quick-test 4 popular iframe-compatible games (Slither.io, Krunker.io, Minesweeper, Solitaire)
- ✅ Shared type definitions
- ✅ **🎮 MULTI-ITERATION GAME COMPLETION LOOP** - AI performs up to 5 iterative cycles, re-analyzing state to ensure full game completion from start to finish
- ✅ **🏆 Intelligent Completion Detection** - Automatically detects win/loss/game-over states and attempts to start new rounds for comprehensive testing
- ✅ **🔄 Dynamic State-Based Re-Analysis** - AI adapts strategy based on current game state (menu → playing → completed)
- ✅ **📈 Structured Scoring System** - Bonuses for starting (+10), strategic moves (+10), completion (+20), winning (+30), multiple rounds (+20)
- ✅ **Enhanced test depth** - Default 20 screenshots (up to 50), 10 actions per iteration (up to 50 total), 5 exploratory interactions
- ✅ **Extended test duration** - 3-5 minute tests with thorough observation periods (3.5s between actions)
- ✅ **Improved Playwright interactions** - Enhanced canvas game interaction with robust click strategies
- ✅ **Exploratory interaction phase** - Automated keyboard (arrows, WASD, space) and mouse testing
- ✅ **Overlay/ad dismissal** - Automatic removal of blocking elements before testing
- ✅ **Content change detection** - Verifies that actions actually modify game state

### In Progress
- 🚧 Browser automation integration (Epic 1-3)
- 🚧 AI-powered evaluation (Claude API)
- 🚧 WebSocket real-time updates
- 🚧 API authentication & rate limiting

### Planned
- 📋 Backend deployment (Railway)
- 📋 End-to-end validation testing
- 📋 Screenshot & log artifact storage

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1. **Clone the repository**

\`\`\`bash
git clone https://github.com/yourusername/dreamup-games-qa.git
cd dreamup-games-qa
\`\`\`

2. **Install dependencies**

\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables**

**Backend** (\`backend/.env\`):
\`\`\`env
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_key_here
\`\`\`

**Frontend** (\`frontend/.env.local\`):
\`\`\`env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
\`\`\`

> **Note**: For the frontend, create `.env.local` (not `.env`) to ensure it's properly gitignored. You can copy from `.env.example`.

4. **Start development servers**

\`\`\`bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Or both together
npm run dev
\`\`\`

5. **Access the application**

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## Testing Game Completion Feature

The AI system is now designed to **complete at least one full game from beginning to end**. Here's what happens during a test:

### Multi-Iteration Loop Process

1. **Initial Analysis** (Iteration 1)
   - AI analyzes the game's initial state
   - Identifies start buttons, menus, and interactive elements
   - Suggests actions to BEGIN the game

2. **Dynamic Re-Analysis** (Iterations 2-5)
   - After each set of actions, AI re-analyzes the current state
   - Adapts strategy based on what it sees:
     - **Menu State**: Suggests clicking "Start" or "Play"
     - **Active Gameplay**: Suggests strategic moves to win
     - **Game Over State**: Suggests clicking "New Game" or "Play Again"

3. **Completion Detection**
   - System monitors for completion keywords: "game over", "you win", "you lost", "victory", "defeat", "final score"
   - When detected, attempts to start a new round if time permits

4. **Performance Bonuses**
   - Starting the game: +10 points
   - Making strategic moves: +10 points
   - Reaching completion state: +20 points
   - Successfully winning: +30 points
   - Completing multiple rounds: +10 points per round (max +20)

### Recommended Games for Testing

Best games to demonstrate full completion:

1. **Tic Tac Toe** (`https://codepen.io/alvaromontoro/full/BexWOw`)
   - Simple, quick games (~30 seconds each)
   - Clear win/loss states
   - Easy for AI to complete multiple rounds

2. **Solitaire** (`https://www.solitr.com/`)
   - Strategic card game
   - Clear completion states
   - Good for testing strategic move planning

3. **Minesweeper** (`https://minesweeper.online/`)
   - Puzzle game with clear rules
   - Win/loss states are obvious
   - Tests AI's ability to make safe moves

### Example Test Run

```bash
# Start the backend
cd backend
npm run dev

# In another terminal, trigger a test via curl
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "gameUrl": "https://codepen.io/alvaromontoro/full/BexWOw",
    "options": {
      "timeout": 180000,
      "screenshotCount": 50
    }
  }'
```

Watch the console logs to see:
- `=== STARTING MULTI-ITERATION AI LOOP TO COMPLETE GAME ===`
- `--- ITERATION X/5 ---`
- `🎉 AI DETECTED GAME COMPLETION!`
- `✅ Successfully completed at least one game!`

## API Endpoints

### Tests

- `POST /api/test` - Create new test
  \`\`\`json
  {
    "gameUrl": "https://example.com/game",
    "options": {
      "timeout": 180000,
      "screenshotCount": 20
    }
  }
  \`\`\`
  
  **Default Values:**
  - `timeout`: 180000ms (3 minutes) - Extended for thorough testing
  - `screenshotCount`: 20 - Comprehensive state capture (max: 50)

- `GET /api/test/:id` - Get test results by ID

- `GET /api/tests?page=1&limit=20&status=completed` - List tests with pagination

- `GET /api/statistics` - Get test statistics

### Health

- `GET /health` - Health check endpoint

See [API.md](./API.md) for full API documentation.

## Development

### Available Scripts

**Root:**
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both applications
- `npm test` - Run all tests
- `npm run lint` - Lint all workspaces

**Backend:**
- `npm run dev --workspace=backend` - Start backend dev server
- `npm run build --workspace=backend` - Build backend

**Frontend:**
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend for production

## Data Models

Key types (stored in-memory):
- **Test**: Test execution records with playability scores
- **Issue**: Detected issues with severity and type
- **Screenshot**: Captured screenshots with labels
- **ConsoleLog**: Browser console messages
- **NetworkError**: Failed network requests

See [backend/src/types.ts](./backend/src/types.ts) for full type definitions.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for Railway.

## Testing

\`\`\`bash
# Run all tests
npm test

# Run backend tests only
npm test --workspace=backend

# Run frontend tests only
npm test --workspace=frontend
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## Acknowledgments

- [Playwright](https://playwright.dev/) for browser automation
- [Anthropic Claude](https://www.anthropic.com/) for AI evaluation
- [Vite](https://vitejs.dev/) for build tooling
- [Railway](https://railway.app/) for backend hosting
