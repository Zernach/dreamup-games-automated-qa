# DreamUp Games QA - Automated Quality Assurance System

AI-powered automated quality assurance system for browser games using Playwright automation and Claude AI evaluation.

## Overview

This full-stack application provides automated testing and quality assessment for browser-based games. It loads games in a headless browser, captures evidence (screenshots, console logs, network errors), and uses AI to evaluate playability and detect issues.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Pages (Frontend)                │
│                      React + Next.js                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Railway (Backend + DB)                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Express REST API + WebSocket                        │  │
│  │  - Browser Automation (Playwright)                   │  │
│  │  - Evidence Capture (Screenshots, Logs)              │  │
│  │  - AI Evaluation (Claude API)                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────┐  ┌───────────────────────────────┐   │
│  │   PostgreSQL    │  │    Railway Volumes            │   │
│  │   (Test Data)   │  │    (Screenshots/Logs)         │   │
│  └─────────────────┘  └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
dreamup-games-qa/
├── backend/              # Express API server
│   ├── src/
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   ├── prisma/           # Database schema & migrations
│   └── package.json
│
├── frontend/             # Next.js React application
│   ├── src/
│   │   ├── app/          # Next.js pages (App Router)
│   │   ├── components/   # React components
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
- ✅ PostgreSQL database with Prisma ORM
- ✅ Next.js frontend with TailwindCSS
- ✅ Test submission and results viewing
- ✅ Dashboard with statistics and test history
- ✅ Shared type definitions

### In Progress
- 🚧 Browser automation integration (Epic 1-3)
- 🚧 AI-powered evaluation (Claude API)
- 🚧 WebSocket real-time updates
- 🚧 API authentication & rate limiting

### Planned
- 📋 Railway & Cloudflare Pages deployment
- 📋 End-to-end validation testing
- 📋 Screenshot & log artifact storage

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
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
DATABASE_URL="postgresql://user:password@localhost:5432/dreamup_qa"
OPENAI_API_KEY=your_key_here
\`\`\`

**Frontend** (\`frontend/.env.local\`):
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
\`\`\`

4. **Set up the database**

\`\`\`bash
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..
\`\`\`

5. **Start development servers**

\`\`\`bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Or both together
npm run dev
\`\`\`

6. **Access the application**

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
      "timeout": 120000,
      "screenshotCount": 5
    }
  }
  \`\`\`

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
- `npm run prisma:generate --workspace=backend` - Generate Prisma client
- `npm run prisma:migrate --workspace=backend` - Run database migrations
- `npm run prisma:studio --workspace=backend` - Open Prisma Studio

**Frontend:**
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend for production

## Database Schema

Key models:
- **Test**: Test execution records with playability scores
- **Issue**: Detected issues with severity and type
- **Screenshot**: Captured screenshots with labels
- **ConsoleLog**: Browser console messages
- **NetworkError**: Failed network requests
- **ApiKey**: API authentication keys

See [backend/prisma/schema.prisma](./backend/prisma/schema.prisma) for full schema.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for:
- Railway (Backend + PostgreSQL)
- Cloudflare Pages (Frontend)

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
- [Prisma](https://www.prisma.io/) for database ORM
- [Next.js](https://nextjs.org/) for React framework
- [Railway](https://railway.app/) for backend hosting
- [Cloudflare Pages](https://pages.cloudflare.com/) for frontend hosting
