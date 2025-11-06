# Epic 4: Full-Stack Deployment & Web Interface

**Epic ID:** EPIC-4
**Status:** Not Started
**Priority:** P0 (Critical)
**Target Sprint:** Sprint 4
**Estimated Story Points:** 34 points

---

## Epic Goal

Build a production-ready full-stack application with Express REST API on Railway, React frontend on Cloudflare Pages, PostgreSQL database for test history, and comprehensive web interface for test submission and result viewing. This epic transitions the system from a CLI tool to a complete web application with API access for both human users and automated systems.

---

## Business Value

- Enables web-based access for non-technical users (Product Managers, stakeholders)
- Provides historical test data and trend analysis
- Offers REST API for DreamUp agent integration
- Delivers production-ready deployment on scalable platforms
- Creates foundation for future enhancements (dashboards, analytics)

---

## Success Criteria

- [ ] Express API successfully deployed on Railway
- [ ] React frontend deployed on Cloudflare Pages
- [ ] PostgreSQL database stores test history
- [ ] Web UI allows test submission and result viewing
- [ ] REST API functional with authentication
- [ ] Performance targets met (<2 minute test execution)
- [ ] All documentation complete
- [ ] Validation testing confirms 80%+ accuracy

---

## Dependencies

- **EPIC-3:** AI evaluation must be complete for API integration

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Railway resource limits for browser automation | High | Test early, optimize resource usage, consider Railway Pro plan |
| Frontend/backend coordination complexity | Medium | Define API contract early, use shared TypeScript types |
| Database schema changes during development | Medium | Use Prisma migrations, version schema carefully |
| Cloudflare Pages SSR limitations | Low | Use static generation where possible, minimal server-side rendering |

---

## User Stories

### Story 4.1: Express REST API Setup

**Story Points:** 3 | **Priority:** P0

As a **developer**,
I want **an Express server with REST API endpoints for test operations**,
so that **tests can be triggered and results retrieved programmatically**.

**Acceptance Criteria:**

1. Express server created in `/backend/src/server.ts`
2. API endpoints implemented:
   - POST `/api/test` - Submit new test (accepts gameUrl, options)
   - GET `/api/test/:id` - Get test result by ID
   - GET `/api/tests` - List all tests (paginated)
   - GET `/api/test/:id/screenshots` - Get screenshot URLs
3. Request validation middleware using Zod
4. Error handling middleware with structured error responses
5. CORS configuration for Cloudflare frontend domain
6. Health check endpoint: GET `/health`
7. API returns JSON responses with consistent structure
8. Environment variables: PORT, DATABASE_URL, OPENAI_API_KEY
9. Server starts successfully and listens on configured port
10. Integration tests validate all API endpoints

**Technical Notes:**
- Use Express 4.x
- Implement middleware: cors, helmet, express-rate-limit
- Use morgan for request logging

---

### Story 4.2: PostgreSQL Database Integration with Prisma

**Story Points:** 5 | **Priority:** P0

As a **backend system**,
I want **a PostgreSQL database to store test results and history**,
so that **users can browse historical tests and track quality trends**.

**Acceptance Criteria:**

1. Prisma ORM configured in `/backend/prisma/schema.prisma`
2. Database schema defined with models:
   - Test (id, gameUrl, status, playabilityScore, grade, confidence, createdAt, updatedAt, duration)
   - Issue (id, testId, severity, type, description, confidence, timestamp)
   - Screenshot (id, testId, label, filePath, fileSize, timestamp)
   - ConsoleLog (id, testId, level, message, timestamp, occurrenceCount)
   - NetworkError (id, testId, url, statusCode, errorMessage, critical, timestamp)
3. Prisma migrations created and applied successfully
4. Database connection established via Railway PostgreSQL addon
5. Type-safe database queries using Prisma Client
6. Test results saved to database after test completion
7. Historical tests retrievable with pagination (20 per page)
8. Database indexes on frequently queried fields (gameUrl, createdAt, status)
9. Seed script for development data (5 sample tests)
10. Integration tests validate database operations (create, read, list)

