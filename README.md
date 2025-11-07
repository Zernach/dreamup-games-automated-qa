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
- ✅ **Enhanced test depth** - Default 20 screenshots (up to 50), 15 AI actions, 5 exploratory interactions
- ✅ **Extended test duration** - 3-5 minute tests with thorough observation periods (3.5-5s between actions)
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

**Frontend** (\`frontend/.env\`):
\`\`\`env
VITE_API_URL=http://localhost:3000
\`\`\`

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
