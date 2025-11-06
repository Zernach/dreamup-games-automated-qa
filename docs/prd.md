# DreamUp Browser Game QA Pipeline - Product Requirements Document (PRD)

**Version:** 1.0
**Date:** November 6, 2025
**Status:** Draft
**Owner:** DreamUp Engineering Team

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-06 | 1.0 | Initial PRD creation from Project Brief v1.3 | BMad Master |

---

## Goals and Background Context

### Goals

- Enable the DreamUp game-building agent to autonomously test 100% of generated games and receive actionable feedback for self-improvement
- Reduce manual QA time by 70% within the first month of deployment through automated testing
- Achieve 80%+ accuracy on playability assessments compared to human evaluation
- Successfully test 3+ diverse browser game types (2D/3D, Canvas/UI-based, various input schemes) end-to-end
- Demonstrate production-ready AI agent architecture suitable for Railway deployment
- Provide structured, machine-readable JSON reports with visual evidence for debugging
- Complete full test cycles in under 2 minutes per game
- Handle common failure modes (crashes, slow loads, rendering issues) gracefully with <5% unhandled crash rate

### Background Context

DreamUp is a general AI game generator that emerged from Gauntlet's first 24-hour hackathon. Currently, it lacks an automated mechanism to evaluate the quality and playability of generated games. Manual QA is time-consuming, inconsistent, and doesn't scale with the rapid iteration cycles needed for AI-driven game generation. Without automated QA, DreamUp cannot achieve autonomous self-improvement, limiting its potential as a production-ready game generation platform.

This system will combine browser automation, evidence capture, and LLM-powered evaluation to autonomously test browser games. It accepts any web-hosted game URL and produces structured quality assessment reports with supporting visual artifacts. The solution leverages DreamUp's game engine context (Scene Stack architecture and Input System) to make informed testing decisions, distinguishing it from generic browser testing tools.

---

## Requirements

### Functional Requirements

**FR1:** The system shall accept a browser game URL as input via CLI argument or programmatic API call.

**FR2:** The system shall load the game URL in a headless browser (Chrome/Chromium) and wait for page load completion with configurable timeout (default: 30 seconds).

**FR3:** The system shall detect and interact with common UI patterns including start buttons, menus, clickable elements, and game over screens using DOM inspection and visual analysis.

**FR4:** The system shall attempt to discover game controls by testing common input patterns (WASD, arrow keys, mouse clicks, touch events) and optionally accept an input schema prompt (JavaScript snippet or semantic description).

**FR5:** The system shall recognize DreamUp Scene Stack types (Canvas2D, Canvas3D, UI, Composite) and adjust interaction strategies accordingly.

**FR6:** The system shall capture 3-5 timestamped screenshots during key moments of the test session (initial load, post-start, mid-gameplay, end state, error states).

**FR7:** The system shall capture and store browser console logs, including JavaScript errors, warnings, and network errors throughout the test session.

**FR8:** The system shall save all captured artifacts (screenshots, logs) to a structured output directory with timestamp-based organization.

**FR9:** The system shall send captured screenshots and logs to an LLM API (OpenAI GPT-4V or Anthropic Claude 3.5 Sonnet) for playability analysis.

**FR10:** The LLM evaluation shall assess: successful game load, responsive controls, visual rendering quality, and overall stability.

**FR11:** The system shall output structured JSON containing: test status (pass/fail/partial), playability score (0-100), detailed issue descriptions, screenshot file paths, console log summary, and timestamp.

**FR12:** The system shall implement retry logic for transient failures (network issues, temporary unresponsiveness) with configurable retry attempts (default: 2 retries).

**FR13:** The system shall implement timeout mechanisms for each testing phase (load, interaction, completion) to prevent indefinite hanging.

**FR14:** The system shall handle common failure modes gracefully: crash detection, slow load warnings, rendering failures, unresponsive controls, and produce descriptive error messages in output JSON.

**FR15:** The system shall support both local execution (`bun run qa.ts <game-url>` or `npx tsx qa.ts <game-url>`) and programmatic invocation via REST API.

**FR16:** The system shall validate that games follow expected browser game patterns and flag unusual structures that may affect testing accuracy.

**FR17:** The system shall provide confidence scores (0-100) alongside all assessments to indicate reliability of the evaluation.

**FR18:** The system shall log all testing activities to a structured log file for debugging and audit purposes.

### Non-Functional Requirements

**NFR1:** The system shall complete a full test cycle (load, interact, evaluate, report) in under 2 minutes per game under normal conditions.

**NFR2:** The system shall be deployable as a persistent Node.js Express server on Railway with appropriate resource allocation (512MB-1GB memory recommended).

**NFR3:** The system shall use Playwright for browser automation with appropriate resource management for persistent server execution.