**Technical Notes:**
- Use Prisma 5.x
- Configure connection pooling for Railway
- Use UUID for test IDs
- Set up cascade deletes for related records

---

### Story 4.3: File Storage for Screenshots and Logs

**Story Points:** 3 | **Priority:** P0

As a **backend system**,
I want **persistent file storage for screenshots and logs**,
so that **test artifacts are available for viewing in the web UI**.

**Acceptance Criteria:**

1. Storage adapter interface defined in `/backend/src/storage/adapter.ts`
2. Railway Volumes implementation for local file storage
3. File upload logic integrated into test orchestrator
4. Files stored with structure: `/data/{testId}/screenshots/{filename}`, `/data/{testId}/logs/{filename}`
5. Static file serving via Express: `/api/artifacts/:testId/:type/:filename`
6. File URLs stored in database (relative paths)
7. Cleanup job for old test artifacts (>30 days)
8. Handles file storage failures gracefully (logs error, continues test)
9. Integration test validates file upload and retrieval
10. Documentation includes Railway volumes configuration

**Technical Notes:**
- Use Railway Volumes ($0.25/GB/month)
- Consider Cloudflare R2 as future enhancement
- Implement signed URLs for secure access (optional for MVP)

---

### Story 4.4: WebSocket Support for Real-Time Test Progress

**Story Points:** 5 | **Priority:** P1

As a **web UI user**,
I want **real-time updates on test execution progress**,
so that **I can see what's happening during the 2-minute test cycle**.

**Acceptance Criteria:**

1. Socket.io server integrated into Express server
2. WebSocket endpoint: `ws://api.example.com/socket.io`
3. Client connection authenticated via test ID or session token
4. Progress events emitted:
   - `test:started` - Test initiated
   - `test:browser-launched` - Browser automation started
   - `test:ui-detected` - UI elements found
   - `test:screenshot-captured` - Screenshot taken (with label)
   - `test:ai-analyzing` - AI evaluation in progress
   - `test:completed` - Test finished (with result summary)
   - `test:error` - Error occurred (with error details)
5. Events include timestamp and contextual data
6. WebSocket connection cleanup on test completion
7. Handles client disconnection gracefully
8. Integration test validates WebSocket event flow
9. Frontend can connect and receive events
10. Performance: No significant overhead on test execution time

**Technical Notes:**
- Use Socket.io 4.x
- Consider Redis adapter for horizontal scaling (future)
- Emit events from test orchestrator at key milestones

---

### Story 4.5: React Frontend with Next.js Setup

**Story Points:** 3 | **Priority:** P0

As a **frontend developer**,
I want **a React application with Next.js configured for Cloudflare Pages**,
so that **I can build the web UI**.

**Acceptance Criteria:**

1. Next.js project created in `/frontend`
2. Configured for static export to Cloudflare Pages
3. TailwindCSS installed and configured
4. TypeScript configured with strict mode
5. Shared types imported from `/shared/types.ts`
6. API client configured to call Railway backend
7. Environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
8. Home page renders with placeholder content
9. Build succeeds: `npm run build` produces static output
10. Dev server runs: `npm run dev` serves app locally

**Technical Notes:**
- Use Next.js 14+ with App Router
- Configure `output: 'export'` for Cloudflare Pages
- Use Tailwind CSS 3.x
- Consider shadcn/ui for component library

---

### Story 4.6: Test Submission Form UI

**Story Points:** 3 | **Priority:** P0

As a **web user**,
I want **a form to submit game URLs for testing**,
so that **I can easily trigger QA tests from the browser**.

**Acceptance Criteria:**

1. Test submission page created at `/test/new`
2. Form fields:
   - Game URL (text input, required, validated)
   - Timeout (number input, optional, default: 120000ms)
   - Screenshot count (number, optional, default: 5)
3. Submit button triggers POST request to `/api/test`
4. Loading state displayed during submission
5. Success: Redirects to test results page (`/test/:id`)
6. Error: Displays validation errors or API errors
7. URL validation: Must be HTTP/HTTPS, no private IPs
8. Form accessible via keyboard navigation
9. Responsive design (works on mobile, tablet, desktop)
10. Manual test validates form submission creates test record

