# Architecture Document - DreamUp Browser Game QA Pipeline

**Version:** 1.1
**Date:** November 7, 2025
**Status:** Draft
**Author:** DreamUp Engineering Team

**Recent Updates:**
- **🔧 PLAYWRIGHT BROWSER PATH FIX** - Fixed browser installation path mismatch by using dynamic imports to ensure PLAYWRIGHT_BROWSERS_PATH environment variable is set before Playwright initializes. This resolves deployment issues where Chromium downloads to custom paths (e.g., `/app/playwright-browsers/`) but Playwright looks in default locations.
- **🎮 MULTI-ITERATION AI GAME COMPLETION LOOP** - LLM now performs up to 5 iterative analysis cycles, re-analyzing game state after each set of actions to ensure progression toward game completion
- **🏆 Intelligent Game State Detection** - System detects game completion states (win/loss/game over) and automatically attempts to start new games for multiple rounds
- **🔄 Dynamic Re-Analysis** - After initial actions, AI re-analyzes screenshots to adapt strategy based on current game state (menu/playing/completed)
- **📈 Enhanced Scoring Bonuses** - Structured bonus system: +10 for starting game, +10 for strategic moves, +20 for completion, +30 for winning, +20 for multiple rounds
- **🎯 State-Aware Action Planning** - AI explicitly identifies current game state and suggests context-appropriate actions (start buttons in menu, strategic moves during play, restart after completion)
- **🔌 WebSocket Connection Improvements** - Fixed React Strict Mode double-mounting issues, added connection state management, improved error handling and logging
- **⏱️ Page Load Strategy Fix** - Changed from `networkidle` to `domcontentloaded` wait strategy to handle games with continuous network activity (ads, analytics, WebSockets) that would otherwise timeout
- **AI prompt updated to emphasize game completion** - LLM now focuses on completing at least one full game session and attempting to win, with strategic action sequences
- **Evaluation includes game completion bonus** - Tests that successfully complete a full game (reaching win/loss/game-over states) receive bonus points
- **Enhanced test depth and duration** - Default screenshot count increased to 20, action count increased to 15 per iteration (up to 50 total), and timeout extended to 180s for more comprehensive testing
- **Added exploratory interaction phase** - Additional keyboard and mouse interactions (arrows, WASD, space, rapid clicks) to capture diverse game states
- **Increased wait times throughout test execution** - More thorough observation periods between actions (3.5-5s) for better state capture
- **Added HTML DOM capture** - Each screenshot now includes a collapsible HTML DOM snapshot for debugging
- **Collapsible HTML component** - Reusable component with copy/download functionality
- **Fixed Playwright interaction issues** - Improved canvas game interaction with multiple click strategies
- **Enhanced game element detection** - Better button/control detection with multiple selector strategies
- **Added overlay/ad dismissal** - Automatically closes cookie banners and ad overlays that block interaction
- **Added content change detection** - Tracks whether actions actually modify page state
- Added game preset selection feature to homepage and new test page
- Integrated live iframe previews for quick testing (replaced static thumbnails)
- Implemented WebSocket real-time communication for live test progress updates
- Enhanced Live Activity Feed with inline screenshot thumbnails for unified timeline view

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Principles](#architecture-principles)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Module Design](#module-design)
7. [Data Models](#data-models)
8. [API Contracts](#api-contracts)
9. [Deployment Architecture](#deployment-architecture)
10. [Security Architecture](#security-architecture)
11. [Error Handling Strategy](#error-handling-strategy)
12. [Performance Considerations](#performance-considerations)
13. [Testing Strategy](#testing-strategy)
14. [Appendices](#appendices)

---

## Executive Summary

The DreamUp Browser Game QA Pipeline is an AI-powered autonomous testing system that evaluates browser game quality through automated interaction, evidence capture, and LLM-based analysis. This document defines the technical architecture for a persistent Express server on Railway that achieves 80%+ accuracy on playability assessment while completing tests in under 2 minutes.

**Key Architectural Decisions:**
- **Modular TypeScript architecture** with clear separation of concerns
- **Express server on Railway** with REST API and WebSocket support
- **AI-powered evaluation** using Anthropic Claude 3.5 Sonnet vision API
- **Evidence-based testing** capturing screenshots, logs, and network activity
- **Graceful degradation** ensuring partial results over complete failure

---

## System Overview

### Purpose

Provide autonomous quality assessment of browser games through:
1. Automated browser interaction to test game functionality
2. Comprehensive evidence collection (screenshots, logs, errors)
3. AI-powered analysis of visual and log data
4. Structured reporting suitable for automated feedback loops

**In Scope:**
- Browser-based game testing (any publicly accessible URL)
- Visual rendering quality assessment
- Basic interaction testing (clicks, keyboard input)
- Console error detection and categorization
- Network failure identification
- Railway deployment with persistent Express server

**Out of Scope:**
- Mobile app testing (native iOS/Android)
- Multiplayer functionality testing
- Performance profiling (FPS, memory usage)
- Accessibility compliance testing
- Security penetration testing

### Key Requirements

- **Performance:** 3-5 minutes total execution time per game (extended for more thorough testing)
- **Accuracy:** 80%+ playability assessment accuracy vs human baseline
- **Reliability:** <5% unhandled crash rate
- **Cost:** <$0.03 per test execution (slightly higher due to increased depth)
- **Scalability:** Support concurrent test executions (10+ simultaneous tests)

### Enhanced Testing Approach

The system now performs more comprehensive testing with:

**Extended Screenshot Collection:**
- Default of 20 screenshots (up from 5) to capture more game states
- Screenshots captured at: initial load, post-initialization, after each AI action, during exploratory interactions, and final state
- Maximum configurable up to 50 screenshots for extremely detailed testing

**Increased Action Depth:**
- Up to 15 AI-suggested actions (up from 5) based on visual analysis
- **Game Completion Strategy:** AI now prioritizes completing at least one full game session and attempting to win:
  - Identifies start buttons/controls to initiate gameplay (highest priority)
  - Analyzes game mechanics to make strategic moves toward victory
  - Aims to reach win/loss/game-over states for complete gameplay assessment
  - Tests that successfully complete games receive +10-20 bonus points in evaluation
- Additional exploratory interaction phase with 5 standard game inputs:
  - Mouse hover and positioning
  - Multiple rapid clicks
  - Arrow key navigation (up/down/left/right)
  - WASD movement keys
  - Space bar actions
- Extended wait times between actions (3.5-5s) to allow game state changes to complete

**Longer Observation Periods:**
- Initial game load wait: 5 seconds (up from 3s)
- Post-action wait: 3.5 seconds (up from 2.5s)
- Final state observation: 4 seconds (up from 2s)
- Default timeout: 180 seconds (up from 120s)

These enhancements ensure more thorough game state exploration, better detection of interaction issues, and more comprehensive visual evidence for AI evaluation.

---

## Architecture Principles

### 1. Modularity
- Clear separation between browser control, evidence capture, evaluation, and reporting
- Each module independently testable
- Minimal coupling between modules (dependency injection)

### 2. Fail-Safe Operation
- Continue with partial results when non-critical steps fail
- Graceful degradation (fallback to heuristics if LLM unavailable)
- Always produce a report, even if incomplete

### 3. Persistent Server Architecture
- Design for long-running Express server process on Railway
- Optimize for resource management and cleanup
- Use Railway volumes for artifact persistence

### 4. Observability
- Structured logging with correlation IDs
- Performance metrics at each stage
- Clear error messages with actionable context

### 5. Extensibility
- Plugin architecture for future evaluation criteria
- Configurable prompts and scoring formulas
- Support for custom game input schemas

---

## System Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    Express Server on Railway                      │
│                                                                    │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │              │      │              │      │              │   │
│  │  API/CLI     │─────▶│     Test     │─────▶│    Report    │   │
│  │   Handler    │      │ Orchestrator │      │  Generator   │   │
│  │              │      │              │      │              │   │
│  └──────────────┘      └───────┬──────┘      └──────┬───────┘   │
│                                 │                     │           │
│                        ┌────────┴────────┐            │           │
│                        │                 │            │           │
│              ┌─────────▼────┐   ┌───────▼────────┐   │           │
│              │              │   │                │   │           │
│              │   Browser    │   │    Evidence    │   │           │
│              │  Controller  │   │    Capture     │   │           │
│              │              │   │                │   │           │
│              └──────┬───────┘   └───────┬────────┘   │           │
│                     │                   │            │           │
│                     │      ┌────────────▼────┐       │           │
│                     │      │                 │       │           │
│                     │      │   AI Evaluator  │       │           │
│                     │      │                 │       │           │
│                     │      └────────┬────────┘       │           │
│                     │               │                │           │
└─────────────────────┼───────────────┼────────────────┼───────────┘
                      │               │                │
                      │               │                │
              ┌───────▼─────┐  ┌──────▼──────┐  ┌─────▼──────────┐
              │             │  │             │  │   Railway      │
              │  Playwright │  │ Claude 3.5  │  │   Volumes      │
              │   Browser   │  │   Sonnet    │  │  (Artifacts)   │
              │             │  │     API     │  │                │
              └─────────────┘  └─────────────┘  └────────────────┘
```

### Component Interaction Flow

```
User/Agent Invocation
        │
        ▼
┌───────────────────┐
│   CLI Handler     │ Parse arguments, validate input
│   or API Request  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Test Orchestrator │ Coordinate entire test workflow
└────────┬──────────┘
         │
         ├──────────▶ Launch Browser ──▶ Navigate to Game URL
         │                 │
         │                 ▼
         │            Detect UI Elements
         │                 │
         │                 ▼
         ├──────────▶ Capture Evidence (Parallel)
         │            ├── Take Screenshots (20x default)
         │            ├── Record Console Logs
         │            └── Track Network Errors
         │                 │
         ▼                 ▼
    Execute Interactions   Save Artifacts to Railway Volumes
         │                 │
         └────────┬────────┘
                  │
                  ▼
         ┌────────────────┐
         │  AI Evaluator  │ Analyze evidence with LLM
         └────────┬───────┘
                  │
                  ├── Analyze Screenshots
                  ├── Analyze Console Logs
                  ├── Calculate Playability Score
                  └── Detect Issues
                  │
                  ▼
         ┌────────────────┐
         │ Report Generator│ Create structured JSON report
         └────────┬───────┘
                  │
                  ▼
            Output Report (stdout or Railway Volumes)
```

---

## Technology Stack

### Core Technologies

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Language** | TypeScript | 5.3+ | Type safety, modern JavaScript features, excellent tooling |
| **Runtime** | Node.js | 20.x | Railway support, stable LTS, async/await native |
| **Build Tool** | esbuild | 0.19+ | Fast bundling, tree-shaking, efficient optimization |
| **Package Manager** | npm | 10.x | Standard, reliable, widely supported |
| **Browser Automation** | Playwright | 1.40+ | Excellent headless browser support, multi-browser, reliable API |
| **LLM API** | Anthropic Claude SDK | 0.9+ | Vision capabilities, cost-effective, accurate |
| **Testing Framework** | Vitest | 1.0+ | Fast, modern, excellent TypeScript support |

### Railway Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Railway** | Compute execution | Node.js 20.x, 512MB-1GB memory, persistent server |
| **Railway Volumes** | Artifact storage | Persistent storage, cleanup policies |
| **Railway Logs** | Logging and monitoring | Structured JSON logs, metrics dashboard |
| **Environment Variables** | Configuration | Secure secret management |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | TypeScript linting and code quality |
| **Prettier** | Code formatting consistency |
| **Husky** | Git hooks for pre-commit checks |
| **GitHub Actions** | CI/CD pipeline automation |
| **Railway CLI** | Local testing and deployment |

---

## Module Design

### 1. CLI Handler (`src/cli.ts`)

**Responsibility:** Parse command-line arguments and initiate test execution.

**Key Functions:**
- `main()`: Entry point, parse CLI arguments
- `validateInput(url: string): void`: Validate game URL format
- `buildConfig(args: CLIArgs): TestConfig`: Construct configuration object

**Dependencies:**
- `commander` for CLI argument parsing
- `dotenv` for environment variable loading

**Exports:**
```typescript
interface CLIArgs {
  gameUrl: string;
  outputDir?: string;
  timeout?: number;
  verbose?: boolean;
}
```

---

### 2. API Handler (`src/api/handler.ts`)

**Responsibility:** Express REST API entry point for web/programmatic execution.

**Key Functions:**
- `handleTestRequest(req: Request, res: Response): Promise<void>`
- `validateTestRequest(body: any): TestRequest`
- `handleTimeout(testId: string): void`

**Dependencies:**
- Test Orchestrator
- Storage Adapter (Railway Volumes)

**Exports:**
```typescript
interface TestRequest {
  gameUrl: string;
  options?: Partial<TestOptions>;
}

interface ApiResponse {
  statusCode: 200 | 400 | 500;
  body: string; // JSON.stringify(TestReport)
  headers?: Record<string, string>;
}
```

---

### 3. Test Orchestrator (`src/orchestrator.ts`)

**Responsibility:** Coordinate the entire test workflow across all modules.

**Key Functions:**
- `executeTest(config: TestConfig): Promise<TestReport>`
- `handleError(error: Error, phase: TestPhase): PartialReport`
- `cleanup(): Promise<void>`

**Dependencies:**
- Browser Controller
- Evidence Capture modules
- AI Evaluator
- Report Generator

**Internal Flow:**
```typescript
1. Initialize output directory/Railway volumes paths
2. Launch browser and navigate to game
3. Detect UI elements
4. Execute interaction sequence
5. Capture evidence (screenshots, logs, network)
6. Analyze evidence with AI
7. Calculate playability score
8. Generate report
9. Cleanup resources
```

---

### 4. Browser Controller (`src/modules/browser/controller.ts`)

**Responsibility:** Manage browser lifecycle and page navigation.

**Key Functions:**
- `launch(options?: BrowserOptions): Promise<Browser>`
- `navigate(url: string, timeout?: number): Promise<Page>`
- `attachListeners(page: Page): void`
- `close(): Promise<void>`

**Key Classes:**
```typescript
class BrowserController {
  private browser: Browser | null;
  private page: Page | null;
  private consoleMessages: ConsoleMessage[];
  private networkErrors: NetworkError[];

  async launch(): Promise<void>
  async navigate(url: string): Promise<void>
  getPage(): Page
  async cleanup(): Promise<void>
}
```

---

### 5. UI Detector (`src/modules/browser/ui-detector.ts`)

**Responsibility:** Identify interactive game elements (buttons, canvas, menus).

**Key Functions:**
- `detectStartButton(page: Page): Promise<ElementHandle | null>`
- `detectCanvas(page: Page): Promise<ElementHandle[]>`
- `detectInteractiveElements(page: Page): Promise<UIElements>`

**Detection Strategy:**
```typescript
1. Text-based detection: Search for "start", "play", "begin" (case-insensitive)
2. Selector-based detection: button, .btn, .start-button, input[type="button"]
3. Canvas detection: canvas, #gameCanvas, [data-game-canvas]
4. Confidence scoring: Exact match (100), partial (60), fallback (30)
```

---

### 6. Interaction Controller (`src/modules/browser/interaction-controller.ts`)

**Responsibility:** Execute automated game interactions.

**Key Functions:**
- `clickStartButton(button: ElementHandle): Promise<boolean>`
- `performBasicInputs(page: Page): Promise<InteractionReport>`
- `detectGameStateChange(page: Page): Promise<boolean>`

**Interaction Sequence:**
```typescript
1. Click start button (if detected)
2. Wait 2 seconds for game initialization
3. Click canvas center (3 times, 500ms delay)
4. Press spacebar (3 times, 500ms delay)
5. Press arrow keys (up, down, left, right, 500ms delay each)
6. Monitor DOM/canvas changes to detect responsiveness
```

---

### 7. Screenshot Capture (`src/modules/capture/screenshot.ts`)

**Responsibility:** Capture and save screenshots at strategic moments.

**Key Functions:**
- `capture(label: string, page: Page): Promise<ScreenshotResult>`
- `saveToFile(buffer: Buffer, path: string): Promise<void>`
- `generateMetadata(screenshot: Screenshot): ScreenshotMetadata`

**Screenshot Strategy:**
```typescript
Timing Points:
1. initial-load: After DOMContentLoaded event
2. pre-interaction: After UI detection, before clicking start
3. post-start: 2 seconds after start button click
4. mid-game: 30 seconds into test execution
5. end-state: At test completion or timeout
6. error: Immediately upon uncaught exception (ad-hoc)

Format: PNG, 80% quality, 1280x720 viewport
Naming: {timestamp}-{label}.png
```

---

### 8. Console Capture (`src/modules/capture/console.ts`)

**Responsibility:** Record and categorize browser console messages.

**Key Functions:**
- `attachListener(page: Page): void`
- `categorizeMessage(msg: ConsoleMessage): CategorizedMessage`
- `deduplicateErrors(messages: ConsoleMessage[]): DeduplicatedErrors`
- `saveToFile(messages: ConsoleMessage[], path: string): Promise<void>`

**Categories:**
```typescript
enum ConsoleLevel {
  ERROR = 'error',      // Highest priority
  WARNING = 'warning',
  INFO = 'info',
  LOG = 'log',
  DEBUG = 'debug'       // Lowest priority
}

Deduplication: Group identical error messages, track occurrence count
```

---

### 9. Network Capture (`src/modules/capture/network.ts`)

**Responsibility:** Detect and record network failures.

**Key Functions:**
- `attachListeners(page: Page): void`
- `classifyFailure(request: Request, response?: Response): NetworkFailure`
- `identifyCriticalFailures(failures: NetworkFailure[]): NetworkFailure[]`

**Failure Classification:**
```typescript
Critical: JavaScript files (*.js), CSS files (*.css)
Non-Critical: Images (*.png, *.jpg), Fonts (*.woff, *.ttf)

Failure Types:
- 4xx errors (client errors)
- 5xx errors (server errors)
- Timeout (no response)
- DNS failure
- Connection refused
```

---

### 10. LLM Client (`src/modules/evaluator/llm-client.ts`)

**Responsibility:** Interface with Anthropic Claude API for AI analysis.

**Key Functions:**
- `sendRequest(prompt: string, images: string[]): Promise<LLMResponse>`
- `retryWithBackoff(fn: () => Promise<any>, attempts: number): Promise<any>`
- `parseJSONFromResponse(content: string): any`

**Configuration:**
```typescript
Model: claude-3-5-sonnet-20250929
Max Tokens: 4096
Temperature: 0.3 (deterministic, factual analysis)
Timeout: 60 seconds per request
Retry Policy: 3 attempts, exponential backoff (1s, 2s, 4s)
```

---

### 11. Prompt Builder (`src/modules/evaluator/prompts.ts`)

**Responsibility:** Construct LLM prompts for evidence analysis.

**Key Functions:**
- `buildScreenshotAnalysisPrompt(screenshots: Screenshot[]): string`
- `buildConsoleLogAnalysisPrompt(logs: ConsoleMessage[]): string`
- `buildCombinedAnalysisPrompt(evidence: Evidence): string`

**Prompt Structure:**
```typescript
1. System Context: "You are analyzing browser game quality..."
2. Task Description: "Evaluate the following evidence..."
3. Evidence Data: Screenshots (base64), console logs (JSON)
4. Evaluation Criteria: Load success, visual quality, stability
5. Output Format: JSON schema with required fields
6. Few-Shot Examples: 2-3 example outputs for consistency
```

---

### 12. Score Calculator (`src/modules/evaluator/scorer.ts`)

**Responsibility:** Calculate composite playability score from evaluation factors.

**Key Functions:**
- `calculatePlayabilityScore(factors: EvaluationFactors): PlayabilityScore`
- `applyPenalties(score: number, errors: Issue[]): number`
- `assignGrade(score: number): Grade`

**Scoring Formula:**
```typescript
Components:
- visual_quality (0-100): 30% weight
- overall_stability (0-100): 30% weight
- interaction_responsiveness (0-100): 25% weight
- load_success (boolean → 100/0): 15% weight

Formula:
base_score = (visual * 0.3) + (stability * 0.3) + (interaction * 0.25) + (load * 0.15)
final_score = max(0, base_score - (critical_errors * 20))

Grades: A (90-100), B (80-89), C (70-79), D (60-69), F (0-59)
```

---

### 13. Issue Detector (`src/modules/evaluator/issue-detector.ts`)

**Responsibility:** Identify, categorize, and deduplicate issues.

**Key Functions:**
- `detectIssues(evidence: Evidence, llmAnalysis: LLMAnalysis): Issue[]`
- `categorizeIssue(issue: RawIssue): CategorizedIssue`
- `deduplicateIssues(issues: Issue[]): Issue[]`

**Issue Structure:**
```typescript
interface Issue {
  id: string;           // UUID
  severity: 'critical' | 'major' | 'minor';
  type: 'rendering' | 'interaction' | 'loading' | 'stability' | 'performance';
  description: string;  // Human-readable
  evidence: string[];   // File paths or log excerpts
  confidence: number;   // 0-100
  timestamp: string;    // ISO 8601
}

Severity Definitions:
- Critical: Game-breaking, unplayable
- Major: Significant functionality impaired
- Minor: Cosmetic or non-blocking issues
```

---

### 14. Report Generator (`src/modules/reporter/generator.ts`)

**Responsibility:** Create structured JSON test reports.

**Key Functions:**
- `generateReport(results: TestResults): TestReport`
- `saveReport(report: TestReport, path: string): Promise<void>`
- `generateSummary(report: TestReport): string`

**Report Structure:** (See Data Models section)

---

### 15. Output Manager (`src/modules/output/manager.ts`)

**Responsibility:** Manage output directory structure and file organization.

**Key Functions:**
- `initialize(testId: string, outputDir: string): Promise<OutputPaths>`
- `getScreenshotPath(label: string): string`
- `getLogPath(type: 'console' | 'network'): string`
- `cleanup(testId: string): Promise<void>`

**Directory Structure:**
```
{output-dir}/
  {test-id}/
    screenshots/
      {timestamp}-initial-load.png
      {timestamp}-post-start.png
      {timestamp}-mid-game.png
      {timestamp}-end-state.png
      {timestamp}-error.png
    logs/
      console.log (human-readable)
      console.json (structured)
      network.json
    report.json
    manifest.json
    metadata.json
```

---

### 16. Storage Adapter (`src/modules/output/storage-adapter.ts`)

**Responsibility:** Manage artifact storage with Railway volumes.

**Key Functions:**
- `saveFile(localPath: string, storageKey: string): Promise<SaveResult>`
- `saveBuffer(buffer: Buffer, storageKey: string, contentType: string): Promise<SaveResult>`
- `getFileUrl(storageKey: string): Promise<string>`

**Storage Structure:**
```
{railway-volume}/
  {test-id}/
    screenshots/{timestamp}-{label}.png
    logs/console.json
    logs/network.json
    report.json
    manifest.json

File URLs: Generated for web access via Express static middleware
```

---

## Data Models

### Core Data Structures

#### TestConfig
```typescript
interface TestConfig {
  gameUrl: string;
  outputDir: string;
  timeout: number;           // milliseconds (default: 180000)
  verbose: boolean;
  storageDir?: string;       // Storage directory for Railway volumes
  llmApiKey: string;
  environment: 'local' | 'railway';
}
```

#### TestReport
```typescript
interface TestReport {
  testId: string;            // UUID v4
  gameUrl: string;
  timestamp: string;         // ISO 8601
  status: 'success' | 'failure' | 'partial';
  duration: number;          // milliseconds
  playabilityScore?: PlayabilityScore;
  issues: Issue[];
  evidence: EvidenceManifest;
  metadata: TestMetadata;
  errors: ErrorLog[];
}
```

#### PlayabilityScore
```typescript
interface PlayabilityScore {
  score: number;             // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number;        // 0-100
  components: {
    visual: number;
    stability: number;
    interaction: number;
    load: number;
  };
  reasoning: string;
}
```

#### Issue
```typescript
interface Issue {
  id: string;                // UUID
  severity: 'critical' | 'major' | 'minor';
  type: 'rendering' | 'interaction' | 'loading' | 'stability' | 'performance';
  description: string;
  evidence: string[];        // File paths or log excerpts
  confidence: number;        // 0-100
  timestamp: string;         // ISO 8601
}
```

#### Evidence Manifest
```typescript
interface EvidenceManifest {
  screenshots: ScreenshotMetadata[];
  consoleLogs: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
    criticalErrors: string[];
    logFile: string;         // Path or Railway Volumes URL
  };
  networkErrors: {
    totalRequests: number;
    failedRequests: number;
    criticalFailures: NetworkFailure[];
    logFile: string;
  };
  artifacts: ArtifactMetadata[];
}
```

#### Screenshot Metadata
```typescript
interface ScreenshotMetadata {
  label: string;
  timestamp: string;         // ISO 8601
  filePath: string;          // Local path or storage URL
  publicUrl?: string;        // For web access
  fileSize: number;          // bytes
  dimensions: { width: number; height: number };
  success: boolean;
}
```

#### Console Message
```typescript
interface ConsoleMessage {
  timestamp: string;         // ISO 8601
  level: 'error' | 'warning' | 'info' | 'log' | 'debug';
  text: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  stackTrace?: string;
  occurrenceCount: number;   // For deduplicated messages
}
```

#### Network Failure
```typescript
interface NetworkFailure {
  url: string;
  method: string;            // GET, POST, etc.
  statusCode?: number;
  errorMessage: string;
  timestamp: string;
  resourceType: string;      // script, stylesheet, image, etc.
  critical: boolean;         // JS/CSS = true, others = false
}
```

---

## API Contracts

### Public API (Programmatic Usage)

```typescript
// Main exported function for programmatic usage
export async function testGame(
  gameUrl: string,
  options?: Partial<TestOptions>
): Promise<TestReport>

interface TestOptions {
  outputDir?: string;
  timeout?: number;
  verbose?: boolean;
  llmApiKey?: string;
  s3Bucket?: string;
}

// Example usage:
import { testGame } from 'dreamup-qa-pipeline';

const report = await testGame('https://example.com/game', {
  timeout: 180000,
  verbose: true
});

console.log(`Playability Score: ${report.playabilityScore.score}`);
```

### REST API (Request Schema)

```typescript
// API Request Input
interface ApiTestRequest {
  gameUrl: string;                    // Required
  storageDir?: string;                // Storage directory
  options?: {
    timeout?: number;
    verbose?: boolean;
  };
}

// API Response Output
interface ApiTestResponse {
  statusCode: 200 | 400 | 500;
  body: string;                       // JSON.stringify(TestReport)
  headers?: {
    'Content-Type': 'application/json';
    'X-Test-Id': string;
  };
}

// Example API call:
const response = await fetch('https://api.example.com/api/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gameUrl: 'https://example.com/game',
    options: { timeout: 180000, screenshotCount: 20 }
  })
});
```

### CLI API

```bash
# Basic usage
bun run qa.ts <game-url>

# With options
bun run qa.ts <game-url> \
  --output-dir ./my-tests \
  --timeout 180000 \
  --screenshot-count 20 \
  --verbose

# Help
bun run qa.ts --help

# Version
bun run qa.ts --version
```

---

## Deployment Architecture

### Local Development Environment

```
Developer Machine
  ├── Node.js 20.x
  ├── Bun (fast TypeScript execution)
  ├── Playwright (standard installation)
  └── .env file (API keys)

Execution: bun run src/cli.ts <url>
Output: ./output/{test-id}/
```

### Railway Production Environment

```
┌─────────────────────────────────────────────┐
│         Railway Express Server               │
│  ┌────────────────────────────────────────┐ │
│  │  Express Application                   │ │
│  │  - REST API endpoints                  │ │
│  │  - WebSocket server                    │ │
│  │  - All module code (TypeScript)       │ │
│  │  - node_modules included               │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │  Playwright with Chromium              │ │
│  │  - Chromium browser                    │ │
│  │  - Custom browser path via env var    │ │
│  │  - System libraries                    │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  Configuration:                              │
│  - Runtime: Node.js 20.x                    │
│  - Memory: 512MB-1GB                        │
│  - Persistent Process                       │
│  - In-Memory Storage                        │
│  - Environment Variables: OPENAI_API_KEY  │
│                           PORT              │
│                           PLAYWRIGHT_BROWSERS_PATH │
└──────────────┬──────────────────────────────┘
               │
               ├──────────▶ Railway Volumes (Artifacts)
               │             └── /data/{test-id}/
               │
               ├──────────▶ Railway Logs
               │             └── Structured JSON logs
               │
               └──────────▶ Anthropic API
                             └── Claude 3.5 Sonnet
```

**Playwright Browser Path Configuration:**

To ensure Playwright uses the correct browser installation path in containerized environments, we use dynamic imports:

1. **Problem:** Playwright determines browser paths when its modules are imported, before environment variables can be set.

2. **Solution:** 
   - Set `PLAYWRIGHT_BROWSERS_PATH` environment variable BEFORE importing Playwright
   - Use dynamic `import()` statements instead of static imports for Playwright modules
   - This ensures the environment variable is respected when Playwright initializes

3. **Implementation:**
   ```typescript
   // Set environment variable first
   process.env.PLAYWRIGHT_BROWSERS_PATH = '/app/playwright-browsers';
   
   // Then dynamically import Playwright
   const { chromium } = await import('playwright');
   ```

4. **Files Modified:**
   - `backend/src/modules/browser/installer.ts` - Browser installation verification
   - `backend/src/services/playwrightService.ts` - Browser launch logic

### Deployment Package Structure

```
railway-deployment/
  ├── backend/
  │   ├── src/ (TypeScript source)
  │   ├── dist/ (compiled JavaScript)
  │   ├── node_modules/
  │   ├── package.json
  │   └── tsconfig.json
  ├── frontend/ (Cloudflare Pages)
  └── shared/ (shared types)
```

### Railway Configuration

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Security Architecture

### 1. Input Validation

**Threat:** SSRF (Server-Side Request Forgery) via malicious game URLs

**Mitigation:**
- Validate URL format (HTTP/HTTPS only)
- Reject localhost, private IP ranges (10.x, 192.168.x, 127.x)
- Reject file:// and other non-HTTP protocols
- Use allowlist for testing (optional)

```typescript
function validateGameUrl(url: string): void {
  const parsed = new URL(url);

  // Only HTTP/HTTPS allowed
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid protocol. Only HTTP/HTTPS allowed.');
  }

  // Reject private IPs and localhost
  const privateRanges = ['127.0.0.1', 'localhost', '10.', '192.168.', '172.16.'];
  if (privateRanges.some(range => parsed.hostname.includes(range))) {
    throw new Error('Private IP addresses and localhost not allowed.');
  }
}
```

### 2. API Key Management

**Threat:** Exposure of LLM API keys

**Mitigation:**
- Store API keys in environment variables only (never hardcoded)
- Use Railway environment variables for secure key management
- Rotate keys periodically (every 90 days)
- Audit API usage for anomalies

### 3. Browser Sandboxing

**Threat:** Malicious game code escaping browser context

**Mitigation:**
- Use Playwright's isolated browser contexts
- Enable Chromium sandboxing flags
- Limit network access from browser (consider firewall rules)
- Restrict filesystem access from browser to Railway volumes only

### 4. File Storage Security

**Threat:** Unauthorized access to test artifacts

**Mitigation:**
- Use Railway volumes with restricted access
- Serve artifacts through Express with authentication
- Implement cleanup policies (delete artifacts after 30 days)
- Use secure file paths (prevent directory traversal)

### 5. Railway Server Security

**Threat:** Excessive costs from abuse, resource exhaustion

**Mitigation:**
- Implement rate limiting on API endpoints
- Monitor Railway metrics for CPU/memory spikes
- Use API authentication for test submissions
- Set up alerts for unusual activity
- Monitor costs daily

---

## Error Handling Strategy

### Error Classifications

#### 1. Transient Errors (Retryable)
- Network timeouts
- LLM API rate limiting (429)
- Railway Volumes upload failures (temporary)
- Browser page load timeout

**Handling:** Retry with exponential backoff (max 3 attempts)

#### 2. Permanent Errors (Non-Retryable)
- Invalid game URL (400 Bad Request)
- Missing LLM API key
- Browser crash (unrecoverable)
- Server out-of-memory

**Handling:** Fail fast, produce partial report with error details

#### 3. User Errors (Configuration Issues)
- Missing required arguments
- Invalid configuration values
- Incorrect environment setup

**Handling:** Clear error messages with resolution steps

### Error Response Structure

```typescript
interface ErrorReport {
  success: false;
  error: {
    code: string;          // ERROR_BROWSER_CRASH, ERROR_TIMEOUT, etc.
    message: string;       // Human-readable
    phase: string;         // Where error occurred
    recoverable: boolean;
    resolution: string;    // Suggested fix
    stackTrace?: string;
  };
  partialResults?: Partial<TestReport>;
}
```

### Graceful Degradation Strategy

| Failure | Graceful Degradation |
|---------|---------------------|
| Screenshot capture fails | Continue test, mark screenshot as unavailable |
| Console logs not captured | Proceed with visual analysis only |
| LLM API unavailable | Use fallback heuristics (blank screen = 0 score) |
| File storage fails | Save to temporary directory, retry 2x |
| Timeout approaching | Force cleanup, produce partial report |

---

## Performance Considerations

### 1. Server Startup Optimization

**Target:** <10 seconds server startup time

**Strategies:**
- Minimize bundle size (tree-shaking, no dev dependencies)
- Install Playwright dependencies during build phase
- Lazy-load non-critical modules
- Use efficient module resolution

**Measurement:**
```typescript
const startupStart = Date.now();
// ... initialization ...
const startupEnd = Date.now();
console.log(`Server startup: ${startupEnd - startupStart}ms`);
```

### 2. Execution Time Optimization

**Target:** <90 seconds total execution time

**Breakdown:**
- Browser launch: 3-5 seconds
- Page load: 5-10 seconds
- UI detection: 2-3 seconds
- Interactions: 10-15 seconds
- Screenshot capture: 2-5 seconds
- LLM evaluation: 20-30 seconds
- Report generation: 1-2 seconds
- Railway Volumes upload: 2-5 seconds

**Optimization Techniques:**
- Parallel operations where possible (capture screenshots during interactions)
- Connection pooling for LLM API
- Efficient screenshot compression
- Batch Railway Volumes uploads

### 3. Memory Management

**Target:** <1024MB memory usage

**Strategies:**
- Close browser pages after use
- Clear screenshot buffers after upload
- Stream large logs to file (don't hold in memory)
- Monitor Railway memory metrics
- Use Railway volumes for persistent storage

---

## Testing Strategy

### Unit Testing

**Framework:** Vitest
**Coverage Target:** >70%

**Focus Areas:**
- Input validation logic
- Score calculation formulas
- Issue categorization
- Report generation
- Error handling

**Example:**
```typescript
describe('ScoreCalculator', () => {
  it('should calculate playability score correctly', () => {
    const factors = {
      visual: 80,
      stability: 90,
      interaction: 85,
      loadSuccess: true
    };
    const score = calculatePlayabilityScore(factors);
    expect(score.score).toBe(85);
  });
});
```

### Integration Testing

**Framework:** Vitest with Playwright
**Coverage:** End-to-end workflows

**Test Cases:**
- Browser launch and navigation
- Screenshot capture workflow
- LLM API interaction (mocked)
- Complete test workflow with fixtures

**Fixtures:**
- `tests/fixtures/test-game.html` - Simple HTML5 game for testing
- `tests/fixtures/screenshots/` - Sample screenshots for LLM prompts
- `tests/fixtures/logs/` - Sample console logs

### Manual Validation

**Validation Games:**
1. Simple 2D platformer (good baseline)
2. 3D WebGL game (complex rendering)
3. Puzzle/card game (DOM-based UI)

**Validation Process:**
- Human evaluators assess each game independently
- Compare AI scores to human median scores
- Calculate accuracy: % within ±15 points

**Success Criteria:**
- 80%+ accuracy (2+ out of 3 games within tolerance)
- Critical issues match human-identified issues (100% recall)

### Performance Testing

**Tools:** Custom benchmarking scripts

**Metrics:**
- Server startup time
- Request response time
- Memory usage (peak)
- API costs per test

**Load Testing (Future):**
- Concurrent test executions
- Sustained load over time
- Cost analysis at scale

---

## Appendices

### A. Technology Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| **Playwright over Puppeteer** | More reliable API, better Railway support, excellent documentation | Puppeteer (similar but less predictable) |
| **Claude 3.5 Sonnet over GPT-4V** | Cost-effective, excellent vision capabilities, accurate | GPT-4V (more expensive, similar quality) |
| **TypeScript over JavaScript** | Type safety reduces bugs, better IDE support, maintainability | JavaScript (faster to write, but more error-prone) |
| **Vitest over Jest** | Faster test execution, better TypeScript support, modern | Jest (more mature but slower) |
| **esbuild over Webpack** | 10-100x faster bundling, simpler configuration | Webpack (more features but slower) |
| **Railway Volumes over Cloud Storage** | Simpler integration, lower latency, cost-effective | AWS S3/Cloudflare R2 (more complex setup) |

### B. Cost Analysis

**Per Test Costs (Estimates):**
- Railway compute: ~$0.001 (assuming $5/month plan, ~5000 tests)
- Claude API: $0.015 (5 images + logs)
- Railway volumes: $0.0001 (5MB @ $0.25/GB/month)
- **Total: ~$0.016 per test**

**Monthly Costs (1000 tests):**
- Railway (Hobby): $5.00
- Railway volumes: $2.50 (10GB)
- Claude API: $15.00
- **Total: ~$22.50/month**

### C. Frontend Component Architecture

**Game Selection Feature (Implemented Nov 7, 2025)**

**Components:**

1. **GameCard Component** (`frontend/src/components/GameCard.tsx`)
   - Reusable card component for displaying game presets
   - Features live iframe preview of each game
   - Sandboxed iframes with `pointer-events-none` to prevent interaction
   - Loading skeleton with animated game controller icon
   - Error fallback with SVG icon if iframe fails to load
   - Category badges with color coding
   - Loading state overlay during test creation
   - Lazy loading for performance optimization
   - Hover effects for better UX

2. **Game Presets Data** (`frontend/src/data/gamePresets.ts`)
   - Centralized catalog of popular test games
   - Categories: puzzle, action, multiplayer, casual
   - Includes metadata: name, URL, description
   - Currently includes 4 iframe-compatible games:
     - Slither.io (multiplayer)
     - Krunker.io (action)
     - Minesweeper (puzzle)
     - Solitaire (casual)
   - No static thumbnails needed - uses live game previews
   - Curated list of games that allow iframe embedding

**Integration Points:**

- **HomePage:** Quick test selection grid above statistics
- **NewTestPage:** Game selection before custom URL input
- Both pages use shared `handleGameSelect` function
- Tests inherit timeout and screenshot settings from NewTestPage

**User Flow:**
```
User clicks game card → Loading overlay appears → API test request → 
Navigate to TestResultsPage with testId
```

### D. WebSocket Real-Time Communication

**Implementation (Added Nov 7, 2025)**

**Architecture:**
- Socket.IO server integrated into Express HTTP server
- Real-time bidirectional event streaming between backend and frontend
- Test-specific rooms for isolated communication channels
- Fallback to HTTP polling if WebSocket unavailable

**Backend Components:**

1. **WebSocket Service** (`backend/src/services/websocketService.ts`)
   - Singleton service managing Socket.IO server
   - Handles client connections and room management
   - Emits events to specific test rooms or all clients
   - CORS configuration matching Express server
   - Graceful cleanup on server shutdown

2. **Event Emission Points:**
   - TestService: Orchestrates high-level test events
   - PlaywrightService: Emits progress during browser automation
   - Real-time screenshot capture notifications
   - AI analysis progress updates
   - Action performance feedback

**Frontend Components:**

1. **WebSocket Hook** (`frontend/src/hooks/useWebSocket.ts`)
   - Reusable React hook for WebSocket connections
   - Automatic connection management with cleanup
   - Joins test-specific rooms on connection
   - Event callback system for handling updates
   - Connection status tracking
   - Automatic reconnection with exponential backoff

2. **Live Updates UI:**
   - Real-time activity feed showing test progress
   - Screenshot previews as they're captured
   - AI analysis status indicators
   - Action performance results (success/failure)
   - Connection status badge (Live Updates indicator)
   - Animated fade-in for new updates
   - Auto-scrolling feed (last 20 updates)

**Event Types:**

```typescript
- test:created - Test initialized
- test:status-changed - Status updates (pending → running → completed)
- test:browser-launched - Browser successfully started
- test:page-loaded - Game page loaded
- test:screenshot-captured - Screenshot taken and available
- test:action-performed - AI action executed (click, keypress)
- test:ai-analyzing - AI analysis in progress
- test:ai-analysis-complete - AI game analysis finished
- test:evaluation-complete - Quality evaluation finished
- test:completed - Test fully complete
- test:error - Error occurred during test
```

**User Experience:**

Before WebSocket:
- User submits test → waits on results page → polls every 3-5s → sees final results

After WebSocket:
- User submits test → redirected to results page → instant live updates
- See screenshots appear as they're captured
- Watch AI analysis progress in real-time
- View each action as it's performed
- Get immediate feedback when test completes
- Fallback to polling if WebSocket fails

**Performance:**
- Minimal overhead (<1ms per event)
- Efficient room-based broadcasting
- No polling needed (saves bandwidth)
- Instant UI updates (no delay)

### E. Future Enhancements (Post-MVP)

1. **Batch Testing:** Test multiple games sequentially
2. **GIF Recording:** Capture video playback of gameplay
3. **Frame Analysis:** Detect visual glitches frame-by-frame
4. **Performance Metrics:** FPS monitoring, load time analysis
5. **Expanded Game Catalog:** More preset games organized by genre
6. **Regression Testing:** Automatically re-test after engine updates
7. **Custom Metrics:** Plugin system for game-specific evaluation criteria
8. **Multi-Browser Support:** Test in Firefox, Safari, Edge
9. **WebSocket Enhancements:** Progress bars, video streaming, collaborative testing

---

**Document Status:** Complete - Ready for Development
**Version:** 1.1
**Last Updated:** November 8, 2025
**Next Steps:** Begin Epic 1 implementation (Sprint 1)