**NFR4:** The system shall minimize LLM API costs by batching screenshot analysis and using cost-effective models where appropriate.

**NFR5:** The system shall handle LLM API rate limits gracefully with exponential backoff and clear error messages.

**NFR6:** The system shall be implemented in TypeScript with clean, modular architecture: browser controller module, evidence capture module, AI evaluator module, report generator module.

**NFR7:** The system shall include comprehensive code documentation with JSDoc comments for all public functions and interfaces.

**NFR8:** The system shall include a detailed README with setup instructions, usage examples, configuration options, and example output formats.

**NFR9:** The system shall securely manage LLM API keys via environment variables with no hardcoded credentials.

**NFR10:** The system shall execute browser automation in a sandboxed environment with appropriate resource cleanup to prevent memory leaks in long-running server processes.

**NFR15:** The system shall provide a REST API for programmatic test invocation with proper authentication and rate limiting.

**NFR16:** The system shall serve a web frontend via Cloudflare for viewing test results, browsing test history, and triggering new tests.

**NFR11:** The system shall achieve 80%+ accuracy on playability assessments when compared to human evaluations on a validation dataset.

**NFR12:** The system shall handle edge cases (WebGL games, custom rendering, games without clear UI patterns) with appropriate fallback behavior and warnings rather than crashes.

**NFR13:** The system shall produce deterministic output given the same game URL and configuration (excluding timestamp variations).

**NFR14:** The system shall be extensible to support future enhancements (batch testing, GIF recording, FPS monitoring) without major architectural refactoring.

---

## User Interface Design Goals

### Overall UX Vision

The system provides multiple access methods to serve different user needs:

**Web Dashboard (Primary):**
- Clean, modern interface for viewing test results
- Real-time test execution progress
- Historical test result browsing
- Screenshot gallery view
- Issue filtering and categorization

**REST API (For Automation):**
- Simple POST endpoint to trigger tests
- GET endpoints to retrieve test results
- WebSocket support for real-time progress updates
- API key authentication

**CLI (For Development):**
- Local development and debugging
- Quick one-off tests
- Structured JSON output

### Key Interaction Paradigms

**Web Dashboard Workflow:**
1. User navigates to web interface (Cloudflare-hosted)
2. Enters game URL in test form
3. Clicks "Run Test" button
4. Views real-time progress updates
5. Reviews test results with screenshots and issues
6. Browses historical test results

**API Integration Workflow:**
1. Client sends POST request to `/api/test` with game URL
2. Server returns test ID immediately
3. Client polls `/api/test/:id` for results or subscribes to WebSocket
4. Client retrieves final report when complete

**CLI Workflow:**
1. Developer runs `npm run test <game-url>`
2. Views progress in terminal
3. Reviews JSON report output

### Core Screens and Views

**1. Test Dashboard (Home)**
- Recent tests list with status indicators
- "New Test" button
- Summary statistics (total tests, pass rate, avg score)

**2. Test Submission Form**
- Game URL input field
- Optional configuration (timeout, screenshot count)
- Submit button
- Validation feedback

**3. Test Results Page**
- Playability score with grade (A-F)
- Screenshot gallery (5 images)
- Console logs viewer
- Issues list categorized by severity
- Test metadata (duration, timestamp, confidence)

**4. Test History Page**
- Paginated list of all tests
- Filters (status, date range, score range)
- Search by game URL
- Export to CSV option

### Accessibility

**WCAG AA Compliance Goal:**
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Responsive design for mobile/tablet viewing

### Branding

**Modern, Clean Interface:**
- DreamUp color scheme (consistent with company branding if available)
- Clear, readable typography
- Professional but approachable aesthetic
- Minimal, focused UI without clutter

### Target Device and Platforms

**Development:** macOS, Linux, Windows with Node.js 20+ runtime
**Backend Deployment:** Railway (Node.js Express server)
**Frontend Deployment:** Cloudflare Pages
**Browser Testing Target:** Chrome/Chromium headless browser
**Web UI Browsers:** Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

---

## Technical Assumptions

### Repository Structure: Monorepo

**Full-stack monorepo structure:**
- `/backend` - Express server with REST API
- `/frontend` - React + Vite web application
- `/shared` - Shared TypeScript types and utilities
- Clear separation allows independent deployment to Railway (backend)

### Service Architecture

**Node.js Express Server with React Frontend:**
- **Backend (Railway):** Express REST API handling test orchestration, browser automation, AI evaluation
- **Frontend (Cloudflare):** React-based web UI for test submission and result viewing
- **Database:** PostgreSQL on Railway for test history, results storage
- **File Storage:** Railway volumes or Cloudflare R2 for screenshot/log artifacts
- **Real-time Updates:** WebSocket support for live test progress
- **Stateful design:** Long-running tests managed via job queue (optional: Bull + Redis)