**Technical Notes:**
- Use React Hook Form for form management
- Use Zod for client-side validation (shared with backend)
- Use TanStack Query (React Query) for API calls

---

### Story 4.7: Test Results Display Page

**Story Points:** 5 | **Priority:** P0

As a **web user**,
I want **a detailed results page showing test outcomes**,
so that **I can understand game quality and identify issues**.

**Acceptance Criteria:**

1. Test results page created at `/test/:id`
2. Displays test metadata: Game URL, duration, timestamp, status
3. Playability score displayed prominently with grade (A-F) and confidence
4. Score components breakdown: visual, stability, interaction, load
5. Screenshot gallery: 5 images with labels (initial-load, post-start, mid-game, end-state, error)
6. Issues list: Grouped by severity (critical, major, minor), filterable
7. Console logs viewer: Tabbed view (errors, warnings, info), searchable
8. Network errors table: Failed requests with URLs, status codes, critical flag
9. Loading state while test is running (shows progress via WebSocket if available)
10. Export button: Download JSON report

**Technical Notes:**
- Use WebSocket for live updates (Story 4.4)
- Poll API if WebSocket unavailable
- Use image lightbox for screenshot viewing
- Consider virtualized lists for large log files

---

### Story 4.8: Test History Dashboard

**Story Points:** 3 | **Priority:** P1

As a **web user**,
I want **a dashboard showing all historical tests**,
so that **I can browse past results and track quality trends**.

**Acceptance Criteria:**

1. Dashboard page created at `/dashboard` (home page)
2. Summary statistics displayed:
   - Total tests run
   - Average playability score
   - Pass rate (score >= 70)
   - Tests in last 7 days
3. Recent tests list: Last 20 tests with status, score, game URL, timestamp
4. Each test row links to results page (`/test/:id`)
5. Filters: Status (all, success, failure, partial), Date range
6. Search bar: Filter by game URL (client-side filtering for MVP)
7. Pagination: 20 tests per page
8. Loading states and empty states handled
9. Responsive design
10. Manual test validates dashboard displays correct data

**Technical Notes:**
- Use TanStack Query with pagination
- Consider infinite scroll for future enhancement
- Use React Table or similar for sortable columns

---

### Story 4.9: Railway Deployment Configuration

**Story Points:** 2 | **Priority:** P0

As a **DevOps engineer**,
I want **Railway deployment configured for the backend**,
so that **the Express server runs in production**.

**Acceptance Criteria:**

1. Railway project created and linked to GitHub repository
2. Backend service configured to deploy from `/backend` directory
3. PostgreSQL addon added and connected
4. Environment variables configured in Railway:
   - DATABASE_URL (auto-configured by Railway)
   - OPENAI_API_KEY
   - PORT (default: 3000)
   - NODE_ENV=production
5. Build command configured: `npm install && npx prisma generate && npm run build`
6. Start command configured: `npm start` (runs compiled JS)
7. Health check endpoint monitored: `/health`
8. Deployment succeeds and server responds to HTTP requests
9. Database migrations run automatically on deployment
10. Logs viewable in Railway dashboard

**Technical Notes:**
- Use Railway CLI for local testing
- Configure Railway volumes for file storage (if using volumes)
- Set memory allocation: 512MB-1GB

---

### Story 4.10: Cloudflare Pages Deployment Configuration

**Story Points:** 2 | **Priority:** P0

As a **DevOps engineer**,
I want **Cloudflare Pages deployment configured for the frontend**,
so that **the React UI is accessible to users**.

**Acceptance Criteria:**

1. Cloudflare Pages project created and linked to GitHub repository
2. Frontend service configured to deploy from `/frontend` directory
3. Build command configured: `npm install && npm run build`
4. Output directory configured: `out` (Next.js static export)
5. Environment variables configured in Cloudflare:
   - NEXT_PUBLIC_API_URL (Railway backend URL)
   - NEXT_PUBLIC_WS_URL (WebSocket URL)
