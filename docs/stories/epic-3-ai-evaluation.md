# Epic 3: AI-Powered Evaluation Engine

**Epic ID:** EPIC-3
**Status:** Not Started
**Priority:** P0 (Critical)
**Target Sprint:** Sprint 3
**Estimated Story Points:** 24 points

---

## Epic Goal

Integrate LLM vision APIs to analyze captured screenshots and logs, producing intelligent playability assessments with confidence scores and detailed issue identification. This epic transforms raw evidence into actionable feedback by leveraging AI to evaluate visual rendering, interaction responsiveness, and overall game quality in a way that mimics human QA judgment.

---

## Business Value

- Delivers the core differentiator: AI-powered quality assessment
- Enables autonomous evaluation without human intervention
- Provides actionable feedback for game-building agent learning
- Achieves 80%+ accuracy target for playability assessment
- Makes the QA pipeline genuinely intelligent and scalable

---

## Success Criteria

- [ ] LLM successfully analyzes screenshots and logs
- [ ] Playability scores calculated with confidence ratings
- [ ] Issues detected and categorized by severity and type
- [ ] Evaluation accuracy reaches 80%+ vs human baseline (validated on 3+ games)
- [ ] Complete evaluation pipeline runs end-to-end in <30 seconds
- [ ] Structured JSON output suitable for automated consumption

---

## Dependencies

- **EPIC-2:** Evidence capture must be complete to provide data for AI evaluation

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| LLM accuracy below 80% threshold | Critical | Iterate on prompt engineering, try multiple models |
| LLM API rate limits block testing | High | Implement exponential backoff, consider caching |
| API costs exceed budget | Medium | Monitor costs, optimize screenshot count, use cost-effective models |
| Prompt engineering takes longer than expected | Medium | Start with simple prompts, iterate based on results |

---

## User Stories

### Story 3.1: LLM API Client Configuration
**Story Points:** 3 | **Priority:** P0

As a **developer**,
I want **a reusable LLM API client with proper authentication and error handling**,
so that **I can reliably send evidence to AI models for analysis**.

**Acceptance Criteria:**

1. LLMClient class created in src/modules/evaluator/llm-client.ts
2. Supports Anthropic Claude 3.5 Sonnet API with vision capabilities
3. API key loaded from environment variable (ANTHROPIC_API_KEY)
4. Validates API key exists before making requests (fail fast with clear error message)
5. Implements request method with retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
6. Handles rate limiting (429 status) with appropriate backoff and retry
7. Handles timeout errors (configurable timeout: 60 seconds per request)
8. Parses API responses and extracts JSON content from LLM output
9. Returns structured LLMResponse object: success: boolean, content: any, error?: string, usage: {input_tokens, output_tokens}
10. Unit tests validate error handling using mocked API responses (rate limit, timeout, invalid JSON)

**Technical Notes:**
- Use @anthropic-ai/sdk official package
- Implement proper TypeScript types for API responses
- Consider fallback to OpenAI GPT-4V if Claude unavailable
- Log API usage metrics for cost monitoring

---

### Story 3.2: Screenshot Analysis Prompt Engineering
**Story Points:** 5 | **Priority:** P0

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

**Technical Notes:**
- Use few-shot examples in prompt for better consistency
- Include explicit instructions for JSON output format
- Test prompt with 5+ diverse game screenshots
- Version prompts (prompt_v1, prompt_v2) for A/B testing

---

### Story 3.3: Console Log Analysis Integration
**Story Points:** 3 | **Priority:** P0

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

**Technical Notes:**
- Combine visual and log analysis into single API call (reduce cost)
- Prioritize error logs (send all errors, sample warnings)
- Include context about typical browser game error patterns

---

### Story 3.4: Playability Score Calculation
**Story Points:** 3 | **Priority:** P0

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

**Technical Notes:**
- Make formula weights configurable via constants
- Document formula rationale in code comments
- Consider logarithmic penalty for multiple critical errors
- Provide score breakdown in report for transparency

---

### Story 3.5: Issue Detection & Categorization
**Story Points:** 5 | **Priority:** P0

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

**Technical Notes:**
- Use fuzzy matching for issue deduplication (Levenshtein distance)
- Link issues to supporting evidence (screenshot filenames, log line numbers)
- Generate unique issue IDs for tracking

---

### Story 3.6: Confidence Scoring & Uncertainty Handling
**Story Points:** 2 | **Priority:** P1

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

**Technical Notes:**
- Document confidence thresholds and their meanings
- Consider adding confidence visualization (e.g., stars: ★★★★★)
- Log confidence breakdown for debugging

---

### Story 3.7: End-to-End AI Evaluation Pipeline
**Story Points:** 3 | **Priority:** P0

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

**Technical Notes:**
- Implement circuit breaker pattern for LLM API (fail fast if multiple failures)
- Cache LLM responses for development/testing (optional)
- Provide fallback heuristics: blank screenshot = 0 score, JS errors = critical issue
- Measure and log LLM API latency

---

## Testing Strategy

### Unit Tests
- LLM client error handling with mocked responses
- Prompt generation with various evidence sets
- Score calculation with edge cases
- Issue categorization and deduplication
- Confidence calculation with various quality factors

### Integration Tests
- End-to-end evaluation with real LLM API calls (use test API keys)
- Evaluation accuracy testing with known good/bad games
- Performance testing (30 second target)
- Fallback behavior when LLM unavailable

### Manual Validation
- Compare AI assessments to human evaluations on 3+ games
- Validate 80%+ accuracy threshold
- Review issue detection precision and recall
- Confirm confidence scores correlate with actual accuracy

---

## Definition of Done

- [ ] All acceptance criteria met for all stories
- [ ] All unit tests passing (>70% coverage)
- [ ] All integration tests passing
- [ ] Accuracy validation: 80%+ vs human baseline on 3+ games
- [ ] Code reviewed and meets style guidelines
- [ ] Documentation updated (prompt engineering notes, API usage)
- [ ] No critical bugs or P0 issues remaining
- [ ] Performance target met (<30 seconds evaluation time)

---

## Accuracy Validation Plan

### Validation Games (Diverse Sample)
1. **Simple 2D Platformer:** Clear UI, obvious functionality
2. **3D First-Person Game:** Complex rendering, potential performance issues
3. **Puzzle/Card Game:** DOM-based UI, minimal canvas

### Human Baseline
- 2-3 human evaluators independently assess each game
- Score on same 0-100 scale with issue identification
- Calculate inter-rater reliability
- Define ±15 points as acceptable variance

### Success Metric
- AI scores within ±15 points of human median for 2+ out of 3 games (67%+ accuracy)
- Critical issues detected by AI match human-identified critical issues (100% recall)
- No false critical issues flagged by AI (high precision)

---

**Epic Status:** Ready for Sprint Planning
**Estimated Duration:** 1 Sprint (1 week, may extend 2-3 days for prompt tuning)
**Previous Epic:** Epic 2 - Evidence Capture & Artifact Management
**Next Epic:** Epic 4 - Railway Deployment & Production Readiness