### Testing Requirements

**Unit + Integration Testing:**
- Unit tests for core logic (evidence capture, report generation, utility functions)
- Integration tests for browser automation flows using test game fixtures
- Mock LLM responses for deterministic integration testing
- Manual validation testing against 3+ diverse real browser games
- No E2E automated testing required for MVP (manual validation sufficient)

### Additional Technical Assumptions and Requests

**Language & Runtime:**
- TypeScript 5.x for full-stack type safety
- Node.js 20.x for backend Express server on Railway
- React 18+ with Vite for frontend build tooling

**Browser Automation:**
- Playwright as primary browser automation library
- Chromium headless browser on Railway
- Resource cleanup for long-running server process

**LLM Integration:**
- Anthropic Claude 3.5 Sonnet API as primary choice (excellent vision capabilities, cost-effective)
- OpenAI GPT-4V as secondary option for comparison benchmarking
- Direct API calls (simple, no LangChain needed for MVP)

**Database & Storage:**
- PostgreSQL on Railway for test results and history
- Railway volumes for screenshot/log storage OR Cloudflare R2
- Prisma ORM for type-safe database access
- Database migrations managed via Prisma Migrate

**Frontend Framework:**
- React 18 with Vite for fast build times and development experience
- React Router for client-side routing
- TailwindCSS for styling
- TanStack Query for data fetching
- Zustand or React Context for state management

**API Design:**
- RESTful API with Express
- WebSocket support via Socket.io for real-time test progress
- API key authentication for programmatic access
- Rate limiting with express-rate-limit

**Environment Configuration:**
- dotenv for local development
- Railway environment variables for production backend
- Cloudflare environment variables for frontend

**Logging & Monitoring:**
- Structured logging using pino
- Railway logs for backend monitoring
- Error tracking via Sentry (optional)
- Performance monitoring via Railway metrics

**Code Quality:**
- ESLint with TypeScript-specific rules
- Prettier for consistent code formatting
- Husky pre-commit hooks for linting and formatting
- Type safety enforced (strict mode enabled in tsconfig.json)

**Deployment:**
- **Backend:** Railway auto-deployment from `main` branch (`/backend` directory)
- **Frontend:** Cloudflare Pages auto-deployment from `main` branch (`/frontend` directory)
- Database migrations run automatically on Railway deployment
- Health check endpoints for uptime monitoring

**Security:**
- No sensitive data in screenshots or logs (games are public URLs)
- Sandboxed browser execution with resource limits
- LLM API keys managed via environment variables only
- Input validation for game URLs (prevent SSRF attacks)
- CORS configuration for Cloudflare frontend
- Rate limiting on API endpoints
- API key authentication for programmatic access

---

## Epic List

### Epic 1: Foundation & Browser Automation Core
**Goal:** Establish project infrastructure with TypeScript setup, CI/CD foundation, and implement core browser automation capabilities to load games and detect basic UI patterns.

### Epic 2: Evidence Capture & Artifact Management
**Goal:** Build the evidence collection system to capture screenshots, console logs, and errors at key moments, storing them in a structured output format suitable for analysis.

### Epic 3: AI-Powered Evaluation Engine
**Goal:** Integrate LLM APIs to analyze captured evidence and produce structured playability assessments with confidence scores and detailed issue reporting.

### Epic 4: Full-Stack Deployment & Web Interface
**Goal:** Build REST API with Express on Railway, create React frontend on Cloudflare, implement database storage, and deliver production-ready web application.

---

## Epic 1: Foundation & Browser Automation Core

**Epic Goal:** Establish the foundational project structure with TypeScript configuration, testing framework, and core browser automation capabilities. Deliver a functional CLI tool that can load any browser game URL, detect and interact with basic UI elements (start buttons, clickable controls), and output basic test results. This epic creates the architectural foundation while delivering initial value through automated game loading and basic interaction detection.

### Story 1.1: Project Setup & TypeScript Configuration

As a **developer**,
I want **a properly configured TypeScript project with necessary dependencies and scripts**,
so that **I can build, run, and test the QA pipeline with modern tooling**.

**Acceptance Criteria:**

1. Repository initialized with Git, proper .gitignore (node_modules, .env, output artifacts)
2. package.json configured with TypeScript, Playwright, dotenv, and testing dependencies (Vitest or Jest)
3. tsconfig.json configured with strict mode, Node.js 20 target, and ES2022 module resolution
4. ESLint and Prettier configured with TypeScript rules and pre-commit hooks via Husky
5. Directory structure established: src/ (main source), src/modules/ (browser, capture, evaluator, reporter), tests/ (unit and integration), output/ (test artifacts)
6. Scripts defined in package.json: `dev` (run with Bun/TSX), `build` (compile TypeScript), `test` (run test suite), `lint` (run ESLint)
7. README.md includes initial setup instructions, required Node.js version, and basic project description
8. Environment variable template (.env.example) created with placeholders for LLM API keys and configuration