6. Custom domain configured (optional for MVP)
7. HTTPS enabled automatically
8. Deployment succeeds and site is accessible
9. Frontend connects to backend API successfully
10. Logs and analytics viewable in Cloudflare dashboard

**Technical Notes:**
- Configure `_redirects` file for client-side routing
- Use Cloudflare preview deployments for PR reviews

---

### Story 4.11: API Authentication & Rate Limiting

**Story Points:** 3 | **Priority:** P1

As a **backend system**,
I want **API key authentication and rate limiting**,
so that **programmatic API access is secure and abuse is prevented**.

**Acceptance Criteria:**

1. API key model added to Prisma schema (id, key, name, createdAt, lastUsedAt)
2. API key generation endpoint (admin-only): POST `/api/keys` (returns new key)
3. Authentication middleware: Checks `X-API-Key` header
4. Authenticated endpoints: POST `/api/test` requires API key
5. Public endpoints: GET `/api/test/:id`, GET `/health` (no auth required)
6. Rate limiting middleware using express-rate-limit:
   - API key authenticated: 100 requests/hour
   - Unauthenticated: 10 requests/hour per IP
7. 401 Unauthorized returned for missing/invalid API key
8. 429 Too Many Requests returned when rate limit exceeded
9. API key usage logged (lastUsedAt updated)
10. Integration tests validate authentication and rate limiting

**Technical Notes:**
- Use bcrypt for key hashing (optional: use UUIDs as keys)
- Consider JWT tokens for future web auth
- Document API key management in deployment docs

---

### Story 4.12: Comprehensive Documentation

**Story Points:** 2 | **Priority:** P0

As a **developer or DevOps engineer**,
I want **complete documentation covering setup, deployment, and API usage**,
so that **I can quickly onboard and deploy the system**.

**Acceptance Criteria:**

1. README.md updated with:
   - Project overview and architecture diagram
   - Quick start guide (local development)
   - Backend setup instructions (Railway, database, environment)
   - Frontend setup instructions (Cloudflare, environment)
   - API documentation with example requests
2. DEPLOYMENT.md created with:
   - Railway deployment steps
   - Cloudflare Pages deployment steps
   - Environment variable reference
   - Database migration procedures
   - Troubleshooting common deployment issues
3. API.md documents:
   - All REST endpoints with request/response examples
   - WebSocket events and payloads
   - Authentication requirements
   - Rate limiting policies
4. ARCHITECTURE.md updated to reflect full-stack architecture
5. Example `.env` files for backend and frontend
6. Database schema diagram generated from Prisma
7. Contribution guidelines (CONTRIBUTING.md)
8. Changelog (CHANGELOG.md) initialized
9. All documentation reviewed for accuracy
10. Links to live deployments included

**Technical Notes:**
- Use Mermaid diagrams for architecture visualization
- Include Postman collection or similar for API testing

---

### Story 4.13: End-to-End Validation Testing

**Story Points:** 3 | **Priority:** P0

As a **QA engineer**,
I want **comprehensive end-to-end validation of the deployed system**,
so that **we confirm production readiness**.

**Acceptance Criteria:**

1. Test 3+ diverse browser games via web UI:
   - Simple 2D platformer
   - 3D WebGL game
   - DOM-based puzzle game
2. Validate full workflow:
   - Submit test via web form
   - View real-time progress via WebSocket
   - Review completed test results
   - Browse test history in dashboard
3. Validate API workflow:
   - Submit test via POST `/api/test` with API key
   - Poll GET `/api/test/:id` for results
   - Retrieve completed test data
4. Accuracy validation: Compare AI scores to human evaluations (80%+ accuracy target)
5. Performance validation: All tests complete in <2 minutes
6. Error handling validation: Test with invalid URLs, network failures, timeouts
7. Cross-browser testing: Chrome, Firefox, Safari (for web UI)
8. Mobile responsiveness testing (web UI on phone/tablet)
9. Load testing: 5 concurrent tests (validate no resource exhaustion)
10. Documentation walkthrough: New developer follows setup guide successfully

