# Epic 2: Evidence Capture & Artifact Management

**Epic ID:** EPIC-2
**Status:** Not Started
**Priority:** P0 (Critical)
**Target Sprint:** Sprint 2
**Estimated Story Points:** 18 points

---

## Epic Goal

Implement comprehensive evidence collection capabilities to capture screenshots at strategic moments, record console logs and errors, and organize all artifacts in a structured output format. This enables visual debugging and provides the raw materials for LLM-powered evaluation, transforming basic interaction logs into rich, analyzable evidence.

---

## Business Value

- Provides visual evidence for debugging game issues
- Captures complete context (logs, errors, network failures) for analysis
- Enables AI evaluation with rich multimodal data (screenshots + logs)
- Creates structured artifact storage for future analysis and ML training

---

## Success Criteria

- [ ] 5 screenshots captured per test at strategic moments
- [ ] All console logs categorized and saved in structured format
- [ ] Network errors detected and reported
- [ ] Artifacts organized in predictable directory structure
- [ ] Manifest file lists all captured evidence with metadata
- [ ] No meaningful evidence lost due to capture failures

---

## Dependencies

- **EPIC-1:** Browser automation must be functional to capture evidence during tests

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Screenshot capture fails silently | High | Implement robust error handling, continue test on failure |
| Large console logs cause memory issues | Medium | Truncate messages, stream to file instead of memory |
| Storage fills up with artifacts | Low | Implement cleanup policy, document storage requirements |

---

## User Stories

### Story 2.1: Screenshot Capture Module
**Story Points:** 3 | **Priority:** P0

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

**Technical Notes:**
- Use Playwright's screenshot API with path option
- Implement retry logic (1 retry on failure)
- Ensure directory exists before saving
- Consider using sharp library for compression control

---

### Story 2.2: Strategic Screenshot Timing Logic
**Story Points:** 2 | **Priority:** P0

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

**Technical Notes:**
- Use event-based triggers from InteractionController
- Implement debouncing for rapid screenshot requests
- Log all screenshot attempts (success and failure)

---

### Story 2.3: Console Log Capture & Categorization
**Story Points:** 3 | **Priority:** P0

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

**Technical Notes:**
- Use Playwright's page.on('console') event
- Implement streaming to file (don't store all logs in memory)
- Consider using a circular buffer for memory management
- Parse stack traces using error-stack-parser library

---

### Story 2.4: Network Error Detection & Capture
**Story Points:** 3 | **Priority:** P0

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

**Technical Notes:**
- Use page.on('request'), page.on('response'), page.on('requestfailed')
- Filter out data URLs and blob URLs from network monitoring
- Consider rate limiting network log storage (ignore excessive requests)

---

### Story 2.5: Structured Output Directory Management
**Story Points:** 2 | **Priority:** P0

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

**Technical Notes:**
- Use fs.promises for async file operations
- Implement proper error handling for EACCES, ENOSPC errors
- Use path.join for cross-platform path construction

---

### Story 2.6: Artifact Manifest Generation
**Story Points:** 5 | **Priority:** P1

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

**Technical Notes:**
- Use fs.stat to get file metadata (size, timestamps)
- Calculate checksums (SHA256) for artifacts (optional for MVP)
- Include manifest schema version for future compatibility

---

## Testing Strategy

### Unit Tests
- Screenshot capture with mocked Playwright page
- Console log categorization and deduplication
- Network error classification (critical vs non-critical)
- Output directory structure validation
- Manifest generation with sample artifacts

### Integration Tests
- Full evidence capture workflow with test game
- Screenshot timing validation
- Large console log handling
- Network error detection with failing resources
- Artifact persistence verification

### Manual Validation
- Visual inspection of captured screenshots
- Review console logs for completeness
- Validate directory structure
- Confirm artifact sizes reasonable (<10MB per test)

---

## Definition of Done

- [ ] All acceptance criteria met for all stories
- [ ] All unit tests passing (>70% coverage)
- [ ] All integration tests passing
- [ ] Manual validation confirms meaningful evidence captured
- [ ] Code reviewed and meets style guidelines
- [ ] Documentation updated
- [ ] No critical bugs or P0 issues remaining
- [ ] Successfully captures evidence from 2+ diverse games

---

**Epic Status:** Ready for Sprint Planning
**Estimated Duration:** 1 Sprint (1 week)
**Previous Epic:** Epic 1 - Foundation & Browser Automation Core
**Next Epic:** Epic 3 - AI-Powered Evaluation Engine