### Story 1.2: CLI Argument Parser & Basic Configuration

As a **developer**,
I want **a CLI interface that accepts a game URL and optional configuration flags**,
so that **I can easily invoke the QA pipeline from the command line**.

**Acceptance Criteria:**

1. CLI entry point (src/cli.ts) accepts game URL as first positional argument (required)
2. Optional flags supported: --output-dir (default: ./output), --timeout (default: 120000ms), --verbose (enable detailed logging)
3. Input validation: game URL must be valid HTTP/HTTPS format, reject file:// and other protocols
4. Help text displayed with --help flag showing usage examples and available options
5. Version displayed with --version flag
6. Configuration object constructed from CLI args and environment variables
7. Error handling for missing URL argument with clear usage instructions
8. Logs configuration summary when --verbose flag enabled

### Story 1.3: Browser Automation Setup with Playwright

As a **developer**,
I want **a browser controller module that can launch a headless browser and load game URLs**,
so that **I can begin automated interaction with browser games**.

**Acceptance Criteria:**

1. BrowserController class created in src/modules/browser/controller.ts
2. Playwright browser instance launches in headless mode with configurable options (viewport size: 1280x720, user agent)
3. Browser context created with appropriate permissions (no notifications, geolocation disabled)
4. Page navigation method accepts game URL and waits for network idle state with configurable timeout
5. Page load success/failure detected with appropriate error handling (DNS errors, 404s, timeout)
6. Console message listeners attached to capture logs (info, warning, error levels)
7. Error listeners attached to capture uncaught exceptions and promise rejections
8. Browser cleanup method ensures proper resource disposal (close browser instance)
9. Integration test validates browser can load a simple test HTML page successfully
10. Logs all browser lifecycle events when verbose mode enabled

### Story 1.4: UI Pattern Detection for Game Start Elements

As a **QA automation system**,
I want **to detect and identify common game UI elements like start buttons and menus**,
so that **I can autonomously begin game interaction without manual configuration**.

**Acceptance Criteria:**

1. UIDetector class created in src/modules/browser/ui-detector.ts
2. Detects buttons with common "start" patterns via text content matching (case-insensitive): "start", "play", "begin", "start game", "play now"
3. Detects buttons via common CSS selectors: button, .btn, .start-button, input[type="button"]
4. Detects interactive canvas elements (likely game rendering targets) via canvas, #gameCanvas selectors
5. Detects menu containers via common semantic patterns: nav, .menu, .game-menu, #mainMenu
6. Returns structured UIElements object containing: startButtons[], menuElements[], canvasElements[], otherInteractive[]
7. Each detected element includes: selector path, element type, bounding box coordinates, visible text content
8. Handles pages with no detected UI elements gracefully (returns empty arrays, logs warning)
9. Includes confidence scoring for detected elements based on pattern strength
10. Unit tests validate detection against mock HTML structures with various UI patterns

### Story 1.5: Basic Game Interaction Sequence

As a **QA automation system**,
I want **to execute a basic interaction sequence starting a game and attempting simple actions**,
so that **I can validate the game responds to user input**.

**Acceptance Criteria:**

1. InteractionController class created in src/modules/browser/interaction-controller.ts
2. Interaction sequence: wait for page load → detect UI elements → click start button (if found) → wait for game state change
3. After start button click, wait 2 seconds for game initialization
4. Attempt common input actions: click center of canvas (3 times), press spacebar (3 times), press arrow keys (up, down, left, right)
5. Each interaction followed by 500ms delay to allow game response
6. Detect game state changes by monitoring DOM mutations and canvas frame updates
7. Timeout mechanism for each interaction phase (max 10 seconds per phase)
8. Logs all attempted interactions with success/failure indicators
9. Handles missing start button gracefully (proceeds directly to input attempts)
10. Returns InteractionReport object: startButtonFound: boolean, startButtonClicked: boolean, inputActionsAttempted: string[], apparentResponses: string[]

### Story 1.6: Basic Test Report Generation

As a **developer**,
I want **structured JSON output summarizing the test execution and results**,
so that **I can programmatically consume test results and debug issues**.

**Acceptance Criteria:**

1. ReportGenerator class created in src/modules/reporter/generator.ts
2. TestReport interface defined with fields: testId (UUID), gameUrl, timestamp (ISO 8601), status (success|failure|partial), duration (ms), details: {}
3. Details object includes: loadSuccess: boolean, loadTime: ms, uiElementsDetected: {}, interactionsSummary: {}, errors: []
4. Report serialized to JSON with pretty-printing (2-space indent)
5. Report written to output directory: {output-dir}/{testId}/report.json
6. Console output displays summary: test status, duration, key findings (start button found, interactions attempted)
7. Handles errors during report generation gracefully (logs error, outputs partial report with error flag)
8. Includes metadata: toolVersion, browserVersion, timestamp
9. Unit tests validate report structure matches interface definition

