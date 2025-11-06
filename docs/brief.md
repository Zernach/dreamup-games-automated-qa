# Project Brief: DreamUp Browser Game QA Pipeline

**Version:** 1.3
**Date:** November 3, 2025
**Timeline:** 3-5 days core implementation + optional stretch features

---

## Executive Summary

DreamUp Browser Game QA Pipeline is an AI-powered autonomous testing system that simulates user interactions with browser games, captures visual evidence, and evaluates playability metrics. This prototype will enable DreamUp's game-building agent to perform automated self-improvement by providing structured feedback on generated games. The system accepts any web-hosted game URL and produces actionable quality assessment reports with 80%+ accuracy.

---

## Problem Statement

DreamUp, a general AI game generator born from Gauntlet's first 24-hour hackathon, currently lacks an automated mechanism to evaluate the quality and playability of its generated games. Manual QA is time-consuming, inconsistent, and doesn't scale with rapid iteration cycles needed for AI-driven game generation.

**Current Pain Points:**
- No feedback loop for game-building agent to learn from its outputs
- Unable to identify common failure modes (crashes, slow loads, unresponsive controls) systematically
- Lack of visual evidence and structured reports makes debugging difficult
- Cannot validate games work across diverse interaction patterns

**Impact:**
Without automated QA, DreamUp cannot achieve autonomous self-improvement, limiting its potential to become a production-ready game generation platform.

**Urgency:**
This foundational capability must be established before scaling game generation efforts, making it a critical dependency for future development.

---

## Proposed Solution

Build an AI agent that combines browser automation, evidence capture, and LLM-powered evaluation to autonomously test browser games. The system will:

**Core Approach:**
1. **Intelligent Browser Automation** - Navigate games by detecting UI patterns, controls, and interaction points
2. **Evidence Collection** - Capture screenshots, console logs, and error messages at key moments
3. **AI-Powered Analysis** - Use LLMs to evaluate playability from visual and log evidence
4. **Structured Reporting** - Output machine-readable JSON with scores, issues, and supporting artifacts

**Key Differentiators:**
- Works with any browser game URL (no game-specific customization required)
- Leverages game engine context (Scene Stack, Input System) for informed testing strategies
- Provides both visual evidence and semantic evaluation
- Designed for Railway server execution (containerized deployment)

**Why This Will Succeed:**
By combining traditional browser automation with AI evaluation, the system can adapt to diverse game types while maintaining structured output suitable for automated feedback loops.

---

## Target Users

### Primary User Segment: DreamUp Game-Building Agent

**Profile:**
AI agent system running on Railway server, generating browser games and requiring quality feedback

**Current Behavior:**
Generates games without systematic validation, relying on human spot-checking

**Specific Needs:**
- Programmatic test invocation from Railway server environment
- Structured JSON output for parsing and learning
- Fast execution (fits within Railway server timeout constraints)
- Clear pass/fail signals with confidence scores

**Goals:**
Enable automated self-improvement through structured feedback on generated outputs

### Secondary User Segment: DreamUp Development Team

**Profile:**
Engineers and product developers working on game generation capabilities

**Current Behavior:**
Manually test generated games, debug issues reactively

**Specific Needs:**
- Quick validation during development cycles
- Visual evidence (screenshots) for debugging
- Clear issue descriptions to guide fixes
- CLI interface for local testing

**Goals:**
Faster iteration on game-building agent improvements with reliable quality signals

---

## Goals & Success Metrics

### Business Objectives
- **Enable Automated Self-Improvement:** Game-building agent can test 100% of generated games and incorporate feedback into future generations
- **Reduce Manual QA Time:** Cut manual testing time by 70% within first month of deployment
- **Demonstrate Production Readiness:** Showcase AI agent architecture suitable for integration with DreamUp production systems

### User Success Metrics
- **Game-Building Agent:** Receives actionable feedback on 95%+ of generated games
- **Development Team:** Reduces debugging time for game issues by 50%
- **Test Coverage:** Successfully evaluates diverse game types (2D/3D, Canvas/UI-based, various input schemes)

### Key Performance Indicators (KPIs)
- **Test Success Rate:** Successfully tests 3+ diverse browser games end-to-end (baseline metric)
- **Assessment Accuracy:** 80%+ accuracy on playability assessment compared to human evaluation
- **Reliability:** Handles common failure modes gracefully with <5% unhandled crash rate
- **Execution Time:** Completes full test cycle in <2 minutes per game

---

## MVP Scope

### Core Features (Must Have)