**Technical Notes:**
- Use Playwright for automated E2E tests (optional)
- Document validation results in VALIDATION.md
- Include screenshots of web UI in validation report

---

## Testing Strategy

### Unit Tests
- API endpoint handlers (Express routes)
- Database operations (Prisma queries)
- Storage adapter (file upload/retrieval)
- Utility functions (validation, transformations)

### Integration Tests
- Full API workflow (submit test, retrieve results)
- Database integration (create test, query history)
- WebSocket event flow
- Frontend API client calls

### End-to-End Tests
- Web UI test submission and result viewing
- API test submission via curl/Postman
- Real browser game testing (3+ diverse games)
- Accuracy validation vs human baseline

### Manual Validation
- Visual inspection of web UI
- Usability testing (form submission, navigation)
- Cross-browser compatibility
- Mobile responsiveness

---

## Definition of Done

- [ ] All 13 story acceptance criteria met
- [ ] All unit tests passing (>70% coverage)
- [ ] All integration tests passing
- [ ] End-to-end validation complete with 3+ games
- [ ] Accuracy validation: 80%+ vs human baseline
- [ ] Backend deployed to Railway and accessible
- [ ] Frontend deployed to Cloudflare Pages and accessible
- [ ] Database migrations applied successfully
- [ ] All documentation complete and reviewed
- [ ] No P0 or P1 bugs remaining
- [ ] Performance targets met (<2 minute execution)
- [ ] API authentication and rate limiting functional

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Pages (Frontend)                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │       React + Next.js (Static Site)                  │   │
│  │                                                       │   │
│  │  Pages:                                              │   │
│  │  - /dashboard (Test History)                        │   │
│  │  - /test/new (Submit Form)                          │   │
│  │  - /test/:id (Results Display)                      │   │
│  │                                                       │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │ HTTP/WebSocket                           │
└──────────────────┼──────────────────────────────────────────┘
                   │
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                Railway (Backend + Database)                  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Express REST API + WebSocket Server            │  │
│  │                                                        │  │
│  │  Endpoints:                                           │  │
│  │  - POST /api/test (Submit test)                      │  │
│  │  - GET /api/test/:id (Get results)                   │  │
│  │  - GET /api/tests (List history)                     │  │
│  │  - WS /socket.io (Real-time progress)               │  │
│  │                                                        │  │
│  │  Modules:                                             │  │
│  │  - Browser Controller (Playwright)                   │  │
│  │  - Evidence Capture (Screenshots, Logs)             │  │
│  │  - AI Evaluator (Claude API)                         │  │
│  │  - Report Generator                                   │  │
│  └─────────┬──────────────────┬─────────────────────────┘  │
│            │                  │                             │
│  ┌─────────▼──────┐  ┌───────▼──────────┐                 │
│  │   PostgreSQL    │  │  Railway Volumes │                 │
│  │   (Test Data)   │  │  (Screenshots)   │                 │
│  └─────────────────┘  └──────────────────┘                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                   │
                   │ HTTPS API Calls
                   ▼
        ┌──────────────────────┐
        │  Anthropic Claude    │
        │  3.5 Sonnet API      │
        └──────────────────────┘
```

---

**Epic Status:** Ready for Sprint Planning
**Estimated Duration:** 1.5 Sprints (8-10 days, extended for full-stack complexity)
**Previous Epic:** Epic 3 - AI-Powered Evaluation Engine
**Next Phase:** Production Monitoring & Continuous Improvement

---

## Post-Epic Success Criteria

Upon completion of Epic 4, the system should be:
- [ ] Accessible via web browser (Cloudflare URL)
- [ ] API accessible with authentication (Railway URL)
- [ ] Storing test history in PostgreSQL
- [ ] Serving screenshots and logs via static files
- [ ] Supporting real-time test progress updates
- [ ] Achieving 80%+ accuracy on diverse games
- [ ] Completing tests in <2 minutes
- [ ] Fully documented for team adoption
- [ ] Ready for DreamUp agent API integration

**Handoff to:** DreamUp game-building agent team for API integration and autonomous self-improvement feedback loop.