### Story 1.7: End-to-End Basic Test Workflow

As a **developer**,
I want **to run the complete test workflow from CLI invocation to report output**,
so that **I can validate the system works end-to-end with a real browser game**.

**Acceptance Criteria:**

1. Main orchestrator function created (src/index.ts) coordinating all modules: browser controller, UI detector, interaction controller, report generator
2. Workflow sequence: parse CLI args → launch browser → navigate to game URL → detect UI → execute interactions → generate report → cleanup browser
3. Error handling at each stage with descriptive messages and graceful degradation
4. Progress logging to console: "Loading game...", "Detecting UI...", "Executing interactions...", "Generating report..."
5. Final output message displays report location and summary
6. Integration test validates complete workflow using a simple test game HTML file (included in tests/fixtures/)
7. Manual validation successful against 1 real browser game (simple 2D game with obvious start button)
8. Execution time logged and validated under 2 minutes for typical games
9. Cleanup ensures no orphaned browser processes remain after execution (normal or error termination)

---

## Epic 2: Evidence Capture & Artifact Management

**Epic Goal:** Implement comprehensive evidence collection capabilities to capture screenshots at strategic moments, record console logs and errors, and organize all artifacts in a structured output format. This enables visual debugging and provides the raw materials for LLM-powered evaluation, transforming basic interaction logs into rich, analyzable evidence.

### Story 2.1: Screenshot Capture Module

As a **QA automation system**,
I want **to capture screenshots at key moments during test execution**,
so that **I can provide visual evidence of game state for analysis and debugging**.

**Acceptance Criteria:**

1. ScreenshotCapture class created in src/modules/capture/screenshot.ts
2. Capture method accepts label parameter (e.g., "initial-load", "post-start", "mid-game", "end-state", "error")
3. Screenshots saved as PNG files to {output-dir}/{testId}/screenshots/{timestamp}-{label}.png
4. Filename includes UTC timestamp with milliseconds for precise ordering
5. Screenshot metadata stored: timestamp, label, file path, file size, viewport dimensions
6. Handles screenshot failures gracefully (logs error, continues test, marks screenshot as failed in metadata)
7. Configurable screenshot quality/compression (default: 80% quality)
8. Returns ScreenshotResult object: success: boolean, filePath: string, timestamp: string, error?: string
9. Unit tests validate file creation and metadata accuracy using mock Playwright page
10. Integration test captures screenshots from real browser page and validates files exist with correct naming

### Story 2.2: Strategic Screenshot Timing Logic

As a **QA automation system**,
I want **screenshots captured at strategically chosen moments that reveal game state**,
so that **visual evidence covers all critical phases of the test session**.

**Acceptance Criteria:**

1. ScreenshotOrchestrator class created in src/modules/capture/orchestrator.ts
2. Implements screenshot schedule: initial page load (after DOMContentLoaded), pre-interaction (after UI detection), post-start (2 seconds after start button click), mid-game (30 seconds into gameplay), end-state (at test completion or timeout)
3. Additional error-triggered screenshot: captured immediately when uncaught error detected
4. Each screenshot labeled clearly in metadata and filename
5. Maximum 5 screenshots per test session to control storage and LLM API costs
6. Screenshots skipped if previous screenshot timestamp within 1 second (prevents duplicates from rapid events)
7. Integrates with InteractionController to trigger screenshots at appropriate interaction milestones
8. Returns ScreenshotManifest object: screenshots: ScreenshotResult[], totalCaptured: number
9. Integration test validates correct number and timing of screenshots across full test workflow
10. Manual validation confirms screenshots contain meaningful visual content (not blank/black screens)

### Story 2.3: Console Log Capture & Categorization

As a **QA automation system**,
I want **to capture and categorize all browser console messages during test execution**,
so that **I can identify JavaScript errors, warnings, and unexpected behavior**.

**Acceptance Criteria:**

1. ConsoleCapture class created in src/modules/capture/console.ts
2. Listens to Playwright page console events: log, info, warning, error, debug
3. Each console message stored with: timestamp, level, text content, source location (file, line, column), stack trace (for errors)
4. Messages categorized by level: error (highest priority), warning, info, log, debug (lowest priority)
5. Console output saved to {output-dir}/{testId}/logs/console.log (human-readable format)
6. Console output also saved to {output-dir}/{testId}/logs/console.json (structured JSON for programmatic parsing)
7. Error messages deduplicated (same error message repeated multiple times counted once with occurrence count)
8. Returns ConsoleReport object: errorCount, warningCount, infoCount, criticalErrors: string[], allMessages: ConsoleMessage[]
9. Handles large console output gracefully (truncate messages exceeding 5000 characters)
10. Unit tests validate message categorization and deduplication logic