- **Browser Automation Agent:** Load game from URL, detect UI patterns (start buttons, menus, game over screens), walk through game based on discovered controls, implement timeouts and retry logic
- **Evidence Capture System:** Take 3-5 timestamped screenshots per test session, save artifacts to structured output directory, capture console logs and error messages
- **AI Evaluation Engine:** Use LLM to analyze screenshots and logs, assess successful load, responsive controls, and stability, output structured JSON with pass/fail, confidence scores, and issue descriptions
- **Railway-Compatible Execution:** TypeScript file runnable with `bun run qa.ts` or `npx tsx qa.ts`, accepts game URL as input, outputs structured JSON: `{status, playability_score, issues[], screenshots[], timestamp}`
- **Clean Codebase:** Documented, modular architecture suitable for extension and integration

### Out of Scope for MVP

- Multiplayer or network-dependent games
- Mobile browser emulation
- Security/performance testing beyond basic load time
- Integration with DreamUp production systems (prototype only)
- Advanced analytics (FPS monitoring, accessibility checks)
- Web dashboard or UI for viewing results

### MVP Success Criteria

**The MVP is successful when:**
1. It autonomously tests 3+ diverse browser games without manual intervention
2. It produces structured reports with 80%+ accuracy on playability assessment (validated against human evaluation)
3. It handles common failure modes (crashes, slow loads, rendering issues) gracefully without crashing
4. The codebase is clean, documented, and modular enough for another developer to extend
5. It can be invoked from a Railway server environment

---

## Post-MVP Vision

### Phase 2 Features

**Enhanced Evidence Capture:**
- GIF recording of gameplay sessions for visual playback
- Frame-by-frame analysis for detecting visual glitches

**Batch Testing Capabilities:**
- Sequential testing of multiple game URLs
- Aggregated reporting across game portfolio
- Comparative analysis (identify common failure patterns)

**Game Engine Integration:**
- Accept input schema prompts (JavaScript snippet or semantic description)
- Tailor testing strategy based on game's declared Scene Stack and Input System configuration
- Validate game-specific requirements

### Long-term Vision

Transform the QA pipeline into a comprehensive game quality platform that:
- Provides continuous validation during game development
- Offers detailed analytics on player experience metrics (FPS, load times, input responsiveness)
- Supports multi-modal testing (desktop browsers, mobile emulation, different devices)
- Integrates deeply with DreamUp's production game generation workflow

### Expansion Opportunities

- **Advanced Metrics:** FPS monitoring, load time analysis, accessibility checks
- **Web Dashboard:** Simple UI for viewing test results, history, and trends
- **Multi-Agent Testing:** Simulate multiple concurrent players for load testing
- **Regression Testing:** Automatically re-test games after engine updates
- **Quality Scoring Models:** ML models trained on historical test data to predict game quality

---

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Web browsers (Chrome/Chromium primary)
- **Browser/OS Support:** Headless browser execution, compatible with Railway server (lightweight Chrome/Puppeteer)
- **Performance Requirements:** Complete test cycle in <2 minutes

### Technology Preferences

- **Frontend:** N/A (testing tool, not user-facing application)
- **Backend:** TypeScript/Node.js, runnable with Bun or TSX
- **Browser Automation:** Puppeteer or Playwright (Railway-compatible)
- **LLM Integration:** OpenAI API or Anthropic Claude API for screenshot/log analysis
- **Database:** N/A for MVP (file-based artifact storage)
- **Hosting/Infrastructure:** Railway server (target deployment), local execution for development

### Architecture Considerations

- **Repository Structure:** Monorepo or standalone repo (recommend standalone for prototype)
- **Service Architecture:** Single TypeScript module with clear separation: browser controller, evidence capturer, AI evaluator, report generator
- **Integration Requirements:**
  - Must accept game URL as CLI argument or programmatic parameter
  - Must output structured JSON to stdout or file
  - Must save screenshots/logs to configurable output directory
- **Security/Compliance:**
  - Ensure LLM API keys are passed securely (environment variables)
  - No sensitive data in screenshots or logs
  - Sandboxed browser execution (no access to filesystem beyond output directory)

### Game Engine Context Integration

**Scene Stack Awareness:**
The testing agent should recognize scene types (Canvas2D, Canvas3D, UI, Composite) and adjust interaction strategies accordingly. For example:
- Canvas scenes: Look for game rendering and physics-based interactions
- UI scenes: Detect DOM elements and standard web controls
- Composite scenes: Validate HUD overlays and pause menu suspension behavior

