# Epic 1: Foundation & Browser Automation Core

**Epic ID:** EPIC-1
**Status:** Not Started
**Priority:** P0 (Critical)
**Target Sprint:** Sprint 1
**Estimated Story Points:** 21 points

---

## Epic Goal

Establish the foundational project structure with TypeScript configuration, testing framework, and core browser automation capabilities. Deliver a functional CLI tool that can load any browser game URL, detect and interact with basic UI elements (start buttons, clickable controls), and output basic test results. This epic creates the architectural foundation while delivering initial value through automated game loading and basic interaction detection.

---

## Business Value

- Establishes development infrastructure for all future work
- Delivers first functional version for immediate manual testing
- Validates technical feasibility of browser automation approach
- Provides early feedback on game compatibility

---

## Success Criteria

- [ ] CLI tool successfully loads and tests 1+ browser game end-to-end
- [ ] Structured JSON report generated with load status and basic interactions
- [ ] Codebase follows TypeScript best practices with linting and testing configured
- [ ] Documentation provides clear setup and usage instructions
- [ ] All automated tests pass in CI pipeline

---

## Dependencies

- None (foundational epic)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Playwright incompatible with target games | High | Evaluate Puppeteer as alternative early |
| Browser automation unreliable | High | Implement robust retry and timeout logic |
| UI detection fails on common patterns | Medium | Test against diverse game samples early |

---

## User Stories

### Story 1.1: Project Setup & TypeScript Configuration
**Story Points:** 3 | **Priority:** P0

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

**Technical Notes:**
- Use Bun for fast development execution
- Vitest preferred over Jest (faster, better TypeScript support)
- Husky v8 for git hooks

---

### Story 1.2: CLI Argument Parser & Basic Configuration
**Story Points:** 2 | **Priority:** P0

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

**Technical Notes:**
- Consider commander or yargs for CLI parsing
- Use Zod for input validation
- Ensure URL validation prevents SSRF attacks

---

### Story 1.3: Browser Automation Setup with Playwright
**Story Points:** 5 | **Priority:** P0

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

**Technical Notes:**
- Use Playwright's chromium browser
- Set appropriate user agent (avoid bot detection)
- Implement proper async/await error handling
- Consider using Playwright's tracing for debugging

---

### Story 1.4: UI Pattern Detection for Game Start Elements
**Story Points:** 5 | **Priority:** P0

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

**Technical Notes:**
- Use Playwright's locator API for robust element detection
- Consider fuzzy text matching for button detection
- Implement scoring algorithm for confidence (exact match = 100, partial = 60, etc.)

---

### Story 1.5: Basic Game Interaction Sequence
**Story Points:** 3 | **Priority:** P0

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

**Technical Notes:**
- Use Playwright's keyboard and mouse API
- Consider MutationObserver for DOM change detection
- Canvas frame detection may use requestAnimationFrame polling

---

### Story 1.6: Basic Test Report Generation
**Story Points:** 2 | **Priority:** P0

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

**Technical Notes:**
- Use UUID library (e.g., uuid package) for testId generation
- Validate JSON structure with Zod schema
- Ensure proper error serialization (Error objects → JSON)

---

### Story 1.7: End-to-End Basic Test Workflow
**Story Points:** 1 | **Priority:** P0

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

**Technical Notes:**
- Implement proper signal handling (SIGINT, SIGTERM) for cleanup
- Use try-finally blocks for guaranteed cleanup
- Log timing for each phase to identify bottlenecks

---

## Testing Strategy

### Unit Tests
- CLI argument parsing and validation
- Configuration object construction
- UI element detection logic
- Report JSON structure validation

### Integration Tests
- Browser launch and page navigation
- UI detection on test fixtures
- Complete workflow with test HTML game
- Error handling for invalid URLs

### Manual Validation
- Test against 1-2 real browser games
- Verify screenshots are meaningful
- Validate report accuracy
- Confirm no resource leaks

---

## Definition of Done

- [ ] All acceptance criteria met for all stories
- [ ] All unit tests passing (>70% coverage)
- [ ] All integration tests passing
- [ ] Manual validation complete with 1+ real game
- [ ] Code reviewed and meets style guidelines
- [ ] Documentation updated (README, inline comments)
- [ ] No critical bugs or P0 issues remaining
- [ ] Demo-ready for stakeholder review

---

**Epic Status:** Ready for Sprint Planning
**Estimated Duration:** 1 Sprint (1 week)
**Next Epic:** Epic 2 - Evidence Capture & Artifact Management