### Story 2.4: Network Error Detection & Capture

As a **QA automation system**,
I want **to detect and capture network errors during game loading and execution**,
so that **I can identify resource loading failures that impact game functionality**.

**Acceptance Criteria:**

1. NetworkCapture class created in src/modules/capture/network.ts
2. Listens to Playwright page request and response events
3. Captures failed requests: status code >= 400, timeout errors, connection refused, DNS failures
4. Each failed request stored with: URL, method, status code, error message, timestamp, resource type (script, stylesheet, image, etc.)
5. Network errors saved to {output-dir}/{testId}/logs/network.json
6. Returns NetworkReport object: totalRequests, failedRequests, criticalFailures: NetworkError[] (JS/CSS files that failed to load)
7. Distinguishes critical failures (scripts, stylesheets) from non-critical (images, fonts)
8. Includes summary statistics: total failed requests, failure rate percentage
9. Integration test validates network error capture using test page with intentionally broken resource URLs
10. Handles large numbers of requests efficiently (no memory leaks from storing all request data)

### Story 2.5: Structured Output Directory Management

As a **developer**,
I want **all test artifacts organized in a predictable, structured directory hierarchy**,
so that **I can easily locate and process evidence files programmatically**.

**Acceptance Criteria:**

1. OutputManager class created in src/modules/output/manager.ts
2. Directory structure created: {output-dir}/{testId}/ containing subdirectories: screenshots/, logs/, report.json
3. testId generated as UUID v4 for unique identification
4. Metadata file created: {output-dir}/{testId}/metadata.json containing: testId, gameUrl, startTime, endTime, toolVersion, configuration
5. Ensures output directory exists and is writable before test execution begins
6. Provides utility methods: getScreenshotPath(label), getLogPath(type), getReportPath()
7. Cleanup method removes incomplete test outputs (if test crashes before report generation)
8. Returns OutputPaths object with all relevant file paths for easy access by other modules
9. Handles permission errors gracefully (clear error message if output directory not writable)
10. Unit tests validate directory creation and path generation logic

### Story 2.6: Artifact Manifest Generation

As a **developer**,
I want **a manifest file listing all captured artifacts with metadata**,
so that **I can quickly inventory available evidence without scanning directories**.

**Acceptance Criteria:**

1. ManifestGenerator class created in src/modules/output/manifest.ts
2. Manifest file created: {output-dir}/{testId}/manifest.json
3. Manifest includes: artifacts[] array with entries for each screenshot, log file, report
4. Each artifact entry contains: type (screenshot|log|report), filePath (relative to test directory), fileSize (bytes), timestamp, label/description
5. Manifest generated after all evidence capture completes, before final report
6. Manifest includes summary statistics: total artifacts, total storage size, capture duration
7. Handles missing artifacts gracefully (logs warning, marks artifact as unavailable in manifest)
8. Returns Manifest object for inclusion in final test report
9. Unit tests validate manifest structure and completeness
10. Integration test validates manifest accurately reflects all files created during test

---

## Epic 3: AI-Powered Evaluation Engine

**Epic Goal:** Integrate LLM vision APIs to analyze captured screenshots and logs, producing intelligent playability assessments with confidence scores and detailed issue identification. This epic transforms raw evidence into actionable feedback by leveraging AI to evaluate visual rendering, interaction responsiveness, and overall game quality in a way that mimics human QA judgment.

### Story 3.1: LLM API Client Configuration

As a **developer**,
I want **a reusable LLM API client with proper authentication and error handling**,
so that **I can reliably send evidence to AI models for analysis**.

**Acceptance Criteria:**

1. LLMClient class created in src/modules/evaluator/llm-client.ts
2. Supports Anthropic Claude 3.5 Sonnet API with vision capabilities
3. API key loaded from environment variable (OPENAI_API_KEY)
4. Validates API key exists before making requests (fail fast with clear error message)
5. Implements request method with retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
6. Handles rate limiting (429 status) with appropriate backoff and retry
7. Handles timeout errors (configurable timeout: 60 seconds per request)
8. Parses API responses and extracts JSON content from LLM output
9. Returns structured LLMResponse object: success: boolean, content: any, error?: string, usage: {input_tokens, output_tokens}
10. Unit tests validate error handling using mocked API responses (rate limit, timeout, invalid JSON)

### Story 3.2: Screenshot Analysis Prompt Engineering

As a **QA automation system**,
I want **carefully crafted prompts that guide the LLM to analyze game screenshots effectively**,
so that **visual evaluation produces accurate and actionable assessments**.

**Acceptance Criteria:**