**Input System Detection:**
The agent should discover input mappings by:
- Inspecting game code/documentation for Action and Axis bindings
- Testing common input patterns (WASD, arrows, mouse clicks, touch events)
- Accepting optional input schema prompts (JavaScript snippet for first-party games, semantic description for third-party games)

This context allows the QA agent to make informed decisions about what controls to attempt and what success looks like.

---

## Constraints & Assumptions

### Constraints

- **Budget:** Internal project, no dedicated budget (use existing LLM API credits)
- **Timeline:** 3-5 days for core MVP implementation
- **Resources:** Single developer (potentially with occasional review/pairing)
- **Technical:**
  - Must work within Railway server constraints (execution time, memory)
  - Limited to browser games (no native app testing)
  - Dependent on LLM API availability and rate limits

### Key Assumptions

- DreamUp-generated games are web-hosted and accessible via URL
- Games follow common browser game patterns (start button, controls, game over state)
- LLMs can accurately assess playability from 3-5 screenshots and console logs
- Railway server environment can run headless Chrome/Puppeteer
- 80% accuracy threshold is acceptable for initial feedback loop
- Manual validation dataset (human-evaluated games) will be available for accuracy testing

---

## Risks & Open Questions

### Key Risks

- **LLM Accuracy:** LLM-based evaluation may not reach 80% accuracy threshold, requiring fallback heuristics or hybrid approaches
- **Railway Compatibility:** Headless browser on Railway server provides consistent performance with containerized execution
- **Game Diversity:** Extreme edge cases (WebGL games with custom rendering, games without clear UI patterns) may fail silently or produce false positives
- **Rate Limits:** LLM API rate limits could bottleneck batch testing scenarios

### Open Questions

- What specific LLM model and prompt strategy will yield best evaluation accuracy?
- Should we use Puppeteer or Playwright? (Both work well on Railway with Docker support)
- How do we handle games that require specific input sequences (e.g., tutorial completion before gameplay)?
- What's the best format for input schema prompts to guide testing strategy?
- Should screenshot capture be time-based, event-based, or both?

### Areas Needing Further Research

- Railway-compatible headless browser options (size, performance)
- LLM vision model benchmarks for game screenshot analysis (GPT-4V vs Claude 3.5 Sonnet)
- Game engine input system introspection (can we programmatically read input mappings?)
- Optimal number of screenshots for accurate playability assessment (3? 5? 10?)

---

## Appendices

### A. Research Summary

**Game Engine Context:**
DreamUp's game engine uses a Scene Stack architecture with four scene types (Canvas2D, Canvas3D, UI, Composite). The Input System abstracts hardware inputs into Actions (discrete events) and Axes (continuous values), decoupling game logic from input sources. This abstraction enables the QA agent to query gameplay semantics rather than raw keyboard/mouse events.

**Input Schema Integration:**
The game-building agent already selects input schemas during game planning. By exposing this schema to the QA agent (as JavaScript snippet or semantic description), testing can be more targeted and effective.

### B. Stakeholder Input

**DreamUp Team Expectations:**
- Must demonstrate autonomous operation (minimal manual intervention)
- Should produce actionable feedback (specific issues, not just pass/fail)
- Needs to be extensible (easy to add new evaluation criteria)
- Must not block rapid prototyping pace (fast execution, clear documentation)

### C. References

- DreamUp Game Engine Documentation (Scene Stack, Input System)
- Playwright Railway Docker: https://playwright.dev/docs/docker
- Railway Deployment Guide: https://docs.railway.app/
- LLM Vision APIs: OpenAI GPT-4V, Anthropic Claude 3.5 Sonnet

---

## Next Steps

### Immediate Actions

1. **Set up development environment:** Initialize TypeScript project with Puppeteer/Playwright, configure for Bun/TSX execution
2. **Implement browser automation:** Create game loader with basic UI detection (start button, clickable elements)
3. **Build evidence capture system:** Screenshot timing logic, console log collection, artifact saving
4. **Integrate LLM evaluation:** Prompt engineering for screenshot analysis, JSON output parsing
5. **Test with diverse games:** Validate against 3+ games with different characteristics (2D platformer, 3D shooter, puzzle game)
6. **Document architecture:** README with setup instructions, code documentation, example outputs

### PM Handoff

This Project Brief provides the full context for **DreamUp Browser Game QA Pipeline**. The next step is to create a detailed PRD (Product Requirements Document) that translates this strategic vision into specific, implementable requirements. Please review this brief thoroughly and work with the team to develop the PRD section by section, clarifying any ambiguities and suggesting improvements where needed.

---

**Document Status:** Draft v1.0
**Next Review:** Ready for PRD generation
**Owner:** DreamUp Engineering Team