1. PromptBuilder class created in src/modules/evaluator/prompts.ts
2. buildScreenshotAnalysisPrompt() method generates prompt for multi-screenshot analysis
3. Prompt includes: context about browser game testing, description of what to look for (successful load, rendering quality, visible errors, UI responsiveness indicators)
4. Prompt requests structured output: JSON object with fields {load_success: boolean, visual_quality: 0-100, apparent_issues: string[], confidence: 0-100, reasoning: string}
5. Prompt includes all screenshot images with labels indicating capture timing (initial, post-start, mid-game, end-state)
6. Prompt emphasizes identifying: blank/black screens, error messages visible in UI, frozen/unresponsive states, visual glitches, missing assets
7. Prompt guides LLM to consider temporal progression across screenshots (does game state evolve appropriately?)
8. Example output structure included in prompt to ensure consistent formatting
9. Unit tests validate prompt structure and inclusion of all required elements
10. Manual validation against Claude API confirms prompt produces expected JSON output format

### Story 3.3: Console Log Analysis Integration

As a **QA automation system**,
I want **the LLM to analyze console logs alongside screenshots for comprehensive evaluation**,
so that **hidden errors and warnings inform the playability assessment**.

**Acceptance Criteria:**

1. buildConsoleLogAnalysisPrompt() method added to PromptBuilder
2. Prompt accepts console log summary: error messages, warning messages, critical network failures
3. Prompt requests LLM to identify: critical JavaScript errors, game-breaking exceptions, resource loading failures, performance warnings
4. Prompt asks LLM to categorize severity: critical (game-breaking), major (significant functionality impaired), minor (cosmetic or non-blocking)
5. Console log prompt produces JSON output: {critical_errors: string[], major_issues: string[], minor_issues: string[], overall_stability: 0-100, confidence: 0-100}
6. Handles large console logs by summarizing (include all errors, sample of warnings, truncate repetitive info messages)
7. Integrates with screenshot analysis prompt for combined evaluation (screenshots + logs analyzed together)
8. Prompt includes examples of common game errors to calibrate LLM understanding
9. Unit tests validate prompt handles empty logs gracefully (no errors found scenario)
10. Integration test validates LLM produces expected output format given sample console logs

### Story 3.4: Playability Score Calculation

As a **QA automation system**,
I want **a composite playability score derived from multiple evaluation factors**,
so that **the test report provides a clear, quantitative quality metric**.

**Acceptance Criteria:**

1. ScoreCalculator class created in src/modules/evaluator/scorer.ts
2. Accepts evaluation inputs: visual_quality (0-100), overall_stability (0-100), load_success (boolean), critical_errors (count), interaction_responsiveness (0-100)
3. Scoring formula: playability_score = (visual_quality * 0.3 + overall_stability * 0.3 + interaction_responsiveness * 0.25 + load_score * 0.15)
4. load_score = 100 if load_success, else 0
5. Penalizes critical errors: subtract 20 points per critical error (minimum score: 0)
6. Returns PlayabilityScore object: score: 0-100, components: {visual, stability, interaction, load}, confidence: 0-100, grade: "A"|"B"|"C"|"D"|"F"
7. Grade mapping: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)
8. Confidence score is average of LLM-provided confidence scores from visual and log analysis
9. Includes reasoning string explaining score calculation and major factors
10. Unit tests validate scoring formula and edge cases (perfect score, zero score, partial failures)

### Story 3.5: Issue Detection & Categorization

As a **developer**,
I want **identified issues categorized by severity and type with actionable descriptions**,
so that **I can prioritize fixes and understand failure modes clearly**.

**Acceptance Criteria:**

1. IssueDetector class created in src/modules/evaluator/issue-detector.ts
2. Aggregates issues from LLM analysis (visual issues, console errors) and test execution (timeouts, unresponsive UI)
3. Each issue categorized by severity: critical, major, minor
4. Each issue categorized by type: rendering, interaction, loading, stability, performance
5. Issue object structure: {id: UUID, severity, type, description, evidence: [screenshot paths or log excerpts], timestamp, confidence: 0-100}
6. Deduplicates similar issues (e.g., "black screen" from screenshot and "rendering failure" from logs merged into single issue)
7. Returns IssueReport object: issues: Issue[], criticalCount, majorCount, minorCount, summary: string
8. Generates human-readable summary: "3 critical issues detected: rendering failure, unresponsive controls, JavaScript errors"
9. Sorts issues by severity (critical first) and confidence (high confidence first)
10. Unit tests validate categorization logic and deduplication with sample issue data

### Story 3.6: Confidence Scoring & Uncertainty Handling

As a **QA automation system**,
I want **confidence scores that reflect evaluation uncertainty**,
so that **users understand when assessments may be unreliable or require human review**.

**Acceptance Criteria:**

1. ConfidenceCalculator class created in src/modules/evaluator/confidence.ts
2. Calculates overall confidence based on: LLM confidence scores, screenshot quality (blank screenshots reduce confidence), console log completeness, test execution completeness
3. Reduces confidence for: fewer than 5 screenshots captured, high rate of screenshot failures, no console logs captured, test timeout before completion
4. Confidence formula: base_confidence (from LLM) * completeness_factor * quality_factor
5. completeness_factor = (successful_screenshots / expected_screenshots) * (logs_captured ? 1.0 : 0.7)
6. quality_factor = 1.0 if no blank screenshots, 0.8 if 1-2 blank, 0.6 if 3+ blank
7. Flags low confidence results (confidence < 60) with warning in report: "Low confidence - manual review recommended"
8. Returns ConfidenceReport object: overall_confidence: 0-100, factors: {llm, completeness, quality}, warnings: string[]
9. Includes reasoning string explaining confidence calculation
10. Unit tests validate confidence adjustments for various evidence quality scenarios

### Story 3.7: End-to-End AI Evaluation Pipeline

As a **developer**,
I want **the complete AI evaluation workflow integrated into the test orchestrator**,
so that **test reports include AI-powered playability assessments and issue detection**.

**Acceptance Criteria:**

1. EvaluationOrchestrator class created in src/modules/evaluator/orchestrator.ts
2. Orchestrates evaluation sequence: prepare evidence (load screenshots, load logs) → build prompts → call LLM API → parse responses → calculate playability score → detect issues → calculate confidence
3. Integrates with existing test workflow after evidence capture completes
4. Handles LLM API failures gracefully: retry logic, fallback to partial evaluation (basic heuristics if LLM unavailable), clear error messaging
5. Returns EvaluationResult object: playability_score, issues[], confidence_report, raw_llm_responses (for debugging)
6. Updates test report with evaluation results: adds playability_score, issues array, ai_analysis section
7. Logs evaluation progress: "Analyzing screenshots...", "Processing console logs...", "Calculating playability score..."
8. Integration test validates complete evaluation pipeline using test fixtures (screenshots and logs from previous epics)
9. Manual validation against 2-3 real browser games confirms evaluation accuracy compared to human assessment
10. Execution time for evaluation phase under 30 seconds (within budget for 2-minute total test time)

---

## Epic 4: Full-Stack Deployment & Web Interface

**Epic Goal:** Build a production-ready full-stack application with Express REST API on Railway, React frontend on Cloudflare Pages, PostgreSQL database for test history, and comprehensive web interface for test submission and result viewing. This epic transitions the system from a CLI tool to a complete web application with API access for both human users and automated systems.

**Story Points:** 34 points (13 stories)

**Key Deliverables:**
- Express REST API with test endpoints
- PostgreSQL database with Prisma ORM
- React + Vite frontend with client-side routing
- WebSocket support for real-time progress
- Web UI: Test submission form, results display, history dashboard
- Railway backend deployment
- Cloudflare Pages frontend deployment
- API authentication and rate limiting
- Comprehensive documentation

**Detailed stories available in:** `docs/stories/epic-4-fullstack-deployment.md`

---

## Checklist Results Report

**Status:** Ready for checklist execution

This section will be populated after running the PM Master Checklist (*execute-checklist pm-master-checklist) to validate the PRD completeness, story quality, and readiness for handoff to architecture and development teams.

---

## Next Steps

### UX Expert Prompt

**N/A** - This project is a CLI-based developer tool with no graphical user interface. No UX design phase required.

### Architect Prompt

**Handoff to Architecture Team:**

The PRD is now complete and ready for architectural design. Please create a comprehensive Architecture Document covering:

1. **System Architecture:** Detailed component diagram, module responsibilities, data flow
2. **Technology Stack:** Finalize choices (Playwright vs alternatives, LLM provider selection, bundling strategy)
3. **API Contracts:** Define TypeScript interfaces for all major modules (BrowserController, EvaluationOrchestrator, ReportGenerator)
4. **Data Models:** Define schemas for TestReport, EvaluationResult, Issue, Artifact structures
5. **Railway Deployment Architecture:** Detail Railway configuration, environment setup, volumes integration patterns
6. **Error Handling Strategy:** Standardized error types, retry policies, graceful degradation patterns
7. **Testing Strategy:** Unit test approach, integration test fixtures, validation test plan
8. **Security Considerations:** Input validation, API key management, sandboxing, SSRF prevention

Use this PRD as the definitive requirements source. Refer to the Project Brief (docs/brief.md) for additional context on DreamUp's game engine architecture and technical constraints.

**Recommended Next Command:** `/bmad-master *create-doc architecture-tmpl`

---

**Document Status:** Complete - Ready for Architecture Phase
**Version:** 1.0
**Last Updated:** November 6, 2025
